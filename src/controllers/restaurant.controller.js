import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRestaurantById, createRestaurant } from "../db/restaurant.query.js";
import fs from "fs";

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
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse(400, { reason }, message));
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
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { restaurant: restaurant[0] },
          "Restaurant added successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "error occured during restaurant creation",
          at: fs.Dir,
        },
        error.message
      )
    );
  }
});

export { addRestaurant };
