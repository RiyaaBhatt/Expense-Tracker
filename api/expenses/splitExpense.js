import cors from 'cors';
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import connectDB from "../../config/db";
import User from "../../models/User";
import Expense from "../../models/Expense";

const corsMiddleware = cors({
  origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
  methods: ['POST'],
  credentials: true,
});

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId: initiatorId } = jwt.verify(token, process.env.JWT_SECRET);
    let { totalAmount, people, description } = req.body;

    // Find users by their emails to get their ObjectIds
    const participants = await User.find({ email: { $in: people } });
    const participantIds = participants.map(user => user._id);

    const perPersonAmount = totalAmount / (participantIds.length);

    // Create the main expense record for the initiator
    const mainExpense = await Expense.create({
      userId: initiatorId,
      amount: perPersonAmount,
      description: description || "Split Expense",
      category: "Split Expense",
      recurring: false,
      splitBetween: participantIds,
      perUserAmount: perPersonAmount,
      date: new Date()
    });

    // Create expense records for other participants
    const participantExpenses = await Promise.all(
      participantIds.map(async (participantId) => {
        return await Expense.create({
          userId: participantId,
          amount: perPersonAmount,
          description: description || "Split Expense",
          category: "Split Expense",
          recurring: false,
          splitBetween: [initiatorId],
          perUserAmount: perPersonAmount,
          date: new Date()
        });
      })
    );

    // Send email notifications using the existing participants array
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true,
      logger: true,
    });

    await Promise.all(
      participants.map(async (user) => {
        try {
          const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: "Expense Split Notification",
            text: `Hello ${user.name},\n\nAn expense of $${perPersonAmount} has been split with you.\n\nTotal Amount: $${totalAmount}\nYou owe: $${perPersonAmount}\n\nThanks!`,
          };

          const info = await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent to ${user.email}:`, info.messageId);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${user.email}:`, emailError);
        }
      })
    );

    return res.status(200).json({
      message: "Split created successfully",
      perPersonAmount,
      details: [mainExpense, ...participantExpenses].map(expense => ({
        userId: expense.userId,
        amount: expense.amount
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
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
