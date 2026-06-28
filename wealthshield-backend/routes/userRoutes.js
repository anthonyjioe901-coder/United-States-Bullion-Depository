const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", auth, async (req, res) => {
  const [transactions, user] = await Promise.all([
    Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20),
    User.findById(req.user.id)
  ]);

  const pendingCount = transactions.filter(t => t.status === "Pending").length;

  // Use admin-set values from user document
  res.json({
    totalGold: user?.totalGold || 0,
    currentValue: user?.currentValue || 0,
    monthlyFees: user?.monthlyFees || 0,
    lastDepositDate: user?.lastDepositDate || null,
    vaultLocation: user?.vaultLocation || "Main Vault",
    pendingCount,
    transactions,
    user: user ? {
      fullName: user.fullName,
      email: user.email,
      accountId: user.accountId,
      createdAt: user.createdAt,
      nextOfKin: user.nextOfKin
    } : null
  });
});

router.get("/transactions", auth, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id })
    .sort({ createdAt: -1 });
  res.json({ transactions });
});

router.post("/deposit-requests", auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  const transaction = await Transaction.create({
    userId: req.user.id,
    type: "deposit",
    amount,
    status: "Pending"
  });

  res.json({ message: "Deposit request submitted", transaction });
});

router.post("/withdraw-requests", auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  const transaction = await Transaction.create({
    userId: req.user.id,
    type: "withdrawal",
    amount,
    status: "Pending"
  });

  res.json({ message: "Withdrawal request submitted", transaction });
});

router.patch("/profile", auth, async (req, res) => {
  const { fullName, email, nextOfKin } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const updatePayload = { fullName, email };
  if (nextOfKin !== undefined) updatePayload.nextOfKin = nextOfKin;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updatePayload,
    { new: true }
  );

  res.json({
    message: "Profile updated",
    user: { fullName: user.fullName, email: user.email, nextOfKin: user.nextOfKin }
  });
});

router.patch("/password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const user = await User.findById(req.user.id);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  res.json({ message: "Password updated" });
});

module.exports = router;
