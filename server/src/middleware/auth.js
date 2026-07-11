import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const cookieName = 'inventory_session';
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-this-secret';

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}

export function createSession(user) {
  return jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: '7d' });
}

export async function authRequired(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) return res.status(401).json({ error: 'Please log in to continue' });
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Your session is no longer valid' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Please log in to continue' });
  }
}

export { cookieName };
