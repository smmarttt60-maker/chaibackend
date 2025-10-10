
import { asyncHandler } from "../utils/asyncHandler.js";



import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// 🛡️ Middleware to check if the user is logged in
export const verifyJWT = async (req, res, next) => {
  try {
    // 1️⃣ Get the token — either from cookies (for browser) or from Authorization header (for mobile / API calls)
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // 2️⃣ If token not found → user is not authenticated
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 3️⃣ Verify the token using your secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 4️⃣ Find the user in the database using the id stored in the token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // 5️⃣ If no user found → invalid token or user deleted
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // 6️⃣ Attach the user to the request object so next middleware or route can use it
    req.user = user;

    // 7️⃣ Pass control to the next middleware or route handler
    next();
  } catch (error) {
    // 8️⃣ If any error happens (invalid token, expired, tampered, etc.), respond with 401
    next(new ApiError(401, error?.message || "Invalid Access Token"));
  }
};
