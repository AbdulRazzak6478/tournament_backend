const Players = require("../../../../models/tournamentPlayer.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const { failed_response } = require("../../../../utils/response.js");
const _ = require("lodash");
const Team = require("../../../../models/tournamentTeam.js");
const User = require("../../../../models/Users.js");
const Admin = require("../../../../firebase/admin.js");
const Tournament = require("../../../../models/tournament.js");
const UserRole = require("../../../../models/userRoles.js");
const createPlayersForTeam = catchAsync(async (req, res) => {
  try {
    const { teamId } = req.params;
    const { playerName, mobileNo, email } = req.body;

    if (_.isEmpty(teamId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "team id is required",
            { message: "team id is required" },
            false
          )
        );
    }

    const findTeam = await Team.findById(teamId);

    if (_.isEmpty(findTeam)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "team not found",
            { message: "team not found" },
            false
          )
        );
    }

    const findTournament = await Tournament.findById(findTeam.tournamentID);

    if (_.isEmpty(findTournament)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament not found",
            { message: "tournament not found" },
            false
          )
        );
    }

    if (_.isEmpty(playerName)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "player name is required",
            { message: "player name is required" },
            false
          )
        );
    }

    if (_.isEmpty(mobileNo)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "mobile number is required",
            { message: "mobile number is required" },
            false
          )
        );
    }

    if (_.isEmpty(email)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "email is required",
            { message: "email is required" },
            false
          )
        );
    }

    let findUser = await User.findOne({ email: email });

    if (_.isEmpty(findUser)) {
      findUser = await User.findOne({ mobileNumber: mobileNo });

      if (_.isEmpty(findUser)) {
        try {
          const checkEmailExist = await Admin.auth()
            .getUserByEmail(email)
            .catch(() => null);

          if (!_.isEmpty(checkEmailExist)) {
            return res
              .status(400)
              .json(
                failed_response(
                  400,
                  "user already exist in firebase",
                  { message: "user already exist in firebase" },
                  false
                )
              );
          }
        } catch (error) {
          return res
            .status(400)
            .json(
              failed_response(
                400,
                "Error in checking user exist or not in firebase",
                { message: error.message },
                false
              )
            );
        }

        try {
          const firebaseUser = await Admin.auth().createUser({
            displayName: playerName,
            email: email,
            phoneNumber: mobileNo,
            password: "GamebeezUser@QYT684O",
            disabled: false,
            emailVerified: true,
          });

          const newUser = new User({
            customerId: firebaseUser.uid,
            FirstName: playerName,
            LastName: playerName,
            Gender: "MALE",
            email: email,
            mobileNumber: mobileNo,
            location: {
              country: "INDIA",
              state: "ANDRA PRADESH",
              pincode: "500001",
              city: "hyderabad",
              address: "hyderabad , izzat nagar",
              extra_store: {
                example: "hello",
              },
              imageUrl: "",
              intrest: {
                categories: [findTournament.mainCategoryID],
                subcategories: [findTournament.subCategoryID],
              },
            },
          });

          findUser = await newUser.save();

          if (_.isEmpty(findUser)) {
            return res
              .status(400)
              .json(
                failed_response(
                  400,
                  "user account not created",
                  { message: "user account not created" },
                  false
                )
              );
          }

          const newRole = new UserRole({
            firebaseId: findUser.customerId,
            "role.user": true,
            userMongoId: findUser._id,
          });

          const saveRole = await newRole.save();
        } catch (error) {
          return res.status(400).json(
            failed_response(
              400,
              "Error in creating user account",
              {
                message: error.message,
              },
              false
            )
          );
        }
      }
    }

    const newPlayer = new Players({
      tournamentID: findTeam.tournamentID,
      name: playerName,
      phone: mobileNo,
      email: email,
      teamID: findTeam._id,
      userMongoID: findUser._id,
    });

    const savePlayer = await newPlayer.save();

    findTeam.players.push(savePlayer._id);

    await findTeam.save();

    return res
      .status(201)
      .json(
        failed_response(
          400,
          "created player for team successfully",
          { player: savePlayer },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to create players for teams",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = createPlayersForTeam;
