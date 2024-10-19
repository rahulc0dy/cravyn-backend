import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getFoodItemById,
  createFoodItem,
  updateFoodItemById,
  deleteFoodItemById,
} from "../db/foodItem.query.js";

const getFoodItem = asyncHandler(async (req, res) => {
  const { foodItemId } = req.body;

  if (!foodItemId) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: "foodItemId could not be retrieved from req.body",
          at: "foodItem.controller.js -> getFoodItem",
        },
        "Bad request."
      )
    );
  }

  try {
    const foodItem = await getFoodItemById(foodItemId);
    console.log(foodItem);

    if (foodItem.length === 0) throw new Error("No food item found.");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { foodItem: foodItem[0] },
          "Food item retrieved successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "Food item cannot be retrieved",
          at: "foodItem.controller.js -> getFoodItem",
        },
        "Unable to retrieve food item."
      )
    );
  }
});

const addFoodItem = asyncHandler(async (req, res) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: `name: ${name}, type: ${type}`,
        },
        "Name and type are required."
      )
    );
  }

  try {
    const foodItem = await createFoodItem(name, type);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { foodItem: foodItem[0] },
          "Food item added successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "Error occurred during food item creation",
          at: "foodItem.controller.js -> addFoodItem",
        },
        "Unable to add food item."
      )
    );
  }
});

const updateFoodItem = asyncHandler(async (req, res) => {
  const { foodItemId, name, type } = req.body;

  if (!foodItemId || !name || !type) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: `foodItemId: ${foodItemId}, name: ${name}, type: ${type}`,
        },
        "Bad request."
      )
    );
  }

  let foodItem = await getFoodItemById(foodItemId);

  if (!foodItem) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `foodItem is ${foodItem}` },
          "Food item not found."
        )
      );
  }

  try {
    foodItem = await updateFoodItemById(foodItemId, name, type);
    if (foodItem.length <= 0) {
      throw new Error("Could not update food item.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { foodItem: foodItem[0] },
          "Food item updated successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: error.message },
          "Unable to update food item."
        )
      );
  }
});

const deleteFoodItem = asyncHandler(async (req, res) => {
  const { foodItemId } = req.body;

  if (!foodItemId) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: `foodItemId is ${foodItemId}`,
        },
        "Bad request."
      )
    );
  }

  let foodItem = await getFoodItemById(foodItemId);

  if (!foodItem) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `foodItem is ${foodItem}` },
          "Food item not found."
        )
      );
  }

  try {
    foodItem = await deleteFoodItemById(foodItemId);

    if (foodItem.length <= 0)
      throw new Error("No return value from delete item.");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { foodItem: foodItem[0] },
          "Food item deleted successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: error.message },
          "Unable to delete food item."
        )
      );
  }
});

export { getFoodItem, addFoodItem, updateFoodItem, deleteFoodItem };
