import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,GoogleloginUser,VerifyUser,ResetOtp,
  ChangedPassword
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").delete(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/google-login").post(GoogleloginUser);
router.route("/verifyotp").post(verifyJWT,VerifyUser);
router.route("/reset-otp").post(verifyJWT,ResetOtp);
router.route("/changed-password").post(verifyJWT,ChangedPassword);

export default router;
