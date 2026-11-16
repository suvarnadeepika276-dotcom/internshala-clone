const mongoose = require("mongoose");
const Applicationipschema = new mongoose.Schema({
    company: String,
    category: String,
    coverLetter: String,
    user: Object,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["accepted", "pending", "rejected"],
        default: "pending",
    },
    Application: Object,
    attachedResume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
    resumePdfUrl: String,
});
module.exports = mongoose.model("Application", Applicationipschema);
