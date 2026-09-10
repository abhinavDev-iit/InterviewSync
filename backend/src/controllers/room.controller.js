import mongoose from "mongoose";
import crypto from "crypto";
import roomModel from "../models/room.model.js";
import {executeCode} from "../services/execution.service.js";

function createRoomCode(){
    return crypto.randomBytes(4).toString("hex").slice(0,6).toUpperCase();
}

async function getUniqueRoomCode(){
    let roomCode;
    let roomExists=true;

    while(roomExists){
        roomCode=createRoomCode();
        roomExists=await roomModel.exists({roomCode});
    }

    return roomCode;
}

function populateRoom(query){
    return query
        .populate("interviewer","name email role")
        .populate("candidate","name email role");
}

export async function createRoom(req,res){
    if(req.user.role!=="interviewer"){
        return res.status(403).json({message:"Only interviewers can create rooms"});
    }

    const {title,problemStatement,language="javascript",starterCode=""}=req.body;
    if(!title?.trim() || !problemStatement?.trim()){
        return res.status(400).json({message:"Title and problem statement are required"});
    }
    if(!["javascript","cpp","python"].includes(language)){
        return res.status(400).json({message:"Unsupported language"});
    }

    const roomCode=await getUniqueRoomCode();
    const room=await roomModel.create({
        roomCode,
        interviewer:req.user._id,
        title:title.trim(),
        problemStatement:problemStatement.trim(),
        language,
        starterCode,
        currentCode:starterCode
    });

    await room.populate([
        {path:"interviewer",select:"name email role"},
        {path:"candidate",select:"name email role"}
    ]);
    res.status(201).json({message:"Interview room created",room});
}

export async function getRooms(req,res){
    const filter=req.user.role==="interviewer"
        ? {interviewer:req.user._id}
        : {candidate:req.user._id};
    const rooms=await populateRoom(roomModel.find(filter).sort({createdAt:-1}));

    res.status(200).json({rooms});
}

export async function getRoom(req,res){
    if(!mongoose.isValidObjectId(req.params.roomId)){
        return res.status(404).json({message:"Room not found"});
    }

    const room=await populateRoom(roomModel.findById(req.params.roomId));
    if(!room){
        return res.status(404).json({message:"Room not found"});
    }

    const isInterviewer=room.interviewer._id.equals(req.user._id);
    const isCandidate=room.candidate?._id.equals(req.user._id);
    if(!isInterviewer && !isCandidate){
        return res.status(403).json({message:"You cannot access this room"});
    }

    res.status(200).json({room});
}

export async function joinRoom(req,res){
    if(req.user.role!=="candidate"){
        return res.status(403).json({message:"Only candidates can join rooms"});
    }

    const roomCode=req.body.roomCode?.trim().toUpperCase();
    if(!roomCode){
        return res.status(400).json({message:"Room code is required"});
    }

    const room=await roomModel.findOne({roomCode});
    if(!room){
        return res.status(404).json({message:"Invalid room code"});
    }
    if(room.status==="completed"){
        return res.status(409).json({message:"This interview is completed"});
    }
    if(room.candidate && !room.candidate.equals(req.user._id)){
        return res.status(409).json({message:"This room already has a candidate"});
    }

    if(!room.candidate){
        room.candidate=req.user._id;
        room.status="active";
        await room.save();
    }

    await room.populate([
        {path:"interviewer",select:"name email role"},
        {path:"candidate",select:"name email role"}
    ]);
    res.status(200).json({message:"Interview room joined",room});
}

export async function completeRoom(req,res){
    if(!mongoose.isValidObjectId(req.params.roomId)){
        return res.status(404).json({message:"Room not found"});
    }

    const room=await roomModel.findById(req.params.roomId);
    if(!room){
        return res.status(404).json({message:"Room not found"});
    }
    if(req.user.role!=="interviewer" || !room.interviewer.equals(req.user._id)){
        return res.status(403).json({message:"Only the room interviewer can complete it"});
    }

    room.status="completed";
    await room.save();
    await room.populate([
        {path:"interviewer",select:"name email role"},
        {path:"candidate",select:"name email role"}
    ]);
    res.status(200).json({message:"Interview completed",room});
}

export async function saveCode(req,res){
    if(!mongoose.isValidObjectId(req.params.roomId)){
        return res.status(404).json({message:"Room not found"});
    }
    if(typeof req.body.code!=="string"){
        return res.status(400).json({message:"Code is required"});
    }

    const room=await roomModel.findById(req.params.roomId);
    if(!room){
        return res.status(404).json({message:"Room not found"});
    }
    if(!room.candidate?.equals(req.user._id) || room.status==="completed"){
        return res.status(403).json({message:"Only the room candidate can save code"});
    }

    room.currentCode=req.body.code;
    await room.save();
    res.status(200).json({message:"Code saved",currentCode:room.currentCode});
}

export async function runCode(req,res){
    if(!mongoose.isValidObjectId(req.params.roomId)){
        return res.status(404).json({message:"Room not found"});
    }

    const room=await roomModel.findById(req.params.roomId);
    if(!room){
        return res.status(404).json({message:"Room not found"});
    }

    const isMember=room.interviewer.equals(req.user._id) || room.candidate?.equals(req.user._id);
    if(!isMember){
        return res.status(403).json({message:"You cannot run code in this room"});
    }

    const {language=room.language,code,stdin=""}=req.body;
    if(!["javascript","cpp","python"].includes(language)){
        return res.status(400).json({message:"Unsupported language"});
    }
    if(typeof code!=="string" || !code.trim()){
        return res.status(400).json({message:"Code is required"});
    }
    if(code.length>50000 || String(stdin).length>10000){
        return res.status(400).json({message:"Code or input is too large"});
    }

    try{
        const result=await executeCode(language,code,String(stdin));
        res.status(200).json({result});
    }catch(error){
        res.status(502).json({message:error.message || "Code execution service unavailable"});
    }
}
