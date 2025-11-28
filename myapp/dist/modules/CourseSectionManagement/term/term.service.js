"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTerm = exports.updateTerm = exports.getTerm = exports.listTerms = exports.createTerm = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createTerm = async (data) => {
    const existingTerm = await client_1.prisma.term.findUnique({
        where: { code: data.code },
    });
    if (existingTerm)
        throw new ApiError_1.default(409, "Term code already exists");
    return client_1.prisma.term.create({
        data: {
            code: data.code,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    });
};
exports.createTerm = createTerm;
const listTerms = async (params) => {
    const where = {};
    if (params.q) {
        where.OR = [
            { code: { contains: params.q, mode: "insensitive" } },
            { name: { contains: params.q, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        client_1.prisma.term.findMany({
            where,
            orderBy: { startDate: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.term.count({ where }),
    ]);
    return { items, total };
};
exports.listTerms = listTerms;
const getTerm = (id) => client_1.prisma.term.findUnique({
    where: { id },
    include: {
        courseSections: {
            include: {
                subject: true,
            },
        },
    },
});
exports.getTerm = getTerm;
const updateTerm = (id, data) => client_1.prisma.term.update({
    where: { id },
    data,
});
exports.updateTerm = updateTerm;
const deleteTerm = (id) => client_1.prisma.term.delete({ where: { id } });
exports.deleteTerm = deleteTerm;
