import { sql } from "./database.js";

const getOrdersByRestaurantId = async (restaurantId, orderStatus) => {
  const orders = await sql`
      SELECT
          o.order_id,
          o.customer_id,
          o.partner_id,
          o.ratings,
          o.reviews,
          o.specifications,
          o.order_status,
          o.product_image_url,
          o.checkout_price,
          o.list_id,
          o.order_timestamp,
          cu.name AS customer_name,
          dp.name AS delivery_partner_name,
          dp.vehicle_type,
          dp.phone_number,
          ca.display_address,
          JSON_AGG(
                  JSON_BUILD_OBJECT(
                          'item_id', ol.item_id,
                          'quantity', ol.quantity,
                          'item_price', ol.price,
                          'food_name', fi.food_name,
                          'food_type', fi.type,
                          'food_image_url', fi.food_image_url
                  )
          ) AS items
      FROM
          orders o
              JOIN orders_list ol ON o.list_id = ol.list_id
              JOIN food_item fi ON ol.item_id = fi.item_id
              JOIN customer cu ON o.customer_id = cu.id
              JOIN delivery_partner dp ON o.partner_id = dp.id 
              JOIN customer_address ca on o.address_id = ca.address_id
      WHERE
          o.restaurant_id = ${restaurantId}
        AND o.order_status = ${orderStatus}
      GROUP BY
          o.order_id, cu.name, dp.name, dp.vehicle_type, dp.phone_number, ca.display_address;
  `;
  return orders;
};

const createOrder = async (
  customerId,
  restaurantId,
  specifications = null,
  checkoutPrice,
  addressId
) => {
  const newOrder = await sql`
    INSERT INTO orders (
      customer_id,
      restaurant_id,
      specifications,
      checkout_price,
      address_id,
      order_status
    ) VALUES (
      ${customerId}, 
      ${restaurantId}, 
      ${specifications}, 
      ${checkoutPrice}, 
      ${addressId}, 
      'Preparing'
    )
    RETURNING *;
  `;
  return newOrder[0];
};

const createOrderList = async (listId, itemId, quantity, price) => {
  await sql`
    INSERT INTO orders_list (list_id, item_id, quantity, price)
    VALUES (${listId}, ${itemId}, ${quantity}, ${price})
    RETURNING list_id, item_id, quantity, price;
  `;
};

const updateOrderStatusByOrderId = async (orderId, restaurantId, status) => {
  const order = await sql`
    UPDATE orders 
    SET order_status = ${status}
    WHERE order_id = ${orderId} 
      AND restaurant_id = ${restaurantId}
    RETURNING *;
    `;
  return order;
};

export {
  getOrdersByRestaurantId,
  createOrder,
  createOrderList,
  updateOrderStatusByOrderId,
};
