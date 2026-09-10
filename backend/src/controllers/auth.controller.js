import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

function getUserData(user){
    return {
        id:user._id,
        name:user.name,
        email:user.email,
        role:user.role
    }
}

function setTokenCookie(res,user){
    const token=jwt.sign({id:user._id},config.JWT_SECRET,{expiresIn:"7d"});
    res.cookie("token",token,{
        httpOnly:true,
        secure:config.NODE_ENV==="production",
        sameSite:config.NODE_ENV==="production"?"none":"lax",
        maxAge:7*24*60*60*1000
    });
}

export async function register(req,res){
    const {name,email,password,role}=req.body;
    if(!name?.trim() || !email?.trim() || !password){
        return res.status(400).json({message:"Name, email and password are required"});
    }
    if(!["interviewer","candidate"].includes(role)){
        return res.status(400).json({message:"Role must be interviewer or candidate"});
    }
    if(password.length<6){
        return res.status(400).json({message:"Password must be at least 6 characters"});
    }

    const normalizedEmail=email.trim().toLowerCase();
    const isAlreadyRegistered=await userModel.findOne({email:normalizedEmail});
    if(isAlreadyRegistered){
        return res.status(409).json({message:"Email already exists"});
    }

    const hashedPassword=await bcrypt.hash(password,10);
    const user=await userModel.create({
        name:name.trim(),
        email:normalizedEmail,
        password:hashedPassword,
        role
    });

    setTokenCookie(res,user);
    res.status(201).json({
        message:"User registered successfully",
        user:getUserData(user)
    });
}

export async function login(req,res){
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({message:"Email and password are required"});
    }

    const user=await userModel.findOne({email:email.trim().toLowerCase()});
    if(!user){
        return res.status(401).json({message:"Invalid email or password"});
    }

    const isPasswordValid=await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(401).json({message:"Invalid email or password"});
    }

    setTokenCookie(res,user);
    res.status(200).json({
        message:"Logged in successfully",
        user:getUserData(user)
    });
}

export async function logout(req,res){
    res.clearCookie("token",{
        httpOnly:true,
        secure:config.NODE_ENV==="production",
        sameSite:config.NODE_ENV==="production"?"none":"lax"
    });
    res.status(200).json({message:"Logged out successfully"});
}

export async function getMe(req,res){
    res.status(200).json({user:getUserData(req.user)});
}
