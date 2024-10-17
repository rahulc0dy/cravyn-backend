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
  const restaurant = sql`
    INSERT INTO Restaurant ( name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, availability_status, license_url )
    values(${name}, ${registrationNo}, ${ownerId}, ${lat}, ${long}, ${city}, ${street}, ${landmark}, ${pinCode}, ${availabilityStatus}, ${licenseUrl})
    RETURNING *
    `;
  return restaurant;
};

export { getRestaurantById, createRestaurant };
