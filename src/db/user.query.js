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

const updateUser = async (
  userId,
  { name, phoneNumber, email, dateOfBirth, password }
) => {
  const fields = [];

  if (name) fields.push(sql`name = ${name}`);
  if (phoneNumber) fields.push(sql`phone_number = ${phoneNumber}`);
  if (email) fields.push(sql`email_address = ${email}`);
  if (dateOfBirth) fields.push(sql`date_of_birth = ${dateOfBirth}`);
  if (password) fields.push(sql`password = ${password}`);

  if (fields.length === 0) {
    throw new Error("No fields provided for update");
  }

  const query = sql`
    UPDATE Customers 
    SET ${sql.join(fields, sql`, `)}
    WHERE id = ${userId}
    RETURNING *;
  `;

  const user = await query;
  return user;
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
