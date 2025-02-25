import request from "supertest";
import { app } from "../../src/app.js";
import { STATUS } from "../../src/constants/statusCodes.js";
import { describe, expect, test, vitest } from "vitest";
import os from "os";
import { ApiResponse } from "../../src/utils/shared/apiResponse.js";

const baseUrl = "/api/v2";

describe("GET /health-check/server", () => {
  test("should return system health information with a 200 status", async () => {
    const response = await request(app)
      .get(`${baseUrl}/health-check/server`)
      .expect(STATUS.SUCCESS.OK);

    expect(response.body).toHaveProperty("message", "Status OK.");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("platform");
    expect(response.body.data).toHaveProperty("cpuArch");
    expect(response.body.data).toHaveProperty("totalMemory");
    expect(response.body.data).toHaveProperty("freeMemory");
    expect(response.body.data).toHaveProperty("uptime");
  });

  test("should handle unexpected errors gracefully", async () => {
    vitest.spyOn(os, "platform").mockImplementation(() => {
      throw new Error("Mocked OS error");
    });
    const response = await request(app)
      .get(`${baseUrl}/health-check/server`)
      .expect(STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("message", "Mocked OS error");

    vitest.restoreAllMocks();
  });
});

describe("Express App", () => {
  test("should have CORS enabled with correct settings", async () => {
    const response = await request(app)
      .get(`${baseUrl}/health-check/server`)
      .send();

    expect(response.headers["access-control-allow-origin"]).toBe(
      process.env.CORS_ORIGIN
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").send();

    expect(response.status).toBe(STATUS.CLIENT_ERROR.NOT_FOUND);
    expect(response.body).toEqual(
      new ApiResponse({}, `API endpoint not found: /unknown-route`)
    );
  });

  test("should handle JSON parsing errors", async () => {
    const response = await request(app)
      .post("/api/v1/some-endpoint") // Change as per your API
      .set("Content-Type", "application/json")
      .send("invalid-json");

    expect(response.status).toBe(STATUS.CLIENT_ERROR.BAD_REQUEST);
  });
});
