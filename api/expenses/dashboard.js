import jwt from "jsonwebtoken";
import dbConnect from "../../config/db";
import Expense from "../../models/Expense";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent transactions count (last 7 days)
    const recentTransactionsCount = await Expense.countDocuments({
      userId,
      date: { $gte: sevenDaysAgo },
    });

    // Get upcoming payments (dueDate in the future)
    const upcomingPayments = await Expense.find({
      userId,
      dueDate: { $gte: new Date() },
    }).sort({ dueDate: 1 });

    const upcomingPaymentsCount = upcomingPayments.length;

    res.status(200).json({
      recentTransactionsCount,
      upcomingPaymentsCount,
      upcomingPayments,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
