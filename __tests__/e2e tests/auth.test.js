import request from "supertest";
import { app } from "../../src/app.js";
import { STATUS } from "../../src/constants/statusCodes.js";
import { afterEach, describe, expect, test, vitest } from "vitest";
import { prisma } from "../../src/utils/prismaClient.js";

const BASE_URL = "/api/v2";

describe("POST /register", () => {
  const URL = `${BASE_URL}/register`;

  const mockCustomer = {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    confirmPassword: "password123",
    phone: "1234567890",
    dateOfBirth: "01-01-2000",
  };

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  describe("General Validation Errors", () => {
    test("should return 400 if name is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.name;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Name is required.");
    });

    test("should return 400 if name is less than 2 characters.", async () => {
      const body = { ...mockCustomer, name: "A" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Name must be at least 2 characters long."
      );
    });

    test("should return 400 if email is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.email;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Email is required.");
    });

    test("should return 400 if email is invalid.", async () => {
      const body = { ...mockCustomer, email: "invalid-email" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Invalid email address.");
    });

    test("should return 400 if password is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.password;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Password is required.");
    });

    test("should return 400 if password is less than 6 characters.", async () => {
      const body = {
        ...mockCustomer,
        password: "12345",
        confirmPassword: "12345",
      };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Password must be at least 6 characters long."
      );
    });

    test("should return 400 if confirmPassword is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.confirmPassword;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Confirm password is required."
      );
    });

    test("should return 400 if password and confirmPassword do not match.", async () => {
      const body = { ...mockCustomer, confirmPassword: "wrongpassword" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Passwords do not match."
      );
    });

    test("should return 400 if profileImageUrl is provided but invalid.", async () => {
      const body = { ...mockCustomer, profileImageUrl: "invalid-url" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid profile image URL."
      );
    });

    test("should return 400 if role is missing in query params.", async () => {
      const response = await request(app)
        .post(URL) // No role provided
        .send(mockCustomer)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Role is required. Must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS."
      );
    });

    test("should return 400 if role is invalid.", async () => {
      const response = await request(app)
        .post(`${URL}?role=INVALID_ROLE`)
        .send(mockCustomer)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid enum value. Expected 'CUSTOMER' | 'DELIVERY_PARTNER' | 'RESTAURANT_OWNER' | 'RESTAURANT_TEAM' | 'MANAGEMENT' | 'BUSINESS', received 'INVALID_ROLE'"
      );
    });
  });
});
