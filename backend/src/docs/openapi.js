function pathParam(name, description) {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema: {
      type: "string",
    },
  };
}

function queryParam(name, description, type = "string", example) {
  const param = {
    name,
    in: "query",
    required: false,
    description,
    schema: {
      type,
    },
  };

  if (example !== undefined) {
    param.schema.example = example;
  }

  return param;
}

function createRequestBody(example, description) {
  if (!example) {
    return undefined;
  }

  return {
    required: true,
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          example,
        },
      },
    },
  };
}

function createResponses({ successStatus = 200, successDescription = "Successful response" } = {}) {
  const responses = {
    400: { description: "Validation error or bad request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
    409: { description: "Conflict" },
    500: { description: "Internal server error" },
  };

  responses[successStatus] = { description: successDescription };
  return responses;
}

function createOperation(definition) {
  const operation = {
    tags: definition.tags,
    summary: definition.summary,
    description: definition.description,
    parameters: definition.parameters || [],
    responses: createResponses({
      successStatus: definition.successStatus || 200,
      successDescription: definition.successDescription || "Successful response",
    }),
  };

  if (definition.auth) {
    operation.security = [{ bearerAuth: [] }];
  }

  const requestBody = createRequestBody(definition.requestExample, definition.requestDescription);
  if (requestBody) {
    operation.requestBody = requestBody;
  }

  return operation;
}

function buildPaths(definitions) {
  return definitions.reduce((paths, definition) => {
    if (!paths[definition.path]) {
      paths[definition.path] = {};
    }

    paths[definition.path][definition.method] = createOperation(definition);
    return paths;
  }, {});
}

const authRegisterExample = {
  name: "Aarav Singh",
  email: "aarav@example.com",
  phone: "9000000001",
  password: "password123",
};

const authLoginExample = {
  email: "aarav@example.com",
  password: "password123",
};

const userProfileExample = {
  name: "Aarav Singh",
  email: "aarav@example.com",
  phone: "9000000001",
};

const savedLocationExample = {
  name: "Hostel Gate",
  address: "Hostel Gate, Campus Road",
  latitude: 30.901,
  longitude: 75.857,
};

const driverRegisterExample = {
  vehicleNumber: "PB10TEST001",
  vehicleType: "cab",
};

const driverAvailabilityExample = {
  isAvailable: true,
  status: "approved",
};

const driverLocationExample = {
  latitude: 30.900965,
  longitude: 75.857277,
};

const candidateResponseExample = {
  status: "accepted",
};

const quoteExample = {
  pickupLatitude: 30.900965,
  pickupLongitude: 75.857277,
  dropLatitude: 30.9123,
  dropLongitude: 75.8421,
  vehicleType: "cab",
  isShared: false,
};

const rideRequestExample = {
  pickupLocation: "Hostel Gate",
  dropLocation: "Main Gate",
  pickupLatitude: 30.900965,
  pickupLongitude: 75.857277,
  dropLatitude: 30.9123,
  dropLongitude: 75.8421,
  isShared: false,
  expiresAt: "2026-04-06T10:00:00.000Z",
};

const assignDriverExample = {
  driverId: "c7e9b3ae-0000-4000-9000-000000000001",
  fare: 160,
  distance: 7.2,
};

const rideStatusExample = {
  status: "started",
};

const rateRideExample = {
  rating: 5,
  reviewText: "Smooth ride and on time.",
};

const sharedRideCreateExample = {
  baseRideId: "c7e9b3ae-0000-4000-9000-000000000002",
  maxParticipants: 3,
};

const sharedRideJoinExample = {
  pickupLocation: "Hostel Gate",
  dropLocation: "Main Gate",
  pickupLatitude: 30.900965,
  pickupLongitude: 75.857277,
  dropLatitude: 30.9123,
  dropLongitude: 75.8421,
};

const sharedRideStatusExample = {
  status: "full",
};

const busRouteExample = {
  name: "Campus Loop A",
  departureTime: "09:00:00",
  arrivalTime: "10:00:00",
};

const busRouteStopExample = {
  stopName: "Library Stop",
  stopOrder: 1,
  stopType: "pickup",
  arrivalTime: "09:10:00",
  latitude: 30.9015,
  longitude: 75.859,
};

const busBookingExample = {
  routeId: "c7e9b3ae-0000-4000-9000-000000000003",
  seatNumber: 4,
  status: "pending",
};

const busBookingStatusExample = {
  status: "verified",
};

const adminDriverStatusExample = {
  status: "approved",
};

const endpointDefinitions = [
  {
    path: "/health",
    method: "get",
    tags: ["Health"],
    summary: "Health check",
    successDescription: "Service is healthy",
  },
  {
    path: "/api/auth/register",
    method: "post",
    tags: ["Auth"],
    summary: "Register a rider",
    requestExample: authRegisterExample,
    successStatus: 201,
    successDescription: "Rider registered successfully",
  },
  {
    path: "/api/auth/signup",
    method: "post",
    tags: ["Auth"],
    summary: "Register a rider",
    description: "Alias for /api/auth/register.",
    requestExample: authRegisterExample,
    successStatus: 201,
    successDescription: "Rider registered successfully",
  },
  {
    path: "/api/auth/login",
    method: "post",
    tags: ["Auth"],
    summary: "Login with email and password",
    requestExample: authLoginExample,
    successDescription: "Login successful",
  },
  {
    path: "/api/auth/google-login",
    method: "post",
    tags: ["Auth"],
    summary: "Google login placeholder",
    description: "Returns 501 in the current modular backend.",
    successStatus: 501,
    successDescription: "Not implemented",
  },
  {
    path: "/api/auth/firebase-login",
    method: "post",
    tags: ["Auth"],
    summary: "Firebase login placeholder",
    description: "Returns 501 in the current modular backend.",
    successStatus: 501,
    successDescription: "Not implemented",
  },
  {
    path: "/api/auth/me",
    method: "get",
    tags: ["Auth"],
    summary: "Get the authenticated user",
    auth: true,
  },
  {
    path: "/api/users/me",
    method: "get",
    tags: ["Users"],
    summary: "Get my profile",
    auth: true,
  },
  {
    path: "/api/users/me",
    method: "patch",
    tags: ["Users"],
    summary: "Update my profile",
    auth: true,
    requestExample: userProfileExample,
    successDescription: "Profile updated",
  },
  {
    path: "/api/users/saved-locations",
    method: "get",
    tags: ["Users"],
    summary: "List saved locations",
    auth: true,
  },
  {
    path: "/api/users/saved-locations",
    method: "post",
    tags: ["Users"],
    summary: "Add a saved location",
    auth: true,
    requestExample: savedLocationExample,
    successStatus: 201,
    successDescription: "Saved location added",
  },
  {
    path: "/api/users/saved-locations/{locationId}",
    method: "delete",
    tags: ["Users"],
    summary: "Delete a saved location",
    auth: true,
    parameters: [pathParam("locationId", "Saved location identifier")],
    successDescription: "Saved location removed",
  },
  {
    path: "/api/drivers/nearby",
    method: "get",
    tags: ["Drivers"],
    summary: "Find nearby drivers",
    parameters: [
      queryParam("latitude", "Latitude of the pickup point", "number", 30.900965),
      queryParam("longitude", "Longitude of the pickup point", "number", 75.857277),
      queryParam("limit", "Maximum number of drivers to return", "integer", 20),
    ],
  },
  {
    path: "/api/drivers/register",
    method: "post",
    tags: ["Drivers"],
    summary: "Create a driver profile",
    auth: true,
    requestExample: driverRegisterExample,
    successStatus: 201,
    successDescription: "Driver registered successfully",
  },
  {
    path: "/api/drivers/me",
    method: "get",
    tags: ["Drivers"],
    summary: "Get the driver profile",
    auth: true,
  },
  {
    path: "/api/drivers/me/active-ride",
    method: "get",
    tags: ["Drivers"],
    summary: "Get the active ride for the driver",
    auth: true,
  },
  {
    path: "/api/drivers/me/availability",
    method: "patch",
    tags: ["Drivers"],
    summary: "Update driver availability",
    auth: true,
    requestExample: driverAvailabilityExample,
    successDescription: "Driver availability updated",
  },
  {
    path: "/api/drivers/me/location",
    method: "patch",
    tags: ["Drivers"],
    summary: "Update driver location",
    auth: true,
    requestExample: driverLocationExample,
    successDescription: "Driver location updated",
  },
  {
    path: "/api/drivers/requests",
    method: "get",
    tags: ["Drivers"],
    summary: "List ride candidates for the driver",
    auth: true,
  },
  {
    path: "/api/drivers/requests/{requestId}/respond",
    method: "post",
    tags: ["Drivers"],
    summary: "Respond to a ride request candidate",
    auth: true,
    parameters: [pathParam("requestId", "Ride request identifier")],
    requestExample: candidateResponseExample,
    successDescription: "Candidate status updated",
  },
  {
    path: "/api/rides/quote",
    method: "post",
    tags: ["Rides"],
    summary: "Calculate a ride quote",
    requestExample: quoteExample,
    successDescription: "Quote calculated",
  },
  {
    path: "/api/rides",
    method: "post",
    tags: ["Rides"],
    summary: "Create a ride request",
    description: "Legacy compatibility route for creating a ride request.",
    auth: true,
    requestExample: rideRequestExample,
    successStatus: 201,
    successDescription: "Ride request created",
  },
  {
    path: "/api/rides/requests",
    method: "post",
    tags: ["Rides"],
    summary: "Create a ride request",
    auth: true,
    requestExample: rideRequestExample,
    successStatus: 201,
    successDescription: "Ride request created",
  },
  {
    path: "/api/rides/requests/{requestId}",
    method: "get",
    tags: ["Rides"],
    summary: "Get a ride request",
    auth: true,
    parameters: [pathParam("requestId", "Ride request identifier")],
  },
  {
    path: "/api/rides/requests/{requestId}/cancel",
    method: "patch",
    tags: ["Rides"],
    summary: "Cancel a ride request",
    auth: true,
    parameters: [pathParam("requestId", "Ride request identifier")],
  },
  {
    path: "/api/rides/requests/{requestId}/assign",
    method: "post",
    tags: ["Rides"],
    summary: "Assign a driver and create a ride",
    auth: true,
    parameters: [pathParam("requestId", "Ride request identifier")],
    requestExample: assignDriverExample,
    successStatus: 201,
    successDescription: "Driver assigned and ride created",
  },
  {
    path: "/api/rides/history",
    method: "get",
    tags: ["Rides"],
    summary: "Get my ride history",
    auth: true,
  },
  {
    path: "/api/rides/history/{userId}",
    method: "get",
    tags: ["Rides"],
    summary: "Get ride history for a user",
    auth: true,
    parameters: [pathParam("userId", "User identifier")],
  },
  {
    path: "/api/rides/{rideId}",
    method: "get",
    tags: ["Rides"],
    summary: "Get a ride",
    auth: true,
    parameters: [pathParam("rideId", "Ride identifier")],
  },
  {
    path: "/api/rides/{rideId}/status",
    method: "patch",
    tags: ["Rides"],
    summary: "Update ride status",
    auth: true,
    parameters: [pathParam("rideId", "Ride identifier")],
    requestExample: rideStatusExample,
    successDescription: "Ride status updated",
  },
  {
    path: "/api/rides/{rideId}/rate",
    method: "post",
    tags: ["Rides"],
    summary: "Rate a ride",
    auth: true,
    parameters: [pathParam("rideId", "Ride identifier")],
    requestExample: rateRideExample,
    successDescription: "Ride rated successfully",
  },
  {
    path: "/api/shared-rides",
    method: "get",
    tags: ["Shared Rides"],
    summary: "List shared rides",
    parameters: [queryParam("status", "Filter by shared ride status", "string", "open")],
  },
  {
    path: "/api/shared-rides",
    method: "post",
    tags: ["Shared Rides"],
    summary: "Create a shared ride",
    auth: true,
    requestExample: sharedRideCreateExample,
    successStatus: 201,
    successDescription: "Shared ride created",
  },
  {
    path: "/api/shared-rides/{sharedRideId}",
    method: "get",
    tags: ["Shared Rides"],
    summary: "Get a shared ride",
    parameters: [pathParam("sharedRideId", "Shared ride identifier")],
  },
  {
    path: "/api/shared-rides/{sharedRideId}/join",
    method: "post",
    tags: ["Shared Rides"],
    summary: "Join a shared ride",
    auth: true,
    parameters: [pathParam("sharedRideId", "Shared ride identifier")],
    requestExample: sharedRideJoinExample,
    successStatus: 201,
    successDescription: "Joined shared ride",
  },
  {
    path: "/api/shared-rides/{sharedRideId}/status",
    method: "patch",
    tags: ["Shared Rides"],
    summary: "Update shared ride status",
    auth: true,
    parameters: [pathParam("sharedRideId", "Shared ride identifier")],
    requestExample: sharedRideStatusExample,
    successDescription: "Shared ride status updated",
  },
  {
    path: "/api/bus/routes",
    method: "get",
    tags: ["Bus"],
    summary: "List bus routes",
  },
  {
    path: "/api/bus/routes",
    method: "post",
    tags: ["Bus"],
    summary: "Create a bus route",
    auth: true,
    requestExample: busRouteExample,
    successStatus: 201,
    successDescription: "Bus route created",
  },
  {
    path: "/api/bus/routes/{routeId}/stops",
    method: "post",
    tags: ["Bus"],
    summary: "Add a stop to a bus route",
    auth: true,
    parameters: [pathParam("routeId", "Bus route identifier")],
    requestExample: busRouteStopExample,
    successStatus: 201,
    successDescription: "Bus route stop added",
  },
  {
    path: "/api/bus/bookings",
    method: "get",
    tags: ["Bus"],
    summary: "List bus bookings",
    auth: true,
    parameters: [
      queryParam("routeId", "Filter by route identifier"),
      queryParam("userId", "Filter by user identifier"),
    ],
  },
  {
    path: "/api/bus/bookings",
    method: "post",
    tags: ["Bus"],
    summary: "Create a bus booking",
    auth: true,
    requestExample: busBookingExample,
    successStatus: 201,
    successDescription: "Bus booking created",
  },
  {
    path: "/api/bus/bookings/{bookingId}/status",
    method: "patch",
    tags: ["Bus"],
    summary: "Update bus booking status",
    auth: true,
    parameters: [pathParam("bookingId", "Bus booking identifier")],
    requestExample: busBookingStatusExample,
    successDescription: "Bus booking status updated",
  },
  {
    path: "/api/bus-routes",
    method: "get",
    tags: ["Bus"],
    summary: "Legacy alias for bus routes",
  },
  {
    path: "/api/bus-routes",
    method: "post",
    tags: ["Bus"],
    summary: "Legacy alias for creating a bus route",
    auth: true,
    requestExample: busRouteExample,
    successStatus: 201,
    successDescription: "Bus route created",
  },
  {
    path: "/api/bus-bookings",
    method: "get",
    tags: ["Bus"],
    summary: "Legacy alias for bus bookings",
    auth: true,
    parameters: [
      queryParam("routeId", "Filter by route identifier"),
      queryParam("userId", "Filter by user identifier"),
    ],
  },
  {
    path: "/api/bus-bookings",
    method: "post",
    tags: ["Bus"],
    summary: "Legacy alias for creating a bus booking",
    auth: true,
    requestExample: busBookingExample,
    successStatus: 201,
    successDescription: "Bus booking created",
  },
  {
    path: "/api/admin/dashboard",
    method: "get",
    tags: ["Admin"],
    summary: "Get dashboard stats",
    auth: true,
  },
  {
    path: "/api/admin/analytics",
    method: "get",
    tags: ["Admin"],
    summary: "Get monitoring analytics",
    description: "Returns live queue metrics, trend series, leaderboards, and recent operational activity for the admin console.",
    auth: true,
    parameters: [
      queryParam("days", "Lookback window in days", "integer", 7),
      queryParam("limit", "Number of rows to return in each leaderboard section", "integer", 5),
    ],
  },
  {
    path: "/api/admin/health",
    method: "get",
    tags: ["Admin"],
    summary: "Get admin health snapshot",
    description: "Returns database connectivity and process uptime information for the admin monitoring view.",
    auth: true,
  },
  {
    path: "/api/admin/users",
    method: "get",
    tags: ["Admin"],
    summary: "List users",
    auth: true,
    parameters: [
      queryParam("page", "Page number", "integer", 1),
      queryParam("limit", "Page size", "integer", 20),
      queryParam("role", "Filter by role", "string", "rider"),
    ],
  },
  {
    path: "/api/admin/rides",
    method: "get",
    tags: ["Admin"],
    summary: "List rides",
    auth: true,
    parameters: [
      queryParam("page", "Page number", "integer", 1),
      queryParam("limit", "Page size", "integer", 20),
      queryParam("status", "Filter by ride status", "string", "completed"),
    ],
  },
  {
    path: "/api/admin/drivers/{driverId}/status",
    method: "patch",
    tags: ["Admin"],
    summary: "Update driver status",
    auth: true,
    parameters: [pathParam("driverId", "Driver identifier")],
    requestExample: adminDriverStatusExample,
    successDescription: "Driver status updated",
  },
  {
    path: "/api/admin/drivers/{driverId}/suspend",
    method: "patch",
    tags: ["Admin"],
    summary: "Suspend a driver",
    auth: true,
    parameters: [pathParam("driverId", "Driver identifier")],
    successDescription: "Driver status updated",
  },
  {
    path: "/api/admin/users/{userId}/suspend",
    method: "put",
    tags: ["Admin"],
    summary: "Suspend a user",
    auth: true,
    parameters: [pathParam("userId", "User identifier")],
    successDescription: "User suspended",
  },
];

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Ghoomo Backend API",
    version: "1.0.0",
    description: "Interactive API docs for the modular Ghoomo backend.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Service checks" },
    { name: "Auth", description: "Authentication and session endpoints" },
    { name: "Users", description: "User profile and saved locations" },
    { name: "Drivers", description: "Driver profile and matching endpoints" },
    { name: "Rides", description: "Ride requests, assignments, and ratings" },
    { name: "Shared Rides", description: "Shared ride lifecycle" },
    { name: "Bus", description: "Bus routes and bookings" },
    { name: "Admin", description: "Admin dashboard and moderation" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: buildPaths(endpointDefinitions),
};

module.exports = {
  openApiSpec,
};