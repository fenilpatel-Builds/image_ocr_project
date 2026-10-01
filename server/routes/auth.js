const express = require('express');
const bcrypt = require('bcryptjs');
const DB = require('../db');
const { generateToken, authenticateToken } = require('../auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = DB.getUserByEmail(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = DB.getUserByEmail(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = DB.createUser(name.trim(), email.toLowerCase().trim(), passwordHash, 'user');

  const newUser = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user' };
  const token = generateToken(newUser);

  res.status(201).json({
    token,
    user: newUser
  });
});

// POST /api/auth/demo/:role - Instant 1-click login for evaluation
router.post('/demo/:role', (req, res) => {
  const { role } = req.params;
  const roleEmailMap = {
    admin: 'admin@example.com',
    user: 'user@example.com',
    auditor: 'auditor@example.com'
  };

  const email = roleEmailMap[role.toLowerCase()];
  if (!email) {
    return res.status(400).json({ error: 'Invalid demo role. Allowed: admin, user, auditor' });
  }

  const user = DB.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found. Please restart server to seed.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = DB.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

// GET /api/auth/users (Admin only)
router.get('/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  const users = DB.listUsers();
  res.json({ users });
});

module.exports = router;
