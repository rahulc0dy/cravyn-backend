import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getUserByPhoneNo = async (phoneNumber) => {
  let user =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;
  return user;
};

const getUserById = async (user_id) => {
  let user = await sql`SELECT * FROM Customer WHERE customer_id = ${user_id};`;
  return user;
};

const setRefreshToken = async (refreshToken, customerId) => {
  const user = await sql`
    UPDATE Customer
    SET refresh_token = ${refreshToken}
    WHERE customer_id = ${customerId}
    RETURNING *;
  `;
  return user;
};

const createUser = async (name, phoneNumber, email, dateOfBirth, password) => {
  dateOfBirth.split("-");
  dateOfBirth[0];

  const formattedDateOfBirth = new Date(dateOfBirth)
    .toISOString()
    .split("T")[0];

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await sql`
      INSERT INTO Customer (name, phone_number, email_address, date_of_birth, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${formattedDateOfBirth}, ${hashedPassword})
      RETURNING *;
    `;
    return user[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteUser = async (user_id) => {};

export {
  getUserByPhoneNo,
  getUserById,
  setRefreshToken,
  createUser,
  deleteUser,
};
