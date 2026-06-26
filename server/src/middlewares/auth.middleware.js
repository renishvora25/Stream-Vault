import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ","")
    
        if(!token){
            return res.status(401).json({
                message : "Unauthorized request"
            })
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            return res.status(401).json({
                message : "Invalid Access Token"
            })
        }
    
        req.user=user
        next()
    } catch (error) {
        return res.status(401).json({
            message : error.message
        })
    }

})

// Like verifyJWT but does NOT block the request if there is no token.
// Sets req.user if a valid token is found, otherwise sets req.user = null and continues.
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ","");
        if (!token) { req.user = null; return next(); }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        req.user = user || null;
    } catch (_) {
        req.user = null;
    }
    next();
};