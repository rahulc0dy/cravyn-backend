import {
  healthCheck,
  databaseCheck,
} from "../../controllers/healthCheck.controller";
import { sql } from "../../db/database";

jest.mock("../../db/database.js");

const mockRequest = {};
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
const mockNext = jest.fn();

describe("health check", () => {
  describe("server", () => {
    test("should return 200 if server is running", async () => {
      await healthCheck(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: "Status OK.",
          data: {},
          success: true,
        })
      );
    });
  });

  describe("database", () => {
    test("should return 200 if database is connected", async () => {
      const mockData = { version: "1.0.0" };

      sql.mockResolvedValue([mockData]);

      await databaseCheck(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          data: mockData,
          message: "Database connection is healthy.",
          success: true,
        })
      );
    });

    test("should return 500 if database is not connected", async () => {
      const mockError = new Error("Database connection failed.");
      sql.mockRejectedValueOnce(mockError);

      await databaseCheck(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          data: expect.any(Object),
          message: "Database check failed.",
          success: false,
        })
      );
    });
  });
});
