import { sql } from "./database.js";

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

export {
  addItemtoCartByIds,
  removeItemFromCartByIds,
  incrementCartItem,
  decrementCartItem,
};
