export const BUS_WAITLIST_LIMIT = 10;

function parseTimeLabel(timeLabel) {
  const safeLabel = String(timeLabel || "12:00 PM").trim();
  const [time, periodText = "AM"] = safeLabel.split(" ");
  const period = periodText.toUpperCase();
  const [hourText, minuteText] = time.split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 12, minute: 0 };
  }

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

export function getNextDeparture(route, now = new Date()) {
  const { hour, minute } = parseTimeLabel(route?.departureTime);
  const departure = new Date(now);
  departure.setHours(hour, minute, 0, 0);

  if (departure <= now) {
    departure.setDate(departure.getDate() + 1);
  }

  return departure;
}

export function getBookingWindow(route, now = new Date()) {
  const departure = getNextDeparture(route, now);
  const opensAt = new Date(departure.getTime() - 60 * 60 * 1000);
  const cancelClosesAt = new Date(departure.getTime() - 5 * 60 * 1000);

  return {
    departure,
    opensAt,
    cancelClosesAt,
    canBook: now >= opensAt && now < departure,
    canCancel: now < cancelClosesAt,
  };
}

export function formatShortTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeMinutes(target, now = new Date()) {
  const diffMinutes = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function getRouteOccupancy(route, busBookings = []) {
  const routeId = route?.id;
  const totalSeats = Number.isFinite(Number(route?.totalSeats)) && Number(route?.totalSeats) > 0
    ? Number(route.totalSeats)
    : 40;
  const bookedSeats = Array.isArray(route?.bookedSeats) ? route.bookedSeats : [];

  const activeBookings = busBookings.filter(
    (booking) => booking.routeId === routeId && booking.status !== "cancelled"
  );
  const confirmedSeatBookings = activeBookings.filter(
    (booking) => !booking.isWaiting && typeof booking.seatNumber === "number"
  );
  const confirmedSeatNumbers = [
    ...bookedSeats,
    ...confirmedSeatBookings.map((booking) => booking.seatNumber),
  ];
  const dedupedConfirmedSeats = [...new Set(confirmedSeatNumbers)].sort((a, b) => a - b);
  const waitingBookings = activeBookings
    .filter((booking) => booking.isWaiting)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const availableSeats = Array.from({ length: totalSeats }, (_, index) => index + 1).filter(
    (seatNumber) => !dedupedConfirmedSeats.includes(seatNumber)
  );

  return {
    confirmedSeats: dedupedConfirmedSeats,
    waitingBookings,
    availableSeats,
    availableSeatCount: availableSeats.length,
    waitlistRemaining: Math.max(0, BUS_WAITLIST_LIMIT - waitingBookings.length),
    occupancyRatio: (totalSeats - availableSeats.length) / totalSeats,
  };
}

export function getDemandLabel(occupancyRatio) {
  if (occupancyRatio >= 0.9) return { label: "High live demand", color: "#EF4444" };
  if (occupancyRatio >= 0.6) return { label: "Moderate live demand", color: "#F59E0B" };
  return { label: "Low live demand", color: "#10B981" };
}
