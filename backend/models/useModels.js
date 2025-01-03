import mongoose from 'mongoose';

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
        title: { type: String, required: false },
        requests: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            requestType: { 
                type: String, 
                enum: ['money', 'gift-item'], 
                required: false 
            },
            requestValue: { 
                type: mongoose.Schema.Types.Mixed, 
                required: false 
            },
            paid: { type: Boolean, default: false }, // Payment status
        }],
        timestamp: { type: Date, default: Date.now },
        shareToken: { type: String, required: false },  // Add the shareToken field here
        clicks: {
            desktop: { type: Number, default: 0 },
            android: { type: Number, default: 0 },
            ios: { type: Number, default: 0 },
            tablet: { type: Number, default: 0 }
        },
        shares: { type: Number, default: 0 },
        requestsCreated: { type: Number, default: 0 },
        requestsDeleted: { type: Number, default: 0 }
    }],

    promiseDescription: [{
        description: { type: String, required: false },
        timestamp: { type: Date, default: Date.now }
    }],

    notifications: [{
        message: { type: String, required: false },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
