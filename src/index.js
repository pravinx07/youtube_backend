import dotenv from "dotenv"
import connectDB from "./db/db.js";
import { app } from "./app.js";


// get env variable
dotenv.config({
    path:"./.env"
})

// call function connectDB() to connect database
connectDB()
.then(()=>{  
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`Server is running at Port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed !!!");
    
})