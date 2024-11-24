import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getRestaurantOwnerByPhoneNo = async (phoneNumber) => {
  const restaurantOwner =
    await sql`SELECT * FROM Restaurant_Owner WHERE phone_number = ${phoneNumber};`;
  return restaurantOwner;
};

const getRestaurantOwnerById = async (restaurantOwnerId) => {
  const restaurantOwner =
    await sql`SELECT * FROM Restaurant_Owner WHERE id = ${restaurantOwnerId};`;
  return restaurantOwner;
};

const getRestaurantOwnerByEmail = async (email) => {
  const customer =
    await sql`SELECT * FROM Restaurant_Owner WHERE email_address = ${email};`;
  return customer;
};

const getNonSensitiveRestaurantOwnerInfoById = async (restaurantOwnerId) => {
  const restaurantOwner = await sql`
      SELECT id, name, phone_number, email_address, pan_number 
      FROM Restaurant_Owner 
      WHERE id = ${restaurantOwnerId};
    `;
  return restaurantOwner;
};

const setRefreshToken = async (refreshToken, restaurantOwnerId) => {
  const restaurantOwner = await sql`
    UPDATE Restaurant_Owner
    SET refresh_token = ${refreshToken}
    WHERE id = ${restaurantOwnerId}
    RETURNING id, name, phone_number, email_address, pan_number 
  `;
  return restaurantOwner;
};

const createRestaurantOwner = async (
  name,
  phoneNumber,
  email,
  panNumber,
  password
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const restaurantOwner = await sql`
      INSERT INTO Restaurant_Owner ( name, phone_number, email_address, pan_number, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${panNumber}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address, pan_number;
    `;
    return restaurantOwner[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteRestaurantOwner = async (restaurantOwnerId) => {
  try {
    const restaurantOwner =
      await sql`DELETE FROM Restaurant_Owner WHERE id=${restaurantOwnerId} RETURNING id, name, phone_number, email_address, pan_number`;
    return restaurantOwner;
  } catch (error) {
    throw new Error(error);
  }
};

const updateRestaurantOwnerNamePhoneNo = async (
  restaurantOwnerId,
  { name, phoneNumber }
) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Restaurant_Owner SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${restaurantOwnerId} RETURNING id, name, phone_number, email_address, pan_number;
  `;

  try {
    const restaurantOwner = await query;
    return restaurantOwner;
  } catch (error) {
    throw new Error(error);
  }
};

const updateRestaurantOwnerPassword = async (email, passwordHash) => {
  const query = sql`
  UPDATE Restaurant_Owner SET password = ${passwordHash} WHERE email_address = ${email} RETURNING id, name, phone_number, email_address;
  `;

  try {
    const restaurantOwner = await query;
    return restaurantOwner[0];
  } catch (error) {
    throw new Error(error);
  }
};

const getSalesData = async (restaurantOwnerId) => {
  const salesData = await sql`
      SELECT sum(orders.checkout_price) AS sales,count(*) as orders 
      from orders,restaurant
      WHERE restaurant.restaurant_id=orders.restaurant_id 
        AND restaurant.owner_id= ${restaurantOwnerId}
      GROUP BY owner_id
    `;
  return salesData;
};

const getRestaurantSalesData = async (restaurantOwnerId) => {
  const salesData = await sql`
      SELECT
          r.restaurant_id,
          r.name,
          r.city,
          r.street,
          r.pin_code,
          r.landmark,
          r.verify_status,
          r.restaurant_image_url,
          COALESCE(SUM(o.checkout_price), 0) AS sales,
          COALESCE(COUNT(o.order_id), 0) AS orders
      FROM restaurant r 
          LEFT JOIN orders o 
            ON o.restaurant_id = r.restaurant_id
      WHERE r.owner_id = ${restaurantOwnerId}
      GROUP BY
          r.restaurant_id,
          r.name,
          r.city,
          r.street,
          r.pin_code,
          r.landmark,
          r.verify_status,
          r.restaurant_image_url;
    `;

  salesData.forEach((restaurant) => {
    restaurant.rating = parseFloat((Math.random() * (5 - 3) + 3).toFixed(1));
  });

  return salesData;
};

const getFoodSalesData = async (restaurantId) => {
  const salesData = await sql`
      (SELECT count(*),sum(oi.price),fi.food_name
       FROM food_item fi,orders_list oi,orders o
       WHERE fi.item_id=oi.item_id
         AND o.list_id=oi.list_id
         AND o.restaurant_id=${restaurantId}
       GROUP BY oi.item_id, fi.food_name) UNION (
       SELECT 0,0,food_name
       FROM food_item
       WHERE restaurant_id=${restaurantId} 
         AND food_name NOT IN (SELECT fi.food_name
                               FROM food_item fi,orders_list oi,orders o
                               WHERE fi.item_id=oi.item_id
                                 AND o.list_id=oi.list_id
                                 AND o.restaurant_id=${restaurantId}
                               GROUP BY oi.item_id, fi.food_name)
       ) ORDER BY count DESC;
    `;
  return salesData;
};

export {
  getRestaurantOwnerByPhoneNo,
  getRestaurantOwnerById,
  getRestaurantOwnerByEmail,
  getNonSensitiveRestaurantOwnerInfoById,
  setRefreshToken,
  createRestaurantOwner,
  deleteRestaurantOwner,
  updateRestaurantOwnerNamePhoneNo,
  updateRestaurantOwnerPassword,
  getSalesData,
  getRestaurantSalesData,
  getFoodSalesData,
};
