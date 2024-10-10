import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getUserByPhoneNo = async (phoneNumber) => {
  const user =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;
  return user;
};

const getUserById = async (userId) => {
  const user = await sql`SELECT * FROM Customer WHERE id = ${userId};`;
  return user;
};

const getUserByEmail = async (email) => {
  const user =
    await sql`SELECT * FROM Customer WHERE email_address = ${email};`;
  return user;
};

const getNonSensitiveUserInfoById = async (userId) => {
  const user = await sql`
      SELECT id, name, email_address, phone_number 
      FROM Customer 
      WHERE id = ${userId};
    `;
  return user;
};

const setRefreshToken = async (refreshToken, customerId) => {
  const user = await sql`
    UPDATE Customer
    SET refresh_token = ${refreshToken}
    WHERE id = ${customerId}
    RETURNING *;
  `;
  return user;
};

const createUser = async (name, phoneNumber, email, dateOfBirth, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await sql`
      INSERT INTO Customer (name, phone_number, email_address, date_of_birth, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${dateOfBirth}, ${hashedPassword})
      RETURNING *;
    `;
    return user[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteUser = async (userId) => {
  try {
    const user = await sql`DELETE FROM Customer WHERE id=${userId} RETURNING *`;
    return user;
  } catch (error) {
    throw new Error(error);
  }
};

const updateUser = async (userId, { name, phoneNumber }) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Customer SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${userId};
  `;

  try {
    const user = await query;
    return user;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getUserByPhoneNo,
  getUserById,
  getUserByEmail,
  getNonSensitiveUserInfoById,
  setRefreshToken,
  createUser,
  deleteUser,
  updateUser,
};
