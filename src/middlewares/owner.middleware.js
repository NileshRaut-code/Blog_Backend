import { Post } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyOwner = asyncHandler(async (req, _, next) => {
  const postId = req.params.id;
  const userId = req.user._id;
  //console.log(postId, userId);
  const pdata = await Post.findById(postId).select("author");

  //if(String(pdata))
  if (!pdata) {
    throw new ApiError(404, "Post Does not Exist");
  }
  const author = pdata.author;
  //console.log(author, userId);
  //console.log(String(author) == String(userId));
  if (String(author) == String(userId)) {
    //console.log("you have rights to edit");
    return next();
  }
  throw new ApiError(401, "you have no Rights to Edit Post");
});
