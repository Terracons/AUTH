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
        default: Date.now()
    },
    resetPasswordToken: String,
    resetPasswordExpiredAt: Date,
    verificationToken: String,
    verificationTokenExpiredAt: Date,
    
    promiseTitle: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Unique ID for each promise
        title: { type: String, required: false },
        timestamp: { type: Date, default: Date.now },
        requestingFor: {
            type: String, // 'gift' or 'money'
            enum: ['gift', 'money'],
            required: false
        },
        giftItem: {
            url: { type: String, required: function() { return this.requestingFor === 'gift'; } }
        },
        money: {
            price: { type: Number, required: function() { return this.requestingFor === 'money'; } }
        }
    }],

    promiseDescription: [{
        type: {
            description: { type: String, required: false },
            timestamp: { type: Date, default: Date.now }
        },
        required: false 
    }]
}, { timestamps: true });

// Export the model
export const User = mongoose.model('user', userSchema);
