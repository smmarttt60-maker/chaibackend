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
import jwt from "jsonwebtoken"
import { error } from "console";
import mongoose from "mongoose";

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
const refreshAccessToken = asyncHandler(async (req, res) => {  
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
if (!incomingRefreshToken) {
  throw new ApiError(401,"unauthorized request")
}
try {
  const decodedToken =jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  const user =    await User.findById(decodedToken?._id)
  
  if (!user) {
    throw new ApiError(401,"invalid refresh token")}
  
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401,"Refresh Token is expired or used")}
    
  
  const options ={
  httpOnly:true,
  secure:true
  }
    
  const{accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
  
  return res.status(200)
  .Cookie("accessToken",accessToken,options)
  .Cookie("refreshToken",newRefreshToken,options)
  .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access Token refreshed successfully"))
  
} catch (error) {
  throw new ApiError(401,error?.message ||"invalid refresh token")
}

})
const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)
const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
if (!isPasswordCorrect) {
  throw new ApiError(400,"invalid old password")
}
user.password=newPassword
await user.save({validateBeforeSave:false})
return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{ 
  return res.status(200).json(200,req.user,"current user fetched successfully")
})
const updateAccountDetails=asyncHandler(async(req,res)=>{ 
  const{fullName,email}= req.body
  if (!fullName ||!email) {
    throw new ApiError(400,"all fields are required")
  }
 const user=await User.findByIdAndUpdate(req.user?._id , 
{ $set:{fullName:fullName,email:email}}
  ,{new:true}).select("-password")
return res.status(200)
.json(new ApiResponse(200,user,"account details updated successfully"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400,"avatar file is missing")
  }
 const avatar=await uploadOnCloudinary(avatarLocalPath)
 if (!avatar.url) {
    throw new ApiError(400,"error while uploading avatar on cloudinary")
  }
 const user =await  User.findByIdAndUpdate(req.user?._id,
  {
    $set:{avatar:avatar.url}
  },
  {new:true}
 ).select("-password")
 
 return res.status(200)
.json(new ApiResponse(200,user,"avatarimage updated successfully"))



})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400,"coverImage file is missing")
  }
 const coverImage=await uploadOnCloudinary(coverImageLocalPath)
 if (!coverImag.url) {
    throw new ApiError(400,"error while uploading coverImage on cloudinary")
  }
 const user = await  User.findByIdAndUpdate(req.user?._id,
  {
    $set:{coverImage:coverImage.url}
  },
  {new:true}
 ).select("-password")
 return res.status(200)
.json(new ApiResponse(200,user,"coverImage updated successfully"))

})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const{username}=req.params
  if (!username?.trim()) {
    throw new ApiError(400,"username is missing")
  }
  const channel = await User.aggregate([{
    $match:{username:username?.toLowerCase()}
  },
{
$lookup:{
from:"subscriptions",
localField: "_id",
foreignField:"channel",
as:"subscribers"}
},
{
$lookup:{
from:"subscriptions",
localField: "_id",
foreignField:"subscriber",
as:"subscribedTo"
}
},
{
  $addFields:{
    subscriberscount:{$size:"$subscribers"},
    channelsSubscribedtoCount:{$size:"$subscribedTo"},
isSubscribed:{
  $cond:{if:{$in:[req.user?._id,"$subscribers.subscriber"]},
  then:true,
  else:false
}
  }
}
},
{
  $project:{fullName:1,
    username:1,
    subscriberscount:1,
    channelsSubscribedtoCount:1,
    isSubscribed:1,
    avatar:1,
    coverImage:1,
    email:1,
  }
}
])
console.log("CHANNEL AGGREGATION RESULT:", channel);
if (!channel?.length) {
  throw new ApiError(404,"channel does not exist")
}
return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"))

})
const getWatchHistory=asyncHandler(async(req,res)=>{
  const user= await User.aggregate([{
$match:{_id:new mongoose.Types.ObjectId(req.user._id)}
  },
  {
$lookup:{
  from:"videos",
  localField:"watchHistory",
  foreignField:"_id",
   as:"watchHistory",
   pipeline:[
    {
      $lookup:{
        from:"users",
        localField:"owner",
      foreignField:"_id",
      as:"owner",
      pipeline:[
        {
          $project:{
            fullName:1,
            username:1,
            avatar:1
          }
        }
      ]
          
        }
      },
      {
        $addFields:{owner:{$first:"$owner"}}
      }
   ]
}
  },
  
])
return res.status(200)
.json(new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully"))
})

export{registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory,}










