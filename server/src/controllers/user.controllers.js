import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
const userRegister = asyncHandler( async (req,res) => {
    
    const {username,email,fullname,password} = req.body;   //get data from frontend

    if([username,email,fullname,password].some((field) => field.trim() === "")){    
        return res.status(400).json({
            success : false,
            message : "All fields are required"
        })
    }

    //if user exist or not
    const existUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existUser){
        return res.status(409).json({
        success: false,
        message: "Username already exists"
        })
    }
    

})

export default userRegister