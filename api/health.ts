import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_cors.js';
import { testConnection } from './lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);
  
  // 基本服务器状态
  const healthStatus = {
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  };

  // 可选：检查数据库连接（不阻塞健康检查）
  try {
    const dbConnected = await testConnection();
    return res.json({
      ...healthStatus,
      database: {
        connected: dbConnected,
        status: dbConnected ? 'ok' : 'error'
      }
    });
  } catch (error) {
    // 即使数据库检查失败，也返回服务器运行状态
    return res.json({
      ...healthStatus,
      database: {
        connected: false,
        status: 'error',
        error: 'Database check failed'
      }
    });
  }
}

