import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/config.js";

const app=express();

app.use(cors({
    origin:config.CLIENT_URL,
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health",(req,res)=>{
    res.status(200).json({message:"InterviewSync API is running"});
});

app.use((err,req,res,next)=>{
    console.error(err);
    res.status(500).json({message:"Something went wrong"});
});

export default app;

