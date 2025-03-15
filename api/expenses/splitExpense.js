module.exports = async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    try {
      const { totalAmount, people } = req.body;
      const perPersonAmount = totalAmount / people.length;
  
      return res.status(200).json({
        message: "Expense split successfully",
        perPersonAmount,
        details: people.map(person => ({ name: person, amount: perPersonAmount }))
      });
    } catch (error) {
      return res.status(500).json({ error: "Server Error", details: error.message });
    }
  };
  