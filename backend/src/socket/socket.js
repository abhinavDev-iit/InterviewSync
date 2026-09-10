import {Server} from "socket.io";
import {parseCookie} from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import roomModel from "../models/room.model.js";

function canAccessRoom(room,userId){
    return room.interviewer.equals(userId) || room.candidate?.equals(userId);
}

function setupSocket(httpServer){
    const io=new Server(httpServer,{
        cors:{
            origin:config.CLIENT_URL,
            credentials:true
        }
    });

    io.use(async(socket,next)=>{
        const cookies=parseCookie(socket.request.headers.cookie || "");
        if(!cookies.token){
            return next(new Error("Authentication required"));
        }

        try{
            const decoded=jwt.verify(cookies.token,config.JWT_SECRET);
            const user=await userModel.findById(decoded.id).select("name email role");
            if(!user){
                return next(new Error("Invalid authentication token"));
            }

            socket.user=user;
            next();
        }catch(error){
            next(new Error("Invalid authentication token"));
        }
    });

    io.on("connection",socket=>{
        socket.on("join-room",async({roomId}={},done=()=>{})=>{
            try{
                if(!mongoose.isValidObjectId(roomId)){
                    return done({ok:false,message:"Room not found"});
                }

                const room=await roomModel.findById(roomId);
                if(!room || !canAccessRoom(room,socket.user._id)){
                    return done({ok:false,message:"You cannot access this room"});
                }

                await socket.join(roomId);
                socket.to(roomId).emit("user-joined",{
                    user:{id:socket.user._id,name:socket.user.name,role:socket.user.role}
                });
                done({ok:true,currentCode:room.currentCode});
            }catch(error){
                done({ok:false,message:"Could not join room"});
            }
        });

        socket.on("code-change",async({roomId,code}={},done=()=>{})=>{
            try{
                if(!mongoose.isValidObjectId(roomId) || typeof code!=="string"){
                    return done({ok:false,message:"Invalid code update"});
                }

                const room=await roomModel.findById(roomId);
                const isCandidate=room?.candidate?.equals(socket.user._id);
                if(!room || !isCandidate || room.status==="completed" || !socket.rooms.has(roomId)){
                    return done({ok:false,message:"Only the room candidate can edit code"});
                }

                socket.to(roomId).emit("code-update",{roomId,code});
                done({ok:true});
            }catch(error){
                done({ok:false,message:"Could not send code update"});
            }
        });

        socket.on("disconnecting",()=>{
            for(const roomId of socket.rooms){
                if(roomId!==socket.id){
                    socket.to(roomId).emit("user-left",{
                        user:{id:socket.user._id,name:socket.user.name,role:socket.user.role}
                    });
                }
            }
        });
    });

    return io;
}

export default setupSocket;
