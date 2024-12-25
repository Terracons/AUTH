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

        if (requestType === 'money' ) {
            return res.status(400).json({ message: 'For money requests, the value must be a number' });
        }

        if (requestType === 'url' ) {
            return res.status(400).json({ message: 'For URL requests, the value must be a string' });
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
  

 
  // Controller function to get user promises
export const getUserRequests =   async (req, res) => {
    try {
      const { username } = req.params;
  
      // Find the user by username and select only the 'promiseTitle' field
      const user = await User.findOne({ username }).select('promiseTitle');
  
      // If no user is found, return an error message
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Filter the promiseTitle array to include only those where 'requestingFor' is set
      const requestingForPromises = user.promiseTitle.filter(promise => promise.requestingFor);
  
      // Map over the filtered promises to return the necessary details (money or gift)
      const formattedPromises = requestingForPromises.map(promise => {
        if (promise.requestingFor === 'money') {
          return {
            requestingFor: promise.requestingFor,
            price: promise.money?.price, // Only include the price if it's a money request
          };
        } else if (promise.requestingFor === 'gift') {
          return {
            requestingFor: promise.requestingFor,
            giftItemUrl: promise.giftItem?.url, // Only include the URL if it's a gift request
          };
        }
        return null; // Shouldn't happen but just a safety check
      }).filter(Boolean); // Remove any null values
  
      // Respond with the filtered promises
      res.json(formattedPromises);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };



export const getPromisesWithRequests = async (req, res) => {
    const { username } = req.params; // Get the username from the route parameters

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required."
        });
    }

    try {
        // Find the user by username (assuming username is unique)
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Iterate over each promise and format the response
        const formattedPromises = user.promiseTitle.map(promise => {
            const formattedRequests = promise.requests.map(request => {
                if (request.requestingFor === 'gift') {
                    return {
                        type: 'Gift',
                        url: request.giftItem?.url || 'No gift URL available',
                        timestamp: request.timestamp
                    };
                } else if (request.requestingFor === 'money') {
                    return {
                        type: 'Money',
                        price: request.money?.price || 'No price available',
                        timestamp: request.timestamp
                    };
                }
                return {}; // Default empty object if something is wrong
            });

            return {
                promiseId: promise._id,
                title: promise.title,
                timestamp: promise.timestamp,
                requests: formattedRequests
            };
        });

        res.status(200).json({
            success: true,
            promises: formattedPromises
        });
    } catch (error) {
        console.error("Error fetching promises and requests:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not fetch promises."
        });
    }
};

