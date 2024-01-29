import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  allPosts,
  getPost,
  addPost,
  editPost,
  deletePost,
} from "../controllers/blog.controller.js";
import { verifyOwner } from "../middlewares/owner.middleware.js";
const router = Router();

router.route("/allpost").get(allPosts);
router.route("/addpost").post(verifyJWT, upload.single("image"), addPost);

router.route("/post/:id").get(getPost);

router.route("/post/edit/:id").put(verifyJWT, verifyOwner, editPost);
router.route("/post/delete/:id").delete(verifyJWT, verifyOwner, deletePost);
export default router;
