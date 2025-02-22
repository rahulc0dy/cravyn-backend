import request from "supertest";
import { app } from "../../src/app.js";
import { STATUS } from "../../src/constants/statusCodes.js";
import { afterEach, describe, expect, test, vitest } from "vitest";
import { prisma } from "../../src/utils/prismaClient.js";

const BASE_URL = "/api/v2";

describe("POST /register", () => {
  const URL = `${BASE_URL}/register`;

  const mockBaseUser = {
    email: "test@example.com",
    name: "Test User",
    password: "password123",
    confirmPassword: "password123",
  };

  const mockCustomer = {
    ...mockBaseUser,
    phone: "9876543210",
    dateOfBirth: "01-01-2000",
  };

  const mockDeliveryPartner = {
    ...mockBaseUser,
    phone: "9876543210",
    availability: true,
    vehicleType: "BIKE",
  };

  const mockRestaurantOwner = {
    ...mockBaseUser,
    phone: "9876543210",
    panNumber: "ABCDE1234F",
  };

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  describe("General Validation", () => {
    test("should return 400 if name is missing.", async () => {
      const body = { ...mockBaseUser };
      body.name = undefined;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Name is required.");
    });

    test("should return 400 if name is less than 2 characters.", async () => {
      const body = { ...mockBaseUser, name: "A" };

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
      const body = { ...mockBaseUser };
      body.email = undefined;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Email is required.");
    });

    test("should return 400 if email is invalid.", async () => {
      const body = { ...mockBaseUser, email: "invalid-email" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Invalid email address.");
    });

    test("should return 400 if password is missing.", async () => {
      const body = { ...mockBaseUser };
      body.password = undefined;

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Password is required.");
    });

    test("should return 400 if password is less than 6 characters.", async () => {
      const body = {
        ...mockBaseUser,
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
      const body = { ...mockBaseUser };
      body.confirmPassword = undefined;

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
      const body = { ...mockBaseUser, confirmPassword: "wrongpassword" };

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
      const body = { ...mockBaseUser, profileImageUrl: "invalid-url" };

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
        .send(mockBaseUser)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Role is required. Must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS."
      );
    });

    test("should return 400 if role is invalid.", async () => {
      const response = await request(app)
        .post(`${URL}?role=INVALID_ROLE`)
        .send(mockBaseUser)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty(
        "message",
        "Invalid enum value. Expected 'CUSTOMER' | 'DELIVERY_PARTNER' | 'RESTAURANT_OWNER' | 'RESTAURANT_TEAM' | 'MANAGEMENT' | 'BUSINESS', received 'INVALID_ROLE'"
      );
    });
  });

  describe("Customer Role Validation", () => {
    test("should return 400 if phone is missing.", async () => {
      const body = { ...mockCustomer };
      body.phone = undefined;

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

    test("should return 400 if phone contains non-numeric characters", async () => {
      const body = { ...mockCustomer, phone: "98A654321B" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toEqual(
        "Phone number must contain only digits."
      );
    });

    test("should return 400 if dateOfBirth is missing.", async () => {
      const body = { ...mockCustomer };
      body.dateOfBirth = undefined;

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

    test("should return 400 if dateOfBirth is invalid.", async () => {
      const body = { ...mockCustomer, dateOfBirth: "01-20-2000" }; // Invalid date

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message", "Invalid date.");
    });

    test("should return 400 if dateOfBirth contains invalid characters", async () => {
      const body = { ...mockCustomer, dateOfBirth: "01-01-20XX" };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toEqual(
        "Invalid date format. Use DD-MM-YYYY."
      );
    });

    test("should return 200 if all fields are valid for CUSTOMER role.", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest
        .spyOn(prisma.user, "create")
        .mockResolvedValue({ id: "test-id", ...mockCustomer });

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.SUCCESS.CREATED);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully with the role: CUSTOMER."
      );
    });
  });

  describe("Delivery Partner Role Validation", () => {
    test("should return 400 if phone is missing", async () => {
      const body = { ...mockDeliveryPartner };
      body.phone = undefined;

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

    test("should return 400 if phone contains non-numeric characters", async () => {
      const body = { ...mockDeliveryPartner, phone: "98A654321B" };

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toEqual(
        "Phone number must contain only digits."
      );
    });

    test("should return 400 if availability is missing", async () => {
      const body = { ...mockDeliveryPartner };
      body.availability = undefined;

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("Availability is required.");
    });

    test("should return 400 if availability is a string instead of boolean", async () => {
      const body = { ...mockDeliveryPartner, availability: "true" };

      const response = await request(app)
        .post(`${URL}?role=DELIVERY_PARTNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toEqual("Availability must be a boolean.");
    });

    test("should return 400 if vehicleType is missing", async () => {
      const body = { ...mockDeliveryPartner };
      body.vehicleType = undefined;

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
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest
        .spyOn(prisma.user, "create")
        .mockResolvedValue({ id: "test-id", ...mockDeliveryPartner });

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

  describe("Restaurant Owner Role Validation", () => {
    test("should return 400 if phone is missing", async () => {
      const body = { ...mockRestaurantOwner };
      body.phone = undefined;

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("Phone number is required.");
    });

    test("should return 400 if phone is not exactly 10 digits", async () => {
      const body = { ...mockRestaurantOwner, phone: "12345" };

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "Phone number must be exactly 10 digits long."
      );
    });

    test("should return 400 if phone contains non-numeric characters", async () => {
      const body = { ...mockRestaurantOwner, phone: "98A654321B" };

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toEqual(
        "Phone number must contain only digits."
      );
    });

    test("should return 400 if PAN number is missing", async () => {
      const body = { ...mockRestaurantOwner };
      body.panNumber = undefined;

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("PAN number is required.");
    });

    test("should return 400 if PAN number is invalid", async () => {
      const body = { ...mockRestaurantOwner, panNumber: "1234567890" }; // Invalid PAN format

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(body)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual("Invalid PAN number format.");
    });

    test("should register a restaurant owner successfully", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest
        .spyOn(prisma.user, "create")
        .mockResolvedValue({ id: "test-id", ...mockRestaurantOwner });

      const response = await request(app)
        .post(`${URL}?role=RESTAURANT_OWNER`)
        .send(mockRestaurantOwner)
        .expect(STATUS.SUCCESS.CREATED);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toEqual(
        "User registered successfully with the role: RESTAURANT_OWNER."
      );
    });
  });

  describe("Database & System Error Handling", () => {
    test("should return 500 if the database connection fails", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest
        .spyOn(prisma.user, "create")
        .mockRejectedValue(new Error("Database connection failed."));

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR);

      expect(response.body.message).toBe("Database connection failed.");
    });

    test("should return 500 if Prisma throws an unexpected error", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest.spyOn(prisma.user, "create").mockImplementation(() => {
        throw new Error("Unexpected Prisma error.");
      });

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR);

      expect(response.body.message).toBe("Unexpected Prisma error.");
    });

    test("should return 400 if trying to register with an already existing email", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: 1,
        ...mockCustomer,
      });
      vitest
        .spyOn(prisma.user, "create")
        .mockResolvedValue({ id: "test-id", ...mockCustomer });

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.CLIENT_ERROR.CONFLICT);

      expect(response.body.message).toBe(
        "User with this email already exists."
      );
    });

    test("should return 500 if the request body contains unexpected data types", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);
      vitest
        .spyOn(prisma.user, "create")
        .mockResolvedValue({ id: "test-id", ...mockBaseUser });

      const invalidUser = {
        ...mockBaseUser,
        phone: 9876543210, // Invalid: should be a string
      };

      const response = await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(invalidUser)
        .expect(STATUS.CLIENT_ERROR.BAD_REQUEST);

      expect(response.body.message).toContain("Phone number must be a string.");
    });

    test("should hash password before storing in database", async () => {
      vitest.spyOn(prisma.user, "findUnique").mockResolvedValue(undefined);

      let createdUser;
      vitest
        .spyOn(prisma.user, "create")
        .mockImplementation(async ({ data }) => {
          createdUser = { id: "test-id", ...data };
          return createdUser;
        });

      await request(app)
        .post(`${URL}?role=CUSTOMER`)
        .send(mockCustomer)
        .expect(STATUS.SUCCESS.CREATED);

      expect(createdUser.password).not.toBe(mockCustomer.password);
      expect(createdUser.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/
      ); // bcrypt hash pattern
    });
  });
});
