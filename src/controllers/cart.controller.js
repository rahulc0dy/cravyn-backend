import { addItemtoCart } from "../database/queries/cart.query.js";
import { getRestaurantIdByItemId } from "../database/queries/foodItem.query.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getCart = asyncHandler(async (req, res) => {});

const addItemToCart = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  if (!itemId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "itemId could not be retrieved from req.body",
          at: "cart.controller.js -> addItemToCart",
        },
        "Item ID is required."
      )
    );
  }

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    res.status(400).json(
      new ApiResponse(
        {
          reason: error.message || "Food item ID is incorrect",
          at: "cart.controller.js -> addItemToCart",
        },
        "An error occurred while fetching restaurant details for the food item."
      )
    );
  }

  let cartItem;

  try {
    cartItem = await addItemtoCart(customerId, itemId, restaurantId);
  } catch (error) {
    res.status(400).json(
      new ApiResponse(
        {
          reason: error.message,
          at: "cart.controller.js -> addItemToCart",
        },
        "An error occurred while inserting the item in the cart."
      )
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(cartItem, "Food item retrieved successfully."));
});

const removeItemFromCart = asyncHandler(async (req, res) => {});

const incrementItemCount = asyncHandler(async (req, res) => {});

const decrementItemCount = asyncHandler(async (req, res) => {});

export {
  getCart,
  addItemToCart,
  removeItemFromCart,
  incrementItemCount,
  decrementItemCount,
};
