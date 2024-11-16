import { sql } from "./database.js";

const getRestaurantById = async (restaurantId) => {
  const restaurant =
    await sql`SELECT * FROM Restaurant WHERE restaurant_id = ${restaurantId};`;
  return restaurant;
};

const getNonSensitiveRestaurantInfoById = async (restaurantId) => {
  const restaurant = await sql`
        SELECT restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url 
        FROM Restaurant 
        WHERE restaurant_id = ${restaurantId}
        ;`;
  return restaurant;
};

const getNonSensitiveRestaurantInfoByRegNo = async (
  restaurantRegistrationNo
) => {
  const restaurant = await sql`
        SELECT restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url 
        FROM Restaurant 
        WHERE registration_no = ${restaurantRegistrationNo}
        ;`;
  return restaurant;
};

const getRestaurants = async (limit = null, offset = null) => {
  const restaurants = await sql`
    SELECT * FROM Restaurant LIMIT ${limit};
    `;
  return restaurants;
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
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
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
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
    `;
  return restaurant;
};

const setRestaurantVerificationStatusById = async (restaurantId, status) => {
  const restaurant = await sql`
    UPDATE Restaurant SET verify_status=${status}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, verify_status, license_url ;
    `;
  return restaurant;
};

const setRefreshToken = async (refreshToken, restaurantId) => {
  const restaurant = await sql`
    UPDATE Restaurant
    SET refresh_token = ${refreshToken}
    WHERE restaurant_id = ${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url;
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
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
    `;
  return restaurant;
};

const updateRestaurantPasswordById = async (restaurantId, { password }) => {
  const restaurant = await sql`
    UPDATE Restaurant SET password=${password}
    WHERE restaurant_id=${restaurantId}
    RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
    `;
  return restaurant;
};

const deleteRestaurantById = async (restaurantId) => {
  const restaurant = await sql`
    DELETE FROM Restaurant WHERE restaurant_id=${restaurantId} RETURNING restaurant_id, name, registration_no, owner_id, latitude, longitude, city, street, landmark, pin_code, license_url ;
    `;
  return restaurant;
};

const fuzzySearchRestaurant = async (name) => {
  const threshold = 0.3; // Adjust this value for sensitivity
  const restaurants = await sql`
    SELECT *
    FROM restaurant
    WHERE similarity(name, ${name}) > ${threshold}
    ORDER BY similarity(name, ${name}) DESC
  `;
  return restaurants;
};

const getRestaurantsByDistanceOrRating = async ({
  lat,
  long,
  minRating = 0,
  limit = 50,
  sortBy = "distance",
  radius = 30,
  descending = false,
}) => {
  const restaurants = await sql`
      SELECT
        r.restaurant_id,
        r.name,
        r.restaurant_image_url,
        r.latitude,
        r.longitude,
        r.city,
        r.street,
        r.landmark,
        r.pin_code,
        r.availability_status,
        r.distance,
        f.max_discount_percent,
        f.max_discount_cap
      FROM (
              SELECT
                restaurant_id,
                name,
                restaurant_image_url,
                latitude,
                longitude,
                city,
                street,
                landmark,
                pin_code,
                availability_status,
                ( 
                  6371
                  * acos(
                      cos(radians(${lat}))
                      * cos(radians(latitude))
                      * cos(radians(longitude) - radians(${long}))
                      + sin(radians(${lat}))
                      * sin(radians(latitude))
                    )
                ) AS distance
              FROM Restaurant
      ) AS r
      LEFT JOIN (
        SELECT
            restaurant_id,
            MAX(discount_percent) AS max_discount_percent,
            MAX(discount_cap) AS max_discount_cap
        FROM food_item
        GROUP BY restaurant_id
      ) AS f
      ON r.restaurant_id = f.restaurant_id
      WHERE r.distance < ${radius}
      ORDER BY ${sortBy}
      LIMIT ${limit};
  `;

  // todo: calculating rating for the restaurant
  restaurants.forEach((restaurant) => {
    restaurant.rating = parseFloat(
      (Math.random() * (5 - minRating) + minRating).toFixed(1)
    );
    const [minTime, maxTime] = [
      restaurant.distance / 25 + 5,
      restaurant.distance / 10 + 10,
    ];
    restaurant.minTime = Math.floor(minTime);
    restaurant.maxTime = Math.ceil(maxTime);
    restaurant.rating_number = Math.floor(Math.random() * (10000 - 100) + 100);
  });

  return restaurants;
};

export {
  getRestaurantById,
  getNonSensitiveRestaurantInfoById,
  getNonSensitiveRestaurantInfoByRegNo,
  getRestaurants,
  createRestaurant,
  updateRestaurantNameOwnerAvailabilityById,
  updateRestaurantPaymentDetailsById,
  updateRestaurantPasswordById,
  setRestaurantVerificationStatusById,
  setRefreshToken,
  deleteRestaurantById,
  fuzzySearchRestaurant,
  getRestaurantsByDistanceOrRating,
};
