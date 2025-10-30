import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // take token 
    if(!token){
      throw new ApiError(401,"Unauthorized request")
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE)
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    if(!user){
      // todo: discuss about frontend
      throw new ApiError(401,"Invalid Access Toke")
    }
  
    req.user = user;
  
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
}) 