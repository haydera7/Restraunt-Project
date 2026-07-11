import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authRequired, cookieName, createSession, sessionCookieOptions } from '../middleware/auth.js';

const router = express.Router();

function publicUser(user) {
  return { id: user._id, phone: user.phone, role: user.role };
}

router.post('/login', async (req, res) => {
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!phone || !password) return res.status(400).json({ error: 'Phone number and password are required' });

  const user = await User.findOne({ phone });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect phone number or password' });
  }
  res.cookie(cookieName, createSession(user), sessionCookieOptions());
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(cookieName, sessionCookieOptions());
  res.status(204).end();
});

router.get('/me', authRequired, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch('/profile', authRequired, async (req, res) => {
  const phone = String(req.body.phone || '').trim();
  const { currentPassword } = req.body;
  if (!phone || !currentPassword) return res.status(400).json({ error: 'Phone number and current password are required' });
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  const inUse = await User.exists({ phone, _id: { $ne: req.user._id } });
  if (inUse) return res.status(409).json({ error: 'This phone number is already in use' });
  req.user.phone = phone;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

router.post('/change-password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords are required' });
  if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  req.user.passwordHash = await bcrypt.hash(newPassword, 12);
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

export default router;
