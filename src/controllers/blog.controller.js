import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Post } from "../models/blog.model.js";
import {
  uploadImageToCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";
import { ObjectId } from "mongodb";
process.env.CORS_DOMAIN;
const addPost = asyncHandler(async (req, res) => {
  // Create The Post
  //const imagepath = req.file?.path;
  const imagebuffer = req?.files[0]?.buffer;
  req.body.author = req.user._id;
  // //console.log(req.body);
  // //console.log(req.body.author);
  // //console.log(req.body.image);
  // //console.log(req.user);

  if (imagebuffer) {
    const imageurl = await uploadImageToCloudinary(imagebuffer);
    if (!imageurl) {
      throw new ApiError(404, "Image is not Uploaded Properly");
    }
    req.body.image = imageurl.url;
  }
  console.log(req.body);
  const existedPOst = await Post.findOne({
    $or: [{ title: req.body.title }, { slug: req.body.slug }],
  });

  if (existedPOst) {
    throw new ApiError(409, "Post with Title or Slug already exists");
  }

  const post = await Post.create(req.body);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { posts: post._id },
    },
    { new: true }
  );

  res.json(new ApiResponse(200, post, "Post Succesfully created"));
});

const allPosts = asyncHandler(async (req, res) => {
  const post = await Post.find().populate({
    path: "author",
    select: "-password -refreshToken",
  });
  ////console.log(post);

  res.status(200).json({ size: post.length, data: post });
});

const getPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  ////console.log(req.params);
  const post = await Post.findOne({ slug: slug }).populate({
    path: "author",
    select: "-password -refreshToken",
  });
  if (!post) {
    throw new ApiError(404, "Post not exist");
  }
  res.json(new ApiResponse(200, post, "Post Succesfull fetched"));
});

const editPost = asyncHandler(async (req, res) => {
  const postId = req.params;
  const { title, description } = req.body;
  console.log(title, description);
  const data = await Post.findByIdAndUpdate(
    new ObjectId(postId),
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  ).select("");
  // ////console.log(data);

  res.json(new ApiResponse(200, data, "Post Succesfully Edited"));
});
const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params;
  await Post.deleteOne({ _id: new ObjectId(postId) });

  res.json(new ApiResponse(200, "Post Succesfull deleted"));
});
const getAuthor = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const data = await User.findOne({ username: username }).select(
    "-password -refreshToken"
  );

  const posts = await Post.find({ author: data._id });
  //console.log(posts);
  //console.log(data);

  const userProfiledata = {
    user: data,
    posts: posts,
  };
  res
    .status(200)
    .json(new ApiResponse(200, userProfiledata, "User Profile data "));
});

export { addPost, allPosts, getPost, editPost, deletePost, getAuthor };
