import { jest, it, describe, expect, beforeEach } from '@jest/globals';

const mockIsUserVerified = jest.fn();

jest.unstable_mockModule('#services/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    isUserVerified: mockIsUserVerified,
  })),
}));
const { isAuth, isVerified, containsPassword } = await import(
  '#middleware/auth.middleware'
);

describe('User is authenticated', () => {
  it('should call next() if user is authenticated', () => {
    const req = {
      session: {
        user: { id: 123 },
      },
    };
    const res = {};
    const next = jest.fn();

    isAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('should return 401 if user is not authenticated', () => {
    const req = {
      session: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    isAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'You must be logged in to access this resource.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('User is verified', () => {
  beforeEach(() => {
    mockIsUserVerified.mockReset();
  });

  it('should call next() if user is verified', async () => {
    mockIsUserVerified.mockResolvedValue(true);

    const req = { session: { user: { id: 1 } } };
    const res = mockRes();
    const next = jest.fn();

    await isVerified(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not verified', async () => {
    mockIsUserVerified.mockResolvedValue(false);
    const req = { session: { user: { id: 1 } } };
    const res = mockRes();
    const next = jest.fn();

    await isVerified(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Your account must be verified to send create a new list.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Contains Password', () => {
  it('returns 422 if password is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    containsPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if password is present', () => {
    const req = { body: { password: 'password' } };
    const res = mockRes();
    const next = jest.fn();

    containsPassword(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
