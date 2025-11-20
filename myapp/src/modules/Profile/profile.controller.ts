// src/modules/Profile/profile.controller.ts
import { Request, Response } from "express";
import { prisma } from "@/prisma/client";
import cloudinary from "../../config/cloudinary";
import { uploadAvatar } from "../../middlewares/uploadAvatar";
import { mapUserToProfile } from "./profile.dto";

// GET /api/v1/profile/:userId
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId không hợp lệ" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: mapUserToProfile(user),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
}

// PUT /api/v1/profile/:userId
export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId không hợp lệ" });
    }

    let { fullName, phone, email, address, dateOfBirth } = req.body;

    // Trim chuỗi
    if (typeof fullName === "string") fullName = fullName.trim();
    if (typeof phone === "string") phone = phone.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof address === "string") address = address.trim();

    // Validate cơ bản phía BE
    if (!fullName || fullName.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Họ và tên phải có ít nhất 3 ký tự",
      });
    }

    if (phone) {
      const phoneRegex = /^(0[0-9]{9}|(\+84)[0-9]{9,10})$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại không hợp lệ",
        });
      }
    }

    if (email) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }
    }

    if (address && address.length > 200) {
      address = address.slice(0, 200);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phone,
        email,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      include: {
        role: true,
        student: true,
        teacher: true,
      },
    });

    return res.json({
      success: true,
      data: mapUserToProfile(updated),
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}


// POST /api/v1/profile/:userId/avatar
export function uploadMyAvatar(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId không hợp lệ" });
  }

  uploadAvatar(req, res, async (err: any) => {
    if (err) {
      console.error("[Avatar] Multer error:", err);
      return res
        .status(400)
        .json({ success: false, message: err.message || "Upload avatar lỗi" });
    }

    const file = (req as any).file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file" });
    }

    try {
      const folder =
        process.env.CLOUDINARY_AVATAR_FOLDER || "kltn/avatars";

      console.log("[Avatar] Uploading to Cloudinary, userId=", userId);

      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder,
          public_id: `user-${userId}-${Date.now()}`,
          overwrite: true,
        }
      );

      console.log("[Avatar] Cloudinary result:", uploadResult.secure_url);

      const avatarUrl = uploadResult.secure_url;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        include: {
          role: true,
          student: true,
          teacher: true,
        },
      });

      return res.json({
        success: true,
        data: mapUserToProfile(updated),
      });
    } catch (e: any) {
      console.error("[Avatar] uploadMyAvatar error:", e);
      return res.status(500).json({
        success: false,
        message: e.message || "Không upload được avatar",
      });
    }
  });
}


// DELETE /api/v1/profile/:userId/avatar
export async function deleteMyAvatar(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId không hợp lệ" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      include: {
        role: true,
        student: true,
        teacher: true,
      },
    });

    return res.json({
      success: true,
      data: mapUserToProfile(updated),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Không xoá được avatar",
    });
  }
}
