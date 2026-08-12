const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 350,
    },
    fullDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    consultationMode: {
      type: [
        {
          type: String,
          enum: ["Clinic", "Video", "Home Sample"],
        },
      ],
      required: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    iconKey: {
      type: String,
      required: true,
      trim: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({
  title: "text",
  shortDescription: "text",
  fullDescription: "text",
  category: "text",
});

module.exports = mongoose.model("Service", serviceSchema);
