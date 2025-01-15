import {
  addItemtoCartByIds,
  decrementCartItem,
  getCartByCustomerId,
  incrementCartItem,
  removeItemFromCartByIds,
} from "../database/queries/cart.query.js";
import { getRestaurantIdByItemId } from "../database/queries/foodItem.query.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateCartSummary } from "../utils/cartUtils.js";
import { STATUS } from "../constants.js";
import ApiError from "../utils/apiError.js";
import { checkRequiredFields } from "../utils/requiredFieldsCheck.js";

const getCart = asyncHandler(async (req, res) => {
  const customerId = req.customer.id;

  try {
    const cart = await getCartByCustomerId(customerId);
    const cartSummary = calculateCartSummary(cart);

    return res.status(STATUS.SUCCESS.OK).json(
      new ApiResponse(
        {
          ...cartSummary,
        },
        "Cart fetched successfully."
      )
    );
  } catch (error) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.BAD_REQUEST,
      "An error occurred while fetching restaurant details for the food item.",
      error.message
    );
  }
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  checkRequiredFields({ itemId });

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR,
      "An error occurred while fetching restaurant details for the food item.",
      error.message
    );
  }

  try {
    const cartItem = await addItemtoCartByIds(customerId, itemId, restaurantId);

    if (!cartItem) {
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "An error occurred while adding item to cart.",
        "failed function addItemToCartByIds"
      );
    }

    return res
      .status(STATUS.SUCCESS.OK)
      .json(new ApiResponse(cartItem, "Added to cart successfully."));
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE,
      "Error occurred at our end.",
      error.message
    );
  }
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.query;
  const customerId = req.customer.id;

  checkRequiredFields({ itemId });

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.GATEWAY_TIMEOUT,
      "An error occurred while fetching restaurant details for the food item.",
      error.message
    );
  }

  try {
    const removedItemId = await removeItemFromCartByIds(
      customerId,
      itemId,
      restaurantId
    );

    const cart = await getCartByCustomerId(customerId);
    const cartSummary = calculateCartSummary(cart);

    return res.status(STATUS.SUCCESS.OK).json(
      new ApiResponse(
        {
          ...cartSummary,
        },
        "Item removed from cart successfully."
      )
    );
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE,
      "An error occurred while adding item to cart.",
      error.message
    );
  }
});

const incrementItemCount = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  checkRequiredFields({ itemId });

  let restaurantId;
  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.BAD_REQUEST,
      "An error occurred while fetching restaurant details for the food item.",
      error.message
    );
  }

  try {
    const cartItem = await incrementCartItem(customerId, itemId, restaurantId);

    if (!cartItem) {
      throw new ApiError(
        STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE,
        "An error occurred while adding item to cart.",
        "failed function incrementCartItem"
      );
    }

    const cart = await getCartByCustomerId(customerId);
    const cartSummary = calculateCartSummary(cart);

    return res.status(STATUS.SUCCESS.OK).json(
      new ApiResponse(
        {
          ...cartSummary,
        },
        "Item quantity incremented successfully."
      )
    );
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR,
      "An error occurred while adding item to cart.",
      error.message
    );
  }
});

const decrementItemCount = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  const customerId = req.customer.id;

  checkRequiredFields({ itemId });

  let restaurantId;

  try {
    restaurantId = await getRestaurantIdByItemId(itemId);
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.GATEWAY_TIMEOUT,
      "An error occurred while reaching restaurant.",
      error.message
    );
  }

  try {
    const cartItem = await decrementCartItem(customerId, itemId, restaurantId);

    if (!cartItem) {
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "An error occurred while decrementing item from cart.",
        "failed function decrementCartItem."
      );
    }

    const cart = await getCartByCustomerId(customerId);
    const cartSummary = calculateCartSummary(cart);

    return res.status(STATUS.SUCCESS.OK).json(
      new ApiResponse(
        {
          ...cartSummary,
        },
        "Item quantity decremented successfully."
      )
    );
  } catch (error) {
    throw new ApiError(
      STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR,
      "An error occurred while decrementing item count.",
      error.message
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
