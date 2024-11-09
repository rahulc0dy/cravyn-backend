import { sql } from "./database.js";

const getPendingOrdersByRestaurantId = async (restaurantId) => {
  const orders = await sql`
    SELECT * FROM Orders WHERE restaurant_id = ${restaurantId} AND order_status = 'Processing';
    `;
  return orders;
};

export { getPendingOrdersByRestaurantId };
