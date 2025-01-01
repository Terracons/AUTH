import jwt from "jsonwebtoken"


const verifyToken = (req, res, next) => {
    const token = req.cookies.token;  // Assuming the token is stored in cookies

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided. Unauthorized access."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token using the secret
        req.userId = decoded.userId;  // Attach the userId to the request object for later use
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid token. Unauthorized access."
        });
    }
};



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