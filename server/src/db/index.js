import mongoose from "mongoose";

const connectDB= async ()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`
);
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}

export default connectDB