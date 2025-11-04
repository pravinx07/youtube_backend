import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log("User ", user);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken; // save in db
    await user.save(); // validate before save
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("token genration error", error);

    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

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
  console.log("console from req.body: ", req.body);

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
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  console.log("req.files:  ", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log(avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path
  // console.log(coverImageLocalPath);

  let coverImageLocalPath; // add validation to check coverimge exist or not
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file required");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(400, "something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // take username and email from user body
  // check user exist or not using email if not return user not found
  // if user exist check password and compare old password
  // generate access token and store it in cookies
  // generate refresh token and store it in db
  // send cookies
  // take access token from user and compare verify it if it valid give access for login

  const { username, email, password } = req.body;
  console.log(username, email, password);

  if (!username || !email) {
    throw new ApiError(400, "username or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], // $or operator like or ||
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // get access token and refresh token from the method
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true, // cookie modify only on server if we add this
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // handle if user want to save access token and refresh token ---- bad practice
        },
        "User logged In Successfully"
      )
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or use");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message, "failed in access refresh Token");
  }
});

export const changeCurrentUser = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const passwordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!passwordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details update successfully"));
});

export const updateUserAvatar = asyncHandler(async(req,res) =>{
  const avatarLocalPath = req.files?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is missing")


  }

  const avatar = await uploadCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading an avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
        avatar:avatar.url
       }
    },
    {new:true}
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"Avatar update successfully"))


})

export const updateUserCoverImage = asyncHandler(async(req,res) =>{
  const coverImageLocalPath = req.files?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"cover image file is missing")


  }

  const coverImage = await uploadCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading an cover")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
        avatar:coverImage.url
       }
    },
    {new:true}
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"Cover Image update successfully"))

})