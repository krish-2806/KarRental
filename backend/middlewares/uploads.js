import multer from "multer";
import path from "path";
import fs from "fs";

const isVercel = process.env.VERCEL === "1";

let storage;

if (isVercel) {
    // Vercel: Keep uploaded files in memory.
    // Do not create folders on Vercel's read-only filesystem.
    storage = multer.memoryStorage();
} else {
    // Local development: Save files in the uploads folder.
    const uploadDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const base = path
                .basename(file.originalname, ext)
                .replace(/\s+/g, "-");

            cb(null, `${base}-${Date.now()}${ext}`);
        }

    });
}

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});
