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

const getNonSensitiveRestaurantOwnerInfoById = async (restaurantOwnerId) => {
  const restaurantOwner = await sql`
      SELECT id, name, phone_number, pan_number, restaurants 
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
    RETURNING id, name, phone_number, pan_number, restaurants 
  `;
  return restaurantOwner;
};

const createRestaurantOwner = async (
  name,
  phoneNumber,
  panNumber,
  password
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const restaurantOwner = await sql`
      INSERT INTO Restaurant_Owner ( name, phone_number, pan_number, password)
      VALUES (${name}, ${phoneNumber}, ${panNumber}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address, date_of_birth;
    `;
    return restaurantOwner[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteRestaurantOwner = async (restaurantOwnerId) => {
  try {
    const restaurantOwner =
      await sql`DELETE FROM Restaurant_Owner WHERE id=${restaurantOwnerId} RETURNING id, name, phone_number, pan_number`;
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
  UPDATE Restaurant_Owner SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${restaurantOwnerId} RETURNING id, name, phone_number, pan_number;
  `;

  try {
    const restaurantOwner = await query;
    return restaurantOwner;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getRestaurantOwnerByPhoneNo,
  getRestaurantOwnerById,
  getNonSensitiveRestaurantOwnerInfoById,
  setRefreshToken,
  createRestaurantOwner,
  deleteRestaurantOwner,
  updateRestaurantOwnerNamePhoneNo,
};
