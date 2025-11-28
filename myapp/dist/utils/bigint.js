"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSafe = jsonSafe;
// src/utils/bigint.ts
function jsonSafe(obj) {
    return JSON.parse(JSON.stringify(obj, (_, value) => typeof value === "bigint" ? Number(value) : value));
}
