import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastlogin: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpiredAt: Date,
    verificationToken: String,
    verificationTokenExpiredAt: Date,

    promiseTitle: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        title: { type: String, required: true },
        requests: [{
            requestType: { 
                type: String, 
                enum: ['money', 'url'], // "money" or "url"
                required: true 
            },
            requestValue: { 
                type: mongoose.Schema.Types.Mixed, // Can be a number for money or a string for URL
                required: true 
            }
        }],
        timestamp: { type: Date, default: Date.now }
    }],
    
    promiseDescription: [{
        description: { type: String, required: false },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
