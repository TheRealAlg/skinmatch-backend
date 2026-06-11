import { HealthController } from "../../src/modules/health/health.controller";

describe("HealthController", () => {
  it("returns service health", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: "ok",
      service: "skincare-backend"
    });
  });
});
