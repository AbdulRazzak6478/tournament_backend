const catchAsync = require("../../../utils/catchAsync.js");
const { failed_response, success_response } = require("../../../utils/response.js");
const Yup = require("yup");
const mongoose = require("mongoose");
const tournamentKnockoutFormatCreation = require("./knockout/createKnockoutFormat.js");
const createDoubleEliminationTournament = require("./doubleKnockout/tournamentDoubleFormatCreation.js");

// Validation schema using Yup
const tournamentValidationSchema = Yup.object({
   mainCategoryID: Yup.string().required("mainCategoryID is required"),
   subCategoryID: Yup.string().required("subCategoryID is required"),
   gameType: Yup.string().required("gameType is required"),
   formatType: Yup.string().required("formatType is required"),
   fixingType: Yup.string().required("fixingType is required"),
   sport: Yup.string().required("sport is required"),
   participants: Yup.number().required("participants are required"),
});

// to validate ObjectId()
function isValidObjectId(id) {
   return mongoose.Types.ObjectId.isValid(id);
}
const createTournament = catchAsync(async (req, res) => {
   try {
      try {
         const validatedData = await tournamentValidationSchema.validate(req.body, {
            abortEarly: false,
         });
         if (!validatedData) {
            const errorMessages = validatedData.inner.map((error) => ({
               field: error.path,
               message: error.message,
            }));

            // Custom response for validation failure with error messages
            return res.status(400).json(failed_response(400, "Validation failed", errorMessages, false));
         }
      } catch (err) {
         if (err.name === "ValidationError") {
            return res.status(400).json(failed_response(400, "Validation failed", err.errors, false));
         } else {
            return res.status(400).json(failed_response(400, "Validation failed", err.message, false));
         }
      }
      let { mainCategoryID, subCategoryID, gameType, participants, formatType, sport, fixingType } = req.body;

      if (!isValidObjectId(mainCategoryID)) {
         return res.status(400).json(failed_response(400, "Pass an valid mainCategoryID ", {}, false));
      }
      if (!isValidObjectId(subCategoryID)) {
         return res.status(400).json(failed_response(400, "Pass an valid subCategoryID ", {}, false));
      }

      // validating gameType

      let gameTypes = ["team", "individual"];
      if (!gameTypes.includes(gameType)) {
         return res
            .status(400)
            .json(
               failed_response(
                  400,
                  "gameType should be anyone from this [ team or individual ] only",
                  {},
                  false
               )
            );
      }

      // validating fixingType
      let fixingTypes = ["sequential", "random", "top_vs_bottom", "manual"];
      if (!fixingTypes.includes(fixingType.toLowerCase())) {
         return res
            .status(400)
            .json(
               failed_response(
                  400,
                  "fixingType should be anyone from this ['sequential','random','top_vs_bottom','manual'] only",
                  {},
                  false
               )
            );
      }

      // validating formatType
      let formatTypes = ["knockout", "double_elimination_bracket", "round_robbin"];
      if (!formatTypes.includes(formatType.toLowerCase())) {
         return res
            .status(400)
            .json(
               failed_response(
                  400,
                  "formatType should be anyone from this ['knockout','double_elimination_bracket','round_robbin'] only",
                  {},
                  false
               )
            );
      }

      const knockoutFormat = {
         min: 2,
         max: 128,
      };
      const double_elimination_bracket_format = {
         min: 4,
         max: 128,
      };
      const round_robbin_format = {
         min: 2,
         max: 72,
      };

      const data = {
         mainCategoryID,
         subCategoryID,
         gameType,
         participants,
         formatType,
         sport,
         fixingType,
      };

      let responseData = {};
      if (data.formatType.toLowerCase() === "knockout") {
         if (data.participants < knockoutFormat.min || data.participants > knockoutFormat.max) {
            return res
               .status(400)
               .json(failed_response(400, "participants should comes in between 2 to 128", {}, false));
         }
         responseData = await tournamentKnockoutFormatCreation(data);
      }
      if (data.formatType.toLowerCase() === "double_elimination_bracket") {
         if (
            data.participants < double_elimination_bracket_format.min ||
            data.participants > double_elimination_bracket_format.max
         ) {
            return res
               .status(400)
               .json(failed_response(400, "participants should comes in between 4 to 128", {}, false));
         }
         responseData = await createDoubleEliminationTournament(data);
         // responseData = {
         //    message: "work in progress for double_elimination_bracket",
         // };
      }
      if (data.formatType.toLowerCase() === "round_robbin") {
         if (data.participants < round_robbin_format.min || data.participants > round_robbin_format.max) {
            return res
               .status(400)
               .json(failed_response(400, "participants should comes in between 2 to 72", {}, false));
         }
         responseData = {
            message: "work in progress for round_robbin",
         };
      }
      return res
         .status(201)
         .json(success_response(201, "Tournament Created Successfully ", responseData, true));
   } catch (err) {
      res.status(400).json(
         failed_response(
            400,
            "Something went wrong while creating tournament ",
            { message: err.message },
            false
         )
      );
   }
});

module.exports = createTournament;
