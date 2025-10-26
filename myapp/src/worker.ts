import { Worker } from "bullmq";
import { prisma } from "./prisma/client";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import { chromium } from "playwright";

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

        // map extension
        const extMap: Record<string, string> = {
            python: "main.py",
            php: "main.php",
            javascript: "main.js",
            html: "index.html",
            css: "style.css",
        };

        const fileName = extMap[answer.language as string] || "main.txt";
        const codePath = path.join(workspace, fileName);
        fs.writeFileSync(codePath, answer.codeAnswer || "");

        let score = 0;
        let maxScore = 0;
        const results: any[] = [];

        try {
            // -------------------- PYTHON --------------------
            if (answer.language === "python") {
                for (const tc of answer.question.testCases) {
                    try {
                        const run = await execa("docker", [
                            "run",
                            "--rm",
                            "-i",
                            "-v",
                            `${workspace}:/workspace`,
                            "-w",
                            "/workspace",
                            "python:3.11-alpine",
                            "sh",
                            "-c",
                            `echo "${tc.input}" | python main.py`,
                        ]);
                        const got = run.stdout.trim();
                        const ok = got === tc.expectedOutput.trim();
                        if (ok) score += tc.points;
                        maxScore += tc.points;
                        results.push({
                            id: tc.id,
                            got,
                            expect: tc.expectedOutput,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                        maxScore += tc.points;
                    }
                }
            }

            // -------------------- PHP --------------------
            else if (answer.language === "php") {
                for (const tc of answer.question.testCases) {
                    try {
                        const run = await execa("docker", [
                            "run",
                            "--rm",
                            "-i",
                            "-v",
                            `${workspace}:/workspace`,
                            "-w",
                            "/workspace",
                            "php:8.2-cli",
                            "sh",
                            "-c",
                            `echo "${tc.input}" | php main.php`,
                        ]);
                        const got = run.stdout.trim();
                        const ok = got === tc.expectedOutput.trim();
                        if (ok) score += tc.points;
                        maxScore += tc.points;
                        results.push({
                            id: tc.id,
                            got,
                            expect: tc.expectedOutput,
                            status: ok ? "ok" : "fail",
                        });
                    } catch (err: any) {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: err.stderr || err.message,
                        });
                        maxScore += tc.points;
                    }
                }
            }

            // -------------------- JAVASCRIPT --------------------
            else if (answer.language === "javascript") {
                try {
                    const run = await execa("npx", ["eslint", fileName], {
                        cwd: workspace,
                    });
                    results.push({
                        tool: "eslint",
                        status: "ok",
                        output: run.stdout,
                    });
                    maxScore += 1;
                    score += 1;
                } catch (err: any) {
                    results.push({
                        tool: "eslint",
                        status: "fail",
                        output: err.stdout || err.message,
                    });
                    maxScore += 1;
                }
            }

            // -------------------- HTML --------------------
            else if (answer.language === "html") {
                try {
                    const run = await execa("npx", ["htmlhint", fileName], {
                        cwd: workspace,
                    });
                    results.push({
                        tool: "htmlhint",
                        status: "ok",
                        output: run.stdout,
                    });
                    maxScore += 1;
                    score += 1;
                } catch (err: any) {
                    results.push({
                        tool: "htmlhint",
                        status: "fail",
                        output: err.stdout || err.message,
                    });
                    maxScore += 1;
                }

                // ---- UI Test bằng Playwright ----
                // ---- UI Test bằng Playwright ----
                if (
                    answer.language === "html" &&
                    answer.question.testCases.length > 0
                ) {
                    const browser = await chromium.launch();
                    const page = await browser.newPage();
                    await page.goto("file://" + codePath);

                    for (const tc of answer.question.testCases) {
                        if (tc.input.startsWith("selector:")) {
                            const [_, selector, action, valueOrExpect] =
                                tc.input.split("|");

                            if (action === "fill") {
                                try {
                                    await page.fill(selector, valueOrExpect);
                                    results.push({
                                        id: tc.id,
                                        action: "fill",
                                        selector,
                                        value: valueOrExpect,
                                        status: "ok",
                                    });
                                } catch (err: any) {
                                    results.push({
                                        id: tc.id,
                                        action: "fill",
                                        selector,
                                        value: valueOrExpect,
                                        status: "error",
                                        stderr: err.message,
                                    });
                                }
                                // 👉 Không cộng điểm cho thao tác fill
                                maxScore += tc.points;
                            } else if (action === "click") {
                                try {
                                    await page.click(selector);
                                    results.push({
                                        id: tc.id,
                                        action: "click",
                                        selector,
                                        status: "ok",
                                    });
                                } catch (err: any) {
                                    results.push({
                                        id: tc.id,
                                        action: "click",
                                        selector,
                                        status: "error",
                                        stderr: err.message,
                                    });
                                }
                                // 👉 Không cộng điểm cho thao tác click
                                maxScore += tc.points;
                            } else if (action === "expect") {
                                try {
                                    const got = await page.textContent(
                                        selector
                                    );
                                    const ok = got?.includes(valueOrExpect);
                                    if (ok) score += tc.points;
                                    results.push({
                                        id: tc.id,
                                        action: "expect",
                                        selector,
                                        got,
                                        expect: valueOrExpect,
                                        status: ok ? "ok" : "fail",
                                    });
                                } catch (err: any) {
                                    results.push({
                                        id: tc.id,
                                        action: "expect",
                                        selector,
                                        status: "error",
                                        stderr: err.message,
                                    });
                                }
                                maxScore += tc.points;
                            }
                        }
                    }

                    await browser.close();
                }
            }

            // -------------------- CSS --------------------
            else if (answer.language === "css") {
                try {
                    const run = await execa("npx", ["stylelint", fileName], {
                        cwd: workspace,
                    });
                    results.push({
                        tool: "stylelint",
                        status: "ok",
                        output: run.stdout,
                    });
                    maxScore += 1;
                    score += 1;
                } catch (err: any) {
                    results.push({
                        tool: "stylelint",
                        status: "fail",
                        output: err.stdout || err.message,
                    });
                    maxScore += 1;
                }
            }

            // -------------------- Update DB --------------------
            await prisma.submissionAnswer.update({
                where: { id: answerId },
                data: {
                    judgeStatus: score === maxScore ? "passed" : "failed",
                    score,
                    maxScore,
                    testResults: results,
                },
            });

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
    { connection: { host: "127.0.0.1", port: 6379 } }
);

worker.on("ready", () => console.log("✅ Worker started..."));
worker.on("failed", (job, err) => console.error("❌ Job failed", job?.id, err));
