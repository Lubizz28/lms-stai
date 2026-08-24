import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/pool.js';
import { ENV } from '../../config/env.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nama pengguna dan kata sandi wajib diisi.'
        }
      });
      return;
    }

    const userResult = await db.query(
      'SELECT id, username, password_hash, name, identity_number, email, role, study_program FROM users WHERE username = $1 OR email = $1 LIMIT 1',
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Nama pengguna atau kata sandi tidak valid.'
        }
      });
      return;
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Nama pengguna atau kata sandi tidak valid.'
        }
      });
      return;
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      identityNumber: user.identity_number,
      email: user.email,
      role: user.role,
      studyProgram: user.study_program
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });

    // Pasang HttpOnly Cookie yang aman
    const isProd = ENV.NODE_ENV === 'production';
    const cookieFlags = [
      `salam_token=${token}`,
      'HttpOnly',
      'Path=/',
      'Max-Age=604800', // 7 hari
      'SameSite=Lax',
      ...(isProd ? ['Secure'] : [])
    ].join('; ');

    res.setHeader('Set-Cookie', cookieFlags);

    res.json({
      data: {
        token,
        user: payload
      },
      meta: {
        serverTime: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    // Bersihkan cookie sesi
    const clearCookieFlags = [
      'salam_token=',
      'HttpOnly',
      'Path=/',
      'Max-Age=0',
      'SameSite=Lax'
    ].join('; ');

    res.setHeader('Set-Cookie', clearCookieFlags);

    if (user) {
      // Catat jejak audit keluar sistem
      await db.query(`
        INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, resource, details, ip_address, status)
        VALUES ($1, $2, $3, $4, 'LOGOUT', 'USER_SESSION', $5, $6, 'SUKSES')
      `, [
        `aud-${Date.now()}`,
        user.id,
        user.name,
        user.role,
        `Pengguna ${user.name} (${user.role}) keluar dari sistem.`,
        req.ip || '127.0.0.1'
      ]);
    }

    res.json({
      data: {
        message: 'Anda berhasil keluar dari sistem SALAM.'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sesi tidak ditemukan.' } });
      return;
    }

    const userResult = await db.query(
      'SELECT id, username, name, identity_number, email, role, study_program, avatar_url FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'Pengguna tidak ditemukan.' } });
      return;
    }

    res.json({
      data: userResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

export async function switchRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetRole } = req.body;

    const userResult = await db.query(
      'SELECT id, username, name, identity_number, email, role, study_program FROM users WHERE role = $1 LIMIT 1',
      [targetRole]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: { code: 'ROLE_USER_NOT_FOUND', message: `Tidak ada pengguna dengan peran ${targetRole}` } });
      return;
    }

    const targetUser = userResult.rows[0];
    const payload = {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      identityNumber: targetUser.identity_number,
      email: targetUser.email,
      role: targetUser.role,
      studyProgram: targetUser.study_program
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });

    const isProd = ENV.NODE_ENV === 'production';
    const cookieFlags = [
      `salam_token=${token}`,
      'HttpOnly',
      'Path=/',
      'Max-Age=604800',
      'SameSite=Lax',
      ...(isProd ? ['Secure'] : [])
    ].join('; ');

    res.setHeader('Set-Cookie', cookieFlags);

    res.json({
      data: {
        token,
        user: payload
      }
    });
  } catch (err) {
    next(err);
  }
}
