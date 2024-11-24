import {
  addItemtoCartByIds,
  decrementCartItem,
  incrementCartItem,
  removeItemFromCartByIds,
} from "../database/queries/cart.query.js";
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

  try {
    const cartItem = await addItemtoCartByIds(customerId, itemId, restaurantId);

    return res
      .status(200)
      .json(new ApiResponse(cartItem, "Cart item retrieved successfully."));
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
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  if (!itemId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "itemId could not be retrieved from req.body",
          at: "cart.controller.js -> removeItemFromCart",
        },
        "Item ID is required."
      )
    );
  }

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: error.message || "Food item ID is incorrect",
          at: "cart.controller.js -> removeItemFromCart",
        },
        "An error occurred while fetching restaurant details for the food item."
      )
    );
  }

  try {
    const removedItemId = await removeItemFromCartByIds(
      customerId,
      itemId,
      restaurantId
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          removedItemId,
          "Item removed from the cart successfully."
        )
      );
  } catch (error) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: error.message,
          at: "cart.controller.js -> removeItemFromCart",
        },
        "An error occurred while removing the item from the cart."
      )
    );
  }
});

const incrementItemCount = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  if (!itemId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "itemId could not be retrieved from req.body",
          at: "cart.controller.js -> incrementItemCount",
        },
        "Item ID is required."
      )
    );
  }

  let restaurantId;
  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: error.message || "Food item ID is incorrect",
          at: "cart.controller.js -> incrementItemCount",
        },
        "An error occurred while fetching restaurant details for the food item."
      )
    );
  }

  try {
    const cartItem = await incrementCartItem(customerId, itemId, restaurantId);

    if (!cartItem) {
      return res.status(404).json(
        new ApiResponse(
          {
            reason: "Item not found in the cart",
            at: "cart.controller.js -> incrementItemCount",
          },
          "Item not found in the cart."
        )
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(cartItem, "Item quantity incremented successfully.")
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message,
          at: "cart.controller.js -> incrementItemCount",
        },
        "An error occurred while incrementing the item count."
      )
    );
  }
});

const decrementItemCount = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  if (!itemId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "itemId could not be retrieved from req.body",
          at: "cart.controller.js -> decrementItemCount",
        },
        "Item ID is required."
      )
    );
  }

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: error.message || "Food item ID is incorrect",
          at: "cart.controller.js -> decrementItemCount",
        },
        "An error occurred while fetching restaurant details for the food item."
      )
    );
  }

  try {
    const cartItem = await decrementCartItem(customerId, itemId, restaurantId);

    if (!cartItem) {
      return res.status(404).json(
        new ApiResponse(
          {
            reason: "Item not found in the cart",
            at: "cart.controller.js -> decrementItemCount",
          },
          "Item not found in the cart."
        )
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(cartItem, "Item quantity decremented successfully.")
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message,
          at: "cart.controller.js -> decrementItemCount",
        },
        "An error occurred while decrementing the item count."
      )
    );
  }
});

export {
  getCart,
  addItemToCart,
  removeItemFromCart,
  incrementItemCount,
  decrementItemCount,
};
