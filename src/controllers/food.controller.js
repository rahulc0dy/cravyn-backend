import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getFoodItemById,
  createFoodItem,
  updateFoodItemDiscountById,
  deleteFoodItemById,
  fuzzySearchFoodItem,
  updateFoodItemById,
  setFoodAvailabilityStatus,
} from "../database/queries/foodItem.query.js";
import { getRestaurantById } from "../database/queries/restaurant.query.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import { checkRequiredFields } from "../utils/requiredFieldsCheck.js";

const getFood = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?.restaurant_id;
  const { foodItemId } = req.query;

  if (!foodItemId || !restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: foodItemId
            ? "restaurantId not found"
            : "foodItemId not found",
          at: "foodItem.controller.js -> getFoodItem",
        },
        "Bad request."
      )
    );
  }

  try {
    const [foodItem, restaurant] = await Promise.all([
      getFoodItemById(foodItemId),
      getRestaurantById(restaurantId),
    ]);

    const data = {
      foodItem: foodItem[0],
      restaurant: restaurant[0],
    };

    for (const key in data) {
      if (!data[key]) {
        return res.status(404).json(
          new ApiResponse(
            {
              reason: `${key} could not be found using the provided ID.`,
              at: "foodItem.controller.js -> getFood",
            },
            "Item not found."
          )
        );
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(data, "Food item retrieved successfully."));
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Food item cannot be retrieved",
          at: "foodItem.controller.js -> getFoodItem",
        },
        "Unable to retrieve item."
      )
    );
  }
});

const searchFoodByName = asyncHandler(async (req, res) => {
  const { foodName } = req.query;

  if (!foodName) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No food name provided" },
          "No food name provided"
        )
      );
  }

  try {
    const foodItems = await fuzzySearchFoodItem(foodName);

    if (!foodItems.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No food item found with that name" },
            "No food item found with that name."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ foodItems: foodItems }, "Food items found."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Food item not found." },
          "Unable to retrieve item."
        )
      );
  }
});

const addFood = asyncHandler(async (req, res) => {
  const { name, type, price, description } = req.body;
  let { restaurant } = req;

  if (
    !checkRequiredFields(
      { restaurant, name, type, price, description },
      ({ field, message, reason }) =>
        res.status(400).json(
          new ApiResponse(
            {
              reason,
            },
            message
          )
        )
    )
  )
    return;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: `The image passed is ${req.file}` },
            "No Image uploaded."
          )
        );
    }

    const localFilePath = req.file.path;

    const cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

    if (!cloudinaryResponse.url) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            { reason: "Could not upload image." },
            "Image Upload Failed."
          )
        );
    }

    const foodImageUrl = cloudinaryResponse.url;

    restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant[0].restaurant_id;

    const foodItem = await createFoodItem({
      name,
      type,
      restaurantId,
      price,
      foodImageUrl,
      description,
    });

    const data = {
      foodItem: foodItem[0],
      restaurant: restaurant[0],
    };

    for (const key in data) {
      if (!data[key]) {
        return res.status(404).json(
          new ApiResponse(
            {
              reason: `${key} could not be found using the provided ID.`,
              at: "foodItem.controller.js -> addFood",
            },
            "Item not found."
          )
        );
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(data, "Food item added successfully."));
  } catch (error) {
    console.log(error);
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Error occurred during food item creation",
          at: "foodItem.controller.js -> addFoodItem",
        },
        "Unable to add food item."
      )
    );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

const updateFood = asyncHandler(async (req, res) => {
  const { foodItemId, name, type, price, description } = req.body;
  let { restaurant } = req;

  if (!foodItemId) {
    return res
      .status(404)
      .json(
        new ApiResponse({ reason: "No food id given" }, "No food id given.")
      );
  }

  try {
    let localFilePath, cloudinaryResponse;

    if (req.file) {
      localFilePath = req.file.path;

      cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

      if (!cloudinaryResponse.url) {
        return res
          .status(500)
          .json(
            new ApiResponse(
              { reason: "Could not upload image." },
              "Image Upload Failed."
            )
          );
      }
    }

    const existingFoodItem = await getFoodItemById(foodItemId);

    if (!existingFoodItem || existingFoodItem.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "getFoodItemById could not execute" },
            "Failed to update food item."
          )
        );
    }

    const foodImageUrl =
      cloudinaryResponse?.url ?? existingFoodItem[0].food_image_url;

    restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant[0]?.restaurant_id;

    const foodItem = await updateFoodItemById({
      foodItemId,
      name,
      type,
      restaurantId,
      price,
      foodImageUrl,
      description,
    });

    const data = {
      foodItem: foodItem[0],
      restaurant: restaurant[0],
    };

    for (const key in data) {
      if (!data[key]) {
        return res.status(404).json(
          new ApiResponse(
            {
              reason: `${key} could not be found using the provided ID.`,
              at: "foodItem.controller.js -> addFood",
            },
            "Item not found."
          )
        );
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(data, "Food item added successfully."));
  } catch (error) {
    console.log(error);
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Error occurred during food item creation",
          at: "foodItem.controller.js -> addFoodItem",
        },
        "Unable to add food item."
      )
    );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

const updateFoodDiscount = asyncHandler(async (req, res) => {
  const { foodItemId, discountPercent, discountCap } = req.body;
  let { restaurant } = req;

  if (
    !checkRequiredFields(
      { restaurant, foodItemId, discountPercent, discountCap },
      ({ field, message, reason }) =>
        res.status(400).json(
          new ApiResponse(
            {
              reason,
            },
            message
          )
        )
    )
  )
    return;

  try {
    restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant[0].restaurant_id;

    const updatedFoodItem = await updateFoodItemDiscountById({
      foodItemId,
      restaurantId,
      discountPercent,
      discountCap,
    });

    if (updatedFoodItem.length === 0) {
      return res.status(404).json(
        new ApiResponse(
          {
            reason: `Maybe food item does not belong to that restaurant.`,
            at: "foodItem.controller.js -> updateFoodDiscount",
          },
          "Item not found."
        )
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          updatedFoodItem,
          "Food item discount updated successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Unable to update food item."
        )
      );
  }
});

const updateFoodAvailabilityStatus = asyncHandler(async (req, res) => {
  const { foodItemId, availabilityStatus } = req.body;

  if (!foodItemId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "food item id is missing." },
          "Item not found."
        )
      );
  }

  if (availabilityStatus === undefined || availabilityStatus === null) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "status is missing." },
          "Error making request."
        )
      );
  }

  try {
    const foodItem = await setFoodAvailabilityStatus(
      foodItemId,
      availabilityStatus
    );

    if (!foodItem || !foodItem.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No food items found." },
            "Unable to find food item."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { foodItem: foodItem[0] },
          `${foodItem[0]?.food_name} is now ${availabilityStatus ? "available" : "unavailable"}.`
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { error: error.message || "Error occurred during food item." },
          "Unable to update food item."
        )
      );
  }
});

const deleteFood = asyncHandler(async (req, res) => {
  const { foodItemId } = req.query;
  let { restaurant } = req;

  if (
    !checkRequiredFields(
      { foodItemId, restaurant },
      ({ field, message, reason }) =>
        res.status(400).json(new ApiResponse({ reason }, message))
    )
  )
    return;

  try {
    restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant[0].restaurant_id;

    const deletedFoodItem = await deleteFoodItemById({
      foodItemId,
      restaurantId,
    });

    if (deletedFoodItem.length === 0) {
      return res.status(404).json(
        new ApiResponse(
          {
            reason: `Maybe food item does not belong to that restaurant.`,
            at: "foodItem.controller.js -> deleteFood",
          },
          "Item not found."
        )
      );
    }

    return res
      .status(200)
      .json(new ApiResponse({}, "Food item deleted successfully."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Unable to delete food item."
        )
      );
  }
});

export {
  getFood,
  addFood,
  updateFood,
  updateFoodDiscount,
  deleteFood,
  searchFoodByName,
  updateFoodAvailabilityStatus,
};
