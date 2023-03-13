const express=require('express');
const router= express.Router();

const {
 dummyUser,
 signUpOtp,
 logIn,
 otpCreation
}= require('../controller/userController');

router.route('/dummy').get(dummyUser);  
router.route('/signup').post(signUpOtp);
router.route('/login').post(logIn);
router.route('/generateotp').post(otpCreation);


module.exports= router;