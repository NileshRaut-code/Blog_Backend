import { Post } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import Email from "../utils/Email.js";
export const GetAllpending=asyncHandler(async(req,res)=>{
    const {pstate}=req.params
    const { page = 1, limit = 10 } = req.query;
    if(!["approved", "rejected", "pending"].includes(pstate)){
        throw new ApiError(400,"Invalid post state")
    }
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    
    const PostData=await Post.find({state:pstate}).select("_id title description role state").skip(skip)
    .limit(parseInt(limit));
    res.json(new ApiResponse(200, PostData, "Post Succesfull fetched"));
})


export const MakePostState=asyncHandler(async(req,res)=>{
    const {_id,state}=req.query
    if(!_id || !state){throw new ApiError(400,"The Id and State is Required")}
    const PostData = await Post.findById(_id)
    .select("_id state author")
    .populate("author", "fullName email");


    if(!PostData){
        throw new ApiError (404,"The Post Does Not EXist")
    }

    PostData.state=state
    await PostData.save()

    if (state === "approved") {
       
        const subject = "Your Post Has Been Successfully Approved!";
        const message = `
            Hi ${PostData.author.fullName},
            
            Congratulations! Your post has been successfully approved and is now live on our platform.
            
            If you have any questions or need assistance, feel free to reach out to our support team.
            
            Best regards,
            Blog.Technilesh.com Team
        `;
        
        await Email(message, PostData.author.email, subject);
    }
    res.json(new ApiResponse(200, PostData, `Post Succesfull ${state}`));
})

export const AllUser=asyncHandler(async(req,res)=>{
    const allUsers = await User.find().select("_id username email fullName isVerified");
  res.json(new ApiResponse(200, allUsers, "Users fetched successfully"));
})