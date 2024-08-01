const catchAsync = require("../../utils/common/catchAsync");
const {
  failed_response,
  success_response,
} = require("../../utils/common/response");
const CategoryModel = require('../../models/categories')
const subCategoryModel = require('../../models/subCategories')

const _ = require("lodash");

const addSubCategory = catchAsync(async (req, res) => {
  try {
    const { mainCategoryID, subCategoryNames } = req.body;
    let subNames = subCategoryNames.split(",");
    const subData = subNames.map((name) => {
      return {
        mainCategoryID: mainCategoryID,
        name: name,
      };
    });
    const subCategories = await subCategoryModel.create(subData);
    if (_.isEmpty(subCategories)) {
      return res
        .status(400)
        .json(
          failed_response(400, "not able to create sub categories", {}, false)
        );
    }
    const subIds = subCategories?.map((subId) => subId?._id?.toString());
    let mainCategory = await CategoryModel.findById(mainCategoryID);
    if (_.isEmpty(mainCategory)) {
      return res
        .status(400)
        .json(
          failed_response(400, "not able to fetch main category", {}, false)
        );
    }
    mainCategory.subCatIds.push(...subIds);
    mainCategory = await mainCategory.save();
    return res
      .status(201)
      .json(
        success_response(
          201,
          "successfully created sub categories ",
          { subCategories, mainCategory },
          true
        )
      );
  } catch (error) {
    console.log("error in creating sub category : ", error?.message);
    return res
      .status(500)
      .json(
        failed_response(500, error?.message, { message: error?.message }, false)
      );
  }
});

module.exports = addSubCategory;
