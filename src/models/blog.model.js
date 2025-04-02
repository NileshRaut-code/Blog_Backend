import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      required: [true, "post description is required"],
      trim: true,
    },

    image: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    state:{
      type:String,
      enum: ["pending", "approved", "rejected"], 
      default: "pending"
    },
    views:{
      type:Number,
      default:100
    }
  },
  {
    timestamps: true,
  }
);

// Create Model
export const Post = mongoose.model("post", PostSchema);
