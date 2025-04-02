import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OAuth2Client } from 'google-auth-library';
import Email from "../utils/Email.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {


  const { fullName, email, username, password, phoneno } = req.body;
  if (phoneno == null) {
    throw new ApiError(400, "Phone no is required");
  }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, {
      statusText: "User with email or username already exists",
    });
  }

  const otpcode= Math.floor(1000 + Math.random() * 9000);

  const user = await User.create({
    fullName,
    email,
    password,
    phoneno,
    username: username.toLowerCase(),
    isCode:otpcode
  });




  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    createdUser._id
  );

  const loggedInUser = await User.findById(createdUser._id).select(
    "-password -refreshToken"
  );

  const subject = "Welcome to Our Blog.Technilesh.com!";
  const message = `
    Hi ${loggedInUser.fullName},

    Welcome to our platform! We're excited to have you on board. Please verify your email address using the OTP sent to your email.
    
    OTP : ${otpcode}

    If you have any questions, feel free to reach out to our support team.

    Best regards,
    Blog.Technilesh.com
  `;

  await Email(message, loggedInUser.email, subject);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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
          refreshToken,
        },
        "User verified successfully"
      )
    );
 
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
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
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const GoogleloginUser = asyncHandler(async (req, res) => {

  const { token } = req.body;
  if (!token){throw new ApiError(400, "The  Token are Not pResent");}
  const client = new OAuth2Client(process.env.CLIENT_ID);
  ////console.log(email);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const {email}=payload
  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({
    email 
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }


  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});


const VerifyUser =asyncHandler(async(req,res)=>{
    const {_id} =req.user
    const {code}=req.body
    if (!_id) {
      throw new ApiError(400, "The user is not authorized");
    }


    const user=await User.findById(_id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "The USer not present");
    }

    if (user.isVerified===true) {
      throw new ApiError(400, "The user is already verified");
    }

    if(user.isCode===code){
      user.isCode=null;
      user.isVerified=true;
      await user.save();
      const subject = "Your Account Has Been Successfully Verified!";
      const message = `
        Hi ${user.fullName},
        
        Congratulations! Your account has been successfully verified. You can now enjoy full access to our platform and its features.
        
        If you have any questions or need assistance, feel free to reach out to our support team.
        
        Best regards,
        Blog.Technilesh.com Team
      `;
        
      await Email(message, user.email, subject);
      res.json(
        new ApiResponse(
          200,
          {
            
          },
          "User Verified Successfully"
        )
      );
    }
    else {
      throw new ApiError(400, "Wrong Otp"); 
  }
})

const ResetOtp=asyncHandler(async(req,res)=>{
  const {_id}=req.user;

  const user=await User.findById(_id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "The USer not present");
  }

  if (user.isVerified===true) {
    throw new ApiError(400, "The user is already verified");
  }

  const otpcode= Math.floor(1000 + Math.random() * 9000);
  user.isCode=otpcode;
  user.save()

  const subject = "Your OTP Has Been Reset Successfully!";
  const message = `
    Hi ${user.fullName},
    
    Your OTP has been successfully reset. Please use the new OTP provided below to verify your account:
    
    OTP: ${otpcode}
    
    If you did not request this change or have any questions, please contact our support team immediately.
    
    Best regards,
    Blog.Technilesh.com Team
  `;
        
      await Email(message, user.email, subject);

  res.json(new ApiResponse(200,"OTP SEND SuccesFully"))


})


const ChangedPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Wrong old password");
  }

  user.password = newPassword; // This will automatically hash the password due to the pre-save hook in the User model
  await user.save();
  const subject = "Your Password Has Been Successfully Changed!";
  const message = `
    Hi ${user.fullName},
    
    We wanted to let you know that your password has been successfully changed. If you did not make this change, please contact our support team immediately.
    
    If you have any questions or need assistance, feel free to reach out to our support team.
    
    Best regards,
    Blog.Technilesh.com Team
  `;
    
  await Email(message, user.email, subject);
  res.json(new ApiResponse(200, {}, "Password changed successfully"));
});

const GoogleSignup = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    throw new ApiError(400, "The  Token are Not pResent");
  }

  const client = new OAuth2Client(process.env.CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID,
  });
  const data = ticket.getPayload();

  const { name, email, sub, picture } = ticket.getPayload();
  const username =
    email.split("@")[0] + Math.floor(1000 + Math.random() * 9000).toString();

  if (!name | !email | !username | !password) {
    throw new ApiError(400, "All the Filed should be Required");
  }

  const check = await User.findOne({ $or: [{ email }, { username }, { sub }] });
  if (check) {
    throw new ApiError(409, "User us presnet this email or username or sub");
  }
  const otp = Math.floor(1000 + Math.random() * 9000);

  const user = await User.create({
    name,
    email,
    username: username.toLowerCase(),
    sub,
    fullName:name,
    picture,
    isCode: otp,
    password,
  });

 // await Email(otp, email)
    const subject = "Welcome to Our Blog.Technilesh.com!";
  const message = `
    Hi ${loggedInUser.fullName},

    Welcome to our platform! We're excited to have you on board. Please verify your email address using the OTP sent to your email.
    
    OTP : ${otpcode}

    If you have any questions, feel free to reach out to our support team.

    Best regards,
    Blog.Technilesh.com
  `;

  await Email(message, user.email, subject);
  // if(mailsend)

  const checkuser = await User.findById(user._id).select(
    "-passowrd -refreshToken"
  );

  if (!checkuser) {
    throw new ApiError(500, "Some Error while Creating the User");
  }
  //console.log(checkuser);

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: checkuser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,GoogleSignup,GoogleloginUser,VerifyUser,ResetOtp,ChangedPassword
};
