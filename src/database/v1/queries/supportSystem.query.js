import { sql } from "../database.js";

const getNoOfQueries = async () => {
  const restaurantQueryNo = sql`
    SELECT COUNT(*) AS total_unanswered_queries
    FROM (
        SELECT answer FROM restaurant_query WHERE answer IS NULL
        UNION ALL
        SELECT answer FROM customer_query WHERE answer IS NULL
        ) AS combined_queries;`;

  return restaurantQueryNo;
};

const getNoOfPartnerRequests = async () => {
  const restaurantQueryNo = sql`
      SELECT COUNT(*) AS pending_partner_requests FROM restaurant WHERE verify_status='pending';
  `;

  return restaurantQueryNo;
};

// Customer Queries

const getAllCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Customer_Query cq,Customer c 
    WHERE cq.customer_id=c.id 
    LIMIT ${limit};
    `;

  return query;
};

const getUnansweredCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Customer_Query cq,Customer c 
    WHERE cq.customer_id=c.id 
      AND answer IS NULL
    LIMIT ${limit};
    `;

  return query;
};

const getAnsweredCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Customer_Query cq,Customer c 
    WHERE cq.customer_id=c.id 
      AND answer IS NOT NULL
    LIMIT ${limit};
    `;

  return query;
};

const getCustomerQueryById = async (queryId) => {
  const query = await sql`
    SELECT * FROM Customer_Query WHERE query_id = ${queryId};
    `;

  return query;
};

const getQueriesByCustomerId = async (customerId) => {
  const query = await sql`
    SELECT * FROM Customer_Query WHERE customer_id = ${customerId};
    `;

  return query;
};

const createCustomerQuery = async ({ question, customerId }) => {
  const query = await sql`
    INSERT INTO Customer_Query ( question, customer_id )
    VALUES ( ${question}, ${customerId}) RETURNING * ;
    `;

  return query;
};

const setCustomerQueryAnswer = async ({ queryId, answer, managerId }) => {
  const query = await sql`
    UPDATE Customer_Query 
    SET answer=${answer}, manager_id=${managerId}
    WHERE query_id=${queryId} RETURNING * ;
    `;

  return query;
};

// Restaurant Queries

const getAllRestaurantQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Restaurant_Query, Restaurant 
    WHERE restaurant.restaurant_id=restaurant_query.restaurant_id 
    LIMIT ${limit};
    `;

  return query;
};

const getUnansweredRestaurantQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Restaurant_Query, Restaurant 
    WHERE restaurant.restaurant_id=restaurant_query.restaurant_id 
      AND answer IS NULL 
    LIMIT ${limit};
    `;

  return query;
};

const getAnsweredRestaurantQueries = async (limit = 50) => {
  const query = await sql`
    SELECT name,question,answer,manager_id, query_id
    FROM Restaurant_Query, Restaurant 
    WHERE restaurant.restaurant_id=restaurant_query.restaurant_id 
      AND answer IS NOT NULL 
    LIMIT ${limit};
    `;

  return query;
};

const getRestaurantQueryById = async (queryId) => {
  const query = await sql`
    SELECT * FROM Restaurant_Query WHERE query_id = ${queryId};
    `;

  return query;
};

const getQueriesByRestaurantId = async (restaurantId) => {
  const queries = await sql`
      SELECT rq.*, mt.name AS manager_name
      FROM Restaurant_Query rq 
          LEFT JOIN management_team mt 
              ON rq.manager_id = mt.id
      WHERE rq.restaurant_id = ${restaurantId}
      ORDER BY timestamp DESC;
  `;

  return queries;
};

const createRestaurantQuery = async ({ question, restaurantId }) => {
  const query = await sql`
    INSERT INTO Restaurant_Query ( question, restaurant_id )
    VALUES ( ${question}, ${restaurantId}) RETURNING * ;
    `;

  return query;
};

const setRestaurantQueryAnswer = async ({ queryId, answer, managerId }) => {
  const query = await sql`
    UPDATE Restaurant_Query 
    SET answer=${answer}, manager_id=${managerId}
    WHERE query_id=${queryId} RETURNING * ;
    `;

  return query;
};

export {
  getAllRestaurantQueries,
  getUnansweredRestaurantQueries,
  createRestaurantQuery,
  setRestaurantQueryAnswer,
  getRestaurantQueryById,
  getAnsweredRestaurantQueries,
  getQueriesByRestaurantId,
  getAllCustomerQueries,
  getUnansweredCustomerQueries,
  getAnsweredCustomerQueries,
  getQueriesByCustomerId,
  getCustomerQueryById,
  createCustomerQuery,
  setCustomerQueryAnswer,
  getNoOfQueries,
  getNoOfPartnerRequests,
};
