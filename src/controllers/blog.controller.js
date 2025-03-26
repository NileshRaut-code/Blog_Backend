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
import redisClient from "../db/redis.js";
import Email from "../utils/Email.js";
process.env.CORS_DOMAIN;
const addPost = asyncHandler(async (req, res) => {

  const imagebuffer = req?.files[0]?.buffer;
  req.body.author = req.user._id;


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

  const subject = "Your Post Has Been Sent for Admin Approval!";
  const message = `
    Hi ${req.user.fullName},
    
    Your post titled "${req.body.title}" has been successfully submitted and is now awaiting admin approval. You will be notified once it has been reviewed and approved.
    
    If you have any questions or need assistance, feel free to reach out to our support team.
    
    Best regards,
    Blog.Technilesh.com Team
  `;
  
  await Email(message, req.user.email, subject);

  res.json(new ApiResponse(200, {}, "Post Succesfully created and Sended to the Admin For Approvals"));
});

const allPosts = asyncHandler(async (req, res) => {

  const {pstate}=req.params
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit; 
  const post = await Post.find({state:"approved"}).populate({
    path: "author",
    select: "-password -refreshToken",
  })
  .sort({ updatedAt: -1 })
  .skip(skip)
  .limit(parseInt(limit));
  ////console.log(post);

  res.status(200).json({ size: post.length, data: post });
});

const getPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { state } = req.query; 

  let post; 

  if (state === "update") {
    post = await Post.findOne({ slug: slug, state: "approved" }).populate({
      path: "author",
      select: "_id username avatar fullName",
    });

    if (!post) {
      throw new ApiError(404, "Post not exist");
    }

    await redisClient.json.set(`slug:${slug}`, "$", post);
    await redisClient.expire(`slug:${slug}`, 30);

    return res.json(new ApiResponse(200, post, "Post Successfully fetched from DB and cache updated"));
  } else {
    const redisdata = await redisClient.json.get(`slug:${slug}`);

    if (redisdata) {
      return res.json(new ApiResponse(200, redisdata, "Cached Post Successfully fetched"));
    }

    post = await Post.findOne({ slug: slug, state: "approved" }).populate({
      path: "author",
      select: "_id username avatar fullName",
    });

    if (!post) {
      throw new ApiError(404, "Post not exist");
    }

    await redisClient.json.set(`slug:${slug}`, "$", post);
    await redisClient.expire(`slug:${slug}`, 30);
  }

  res.json(new ApiResponse(200, post, "Post Successfully fetched"));
});

const editPost = asyncHandler(async (req, res) => {
  const postId = req.params;
  const { title, description } = req.body;
  const updatingfields = {};
  if (title) {
    updatingfields.title = title;
  }
  if (description) {
    updatingfields.description = description;
  }
  if (req?.files[0]?.buffer) {
    const imageurl = await uploadImageToCloudinary(req?.files[0]?.buffer);
    if (!imageurl) {
      throw new ApiError(404, "Image is not Uploaded Properly");
    }
    updatingfields.image = imageurl.url;
  }
  console.log(updatingfields);
  const data = await Post.findByIdAndUpdate(
    new ObjectId(postId),
    {
      $set: updatingfields,
    },
    { new: true }
  ).populate({
    path: "author",
    select: "_id username avatar fullName",
  });
  await redisClient.json.set(`slug:${data.slug}`, "$", data);
  await redisClient.expire(`slug:${data.slug}`, 30);
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

const searchpost = asyncHandler(async (req, res) => {
  const { searchkey } = req.params;
  const post = await Post.find({
    title: { $regex: searchkey, $options: "i" },
  }).populate({
    path: "author",
    select: "-password -refreshToken",
  });
  ////console.log(post);

  res.status(200).json({ size: post.length, data: post });
});


const blogSitemap = asyncHandler(async (req, res) => {
  try {
    const baseUrl = process.env.CORS_DOMAIN || "https://blog.technilesh.com";
    const posts = await Post.find({ state: "approved" }).select("slug updatedAt");

    // Aggregate users who have at least one approved post
    const authors = await User.aggregate([
      {
        $lookup: {
          from: "posts",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$author", "$$user_id"] },
                    { $eq: ["$state", "approved"] },
                  ],
                },
              },
            },
          ],
          as: "approvedPosts",
        },
      },
      {
        $match: {
          "approvedPosts.0": { $exists: true },
        },
      },
      {
        $project: {
          username: 1,
          updatedAt: 1,
          _id: 0,
        },
      },
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>${baseUrl}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>`;

    for (const post of posts) {
      xml += `
        <url>
          <loc>${`${baseUrl}/blog/${post.slug}`}</loc>
          <lastmod>${post.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
    }

    for (const author of authors) {
      xml += `
        <url>
          <loc>${`${baseUrl}/author/${author.username}`}</loc>
          <lastmod>${
            author.updatedAt ? author.updatedAt.toISOString() : new Date().toISOString()
          }</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
    }

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");

    res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({ error: "Could not generate sitemap" });
  }
});


export {
  addPost,
  allPosts,
  getPost,
  editPost,
  deletePost,
  getAuthor,
  searchpost,
  blogSitemap
};
