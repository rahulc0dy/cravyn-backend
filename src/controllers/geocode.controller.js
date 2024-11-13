import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getReverseGeocodeUrl, getGeocodeUrl } from "../utils/geocodeUrl.js";

const getAddress = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No latitude or longitude" },
          "Please provide valid latitude and longitude values"
        )
      );
  }

  try {
    const url = getReverseGeocodeUrl(latitude, longitude);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch reverse geocode data");
    }

    const data = await response.json();
    return res
      .status(200)
      .json(new ApiResponse(data, "Address retrieved successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { error: error.message },
          "Failed to retrieve address data"
        )
      );
  }
});

const getCoordinates = asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No address provided" },
          "Please provide a valid address"
        )
      );
  }

  try {
    const url = getGeocodeUrl(address);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch geocode data");
    }

    const data = await response.json();
    return res
      .status(200)
      .json(new ApiResponse(data, "Coordinates retrieved successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { error: error.message },
          "Failed to retrieve coordinates"
        )
      );
  }
});

export { getAddress, getCoordinates };
