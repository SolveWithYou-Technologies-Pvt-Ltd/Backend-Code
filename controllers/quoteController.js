const Quote = require("../models/Quote");

exports.createQuote = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      service,
      budget,
      projectTitle,
      projectDescription
    } = req.body;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSlice = Date.now().toString().slice(-6);
    const generatedQuoteId = `QT-${timestampSlice}-${randomSuffix}`;

    const newQuote = new Quote({
      quoteId: generatedQuoteId,
      fullName,
      email,
      phoneNumber,
      service,
      budget,
      projectTitle,
      projectDescription
    });

    await newQuote.save();

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      quoteId: generatedQuoteId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};