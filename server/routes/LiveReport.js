const express = require("express");
const multer = require("multer");
const FIR = require("../models/LiveReport");
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

// FIR Submission
router.post("/submit", upload.single("file"), async (req, res) => {
    try {
        const { name, location, datetime, subject, description, contact, email, anonymous } = req.body;
        const file = req.file ? req.file.path : null;

        if (!location || !datetime || !subject || !description) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const newFIR = new FIR({ name, location, datetime, subject, description, contact, email, anonymous, file });
        await newFIR.save();

        res.status(201).json({ message: "FIR submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

module.exports = router;
