import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import snakecaseKeys from "snakecase-keys";
import camelcaseKeys from "camelcase-keys";

function isPlainObject(value: any): value is Record<string, any> {
    return (
        value !== null &&
        typeof value === "object" &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

function unifyKeys<T>(obj: T): T {
    if (!isPlainObject(obj)) return obj;

    const snake = snakecaseKeys(obj, { deep: true });
    const camel = camelcaseKeys(obj, { deep: true });

    return { ...camel, ...snake } as T;
}

export const validate =
    (schema: ZodTypeAny) =>
    (req: Request, res: Response, next: NextFunction) => {
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
