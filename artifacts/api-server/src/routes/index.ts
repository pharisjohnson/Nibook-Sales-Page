import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import paymentsRouter from "./payments";
import bookingsRouter from "./bookings";
import availabilityRouter from "./availability";
import teamRouter from "./team";
import profileRouter from "./profile";
import servicesRouter from "./services";
import waitlistRouter from "./waitlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(paymentsRouter);
router.use(bookingsRouter);
router.use(availabilityRouter);
router.use(teamRouter);
router.use(profileRouter);
router.use(servicesRouter);
router.use(waitlistRouter);

export default router;
