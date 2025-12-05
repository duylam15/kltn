"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalcSubmissionScore = recalcSubmissionScore;
const bullmq_1 = require("bullmq");
const client_1 = require("./prisma/client");
const execa_1 = require("execa");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const worker = new bullmq_1.Worker("judge", async (job) => {
    const { answerId } = job.data;
    console.log("👉 Nhận job:", job.name, job.data);
    const answer = await client_1.prisma.submissionAnswer.findUnique({
        where: { id: answerId },
        include: { question: { include: { testCases: true } } },
    });
    if (!answer)
        return;
    console.log("📋 Test cases loaded:", answer.question.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expectedOutput,
        points: tc.points,
    })));
    await client_1.prisma.submissionAnswer.update({
        where: { id: answerId },
        data: { judgeStatus: "running" },
    });
    const workspace = path_1.default.join(process.cwd(), "uploads", `work_${answerId}`);
    fs_extra_1.default.ensureDirSync(workspace);
    let score = 0;
    let maxScore = 0;
    const results = [];
    try {
        if (answer.language === "python") {
            const code = answer.codeAnswer || "";
            const fnRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
            let fnName = "solve";
            let m;
            while ((m = fnRegex.exec(code)) !== null) {
                const candidate = m[1];
                if (candidate !== "main") {
                    fnName = candidate;
                    break;
                }
            }
            const wrapper = `
import sys, json

raw = sys.stdin.read().strip()

val = None
try:
    val = json.loads(raw)
except:
    if raw.isdigit() or (raw.startswith("-") and raw[1:].isdigit()):
        val = int(raw)
    else:
        val = raw

${code}

res = globals()["${fnName}"](val)
if isinstance(res, bool):
    # 🔥 BOOL -> 1 / 0 để khớp test case
    print("1" if res else "0")
else:
    print(res)
`;
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "main.py"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    const run = await (0, execa_1.execa)("docker", [
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
                    ], { input: tc.input });
                    const got = run.stdout.trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
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
            // 🔍 Tìm tên hàm đầu tiên mà học sinh khai báo
            const fnMatch = answer.codeAnswer?.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
            const fnName = fnMatch ? fnMatch[1] : null;
            const wrapper = `<?php
$raw = trim(file_get_contents("php://stdin"));

$input = json_decode($raw, true);
if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
    // Nếu không phải JSON thì dùng raw string hoặc số
    if (is_numeric($raw)) {
        $input = intval($raw);
    } else {
        $input = $raw;
    }
}

${answer.codeAnswer || ""}

if (function_exists("${fnName}")) {
    echo ${fnName}($input);
}
?>`;
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "main.php"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    const run = await (0, execa_1.execa)("docker", [
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
                    ], { input: tc.input });
                    const got = run.stdout.trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
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
            const filePath = path_1.default.join(workspace, "index.html");
            fs_extra_1.default.writeFileSync(filePath, answer.codeAnswer || "");
            console.log("🔍 HTML user code:", answer.codeAnswer);
            // dùng Playwright để load trang HTML và check test case
            const { chromium } = await Promise.resolve().then(() => __importStar(require("playwright")));
            const browser = await chromium.launch();
            const page = await browser.newPage();
            await page.goto("file://" + filePath, {
                waitUntil: "domcontentloaded",
            });
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    // Format input: "selector:h1|expect|Xin chào"
                    if (!tc.input.startsWith("selector:"))
                        continue;
                    const raw = tc.input.replace(/^selector:/, "");
                    const parts = raw.split("|");
                    const selector = parts[0];
                    const action = parts[1];
                    const valueOrExpect = parts[2] ?? "";
                    if (action === "expect") {
                        const got = (await page.textContent(selector)) ?? "";
                        const ok = got.includes(valueOrExpect);
                        if (ok)
                            score += tc.points;
                        results.push({
                            id: tc.id,
                            selector,
                            got,
                            expect: valueOrExpect,
                            status: ok ? "ok" : "fail",
                        });
                    }
                    else {
                        results.push({
                            id: tc.id,
                            status: "error",
                            stderr: `Unknown action: ${action}`,
                        });
                    }
                }
                catch (err) {
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
            const code = answer.codeAnswer || "";
            // ============================
            // 1. BẮT TÊN HÀM
            // ============================
            const fnRegex = /((public|private|protected|static|final|abstract)\s+)*(\w+)\s+(\w+)\s*\(/g;
            let fnName = "solve";
            let m;
            while ((m = fnRegex.exec(code)) !== null) {
                const name = m[4];
                if (name !== "main") {
                    fnName = name;
                    break;
                }
            }
            // ================================================
            // 2. WRAPPER JAVA CHUẨN
            // ================================================
            const wrapper = `
import java.util.*;
import com.google.gson.*;
import java.lang.reflect.*;

public class Main {

${code}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String raw = sc.useDelimiter("\\\\A").hasNext() ? sc.next() : "";
        raw = raw.trim();

        Object input = parseInput(raw);

        try {
            Object result = callUserFunction(input);
            printResult(result);
        } catch (Exception ex) {
            System.out.println("ERROR: " + ex.getMessage());
        }
    }

    // ========================================================
    //  CALL USER FUNCTION
    // ========================================================
    static Object callUserFunction(Object input) throws Exception {

        Class<?> cls = Main.class;

        // ---------- ARRAY ----------
        if (input instanceof List) {
            List<Integer> list = (List<Integer>) input;

            try {
                Method m = cls.getDeclaredMethod("${fnName}", List.class);
                return invokeSafe(cls, m, list);
            } catch (Exception e) {}

            try {
                int[] arr = list.stream().mapToInt(Integer::intValue).toArray();
                Method m = cls.getDeclaredMethod("${fnName}", int[].class);
                return invokeSafe(cls, m, (Object) arr);
            } catch (Exception e) {}
        }

        // ---------- INT ----------
        if (input instanceof Integer) {
            try {
                Method m = cls.getDeclaredMethod("${fnName}", int.class);
                return invokeSafe(cls, m, input);
            } catch (Exception e) {}
        }

        // ---------- STRING ----------
        try {
            Method m = cls.getDeclaredMethod("${fnName}", String.class);
            return invokeSafe(cls, m, input);
        } catch (Exception e) {}

        throw new Exception("No matching function signature");
    }

    // Hàm gọi reflection an toàn
    static Object invokeSafe(Class<?> cls, Method m, Object param) throws Exception {
        m.setAccessible(true);
        Object instance = Modifier.isStatic(m.getModifiers())
            ? null
            : cls.getDeclaredConstructor().newInstance();
        return m.invoke(instance, param);
    }

    // -------------------- PARSE INPUT --------------------
    static Object parseInput(String raw) {
        try {
            JsonElement el = JsonParser.parseString(raw);

            if (el.isJsonArray()) {
                List<Integer> list = new ArrayList<>();
                for (JsonElement x : el.getAsJsonArray()) list.add(x.getAsInt());
                return list;
            }

            if (el.isJsonPrimitive()) {
                JsonPrimitive p = el.getAsJsonPrimitive();
                if (p.isNumber()) return p.getAsInt();
                if (p.isString()) return p.getAsString();
            }
        } catch (Exception e) {}

        try { return Integer.parseInt(raw); }
        catch (Exception e) { return raw; }
    }

    // -------------------- PRINT RESULT --------------------
    static void printResult(Object res) {
        if (res instanceof Boolean) {
            System.out.println((Boolean)res ? "1" : "0");
        } else {
            System.out.println(res);
        }
    }
}
`;
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "Main.java"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    await (0, execa_1.execa)("docker", [
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
                    console.log("\n===== COMPILED JAVA FILE =====");
                    console.log(fs_extra_1.default.readFileSync(path_1.default.join(workspace, "Main.java"), "utf8"));
                    console.log("===== END JAVA FILE =====\n");
                    const run = await (0, execa_1.execa)("docker", [
                        "run",
                        "--rm",
                        "--entrypoint=",
                        "-i",
                        "-v",
                        `${workspace}:/workspace`,
                        "-w",
                        "/workspace",
                        "openjdk:17-alpine",
                        "java",
                        "Main",
                    ], { input: (tc.input || "").trim() });
                    console.log("stdout:", run.stdout);
                    console.log("stderr:", run.stderr);
                    const got = run.stdout.replace(/[\r\n]/g, "").trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
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
            const userCode = answer.codeAnswer || "";
            // 🔍 Tìm tên hàm đầu tiên hợp lệ mà học sinh khai báo
            const regex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
            const banned = new Set([
                "if",
                "for",
                "while",
                "switch",
                "return",
                "sizeof",
                "main",
                "int",
                "long",
                "short",
                "float",
                "double",
                "bool",
                "char",
                "void",
                "string",
                "vector",
            ]);
            let fnName = "solve";
            let m;
            while ((m = regex.exec(userCode)) !== null) {
                const candidate = m[1];
                if (!banned.has(candidate)) {
                    fnName = candidate;
                    break;
                }
            }
            const wrapper = `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string raw;
    if (!getline(cin, raw)) return 0;

    auto trim = [](string &s) {
        while (!s.empty() && isspace((unsigned char)s.front())) s.erase(s.begin());
        while (!s.empty() && isspace((unsigned char)s.back())) s.pop_back();
    };
    trim(raw);

    vector<long long> arr;
    bool isArray = false;

    // Nếu input dạng [1, 2, 3]
    if (!raw.empty() && raw.front() == '[') {
        isArray = true;
        // bỏ [ ]
        if (raw.front() == '[') raw.erase(raw.begin());
        if (!raw.empty() && raw.back() == ']') raw.pop_back();

        string token;
        stringstream ss(raw);
        while (getline(ss, token, ',')) {
            trim(token);
            if (!token.empty()) {
                arr.push_back(stoll(token));
            }
        }
    }

    cout << boolalpha; // 🔥 bool -> "true"/"false"

    if (isArray) {
        auto result = ${fnName}(arr);
        cout << result;
    } else {
        long long n = stoll(raw);
        auto result = ${fnName}(n);
        cout << result;
    }

    return 0;
}
`;
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "main.cpp"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    // compile
                    await (0, execa_1.execa)("docker", [
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
                    // run
                    const run = await (0, execa_1.execa)("docker", [
                        "run",
                        "--rm",
                        "-i",
                        "-v",
                        `${workspace}:/workspace`,
                        "-w",
                        "/workspace",
                        "gcc:latest",
                        "./main",
                    ], { input: tc.input });
                    const got = run.stdout.trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
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
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "Program.cs"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    // build
                    await (0, execa_1.execa)("docker", [
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
                    const run = await (0, execa_1.execa)("docker", [
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
                    ], { input: tc.input });
                    const got = run.stdout.trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
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
let input;

try {
  input = JSON.parse(raw);   // <-- Parse array
} catch {
  input = raw;
}

${answer.codeAnswer || ""}

if (typeof sumArray === "function") {
  console.log(String(sumArray(input)));
}
`;
            fs_extra_1.default.writeFileSync(path_1.default.join(workspace, "main.js"), wrapper);
            for (const tc of answer.question.testCases) {
                maxScore += tc.points;
                try {
                    const run = await (0, execa_1.execa)("docker", [
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
                    ], { input: tc.input });
                    const got = run.stdout.trim();
                    const expect = (tc.expectedOutput || "").trim();
                    const ok = got === expect;
                    if (ok)
                        score += tc.points;
                    results.push({
                        id: tc.id,
                        got,
                        expect,
                        status: ok ? "ok" : "fail",
                    });
                }
                catch (err) {
                    results.push({
                        id: tc.id,
                        status: "error",
                        stderr: err.stderr || err.message,
                    });
                }
            }
        }
        // -------------------- Update DB --------------------
        const updatedAnswer = await client_1.prisma.submissionAnswer.update({
            where: { id: answerId },
            data: {
                judgeStatus: score === maxScore ? "passed" : "failed",
                score,
                maxScore,
                testResults: results,
            },
            include: { submission: true },
        });
        // Recalculate tổng điểm của submission
        await recalcSubmissionScore(updatedAnswer.submissionId);
        console.log(`✅ answerId=${answerId} done, score=${score}/${maxScore}`);
    }
    catch (err) {
        await client_1.prisma.submissionAnswer.update({
            where: { id: answerId },
            data: {
                judgeStatus: "failed",
                stderrLog: err.stderr || err.message,
            },
        });
        console.error("❌ Lỗi chấm:", err);
    }
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});
worker.on("ready", () => console.log("✅ Worker started..."));
worker.on("failed", (job, err) => console.error("❌ Job failed", job?.id, err));
async function recalcSubmissionScore(submissionId) {
    const answers = await client_1.prisma.submissionAnswer.findMany({
        where: { submissionId },
        select: { score: true, maxScore: true },
    });
    const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const totalMax = answers.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);
    await client_1.prisma.submission.update({
        where: { id: submissionId },
        data: {
            score: totalScore,
            maxScore: totalMax,
            gradedAt: new Date(),
        },
    });
}
