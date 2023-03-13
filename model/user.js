const mongoose = require('mongoose');
const jwt =require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: [true, 'Please provide a name'],
        maxlength: [40, 'Name should be under 40 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        validate: [validator.isEmail, 'Please enter email in correct format'],
        unique: true
    },

    otp:{
        type:Number,
        max:[999999, 'OTP must be length of 6'],

    },
    otpCreationTime: {
        type:Date,
    },

    otpWrongAttempts:{
        type:Number,
        default:0,

    },

    otpWrongLimitExceeds:{
        type: Date,

    },

    createdAt: {
        type: Date,
        default: Date.now
    }

})

// create and return jwt token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
};

module.exports = mongoose.model('User',userSchema);