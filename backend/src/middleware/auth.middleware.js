import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

export async function protect(req,res,next){
    const token=req.cookies.token;
    if(!token){
        return res.status(401).json({message:"Authentication required"});
    }

    try{
        const decoded=jwt.verify(token,config.JWT_SECRET);
        const user=await userModel.findById(decoded.id).select("name email role");
        if(!user){
            return res.status(401).json({message:"Invalid authentication token"});
        }

        req.user=user;
        next();
    }catch(error){
        return res.status(401).json({message:"Invalid authentication token"});
    }
}

