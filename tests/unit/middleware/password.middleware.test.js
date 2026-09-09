import { jest, it, describe, expect } from '@jest/globals';

import Bcrypt from 'bcrypt';

jest.unstable_mockModule('#services/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getCurrentUser: () => Promise.resolve({ email: 'test@example.com' }),
    accountPassword: () => Promise.resolve(Bcrypt.hashSync('password', 4)),
  })),
}));

const { containsNewPassword, matchesAccountPassword } = await import(
  '#middleware/password.middleware'
);
describe('Account Password', () => {
  it("returns 401 if current password doesn't match", async () => {
    const req = {
      body: {
        password: 'wrong-password',
      },
      session: {
        user: {},
      },
    };
    const res = mockRes();
    const next = jest.fn();

    await matchesAccountPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'The password is incorrect. Please try again.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if current password matches', async () => {
    const req = {
      body: {
        password: 'password',
      },
      session: {
        user: {},
      },
    };
    const res = mockRes();
    const next = jest.fn();

    await matchesAccountPassword(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
describe('Contains New Password', () => {
  it('returns 422 if new password is missing', () => {
    const req = {
      body: {},
    };
    const res = mockRes();
    const next = jest.fn();

    containsNewPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'New password is required.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('returns 422 if confirm password is missing', () => {
    const req = {
      body: {
        newPassword: 'password',
      },
    };
    const res = mockRes();
    const next = jest.fn();

    containsNewPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Confirm password is required.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if both new and confirm password are present', () => {
    const req = {
      body: {
        newPassword: 'password',
        confirmPassword: 'confirmPassword',
      },
    };
    const res = mockRes();
    const next = jest.fn();

    containsNewPassword(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
