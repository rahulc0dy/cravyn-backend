import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAllCustomerQueries,
  getAnsweredCustomerQueries,
  getUnansweredCustomerQueries,
  createCustomerQuery,
  setCustomerQueryAnswer,
  setRestaurantQueryAnswer,
  createRestaurantQuery,
  getAnsweredRestaurantQueries,
  getUnansweredRestaurantQueries,
  getAllRestaurantQueries,
  getQueriesByCustomerId,
  getQueriesByRestaurantId,
} from "../database/queries/supportSystem.query.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getCustomerQueries = asyncHandler(async (req, res) => {
  const { limit, filter } = req.query;

  try {
    let customerQueries;
    if (filter === "answered") {
      customerQueries = await getAnsweredCustomerQueries(limit);
    } else if (filter === "unanswered") {
      customerQueries = await getUnansweredCustomerQueries(limit);
    } else {
      customerQueries = await getAllCustomerQueries(limit);
    }

    if (customerQueries.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse({ reason: "No queries found." }, "No queries found.")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ customerQueries: customerQueries }));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const getCustomerQueryByCustomerId = asyncHandler(async (req, res) => {
  const { customer } = req;
  const customerId = customer?.id || req.query.customerId;

  if (!customerId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "customerId is not provided." },
          "Unable to get query."
        )
      );
  }

  try {
    const customerQueries = await getQueriesByCustomerId(customerId);
    if (customerQueries.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse({ reason: "No queries found." }, "No queries found.")
        );
    }

    return res.status(200).json(
      new ApiResponse({
        customerQueries: customerQueries,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const raiseCustomerQuery = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const { customer } = req;

  const customerId = customer?.id;

  if (!customerId || !question) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: customerId
            ? "Missing question text."
            : "Missing customer id.",
        },
        "Unable to create query."
      )
    );
  }

  try {
    const customerQuery = await createCustomerQuery({ customerId, question });

    if (customerQuery.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Could not create query." },
            "Unable to create query."
          )
        );
    }

    return res.status(201).json(
      new ApiResponse({
        customerQuery: customerQuery[0],
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const answerCustomerQuery = asyncHandler(async (req, res) => {
  const { managementTeam } = req;
  const { queryId, answer } = req.body;

  const managerId = managementTeam?.id;

  if (!queryId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "queryId is not provided." },
          "Unable to create query."
        )
      );
  } else if (!answer || !managerId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: { answer, managerId } },
          "Unable to create query."
        )
      );
  }

  try {
    const customerQuery = await setCustomerQueryAnswer({
      queryId,
      answer,
      managerId,
    });

    if (customerQuery.length === 0) {
      return res
        .status(503)
        .json(
          new ApiResponse(
            { reason: "Error answering query." },
            "Unable to answer."
          )
        );
    }

    return res
      .status(201)
      .json(new ApiResponse({ customerQuery: customerQuery[0] }));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const getRestaurantQueries = asyncHandler(async (req, res) => {
  const { limit, filter } = req.query;

  try {
    let restaurantQueries;
    if (filter === "answered") {
      restaurantQueries = await getAnsweredRestaurantQueries(limit);
    } else if (filter === "unanswered") {
      restaurantQueries = await getUnansweredRestaurantQueries(limit);
    } else {
      restaurantQueries = await getAllRestaurantQueries(limit);
    }

    if (restaurantQueries.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse({ reason: "No queries found." }, "No queries found.")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ restaurantQueries: restaurantQueries }));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const raiseRestaurantQuery = asyncHandler(async (req, res) => {
  const { restaurant } = req;
  const { question } = req.body;

  const restaurantId = restaurant?.restaurant_id;

  if (!restaurantId || !question) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: restaurantId
            ? "Missing question text."
            : "Missing restaurant id.",
        },
        "Unable to create query."
      )
    );
  }

  try {
    const restaurantQuery = await createRestaurantQuery({
      restaurantId,
      question,
    });

    if (restaurantQuery.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Could not create query." },
            "Unable to create query."
          )
        );
    }

    return res.status(201).json(
      new ApiResponse({
        restaurantQuery: restaurantQuery[0],
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const getRestaurantQueryByRestaurantId = asyncHandler(async (req, res) => {
  const { restaurant } = req;
  const restaurantId = restaurant?.restaurant_id || req.query.restaurantId;

  if (!restaurantId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "restaurantId is not provided." },
          "Unable to get query."
        )
      );
  }

  try {
    const restaurantQueries = await getQueriesByRestaurantId(restaurantId);
    if (restaurantQueries.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse({ reason: "No queries found." }, "No queries found.")
        );
    }

    return res.status(200).json(
      new ApiResponse({
        restaurantQueries: restaurantQueries,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

const answerRestaurantQuery = asyncHandler(async (req, res) => {
  const { managementTeam } = req;
  const { queryId, answer } = req.body;

  const managerId = managementTeam?.id;

  if (!queryId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "queryId is not provided." },
          "Unable to create query."
        )
      );
  } else if (!answer || !managerId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: { answer, managerId } },
          "Unable to create query."
        )
      );
  }

  try {
    const restaurantQuery = await setRestaurantQueryAnswer({
      queryId,
      answer,
      managerId,
    });

    if (restaurantQuery.length === 0) {
      return res
        .status(503)
        .json(
          new ApiResponse(
            { reason: "Error answering query." },
            "Unable to answer."
          )
        );
    }

    return res
      .status(201)
      .json(new ApiResponse({ restaurantQuery: restaurantQuery[0] }));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse({ reason: error.message }, "Something went wrong.")
      );
  }
});

export {
  getCustomerQueries,
  getCustomerQueryByCustomerId,
  raiseCustomerQuery,
  answerCustomerQuery,
  getRestaurantQueries,
  getRestaurantQueryByRestaurantId,
  raiseRestaurantQuery,
  answerRestaurantQuery,
};
