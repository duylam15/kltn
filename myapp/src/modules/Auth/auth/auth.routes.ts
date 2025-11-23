import { Router } from "express";
import {
    login,
    register,
    refresh,
    logout,
    me,
    refreshFromCookie,
} from "./auth.controller";
import { verifyAccessToken } from "@/middlewares/auth";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", verifyAccessToken, me);
router.post("/refresh_token", refreshFromCookie); // Cookie-based refresh


// Logout
router.post("/logout", logout);

export default router;
