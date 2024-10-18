import { sql } from "./database.js";

const getRestaurantById = async (restaurantId) => {
  const restaurant =
    await sql`SELECT * FROM Restaurant WHERE restaurant_id = ${restaurantId};`;
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
}) => {
  const restaurant = await sql`
    INSERT INTO Restaurant ( name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, availability_status, license_url )
    values(${name}, ${registrationNo}, ${ownerId}, ${lat}, ${long}, ${city}, ${street}, ${landmark}, ${pinCode}, ${availabilityStatus}, ${licenseUrl})
    RETURNING *
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
    RETURNING *
    `;
  return restaurant;
};

const setRestaurantVerificationStatusById = async (restaurantId, status) => {
  const restaurant = await sql`
    UPDATE Restaurant SET verification_status=${status}
    WHERE restaurant_id=${restaurantId}
    RETURNING *
    `;
  return restaurant;
};

const deleteRestaurantById = async (restaurantId) => {
  const restaurant = await sql`
    DELETE FROM Restaurant WHERE restaurant_id=${restaurantId} RETURNING *
    `;
  return restaurant;
};

export {
  getRestaurantById,
  createRestaurant,
  updateRestaurantNameOwnerAvailabilityById,
  setRestaurantVerificationStatusById,
  deleteRestaurantById,
};
