import cors from 'cors';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import User from "../../models/User";

// CORS middleware configuration
const corsMiddleware = cors({
  origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
  methods: ['POST'],
  credentials: true,
});

// Wrapper for API handler with CORS
const handler = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Export the handler wrapped with CORS middleware
export default async function wrappedHandler(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve(handler(req, res));
    });
  });
}
