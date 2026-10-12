import mongoose from "mongoose";
import User from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// TOKEN
const TOKEN_EXPIRES_IN = "24h";
const JWT_SECRET =
    process.env.JWT_SECRET || "your_jwt_secret_key";

const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role || "user"
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );
};

// REGISTER USER
export const register = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const emailRaw = String(req.body.email || "").trim();
        const email = validator.normalizeEmail(emailRaw, { gmail_remove_dots: false }) || emailRaw.toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const exists = await User.findOne({ email }).lean();
        if (exists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const newId = new mongoose.Types.ObjectId();
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            _id: newId,
            name,
            email,
            password: hashedPassword,
            role: "user",
        });
        await user.save();
        console.log("User registered with email:", email);

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// LOGIN FUNCTION
export async function login(req, res) {
    try {
        const emailRaw = String(req.body.email || "").trim();
        const email = validator.normalizeEmail(emailRaw, { gmail_remove_dots: false }) || emailRaw.toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = createToken(user);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user",
            }
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}