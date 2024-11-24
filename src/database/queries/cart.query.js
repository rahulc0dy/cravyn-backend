import { sql } from "./database.js";

const addItemtoCart = async (customerId, itemId, restaurantId) => {
  const cartItem = await sql`
    INSERT INTO cart (customer_id, item_id, restaurant_id, quantity)
    VALUES (${customerId}, ${itemId}, ${restaurantId}, 1)
    ON CONFLICT (customer_id, item_id, restaurant_id)
    DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
    RETURNING item_id, quantity ;
    `;
  return cartItem[0];
};

export { addItemtoCart };
