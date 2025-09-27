// src/utils/bigint.ts
export function jsonSafe(obj: any) {
    return JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === "bigint" ? Number(value) : value
        )
    );
}
