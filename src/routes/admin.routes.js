import { Router } from "express";
import { GetAllpending, MakePostState,AllUser } from "../controllers/admin.controller.js";


const router=Router();

router.route("/post/:pstate").post(GetAllpending)
router.route("/publish").post(MakePostState)
router.route("/allusers").post(AllUser)

export default router