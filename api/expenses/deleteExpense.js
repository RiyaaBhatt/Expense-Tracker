import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import Expense from "../../models/Expense";

export default async function handler(req, res) {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "Method Not Allowed" });

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.query;

    const expense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!expense) return res.status(404).json({ error: "Expense not found" });

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
