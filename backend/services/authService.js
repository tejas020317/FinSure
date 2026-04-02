const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { generateToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {{ user: object, token: string }}
 */
const registerUser = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error("User with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "officer",
  });

  // Generate JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Authenticate an existing user.
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 */
const loginUser = async ({ email, password }) => {
  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

module.exports = { registerUser, loginUser };
