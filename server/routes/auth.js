import express from 'express';
import db from '../database.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUser = username.trim().toLowerCase();
    const user = db.prepare('SELECT id, username, password, role, display_name FROM users WHERE lower(username) = ?').get(trimmedUser);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/users - List users for Admin view
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, display_name FROM users ORDER BY id ASC').all();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const trimmedUser = username.trim().toLowerCase();
    const result = db.prepare('UPDATE users SET password = ? WHERE lower(username) = ?').run(newPassword, trimmedUser);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, message: `Password for ${username} updated successfully` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

