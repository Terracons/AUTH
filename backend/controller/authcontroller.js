import { User } from "../models/useModels.js"
import bycrptjs from "bcryptjs"
import { generateverificationcode,generateTokenSetCookies  } from "../utlitis/utilitis.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailTrap/emails.js";
import crypto from "crypto"
import { timeStamp } from "console";
export const signup = async (req, res)=>{
    const{email, password, firstName , lastName, username, phone} = req.body;
    try {
        if(!email || !password || !firstName || !lastName  || !username || !phone){
            throw new Error("All field must be filled")
         }
 
         const userAlrreadyExists = await User.findOne({email})
         if(userAlrreadyExists){
            return res.status(400).json({sucess:false, message :"user already exisited"})

         }
         const hashedPassword = await bycrptjs.hash(password, 10)
         const verificationToken = generateverificationcode()
         const user = new User({
            email,
            password: hashedPassword,
            firstName ,
            lastName,
            username, 
            phone,
            verificationToken,
            verificationTokenExpiredAt: Date.now() + 24*60*60*1000



         })
         await user.save()
         generateTokenSetCookies(res, User._id);

         await sendVerificationEmail(user.email, verificationToken)
         res.status(201).json({
            success:true,
            message:"user saved successfully",
            user:{
                ...user._doc,
                password:undefined,
            }
        })
         console.log(user)

    } catch (error) {
        res.status(400).json({sucess:false, message :error.message})
        
    }
    

}
export const verifyEmail = async(req, res)=>{
    const {code}=req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiredAt: {$gt: Date.now()}
        })
        if (!user){
           return res.status(400).json({success:false,
                message: " expired verification code"})

        }
        user.isverified = true
        user.verificationToken = undefined
        user.verificationTokenExpiredAt = undefined
        await user.save()
        await sendWelcomeEmail(user.email, user.firstName)
        return res.status(200).json({
            success:true,
            message:"email verify successfully"  
        })
        console.log(user)

        
    } catch (error) {
       return res.status(400).json({sucess:false, message :error.message})
        
        
    }

}
export const login= async (req, res)=> {
    const {email, password} = req.body

    try
    {
        const user = await User.findOne({email})
        if (!user) {
            return res.status(400).json({
                success:false,
                message:"email address not recognise"
            })
        }
        const verifypassword = await bycrptjs.compare(password, user.password)
        if(!verifypassword){
            return res.status(400).json({success:false, message:"invalid password"})
            
        }
        generateTokenSetCookies(res, user._id)
        user.lastlogin = Date.now()
        await user.save();

        res.status(200).json({
            success:true,
            message:"Login succesfull",
            user:{
                ...user._doc,
                password:undefined,
                // token: token 
            },
            
        })
        
    }
    catch(error){
        console.log("login not succesful", error);
        return res.status(400).json({sucess:false, message :error.message})
    }
    


    
}
export const logout= (req, res)=>{
    res.clearCookie("token")
    res.status(200).json({success:true ,message: "Log out succesfully"})
    
}

export const forgotPassword = async(req, res) =>{
    const {email} = req.body;
    try {
        const user = await user.findOne({email})
        if(!user){
            return res.status(400).json({
                success:false,
                message:"invalid email address"
            })
        }
        const resetToken = crypto.randomBytes(20).toString("hex")
        const resetPasswordExpiredAt = Date.now()+1*60*60*1000
        user.resetPasswordToken= resetToken,
        user.resetPasswordExpiredAt =resetPasswordExpiredAt
        await user.save();

        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`)
        res.status(200).json({
            success:true,
            message:"verification code sent",
            data:newcode
        })
        
    } catch (error) {
        return res.status(400).json({sucess:false, message :error.message})
        
    }
}

export const resetpassword = async(req, res)=>{
    
    try {
        const {token }= req.param;
        const {password} = req.body;
        const user = User.findOne({
            resetPasswordToken:token,
            resetPasswordExpiredAt:{$gt: Date.now()}
        })
        if(!user){
            res.status(400).json({
                success:false,
                message:"invallid or expired reset password"
            })
        }

        const hashedPassword = bycrptjs.hash(password, 10)
        user.password=hashedPassword
        user.resetPasswordToken= undefined
        user.resetPasswordExpiredAt= undefined
        await user.save()
        await sendResetSuccessfulEmail(user.email)
        res.status(200).json({
            success:true,
            message:"password change succesfully"
        })


        
    } catch (error) {
        return res.status(400).json({sucess:false, message :error.message})
        
    }
}

export const checkAuth  = async(req, res)=>{
    try {
        const user = await User.findById(req.username).select("-password")
        if(!user)
        {
            return res.status(400).json({sucess:false, message :"user not found"})
        }
        res.status(200).json({success:true, user})
    } catch (error) {
        console.log("Error in checkAuth", error);
        return res.status(400).json({sucess:false, message :error.message})
        
        
    }
}

export const viewUser = async(req, res)=>{
    try {
        const user = await User.find()
    
        res.status(200).json({success:true, user})
    } catch (error) {
        console.log("Error fecthing users", error);
        return res.status(400).json({sucess:false, message :error.message})
        
        
    }
}

export const updatePromise = async (req, res) => {
    const { promiseTitle, promiseDescription, id } = req.body;

    if (!promiseTitle || !promiseDescription) {
        return res.status(400).json({
            success: false,
            message: "Both promiseTitle and promiseDescription must be provided."
        });
    }

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        
        user.promiseTitle.push({
            title: promiseTitle,
            timestamp: Date.now()
        });

        user.promiseDescription.push({
            description: promiseDescription,
            timestamp: Date.now()
        });

       
        await user.save();

        res.status(200).json({
            success: true,
            message: "Promise details updated successfully.",
            data : user,
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined;
                    return ret;
                },
            }),
        });
    } catch (error) {
        console.error("Error updating promise details:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not update promise details.",
        });
    }
};

export const deletePromise = async (req, res) => {
    const { index, id } = req.body;

    if (index === undefined || id === undefined) {
        return res.status(400).json({
            success: false,
            message: "Both user ID and index of the promise to delete must be provided."
        });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Ensure the index is valid for both arrays
        if (index < 0 || index >= user.promiseTitle.length || index >= user.promiseDescription.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid index. Promise not found."
            });
        }

        // Remove the promise title and description at the given index
        user.promiseTitle.splice(index, 1);
        user.promiseDescription.splice(index, 1);

        // Save the updated user document
        await user.save();

        res.status(200).json({
            success: true,
            message: "Promise details deleted successfully.",
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined;
                    return ret;
                },
            }),
        });
    } catch (error) {
        console.error("Error deleting promise details:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not delete promise details.",
        });
    }
};


export const getPromiseDetails = async (req, res) => {
    const { id } = req.params; 

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    try {
        const user = await User.findById(id).select('promiseTitle promiseDescription timestamps'); 

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

       
       
        
        res.status(200).json({
            success: true,
            message: "Promises fetched successfully.",
            promises: {
                titles: user.promiseTitle,
                descriptions: user.promiseDescription,
                timeStamp: user.timestamps
            }
        });

    } catch (error) {
        console.error("Error fetching promise details:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not fetch promise details."
        });
    }
};


export const addRequestToPromise = async (req, res) => {
    const { userId, promiseTitleId, requestType, requestValue } = req.body;

    try {
        // Log the incoming request for debugging
        console.log("Request body:", req.body);

        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the specific promiseTitle by its ID
        const promiseTitle = user.promiseTitle.id(promiseTitleId);
        if (!promiseTitle) {
            return res.status(404).json({ message: 'Promise title not found' });
        }

        // Validate requestType and requestValue
        if (!['money', 'url'].includes(requestType)) {
            return res.status(400).json({ message: 'Invalid request type. Must be "money" or "url"' });
        }

        if (requestType === 'money' && typeof requestValue !== 'number') {
            return res.status(400).json({ message: 'For "money" request, the value must be a number' });
        }

        if (requestType === 'url' && typeof requestValue !== 'string') {
            return res.status(400).json({ message: 'For "url" request, the value must be a string' });
        }

        if (requestType === 'url' && !/^https?:\/\/[^\s]+$/.test(requestValue)) {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        // Add the new request to the promiseTitle's requests array
        promiseTitle.requests.push({
            requestType,
            requestValue,
            timestamp: new Date()
        });

        // Save the updated user document
        await user.save();

        return res.status(201).json({ message: 'Request added successfully', user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



 
  export const findPromiseWithId =  async (req, res) => {
    try {
      const { promiseId, type, input } = req.body;
  
      // You can save the request in the database, either as money or gift request
      const newRequest = {
        promiseId,
        type,
        input,  // Either amount for money or URL for gift
        status: 'pending',
        timestamp: new Date(),
      };
  
      // Save to the database (assumed models)
      const savedRequest = await Request.create(newRequest);
  
      res.status(200).json({ request: savedRequest, message: "Request submitted successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Error submitting request", error });
    }
  };
  

export const getRequestsOfPromise =  async (req, res) => {
    try {
        const { userId, promiseTitleId } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the specific promise by title ID
        const promise = user.promiseTitle.id(promiseTitleId);

        if (!promise) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        // Return the requests from the selected promise
        return res.status(200).json(promise.requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const sharePromise = async (req, res) => {
    const { promiseTitleId } = req.params;

    try {
        const user = await User.findOne({ "promiseTitle._id": promiseTitleId });

        if (!user) {
            return res.status(404).json({ message: "Promise not found." });
        }

        const promise = user.promiseTitle.id(promiseTitleId);

        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        }

        return res.status(200).json(promise);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};



export const generateShareLink = async (req, res) => {
    try {
        const { promiseTitleId } = req.body;  // Promise ID from the request

        // Check if the promise exists
        const promise = await Promise.findById(promiseTitleId);
        if (!promise) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        // Generate a unique token using a random string
        const token = crypto.randomBytes(16).toString('hex');

        // Save the token to the promise (you could also save it in a separate collection)
        promise.shareToken = token;
        await promise.save();

        // Generate the shareable link
        const shareLink = `${process.env.FRONTEND_URL}/shared/${token}`;

        return res.status(200).json({ shareLink });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};

// Function to retrieve a shared promise using the token
export const getSharedPromise = async (req, res) => {
    try {
        const { token } = req.params;  // Token from the URL parameter

        // Find the promise with the given token
        const promise = await Promise.findOne({ shareToken: token });
        if (!promise) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        // Return the promise details
        return res.status(200).json({ promise });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
