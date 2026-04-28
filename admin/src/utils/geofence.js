export function normalizeBoundaryPoint(point) {
  if (!point) return null;

  const lat = Number(point.lat ?? point.latitude);
  const lng = Number(point.lng ?? point.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function isPointInPolygon(point, polygon = []) {
  const testPoint = normalizeBoundaryPoint(point);
  const vertices = Array.isArray(polygon) ? polygon.map(normalizeBoundaryPoint).filter(Boolean) : [];

  if (!testPoint || vertices.length < 3) {
    return false;
  }

  let inside = false;

  for (let index = 0, previousIndex = vertices.length - 1; index < vertices.length; previousIndex = index, index += 1) {
    const current = vertices[index];
    const previous = vertices[previousIndex];
    const intersects =
      current.lng > testPoint.lng !== previous.lng > testPoint.lng &&
      testPoint.lat <
        ((previous.lat - current.lat) * (testPoint.lng - current.lng)) /
          ((previous.lng - current.lng) || Number.EPSILON) +
          current.lat;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function orientation(a, b, c) {
  const value = (b.lng - a.lng) * (c.lat - b.lat) - (b.lat - a.lat) * (c.lng - b.lng);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return (
    Math.min(a.lng, c.lng) <= b.lng &&
    b.lng <= Math.max(a.lng, c.lng) &&
    Math.min(a.lat, c.lat) <= b.lat &&
    b.lat <= Math.max(a.lat, c.lat)
  );
}

function segmentsIntersect(a1, a2, b1, b2) {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && onSegment(a1, b1, a2)) return true;
  if (o2 === 0 && onSegment(a1, b2, a2)) return true;
  if (o3 === 0 && onSegment(b1, a1, b2)) return true;
  if (o4 === 0 && onSegment(b1, a2, b2)) return true;

  return false;
}

export function isPolygonSelfIntersecting(points = []) {
  const vertices = Array.isArray(points) ? points.map(normalizeBoundaryPoint).filter(Boolean) : [];

  if (vertices.length < 4) {
    return false;
  }

  for (let i = 0; i < vertices.length; i += 1) {
    const a1 = vertices[i];
    const a2 = vertices[(i + 1) % vertices.length];

    for (let j = i + 1; j < vertices.length; j += 1) {
      const sharesEndpoint =
        i === j ||
        (i + 1) % vertices.length === j ||
        i === (j + 1) % vertices.length;

      if (sharesEndpoint) {
        continue;
      }

      const b1 = vertices[j];
      const b2 = vertices[(j + 1) % vertices.length];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}