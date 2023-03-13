const mailHelper = require("../config/emailHelper");
const { GenerateOtp } = require("../utils/otpGenerator");
const { SingUpEmail } = require("../utils/SignUpEmail");
const {LogInEmail} = require('../utils/LogInEmail')
const User = require("../model/user");

exports.dummyUser =  async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Dummy user test",
  });
};

exports.forgotPassword = async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  console.log(name, email);

  // const message = `OTP for logIN please using within 5 minute   ${GenerateOtp()}`
  // const message = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  //   <div style="margin:50px auto;width:70%;padding:20px 0">
  //     <div style="border-bottom:1px solid #eee">
  //       <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Generic Developer </a>
  //     </div>
  //     <p style="font-size:1.1em">Hi,</p>
  //     <p>Thank you for taking assesment of Generic kind of Developer. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
  //     <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${GenerateOtp()}</h2>
  //     <p style="font-size:0.9em;">Best Regards,<br />Rishav</p>
  //     <hr style="border:none;border-top:1px solid #eee" />
  //     <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
  
  //     </div>
  //   </div>
  // </div>`;

  const otp= GenerateOtp();
  const mtxt= Emailtxt(otp);
  // console.log(mtxt);

  try {
    await mailHelper({
      email: email,
      subject: "OTP FOR LOGIN",
      message:mtxt,
    });
    res.status(200).json({
      succes: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.log(error);
    // user.forgotPasswordToken = undefined
    // user.forgotPasswordExpiry = undefined
    // await user.save({ validateBeforeSave: false })
    // return next(new CustomError(error.message, 500))
  }
  res.status(200).json({
    success:true,
    mtxt
  }); 
};

exports.signUpOtp = (async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  if(!email){
    return res.status(400).json({
      message:"Email must be passed in body for signUp purpose"
    })
  }
  // console.log(name, email);
  const user = await User.findOne({email:email});
  // console.log(user);
  if(user){
    return res.status(400).json({
      message:"Email is already is in Use Kindly LogIn"
    })
  }

  if (
    user &&
    user.otpCreationTime &&
    (new Date() - user.otpCreationTime) / 1000 < 60
  ) {
    return res
      .status(429)
      .json({
        message: "Please wait for 1 minute before making another request for OTP.",
      });
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
    
  }

  const otpCreationTime=new Date();
  await User.create({
    name,
    email, 
    otp,
    otpCreationTime,
  });
  res.status(200).json({
    message:`OTP sent Successfully on Email.`
  })

});

exports.otpCreation = async(req,res,next) =>{
  const {email} = req.body;
  if(!email){
    return res.status(400).json({
      message:"Email required for logIn"
    })
  }

  const user = await User.findOne({email:email});
  // console.log(user);

  if(!user){
    return res.status(400).json({
      message:`Email not matched in our Database Kindly SignUp with  ${email}`
    })
  }
  
  const timeDurationforNewAttempt = ((new Date()) - user.otpWrongLimitExceeds )/60000 

  if(timeDurationforNewAttempt< process.env.BLOCK_TIME){
   return  res.status(400).json({
      message:`You have crossed your attempt to logIn. Kindly come back after ${Math.ceil(process.env.BLOCK_TIME - timeDurationforNewAttempt)} minutes for new OTP`
    })
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

}

exports.logIn= (async (req,res,next)=>{
  const {email, otp} = req.body;
  if(!email || !otp){
    return res.status(400).json({
      message:"Email and OTP required for logIn"
    })
  }

  const user = await User.findOne({email:email});

  if(!user){
    return res.status(400).json({
      message:"Email is not matched in our Database Kindly SignUp"
    })
  }

  const timeDurationforNewAttempt = ((new Date()) - user.otpWrongLimitExceeds )/60000 

  if(timeDurationforNewAttempt< process.env.BLOCK_TIME){
   return  res.status(400).json({
      message:`Please attempt logIn after ${Math.round(process.env.BLOCK_TIME - timeDurationforNewAttempt)} minutes`
    })
  }
  
  if(user.otp!==otp && user.otpWrongAttempts>4){
    user.otpWrongLimitExceeds=new Date();
    user.otpWrongAttempts =0;
    await user.save();
    return res.status(400).json({
      message: `Crossed your limit Please attemt again after ${process.env.BLOCK_TIME} minutes`
    })   

  }
  if(user.otp!= otp){
    const attempt= user.otpWrongAttempts + 1;
    user.otpWrongAttempts=attempt;
    await user.save();
    return res.status(400).json({
      message:`You have provided worng OTP your wrong attempt counts equals to ${attempt}`
    })

  }
  
  const timeDuration = ((new Date()) - user.otpCreationTime)/60000 
  if(timeDuration>=process.env.OTP_VALID_TIME) {
    user.otp=undefined;
    user.otpCreationTime=undefined;
    await user.save();
    return res.status(400).json({
      message:`Please use the OTP within the time period ${process.env.OTP_VALID_TIME} minutes. Kindly Generate New OTP and proceed further logIn`
    })
  }

  const token=user.getJwtToken();
  user.otp=undefined;
  user.otpCreationTime=undefined;

  await user.save();

  res.status(200).json({
    success: true,
    token:token,
    message:"LogIn SuccessFullY"
  })

})
