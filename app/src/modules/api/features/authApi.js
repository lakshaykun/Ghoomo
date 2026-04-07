import { httpClient } from "../core/httpClient";
import { setAuthToken } from "../core/authSession";
import { normalizeUser } from "./mappers";

function normalizeVehicleTypeForBackend(vehicleType) {
  const normalized = String(vehicleType || "").trim().toLowerCase();
  return normalized === "cab" ? "cab" : "auto";
}

function assertAuthResponseShape(data) {
  if (!data?.token || !data?.user) {
    throw new Error("Backend authentication response is missing token or user");
  }
}

export async function loginWithPassword(email, password, options = {}) {
  const data = await httpClient.post("/api/auth/login", {
    auth: false,
    timeoutMs: options.timeoutMs ?? 12000,
    body: {
      email: String(email || "").trim().toLowerCase(),
      password,
    },
  });

  assertAuthResponseShape(data);
  setAuthToken(data.token);

  return {
    token: data.token,
    user: normalizeUser(data.user),
  };
}

export async function registerRider(payload = {}) {
  const data = await httpClient.post("/api/auth/register", {
    auth: false,
    timeoutMs: 15000,
    body: {
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      phone: String(payload.phone || "").trim(),
      password: payload.password,
      role: "rider",
    },
  });

  assertAuthResponseShape(data);
  setAuthToken(data.token);

  return {
    token: data.token,
    user: normalizeUser(data.user),
  };
}

export async function registerDriverProfile(payload = {}) {
  const vehicleNumber = String(payload.vehicleNumber || payload.vehicleNo || "").trim().toUpperCase();
  if (!vehicleNumber) {
    throw new Error("vehicleNumber is required for driver registration");
  }

  const vehicleType = normalizeVehicleTypeForBackend(payload.vehicleType);

  const driverProfile = await httpClient.post("/api/drivers/register", {
    body: {
      vehicleNumber,
      vehicleType,
    },
  });

  return normalizeUser(
    {
      role: "driver",
      vehicle_type: driverProfile?.vehicle_type || vehicleType,
      vehicle_number: driverProfile?.vehicle_number || vehicleNumber,
    },
    {
      role: "driver",
      vehicleType: driverProfile?.vehicle_type || vehicleType,
      vehicleNo: driverProfile?.vehicle_number || vehicleNumber,
    }
  );
}

export async function getCurrentUserProfile() {
  const user = await httpClient.get("/api/auth/me");
  return normalizeUser(user);
}

export async function socialLoginNotSupported() {
  throw new Error("Google/Firebase login is not implemented in the current backend.");
}
