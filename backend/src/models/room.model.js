import mongoose from "mongoose";

const roomSchema=new mongoose.Schema({
    roomCode:{
        type:String,
        required:true,
        unique:true,
        uppercase:true,
        trim:true
    },
    interviewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    },
    candidate:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        default:null
    },
    title:{
        type:String,
        required:[true,"Title is required"],
        trim:true
    },
    problemStatement:{
        type:String,
        required:[true,"Problem statement is required"],
        trim:true
    },
    language:{
        type:String,
        enum:["javascript","cpp","python"],
        default:"javascript"
    },
    starterCode:{
        type:String,
        default:""
    },
    currentCode:{
        type:String,
        default:""
    },
    status:{
        type:String,
        enum:["waiting","active","completed"],
        default:"waiting"
    },
    feedback:{
        type:String,
        default:"",
        maxlength:5000
    },
    rating:{
        type:Number,
        min:1,
        max:5,
        default:null
    }
},{
    timestamps:true
});

const roomModel=mongoose.model("rooms",roomSchema);

export default roomModel;
