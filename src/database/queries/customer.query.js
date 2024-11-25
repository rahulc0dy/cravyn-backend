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
      SELECT id, name, email_address, phone_number, profile_image_url,date_of_birth 
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
    RETURNING id, name, phone_number, email_address, date_of_birth;
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
      RETURNING id, name, phone_number, email_address, date_of_birth;
    `;
    return customer[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteCustomer = async (customerId) => {
  try {
    const customer =
      await sql`DELETE FROM Customer WHERE id=${customerId} RETURNING id, name, phone_number, email_address, date_of_birth`;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

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

const updateCustomerPassword = async (email, passwordHash) => {
  const query = sql`
  UPDATE Customer SET password = ${passwordHash} WHERE email_address = ${email} RETURNING id, name, phone_number, email_address;
  `;

  try {
    const customer = await query;
    return customer[0];
  } catch (error) {
    throw new Error(error);
  }
};

const getCustomerAddressByAddressId = async (addressId) => {
  const customer = await sql`
    SELECT * 
    FROM customer_address 
    WHERE address_id = ${addressId};
    `;
  return customer[0];
};

const getCustomerAddressesByCustomerId = async (customerId, isDefault) => {
  let addresses;

  if (isDefault === undefined || isDefault === null) {
    addresses = await sql`
    SELECT * 
    FROM customer_address
    WHERE customer_id = ${customerId};
    `;
  } else {
    addresses = await sql`
    SELECT * 
    FROM customer_address
    WHERE customer_id = ${customerId} 
      AND is_default = ${isDefault};
    `;
  }

  return addresses;
};

const createCustomerAddress = async ({
  customerId,
  latitude,
  longitude,
  displayAddress,
  isDefault = false,
}) => {
  const address = await sql`
      INSERT INTO customer_address (latitude, longitude, display_address, is_default, customer_id)
      VALUES (${latitude}, ${longitude}, ${displayAddress}, ${isDefault}, ${customerId})
      RETURNING *;
    `;

  return address;
};

const deleteCustomerAddressByAddressId = async (addressId) => {
  const response = await sql`
    DELETE 
    FROM customer_address 
    WHERE address_id = ${addressId} 
      AND is_default = FALSE;
    `;
  return response;
};

const updateCustomerDefaultAddressByAddressId = async (addressId) => {
  const response = await sql`
    UPDATE customer_address 
    SET is_default = TRUE 
    WHERE address_id = ${addressId}
    RETURNING *;
    `;

  return response;
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
  updateCustomerPassword,
  getCustomerAddressesByCustomerId,
  getCustomerAddressByAddressId,
  createCustomerAddress,
  deleteCustomerAddressByAddressId,
  updateCustomerDefaultAddressByAddressId,
};
