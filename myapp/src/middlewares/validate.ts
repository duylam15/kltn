import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import snakecaseKeys from "snakecase-keys";

function safeSnakeCase<T>(obj: T): T {
    if (
        obj &&
        typeof obj === "object" &&
        !Array.isArray(obj) &&
        Object.getPrototypeOf(obj) === Object.prototype
    ) {
        return snakecaseKeys(obj as Record<string, unknown>, {
            deep: true,
        }) as T;
    }
    return obj;
}

export const validate =
    (schema: ZodTypeAny) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const transformed = {
                body: safeSnakeCase(req.body),
                query: safeSnakeCase(req.query),
                params: safeSnakeCase(req.params),
            };

            const result = schema.safeParse(transformed);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: result.error.format(),
                });
            }

            (req as any).validated = result.data;
            next();
        } catch (err) {
            console.error("Validate middleware error:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    };

export default validate;
