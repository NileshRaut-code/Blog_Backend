import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
//middle ware aactually used in only routes ....
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //as mobile app does nt have that cookies so we used haedaer
    //header with key , we passed  key:authorizationfiled
    //in header we save bearber <Toekn >
    // we remove the "breaer " replace with empty string
    //store karlo usko
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log(req.cookies?.accessToken);
    console.log(req.header("Authorization"));

    //we use this only for app
    //as web has cookies to store data

    //console.log(to ken );
    if (!token) {
      throw new ApiError(
        401,
        `${req.header("Authorization")}Unauthorized request${token}`
      );
    }
    //toekn ko reverse engg karke id find kare he hamne
    //verify karne ke lilye actual token + hash value /Secert (hame provide ki he )
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // decodeToeken object  { _id,username ,fullname .... other filled as we create acces token in token generated kia usme}
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.log(user);
      throw new ApiError(401, "Invalid Access Token");
    }
    //so hame req wale me new objedct store kardiye agar user he toh
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
