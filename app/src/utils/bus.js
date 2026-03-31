export const BUS_WAITLIST_LIMIT = 10;

function parseTimeLabel(timeLabel) {
  const [time, period] = timeLabel.trim().split(" ");
  const [hourText, minuteText] = time.split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

export function getNextDeparture(route, now = new Date()) {
  const { hour, minute } = parseTimeLabel(route.departureTime);
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
  const activeBookings = busBookings.filter(
    (booking) => booking.routeId === route.id && booking.status !== "cancelled"
  );
  const confirmedSeatBookings = activeBookings.filter(
    (booking) => !booking.isWaiting && typeof booking.seatNumber === "number"
  );
  const confirmedSeatNumbers = [
    ...route.bookedSeats,
    ...confirmedSeatBookings.map((booking) => booking.seatNumber),
  ];
  const dedupedConfirmedSeats = [...new Set(confirmedSeatNumbers)].sort((a, b) => a - b);
  const waitingBookings = activeBookings
    .filter((booking) => booking.isWaiting)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const availableSeats = Array.from({ length: route.totalSeats }, (_, index) => index + 1).filter(
    (seatNumber) => !dedupedConfirmedSeats.includes(seatNumber)
  );

  return {
    confirmedSeats: dedupedConfirmedSeats,
    waitingBookings,
    availableSeats,
    availableSeatCount: availableSeats.length,
    waitlistRemaining: Math.max(0, BUS_WAITLIST_LIMIT - waitingBookings.length),
    occupancyRatio: (route.totalSeats - availableSeats.length) / route.totalSeats,
  };
}

export function getDemandLabel(occupancyRatio) {
  if (occupancyRatio >= 0.9) return { label: "High live demand", color: "#EF4444" };
  if (occupancyRatio >= 0.6) return { label: "Moderate live demand", color: "#F59E0B" };
  return { label: "Low live demand", color: "#10B981" };
}
