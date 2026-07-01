import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import webhooksRouter from "./webhooks";
import analyticsRouter from "./analytics";
import quotationsRouter from "./quotations";
import arkooLeadRouter from "./arkoo-lead";
import metaWebhookRouter from "./meta-webhook";
import linkedInWebhookRouter from "./linkedin-webhook";
import pifRouter from "./pif";
import analyzeDrawingRouter from "./analyze-drawing";
import { emailValidationRouter } from "./email-validation";
import bomRouter from "./bom";
import otpRouter from "./otp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(webhooksRouter);
router.use(analyticsRouter);
router.use(quotationsRouter);
router.use(arkooLeadRouter);
router.use(metaWebhookRouter);    // Instagram / Meta Lead Ads
router.use(linkedInWebhookRouter); // LinkedIn Lead Gen Forms
router.use(pifRouter);
router.use(analyzeDrawingRouter);
router.use("/email", emailValidationRouter);
router.use("/otp", otpRouter);    // Email & Phone OTP Verification
router.use(bomRouter);

export default router;
