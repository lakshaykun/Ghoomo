import { httpClient } from "../core/httpClient";
import { normalizeBusBooking, normalizeBusRoute, toNumber } from "./mappers";

let routeCache = [];

function setRouteCache(routes) {
  routeCache = Array.isArray(routes) ? routes : [];
}

function getRouteFromCache(routeId) {
  return routeCache.find((route) => route.id === routeId) || null;
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function computeSeatAssignment(route, busBookings = [], requestedSeat = null) {
  const totalSeats = toNumber(route?.totalSeats, null);
  if (!Number.isFinite(totalSeats) || totalSeats <= 0) {
    throw new Error("Route capacity is not configured correctly.");
  }
  const confirmedSeatNumbers = new Set(
    busBookings
      .filter((booking) => !booking.isWaiting && booking.status !== "cancelled")
      .map((booking) => booking.seatNumber)
      .filter((seat) => Number.isFinite(Number(seat)))
      .map((seat) => Number(seat))
  );

  const availableSeats = Array.from({ length: totalSeats }, (_, index) => index + 1).filter(
    (seat) => !confirmedSeatNumbers.has(seat)
  );
  const requested = Number(requestedSeat);
  if (Number.isInteger(requested) && requested > 0) {
    if (!availableSeats.includes(requested)) {
      throw new Error(`Seat ${requested} is no longer available.`);
    }
    return { seatNumber: requested, waitlistPosition: null };
  }

  const availableSeat = availableSeats[0];

  if (availableSeat) {
    return { seatNumber: availableSeat, waitlistPosition: null };
  }

  const waitingCount = busBookings.filter(
    (booking) => booking.isWaiting && booking.status !== "cancelled"
  ).length;

  const waitlistLimit = Number.isFinite(Number(route?.waitlistLimit)) ? Number(route.waitlistLimit) : 10;
  if (waitingCount >= waitlistLimit) {
    throw new Error("This route is full and the waiting list is also full.");
  }

  return {
    seatNumber: null,
    waitlistPosition: waitingCount + 1,
  };
}

export async function fetchBusRoutesRemote() {
  const rows = await httpClient.get("/api/bus/routes");
  const routes = Array.isArray(rows) ? rows.map((row) => normalizeBusRoute(row)) : [];
  setRouteCache(routes);
  return { routes };
}

export async function createBusRouteRemote(payload = {}) {
  await httpClient.post("/api/bus/routes", {
    body: {
      name: payload.name,
      departureTime: payload.departureTime,
      arrivalTime: payload.arrivalTime,
      totalSeats: payload.totalSeats,
      farePerSeat: payload.farePerSeat,
    },
  });

  return fetchBusRoutesRemote();
}

export async function fetchBusBookingsRemote(params = {}) {
  const rows = await httpClient.get(withQuery("/api/bus/bookings", params));
  const busBookings = Array.isArray(rows)
    ? rows.map((row) =>
        normalizeBusBooking(row, {
          fallbackUserName: params.userName || "Passenger",
        })
      )
    : [];

  return { busBookings };
}

export async function createBusBookingRemote(payload = {}) {
  if (!payload.routeId) {
    throw new Error("routeId is required");
  }

  const route = getRouteFromCache(payload.routeId) || (await fetchBusRoutesRemote()).routes.find(
    (item) => item.id === payload.routeId
  );

  const { busBookings: existingBookings } = await fetchBusBookingsRemote({
    routeId: payload.routeId,
  });

  const alreadyBooked = existingBookings.some(
    (booking) => booking.userId === payload.userId && booking.status !== "cancelled"
  );

  if (alreadyBooked) {
    throw new Error("You already have an active booking for this bus route.");
  }

  const { seatNumber, waitlistPosition } = computeSeatAssignment(route, existingBookings, payload.seatNumber);

  const body = {
    routeId: payload.routeId,
    userId: payload.userId,
    status: "pending",
    ...(seatNumber === null ? {} : { seatNumber }),
  };

  const row = await httpClient.post("/api/bus/bookings", {
    body,
  });

  const booking = normalizeBusBooking(
    {
      ...row,
      seat_number: seatNumber,
      user_name: payload.userName,
      waitlist_position: waitlistPosition,
      is_waiting: seatNumber === null,
      fare_amount: row?.fare_amount,
    },
    {
      fallbackUserName: payload.userName || "Passenger",
    }
  );

  return { booking };
}

export async function fetchBusRouteTrackingRemote(routeId) {
  const payload = await httpClient.get(`/api/bus/routes/${routeId}/tracking`);
  return payload || null;
}

export async function updateBusRouteLocationRemote(routeId, payload = {}) {
  const row = await httpClient.patch(`/api/bus/routes/${routeId}/location`, {
    body: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      speedKmph: payload.speedKmph,
      headingDeg: payload.headingDeg,
      delayMinutes: payload.delayMinutes,
    },
  });
  return row;
}

export async function cancelBusBookingRemote(bookingId) {
  await httpClient.post(`/api/bus/bookings/${bookingId}/cancel`, {
    body: {},
  });

  return { success: true };
}

export async function verifyBusBookingRemote(bookingId, verifiedBy) {
  void verifiedBy;

  await httpClient.patch(`/api/bus/bookings/${bookingId}/status`, {
    body: {
      status: "verified",
    },
  });

  return { success: true };
}
