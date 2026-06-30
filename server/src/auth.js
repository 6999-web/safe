import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'security-intel-dev-secret';

export function createAuth({ jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET } = {}) {
  return {
    hashPassword(password) {
      return bcrypt.hash(password, 10);
    },
    verifyPassword(password, hash) {
      return bcrypt.compare(password, hash);
    },
    signToken(user) {
      return jwt.sign(
        { sub: user.id, role: user.role, username: user.username },
        jwtSecret,
        { expiresIn: '7d' },
      );
    },
    verifyToken(token) {
      try {
        return jwt.verify(token, jwtSecret);
      } catch {
        return null;
      }
    },
  };
}
