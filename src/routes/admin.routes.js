import { Router } from "express";
import { GetAllpending, MakePostState } from "../controllers/admin.controller.js";


const router=Router();

router.route("/post/:pstate").post(GetAllpending)
router.route("/publish").post(MakePostState)

export default router