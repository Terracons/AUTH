import express  from "express";
import {connectDB} from "./database/connectDb.js"
import dotenv from "dotenv"
import authRoutes from "./Router/authRoutes.js"
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config()
const app = express()
app.use(express.json())
app.use(cookieParser())

const corsOptions = {
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, 
  };

app.use(cors(corsOptions))


connectDB()
const PORT = process.env.PORT || 5000

app.get("/", (req, res)=>{
    res.send("server is running")

})
app.use("/api/auth", authRoutes)

app.listen(PORT, console.log("our server is running", PORT))