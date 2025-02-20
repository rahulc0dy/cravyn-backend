import request from "supertest";
import { app } from "../../src/app.js";
import { STATUS } from "../../src/constants/statusCodes.js";
import { afterEach, describe, expect, test, vitest } from "vitest";
import { prisma } from "../../src/utils/prismaClient.js";

const BASE_URL = "/api/v2";

describe("POST /register", () => {
  const URL = `${BASE_URL}/register`;

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  describe("General Validation", () => {
    const mockUser = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      confirmPassword: "password123",
      phone: "9876543210",
      dateOfBirth: "01-01-2000",
    };

    test("should return 400 if name is missing.", async () => {
      const body = { ...mockUser };
      delete body.name;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Name is required.");
    });

    test("should return 400 if name is less than 2 characters.", async () => {
      const body = { ...mockUser, name: "A" };

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
      const body = { ...mockUser };
      delete body.email;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Email is required.");
    });

    test("should return 400 if email is invalid.", async () => {
      const body = { ...mockUser, email: "invalid-email" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Invalid email address.");
    });

    test("should return 400 if password is missing.", async () => {
      const body = { ...mockUser };
      delete body.password;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Password is required.");
    });

    test("should return 400 if password is less than 6 characters.", async () => {
      const body = {
        ...mockUser,
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
      const body = { ...mockUser };
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
      const body = { ...mockUser, confirmPassword: "wrongpassword" };

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
      const body = { ...mockUser, profileImageUrl: "invalid-url" };

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
        .send(mockUser)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Role is required. Must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS."
      );
    });

    test("should return 400 if role is invalid.", async () => {
      const response = await request(app)
        .post(`${URL}?role=INVALID_ROLE`)
        .send(mockUser)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid enum value. Expected 'CUSTOMER' | 'DELIVERY_PARTNER' | 'RESTAURANT_OWNER' | 'RESTAURANT_TEAM' | 'MANAGEMENT' | 'BUSINESS', received 'INVALID_ROLE'"
      );
    });
  });

  describe("Customer Role Validation", () => {
    const mockCustomer = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      confirmPassword: "password123",
      phone: "9876543210",
      dateOfBirth: "01-01-2000",
    };

    test("should return 400 if phone is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.phone;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Phone number is required."
      );
    });

    test("should return 400 if phone number is not exactly 10 digits.", async () => {
      const body = { ...mockCustomer, phone: "12345" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Phone number must be exactly 10 digits long."
      );
    });

    test("should return 400 if dateOfBirth is missing.", async () => {
      const body = { ...mockCustomer };
      delete body.dateOfBirth;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Date of birth is required."
      );
    });

    test("should return 400 if dateOfBirth format is invalid.", async () => {
      const body = { ...mockCustomer, dateOfBirth: "2000-01-01" }; // Incorrect format

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid date format. Use DD-MM-YYYY."
      );
    });

    test("should return 200 if all fields are valid for CUSTOMER role.", async () => {
      vitest.spyOn(prisma.user, "create").mockImplementation(() => {
        return { id: "test-id", ...mockCustomer };
      });

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.SUCCESS.CREATED);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "User registered successfully with the role: CUSTOMER."
      );
    });
  });

  describe("Delivery Partner Role Validation", () => {
    const mockDeliveryPartner = {
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
      confirmPassword: "password123",
      phone: "9876543210",
      availability: true,
      vehicleType: "BIKE",
    };

    test("should return 400 if phone is missing", async () => {
      const body = { ...mockDeliveryPartner };
      delete body.phone;

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("Phone number is required.");
    });

    test("should return 400 if phone is not exactly 10 digits", async () => {
      const body = { ...mockDeliveryPartner, phone: "12345" };

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "Phone number must be exactly 10 digits long."
      );
    });

    test("should return 400 if availability is missing", async () => {
      const body = { ...mockDeliveryPartner };
      delete body.availability;

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("Availability is required.");
    });

    test("should return 400 if vehicleType is missing", async () => {
      const body = { ...mockDeliveryPartner };
      delete body.vehicleType;

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "Vehicle type is required. Must be one of BIKE, CYCLE."
      );
    });

    test("should return 400 if vehicleType is invalid", async () => {
      const body = { ...mockDeliveryPartner, vehicleType: "CAR" };

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "Invalid enum value. Expected 'BIKE' | 'CYCLE', received 'CAR'"
      );
    });

    test("should register a delivery partner successfully", async () => {
      vitest.spyOn(prisma.user, "create").mockImplementation(() => {
        return { id: "test-id", ...mockDeliveryPartner };
      });

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(mockDeliveryPartner)
        .expect(STATUS.SUCCESS.CREATED);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "User registered successfully with the role: DELIVERY_PARTNER."
      );
    });
  });
});
