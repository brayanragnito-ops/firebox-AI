import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fireboxRouter from "./firebox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fireboxRouter);

export default router;
