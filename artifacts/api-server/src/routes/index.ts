import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import liveRouter from "./live";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(liveRouter);

export default router;
