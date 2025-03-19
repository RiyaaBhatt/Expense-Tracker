// import jwt from "jsonwebtoken";
// import connectDB from "../../config/db";
// import User from "../../models/User";
// import Expense from "../../models/Expense";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   await connectDB();

//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ error: "Unauthorized" });

//   try {
//     // Extract userId from JWT (initiator)
//     const { userId: initiatorId } = jwt.verify(token, process.env.JWT_SECRET);
//     let { totalAmount, people } = req.body;

//     // Ensure the initiator is included in the split
//     if (!people.includes(initiatorId)) {
//       people.push(initiatorId);
//     }

//     // Fetch existing users from the database
//     const existingUsers = await User.find({ _id: { $in: people } });

//     if (existingUsers.length !== people.length) {
//       return res.status(400).json({ error: "Some users do not exist" });
//     }

//     // Split expense among all participants
//     const perPersonAmount = totalAmount / existingUsers.length;

//     // Save expenses for each user
//     const expenses = await Promise.all(
//       existingUsers.map(async (user) => {
//         return await Expense.create({
//           userId: user._id,
//           amount: perPersonAmount,
//           description: "Split Expense",
//           category: "Shared Expense",
//           recurring: false,
//           dueDate: new Date(),
//         });
//       })
//     );

//     return res.status(200).json({
//       message: "Expense split successfully",
//       perPersonAmount,
//       details: expenses.map((expense) => ({
//         userId: expense.userId,
//         amount: expense.amount,
//       })),
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ error: "Server Error", details: error.message });
//   }
// }
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import connectDB from "../../config/db";
import User from "../../models/User";
import Expense from "../../models/Expense";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await connectDB();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Extract userId from JWT (initiator)
    const { userId: initiatorId } = jwt.verify(token, process.env.JWT_SECRET);
    let { totalAmount, people } = req.body;

    // Ensure the initiator is included in the split
    if (!people.includes(initiatorId)) {
      people.push(initiatorId);
    }

    // Fetch users from database (including emails)
    const existingUsers = await User.find({ _id: { $in: people } });

    if (existingUsers.length !== people.length) {
      return res.status(400).json({ error: "Some users do not exist" });
    }

    // Split expense among all participants
    const perPersonAmount = totalAmount / existingUsers.length;

    // Save expenses for each user
    const expenses = await Promise.all(
      existingUsers.map(async (user) => {
        return await Expense.create({
          userId: user._id,
          amount: perPersonAmount,
          description: "Split Expense",
          category: "Shared Expense",
          recurring: false,
          dueDate: new Date(),
        });
      })
    );

    // 📩 Send Email Notifications to Split Users
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
      existingUsers.map(async (user) => {
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
          console.error(
            `❌ Failed to send email to ${user.email}:`,
            emailError
          );
        }
      })
    );

    return res.status(200).json({
      message: "Expense split successfully and notifications sent",
      perPersonAmount,
      details: expenses.map((expense) => ({
        userId: expense.userId,
        amount: expense.amount,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server Error", details: error.message });
  }
}
