import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getRestaurantById,
  createRestaurant,
  updateRestaurantNameOwnerAvailabilityById,
  deleteRestaurantById,
  setRestaurantVerificationStatusById,
  getNonSensitiveRestaurantInfoById,
} from "../database/queries/restaurant.query.js";

const getRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "restaurantId could not be retrieved from req.body",
          at: "restaurant.controller.js -> getRestaurant",
        },
        "Bad request."
      )
    );
  }

  try {
    const restaurant = await getNonSensitiveRestaurantInfoById(restaurantId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant added successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "restaurant cannot be added",
          at: "restaurant.controller.js -> getRestaurant",
        },
        "Restaurant could not be fetched."
      )
    );
  }
});

const addRestaurant = asyncHandler(async (req, res) => {
  const {
    name,
    registrationNo,
    ownerId,
    lat,
    long,
    city,
    street,
    landmark,
    pinCode,
    availabilityStatus,
    licenseUrl,
    gstinNo,
    AccountNo,
    ifscCode,
    bankName,
    bankBranchCity,
    password,
  } = req.body;

  const requiredFields = [
    { field: name, message: "Name is required.", reason: `name is ${name}` },
    {
      field: registrationNo,
      message: "Registration number is required.",
      reason: `registrationNo is ${registrationNo}`,
    },
    {
      field: ownerId,
      message: "Unidentified request.",
      reason: `ownerId is ${ownerId}`,
    },
    { field: city, message: "City is required.", reason: `city is ${city}` },
    {
      field: street,
      message: "Street is required.",
      reason: `street is ${street}`,
    },
    {
      field: pinCode,
      message: "Pin code is required.",
      reason: `pinCode is ${pinCode}`,
    },
    {
      field: availabilityStatus,
      message: "Availability status is required.",
      reason: `availabilityStatus is ${availabilityStatus}`,
    },
    {
      field: licenseUrl,
      message: "License URL is required.",
      reason: `licenseUrl is ${licenseUrl}`,
    },
    {
      field: gstinNo,
      message: "GSTIN No. is required.",
      reason: `gstinNo is ${gstinNo}`,
    },
    {
      field: AccountNo,
      message: "AccountNo is required.",
      reason: `accountNo is ${AccountNo}`,
    },
    {
      field: ifscCode,
      message: "ifscCode is required.",
      reason: `ifscCode is ${ifscCode}`,
    },
    {
      field: bankName,
      message: "Bank name is required.",
      reason: `bankName is ${bankName}`,
    },
    {
      field: bankBranchCity,
      message: "BankBranchCity is required.",
      reason: `bankBranchCity is ${bankBranchCity}`,
    },
    {
      field: password,
      message: "Password is required.",
      reason: `password is ${password}`,
    },
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse({ reason }, message));
    }
  }

  try {
    const restaurant = await createRestaurant({
      name,
      registrationNo,
      ownerId,
      lat,
      long,
      city,
      street,
      landmark,
      pinCode,
      availabilityStatus,
      licenseUrl,
      gstinNo,
      AccountNo,
      ifscCode,
      bankName,
      bankBranchCity,
      password,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant added successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "error occurred during restaurant creation",
          at: "restaurant.controller.js",
        },
        "Unable to add Restaurant."
      )
    );
  }
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, name, licenseUrl, availabilityStatus } = req.body;

  if (
    !restaurantId ||
    !name ||
    !licenseUrl ||
    availabilityStatus === undefined
  ) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: `restaurantId:${restaurantId}, name:${name}, licenseUrl:${licenseUrl}, availabilityStatus:${availabilityStatus}`,
        },
        "Bad request."
      )
    );
  }

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await updateRestaurantNameOwnerAvailabilityById(restaurantId, {
      name,
      licenseUrl,
      availabilityStatus,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant details updated."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could not update restaurant details."
        )
      );
  }
});

const verifyRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId } = req.body;
  let { acceptVerification } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: { restaurantId },
        },
        "Bad request."
      )
    );
  }

  if (acceptVerification === undefined) acceptVerification = true;

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await setRestaurantVerificationStatusById(
      restaurantId,
      acceptVerification
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          acceptVerification
            ? "Restaurant verified."
            : "Restaurant verification rejected."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could update restaurant verification."
        )
      );
  }
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: { restaurantId },
        },
        "Bad request."
      )
    );
  }

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await deleteRestaurantById(restaurantId);
    return res
      .status(200)
      .json(
        new ApiResponse({ restaurant: restaurant[0] }, "Restaurant deleted.")
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could not delete restaurant."
        )
      );
  }
});

export {
  getRestaurant,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
};
