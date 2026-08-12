const mongoose = require("mongoose");

const serviceCodeCounterSchema =
  new mongoose.Schema(
    {
      _id: {
        type: String,
        required: true,
      },

      sequence: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      versionKey: false,
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "ServiceCodeCounter",
  serviceCodeCounterSchema
);
