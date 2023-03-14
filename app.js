const express= require('express');
const app=express();
const morgan = require('morgan');
require('dotenv').config();


// regular middleware
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// morgan middleware
app.use(morgan('tiny'));

// import router 
const user=require('./router/user');

// router middleware
app.use('/user',user);

module.exports = app;
