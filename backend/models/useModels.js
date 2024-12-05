import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        require:true
    },
    name:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    isVerified:{
        type:Boolean,
        require:true
    },
    lastlogin:{
        type:Date,
        default:Date.now()
    },
    resetPasswordToken:String,
    resetPasswordExpiredAt:Date,
    verificationToken:String,
    verificationTokenExpiredAt:Date,
    





}, {timestamps:true})


export const User = new mongoose.model('user', userSchema)

