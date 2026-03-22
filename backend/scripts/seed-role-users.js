const fs = require("fs");
const path = require("path");

const dataPath = process.env.DATA_PATH || path.join(__dirname, "..", "data", "store.json");

function nowId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore() {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Store file not found at ${dataPath}`);
  }
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

function upsertByEmail(users, user) {
  const idx = users.findIndex((u) => String(u.email || "").toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
    return "updated";
  }
  users.push(user);
  return "created";
}

function seedRoleUsers() {
  const store = readStore();
  store.users = Array.isArray(store.users) ? store.users : [];

  const baseCity = "Ludhiana";
  const now = new Date().toISOString();

  const roleUsers = [
    {
      id: nowId("u"),
      name: "Test User",
      email: "test.user@ghoomo.com",
      phone: "9000000001",
      password: "123456",
      role: "user",
      city: baseCity,
      emergencyContact: "9000000991",
      authMethod: "email",
      isActive: true,
      createdAt: now,
      lastLogin: now,
    },
    {
      id: nowId("d"),
      name: "Test Driver",
      email: "test.driver@ghoomo.com",
      phone: "9000000002",
      password: "123456",
      role: "driver",
      city: baseCity,
      emergencyContact: "9000000992",
      vehicleType: "cab",
      vehicleNo: "PB-10-TEST-001",
      licenseNumber: "DL-TEST-DRIVER-001",
      rating: 4.8,
      online: false,
      currentLocation: {
        latitude: 30.900965,
        longitude: 75.857277,
      },
      authMethod: "email",
      isActive: true,
      createdAt: now,
      lastLogin: now,
    },
    {
      id: nowId("a"),
      name: "Test Admin",
      email: "test.admin@ghoomo.com",
      phone: "9000000003",
      password: "123456",
      role: "admin",
      city: baseCity,
      emergencyContact: "9000000993",
      employeeId: "ADM-TEST-001",
      organization: "Ghoomo",
      authMethod: "email",
      isActive: true,
      createdAt: now,
      lastLogin: now,
    },
  ];

  const results = roleUsers.map((u) => ({ email: u.email, result: upsertByEmail(store.users, u) }));

  writeStore(store);

  console.log("Seed complete:");
  results.forEach((r) => console.log(`- ${r.email}: ${r.result}`));
  console.log("\nLogin credentials:");
  console.log("- User   : test.user@ghoomo.com / 123456");
  console.log("- Driver : test.driver@ghoomo.com / 123456");
  console.log("- Admin  : test.admin@ghoomo.com / 123456");
}

seedRoleUsers();
