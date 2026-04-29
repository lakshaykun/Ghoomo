const DEFAULT_RATE_CARD = Object.freeze({
  auto: { baseFare: 30, perKmFare: 12, sharedMultiplier: 0.7 },
  cab: { baseFare: 50, perKmFare: 18, sharedMultiplier: 0.7 },
});

function parseRateCardFromEnv() {
  const raw = process.env.RIDE_RATE_CARD_JSON;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function getRateCard() {
  const fromEnv = parseRateCardFromEnv();
  return fromEnv || DEFAULT_RATE_CARD;
}

function calculateFare({ distanceKm, vehicleType, isShared = false }) {
  const safeDistance = Number(distanceKm);
  const normalizedDistance = Number.isFinite(safeDistance) ? Math.max(0, safeDistance) : 0;
  const normalizedVehicleType = String(vehicleType || "auto").trim().toLowerCase();
  const rateCard = getRateCard();
  const rule = rateCard[normalizedVehicleType] || rateCard.auto;

  const baseFare = Number(rule?.baseFare || 0);
  const perKmFare = Number(rule?.perKmFare || 0);
  const sharedMultiplier = Number(rule?.sharedMultiplier || 1);
  const rawFare = baseFare + normalizedDistance * perKmFare;
  const adjustedFare = isShared ? rawFare * sharedMultiplier : rawFare;

  return Number(adjustedFare.toFixed(2));
}

module.exports = {
  getRateCard,
  calculateFare,
};
