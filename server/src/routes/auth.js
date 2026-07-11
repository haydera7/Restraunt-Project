import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authRequired, cookieName, createSession, sessionCookieOptions } from '../middleware/auth.js';

const router = express.Router();

/**
 * Normalize an Ethiopian phone number to +251XXXXXXXXX format.
 * Accepts: 09XXXXXXXX, 9XXXXXXXX, +2519XXXXXXXX, 2519XXXXXXXX
 * Returns null if the input doesn't look like a valid Ethiopian mobile number.
 */
function normalizePhone(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, '');
  let digits;
  if (s.startsWith('+251')) {
    digits = s.slice(4);          // strip +251
  } else if (s.startsWith('251')) {
    digits = s.slice(3);          // strip 251
  } else if (s.startsWith('0')) {
    digits = s.slice(1);          // strip leading 0
  } else {
    digits = s;                   // assume bare 9XXXXXXXX
  }
  // Ethiopian mobile numbers: 9 digits starting with 9, 7 or 1 (Ethiotelecom)
  if (!/^\d{9}$/.test(digits)) return null;
  return '+251' + digits;
}

function publicUser(user) {
  return { id: user._id, phone: user.phone, role: user.role };
}

router.post('/login', async (req, res) => {
  const raw = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!raw || !password) return res.status(400).json({ error: 'Phone number and password are required' });

  const phone = normalizePhone(raw);
  if (!phone) return res.status(400).json({ error: 'Enter a valid Ethiopian phone number (e.g. 09... or +251...)' });

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
  const raw = String(req.body.phone || '').trim();
  const { currentPassword } = req.body;
  if (!raw || !currentPassword) return res.status(400).json({ error: 'Phone number and current password are required' });

  const phone = normalizePhone(raw);
  if (!phone) return res.status(400).json({ error: 'Enter a valid Ethiopian phone number (e.g. 09... or +251...)' });

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
