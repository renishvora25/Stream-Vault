import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { Db } from "mongodb";

const connectDB= async ()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`
);
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

export default connectDB