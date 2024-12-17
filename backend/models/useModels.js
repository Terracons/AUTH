import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        required:true
    },
    username:{
        type:String,
        unique:true,
        required:true
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        default:false
        
    },
    lastlogin:{
        type:Date,
        default:Date.now()
    },
    resetPasswordToken:String,
    resetPasswordExpiredAt:Date,
    verificationToken:String,
    verificationTokenExpiredAt:Date,
    
    
 
    promiseTitle:[ {
        type: String,
        required: false
    }],
    promiseDescription: [{
        type: String,
        required: false 
    }]



}, {timestamps:true})


export const User = new mongoose.model('user', userSchema)

