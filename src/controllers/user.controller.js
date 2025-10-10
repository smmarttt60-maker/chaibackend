// import statuses from "statuses";

// const { message } = statuses;


// import {asyncHandler} from "../utils/asyncHandler.js";
// import {ApiError} from "../utils/ApiError.js";
// import {User} from "../models/user.model.js"; 
// import{uploadOnCloudinary} from "../utils/cloudinary.js"
// import {ApiResponse} from "../utils/ApiResponse.js"

// const registerUser=asyncHandler(async(req,res)=>{
// const { fullName, email ,username,password}=req.body
// console.log("email:",email);

// if ([fullName, email ,username,password].some((field)=>field?.trim()==="")

// ) {
//     throw new ApiError(400,"all fields are required")
// }

//  const existeduser = await User.findOne({
//     $or:[{email},{username}]
// })
// if (existeduser) {
//     throw new ApiError(409,"user with email or username already exists")
// }
// const avatarLocalPath = req.files?.avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage[0]?.path;

//   if (!avatarLocalPath) {
//     throw new ApiError(400,"Avatar file is required")
//   }
//     const avatar = await uploadOnCloudinary(avatarLocalPath)
    
//     const coverImage = coverImageLocalPath? await uploadOnCloudinary(coverImageLocalPath):null;

// if (!avatar) {
//     throw new ApiError(400,"Avatar upload failed")
//   }
//  const user = await User.create({
// fullName,
// avatar:avatar.url,
// coverImage:coverImage?.url || "",
// email,
// password,
// username:username.toLowerCase() 

// })
// const createdUser = await User.findById(user._id).select(
//   "-password -refreshToken"
// )
// if (!createdUser) {
//   throw new ApiError(500,"something went wrong registering the user")
// }

// return res.status(201).json(
//    new ApiResponse(200,createdUser,"user is registered successfully")
// )



// })

// export {registerUser}


import statuses from "statuses";
const { message } = statuses;

import path from "path"; // ✅ added here

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { error } from "console";

const generateAccessAndRefereshTokens =async(userId)=>{
  try {
   const user = await User.findById(userId)
 const accessToken  = user.generateAccessToken()
   const refreshToken= user.generateRefreshToken()
   user.refreshToken=refreshToken
  await user.save({validateBeforeSave:false})
  return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500,"something went wrong while generating access and referesh tokens")
  }
}



const registerUser = asyncHandler(async (req, res) => {

  console.log("REQ BODY:", req.body);
  console.log("REQ FILES:", req.files);


  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
    ? path.resolve(req.files.avatar[0].path)
    : null;

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    ? path.resolve(req.files.coverImage[0].path)
    : null;

  console.log("DEBUG - Avatar path:", avatarLocalPath);
  console.log("DEBUG - Cover image path:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  console.log("DEBUG - Avatar upload result:", avatar);
  console.log("DEBUG - CoverImage upload result:", coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User is registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
const{email,username,password} = req.body


  console.log("Email from body:", email);
  console.log("Username from body:", username);

if (!(username || email)) {
  throw new ApiError(400,"username or email is required")
}
 const user =  await User.findOne({
  $or:[{email},{username}]
})
console.log("Login query result:", user);

if (!user) {
  throw new ApiError(404,"user does not exist")
}

 const isPasswordValid = await user.isPasswordCorrect(password)

if (!isPasswordValid ) {
  throw new ApiError(401,"password is not correct")
}
const{accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)
const loggedInUser =  await User.findById(user._id).select("-password -refreshToken")
  
const options ={
httpOnly:true,
secure:true
}
 return  res.status(200)
.cookie("accessToken", accessToken,options )
.cookie("refreshToken", refreshToken,options )
.json(new ApiResponse
  (200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "user logged in sucessfully"
  ))

})

const logoutUser = asyncHandler(async (req, res) => {
await User.findByIdAndUpdate(req.user._id,{
  $set:{
    refreshToken:undefined
  },
},{
  new:true
})


const options ={
httpOnly:true,
secure:true
}

return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"USER LOGGED OUT SUCCESSFULLY"))


})


export{registerUser,loginUser,logoutUser}










