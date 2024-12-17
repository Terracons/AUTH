import express from "express"
import { login, logout, signup, verifyEmail, forgotPassword,resetpassword,checkAuth,viewUser, updatePromise, deletePromise} from "../controller/authcontroller.js"
import { verifytoken } from "../middleware/verifyToken.js"

 const router = express.Router()
 router.get("/check-auth", verifytoken, checkAuth)

 router.post("/login",login)
 router.post("/signup",signup)
 router.post("/logout",logout)
 router.post("/verify-email",verifyEmail)
 router.post("/forgot-password",forgotPassword)
 router.post("/reset-password/:token",resetpassword)
 router.get("/veiw-user",viewUser)
 router.put("/update-promise", updatePromise);
 router.delete('/deletePromise', deletePromise);


export default router