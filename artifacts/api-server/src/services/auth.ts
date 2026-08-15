import { getUserByEmail, createUser, updateUser } from "./db";
import { hashPassword, verifyPassword, generateId } from "../lib/crypto";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";
import type { User } from "@workspace/db";

export interface SignupInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Sign up a new user
 */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  // Validate input
  if (!input.email || !input.name || !input.password) {
    throw new Error("Email, name, and password are required");
  }

  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user already exists
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create user
  const user = await createUser({
    email: input.email,
    name: input.name,
    password: hashedPassword,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
      avatar: user.avatar || undefined,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login existing user
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  // Validate input
  if (!input.email || !input.password) {
    throw new Error("Email and password are required");
  }

  // Find user
  const user = await getUserByEmail(input.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.password);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
      avatar: user.avatar || undefined,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Get current user
 */
export async function getCurrentUser(userId: string): Promise<User | undefined> {
  return getUserByEmail(userId) || undefined;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; avatar?: string }
): Promise<User> {
  const user = await updateUser(userId, updates);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
