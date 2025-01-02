import jwt from "jsonwebtoken"
// import  { User }   from "../models/useModels"; 

export const verifytoken = (req, res, next)=>{
    const token = req.cookies.token
    if(!token) return res.status(401).json({success:false, message:"Unauthorized - no token provided"})
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded){
            return res.status(401).json({success:false, message:"Unauthorized - invalid provided"})

        }
        req.userId = decoded.userId
        next()
        
    } catch (error) {
        console.log("Error in verifying Token ", error);
        return res.status(500).json({success:false, message:"server error"})

        
    }
}

// export const getUserData = async (req, res) => {
//     const token = req.headers.authorization?.split(" ")[1];  // Get token from Authorization header

//     if (!token) {
//         return res.status(401).json({
//             success: false,
//             message: "No token provided. Unauthorized access."
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token using the secret
//         const user = await User.findById(decoded.userId);  // Fetch the user using the decoded userId

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found."
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "User data fetched successfully.",
//             user: {
//                 username: user.username,
//                 email: user.email,
//                 // Include other user details as necessary
//             }
//         });
//     } catch (error) {
//         return res.status(403).json({
//             success: false,
//             message: "Invalid token. Unauthorized access."
//         });
//     }
// };