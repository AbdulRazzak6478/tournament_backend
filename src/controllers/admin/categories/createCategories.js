const catchAsync = require("../../../utils/catchAsync");
const {
  success_response,
  failed_response,
} = require("../../../utils/response");
const categories = require("../../../models/categories");
const subCategoriesModel = require("../../../models/subCategories");
const _ = require("lodash");

const addCategories = catchAsync(async (req, res) => {
  try {
    const { categoryName, subCategoriesNames } = req.body;
    console.log("data : ", categoryName, subCategoriesNames);
    if (_.isEmpty(categoryName)) {
      return res
        .status(400)
        .json(failed_response(400, "categoryName is required", {}, false));
    }
    if (_.isEmpty(subCategoriesNames)) {
      return res
        .status(400)
        .json(
          failed_response(400, "subCategoriesNames are required", {}, false)
        );
    }
    let subCategories = subCategoriesNames.split(",");
    let mainCategory = await categories.create({ categoryName: categoryName });
    if (_.isEmpty(mainCategory)) {
      return res
        .status(400)
        .json(
          failed_response(400, "not able to create main category", {}, false)
        );
    }
    subCategories = subCategories?.map((subCat) => {
      return {
        subCategoryName: subCat,
        mainCategoryID: mainCategory?._id?.toString(),
      };
    });
    console.log(" sub Categories payload : ", subCategories);
    let subCategoriesDetails = await subCategoriesModel.create(subCategories);
    if (_.isEmpty(subCategoriesDetails)) {
      return res
        .status(400)
        .json(
          failed_response(400, "not able to create sub categories", {}, false)
        );
    }
    let subCatIds = subCategoriesDetails?.map((subCat) =>
      subCat?._id?.toString()
    );
    mainCategory.subCatIds = subCatIds;
    const responsePayload = {
      mainCategory: mainCategory,
      subCategories: subCategoriesDetails,
    };
    return res
      .status(201)
      .json(
        success_response(
          201,
          "Successfully added categories",
          responsePayload,
          true
        )
      );
  } catch (error) {
    console.log("error in adding categories", error?.message);
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "something went wrong while creating categories",
          { message: error?.message },
          false
        )
      );
  }
});

module.exports = {
  addCategories,
};
