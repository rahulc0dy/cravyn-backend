import { sql } from "../database.js";

const getCartByCustomerId = async (customerId) => {
  const cart = await sql`
    SELECT
      cart.item_id,
      cart.restaurant_id,
      cart.quantity,
      food_item.food_name,
      food_item.description AS food_description,
      food_item.price AS food_price,
      food_item.discount_percent AS food_discount_percent,
      food_item.discount_cap AS food_discount_cap,
      food_item.food_image_url
    FROM
      cart
    JOIN
      food_item ON cart.item_id = food_item.item_id
    WHERE
      cart.customer_id = ${customerId};
  `;
  return cart;
};

const addItemtoCartByIds = async (customerId, itemId, restaurantId) => {
  const cartItem = await sql`
    INSERT INTO cart (customer_id, item_id, restaurant_id, quantity)
    VALUES (${customerId}, ${itemId}, ${restaurantId}, 1)
    ON CONFLICT (customer_id, item_id, restaurant_id)
    DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
    RETURNING item_id, quantity ;
    `;
  return cartItem[0];
};

const removeItemFromCartByIds = async (customerId, itemId, restaurantId) => {
  const deletedItem = await sql`
    DELETE FROM cart
    WHERE customer_id = ${customerId}
      AND item_id = ${itemId}
      AND restaurant_id = ${restaurantId}
    RETURNING item_id;
  `;

  return deletedItem[0];
};

const incrementCartItem = async (customerId, itemId, restaurantId) => {
  const updatedItem = await sql`
    UPDATE cart
    SET quantity = quantity + 1
    WHERE customer_id = ${customerId} AND item_id = ${itemId} AND restaurant_id = ${restaurantId}
    RETURNING item_id, quantity;
  `;
  return updatedItem[0] || null;
};

const decrementCartItem = async (customerId, itemId, restaurantId) => {
  const updatedItem = await sql`
    WITH updated_item AS (
      -- Decrement the quantity if it's greater than 1
      UPDATE cart
      SET quantity = quantity - 1
      WHERE customer_id = ${customerId}
        AND item_id = ${itemId}
        AND restaurant_id = ${restaurantId}
        AND quantity > 1
      RETURNING item_id, quantity
    ), deleted_item AS (
      -- Delete the item if the quantity was 1
      DELETE FROM cart
      WHERE customer_id = ${customerId}
        AND item_id = ${itemId}
        AND restaurant_id = ${restaurantId}
        AND NOT EXISTS (SELECT 1 FROM updated_item)
      RETURNING item_id
    )
    -- Return the result of either the update or delete
    SELECT item_id, quantity FROM updated_item
    UNION ALL
    SELECT item_id, 0 AS quantity FROM deleted_item;
  `;
  return updatedItem[0] || null;
};

const deleteCartByCustomerId = async (customerId) => {
  const deletedItem = await sql`
    DELETE FROM cart
    WHERE customer_id = ${customerId}
  `;

  return deletedItem[0];
};

export {
  getCartByCustomerId,
  addItemtoCartByIds,
  removeItemFromCartByIds,
  incrementCartItem,
  decrementCartItem,
  deleteCartByCustomerId,
};
