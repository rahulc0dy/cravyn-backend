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

const createFoodItem = async ({
  name,
  type,
  description,
  price,
  foodImageUrl,
  restaurantId,
}) => {
  const foodItem = await sql`
    INSERT INTO Food_Item ( food_name, type, description, price, food_image_url ) VALUES ( ${name}, ${type}, ${description}, ${price}, ${foodImageUrl}, ${restaurantId} ) RETURNING * ;
    `;

  return foodItem;
};

const updateFoodItemById = async (foodItemId, { name, type, description }) => {
  const foodItem = await sql`
    UPDATE Food_Item SET name=${name}, type=${type}, description=${description} WHERE item_id=${foodItemId} RETURNING * ;
    `;

  return foodItem;
};

const deleteFoodItemById = async (foodItemId) => {
  const foodItem = await sql`
    DELETE FROM Food_Item WHERE item_id=${foodItemId} RETURNING * ;
    `;
};

export {
  getFoodItemById,
  getFoodItemByName,
  createFoodItem,
  updateFoodItemById,
  deleteFoodItemById,
};
