import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// json data limit
app.use(express.json({limit:"16kb"}))

// to get data from url
app.use(express.urlencoded({extended:true, limit:"16kb"}))
// t serves static files and is based on serve-static.
app.use(express.static("public"))

app.use(cookieParser())

// routes import

import userRoute from "./routes/user.routes.js"

// routes declaration

app.use("/api/v1/users", userRoute)

// http://localhost:8000/api/v1/users/register

export{app}