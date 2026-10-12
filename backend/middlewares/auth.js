import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = 'your_jwt_secret_key';

export default async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided" 
        });
    }
    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select("-password");
        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verifying failed:", error);
        return res.status(401).json({
            success: false,
            message: " Token missing invalid or expired"
        });
    }
}