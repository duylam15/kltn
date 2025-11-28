"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAssignmentQuestions = generateAssignmentQuestions;
exports.previewGeneratedQuestions = previewGeneratedQuestions;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
// 🧮 Tính tổng điểm từ rule
function calculateTotalScore(easy, medium, hard) {
    return (easy.count * easy.pointPerQuestion +
        medium.count * medium.pointPerQuestion +
        hard.count * hard.pointPerQuestion);
}
// 🎲 Lấy câu hỏi ngẫu nhiên theo điều kiện
async function getRandomQuestions(params) {
    const where = {
        subjectId: params.subjectId,
        difficulty: params.difficulty,
        id: {
            notIn: params.excludeIds,
        },
    };
    if (params.chapterId) {
        where.chapterId = params.chapterId;
    }
    const questions = await client_1.prisma.question.findMany({
        where,
        take: params.count * 2, // Lấy gấp đôi để random
        include: {
            choices: true,
            testCases: true,
        },
    });
    // Shuffle và lấy đúng số lượng
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, params.count);
}
// 🔍 Kiểm tra tổng điểm
function validateTotalScore(config) {
    let calculatedScore = 0;
    if (config.subjectRule) {
        // Tính điểm cho cả môn
        const rule = config.subjectRule;
        calculatedScore = calculateTotalScore(rule.easy, rule.medium, rule.hard);
    }
    else if (config.chapterRules) {
        // Tính điểm cho từng chương
        for (const rule of config.chapterRules) {
            calculatedScore += calculateTotalScore(rule.easy, rule.medium, rule.hard);
        }
    }
    const isValid = Math.abs(calculatedScore - config.totalScore) < 0.01; // Cho phép sai số 0.01
    return {
        isValid,
        calculatedScore,
        message: isValid
            ? undefined
            : `Tổng điểm tính được: ${calculatedScore}. Yêu cầu: ${config.totalScore}`,
    };
}
// 📝 Tạo đề thi chính
async function generateAssignmentQuestions(config) {
    // 1. Validate tổng điểm
    const validation = validateTotalScore(config);
    if (!validation.isValid) {
        throw new ApiError_1.default(400, validation.message);
    }
    // 2. Kiểm tra assignment tồn tại
    const assignment = await client_1.prisma.assignment.findUnique({
        where: { id: config.assignmentId },
        include: {
            questions: true,
        },
    });
    if (!assignment) {
        throw new ApiError_1.default(404, "Assignment not found");
    }
    // 3. Kiểm tra subject tồn tại
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: config.subjectId },
    });
    if (!subject) {
        throw new ApiError_1.default(404, "Question subject not found");
    }
    // 4. Lấy danh sách câu hỏi đã có trong assignment
    const existingQuestionIds = assignment.questions.map((q) => q.questionId);
    // 5. Lấy câu hỏi theo rule
    const selectedQuestions = [];
    const errors = [];
    if (config.subjectRule) {
        // ===== CASE 1: Không chia chương =====
        const rule = config.subjectRule;
        // Lấy câu dễ
        const easyQuestions = await getRandomQuestions({
            subjectId: config.subjectId,
            difficulty: "easy",
            count: rule.easy.count,
            excludeIds: [
                ...existingQuestionIds,
                ...selectedQuestions.map((q) => q.id),
            ],
        });
        if (easyQuestions.length < rule.easy.count) {
            errors.push(`Không đủ câu hỏi dễ: Cần ${rule.easy.count}, chỉ tìm được ${easyQuestions.length}`);
        }
        else {
            selectedQuestions.push(...easyQuestions.map((q) => ({
                ...q,
                assignedPoints: rule.easy.pointPerQuestion,
            })));
        }
        // Lấy câu trung bình
        const mediumQuestions = await getRandomQuestions({
            subjectId: config.subjectId,
            difficulty: "medium",
            count: rule.medium.count,
            excludeIds: [
                ...existingQuestionIds,
                ...selectedQuestions.map((q) => q.id),
            ],
        });
        if (mediumQuestions.length < rule.medium.count) {
            errors.push(`Không đủ câu hỏi trung bình: Cần ${rule.medium.count}, chỉ tìm được ${mediumQuestions.length}`);
        }
        else {
            selectedQuestions.push(...mediumQuestions.map((q) => ({
                ...q,
                assignedPoints: rule.medium.pointPerQuestion,
            })));
        }
        // Lấy câu khó
        const hardQuestions = await getRandomQuestions({
            subjectId: config.subjectId,
            difficulty: "hard",
            count: rule.hard.count,
            excludeIds: [
                ...existingQuestionIds,
                ...selectedQuestions.map((q) => q.id),
            ],
        });
        if (hardQuestions.length < rule.hard.count) {
            errors.push(`Không đủ câu hỏi khó: Cần ${rule.hard.count}, chỉ tìm được ${hardQuestions.length}`);
        }
        else {
            selectedQuestions.push(...hardQuestions.map((q) => ({
                ...q,
                assignedPoints: rule.hard.pointPerQuestion,
            })));
        }
    }
    else if (config.chapterRules) {
        // ===== CASE 2: Chia theo chương =====
        for (const chapterRule of config.chapterRules) {
            // Kiểm tra chapter tồn tại
            const chapter = await client_1.prisma.chapter.findUnique({
                where: { id: chapterRule.chapterId },
            });
            if (!chapter) {
                errors.push(`Chương ID ${chapterRule.chapterId} không tồn tại`);
                continue;
            }
            if (chapter.subjectId !== config.subjectId) {
                errors.push(`Chương "${chapter.chapterName}" không thuộc môn "${subject.subjectName}"`);
                continue;
            }
            // Lấy câu dễ
            const easyQuestions = await getRandomQuestions({
                subjectId: config.subjectId,
                chapterId: chapterRule.chapterId,
                difficulty: "easy",
                count: chapterRule.easy.count,
                excludeIds: [
                    ...existingQuestionIds,
                    ...selectedQuestions.map((q) => q.id),
                ],
            });
            if (easyQuestions.length < chapterRule.easy.count) {
                errors.push(`Chương ${chapter.chapterName}: Không đủ câu dễ (Cần ${chapterRule.easy.count}, có ${easyQuestions.length})`);
            }
            else {
                selectedQuestions.push(...easyQuestions.map((q) => ({
                    ...q,
                    assignedPoints: chapterRule.easy.pointPerQuestion,
                })));
            }
            // Lấy câu trung bình
            const mediumQuestions = await getRandomQuestions({
                subjectId: config.subjectId,
                chapterId: chapterRule.chapterId,
                difficulty: "medium",
                count: chapterRule.medium.count,
                excludeIds: [
                    ...existingQuestionIds,
                    ...selectedQuestions.map((q) => q.id),
                ],
            });
            if (mediumQuestions.length < chapterRule.medium.count) {
                errors.push(`Chương ${chapter.chapterName}: Không đủ câu trung bình (Cần ${chapterRule.medium.count}, có ${mediumQuestions.length})`);
            }
            else {
                selectedQuestions.push(...mediumQuestions.map((q) => ({
                    ...q,
                    assignedPoints: chapterRule.medium.pointPerQuestion,
                })));
            }
            // Lấy câu khó
            const hardQuestions = await getRandomQuestions({
                subjectId: config.subjectId,
                chapterId: chapterRule.chapterId,
                difficulty: "hard",
                count: chapterRule.hard.count,
                excludeIds: [
                    ...existingQuestionIds,
                    ...selectedQuestions.map((q) => q.id),
                ],
            });
            if (hardQuestions.length < chapterRule.hard.count) {
                errors.push(`Chương ${chapter.chapterName}: Không đủ câu khó (Cần ${chapterRule.hard.count}, có ${hardQuestions.length})`);
            }
            else {
                selectedQuestions.push(...hardQuestions.map((q) => ({
                    ...q,
                    assignedPoints: chapterRule.hard.pointPerQuestion,
                })));
            }
        }
    }
    // 6. Nếu có lỗi thì throw
    if (errors.length > 0) {
        throw new ApiError_1.default(400, errors.join("; "));
    }
    // 7. Thêm câu hỏi vào assignment
    await client_1.prisma.assignmentQuestion.createMany({
        data: selectedQuestions.map((q) => ({
            assignmentId: config.assignmentId,
            questionId: q.id,
        })),
    });
    // 8. Cập nhật điểm cho từng câu hỏi
    for (const q of selectedQuestions) {
        await client_1.prisma.question.update({
            where: { id: q.id },
            data: { points: q.assignedPoints },
        });
    }
    // 9. Cập nhật maxScore của assignment
    await client_1.prisma.assignment.update({
        where: { id: config.assignmentId },
        data: { maxScore: config.totalScore },
    });
    return {
        success: true,
        totalQuestionsAdded: selectedQuestions.length,
        totalScore: config.totalScore,
        questions: selectedQuestions.map((q) => ({
            id: q.id,
            content: q.content,
            difficulty: q.difficulty,
            points: q.assignedPoints,
            chapterId: q.chapterId,
        })),
    };
}
// 🔍 Preview câu hỏi (không lưu vào DB)
async function previewGeneratedQuestions(params) {
    // Similar logic nhưng không save vào DB
    // Chỉ return danh sách câu hỏi preview
    // Code tương tự generateAssignmentQuestions nhưng bỏ bước save
    return {
        preview: true,
        message: "This is a preview. Use the generate API to save to assignment.",
    };
}
