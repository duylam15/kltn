import { Router } from "express";
import { getAdminCatalog } from "./catalog.controller";

const r = Router();
r.get("/catalog", getAdminCatalog);
export default r;
