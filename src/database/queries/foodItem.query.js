import { sql } from "./database.js";

const getFoodItemById = async (foodItemId) => {
  const foodItem = await sql`
    SELECT * FROM Food_Item WHERE item_id = ${foodItemId};
    `;
  return foodItem;
};

const getFoodItemByName = async (name) => {
  const foodItem = await sql`
    SELECT * FROM Food_Item WHERE name = ${name};
    `;
  return foodItem;
};

const createFoodItem = async ({ name, type }) => {
  const foodItem = await sql`
    INSERT INTO Food_Item ( name, type ) VALUES ( ${name}, ${type} ) RETURNING * ;
    `;

  return foodItem;
};

const updateFoodItemById = async (foodItemId, name, type) => {
  const foodItem = await sql`
    UPDATE Food_Item SET name=${name}, type=${type} WHERE item_id=${foodItemId} RETURNING * ;
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
