import dotenv from "dotenv"
import connectDB from "./db/db.js";

dotenv.config({
    path:"./env"
})


connectDB()
.then(()=>{
    
})
.catch((err)=>{
    console.log("MONGO DB connection failed !!!");
    
})