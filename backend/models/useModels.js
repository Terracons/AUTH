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
    
    
 // New Fields Added
    promiseTitle: {
        type: String,
        required: false // Optional field, set to false if not always required
    },
    promiseDescription: {
        type: String,
        required: false // Optional field, set to false if not always required
    }



}, {timestamps:true})


export const User = new mongoose.model('user', userSchema)

