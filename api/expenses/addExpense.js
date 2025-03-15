const mongoose = require("mongoose");
const Expense = require("../../models/Expense");
const connectDB = require("../../config/db");

module.exports = async (req, res) => {
  await connectDB();
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { description, amount, category, recurring, dueDate } = req.body;
    const newExpense = new Expense({ description, amount, category, recurring, dueDate });
    await newExpense.save();
    return res.status(201).json({ message: "Expense added successfully", newExpense });
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
};
