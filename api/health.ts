import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_cors.js';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);
  res.json({ status: 'ok', message: 'Server is running' });
}

