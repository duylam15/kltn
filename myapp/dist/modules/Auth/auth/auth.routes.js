"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../../middlewares/auth");
const router = (0, express_1.Router)();
// Public
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/refresh", auth_controller_1.refresh);
router.get("/me", auth_1.verifyAccessToken, auth_controller_1.me);
router.post("/refresh_token", auth_controller_1.refreshFromCookie); // Cookie-based refresh
// Logout
router.post("/logout", auth_controller_1.logout);
exports.default = router;
