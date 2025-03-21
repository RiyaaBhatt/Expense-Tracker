import cors from 'cors';
import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import Expense from "../../models/Expense";

const corsMiddleware = cors({
  origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
  methods: ['PUT'],
  credentials: true,
});

const handler = async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.query;
    const updateData = req.body;

    const expense = await Expense.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });

    if (!expense) return res.status(404).json({ error: "Expense not found" });

    res.status(200).json(expense);
  } catch (error) {
    console.error(error);
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
