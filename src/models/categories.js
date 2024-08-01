const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    subCatIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subCategories",
      },
    ],
  },
  { timestamps: true }
);

const categories = mongoose.model(
  "categories",
  categorySchema
);

module.exports = categories;
