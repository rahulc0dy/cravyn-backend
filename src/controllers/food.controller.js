import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getFoodItemById,
  createFoodItem,
  updateFoodItemDiscountById,
  deleteFoodItemById,
  fuzzySearchFoodItem,
} from "../database/queries/foodItem.query.js";
import { getRestaurantById } from "../database/queries/restaurant.query.js";

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
  const {
    name,
    type,
    price,
    discountPercent,
    discountCap,
    foodImageUrl,
    description,
  } = req.body;
  let { restaurant } = req;

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
      message: "Type is required.",
    },
    {
      field: price,
      reason: "price Missing",
      message: "Price is required.",
    },
    {
      field: description,
      reason: "description Missing",
      message: "Description is required.",
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
    restaurant = await getRestaurantById(restaurant.restaurant_id);

    const restaurantId = restaurant[0].restaurant_id;

    const foodItem = await createFoodItem({
      name,
      type,
      restaurantId,
      price,
      discountPercent,
      discountCap,
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
  }
});

const updateFoodDiscount = asyncHandler(async (req, res) => {
  const { foodItemId, discountPercent, discountCap } = req.body;
  let { restaurant } = req;

  const requiredFields = [
    {
      field: restaurant,
      reason: "restaurant not defined",
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

const deleteFood = asyncHandler(async (req, res) => {
  const { foodItemId } = req.body;
  let { restaurant } = req;

  const requiredFields = [
    {
      field: restaurant,
      reason: "restaurant not defined",
      message: "Restaurant authorisation failure.",
    },
    {
      field: foodItemId,
      reason: "foodItemId Missing",
      message: "Food identification failure.",
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

export { getFood, addFood, updateFoodDiscount, deleteFood, searchFoodByName };
