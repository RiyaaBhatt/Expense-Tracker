import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import Expense from "../../models/Expense";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
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
}
