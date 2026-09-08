const mongoose = require("mongoose");

const resumePaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: String, // set once payment completes
    razorpaySignature: String,

    amount: { type: Number, required: true, default: 50 }, // in rupees
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },

    invoiceNumber: { type: String, unique: true, sparse: true },
    failureReason: String,

    // download history - each time the paid PDF is downloaded
    downloads: [
      {
        downloadedAt: { type: Date, default: Date.now },
        ip: String,
      },
    ],
  },
  { timestamps: true }
);

// Prevents duplicate "paid" transactions being created for the same
// resume+order combo if a webhook or client retry fires twice.
resumePaymentSchema.index(
  { razorpayOrderId: 1, status: 1 },
  { unique: false }
);

module.exports = mongoose.model("ResumePayment", resumePaymentSchema);
