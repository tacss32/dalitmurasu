const User = require("../models/userModel");
 
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
 
exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const user = new User({ name, email, password });
  await user.save();
  res.status(201).json(user);
};