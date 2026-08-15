import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import fireboxRouter from "./firebox";
import teamsRouter from "./teams";
import monitoringRouter from "./monitoring";
import cicdRouter from "./cicd";
import marketplaceRouter from "./marketplace";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(fireboxRouter);
router.use("/api", teamsRouter);
router.use("/api", monitoringRouter);
router.use("/api", cicdRouter);
router.use("/api", marketplaceRouter);

export default router;
