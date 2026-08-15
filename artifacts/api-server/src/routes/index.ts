import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import liveRouter from "./live";
import adminRouter from "./admin";
import workspaceRouter from "./workspace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(liveRouter);
router.use(adminRouter);
router.use(workspaceRouter);

export default router;
