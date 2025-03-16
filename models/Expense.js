const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },
  recurring: { type: Boolean, default: false },
  splitBetween: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  perUserAmount: { type: Number },
  dueDate: { type: Date },
});

module.exports = mongoose.model("Expense", ExpenseSchema);
