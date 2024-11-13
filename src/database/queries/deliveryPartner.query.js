import { sql } from "./database.js";
import bcrypt from "bcrypt";

const getDeliveryPartnerByPhoneNo = async (phoneNumber) => {
  const deliveryPartner =
    await sql`SELECT * FROM Delivery_Partner WHERE phone_number = ${phoneNumber};`;
  return deliveryPartner;
};

const getDeliveryPartnerById = async (deliveryPartnerId) => {
  const deliveryPartner =
    await sql`SELECT * FROM Delivery_Partner WHERE id = ${deliveryPartnerId};`;
  return deliveryPartner;
};

const getDeliveryPartnerByEmail = async (email) => {
  const deliveryPartner =
    await sql`SELECT * FROM Delivery_Partner WHERE email_address = ${email};`;
  return deliveryPartner;
};

const getNonSensitiveDeliveryPartnerInfoById = async (deliveryPartnerId) => {
  const deliveryPartner = await sql`
      SELECT id, name, email_address, phone_number, profile_image_url, vehicle_type, availability
      FROM Delivery_Partner 
      WHERE id = ${deliveryPartnerId};
    `;
  return deliveryPartner;
};

const setRefreshToken = async (refreshToken, deliveryPartnerId) => {
  const deliveryPartner = await sql`
    UPDATE Delivery_Partner
    SET refresh_token = ${refreshToken}
    WHERE id = ${deliveryPartnerId}
    RETURNING id, name, phone_number, email_address, vehicle_type, availability;
  `;
  return deliveryPartner;
};

const createDeliveryPartner = async ({
  name,
  phoneNumber,
  email,
  vehicleType,
  availability,
  password,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const deliveryPartner = await sql`
      INSERT INTO Delivery_Partner (name, phone_number, email_address, vehicle_type, availability, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${vehicleType}, ${availability}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address, vehicle_type, availability;
    `;
    return deliveryPartner[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteDeliveryPartner = async (deliveryPartnerId) => {
  try {
    const deliveryPartner =
      await sql`DELETE FROM Delivery_Partner WHERE id=${deliveryPartnerId} RETURNING id, name, phone_number, email_address, vehicle_type, availability`;
    return deliveryPartner;
  } catch (error) {
    throw new Error(error);
  }
};

const updateDeliveryPartnerNamePhoneNoVehicleAvailability = async (
  deliveryPartnerId,
  { name, phoneNumber, vehicleType, availability }
) => {
  if (!name && !phoneNumber && !vehicleType && !availability)
    throw new Error("No update fields provided");

  const query = sql`
  UPDATE Delivery_Partner SET name = ${name}, phone_number = ${phoneNumber}, vehicle_type = ${vehicleType} WHERE id = ${deliveryPartnerId} RETURNING id, name, phone_number, email_address, vehicle_type;
  `;

  try {
    const deliveryPartner = await query;
    return deliveryPartner;
  } catch (error) {
    throw new Error(error);
  }
};

const updateDeliveryPartnerImageUrl = async (deliveryPartnerId, imageUrl) => {
  const query = sql`
  UPDATE Delivery_Partner SET profile_image_url = ${imageUrl} WHERE id = ${deliveryPartnerId} RETURNING id, name, phone_number, email_address, vehicle_type, availability;
  `;

  try {
    const deliveryPartner = await query;
    return deliveryPartner;
  } catch (error) {
    throw new Error(error);
  }
};

const updateDeliveryPartnerPassword = async (email, passwordHash) => {
  const query = sql`
  UPDATE Delivery_Partner SET password = ${passwordHash} WHERE email_address = ${email} RETURNING id, name, phone_number, email_address;
  `;

  try {
    const deliveryPartner = await query;
    return deliveryPartner[0];
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getDeliveryPartnerByPhoneNo,
  getDeliveryPartnerById,
  getDeliveryPartnerByEmail,
  getNonSensitiveDeliveryPartnerInfoById,
  setRefreshToken,
  createDeliveryPartner,
  deleteDeliveryPartner,
  updateDeliveryPartnerNamePhoneNoVehicleAvailability,
  updateDeliveryPartnerImageUrl,
  updateDeliveryPartnerPassword,
};
