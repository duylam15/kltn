"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const snakecase_keys_1 = __importDefault(require("snakecase-keys"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
function isPlainObject(value) {
    return (value !== null &&
        typeof value === "object" &&
        Object.getPrototypeOf(value) === Object.prototype);
}
function unifyKeys(obj) {
    if (!isPlainObject(obj))
        return obj;
    const snake = (0, snakecase_keys_1.default)(obj, { deep: true });
    const camel = (0, camelcase_keys_1.default)(obj, { deep: true });
    return { ...camel, ...snake };
}
const validate = (schema) => (req, res, next) => {
    try {
        const transformed = {
            body: unifyKeys(req.body),
            query: unifyKeys(req.query),
            params: unifyKeys(req.params),
        };
        const result = schema.safeParse(transformed);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: result.error.format(),
            });
        }
        req.validated = result.data;
        next();
    }
    catch (err) {
        console.error("Validate middleware error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.validate = validate;
exports.default = exports.validate;
