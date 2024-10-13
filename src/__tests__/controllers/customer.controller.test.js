import {
  getCustomerAccount,
  loginCustomer,
} from "../../controllers/customer.controller";
import {
  getCustomerByEmail,
  getNonSensitiveCustomerInfoById,
  setRefreshToken,
} from "../../db/customer.query.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/tokenGenerator.js";
import bcrypt from "bcrypt";

jest.mock("bcrypt");
jest.mock("../../db/customer.query.js");
jest.mock("../../utils/tokenGenerator.js");

const mockRequest = {
  customer: { id: "123" },
};

const mockResponse = {
  status: jest.fn().mockReturnThis(), // Allows chaining
  json: jest.fn(),
};

const mockNext = jest.fn();

describe("getCustomerAccount", () => {
  test("should return 401 if no customer ID is provided", async () => {
    const reqWithoutId = { customer: {} };
    await getCustomerAccount(reqWithoutId, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unauthorised Access.",
      })
    );
  });

  test("should return 404 if customer is not found", async () => {
    getNonSensitiveCustomerInfoById.mockResolvedValue([]);
    await getCustomerAccount(mockRequest, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found.",
      })
    );
  });

  test("should return 200 with customer info if found", async () => {
    const mockCustomer = {
      id: "44ec0c11-e0ce-4f8b-98d2-39a948de3cc2",
      name: "Harry Potter",
      email_address: "harrypotter@hogwarts.com",
      phone_number: "8759542621",
      profile_image_url:
        "http://res.cloudinary.com/cravyn/image/upload/v1728705781/brfe7zdl8wbzqgihwhxq.png",
      date_of_birth: "1999-08-21",
    };
    getNonSensitiveCustomerInfoById.mockResolvedValue([mockCustomer]);
    await getCustomerAccount(mockRequest, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { customer: mockCustomer },
        message: "Customer obtained successfully",
      })
    );
  });
});

describe("loginCustomer", () => {
  let mockRequest, mockResponse, mockNext;

  beforeEach(() => {
    mockRequest = {
      body: { email: "test@example.com", password: "password123" },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  test("should return 400 if email is missing", async () => {
    mockRequest.body = { password: "password123" };

    await loginCustomer(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email is required.",
      })
    );
  });

  test("should return 400 if password is missing", async () => {
    mockRequest.body = { email: "test@example.com" };

    await loginCustomer(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Password is required.",
      })
    );
  });

  test("should return 503 if no customer is found with the provided email", async () => {
    getCustomerByEmail.mockResolvedValue([]);

    await loginCustomer(mockRequest, mockResponse, mockNext);

    expect(getCustomerByEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Phone number is not registered.",
      })
    );
  });

  test("should return 401 if password is incorrect", async () => {
    const mockCustomer = {
      id: "44ec0c11-e0ce-4f8b-98d2-39a948de3cc2",
      name: "Harry Potter",
      email_address: "harrypotter@hogwarts.com",
      phone_number: "8759542621",
      profile_image_url:
        "http://res.cloudinary.com/cravyn/image/upload/v1728705781/brfe7zdl8wbzqgihwhxq.png",
      date_of_birth: "1999-08-21",
      password: "hashedPassword",
    };
    getCustomerByEmail.mockResolvedValue([mockCustomer]);
    bcrypt.compare.mockResolvedValue(false); // Password is incorrect

    await loginCustomer(mockRequest, mockResponse, mockNext);

    expect(getCustomerByEmail).toHaveBeenCalledWith("test@example.com");
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashedPassword"
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid credentials, please try again.",
      })
    );
  });

  test("should return 200 with tokens if login is successful", async () => {
    const mockCustomer = [{ id: "123", password: "hashedPassword" }];
    const mockAccessToken = "mockAccessToken";
    const mockRefreshToken = "mockRefreshToken";

    getCustomerByEmail.mockResolvedValue(mockCustomer);
    bcrypt.compare.mockResolvedValue(true); // Password is correct
    generateAccessToken.mockReturnValue(mockAccessToken);
    generateRefreshToken.mockReturnValue(mockRefreshToken);
    setRefreshToken.mockResolvedValue(mockCustomer);

    await loginCustomer(mockRequest, mockResponse, mockNext);

    expect(getCustomerByEmail).toHaveBeenCalledWith("test@example.com");
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashedPassword"
    );
    expect(generateAccessToken).toHaveBeenCalledWith(mockCustomer[0]);
    expect(generateRefreshToken).toHaveBeenCalledWith(mockCustomer[0]);
    expect(setRefreshToken).toHaveBeenCalledWith(mockRefreshToken, "123");

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      "accessToken",
      mockAccessToken,
      {
        httpOnly: true,
        secure: true,
      }
    );
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      "refreshToken",
      mockRefreshToken,
      {
        httpOnly: true,
        secure: true,
      }
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Customer logged in successfully.",
        data: {
          customer: mockCustomer[0],
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        },
      })
    );
  });

  // temporary function to test bcrypt mocking
  test("bcrypt.compare returns correct value", async () => {
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    const result = await bcrypt.compare("password123", "hashedPassword");
    expect(result).toBe(false);
  });
});
