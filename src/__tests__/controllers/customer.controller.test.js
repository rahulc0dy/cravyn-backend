import { getCustomerAccount } from "../../controllers/customer.controller";
import { getNonSensitiveCustomerInfoById } from "../../db/customer.query.js";

jest.mock("../../db/customer.query.js"); // Mock the database functions

const mockRequest = {
  customer: { id: "123" }, // Provide a mock customer ID
};

const mockResponse = {
  status: jest.fn().mockReturnThis(), // Allows chaining
  json: jest.fn(),
};

const mockNext = jest.fn(); // Create a mock next function

describe("getCustomerAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
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
    getNonSensitiveCustomerInfoById.mockResolvedValue([]); // Simulate no customer found
    await getCustomerAccount(mockRequest, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found.",
      })
    );
  });

  test("should return 200 with customer info if found", async () => {
    const mockCustomer = { id: "123", name: "John Doe" }; // Mock customer data
    getNonSensitiveCustomerInfoById.mockResolvedValue([mockCustomer]); // Simulate customer found
    await getCustomerAccount(mockRequest, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: mockCustomer,
        message: "Customer obtained successfully",
      })
    );
  });
});
