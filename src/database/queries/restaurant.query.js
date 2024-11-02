import { sql } from "./database.js";

const getRestaurantById = async (restaurantId) => {
  const restaurant =
    await sql`SELECT * FROM Restaurant WHERE restaurant_id = ${restaurantId};`;
  return restaurant;
};

const getNonSensitiveRestaurantInfoById = async (restaurantId) => {
  const restaurant = await sql`
        SELECT restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token 
        FROM Restaurant 
        WHERE restaurant_id = ${restaurantId}
        ;`;
  return restaurant;
};

const getNonSensitiveRestaurantInfoByRegNo = async (
  restaurantRegistrationNo
) => {
  const restaurant = await sql`
        SELECT restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token 
        FROM Restaurant 
        WHERE registration_no = ${restaurantRegistrationNo}
        ;`;
  return restaurant;
};

const createRestaurant = async ({
  name,
  registrationNo,
  ownerId,
  lat,
  long,
  city,
  street,
  landmark,
  pinCode,
  availabilityStatus,
  licenseUrl,
  gstinNo,
  accountNo,
  ifscCode,
  bankName,
  bankBranchCity,
  passwordHash,
}) => {
  const restaurant = await sql`
    INSERT INTO Restaurant ( name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, availability_status, license_url, gstin_no, account_number, ifsc_code, bank_name, branch_city, password )
    VALUES(${name}, ${registrationNo}, ${ownerId}, ${lat}, ${long}, ${city}, ${street}, ${landmark}, ${pinCode}, ${availabilityStatus}, ${licenseUrl}, ${gstinNo}, ${accountNo}, ${ifscCode}, ${bankName}, ${bankBranchCity}, ${passwordHash})
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token ;
    `;
  return restaurant;
};

const updateRestaurantNameOwnerAvailabilityById = async (
  restaurantId,
  { name, licenseUrl, availabilityStatus }
) => {
  const restaurant = await sql`
    UPDATE Restaurant SET name=${name}, license_url=${licenseUrl}, availability_status=${availabilityStatus}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token ;
    `;
  return restaurant;
};

const setRestaurantVerificationStatusById = async (restaurantId, status) => {
  const restaurant = await sql`
    UPDATE Restaurant SET verify_status=${status}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, verify_status, license_url, refresh_token ;
    `;
  return restaurant;
};

const setRefreshToken = async (refreshToken, restaurantId) => {
  const restaurant = await sql`
    UPDATE Restaurant
    SET refresh_token = ${refreshToken}
    WHERE restaurant_id = ${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token;
  `;
  return restaurant;
};

const updateRestaurantPaymentDetailsById = async (
  restaurantId,
  { gstinNo, AccountNo, ifscCode, bankName, bankBranchCity }
) => {
  const restaurant = await sql`
    UPDATE Restaurant SET gstin_no=${gstinNo}, account_number=${AccountNo}, ifsc_code=${ifscCode}, bank_name=${bankName}, branch_city=${bankBranchCity}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token ;
    `;
  return restaurant;
};

const updateRestaurantPasswordById = async (restaurantId, { password }) => {
  const restaurant = await sql`
    UPDATE Restaurant SET password=${password}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url, refresh_token ;
    `;
  return restaurant;
};

const deleteRestaurantById = async (restaurantId) => {
  const restaurant = await sql`
    DELETE FROM Restaurant WHERE restaurant_id=${restaurantId} RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
    `;
  return restaurant;
};

export {
  getRestaurantById,
  getNonSensitiveRestaurantInfoById,
  getNonSensitiveRestaurantInfoByRegNo,
  createRestaurant,
  updateRestaurantNameOwnerAvailabilityById,
  updateRestaurantPaymentDetailsById,
  updateRestaurantPasswordById,
  setRestaurantVerificationStatusById,
  setRefreshToken,
  deleteRestaurantById,
};
