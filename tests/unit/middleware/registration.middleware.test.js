import { jest, it, describe, expect } from '@jest/globals';
import {
  containsEmail,
  containsFirstName,
  containsLastName,
  containsUsername,
  isEmailValid,
  isPasswordValid,
} from '#middleware/registration.middleware';
import {
  emailRequirements,
  passwordRequirements,
  usernameRequirements,
} from '#utilities/regex-patterns';
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};
describe('Contains first Name', () => {
  it('returns 422 if firstName is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    containsFirstName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'First Name is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if firstName is present', () => {
    const req = { body: { firstName: 'John' } };
    const res = mockRes();
    const next = jest.fn();

    containsFirstName(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Contains last Name', () => {
  it('returns 422 if lastName is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    containsLastName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Last Name is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if lastName is present', () => {
    const req = { body: { lastName: 'Doe' } };
    const res = mockRes();
    const next = jest.fn();

    containsLastName(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Contains Username', () => {
  it('returns 422 if username is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    containsUsername(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Username is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('returns 422 if username is invalid', () => {
    const req = { body: { username: 'invalid username' } };
    const res = mockRes();
    const next = jest.fn();

    containsUsername(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: usernameRequirements,
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if valid username is present', () => {
    const req = { body: { username: 'johndoe' } };
    const res = mockRes();
    const next = jest.fn();

    containsUsername(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Contains email', () => {
  it('returns 422 if email is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    containsEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if email is present', () => {
    const req = { body: { email: 'mail@example.com' } };
    const res = mockRes();
    const next = jest.fn();

    containsEmail(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Valid email', () => {
  it('returns 422 if email is invalid', () => {
    const req = { body: { email: 'invalid-email' } };
    const res = mockRes();
    const next = jest.fn();

    isEmailValid(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: emailRequirements,
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if email is valid', () => {
    const req = { body: { email: 'mail@example.com' } };
    const res = mockRes();
    const next = jest.fn();

    isEmailValid(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Password requirements', () => {
  it('returns 422 if password is invalid', () => {
    const req = { body: { password: 'short' } };
    const res = mockRes();
    const next = jest.fn();
    isPasswordValid(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: passwordRequirements,
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('it returns 422 if password is greater than 72 bytes', () => {
    const longPassword = 'a'.repeat(73);
    const req = { body: { password: longPassword } };
    const res = mockRes();
    const next = jest.fn();
    isPasswordValid(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must be 72 bytes or fewer.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  it('calls next if password is valid', () => {
    const req = { body: { password: 'ValidPass123!' } };
    const res = mockRes();
    const next = jest.fn();

    isPasswordValid(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
