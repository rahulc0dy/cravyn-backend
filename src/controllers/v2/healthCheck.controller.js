import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { STATUS } from "../../constants.js";
import os from "os";
import ApiError from "../../utils/apiError.js";

const healthCheck = asyncHandler(async (req, res) => {
  let systemInfo;

  try {
    systemInfo = {
      platform: os.platform(),
      cpuArch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
    };
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR,
      error.message
    );
  }

  return res
    .status(STATUS.SUCCESS.OK)
    .json(new ApiResponse(systemInfo, "Status OK."));
});

export { healthCheck };
