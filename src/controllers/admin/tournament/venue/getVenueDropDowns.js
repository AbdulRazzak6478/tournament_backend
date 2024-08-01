const ClubOwners = require("../../../../models/ClubOwners.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const Arenas = require("../../../../models/Sports.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const _ = require("lodash");

const getVenueDropDowns = catchAsync(async (req, res) => {
  try {
    const { city, club, arena } = req.query;

    let findAllClubs = await ClubOwners.find({});

    if (_.isEmpty(findAllClubs)) {
      findAllClubs = [];
    }

    const cities = findAllClubs?.map((div) => div?.location_operating?.City);

    const set = new Set(cities);
    const uniqueCities = [...set];

    let findCityClubs = await ClubOwners.find({
      "location_operating.City": city,
    });

    if (_.isEmpty(findCityClubs)) {
      findCityClubs = await ClubOwners.find({});
    }

    const clubs = findCityClubs?.map((div) => {
      return { clubName: div?.ClubName, clubId: div?._id };
    });

    const clubsIds = clubs?.map((div) => div?.clubId);

    let findArenas = await Arenas.find({ Club_id: clubsIds }).populate(
      "Areana_boards"
    );

    if (!_.isEmpty(club)) {
      findArenas = await Arenas.find({ Club_id: club }).populate(
        "Areana_boards"
      );
    }

    const arenas = findArenas.map((div) => {
      return {
        arenaName: div?.Areana_name,
        arenaId: div?._id,
        // courts: div.Areana_boards.map((div2) => {
        //   return { courtName: div2.Name, courtId: div._id };
        // }),
      };
    });

    const arenaIds = arenas?.map((div) => div?.arenaId);

    let findBoard = await Arenas.find({ _id: arenaIds }).populate(
      "Areana_boards"
    );

    if (!_.isEmpty(arena)) {
      findBoard = await Arenas.find({ _id: arena }).populate("Areana_boards");
    }

    const court = [];

    findBoard.map((div) =>
      div?.Areana_boards?.map((div2) => {
        court.push({ courtName: div2?.Name, courtId: div2?._id });
      })
    );

    return res.status(201).json(
      success_response(
        201,
        "fetching dropdown items",
        {
          cities: uniqueCities,
          cityLength: uniqueCities.length,
          clubs: clubs,
          clubsLength: clubs.length,
          arenas,
          length: arenas.length,
          court,
          courtLength: court.length,
        },
        true
      )
    );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to fetch dropdowns for venue",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = getVenueDropDowns;
