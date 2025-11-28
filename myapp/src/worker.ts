import { Worker } from "bullmq";
import { prisma } from "./prisma/client";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";

const worker = new Worker(
    "judge",
    async (job) => {
        const { answerId } = job.data;
        console.log("👉 Nhận job:", job.name, job.data);

        const answer = await prisma.submissionAnswer.findUnique({
            where: { id: answerId },
            include: { question: { include: { testCases: true } } },
        });
        if (!answer) return;

        console.log(
            "📋 Test cases loaded:",
            answer.question.testCases.map((tc) => ({
                id: tc.id,
                input: tc.input,
                expected: tc.expectedOutput,
                points: tc.points,
            }))
        );

        await prisma.submissionAnswer.update({
            where: { id: answerId },
            data: { judgeStatus: "running" },
        });

        const workspace = path.join(
            process.cwd(),
            "uploads",
            `work_${answerId}`
        );
        fs.ensureDirSync(workspace);

        let score = 0;
        let maxScore = 0;
        const results: any[] = [];

        try {
            // -------------------- PYTHON --------------------
            if (answer.language === "python") {
                // Tạo wrapper Python
                const wrapper = `
import sys
data = sys.stdin.read().strip()
n = int(data) if data else 0

${answer.codeAnswer || ""}

if "factorial" in globals():
    print(factorial(n))
`;
                fs.writeFileSync(path.join(workspace, "main.py"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}:/workspace`,
                                "-w",
                                "/workspace",
                                "python:3.11-alpine",
                                "python",
                                "main.py",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- PHP --------------------
            else if (answer.language === "php") {
                const wrapper = `<?php
$input = trim(file_get_contents("php://stdin"));
$n = intval($input);

${answer.codeAnswer || ""}

if (function_exists("factorial")) {
    echo factorial($n);
}
?>`;
                fs.writeFileSync(path.join(workspace, "main.php"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}:/workspace`,
                                "-w",
                                "/workspace",
                                "php:8.2-cli",
                                "php",
                                "main.php",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- HTML --------------------
            else if (answer.language === "html") {
                const filePath = path.join(workspace, "index.html");
                fs.writeFileSync(filePath, answer.codeAnswer || "");
                console.log("🔍 HTML user code:", answer.codeAnswer);

                // dùng Playwright để load trang HTML và check test case
                const { chromium } = await import("playwright");
                const browser = await chromium.launch();
                const page = await browser.newPage();
                await page.goto("file://" + filePath, {
                    waitUntil: "domcontentloaded",
                });

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        // Format input: "selector:h1|expect|Xin chào"
                        if (!tc.input.startsWith("selector:")) continue;

                        const raw = tc.input.replace(/^selector:/, "");
                        const parts = raw.split("|");
                        const selector = parts[0];
                        const action = parts[1];
                        const valueOrExpect = parts[2] ?? "";

                        if (action === "expect") {
                            const got =
                                (await page.textContent(selector)) ?? "";
                            const ok = got.includes(valueOrExpect);
                            if (ok) score += tc.points;
                            results.push({
                                id: tc.id,
                                selector,
                                got,
                                expect: valueOrExpect,
                                status: ok ? "ok" : "fail",
                            });
                        } else {
                            results.push({
                                id: tc.id,
                                status: "error",
                                stderr: `Unknown action: ${action}`,
                            });
                        }
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.message,
                        });
                    }
                }

                await browser.close();
            }

            // -------------------- JAVA --------------------
            else if (answer.language === "java") {
                const wrapper = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.hasNextInt() ? sc.nextInt() : 0;

        ${answer.codeAnswer || ""}

        if (Main.class.getDeclaredMethods() != null) {
            try {
                java.lang.reflect.Method f = Main.class.getDeclaredMethod("factorial", int.class);
                System.out.println(f.invoke(null, n));
            } catch (Exception e) {}
        }
    }
}
`;
                fs.writeFileSync(path.join(workspace, "Main.java"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        const compile = await execa("docker", [
                            "run",
                            "--rm",
                            "-v",
                            `${workspace}:/workspace`,
                            "-w",
                            "/workspace",
                            "openjdk:17-alpine",
                            "javac",
                            "Main.java",
                        ]);

                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}:/workspace`,
                                "-w",
                                "/workspace",
                                "openjdk:17-alpine",
                                "java",
                                "Main",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- C++ --------------------
            else if (answer.language === "cpp") {
                const wrapper = `
#include <bits/stdc++.h>
using namespace std;

${answer.codeAnswer || ""}

int main() {
    int n;
    if (!(cin >> n)) n = 0;
    cout << factorial(n);
}
`;
                fs.writeFileSync(path.join(workspace, "main.cpp"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        await execa("docker", [
                            "run",
                            "--rm",
                            "-v",
                            `${workspace}:/workspace`,
                            "-w",
                            "/workspace",
                            "gcc:latest",
                            "g++",
                            "main.cpp",
                            "-o",
                            "main",
                        ]);

                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}:/workspace`,
                                "-w",
                                "/workspace",
                                "gcc:latest",
                                "./main",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- C# --------------------
            else if (answer.language === "csharp") {
                const wrapper = `
using System;

public class Program {
    ${answer.codeAnswer || ""}

    public static void Main() {
        string input = Console.ReadLine();
        int n = int.TryParse(input, out int v) ? v : 0;
        Console.WriteLine(factorial(n));
    }
}
`;

                fs.writeFileSync(path.join(workspace, "Program.cs"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        // build
                        await execa("docker", [
                            "run",
                            "--rm",
                            "-v",
                            `${workspace}:/workspace`,
                            "-w",
                            "/workspace",
                            "mcr.microsoft.com/dotnet/sdk:8.0",
                            "sh",
                            "-c",
                            "dotnet new console -n app && mv Program.cs app/ && cd app && dotnet build -c Release",
                        ]);

                        // run
                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}/app:/workspace/app`,
                                "-w",
                                "/workspace/app",
                                "mcr.microsoft.com/dotnet/sdk:8.0",
                                "dotnet",
                                "bin/Release/net8.0/app.dll",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- JAVASCRIPT --------------------
            else if (answer.language === "javascript") {
                const wrapper = `
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const n = Number(raw);

${answer.codeAnswer || ""}

if (typeof factorial === "function") {
  console.log(String(factorial(n)));
}
`;
                fs.writeFileSync(path.join(workspace, "main.js"), wrapper);

                for (const tc of answer.question.testCases) {
                    maxScore += tc.points;
                    try {
                        const run = await execa(
                            "docker",
                            [
                                "run",
                                "--rm",
                                "-i",
                                "-v",
                                `${workspace}:/workspace`,
                                "-w",
                                "/workspace",
                                "node:20-alpine",
                                "node",
                                "main.js",
                            ],
                            { input: tc.input }
                        );

                        const got = run.stdout.trim();
                        const expect = (tc.expectedOutput || "").trim();
                        const ok = got === expect;
                        if (ok) score += tc.points;

                        results.push({
                            id: tc.id,
                            got,
                            expect,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                    }
                }
            }

            // -------------------- Update DB --------------------
            const updatedAnswer = await prisma.submissionAnswer.update({
                where: { id: answerId },
                data: {
                    judgeStatus: score === maxScore ? "passed" : "failed",
                    score,
                    maxScore,
                    testResults: results,
                },
                select: { submissionId: true }, // ✅ chỉ lấy submissionId
            });

            // ✅ Tính lại tổng điểm submission
            if (updatedAnswer?.submissionId) {
                await recalcSubmissionScore(updatedAnswer.submissionId);
            }

            console.log(
                `✅ answerId=${answerId} done, score=${score}/${maxScore}`
            );

            // Recalculate tổng điểm của submission
            await recalcSubmissionScore(updatedAnswer.submissionId);

            console.log(
                `✅ submissionId=${updatedAnswer.submissionId} done`
            );
            console.log(
                `✅ answerId=${answerId} done, score=${score}/${maxScore}`
            );
        } catch (err: any) {
            await prisma.submissionAnswer.update({
                where: { id: answerId },
                data: {
                    judgeStatus: "failed",
                    stderrLog: err.stderr || err.message,
                },
            });
            console.error("❌ Lỗi chấm:", err);
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
        }
    }
);

worker.on("ready", () => console.log("✅ Worker started..."));
worker.on("failed", (job, err) => console.error("❌ Job failed", job?.id, err));

export async function recalcSubmissionScore(submissionId: number) {
    const answers = await prisma.submissionAnswer.findMany({
        where: { submissionId },
        select: { score: true, maxScore: true },
    });

    const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const totalMax = answers.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);

    await prisma.submission.update({
        where: { id: submissionId },
        data: {
            score: totalScore,
            maxScore: totalMax,
            gradedAt: new Date(),
        },
    });
}
