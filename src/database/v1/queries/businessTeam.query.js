import { sql } from "../database.js";
import bcrypt from "bcrypt";

const getBusinessTeamByPhoneNo = async (phoneNumber) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE phone_number = ${phoneNumber};`;
  return businessTeam;
};

const getBusinessTeamById = async (businessTeamId) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE id = ${businessTeamId};`;
  return businessTeam;
};

const getBusinessTeamByEmail = async (email) => {
  const businessTeam =
    await sql`SELECT * FROM Business_Team WHERE email_address = ${email};`;
  return businessTeam;
};

const getNonSensitiveBusinessTeamInfoById = async (businessTeamId) => {
  const businessTeam = await sql`
      SELECT id, name, email_address, phone_number
      FROM Business_Team 
      WHERE id = ${businessTeamId};
    `;
  return businessTeam;
};

const setRefreshToken = async (refreshToken, businessTeamId) => {
  const businessTeam = await sql`
    UPDATE Business_Team
    SET refresh_token = ${refreshToken}
    WHERE id = ${businessTeamId}
    RETURNING id, name, phone_number, email_address;
  `;
  return businessTeam;
};

const createBusinessTeam = async (name, phoneNumber, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const businessTeam = await sql`
      INSERT INTO Business_Team (name, phone_number, email_address, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${hashedPassword})
      RETURNING id, name, phone_number, email_address;
    `;
    return businessTeam[0];
  } catch (error) {
    throw new Error(error);
  }
};

const deleteBusinessTeam = async (businessTeamId) => {
  try {
    const businessTeam =
      await sql`DELETE FROM Business_Team WHERE id=${businessTeamId} RETURNING id, name, phone_number, email_address`;
    return businessTeam;
  } catch (error) {
    throw new Error(error);
  }
};

const updateBusinessTeamNamePhoneNo = async (
  businessTeamId,
  { name, phoneNumber }
) => {
  if (!name && !phoneNumber) throw new Error("No update fields provided");

  const query = sql`
    UPDATE Business_Team 
    SET name = ${name}, phone_number = ${phoneNumber} 
    WHERE id = ${businessTeamId} 
    RETURNING id, name, phone_number, email_address;
  `;

  try {
    const businessTeam = await query;
    return businessTeam;
  } catch (error) {
    throw new Error(error);
  }
};

const getRestaurantSalesData = async () => {
  const salesData = await sql`
    SELECT
        r.restaurant_id,
        r.name AS restaurant_name,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.checkout_price), 0) AS total_sales
    FROM
        restaurant r
            LEFT JOIN
        orders o
        ON
            r.restaurant_id = o.restaurant_id 
                AND o.order_status = 'Delivered'
    GROUP BY
        r.restaurant_id, r.name
    ORDER BY
        total_sales DESC;
    `;

  return salesData;
};

const getRestaurantYearlyMonthlySalesData = async ({
  year = null,
  month = null,
  day = null,
}) => {
  const salesData = await sql`
    SELECT
        r.restaurant_id,
        r.name AS restaurant_name,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.checkout_price), 0) AS total_sales
    FROM
        restaurant r
            LEFT JOIN
        orders o
        ON
            r.restaurant_id = o.restaurant_id 
                AND o.order_status = 'Delivered'
    WHERE
        (${year}::INTEGER IS NULL OR EXTRACT(YEAR FROM o.order_timestamp) = ${year}) AND
        (${month}::INTEGER IS NULL OR EXTRACT(MONTH FROM o.order_timestamp) = ${month}) AND 
        (${day}::INTEGER IS NULL OR EXTRACT(DAY FROM o.order_timestamp) = ${day})
    GROUP BY
        r.restaurant_id, r.name
    ORDER BY
        total_sales DESC;
    `;
  return salesData;
};

const getTotalUsers = async () => {
  const totalUsers = await sql`
    SELECT
            (SELECT COUNT(*) FROM customer) AS total_customers,
            (SELECT COUNT(*) FROM delivery_partner) AS total_delivery_partners,
            (SELECT COUNT(*) FROM restaurant) AS total_restaurants;
    `;
  return totalUsers;
};

const getCategorySalesData = async () => {
  const salesData = await sql`
    SELECT
        fi.type AS category,
        CAST(SUM(ol.quantity) AS INTEGER) AS total_items_sold,
        CAST(COALESCE(SUM(ol.price * ol.quantity), 0) AS NUMERIC) AS total_sales
    FROM orders_list ol
    INNER JOIN food_item fi
            ON ol.item_id = fi.item_id
    INNER JOIN orders o
            ON ol.list_id = o.list_id
    WHERE o.order_status = 'Delivered'
    GROUP BY
        fi.type
    ORDER BY
        total_sales DESC;
  `;
  return salesData;
};

const getMonthlySales = async () => {
  const salesData = await sql`
    SELECT
        TO_CHAR(DATE_TRUNC('month', o.order_timestamp), 'YYYY-MM') AS month,
        CAST(COALESCE(SUM(o.checkout_price), 0) AS INTEGER) AS monthly_total_sales,
        (SELECT CAST(COALESCE(SUM(checkout_price), 0) AS INTEGER) 
         FROM orders 
         WHERE order_status = 'Delivered') AS total_sales
    FROM orders o
    WHERE o.order_status = 'Delivered'
    GROUP BY DATE_TRUNC('month', o.order_timestamp)
    ORDER BY DATE_TRUNC('month', o.order_timestamp);
  `;
  return salesData;
};

const getDailySales = async () => {
  const salesData = await sql`
    SELECT
        TO_CHAR(DATE_TRUNC('day', o.order_timestamp), 'YYYY-MM-DD') AS day,
        CAST(COALESCE(SUM(o.checkout_price), 0) AS INTEGER) AS daily_total_sales,
        (SELECT CAST(COALESCE(SUM(checkout_price), 0) AS INTEGER)
         FROM orders
         WHERE order_status = 'Delivered') AS total_sales
    FROM orders o
    WHERE o.order_status = 'Delivered'
    GROUP BY DATE_TRUNC('day', o.order_timestamp)
    ORDER BY DATE_TRUNC('day', o.order_timestamp);
  `;
  return salesData;
};

const getRestaurantMonthlySalesData = async ({ restaurantId, year = null }) => {
  const monthlySalesData = await sql`
    SELECT
        EXTRACT(MONTH FROM o.order_timestamp) AS month,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.checkout_price), 0) AS total_sales
    FROM
        restaurant r
            LEFT JOIN
        orders o
        ON
            r.restaurant_id = o.restaurant_id 
                AND o.order_status = 'Delivered'
    WHERE
        r.restaurant_id = ${restaurantId} AND
        (${year}::INTEGER IS NULL OR EXTRACT(YEAR FROM o.order_timestamp) = ${year})
    GROUP BY
        EXTRACT(MONTH FROM o.order_timestamp)
    ORDER BY
        month;
    `;
  return monthlySalesData;
};

const getRestaurantDailySalesData = async ({
  restaurantId,
  year = null,
  month = null,
}) => {
  const dailySalesData = await sql`
    SELECT
        EXTRACT(DAY FROM o.order_timestamp) AS day,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.checkout_price), 0) AS total_sales
    FROM
        restaurant r
            LEFT JOIN
        orders o
        ON
            r.restaurant_id = o.restaurant_id 
                AND o.order_status = 'Delivered'
    WHERE
        r.restaurant_id = ${restaurantId} AND
        (${year}::INTEGER IS NULL OR EXTRACT(YEAR FROM o.order_timestamp) = ${year}) AND
        (${month}::INTEGER IS NULL OR EXTRACT(MONTH FROM o.order_timestamp) = ${month})
    GROUP BY
        EXTRACT(DAY FROM o.order_timestamp)
    ORDER BY
        day;
    `;
  return dailySalesData;
};

const getCustomerMetrics = async (month = 12, year = 2024) => {
  const fmtMonth = `${year}-${month}`;
  const customerMetrics = await sql`
    select * from calculate_metrics(${fmtMonth});
    `;
  return customerMetrics;
};

export {
  getBusinessTeamByPhoneNo,
  getBusinessTeamById,
  getBusinessTeamByEmail,
  getNonSensitiveBusinessTeamInfoById,
  setRefreshToken,
  createBusinessTeam,
  deleteBusinessTeam,
  updateBusinessTeamNamePhoneNo,
  getRestaurantSalesData,
  getRestaurantYearlyMonthlySalesData,
  getTotalUsers,
  getCategorySalesData,
  getMonthlySales,
  getDailySales,
  getRestaurantMonthlySalesData,
  getRestaurantDailySalesData,
  getCustomerMetrics,
};
