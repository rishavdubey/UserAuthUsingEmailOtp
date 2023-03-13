const otpGenerator=require('otp-generator');

module.exports.GenerateOtp = ()=>{
    const otp =otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets:false });
    return otp;
}