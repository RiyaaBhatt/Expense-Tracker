const mongoose = require("mongoose");
const Expense = require("../../models/Expense");
const connectDB = require("../../config/db");

module.exports = async (req, res) => {
  await connectDB();
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const expenses = await Expense.find();
    return res.status(200).json(expenses);
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
};
