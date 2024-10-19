import { sql } from "./database.js";

const getPreparesById = async (foodItemId, restaurantId) => {
  const prepares = await sql`
    SELECT * FROM Prepares WHERE item_id = ${foodItemId} AND restaurant_id = ${restaurantId} ;
    `;
  return prepares;
};

const createPrepares = async ({
  foodItemId,
  restaurantId,
  price,
  foodImageUrl,
  description,
}) => {
  const prepares = await sql`
    INSERT INTO Prepares ( item_id, restaurant_id, price, food_image_url, description ) VALUES ( ${foodItemId}, ${restaurantId}, ${price}, ${foodImageUrl}, ${description} ) RETURNING * ;
    `;

  return prepares;
};

const updatePreparesPriceById = async (foodItemId, restaurantId, price) => {
  const prepares = await sql`
    UPDATE Prepares SET price=${price} WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId} RETURNING * ;
    `;

  return prepares;
};

const updatePreparesImageDescriptionById = async (
  foodItemId,
  restaurantId,
  foodImageUrl,
  description
) => {
  const prepares = await sql`
    UPDATE Prepares SET food_image_url=${foodImageUrl}, description=${description} WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId} RETURNING * ;
    `;

  return prepares;
};

const updatePreparesDiscountById = async ({
  foodItemId,
  restaurantId,
  discountPercent,
  discountCap,
}) => {
  const prepares = await sql`
    UPDATE Prepares SET discount_percent=${discountPercent}, discount_cap=${discountCap} WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId} RETURNING * ;
    `;

  return prepares;
};

const deletePreparesById = async (foodItemId, restaurantId) => {
  const prepares = await sql`
    DELETE FROM Prepares WHERE item_id=${foodItemId} AND restaurant_id=${restaurantId} RETURNING * ;
    `;
  return prepares;
};

export {
  getPreparesById,
  createPrepares,
  updatePreparesPriceById,
  updatePreparesImageDescriptionById,
  updatePreparesDiscountById,
  deletePreparesById,
};
