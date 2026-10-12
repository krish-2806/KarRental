import express from 'express';
import { createCheckoutSession, confirmPayment, handlePaymentFailure } from '../controllers/paymentController.js';


const paymentRouter = express.Router();

paymentRouter.post('/create-checkout-session', createCheckoutSession);
paymentRouter.post('/confirm', confirmPayment);
paymentRouter.post("/failed", handlePaymentFailure);


export default paymentRouter;