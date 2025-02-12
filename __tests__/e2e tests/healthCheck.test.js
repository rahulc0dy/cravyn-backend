import request from "supertest";
import { app } from "../../src/app.js"; // Ensure this is the correct path to your Express app
import { STATUS } from "../../src/constants/statusCodes.js";
import { describe, expect, test, vitest } from "vitest";
import os from "os";

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
