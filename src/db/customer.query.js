import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getCustomerByPhoneNo = async (phoneNumber) => {
  const customer =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;
  return customer;
};

const getCustomerById = async (customerId) => {
  const customer = await sql`SELECT * FROM Customer WHERE id = ${customerId};`;
  return customer;
};

const getCustomerByEmail = async (email) => {
  const customer =
    await sql`SELECT * FROM Customer WHERE email_address = ${email};`;
  return customer;
};

const getNonSensitiveCustomerInfoById = async (customerId) => {
  const customer = await sql`
      SELECT id, name, email_address, phone_number 
      FROM Customer 
      WHERE id = ${customerId};
    `;
  return customer;
};

const setRefreshToken = async (refreshToken, customerId) => {
  const customer = await sql`
    UPDATE Customer
    SET refresh_token = ${refreshToken}
    WHERE id = ${customerId}
    RETURNING *;
  `;
  return customer;
};

const createCustomer = async (
  name,
  phoneNumber,
  email,
  dateOfBirth,
  password
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const customer = await sql`
      INSERT INTO Customer (name, phone_number, email_address, date_of_birth, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${dateOfBirth}, ${hashedPassword})
      RETURNING *;
    `;
    return customer[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCustomer = async (customerId) => {
  try {
    const customer =
      await sql`DELETE FROM Customer WHERE id=${customerId} RETURNING *`;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

const updateCustomerNamePhoneNo = async (customerId, { name, phoneNumber }) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Customer SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${customerId} RETURNING *;
  `;

  try {
    const customer = await query;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

const updateCustomerImageUrl = async (customerId, ImageUrl) => {
  const query = sql`
  UPDATE Customer SET profile_image_url = ${ImageUrl} WHERE id = ${customerId} RETURNING *;
  `;

  try {
    const customer = await query;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getCustomerByPhoneNo,
  getCustomerById,
  getCustomerByEmail,
  getNonSensitiveCustomerInfoById,
  setRefreshToken,
  createCustomer,
  deleteCustomer,
  updateCustomerNamePhoneNo,
  updateCustomerImageUrl,
};
