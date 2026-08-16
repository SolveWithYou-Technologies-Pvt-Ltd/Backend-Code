const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

exports.createTransaction = async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();
    res.status(201).json({ success: true, data: newTransaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};

    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      matchStage.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.date = { $lte: new Date(endDate) };
    }

    const stats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    let totalCredit = 0;
    let totalExpense = 0;

    stats.forEach(stat => {
      if (stat._id === "credit") totalCredit = stat.totalAmount;
      if (stat._id === "expense") totalExpense = stat.totalAmount;
    });

    const netProfit = totalCredit - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalCredit,
        totalExpense,
        netProfit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Transaction ID" });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Transaction ID" });
    }
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Transaction ID" });
    }
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};