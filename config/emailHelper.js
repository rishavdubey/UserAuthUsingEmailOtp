const nodemailer = require("nodemailer");

const mailHelper = async (options)=>{

    const transporter =  nodemailer.createTransport({
  
        host: process.env.SMTP_HOST, 
        port: process.env.SMTP_PORT,
  
        auth: {
          user: process.env.SMTP_USER, // generated sendinblue  user
          pass: process.env.SMTP_PASS, // generated sendinblue password
        },
       
    });
    
    const message = {
      from: "rishavdubeydev@gmail.com", // sender address
      to: options.email, // list of receivers
      subject: options.subject, // Subject line
      text: options.message, // plain text body
    
    }
    // / send mail with defined transport object
    await transporter.sendMail(message);
    
      
}

module.exports = mailHelper;