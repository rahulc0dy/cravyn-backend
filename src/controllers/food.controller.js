import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getFoodItemById,
  createFoodItem,
  getFoodItemByName,
} from "../database/queries/foodItem.query.js";
import { getRestaurantById } from "../database/queries/restaurant.query.js";
import { getRestaurantOwnerById } from "../database/queries/restaurantOwner.query.js";

const getFood = asyncHandler(async (req, res) => {
  const { restaurantId } = req.restaurant?.id;
  const { foodItemId } = req.body;

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

const addFood = asyncHandler(async (req, res) => {
  const { restaurant, name, type, price, foodImageUrl, description } = req.body;

  const requiredFields = [
    {
      field: restaurant,
      reason: "restaurant not defined",
      message: "Restaurant authorisation failure.",
    },
    {
      field: name,
      reason: "name Missing",
      message: "Name is required.",
    },
    {
      field: type,
      reason: "type Missing",
      message: "type is reqiured.",
    },
    {
      field: price,
      reason: "price Missing",
      message: "Price is Required.",
    },
    {
      field: description,
      reason: "description Missing",
      message: "Description is Required.",
    },
  ];

  for (const { field, reason, message } of requiredFields) {
    if (!field) {
      return res.status(400).json(
        new ApiResponse(
          {
            reason,
          },
          message
        )
      );
    }
  }

  try {
    const restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant?.restaurant_id;

    const foodItem = await createFoodItem({
      name,
      type,
      price,
      description,
      foodImageUrl,
      restaurantId,
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
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Error occurred during food item creation",
          at: "foodItem.controller.js -> addFoodItem",
        },
        "Unable to add food item."
      )
    );
  }
});

const updateFoodDiscount = asyncHandler(async (req, res) => {
  const { foodItemId, restaurantId, discountPercent, discountCap } = req.body;

  const requiredFields = [
    {
      field: restaurantId,
      reason: "restaurantId Missing",
      message: "Restaurant authorisation failure.",
    },
    {
      field: foodItemId,
      reason: "foodItemId Missing",
      message: "Food identification failure.",
    },
    {
      field: discountPercent,
      reason: "discountPercent Missing",
      message: "Discount percnt is reqiured.",
    },
    {
      field: discountCap,
      reason: "discountCap Missing",
      message: "Discount Cap is Required.",
    },
  ];

  for (const { field, reason, message } of requiredFields) {
    if (!field) {
      return res.status(400).json(
        new ApiResponse(
          {
            reason,
          },
          message
        )
      );
    }
  }

  try {
    let [foodItem, restaurant] = await Promise.all([
      getFoodItemById(foodItemId),
      getRestaurantById(restaurantId),
    ]);

    const preparesItem = await updatePreparesDiscountById({
      foodItemId,
      restaurantId,
      discountPercent,
      discountCap,
    });

    const data = {
      foodItem: foodItem[0],
      preparesItem: preparesItem[0],
      restaurant: restaurant[0],
    };

    for (const key in data) {
      if (!data[key]) {
        return res.status(404).json(
          new ApiResponse(
            {
              reason: `${key} had error while keycheck.`,
              at: "foodItem.controller.js -> updateFoodDiscount",
            },
            "Item not found."
          )
        );
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(data, "Food item discount updated successfully."));
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

const deleteFood = asyncHandler(async (req, res) => {
  const { foodItemId, restaurantId } = req.body;

  if (!foodItemId || !restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: foodItemId
            ? "restaurantId is undefined"
            : `foodItemId is ${foodItemId}`,
        },
        "Bad request."
      )
    );
  }

  let preparesItem = await getPreparesById(foodItemId, restaurantId);

  if (preparesItem.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `preparesItem is ${preparesItem}` },
          "Food item not found."
        )
      );
  }

  try {
    let [foodItem, restaurant] = await Promise.all([
      getFoodItemById(foodItemId),
      getRestaurantById(restaurantId),
    ]);

    preparesItem = await deletePreparesById(foodItemId, restaurantId);

    const data = {
      foodItem: foodItem[0],
      preparesItem: preparesItem[0],
      restaurant: restaurant[0],
    };

    for (const key in data) {
      if (!data[key]) {
        return res.status(404).json(
          new ApiResponse(
            {
              reason: `${key} had error while keycheck.`,
              at: "foodItem.controller.js -> updateFoodDiscount",
            },
            "Item not found."
          )
        );
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(data, "Food item deleted successfully."));
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

export { getFood, addFood, updateFoodDiscount, deleteFood };
