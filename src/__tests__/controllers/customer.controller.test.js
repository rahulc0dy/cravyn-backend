import { getCustomerAccount } from "../../controllers/customer.controller";
import { getNonSensitiveCustomerInfoById } from "../../db/customer.query.js";

jest.mock("../../db/customer.query.js");

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
