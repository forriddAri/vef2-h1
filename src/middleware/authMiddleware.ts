import { Context, Next } from "hono";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // Load from .env

// Define the UserPayload type
interface UserPayload {
  id: string;
  role: "ADMIN" | "PLAYER";
}

// Authentication Middleware
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

  const token = authHeader.split(" ")[1];
  try {
    const user = verify(token, JWT_SECRET) as UserPayload;
    c.set("user", user); // Store user in context
    await next();
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
