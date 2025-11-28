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
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.remove = remove;
exports.getByAssignment = getByAssignment;
exports.getByQuestion = getByQuestion;
const service = __importStar(require("./assignmentQuestion.service"));
async function add(req, res) {
    const { assignmentId, questionId } = req.validated.params;
    const data = await service.addQuestionToAssignment(assignmentId, questionId);
    res.json({ success: true, data });
}
async function remove(req, res) {
    const { assignmentId, questionId } = req.validated.params;
    await service.removeQuestionFromAssignment(assignmentId, questionId);
    res.json({ success: true });
}
async function getByAssignment(req, res) {
    const { assignmentId } = req.validated.params;
    const data = await service.getQuestionsByAssignment(assignmentId);
    res.json({ success: true, data });
}
async function getByQuestion(req, res) {
    const { questionId } = req.validated.params;
    const data = await service.getAssignmentsByQuestion(questionId);
    res.json({ success: true, data });
}
