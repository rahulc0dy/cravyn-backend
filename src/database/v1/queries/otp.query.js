import { sql } from "../database.js";

const storeOtp = async (userType, userId, otpHash) => {
  let query;
  switch (userType) {
    case "customer":
      query = sql`
      UPDATE Customer SET otp = ${otpHash} WHERE id = ${userId} RETURNING id, name, phone_number, email_address;
      `;
      break;
    case "restaurantOwner":
      query = sql`
      UPDATE Restaurant_Owner SET otp = ${otpHash} WHERE id = ${userId} RETURNING id, name, phone_number, email_address;
      `;
      break;
    case "deliveryPartner":
      query = sql`
      UPDATE Delivery_Partner SET otp = ${otpHash} WHERE id = ${userId} RETURNING id, name, phone_number, email_address;
      `;
      break;
    default:
      break;
  }

  try {
    const customer = await query;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

const getOtp = async (userType, email) => {
  let query;
  switch (userType) {
    case "customer":
      query = sql`
      SELECT otp FROM Customer WHERE email_address = ${email};
      `;
      break;
    case "restaurantOwner":
      query = sql`
      SELECT otp FROM Restaurant_Owner WHERE email_address = ${email};
      `;
      break;
    case "deliveryPartner":
      query = sql`
      SELECT otp FROM Delivery_Partner WHERE email_address = ${email};
      `;
      break;
    default:
      break;
  }

  try {
    const customer = await query;
    return customer;
  } catch (error) {
    throw new Error(error);
  }
};

export { storeOtp, getOtp };
