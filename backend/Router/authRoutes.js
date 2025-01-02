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
 router.put("/update-promise", updatePromise);
 router.delete('/deletePromise', deletePromise);
 router.get('/user/promises',authenticateToken , verifytoken , getPromiseDetails);
 router.put("/addRequest", addRequestToPromise);
 router.get('/submit-request', findPromiseWithId);
 router.post ('/get-promise-requests', getRequestsOfPromise);
 router.post('/sharePromise/:promiseTitleId', sharePromise);
 router.get('/get-promise-details/:promiseTitleId', getPromiseDetailsById);
 router.post('/delete-request', deleteRequest);  
 router.get('/notifications/:userId', getNotifications);
 router.post('/analytics/:promiseId', analytics);  




 

// more controllers below

export default router