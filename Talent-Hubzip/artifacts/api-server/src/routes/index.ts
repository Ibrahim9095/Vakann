import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import candidatesRouter from "./candidates";
import companiesRouter from "./companies";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import contactRequestsRouter from "./contact_requests";
import paymentsRouter from "./payments";
import ratingsRouter from "./ratings";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import uploadsRouter from "./uploads";
import platformRouter from "./platform";
import matchingRouter from "./matching";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(candidatesRouter);
router.use(companiesRouter);
router.use(jobsRouter);
router.use(applicationsRouter);
router.use(contactRequestsRouter);
router.use(paymentsRouter);
router.use(ratingsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(uploadsRouter);
router.use(platformRouter);
router.use(matchingRouter);
router.use(eventsRouter);

export default router;
