import {
  getCustomerAccount,
  loginCustomer,
  logoutCustomer,
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

const mockCustomer = {
  id: "44ec0c11-e0ce-4f8b-98d2-39a948de3cc2",
  name: "Test Customer",
  email_address: "test@example.com",
  phone_number: "8759542621",
  profile_image_url:
    "http://res.cloudinary.com/cravyn/image/upload/v1728705781/brfe7zdl8wbzqgihwhxq.png",
  date_of_birth: "1999-08-21",
  password: "hashedPassword",
};
describe("customer controllers", () => {
  describe("getCustomerAccount", () => {
    let mockRequest, mockResponse, mockNext;
    beforeEach(() => {
      mockRequest = {
        customer: { id: "123" },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

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
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
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
  });

  describe("logoutCustomer", () => {
    let mockRequest, mockResponse, mockNext;

    beforeEach(() => {
      mockRequest = {
        customer: { id: "mockCustomerId" },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    test("should log out the customer successfully", async () => {
      setRefreshToken.mockResolvedValue([mockCustomer]);

      await logoutCustomer(mockRequest, mockResponse, mockNext);

      expect(setRefreshToken).toHaveBeenCalledWith("NULL", "mockCustomerId");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("accessToken", {
        httpOnly: true,
        secure: true,
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: "Customer logged out successfully.",
        })
      );
    });

    test("should return 500 if an error occurs while clearing the refresh token", async () => {
      setRefreshToken.mockRejectedValue();

      await logoutCustomer(mockRequest, mockResponse, mockNext);

      expect(setRefreshToken).toHaveBeenCalledWith("NULL", "mockCustomerId");
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Unable to fetch the logged in customer.",
          success: false,
        })
      );
    });
  });
});
