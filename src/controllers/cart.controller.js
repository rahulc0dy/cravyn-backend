import { asyncHandler } from "../utils/asyncHandler.js";

const getCart = asyncHandler(async (req, res) => {});

const addItemToCart = asyncHandler(async (req, res) => {});

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
