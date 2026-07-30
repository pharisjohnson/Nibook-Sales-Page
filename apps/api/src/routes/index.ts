import { Router } from "express";
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
import integrationsRouter from "./integrations";
import mcpRouter from "./mcp";
import { apiLimiter, authLimiter, uploadLimiter } from "../middlewares/rateLimiter.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use("/auth", authLimiter);
router.use("/upload", uploadLimiter);
router.use(apiLimiter);

router.use(healthRouter);
router.use(authRouter);

router.use(paymentsRouter);

router.use(waitlistRouter);

const publicProfileRouter = Router();
publicProfileRouter.use(profileRouter);
router.use(publicProfileRouter);

const protectedRouter = Router();
protectedRouter.use(requireAuth);

protectedRouter.use(bookingsRouter);
protectedRouter.use(availabilityRouter);
protectedRouter.use(teamRouter);
protectedRouter.use(servicesRouter);
protectedRouter.use(uploadRouter);
protectedRouter.use("/admin", adminRouter);

router.use(protectedRouter);
router.use(integrationsRouter);
router.use(mcpRouter);

export default router;
