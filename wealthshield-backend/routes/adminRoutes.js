const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const router = express.Router();

const requireAdmin = async (req, res, next) => {
	if (req.user?.role === "admin") return next();

	const user = await User.findById(req.user.id);
	if (!user || user.role !== "admin") {
		return res.status(403).json({ message: "Admin access required" });
	}
	req.user.role = user.role;
	next();
};

router.use(auth, requireAdmin);

router.get("/summary", async (req, res) => {
	const [users, transactions] = await Promise.all([
		User.find({}),
		Transaction.find({}).sort({ createdAt: -1 })
	]);

	const totalUsers = users.length;
	const pendingRequests = transactions.filter(t => t.status === "Pending").length;
	const totalGold = users.reduce((sum, u) => sum + (u.totalGold || 0), 0);
	const totalValue = users.reduce((sum, u) => sum + (u.currentValue || 0), 0);

	res.json({ totalUsers, totalGold, totalValue, pendingRequests });
});

router.get("/deposits", async (req, res) => {
	const deposits = await Transaction.find({ type: "deposit" })
		.sort({ createdAt: -1 });
	res.json({ deposits });
});

router.get("/withdrawals", async (req, res) => {
	const withdrawals = await Transaction.find({ type: "withdrawal" })
		.sort({ createdAt: -1 });
	res.json({ withdrawals });
});

router.get("/transactions", async (req, res) => {
	const transactions = await Transaction.find({}).sort({ createdAt: -1 });
	res.json({ transactions });
});

router.get("/users", async (req, res) => {
	const users = await User.find({}).sort({ createdAt: -1 });

	const result = users.map(u => ({
		id: u._id,
		fullName: u.fullName,
		email: u.email,
		role: u.role,
		accountId: u.accountId,
		nextOfKin: u.nextOfKin || "",
		totalGold: u.totalGold || 0,
		currentValue: u.currentValue || 0,
		monthlyFees: u.monthlyFees || 0,
		lastDepositDate: u.lastDepositDate,
		vaultLocation: u.vaultLocation || "Main Vault",
		notes: u.notes || "",
		createdAt: u.createdAt
	}));

	res.json({ users: result });
});

router.get("/users/:id", async (req, res) => {
	const user = await User.findById(req.params.id);
	if (!user) return res.status(404).json({ message: "User not found" });

	res.json({
		id: user._id,
		fullName: user.fullName,
		email: user.email,
		role: user.role,
		accountId: user.accountId,
		nextOfKin: user.nextOfKin || "",
		totalGold: user.totalGold || 0,
		currentValue: user.currentValue || 0,
		monthlyFees: user.monthlyFees || 0,
		lastDepositDate: user.lastDepositDate,
		vaultLocation: user.vaultLocation || "Main Vault",
		notes: user.notes || "",
		createdAt: user.createdAt
	});
});

router.patch("/users/:id", async (req, res) => {
	const { totalGold, currentValue, monthlyFees, lastDepositDate, vaultLocation, notes, nextOfKin } = req.body;

	const updateData = {};
	if (totalGold !== undefined) updateData.totalGold = Number(totalGold);
	if (currentValue !== undefined) updateData.currentValue = Number(currentValue);
	if (monthlyFees !== undefined) updateData.monthlyFees = Number(monthlyFees);
	if (nextOfKin !== undefined) updateData.nextOfKin = nextOfKin;
	if (lastDepositDate !== undefined) updateData.lastDepositDate = lastDepositDate ? new Date(lastDepositDate) : null;
	if (vaultLocation !== undefined) updateData.vaultLocation = vaultLocation;
	if (notes !== undefined) updateData.notes = notes;

	const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
	if (!user) return res.status(404).json({ message: "User not found" });

	res.json({
		message: "User updated successfully",
		user: {
			id: user._id,
			fullName: user.fullName,
			email: user.email,
			nextOfKin: user.nextOfKin || "",
			totalGold: user.totalGold,
			currentValue: user.currentValue,
			monthlyFees: user.monthlyFees,
			lastDepositDate: user.lastDepositDate,
			vaultLocation: user.vaultLocation,
			notes: user.notes
		}
	});
});

router.post("/transactions/:id/approve", async (req, res) => {
	const transaction = await Transaction.findByIdAndUpdate(
		req.params.id,
		{ status: "Approved" },
		{ new: true }
	);
	if (!transaction) return res.status(404).json({ message: "Not found" });
	res.json({ message: "Approved", transaction });
});

router.post("/transactions/:id/reject", async (req, res) => {
	const transaction = await Transaction.findByIdAndUpdate(
		req.params.id,
		{ status: "Rejected" },
		{ new: true }
	);
	if (!transaction) return res.status(404).json({ message: "Not found" });
	res.json({ message: "Rejected", transaction });
});

router.patch("/password", async (req, res) => {
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

router.patch("/user-role", async (req, res) => {
	const { email, role } = req.body;
	if (!email || !role || !["user", "admin"].includes(role)) {
		return res.status(400).json({ message: "Invalid email or role" });
	}

	const user = await User.findOne({ email });
	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	user.role = role;
	await user.save();

	res.json({ message: `User role updated to ${role}`, user: { email: user.email, role: user.role } });
});

module.exports = router;
