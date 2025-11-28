"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestCase = exports.updateTestCase = exports.getTestCase = exports.listTestCases = exports.createTestCase = exports.getTotalPoints = exports.getPublicTestCases = exports.getTestCasesByQuestion = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const getTestCasesByQuestion = (questionId) => {
    return client_1.prisma.testCase.findMany({
        where: { questionId },
        orderBy: { order: "asc" },
    });
};
exports.getTestCasesByQuestion = getTestCasesByQuestion;
const getPublicTestCases = (questionId) => {
    return client_1.prisma.testCase.findMany({
        where: { questionId, isHidden: false },
        orderBy: { order: "asc" },
    });
};
exports.getPublicTestCases = getPublicTestCases;
const getTotalPoints = async (questionId) => {
    const result = await client_1.prisma.testCase.aggregate({
        where: { questionId },
        _sum: { points: true },
    });
    return result._sum.points || 0;
};
exports.getTotalPoints = getTotalPoints;
const createTestCase = async (data) => {
    // kiểm tra question tồn tại
    const question = await client_1.prisma.question.findUnique({
        where: { id: data.questionId },
    });
    if (!question)
        throw new ApiError_1.default(404, "Question not found");
    return client_1.prisma.testCase.create({
        data: {
            questionId: data.questionId,
            input: data.input,
            expectedOutput: data.expectedOutput,
            isHidden: data.isHidden ?? false,
            points: data.points ?? 0,
            order: data.order ?? 0,
        },
    });
};
exports.createTestCase = createTestCase;
const listTestCases = async (params) => {
    const where = {};
    if (params.questionId)
        where.questionId = params.questionId;
    const [items, total] = await Promise.all([
        client_1.prisma.testCase.findMany({
            where,
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            orderBy: { order: "asc" },
        }),
        client_1.prisma.testCase.count({ where }),
    ]);
    return { items, total };
};
exports.listTestCases = listTestCases;
const getTestCase = (id) => client_1.prisma.testCase.findUnique({ where: { id } });
exports.getTestCase = getTestCase;
const updateTestCase = (id, data) => client_1.prisma.testCase.update({
    where: { id },
    data,
});
exports.updateTestCase = updateTestCase;
const deleteTestCase = (id) => client_1.prisma.testCase.delete({ where: { id } });
exports.deleteTestCase = deleteTestCase;
