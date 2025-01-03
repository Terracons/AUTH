import { User } from "../models/useModels.js"
import bycrptjs from "bcryptjs"
import { generateverificationcode,generateTokenSetCookies  } from "../utlitis/utilitis.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailTrap/emails.js";
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"; // Importing UUID to generate unique share tokens
import jwt from "jsonwebtoken"




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
    // Retrieve the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Token is required."
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extract userId from decoded token
        const userId = decoded.userId;
 
        const { promiseTitle, promiseDescription, promiseType } = req.body;

        // Validate promise details
        if (!promiseTitle || !promiseDescription || !promiseType) {
            return res.status(400).json({
                success: false,
                message: "Both promiseTitle, promiseDescription, and promiseType must be provided."
            });
        }

        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Initialize the promise arrays if they don't exist
        if (!user.promiseTitle) {
            user.promiseTitle = []; // Initialize as an empty array if not present
        }

        if (!user.promiseDescription) {
            user.promiseDescription = []; // Initialize as an empty array if not present
        }

        // Add the promise details to the user's profile
        user.promiseTitle.push({
            title: promiseTitle,
            timestamp: Date.now(),
        });

        user.promiseDescription.push({
            description: promiseDescription,
            timestamp: Date.now(),
        });

        // Save the updated user document
        await user.save();

        // Add notification for promise creation
        await addNotification(user._id, `New promise titled "${promiseTitle}" created.`);

        res.status(200).json({
            success: true,
            message: "Promise details updated successfully.",
            user: user.toObject({
                versionKey: false,
                transform: (doc, ret) => {
                    ret.password = undefined;  // Remove password before sending response
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
};;

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

export const getUsername = async (req, res) => {
    try {
        // Extract token from the Authorization header
        const token = req.headers.authorization?.split(' ')[1];  // Get token from Authorization header (Bearer token)

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing"
            });
        }

        // Decode the token to get the user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT_SECRET should be your secret key

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        // Extract userId from the decoded token
        const userId = decoded.userId;

        // Find the user by ID and select only the 'username' field
        const user = await User.findById(userId).select('username');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Return the username in the response
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

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    try {
        const user = await User.findById(userId).select('promiseTitle promiseDescription timestamps');

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
    const { promiseTitleId, requestType, requestValue } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Verify the token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.userId;

    if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Find the specific promiseTitle by ID
    const promiseTitle = user.promiseTitle.find(title => title._id.toString() === promiseTitleId);
    if (!promiseTitle) {
        return res.status(404).json({ message: 'Promise title not found' });
    }

    // Validate request data
    if (!requestType || !requestValue) {
        return res.status(400).json({ message: 'Request type and value are required' });
    }

    // Add the new request to the promiseTitle's requests array
    promiseTitle.requests.push({
        requestType,
        requestValue,
        timestamp: new Date(),
        paid: false,  // Add default paid status if needed
    });

    // Update the requestsCreated count in promiseTitle
    promiseTitle.requestsCreated += 1;

    // Save the user document to persist the changes
    await user.save();

    // Respond with success
    return res.status(200).json({ message: 'Request added successfully' });
};


        // Save the updated user document
        await user.save();

        // Add notification for request addition
        await addNotification(user._id, `You added a new request (${requestType}) to your promise titled "${promiseTitle.title}".`);

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
  

  export const getRequestsOfPromise = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided. Unauthorized!' });
        }

        // Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Assuming userId is stored in the token
        const userId = decoded.userId;

        // Find the user by ID from the database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the promise within the user's list of promises
        const { promiseTitleId } = req.body;
        const promise = user.promiseTitle.id(promiseTitleId); // Assuming promises are stored in 'promiseTitles'

        if (!promise) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        // Return the requests of the selected promise
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
            return res.status(404).json({ message: "User not found." });
        }

        // Find the promise title by its ID
        const promise = user.promiseTitle.id(promiseTitleId);

        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        }

        // Generate a unique share token
        const shareToken = uuidv4(); // Generate a unique token for the shareable link

        // Save the share token to the promise title
        promise.shareToken = shareToken;
        await user.save(); // Save the updated user document with the share token

        // Construct the shareable link
        const shareLink = `http://localhost:5173/promise-gift/${promiseTitleId}`;

        // Return the shareable link as part of the response
        return res.status(200).json({
            success: true,
            message: "Shareable link generated successfully.",
            shareLink: shareLink, // Send the generated link to the client
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Could not generate shareable link." });
    }
};


export const getPromiseDetailsById = async (req, res) => {
    const { promiseTitleId } = req.params;

    try {
        const user = await User.findOne({ 'promiseTitle._id': promiseTitleId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Promise not found.' });
        }

        // Find the specific promise using the ID within the user's promises
        const promise = user.promiseTitle.id(promiseTitleId);

        if (!promise) {
            return res.status(404).json({ success: false, message: 'Promise not found.' });
        }

        // Return the promise details
        return res.status(200).json({
            success: true,
            promise: {
                title: promise.title,
                description: promise.description,
                requests: promise.requests,
            }
        });
    } catch (error) {
        console.error('Error fetching promise details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


export const deleteRequest = async (req, res) => {
    const { userId, requestId, promiseId } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const promiseTitle = user.promiseTitle.id(promiseId);
        if (!promiseTitle) {
            return res.status(404).json({ message: 'Promise not found' });
        }

        const requestIndex = promiseTitle.requests.findIndex(req => req._id.toString() === requestId);
        if (requestIndex === -1) {
            return res.status(404).json({ message: 'Request not found' });
        }

        promiseTitle.requests.splice(requestIndex, 1);

        await user.save();

        // Add notification for request deletion
        await addNotification(user._id, `Request has been deleted from your promise titled "${promiseTitle.title}".`);

        return res.status(200).json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error while deleting request' });
    }
};


const addNotification = async (userId, message) => {
    const user = await User.findById(userId);
    if (user) {
        user.notifications.push({
            message,
            timestamp: new Date()
        });
        await user.save();
    }
};


const getDeviceType = (userAgent) => {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();

    // Classify device based on User-Agent information
    if (device.type === 'mobile' || device.type === 'tablet') {
        if (os.name === 'iOS') {
            return 'ios';
        } else if (os.name === 'Android') {
            return 'android';
        } else if (device.type === 'tablet') {
            return 'tablet';
        }
    }

    return 'desktop';  // Default to desktop for other cases
};


export const getNotifications = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }

    try {
        // Decode the token to get the userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        console.log(decoded);
        
        const userId = decoded.userId;

        console.log(userId);
        
        // Find the user by userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return notifications for the user
        return res.status(200).json({
            success: true,
            notifications: user.notifications,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateClicks = async (userId, promiseId, userAgent) => {
    const deviceType = getDeviceType(userAgent);  // Get device type from user agent

    const user = await User.findOne({ _id: userId });
    const promise = user.promiseTitle.id(promiseId);

    if (promise) {
        if (promise.clicks[deviceType] !== undefined) {
            promise.clicks[deviceType]++;
            await user.save();
        } else {
            throw new Error('Invalid device type');
        }
    } else {
        throw new Error('Promise not found');
    }
};

const incrementShares = async (userId, promiseId) => {
    const user = await User.findOne({ _id: userId });
    const promise = user.promiseTitle.id(promiseId);

    if (promise) {
        promise.shares++;
        await user.save();
    } else {
        throw new Error('Promise not found');
    }
};


const getPromiseShares = async (userId, promiseId) => {
    const user = await User.findOne({ _id: userId });
    const promise = user.promiseTitle.id(promiseId);

    if (promise) {
        return promise.shares;
    } else {
        throw new Error('Promise not found');
    }
};


export const analytics = (req, res) => {
    const userId = req.user._id;  // Assuming user info is available in the request (authentication middleware)
    const promiseId = req.params.promiseId;  // Get the promiseId from the URL params
    const userAgent = req.headers['user-agent'];  // Get the User-Agent from the request headers

    // Tracking the click event
    updateClicks(userId, promiseId, userAgent)
        .then(() => {
            // Optionally, track share events if the user has shared the promise (you can add this logic here if applicable)
            // Assuming that we pass a flag or detect share interaction separately, e.g., from front-end triggers

            incrementShares(promiseId)
                .then(() => {
                    // Get the current number of shares for this promise
                    getPromiseShares(promiseId)
                        .then(shares => {
                            res.send({
                                message: 'Click and share recorded successfully',
                                shares: shares,  // Include the updated number of shares in the response
                            });
                        })
                        .catch(err => res.status(400).send('Error fetching share count: ' + err.message));
                })
                .catch(err => res.status(400).send('Error incrementing share count: ' + err.message));
        })
        .catch(err => res.status(400).send('Error recording click: ' + err.message));
};



export const getUserData = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];  
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided. Unauthorized access."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token using the secret
        const user = await User.findById(decoded.userId);  // Fetch the user using the decoded userId

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "User data fetched successfully.",
            user: {
                username: user.username,
                email: user.email,
                // Include other user details as necessary
            }
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid token. Unauthorized access."
        });
    }
};

