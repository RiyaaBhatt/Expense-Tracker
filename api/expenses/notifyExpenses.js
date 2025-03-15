const mongoose = require("mongoose");
const Expense = require("../../models/Expense");
const connectDB = require("../../config/db");

module.exports = async (req, res) => {
  await connectDB();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const today = new Date();
    const upcomingExpenses = await Expense.find({
      dueDate: { $gte: today, $lte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      message: "Upcoming recurring expenses",
      expenses: upcomingExpenses,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
};
