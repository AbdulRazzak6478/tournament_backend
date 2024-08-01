const catchAsync = require("../../utils/common/catchAsync");
const {
  failed_response,
  success_response,
} = require("../../utils/common/response");
const _ = require('lodash');
const CategoryModel = require('../../models/categories')
const addMainCategory = catchAsync(async (req, res) => {
  try {
    const { name} = req.body;
    const mainCategory = await CategoryModel.create({name : name});
    if(_.isEmpty(mainCategory)){
        return res.status(400).json(failed_response(400,'not able to create category',{},false));
    }
    return mainCategory;
  } catch (error) {
    console.log("error in creating main category : ", error?.message);
    return res
      .status(500)
      .json(
        failed_response(500, error?.message, { message: error?.message }, false)
      );
  }
});

module.exports = addMainCategory;
