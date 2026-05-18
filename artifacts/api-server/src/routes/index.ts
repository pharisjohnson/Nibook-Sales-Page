import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentsRouter from "./payments";
import bookingsRouter from "./bookings";
import availabilityRouter from "./availability";
import teamRouter from "./team";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentsRouter);
router.use(bookingsRouter);
router.use(availabilityRouter);
router.use(teamRouter);
router.use(profileRouter);

export default router;
