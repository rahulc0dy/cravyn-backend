import { sql } from "./database.js";

// Customer Queries

const getAllCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT * FROM Customer_Query LIMIT ${limit};
    `;

  return query;
};

const getUnansweredCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT * FROM Customer_Query WHERE answer IS NULL;
    `;

  return query;
};

const getAnsweredCustomerQueries = async (limit = 50) => {
  const query = await sql`
    SELECT * FROM Customer_Query WHERE answer IS NOT NULL;
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
    SELECT * FROM Restaurant_Query LIMIT ${limit};
    `;

  return query;
};

const getUnansweredRestaurantQueries = async (limit = 50) => {
  const query = await sql`
    SELECT * FROM Restaurant_Query WHERE answer IS NULL LIMIT ${limit};
    `;

  return query;
};

const getAnsweredRestaurantQueries = async (limit = 50) => {
  const query = await sql`
    SELECT * FROM Restaurant_Query WHERE answer IS NOT NULL LIMIT ${limit};
    `;

  return query;
};

const getRestaurantQueryById = async (queryId) => {
  const query = await sql`
    SELECT * FROM Restaurant_Query WHERE query_id = ${queryId};
    `;

  return query;
};

const getQueriesByRestaurantId = async (customerId) => {
  const query = await sql`
    SELECT * FROM Restaurant_Query WHERE restaurant_id = ${customerId};
    `;

  return query;
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
};
