module.exports = (req, res) => {
  res.status(200).json({ message: "Hello, this is test api of production!" });
};
