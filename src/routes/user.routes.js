import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,GoogleloginUser,VerifyUser,ResetOtp,
  ChangedPassword,
  GoogleSignup,
  SummaryStat
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").delete(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/google-login").post(GoogleloginUser);
router.route("/google-signup").post(GoogleSignup);

router.route("/verifyotp").post(verifyJWT,VerifyUser);
router.route("/reset-otp").post(verifyJWT,ResetOtp);
router.route("/changed-password").post(verifyJWT,ChangedPassword);
router.route("/stat-summary").get(verifyJWT,SummaryStat);

export default router;
