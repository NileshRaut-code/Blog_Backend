import { Router } from "express";
// import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  allPosts,
  getPost,
  addPost,
  editPost,
  deletePost,
  getAuthor,
  searchpost,
} from "../controllers/blog.controller.js";
import { verifyOwner } from "../middlewares/owner.middleware.js";
import multer from "multer";
const router = Router();
const upload = multer();

router.route("/allpost").get(allPosts);
router.route("/allpost/search/:searchkey").get(searchpost);
router.route("/addpost").post(verifyJWT, upload.any("image", 1), addPost);

router.route("/post/:slug").get(getPost);

router
  .route("/post/edit/:id")
  .put(verifyJWT, verifyOwner, upload.any("image", 1), editPost);
router.route("/post/delete/:id").delete(verifyJWT, verifyOwner, deletePost);

router.route("/author/:username").get(getAuthor);

export default router;
