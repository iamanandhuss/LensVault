import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, hashPassword, verifyPassword, verifyToken } from './auth';

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';

test('account tokens use the userId claim and verify with the configured secret', () => {
  const token = generateToken('507f1f77bcf86cd799439011');
  assert.equal(verifyToken(token)?.userId, '507f1f77bcf86cd799439011');
  assert.equal(verifyToken(token)?.id, undefined);
});

test('invalid and expired-format tokens are rejected without throwing', () => {
  assert.equal(verifyToken('not-a-token'), null);
});

test('password hashing verifies the original password and rejects a different one', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.notEqual(hash, 'correct horse battery staple');
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('incorrect password', hash), false);
});

test('JWT operations fail closed when the production secret is missing or too short', () => {
  const originalSecret = process.env.JWT_SECRET;
  try {
    process.env.JWT_SECRET = 'short';
    assert.throws(() => generateToken('user-id'), /at least 32 characters/);
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});
