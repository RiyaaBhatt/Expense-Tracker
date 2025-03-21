import cors from 'cors';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import User from "../../models/User";

const corsMiddleware = cors({
  origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
  methods: ['POST'],
  credentials: true,
});

const handler = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const { name, email, password } = req.body;

  try {
    console.log(req.body);
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "User registered", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

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
