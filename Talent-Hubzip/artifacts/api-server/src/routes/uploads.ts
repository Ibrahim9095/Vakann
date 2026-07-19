import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

export const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "application/pdf",
      "audio/webm", "audio/mpeg", "audio/wav", "audio/ogg",
      "video/mp4", "video/webm",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

router.post("/uploads", (req, res, next) => {
  requireAuth(req, res).then((user) => {
    if (!user) return;
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const durationSec = req.body?.durationSec ? Number(req.body.durationSec) : null;
      if (req.file.mimetype.startsWith("audio/")) {
        if (durationSec != null && durationSec > 60) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ error: "Audio recording must be 60 seconds or less" });
          return;
        }
        if (req.file.size > 2 * 1024 * 1024) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ error: "Audio file too large for 1-minute intro" });
          return;
        }
      }

      const publicUrl = `/api/uploads/${req.file.filename}`;
      res.status(201).json({
        url: publicUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        durationSec: durationSec ?? undefined,
      });
    });
  }).catch(next);
});

export default router;
