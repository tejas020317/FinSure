const { registerUser, loginUser } = require("../services/authService");

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and password are required." });
    }

    const result = await registerUser({ name, email, password, role });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: result,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res
      .status(status)
      .json({ success: false, message: error.message });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const result = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res
      .status(status)
      .json({ success: false, message: error.message });
  }
};

module.exports = { register, login };
