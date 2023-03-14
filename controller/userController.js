const mailHelper = require("../config/emailHelper");
const { GenerateOtp } = require("../utils/otpGenerator");
const { SingUpEmail } = require("../utils/SignUpEmail");
const {LogInEmail} = require('../utils/LogInEmail')
const User = require("../model/user");
const BigPromise = require("../middleware/bigPromise");
const CustomError = require("../utils/customError");
const validator= require('validator');


exports.dummyUser = BigPromise(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Dummy user test",
  });
});


exports.signUpOtp = BigPromise(async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  if(!(validator.isEmail(email))){
    return  next(new CustomError("Email must be passed correct in body for signUp purpose",400))
  }
  
  // console.log(name, email);
  const user = await User.findOne({email:email});
  // console.log(user);
  if(user){
    return next(new CustomError("Email is already is in Use Kindly LogIn",400));
  }

  const otp= GenerateOtp();
  const mtxt= SingUpEmail(otp);
  // console.log(mtxt);

  try {
    await mailHelper({
      email: email,
      subject: "OTP FOR SINGUP",
      message:mtxt,
    });
  } catch (error) {
    console.log(error);
    return next(new CustomError(error.message,500));
    
  }

  const otpCreationTime=new Date();
  await User.create({
    name,
    email, 
    otp,
    otpCreationTime,
  });
  res.status(200).json({
    message:`OTP sent Successfully on Email Kindly Use it For LogIn within ${process.env.OTP_VALID_TIME}.`
  })

});

exports.otpCreation = BigPromise(async(req,res,next) =>{
  const {email} = req.body;
  if(!email || !(validator.isEmail(email))){
    return next(new CustomError("Email must be passed and it should be in correct format for OTP Generation", 400))
  }

  const user = await User.findOne({email:email});
  // console.log(user);

  if(!user){
    return next(new CustomError(`Email not matched in our Database Kindly SignUp with ${email}`,400))
  }
  
  const timeDurationforNewAttempt = ((new Date()) - user.otpWrongLimitExceeds )/60000 

  if(timeDurationforNewAttempt< process.env.BLOCK_TIME){
    return next(new CustomError(`You have crossed your attempt to logIn. Kindly come back after ${Math.ceil(process.env.BLOCK_TIME - timeDurationforNewAttempt)} minutes for new OTP`,400))
  }

  const timeDuration = ((new Date()) - user.otpCreationTime)/60000;
  // console.log(timeDuration);

  if (
    user &&
    user.otpCreationTime &&
    timeDuration<process.env.OTP_GENERATE_TIME_LIMIT
  ) {
    return res
      .status(429)
      .json({
        message: `Please wait for ${process.env.OTP_GENERATE_TIME_LIMIT} minute before making another OTP request.`,
      });
  } 

  const otp=GenerateOtp();

  const mtxt=LogInEmail(otp);
  try {
    await mailHelper({
      email: email,
      subject: "OTP FOR LOGIN",
      message:mtxt,
    });
  } catch (error) {
    console.log(error);
    return next(new CustomError(error.message,500));
    
  }

  user.otp=otp;
  user.otpCreationTime =new Date();
  user.otpWrongAttempts=0;
  user.otpWrongLimitExceeds=undefined;

  // console.log(otp);
  await user.save();

  res.status(200).json({
    success:true,
    message: "OTP sent SuccessFully",
  })

})

exports.logIn= BigPromise(async (req,res,next)=>{
  const {email, otp} = req.body;
  if(!email || !(validator.isEmail(email)) || !otp){
    return next(new CustomError("Correct format email and OTP required for logIn",400))
  }

  const user = await User.findOne({email:email});

  if(!user){
    return next(new CustomError("Email is not matched in our Database Kindly SignUp First",400))
  }

  const timeDurationforNewAttempt = ((new Date()) - user.otpWrongLimitExceeds )/60000 

  if(timeDurationforNewAttempt< process.env.BLOCK_TIME){
   return  next(new CustomError(`Please attempt logIn after ${Math.round(process.env.BLOCK_TIME - timeDurationforNewAttempt)} minutes`,400))
  }
  
  if(user.otp!==Number(otp) && user.otpWrongAttempts>4){
    user.otpWrongLimitExceeds=new Date();
    user.otpWrongAttempts =0;
    await user.save();
    return next(new CustomError(`Crossed your limit Please attemt again after ${process.env.BLOCK_TIME} minutes`,400))  
  }
  if(user.otp!==Number(otp)){
    const attempt= user.otpWrongAttempts + 1;
    user.otpWrongAttempts=attempt;
    await user.save();
    return next(new CustomError(`You have provided worng OTP your wrong attempt counts equals to ${attempt}`))
  }
  
  const timeDuration = ((new Date()) - user.otpCreationTime)/60000 
  if(timeDuration>=process.env.OTP_VALID_TIME) {
    return next(new CustomError(`Please use the OTP within the time period ${process.env.OTP_VALID_TIME} minutes. Kindly Generate New OTP and proceed further logIn`,400))
  }

  const token=user.getJwtToken();
  user.otp=undefined;
  user.otpCreationTime=undefined;
  user.otpWrongAttempts=0;

  await user.save();

  res.status(200).json({
    success: true,
    message:"LogIn SuccessFullY",
    token:token
  })

})
