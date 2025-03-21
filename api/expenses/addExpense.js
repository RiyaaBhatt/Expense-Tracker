import cors from 'cors';
import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import Expense from "../../models/Expense";

const corsMiddleware = cors({
  origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
  methods: ['POST'],
  credentials: true,
});

const handler = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  console.log(token, "token");
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    console.log(process.env.JWT_SECRET);
    const { category, amount, description, recurring, dueDate } = req.body;
    console.log(req.body);
    const expense = await Expense.create({
      userId,
      category,
      amount,
      description,
      recurring,
      dueDate,
    });
    res.status(201).json(expense);
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
