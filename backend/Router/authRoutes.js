import express from "express"
import { login, logout, signup, verifyEmail, forgotPassword,resetpassword,checkAuth} from "../controller/authcontroller.js"
import { verifytoken } from "../middleware/verifyToken.js"

 const router = express.Router()
 router.get("/check-auth", verifytoken, checkAuth)

 router.post("/login",login)
 router.post("/signup",signup)
 router.post("/logout",logout)
 router.post("/verify-email",verifyEmail)
 router.post("/forgot-password",forgotPassword)
 router.post("/reset-password/:token",resetpassword)

export default router