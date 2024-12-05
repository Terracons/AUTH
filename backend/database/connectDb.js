import mongoose from "mongoose"

 export const connectDB = ()=>{
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("DB connected"))
.catch((error)=>console.log("DB not connected", error))
}

