const express= require('express');
const app=express();
require('dotenv').config();


// regular middleware
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// import router 
const user=require('./router/user');

// router middleware
app.use('/user',user);

module.exports = app;
