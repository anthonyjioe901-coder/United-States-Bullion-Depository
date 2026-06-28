const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  accountId: String,
  role: { type: String, default: "user" },
  // Admin-controlled gold storage fields
  totalGold: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  monthlyFees: { type: Number, default: 0 },
  lastDepositDate: { type: Date, default: null },
  vaultLocation: { type: String, default: "Main Vault" },
  notes: { type: String, default: "" },
  nextOfKin: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
