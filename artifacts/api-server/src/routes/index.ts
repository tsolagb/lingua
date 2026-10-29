import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learnerProgressRouter from "./learnerProgress";
import legalAcceptancesRouter from "./legalAcceptances";
import mistakeReportsRouter from "./mistakeReports";
import speechRouter from "./speech";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learnerProgressRouter);
router.use(legalAcceptancesRouter);
router.use(mistakeReportsRouter);
router.use(speechRouter);

export default router;
