import express from "express"
import { 
    login, 
    logout, 
    signup, 
    verifyEmail, 
    forgotPassword,
    resetpassword,
    // checkAuth,
    viewUser, 
    updatePromise,  
    deletePromise, 
    getPromiseDetails,
    findPromiseWithId,
    addRequestToPromise,
    getRequestsOfPromise,
    sharePromise,
    getPromiseDetailsById,
    deleteRequest,
    getNotifications,
    analytics,
    getUserData,
    getUsername,
    paymentGateway,
    paymentVerification,
   
   

} from "../controller/authcontroller.js"
import { authenticateToken, verifytoken } from "../middleware/verifyToken.js"

 const router = express.Router()
//  router.get("/check-auth", verifytoken, checkAuth)

 router.post("/login",login)
 router.post("/signup",signup)
 router.post("/logout",logout)
 router.post("/verify-email",verifyEmail)
 router.post("/forgot-password",forgotPassword)
 router.post("/reset-password/:token",resetpassword)
 router.get("/veiw-user",viewUser)
 router.put("/update-promise",authenticateToken,verifytoken, updatePromise);
 router.delete('/deletePromise', deletePromise);
 router.get('/user/promises',authenticateToken , verifytoken , getPromiseDetails);
 router.put("/addRequest", addRequestToPromise);
 router.get('/submit-request', findPromiseWithId);
 router.post ('/get-promise-requests', authenticateToken,verifytoken, getRequestsOfPromise);
 router.post('/sharePromise/:promiseTitleId', sharePromise);
 router.get('/get-promise-details/:promiseTitleId', getPromiseDetailsById);
 router.delete('/delete-request', authenticateToken, verifytoken, deleteRequest);  
 router.get('/notifications',authenticateToken, verifytoken,getNotifications);
 router.post('/analytics/:promiseId', analytics);  
 router.get("/getUsername", authenticateToken, verifytoken, getUsername)
 router.post ("/paystack/payment",authenticateToken,verifytoken, paymentGateway)
 router.post('/paystack/verify', paymentVerification)




 

// more controllers below

export default router