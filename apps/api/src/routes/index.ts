import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import paymentsRouter from "./payments";
import subscriptionsRouter from "./subscriptions";
import bookingsRouter from "./bookings";
import availabilityRouter from "./availability";
import teamRouter from "./team";
import profileRouter from "./profile";
import servicesRouter from "./services";
import waitlistRouter from "./waitlist";
import uploadRouter from "./upload";
import adminRouter from "./admin";
import jengaPaymentsRouter from "./jenga-payments";
import integrationsRouter from "./integrations";
import mcpRouter from "./mcp";
import { apiLimiter, authLimiter, uploadLimiter } from "../middlewares/rateLimiter.js";

const router: IRouter = Router();

router.use("/auth", authLimiter);
router.use("/upload", uploadLimiter);
router.use(apiLimiter);

router.use(healthRouter);
router.use(authRouter);
router.use(paymentsRouter);
router.use(subscriptionsRouter);
router.use(bookingsRouter);
router.use(availabilityRouter);
router.use(teamRouter);
router.use(profileRouter);
router.use(servicesRouter);
router.use(waitlistRouter);
router.use(uploadRouter);
router.use(adminRouter);
router.use(jengaPaymentsRouter);
router.use(integrationsRouter);
router.use(mcpRouter);

export default router;
