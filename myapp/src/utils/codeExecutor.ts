import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

interface ExecutionOptions {
    timeLimit?: number; // milliseconds
    memoryLimit?: number; // MB
}

interface ExecutionResult {
    output: string;
    error?: string;
    executionTime: number; // ms
    memoryUsed?: number; // KB
    exitCode?: number;
}

export async function executeCode(
    code: string,
    language: string,
    input: string,
    options: ExecutionOptions = {}
): Promise<ExecutionResult> {
    const { timeLimit = 5000, memoryLimit = 256 } = options;

    // Create temp directory
    const tempDir = path.join(process.cwd(), "temp", uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    try {
        let result: ExecutionResult;

        switch (language.toLowerCase()) {
            case "javascript":
                result = await executeJavaScript(
                    code,
                    input,
                    tempDir,
                    timeLimit
                );
                break;
            case "python":
                result = await executePython(code, input, tempDir, timeLimit);
                break;
            case "java":
                result = await executeJava(code, input, tempDir, timeLimit);
                break;
            case "cpp":
                result = await executeCpp(code, input, tempDir, timeLimit);
                break;
            case "csharp":
                result = await executeCSharp(code, input, tempDir, timeLimit);
                break;
            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        return result;
    } finally {
        // Cleanup temp files
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}

async function executeJavaScript(
    code: string,
    input: string,
    tempDir: string,
    timeLimit: number
): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, "main.js");

    // Wrap code to handle stdin
    const wrappedCode = `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let inputLines = [];
rl.on('line', (line) => {
  inputLines.push(line);
});

rl.on('close', () => {
  ${code}
});
`;

    await fs.writeFile(filePath, wrappedCode);

    return executeProcess("node", [filePath], input, timeLimit);
}

async function executePython(
    code: string,
    input: string,
    tempDir: string,
    timeLimit: number
): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, "main.py");
    await fs.writeFile(filePath, code);

    return executeProcess("python3", [filePath], input, timeLimit);
}

async function executeJava(
    code: string,
    input: string,
    tempDir: string,
    timeLimit: number
): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, "Main.java");
    await fs.writeFile(filePath, code);

    // Compile
    const compileResult = await executeProcess(
        "javac",
        [filePath],
        "",
        timeLimit
    );

    if (compileResult.error) {
        throw new Error(`Compilation error: ${compileResult.error}`);
    }

    // Run
    return executeProcess("java", ["-cp", tempDir, "Main"], input, timeLimit);
}

async function executeCpp(
    code: string,
    input: string,
    tempDir: string,
    timeLimit: number
): Promise<ExecutionResult> {
    const sourceFile = path.join(tempDir, "main.cpp");
    const outputFile = path.join(tempDir, "main");

    await fs.writeFile(sourceFile, code);

    // Compile
    const compileResult = await executeProcess(
        "g++",
        [sourceFile, "-o", outputFile, "-std=c++17"],
        "",
        timeLimit
    );

    if (compileResult.error) {
        throw new Error(`Compilation error: ${compileResult.error}`);
    }

    // Run
    return executeProcess(outputFile, [], input, timeLimit);
}

async function executeCSharp(
    code: string,
    input: string,
    tempDir: string,
    timeLimit: number
): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, "Program.cs");
    await fs.writeFile(filePath, code);

    // Compile and run with dotnet
    const compileResult = await executeProcess(
        "dotnet",
        ["new", "console", "-o", tempDir, "--force"],
        "",
        timeLimit
    );

    if (compileResult.error) {
        throw new Error(`Compilation error: ${compileResult.error}`);
    }

    await fs.writeFile(filePath, code);

    return executeProcess(
        "dotnet",
        ["run", "--project", tempDir],
        input,
        timeLimit
    );
}

function executeProcess(
    command: string,
    args: string[],
    input: string,
    timeLimit: number
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const process = spawn(command, args);

        let stdout = "";
        let stderr = "";
        let killed = false;

        // Set timeout
        const timeout = setTimeout(() => {
            killed = true;
            process.kill();
        }, timeLimit);

        // Handle stdout
        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        // Handle stderr
        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        // Handle exit
        process.on("close", (code) => {
            clearTimeout(timeout);
            const executionTime = Date.now() - startTime;

            if (killed) {
                resolve({
                    output: stdout,
                    error: "Time limit exceeded",
                    executionTime,
                    exitCode: -1,
                });
            } else if (code !== 0) {
                resolve({
                    output: stdout,
                    error: stderr || `Process exited with code ${code}`,
                    executionTime,
                    exitCode: code || undefined,
                });
            } else {
                resolve({
                    output: stdout,
                    error: stderr || undefined,
                    executionTime,
                    exitCode: code || undefined,
                });
            }
        });

        // Handle error
        process.on("error", (err) => {
            clearTimeout(timeout);
            resolve({
                output: "",
                error: err.message,
                executionTime: Date.now() - startTime,
                exitCode: -1,
            });
        });

        // Write input to stdin
        if (input) {
            process.stdin.write(input);
            process.stdin.end();
        }
    });
}
