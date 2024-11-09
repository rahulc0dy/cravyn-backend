import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { fuzzySearchFoodItem } from "../database/queries/foodItem.query.js";
import { fuzzySearchRestaurant } from "../database/queries/restaurant.query.js";

const searchFoodOrRestaurant = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "search text is empty." },
          "Search text is empty."
        )
      );
  }

  try {
    const foodItems = await fuzzySearchFoodItem(search);
    const restaurants = await fuzzySearchRestaurant(search);

    if (!restaurants.length && !foodItems.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "no food item or restaurant found with that name" },
            "No food item or restaurant found with that name."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { foodItems: foodItems, restaurants: restaurants },
          "Search results found."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could not search, please try again."
        )
      );
  }
});

export { searchFoodOrRestaurant };
