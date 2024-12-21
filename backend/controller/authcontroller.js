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
        const user = await User.findById(req.userId).select("-password")
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


export const updatePromiseWithGiftOrMoney = async (req, res) => {
    const { promiseId, requestingFor, giftItem, money, userId } = req.body;

    if (!promiseId || !requestingFor || !userId) {
        return res.status(400).json({
            success: false,
            message: "Promise ID, requestingFor type, and user ID are required."
        });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Find the promise by promiseId within the user's promises
        const promise = user.promiseTitle.id(promiseId); // Using .id() to find the promise by its _id

        if (!promise) {
            return res.status(404).json({
                success: false,
                message: "Promise not found."
            });
        }

        // Validate and update the promise depending on the 'requestingFor' type
        if (requestingFor === 'gift') {
            if (!giftItem || !giftItem.url) {
                return res.status(400).json({
                    success: false,
                    message: "Gift URL is required for gift requests."
                });
            }
            // Update the promise with the gift item URL
            promise.giftItem = giftItem;
        } else if (requestingFor === 'money') {
            if (typeof money?.price !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: "Price is required for money requests and must be a number."
                });
            }
            // Update the promise with the money price
            promise.money = money;
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid requestingFor value. It should be either 'gift' or 'money'."
            });
        }

      
        await user.save();

        res.status(200).json({
            success: true,
            message: "Promise updated successfully.",
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined; 
                    return ret;
                },
            }),
        });
    } catch (error) {
        console.error("Error updating promise with gift or money:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not update promise.",
        });
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
export const getUserRequests = async (req, res) => {
      try {
          const userId = req.params.userId; // Assuming user ID is passed in the request params
          
          // Fetch user from database
          const user = await User.findById(userId).select('promiseTitle');
          
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
  
          // Extracting the user's promises based on what they're requesting
          const promises = user.promiseTitle.map(promise => {
              if (promise.requestingFor === 'gift') {
                  return {
                      title: promise.title,
                      timestamp: promise.timestamp,
                      giftUrl: promise.giftItem.url, // Display URL if it's a gift
                  };
              } else if (promise.requestingFor === 'money') {
                  return {
                      title: promise.title,
                      timestamp: promise.timestamp,
                      amountRequested: promise.money.price, // Display amount if it's for money
                  };
              }
              return null;
          }).filter(promise => promise !== null); // Remove any null values
  
          if (promises.length === 0) {
              return res.status(404).json({ message: 'No requests found for this user' });
          }
  
          // Return the promises to the client
          return res.status(200).json({ promises });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Internal server error' });
      }
  };
  