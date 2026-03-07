import { Response } from 'express';

export const ok = <T = unknown>(res: Response, data?: T) =>
  res.status(200).json(data ?? {});

export const created = <T = unknown>(res: Response, data?: T) =>
  res.status(201).json(data ?? {});

export const noContent = (res: Response) => res.status(204).send();

export const badRequest = (res: Response, message: string) =>
  res.status(400).json({ message });

export const unauthorized = (res: Response, message = 'Unauthorized') =>
  res.status(401).json({ message });

export const forbidden = (res: Response, message = 'Forbidden') =>
  res.status(403).json({ message });

export const notFound = (res: Response, message = 'Not found') =>
  res.status(404).json({ message });

export const conflict = (res: Response, message: string) =>
  res.status(409).json({ message });

export const unprocessable = (res: Response, message: string) =>
  res.status(422).json({ message });

export const serverError = (res: Response, message = 'Internal server error') =>
  res.status(500).json({ message });
