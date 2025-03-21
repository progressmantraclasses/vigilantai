const mongoose = require("mongoose");

const FIRSchema = new mongoose.Schema({
    name: { type: String },
    location: { type: String, required: true },
    datetime: { type: Date, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    contact: { type: String },
    email: { type: String },
    anonymous: { type: Boolean, default: false },
    file: { type: String },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FIR", FIRSchema);
