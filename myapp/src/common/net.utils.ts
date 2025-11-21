import type { Request } from "express";
import geoip from "geoip-lite";

export function getClientIp(req: Request) {
  // Với trust proxy: req.ip đã chuẩn hóa
  return (req.ip || "").replace(/^::ffff:/, "") || "0.0.0.0";
}

export function getIpGeo(ip: string) {
  try {
    const loc = geoip.lookup(ip);
    if (!loc) return null;
    const [lat, lon] = loc.ll; // [lat, lon]
    return { lat, lon, country: loc.country, city: loc.city };
  } catch {
    return null;
  }
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
}
