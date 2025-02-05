import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { STATUS } from "../../constants.js";

const healthCheck = asyncHandler(async (req, res) => {
  return res.status(STATUS.SUCCESS.OK).json(new ApiResponse({}, "Status OK."));
});

export { healthCheck };
