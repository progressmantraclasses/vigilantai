const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    image: { type: String, required: true },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", ReportSchema);
