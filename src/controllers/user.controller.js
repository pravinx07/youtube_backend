import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  // get user details for the frontend
  // validation  -- not empty
  // check if user already exist: username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user object - create entry in db
  //  remove password and refresh token from response
  // check for user creation
  // return res

  const { username, fullname, email, password } = req.body;
  console.log("console from req.body: ",req.body);
  
  console.log("username: ", username, "fullname: ", fullname);

  //    if(fullname === ""){
  //     throw new ApiError(400,"fullname is required")
  //    }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

 const existedUser = await User.findOne({
    $or: [{ username },{ email }]
  })

  if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
  }

  console.log("req.files:  ",req.files);
  
  const avatarLocalPath = req.files?.avatar[0]?.path
  // console.log(avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path
  // console.log(coverImageLocalPath);

  let coverImageLocalPath;  // add validation to check coverimge exist or not
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadCloudinary(avatarLocalPath)
  const coverImage = await uploadCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file required")
  }

  
  const user = await User.create({
    username:username.toLowerCase(),
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(400, "something went wrong while creating user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully")
  )
  
});


