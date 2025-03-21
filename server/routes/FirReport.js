const express = require("express");
const multer = require("multer");
const Report = require("../models/FIRReport");
const router = express.Router();

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Report Urgently
router.post("/submit", upload.single("image"), async (req, res) => {
    try {
        const { location } = req.body;
        const image = req.file ? req.file.path : null;

        if (!image || !location) {
            return res.status(400).json({ message: "Image and location are required" });
        }

        const newReport = new Report({ image, location });
        await newReport.save();

        res.status(201).json({ message: "Report submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

module.exports = router;
