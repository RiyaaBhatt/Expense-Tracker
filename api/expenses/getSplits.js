import cors from 'cors';
import jwt from "jsonwebtoken";
import connectDB from "../../config/db";
import Expense from "../../models/Expense";
// import User from "../../models/User";  // Add this import

const corsMiddleware = cors({
    origin: ['http://localhost:5000', 'https://pennywisefrontend.vercel.app/'],
    methods: ['GET'],
    credentials: true,
});

const handler = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    await connectDB();

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.userId) {
            return res.status(401).json({ error: "Invalid token format" });
        }
        const userId = decoded.userId;

        // Updated query to properly populate split details
        const splits = await Expense.find({
            $or: [
                { userId: userId },
                { 'splitBetween': { $in: [userId] } }
            ],
            category: "Split Expense"
        })

        console.log("User ID:", userId);
        console.log("Found splits:", JSON.stringify(splits, null, 2));

        if (!splits || splits.length === 0) {
            return res.status(200).json([]); // Return empty array instead of 404
        }

        const formattedSplits = splits.map(split => ({
            split_name: split.description || "Split Expense",
            total_people: (split.splitBetween?.length || 0) + 1,
            date: split.date.toLocaleDateString(),
            amount: split.perUserAmount || split.amount, // Use perUserAmount if available
            total_amount: split.amount * ((split.splitBetween?.length || 0)),
            participants: [
                ...(split.splitBetween || []).map(user => ({
                    name: user.name,
                    email: user.email
                }))
            ]
        }));

        res.status(200).json(formattedSplits);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Invalid token" });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Token expired" });
        } else {
            console.error('Server error:', error);
            return res.status(500).json({ error: "Internal server error", message: error.message });
        }
    }
};

export default async function wrappedHandler(req, res) {
    return new Promise((resolve, reject) => {
        corsMiddleware(req, res, (err) => {
            if (err) return reject(err);
            return resolve(handler(req, res));
        });
    });
}
