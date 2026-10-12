import Booking from "../models/bookingModel.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import Car from '../models/carModel.js';

dotenv.config();

const CLIENT_URL = 'http://localhost:5173';

// GET RAZORPAY FROM .ENV
const getRazorpay = () => {
    if (
        !process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET
    ) {
        throw new Error("Razorpay credentials are missing");
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// CREATE A BOOKING BY PAYMENT DONE
export const createCheckoutSession = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Missing request body"
            });
        }
        const {
            userId,
            customer,
            email,
            phone,
            car,
            pickupDate,
            returnDate,
            amount,
            details,
            address,
            carImage,
        } = req.body;

        //MINIMUM VALIDATION
        const total = Number(amount);
        if (!total || Number.isNaN(total) || total <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        if (!pickupDate || !returnDate) return res.status(400).json({ success: false, message: "pickupDate and returnDate required" });

        const pd = new Date(pickupDate);
        const rd = new Date(returnDate);
        if (Number.isNaN(pd.getTime()) || Number.isNaN(rd.getTime())) return res.status(400).json({ success: false, message: "Invalid dates" });
        if (rd < pd) return res.status(400).json({ success: false, message: "returnDate must be same or after pickupDate" });

        let carField = car;
        if (typeof car === 'string') {
            try { carField = JSON.parse(car); }
            catch { carField = { name: car } }
        }

        // create booking (pending)
        const booking = await Booking.create({
            userId: userId,
            customer: String(customer ?? ""),
            email: String(email ?? ""),
            phone: String(phone ?? ""),
            car: carField ?? {},
            carImage: String(carImage ?? ""),
            pickupDate: pd,
            returnDate: rd,
            amount: total,
            paymentStatus: "pending",
            details: typeof details === "string" ? JSON.parse(details) : (details || {}),
            address: typeof address === "string" ? JSON.parse(address) : (address || {}),
            status: "pending",
            currency: "INR",
        });

        let razorpay;
        try { razorpay = getRazorpay(); } catch (err) {
            await Booking.findByIdAndDelete(booking._id).catch(() => { });
            return res.status(500).json({
                success: false,
                message: "Payment not configure", err: err.message
            })
        }

        // CREATE RAZORPAY ORDER
        let order;

        try {
            order = await razorpay.orders.create({
                amount: Math.round(total * 100),
                currency: "INR",
                receipt: booking._id.toString(),
                notes: {
                    bookingId: booking._id.toString(),
                    userId: String(userId ?? "")
                }
            });
        } catch (razorpayErr) {
            console.error("Razorpay Order Error:", razorpayErr);

            await Booking.findByIdAndDelete(booking._id).catch(() => { });

            return res.status(500).json({
                success: false,
                message: "Failed to create Razorpay order",
                error: razorpayErr.message || String(razorpayErr)
            });
        }

        booking.sessionId = order.id;
        await booking.save();

        return res.status(200).json({
            success: true,
            bookingId: booking._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    }
    catch (err) {
        console.error('CheckoutSession Error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal Server Error'
        })
    }
}

//SUCCESS PAYMENT VERIFICATION
// VERIFY RAZORPAY PAYMENT
export const confirmPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay payment details"
            });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "Razorpay secret is not configured"
            });
        }

        // Verify payment signature on the server
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const signatureBuffer = Buffer.from(razorpay_signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");

        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        const razorpay = getRazorpay();

        // Fetch payment from Razorpay to verify its actual status
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not captured or order does not match"
            });
        }

        // Find the booking created for this order
        const booking = await Booking.findOne({
            sessionId: razorpay_order_id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found for this order"
            });
        }

        // Check that the paid amount matches the booking amount
        if (payment.amount !== Math.round(Number(booking.amount) * 100)) {
            return res.status(400).json({
                success: false,
                message: "Payment amount does not match booking amount"
            });
        }

        // Update booking after successful payment verification
        booking.paymentStatus = "paid";
        booking.status = "active";
        booking.paymentIntentId = razorpay_payment_id;

        await booking.save();

        // Find the car booked by the customer
        const carId = booking.car?.id || booking.car?._id;

        if (carId) {
            const car = await Car.findById(carId);

            if (!car) {
                console.error("Booked car not found:", carId);
            } else {
                // Prevent adding the same booking twice
                const alreadyAdded = car.bookings.some(
                    (item) =>
                        item.bookingId.toString() === booking._id.toString()
                );

                if (!alreadyAdded) {
                    car.bookings.push({
                        bookingId: booking._id,
                        pickupDate: booking.pickupDate,
                        returnDate: booking.returnDate,
                        status: "active",
                    });

                    await car.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order: booking
        });

    } catch (err) {
        console.error("ConfirmPayment Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

export const handlePaymentFailure = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;

        if (!razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order ID is required",
            });
        }

        const booking = await Booking.findOne({
            sessionId: razorpay_order_id,
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Never cancel a successfully paid booking
        if (booking.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "This booking is already paid",
            });
        }

        const razorpay = getRazorpay();

        // Verify the order with Razorpay
        const order = await razorpay.orders.fetch(razorpay_order_id);

        if (order.status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid. Verify payment before cancelling.",
            });
        }

        // Mark booking as cancelled
        booking.paymentStatus = "failed";
        booking.status = "cancelled";

        await booking.save();

        // Get car ID from booking
        const carId = booking.car?.id || booking.car?._id;

        if (carId) {
            // Remove only this booking from the car's booking list
            const result = await Car.updateOne(
                { _id: carId },
                {
                    $pull: {
                        bookings: {
                            bookingId: booking._id,
                        },
                    },
                }
            );

            console.log("Failed booking removed from car:", {
                carId,
                bookingId: booking._id.toString(),
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            });
        } else {
            console.error(
                "Car ID missing from cancelled booking:",
                booking._id.toString()
            );
        }

        return res.status(200).json({
            success: true,
            message: "Failed payment booking cancelled",
        });

    } catch (error) {
        console.error("Payment failure error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Could not cancel failed booking",
        });
    }

};