import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Creating default roles...");

    // 1. Tạo roles
    const roles = ["admin", "teacher", "student"];
    for (const name of roles) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: {
                name,
                description: `Default role: ${name}`,
            },
        });
    }

    const adminRole = await prisma.role.findUnique({
        where: { name: "admin" },
    });
    const teacherRole = await prisma.role.findUnique({
        where: { name: "teacher" },
    });
    const studentRole = await prisma.role.findUnique({
        where: { name: "student" },
    });

    console.log("🔄 Creating users...");

    const passwordHash = await bcrypt.hash("123456", 10);

    // ===========================================================
    // 2. ADMIN (login bằng email hoặc username tuỳ bạn)
    // ===========================================================
    const adminUser = await prisma.user.upsert({
        where: { studentCode: "admin" },
        update: {},
        create: {
            fullName: "System Admin",
            passwordHash,
            studentCode: "admin", // dùng như username
            roleId: adminRole!.id,
            isActive: true,
            email: null,
        },
    });

    // ===========================================================
    // 3. TEACHER
    // ===========================================================
    const teacherUser = await prisma.user.upsert({
        where: { studentCode: "T001" }, // làm username của giáo viên
        update: {},
        create: {
            fullName: "Default Teacher",
            passwordHash,
            studentCode: "T001",
            roleId: teacherRole!.id,
            isActive: true,
            email: null,
        },
    });

    await prisma.teacher.upsert({
        where: { userId: teacherUser.id },
        update: {},
        create: {
            userId: teacherUser.id,
            teacherCode: "T001",
        },
    });

    // ===========================================================
    // 4. STUDENT — Login bằng MSSV THẬT (3122410208)
    // ===========================================================
    const studentUser = await prisma.user.upsert({
        where: { studentCode: "3122410208" },
        update: {},
        create: {
            fullName: "Default Student",
            passwordHash,
            studentCode: "3122410208", // 🔥 dùng làm tài khoản đăng nhập
            roleId: studentRole!.id,
            isActive: true,
            email: null,
        },
    });

    await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
            userId: studentUser.id,
            studentCode: "3122410208",
            className: "DHKTPM18B",
            status: "active",
        },
    });

    console.log("🎉 Seed completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
