import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
//middle ware aactually used in only routes ....
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    //as mobile app does nt have that cookies so we used haedaer
    //header with key , we passed  key:authorizationfiled
    //in header we save bearber <Toekn >
    // we remove the "breaer " replace with empty string
    //store karlo usko
    res.header("Access-Control-Allow-Origin", `${process.env.CORS_DOMAIN}`); // Adjust to your React app's origin
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //we use this only for app
    //as web has cookies to store data

    console.log(token, req.header("Authorization")?.replace("Bearer ", ""));
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    //toekn ko reverse engg karke id find kare he hamne
    //verify karne ke lilye actual token + hash value /Secert (hame provide ki he )
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // decodeToeken object  { _id,username ,fullname .... other filled as we create acces token in token generated kia usme}
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    //so hame req wale me new objedct store kardiye agar user he toh
    req.user = user;
    console.log(req.user);
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
