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
};
