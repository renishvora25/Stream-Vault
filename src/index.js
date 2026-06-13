import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({path : "./.env"})
console.log("MONGODB_URI =", process.env.MONGODB_URI);
connectDB()

// import express from "express";
// const app=express()

// (async()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",(err)=>{
//             console.log(err);
//             throw err;
//        })

//        app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on ${process.env.PORT}`);
//        })
//     }
//     catch(err){
//         console.log(err);
//         throw err
//     }
// })()