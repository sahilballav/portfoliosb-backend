import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Resend } from "resend";

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.options("*", cors());

app.use(express.json());

/* =========================
   MongoDB Connection
========================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* =========================
   Schema
========================= */
const contactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    message: String,
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);

/* =========================
   Resend Client
========================= */
const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   Routes
========================= */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* Contact Form API */
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false });
    }

    // Save to MongoDB
    await Contact.create({ name, email, message });

    // Send Email via Resend
    await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to: process.env.EMAIL_TO,
      subject: "📩 New Portfolio Message",
      text: `
New Contact Message

Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Resend error:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
