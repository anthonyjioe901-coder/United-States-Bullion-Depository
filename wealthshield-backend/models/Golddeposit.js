const mongoose = require("mongoose");

const GoldDepositSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  depositDate: Date,
  monthlyFee: Number,
  vaultLocation: String,
  status: { type: String, default: "Secured" }
});

module.exports = mongoose.model("GoldDeposit", GoldDepositSchema);
