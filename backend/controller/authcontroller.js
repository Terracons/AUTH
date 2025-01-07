import { User } from "../models/useModels.js"
import bycrptjs from "bcryptjs"
import { generateverificationcode,generateTokenSetCookies  } from "../utlitis/utilitis.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailTrap/emails.js";
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"; 
import jwt from "jsonwebtoken"
import axios from "axios"
import mongoose from "mongoose";
import dotenv from "dotenv"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; 

dotenv.config()

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
        const token = generateTokenSetCookies(res, user._id)

        console.log(token);
        
        user.lastlogin = Date.now()
        await user.save();

        res.status(200).json({
            success:true,
            message:"Login succesfull",
            token,
            user:{
                ...user._doc,
                password:undefined,
               
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
    // I'm extracting the token from the Authorization header so I can verify it
    const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Token is required."
        });
    }

    try {
        // Now, I verify the token to check if it's valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // I extract the userId from the decoded token to know who is making the request
        const userId = decoded.userId;
 
        const { promiseTitle, promiseDescription, promiseType } = req.body;

        // I check if all the promise details are provided, otherwise return an error
        if (!promiseTitle || !promiseDescription || !promiseType) {
            return res.status(400).json({
                success: false,
                message: "Both promiseTitle, promiseDescription, and promiseType must be provided."
            });
        }

        // I look up the user by their userId to make sure they exist
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // If the promise arrays are not initialized in the user's profile, I'll do that now
        if (!user.promiseTitle) {
            user.promiseTitle = []; // Initialize as an empty array if not present
        }

        if (!user.promiseDescription) {
            user.promiseDescription = []; // Initialize as an empty array if not present
        }

        // Here, I add the new promise details to the user's profile with a timestamp
        user.promiseTitle.push({
            title: promiseTitle,
            timestamp: Date.now(),
        });

        user.promiseDescription.push({
            description: promiseDescription,
            timestamp: Date.now(),
        });

        // I save the updated user document to the database
        await user.save();

        // I add a notification about the new promise being created
        await addNotification(user._id, `New promise titled "${promiseTitle}" created.`);

        res.status(200).json({
            success: true,
            message: "Promise details updated successfully.",
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined;  // I make sure to remove the password from the response
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

    // I'm making sure both the user ID and index of the promise to delete are provided
    if (index === undefined || id === undefined) {
        return res.status(400).json({
            success: false,
            message: "Both user ID and index of the promise to delete must be provided."
        });
    }

    try {
        // I retrieve the user from the database using their ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // I check if the index is valid for both the promiseTitle and promiseDescription arrays
        if (index < 0 || index >= user.promiseTitle.length || index >= user.promiseDescription.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid index. Promise not found."
            });
        }

        // I remove the promise title and description at the specified index
        user.promiseTitle.splice(index, 1);
        user.promiseDescription.splice(index, 1);

        // I save the updated user document after deleting the promise details
        await user.save();

        res.status(200).json({
            success: true,
            message: "Promise details deleted successfully.",
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined; // I ensure the password is not included in the response
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

export const getUsername = async (req, res) => {
    try {
        // I'm extracting the token from the Authorization header so I can verify the user's identity
        const token = req.headers.authorization?.split(' ')[1];  // Get token from Authorization header (Bearer token)

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing"
            });
        }

        // I decode the token to extract the user ID and verify it
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT_SECRET should be your secret key

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        // Now I extract the userId from the decoded token to know who the request is from
        const userId = decoded.userId;

        // I search for the user in the database using their userId, but only select their 'username'
        const user = await User.findById(userId).select('username');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // I send the username back in the response to the client
        return res.status(200).json({
            success: true,
            username: user.username
        });
    } catch (error) { 
        console.error("Error fetching username:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching username"
        });
    }
};


export const getPromiseDetails = async (req, res) => {
    const { userId } = req; 

    // I'm checking if the user ID is provided in the request
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    try {
        // I fetch the user's promise details from the database, including title, description, and timestamps
        const user = await User.findById(userId).select('promiseTitle promiseDescription timestamps');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // If everything is good, I return the promise details to the client
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
        // If an error occurs while fetching the promise details, I log the error and send an internal server error response
        console.error("Error fetching promise details:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Could not fetch promise details."
        });
    }
};



export const addRequestToPromise = async (req, res) => {
    const { promiseTitleId, requestType, requestValue } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
  
    // First, I check if the token exists. Without a token, we can't authenticate the user.
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }
    let userId;
    try {
      // I decode the token to extract the user ID. This lets me identify who the request is coming from.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      
      userId = decoded.userId;
  
      console.log(userId);
  
      // Now, I look up the user in the database using the userId decoded from the token.
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Next, I search for the specific promise title by its ID within the user's data.
      const promiseTitle = user.promiseTitle.id(promiseTitleId);
      if (!promiseTitle) {
        return res.status(404).json({ message: 'Promise title not found' });
      }
  
      // I prepare the new request object that will be added to the promise title.
      const newRequest = {
        requestType,
        requestValue,
        timestamp: new Date(),
      };
  
      // I push this new request to the promiseTitle's requests array, updating it.
      promiseTitle.requests.push(newRequest);
      promiseTitle.requestsCreated += 1; // I increment the count of created requests for this promise title.
  
      // I save the updated user data with the changes to the promise title.
      await user.save();
  
      // I also create a notification for the user, letting them know a new request has been added to their promise.
      const notificationMessage = `You have added a new ${requestType} request to your promise titled "${promiseTitle.title}".`;
      user.notifications.push({
        message: notificationMessage,
        timestamp: new Date(),
      });
  
      // I save the user again with the new notification.
      await user.save();
  
      // Finally, I send a success response indicating everything went well.
      return res.status(200).json({
        success: true,
        message: 'Request added successfully!',
      });
    } catch (error) {
      console.error('Error adding request to promise:', error);
  
      // If there was an error, I want to ensure the user still gets notified about it.
      const user = await User.findById(userId);
      if (user) {
        user.notifications.push({
          message: 'There was an error adding your request to the promise.',
          timestamp: new Date(),
        });
        await user.save();
      }
  
      // Finally, I return an error response to the client with a generic message.
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.',
      });
    }
  };
  


 
  export const findPromiseWithId =  async (req, res) => {
    try {
      const { promiseId, type, input } = req.body;

      // Here, I create a new request object that will be saved to the database. 
      // The request contains information like promiseId, type (money or gift), and input (amount or URL).
      const newRequest = {
        promiseId,
        type,
        input,  // This could either be the amount for money requests or a URL for gift requests.
        status: 'pending', // Initially, the request is set to 'pending' until further processing.
        timestamp: new Date(), // I also include a timestamp to track when this request was made.
      };

      // Now, I save the new request to the database using the Request model. 
      // The save operation is asynchronous, so I await its completion before moving on.
      const savedRequest = await Request.create(newRequest);

      // If everything goes well, I send a success response back to the client 
      // with the saved request data and a success message.
      res.status(200).json({ request: savedRequest, message: "Request submitted successfully!" });
    } catch (error) {
      // If an error occurs during the process, I catch it here and return an error response 
      // with an appropriate message and the error details.
      res.status(500).json({ message: "Error submitting request", error });
    }
};



export const getRequestsOfPromise = async (req, res) => {
    try {
        // First, I try to extract the token from the Authorization header of the incoming request.
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

        // If no token is found, I return an unauthorized response to let the user know that authentication is required.
        if (!token) {
            return res.status(401).json({ message: 'No token provided. Unauthorized!' });
        }

        // If the token exists, I verify it using the JWT secret. 
        // This helps me ensure the token is valid and hasn’t been tampered with.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Assuming the userId is stored inside the decoded token, I extract it to identify the user.
        const userId = decoded.userId;

        // With the userId, I query the database to retrieve the user document.
        const user = await User.findById(userId);

        // If the user cannot be found in the database, I return a 404 error.
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // I extract the promiseTitleId from the request body, which tells me which specific promise the user is asking for.
        const { promiseTitleId } = req.body;

        // I look for the promise within the user's list of promises, using the promiseTitleId.
        // The promises are assumed to be nested within a 'promiseTitles' array or similar structure in the user model.
        const promise = user.promiseTitle.id(promiseTitleId); // Access the promise by its ID

        // If no matching promise is found, I return a 404 error indicating that the promise doesn’t exist.
        if (!promise) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        // If the promise is found, I return the list of requests associated with that promise.
        // This allows the client to access the relevant request data.
        return res.status(200).json(promise.requests);
    } catch (error) {
        // If anything goes wrong during the process, I log the error to the console for debugging.
        // Then, I send a generic server error response to the client.
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};


export const sharePromise = async (req, res) => {
    const { promiseTitleId } = req.params;

    try {
        // First, I look for the user who owns the promise title by searching for the promiseTitleId in the user's promises.
        // This ensures that I get the correct user document who has the promise.
        const user = await User.findOne({ "promiseTitle._id": promiseTitleId });

        // If no user is found, I return a 404 error letting the client know that the user doesn't exist.
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Now that I have the user, I look for the specific promise within that user's promiseTitle array.
        const promise = user.promiseTitle.id(promiseTitleId); // I search for the promise by its ID

        // If the promise is not found within the user's list, I return a 404 error indicating the promise is missing.
        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        } 


        // At this point, I generate a unique share token to create a shareable link for the promise.
        // This will allow others to access the promise via the generated link.
        const shareToken = uuidv4(); // Generate a unique token for the shareable link

        // I then assign this generated share token to the promise object and save it to the database.
        promise.shareToken = shareToken;
        await user.save(); // I save the user document with the updated promise that includes the share token.

        // Once the share token is saved, I construct the shareable link that will be used for sharing.
        // The share link will point to the specific promise gift page using the promiseTitleId.
        const shareLink = `https://gift-pixel.vercel.app/promise-gift/${promiseTitleId}?shareToken=${shareToken}`;

        // Finally, I return a success response to the client with the generated shareable link.
        return res.status(200).json({
            success: true,
            message: "Shareable link generated successfully.",
            shareLink: shareLink,
            shareToken : shareToken
        });
    } catch (error) {
        // If any error occurs during the process, I log it for debugging and send a server error response.
        // This helps in handling unexpected issues gracefully.
        console.error(error);
        return res.status(500).json({ message: "Server error. Could not generate shareable link." });
    }
};


export const getPromiseDetailsById = async (req, res) => {
    const { promiseTitleId } = req.params; // Extract the promiseTitleId from the URL parameters.
    // const {shareToken} = req.query

    try {
        // Search for the user who has the promise associated with the promiseTitleId.
        const user = await User.findOne({ 'promiseTitle._id': promiseTitleId });

        // If the user is not found, return a 404 response indicating the promise wasn't found.
        if (!user) {
            return res.status(404).json({ success: false, message: 'Promise not found.' });
        }

        // Find the specific promise by its ID within the user's promiseTitle array.
        const promise = user.promiseTitle.id(promiseTitleId); // Use the ID to access the correct promise.

        // If the promise isn't found, return another 404 response.
        if (!promise) {
            return res.status(404).json({ success: false, message: 'Promise not found.' });
        }

        // If everything is fine, return the details of the promise, including its title, description, associated requests, and the username.
        return res.status(200).json({
            success: true,
            promise: {
                title: promise.title,
                description: promise.description,
                requests: promise.requests,
                shareToken : promise.shareToken
            },
            username: user.username // Include the username here.
        });
    } catch (error) {
        // If there's an error during the database operations, catch it and log the error for debugging purposes.
        // Then, send a 500 error response.
        console.error('Error fetching promise details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


export const deleteRequest = async (req, res) => {
    const { requestId, promiseId } = req.body; // I extract the requestId and promiseId from the request body to identify what to delete.

    // Extract the token from the Authorization header to authenticate the request.
    const token = req.headers.authorization?.split(' ')[1];

    // If there's no token, I return a 401 error letting the user know that authentication is required.
    if (!token) {
        return res.status(401).json({ message: 'Token is required for authentication' });
    }

    try {
        // I verify the token using the JWT secret key. This ensures that the user is authenticated and the token is valid.
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // After decoding the token, I get the userId to know which user is making the request.
        const userId = decoded.userId;

        // I find the user from the database using the userId extracted from the token.
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // If the user is not found, I return a 404 response.
        }

        // I now search for the specific promise within the user's promiseTitle array by matching the promiseId.
        const promiseTitle = user.promiseTitle.find(promise => promise._id.toString() === promiseId);
        if (!promiseTitle) {
            return res.status(404).json({ message: 'Promise not found' }); // If the promise is not found, I return a 404.
        }

        // Next, I find the index of the request that needs to be deleted within the promise's requests array.
        const requestIndex = promiseTitle.requests.findIndex(req => req._id.toString() === requestId);
        if (requestIndex === -1) {
            return res.status(404).json({ message: 'Request not found' }); // If the request isn't found, I return a 404.
        }

        // Once I have the index, I use splice to remove the request from the array.
        promiseTitle.requests.splice(requestIndex, 1);

        // After modifying the array, I save the user document to persist the changes to the database.
        await user.save();

        // I add a notification for the user, informing them that the request has been deleted.
        await addNotification(user._id, `Request has been deleted from your promise titled "${promiseTitle.title}".`);

        // Finally, I send a success response back to the client indicating the request was deleted successfully.
        return res.status(200).json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error(err); // I log the error for debugging purposes.

        // I handle JWT-specific errors (like invalid or expired token) and return a 401 response if needed.
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // If another error occurs, I return a generic server error response.
        return res.status(500).json({ message: 'Server error while deleting request' });
    }
};

const addNotification = async (userId, message) => {
    // I start by finding the user in the database using their userId.
    // This ensures that I can update the correct user’s notification list.
    const user = await User.findById(userId);

    // If the user is found in the database, I proceed to add a new notification to their list.
    if (user) {
        // I push a new notification object to the user's notifications array.
        // The notification contains the message and the current timestamp to track when it was created.
        user.notifications.push({
            message, // The message is passed as a parameter to this function.
            timestamp: new Date() // The current date and time when the notification is created.
        });

        // After updating the notifications array, I save the user document to the database.
        // This ensures the new notification is stored in the database.
        await user.save();
    }
};


export const getNotifications = async (req, res) => {
    // I begin by extracting the token from the Authorization header. This token is used for user authentication.
    const token = req.headers.authorization?.split(' ')[1]; // I split the header to extract the token.

    // If no token is provided, I return a 401 error indicating the user is not authenticated.
    if (!token) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }

    try {
        // I decode the token using the JWT_SECRET to verify the authenticity of the token and extract the userId.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded); // Log the decoded token for debugging purposes.
        
        const userId = decoded.userId; // I extract the userId from the decoded token to know which user is making the request.

        console.log(userId); // Log the userId for debugging.

        // Now, I search for the user by their userId in the database to retrieve their details and notifications.
        const user = await User.findById(userId);

        // If the user is not found in the database, I return a 404 error indicating the user doesn't exist.
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the user is found, I return the user's notifications in the response.
        // This allows the client to display the notifications to the user.
        return res.status(200).json({
            success: true,
            notifications: user.notifications, // Include the notifications array from the user's document.
        });
    } catch (error) {
        console.error(error); // Log any errors for debugging purposes.

        // If any error occurs during the process, I return a 500 error indicating a server issue.
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const getUserData = async (req, res) => {
    // I first extract the token from the Authorization header.
    // This token is used for user authentication and authorization.
    const token = req.headers.authorization?.split(" ")[1];

    // If no token is provided, I return a 401 response indicating that authentication is required.
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided. Unauthorized access." // Letting the client know the token is missing.
        });
    }

    try {
        // I use the JWT secret to decode the token. This verifies its authenticity and extracts the userId.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token using the secret

        // Using the decoded userId, I fetch the user from the database to retrieve their data.
        const user = await User.findById(decoded.userId);  // Fetch the user using the decoded userId

        // If the user is not found, I return a 404 response to inform the client that the user doesn't exist.
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found." // The user with the given ID wasn't found in the database.
            });
        }

        // If everything is fine, I return a success response with the user's data.
        // Here, I'm sending back their username and email, but I can include more user details as necessary.
        res.status(200).json({
            success: true,
            message: "User data fetched successfully.",
            user: {
                username: user.username, // The user's username
                email: user.email,       // The user's email address
                // I can include other user details like profile picture, etc.
            }
        });
    } catch (error) {
        // If the token is invalid or expired, I return a 403 response to inform the client that the token is invalid.
        return res.status(403).json({
            success: false,
            message: "Invalid token. Unauthorized access." // Letting the client know that the token can't be verified.
        });
    }
};



export const paymentGateway = async (req, res) => {
    const { amount, email, orderId } = req.body;  // I extract the payment details (amount, email, and orderId) from the request body.

    try {
        // I make a POST request to Paystack's API to initialize the payment.
        // The API expects the amount in kobo (1 kobo = 1/100 of a Naira), so I multiply the amount by 100.
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',  // Paystack endpoint to initialize payment
            {
                email: email,  // The email of the user making the payment
                amount: amount * 100,  // Amount is expected in kobo, so I multiply the amount by 100
                order_id: orderId,  // A unique order identifier
                callback_url: "https://gift-pixel.vercel.app/payment-success",  // URL to redirect after payment
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,  // I add the authorization header with the Paystack secret key.
                },
            }
        );

        // I log the response from Paystack to inspect the data for debugging purposes.
        console.log(response);

        // If Paystack returns a successful status, I send back the authorization URL to the frontend so the user can complete the payment.
        if (response.data.status === true) {
            res.json({
                success: true,
                authorization_url: response.data.data.authorization_url,  // The URL where the user can authorize the payment
                reference: response.data.data.reference,  // The payment reference for tracking
            });
        } else {
            // If Paystack couldn't initialize the payment, I send a failure message.
            res.json({
                success: false,
                message: 'Payment initialization failed',  // Indicate that something went wrong with initializing the payment
            });
        }
    } catch (error) {
        // If an error occurs during the API request, I log the error and send a 500 status with a failure message.
        console.log(error);
        
        res.status(500).json({
            success: false,
            message: 'Error processing payment request',  // Notify the client that there was a problem with the payment request
        });
    }
}

export const paymentVerification = async (req, res) => {
    const { reference, trxref, requestId, username } = req.body;
    const token = req.headers['authorization']?.split(' ')[1];  // Extract token

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const payerId = decoded.userId;  

        if (!payerId) {
            return res.status(404).json({ success: false, message: 'Payer not found.' });
        }

        const payer = await User.findById(payerId);
        if (!payer) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        
        const payerName = payer.username;  // Payer's username

        if (!reference || !trxref || !username) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        const paymentVerificationResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        if (paymentVerificationResponse.data.status !== true) {
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        const { amount } = paymentVerificationResponse.data.data;
        const paidAmount = amount / 100;

        const recipientUser = await User.findOne({ username });
        if (!recipientUser) {
            return res.status(404).json({ success: false, message: 'Recipient not found.' });
        }

        const promiseTitle = recipientUser.promiseTitle.find(title =>
            title.requests.some(req => req.id.toString() === requestId.toString())
        );

        if (!promiseTitle) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        const request = promiseTitle.requests.find(req => req.id.toString() === requestId.toString());
        if (request) {
            request.paid = true;

            // Add notification (ensure addNotification doesn't cause issues)
            await addNotification(recipientUser.id, `New Payment #${amount} just got credited into your Account`);

            // Update the wallet balance and transaction in one save operation
            recipientUser.wallet.balance += paidAmount;
            recipientUser.wallet.transactions.push({
                payee: payerName,
                amount: paidAmount,
                description: `${payerName} has paid ${paidAmount} into your wallet.`,
                Transaction_ID: reference,
                timestamp: new Date()
            });

            // Use findOneAndUpdate for atomic update to avoid version conflicts
            await recipientUser.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Payment successful! Wallet credited and transaction recorded.'
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};



export const getEmail = async (req, res) => {
    try {
        // I check if the token is available in either cookies or the Authorization header.
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        // If the token is not provided, I respond with a 401 error indicating it's required.
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided.' });
        }

        // I decode the token using the secret key to extract the userId.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log(decoded);  // For debugging, I log the decoded token information.

        const userId = decoded.userId;  // I extract the userId from the decoded token.

        console.log(userId);  // Logging the userId for debugging.

        // Now I fetch the user from the database using the userId.
        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });

        // If the user is not found, I return a 404 response with a message.
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // If the user is found, I extract their email from the database.
        const userEmail = user.email;

        // I return the user's email in the response.
        res.status(200).json({
            success: true,
            email: userEmail  // The email is sent as part of the success response.
        });

    } catch (error) {
        console.error(error);  // I log any errors that occur for debugging.

        // If the error is due to an invalid JWT token, I return a 401 response with a message indicating the token is invalid.
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }

        // If the token is expired, I return a 401 response with a message indicating the token has expired.
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired.' });
        }

        // For any other errors, I return a generic server error message with a 500 status code.
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


export const getWalletDetails = async (req, res) => {
    // Extract the token from the Authorization header.
    const token = req.headers['authorization']?.split(' ')[1];

    // If the token is missing, return an error.
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required in the Authorization header.' });
    }

    try {
        // Decode the token to get the userId.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Find the user by their userId.
        const user = await User.findById(userId);

        // If the user doesn't exist, return a 404 response.
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        
        const walletDetails = {
            balance: user.wallet.balance,
            transactions: user.wallet.transactions,
           
        };

        // Send the wallet details (balance and transactions) as a response.
        return res.status(200).json({
            success: true,
            wallet: walletDetails,
        });
    } catch (error) {
        // If an error occurs during the process, return a 500 error.
        console.error('Error fetching wallet details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching wallet details.',
        });
    }
};



export const ValidateACctDetails =  async (req, res) => {
    const { account_number, bank_code } = req.body;

    // Ensure the required parameters are provided
    if (!account_number || !bank_code) {
        return res.status(400).json({ message: 'Account number and bank code are required' });
    }

    try {
        // Send the request to Paystack API
        const response = await axios.post(
            'https://api.paystack.co/transaction/validate_account_number',
            { account_number, bank_code },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Check if Paystack's response is successful
        if (response.data.status) {
            // Valid account details
            return res.status(200).json({
                message: 'Account validated successfully',
                bank_name: response.data.data.bank_name,
                account_number: response.data.data.account_number,
                account_name: response.data.data.account_name,
            });
        } else {
            // Invalid account details
            return res.status(400).json({ message: 'Invalid account number or bank code' });
        }
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ message: 'An error occurred while validating the account', error: error.message });
    }
};



export const trackShareLink = async (req, res) => {
    const { promiseTitleId } = req.params;
    const { shareToken } = req.query; // Get share token from the query params

    try {
        // Find the user and the promiseTitle by shareToken
        const user = await User.findOne({ "promiseTitle.shareToken": shareToken });
        
        if (!user) {
            return res.status(404).json({ message: "User or Promise not found." });
        }

        // Find the promiseTitle associated with the share token
        const promise = user.promiseTitle.find(p => p.shareToken === shareToken);
        
        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        }

        // Track the access
        const analyticsData = {
            accessedAt: new Date(),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip, // Express automatically gets the IP
            referralSource: req.get('Referer') || 'Direct',
            accessedBy: req.user ? req.user._id : null // Optionally, track the user who accessed the link (if authenticated)
        };

        // Save analytics data in the shareAnalytics array of the specific promise
        promise.shareAnalytics.push(analyticsData);
        await user.save(); // Save the updated user document with the new analytics data

        return res.status(200).json({
            success: true,
            message: 'Share link accessed and analytics recorded.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error. Could not track analytics.' });
    }
};



export const getShareLinkAnalytics = async (req, res) => {
    const { promiseTitleId } = req.params;

    try {
        const user = await User.findOne({ "promiseTitle._id": promiseTitleId });
        
        if (!user) {
            return res.status(404).json({ message: "User or Promise not found." });
        }

        const promise = user.promiseTitle.id(promiseTitleId);  // Find the specific promiseTitle
        
        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        }

        const analytics = promise.shareAnalytics;

        return res.status(200).json({
            success: true,
            accessCount: analytics.length,
            accessData: analytics,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error. Could not retrieve analytics.' });
    }
};