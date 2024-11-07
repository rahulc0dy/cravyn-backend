import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getAddress = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.params;

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No latitude or longitude" },
          "Please provide a valid latitude or longitude"
        )
      );
  }

  try {
  } catch (error) {}
});
