const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },
  recurring: { type: Boolean, default: false },
  dueDate: { type: Date },
});

module.exports = mongoose.model("Expense", ExpenseSchema);
