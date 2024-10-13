import { sql } from "./database.js";
import bcrypt from "bcrypt";

/**
 * Retrieves a customer by their phone number.
 *
 * @async
 * @function getCustomerByPhoneNo
 * @param {string} phoneNumber - The customer's phone number.
 * @returns {Promise<object[]>} A promise that resolves to an array containing customer details.
 */
const getCustomerByPhoneNo = async (phoneNumber) => {
  const customer =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;
  return customer;
};

/**
 * Retrieves a customer by their ID.
 *
 * @async
 * @function getCustomerById
 * @param {number} customerId - The customer's ID.
 * @returns {Promise<object[]>} A promise that resolves to an array containing customer details.
 */
const getCustomerById = async (customerId) => {
  const customer = await sql`SELECT * FROM Customer WHERE id = ${customerId};`;
  return customer;
};

/**
 * Retrieves a customer by their email address.
 *
 * @async
 * @function getCustomerByEmail
 * @param {string} email - The customer's email address.
 * @returns {Promise<object[]>} A promise that resolves to an array containing customer details.
 */
const getCustomerByEmail = async (email) => {
  const customer =
    await sql`SELECT * FROM Customer WHERE email_address = ${email};`;
  return customer;
};

/**
 * Retrieves non-sensitive customer information by their ID.
 *
 * @async
 * @function getNonSensitiveCustomerInfoById
 * @param {number} customerId - The customer's ID.
 * @returns {Promise<object[]>} A promise that resolves to an array containing non-sensitive customer details.
 */
const getNonSensitiveCustomerInfoById = async (customerId) => {
  const customer = await sql`
      SELECT id, name, email_address, phone_number, profile_image_url,date_of_birth 
      FROM Customer 
      WHERE id = ${customerId};
    `;
  return customer;
};

/**
 * Sets or updates the refresh token for a customer.
 *
 * @async
 * @function setRefreshToken
 * @param {string} refreshToken - The new refresh token.
 * @param {number} customerId - The customer's ID.
 * @returns {Promise<object[]>} A promise that resolves to an array containing the updated customer details.
 */
const setRefreshToken = async (refreshToken, customerId) => {
  const customer = await sql`
    UPDATE Customer
    SET refresh_token = ${refreshToken}
    WHERE id = ${customerId}
    RETURNING id, name, phone_number, email_address, date_of_birth;
  `;
  return customer;
};

/**
 * Creates a new customer account with provided details.
 *
 * @async
 * @function createCustomer
 * @param {string} name - The customer's name.
 * @param {string} phoneNumber - The customer's phone number.
 * @param {string} email - The customer's email address.
 * @param {string} dateOfBirth - The customer's date of birth.
 * @param {string} password - The customer's password (will be hashed).
 * @returns {Promise<object>} A promise that resolves to an object containing the created customer details.
 */
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
      RETURNING id, name, phone_number, email_address, date_of_birth;
    `;
    return customer[0];
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Deletes a customer account by ID.
 *
 * @async
 * @function deleteCustomer
 * @param {number} customerId - The customer's ID.
 * @returns {Promise<object[]>} A promise that resolves to an array containing details of the deleted customer.
 */
const deleteCustomer = async (customerId) => {
  try {
    const customer =
      await sql`DELETE FROM Customer WHERE id=${customerId} RETURNING id, name, phone_number, email_address, date_of_birth`;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Updates the customer's name and/or phone number.
 *
 * @async
 * @function updateCustomerNamePhoneNo
 * @param {number} customerId - The customer's ID.
 * @param {object} params - An object containing the new name and/or phone number.
 * @param {string} [params.name] - The new name for the customer.
 * @param {string} [params.phoneNumber] - The new phone number for the customer.
 * @returns {Promise<object[]>} A promise that resolves to an array containing the updated customer details.
 * @throws {Error} Throws an error if no update fields are provided.
 */
const updateCustomerNamePhoneNo = async (customerId, { name, phoneNumber }) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
  UPDATE Customer SET name = ${name}, phone_number = ${phoneNumber} WHERE id = ${customerId} RETURNING id, name, phone_number, email_address, date_of_birth;
  `;

  try {
    const customer = await query;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Updates the customer's profile image URL.
 *
 * @async
 * @function updateCustomerImageUrl
 * @param {number} customerId - The customer's ID.
 * @param {string} imageUrl - The new profile image URL.
 * @returns {Promise<object[]>} A promise that resolves to an array containing the updated customer details.
 */
const updateCustomerImageUrl = async (customerId, imageUrl) => {
  const query = sql`
  UPDATE Customer SET profile_image_url = ${imageUrl} WHERE id = ${customerId} RETURNING id, name, phone_number, email_address, date_of_birth;
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
