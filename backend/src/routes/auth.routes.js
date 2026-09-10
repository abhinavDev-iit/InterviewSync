import {Router} from "express";
import * as authController from "../controllers/auth.controller.js";
import {protect} from "../middleware/auth.middleware.js";

const authRouter=Router();

authRouter.post("/register",authController.register);
authRouter.post("/login",authController.login);
authRouter.post("/logout",authController.logout);
authRouter.get("/get-me",protect,authController.getMe);

export default authRouter;

