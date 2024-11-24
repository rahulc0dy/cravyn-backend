import { sql } from "./database.js";

const getFoodItemById = async (foodItemId) => {
  const foodItem = await sql`
    SELECT * FROM Food_Item WHERE item_id = ${foodItemId};
    `;
  return foodItem;
};

const getFoodItemByName = async (name) => {
  const foodItem = await sql`
    SELECT * FROM Food_Item WHERE food_name = ${name};
    `;
  return foodItem;
};

const getFoodsByRestaurantId = async (restaurantId, limit = null) => {
  const foodItems = await sql`
    SELECT * FROM Food_Item WHERE restaurant_id = ${restaurantId} LIMIT ${limit};
    `;

  // todo: rating for food items.
  foodItems.forEach((foodItem) => {
    foodItem.rating = parseFloat((Math.random() * 5).toFixed(1));
  });
  return foodItems;
};

const fuzzySearchFoodItem = async (foodItemName) => {
  const threshold = 0.3;
  const foodItems = await sql`
    SELECT *
    FROM Food_Item
    WHERE similarity(food_name, ${foodItemName}) > ${threshold}
    ORDER BY similarity(food_name, ${foodItemName}) DESC ;
    `;

  // todo: food rating
  foodItems.forEach((foodItem) => {
    foodItem.rating = parseFloat((Math.random() * (5 - 3) + 3).toFixed(1));
  });

  return foodItems;
};

const fuzzySearchRestaurantFoodItem = async ({
  foodItemName,
  restaurantId,
}) => {
  const threshold = 0.3;
  const foodItems = await sql`
      SELECT *
      FROM Food_Item
      WHERE restaurant_id=${restaurantId} AND similarity(food_name, ${foodItemName}) > ${threshold}
      ORDER BY similarity(food_name, ${foodItemName}) DESC
    ;`;

  // todo: food rating
  foodItems.forEach((foodItem) => {
    foodItem.rating = parseFloat((Math.random() * (5 - 3) + 3).toFixed(1));
  });

  return foodItems;
};

const createFoodItem = async ({
  name,
  type,
  restaurantId,
  price,
  discountPercent,
  discountCap,
  foodImageUrl,
  description,
}) => {
  const foodItem = await sql`
    INSERT INTO Food_Item ( food_name, type, restaurant_id, price, discount_percent, discount_cap, food_image_url, description )
    VALUES ( ${name}, ${type}, ${restaurantId}, ${price}, ${discountPercent}, ${discountCap}, ${foodImageUrl}, ${description} ) RETURNING * ;
    `;

  return foodItem;
};

const updateFoodItemDiscountById = async ({
  foodItemId,
  restaurantId,
  discountPercent,
  discountCap,
}) => {
  const foodItem = await sql`
    UPDATE Food_Item
    SET discount_percent=${discountPercent}, discount_cap=${discountCap}
    WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId}
    RETURNING * ;
    `;

  return foodItem;
};

const updateFoodItemById = async ({
  foodItemId,
  restaurantId,
  name,
  type,
  price,
  foodImageUrl,
  description,
}) => {
  const foodItem = await sql`
    UPDATE Food_Item
    SET price=${price}, food_name=${name}, food_image_url=${foodImageUrl}, description=${description}, type=${type}
    WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId}
    RETURNING * ;
    `;

  return foodItem;
};

const deleteFoodItemById = async ({ foodItemId, restaurantId }) => {
  const foodItem = await sql`
    DELETE FROM Food_Item
    WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId}
    RETURNING * ;
    `;

  return foodItem;
};

const getRestaurantIdByItemId = async (foodItemId) => {
  const restaurantId = await sql`
    SELECT restaurant_id FROM Food_Item WHERE item_id = ${foodItemId};
    `;
  return restaurantId[0].restaurant_id;
};

export {
  getFoodItemById,
  getFoodItemByName,
  getFoodsByRestaurantId,
  fuzzySearchFoodItem,
  fuzzySearchRestaurantFoodItem,
  createFoodItem,
  updateFoodItemDiscountById,
  updateFoodItemById,
  deleteFoodItemById,
  getRestaurantIdByItemId,
};
