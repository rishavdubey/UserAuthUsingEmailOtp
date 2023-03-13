const app= require('./app');
require('dotenv').config();
const connectWthDb=require('./config/db');

// connect with database 
connectWthDb();

app.get("/", async(req,res)=> {
    res.status(200).json({
        success: true,
        message: "Hello from Rishav ---- test ----"
    })

})

app.listen(process.env.PORT, ()=> console.log(`Server is start at PORT ${process.env.PORT}...`));
