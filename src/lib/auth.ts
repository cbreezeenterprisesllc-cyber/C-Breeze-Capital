import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET ?? "greenexpress-dev-secret-change-in-prod";
const SALT_ROUNDS = 10;

export interface JwtPayload {
  userId: string;
  email: string;
  role: "customer" | "merchant" | "admin";
  tenantId?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireAuth(request: Request, allowedRoles?: string[]): JwtPayload | null {
  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  if (allowedRoles && !allowedRoles.includes(payload.role)) return null;
  return payload;
}

export function generateId(): string {
  return uuidv4();
}