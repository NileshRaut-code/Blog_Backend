import { Post } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
export const GetAllpending=asyncHandler(async(req,res)=>{
    const {pstate}=req.params
    if(!["approved", "rejected", "pending"].includes(pstate)){
        throw new ApiError(400,"Invalid post state")
    }
    
    const PostData=await Post.find({state:pstate}).select("_id title description role state")
    res.json(new ApiResponse(200, PostData, "Post Succesfull fetched"));
})


export const MakePostState=asyncHandler(async(req,res)=>{
    const {_id,state}=req.query
    if(!_id || !state){throw new ApiError(400,"The Id and State is Required")}
    const PostData=await Post.findById(_id).select("_id state")

    if(!PostData){
        throw new ApiError (404,"The Post Does Not EXist")
    }
    PostData.state=state
    await PostData.save()
    res.json(new ApiResponse(200, PostData, `Post Succesfull ${state}`));
})

export const AllUser=asyncHandler(async(req,res)=>{
    const allUsers = await User.find().select("_id username email fullName isVerified");
  res.json(new ApiResponse(200, allUsers, "Users fetched successfully"));
})