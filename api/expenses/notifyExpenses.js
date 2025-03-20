const connectDB = require("../../config/db");
const Expense = require("../../models/Expense");
const nodemailer = require("nodemailer");
const User = require("../../models/User");

module.exports = async (req, res) => {
  await connectDB();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to 00:00 UTC

    // Convert to IST by adding 5 hours 30 minutes
    const todayIST = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    console.log("IST Today:", todayIST);

    const twoDaysAheadIST = new Date(todayIST);
    twoDaysAheadIST.setDate(todayIST.getDate() + 2);
    console.log("IST Two Days Ahead:", twoDaysAheadIST);

    const upcomingExpenses = await Expense.find({
      dueDate: {
        $gte: todayIST,
        $lt: twoDaysAheadIST,
      },
    });

    if (upcomingExpenses.length === 0) {
      return res.status(200).json({ message: "No upcoming expenses" });
    }

    // Send email notifications
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    for (const expense of upcomingExpenses) {
      const user = await User.findById(expense.userId);
      if (user) {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: user.email,
          subject: "Upcoming Expense Reminder",
          text: `Hello ${user.name},\n\nYou have an upcoming expense of $${
            expense.amount
          } due on ${expense.dueDate.toDateString()}.\n\nPlease ensure timely payment.\n\nThanks!`,
        });
      }
    }

    return res.status(200).json({
      message: "Upcoming expenses retrieved and emails sent",
      expenses: upcomingExpenses,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server Error", details: error.message });
  }
};
