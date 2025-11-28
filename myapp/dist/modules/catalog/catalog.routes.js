"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalog_controller_1 = require("./catalog.controller");
const r = (0, express_1.Router)();
r.get("/catalog", catalog_controller_1.getAdminCatalog);
exports.default = r;
