import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import { connectDB } from "./config/db.js";

import userRouter from "./routes/userRoutes.js";
import carRouter from "./routes/carRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS ko database connection se pehle register karo
app.use(
  cors({
    origin: [
      "https://kar-rental.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Routes
app.use("/api/auth", userRouter);
app.use("/api/cars", carRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

// Health check
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    time: Date.now(),
  });
});

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
