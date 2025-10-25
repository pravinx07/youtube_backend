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

export{app}