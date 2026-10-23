import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB, disconnectDB } from './config/db';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Student Attendance Management System Backend Server `);
      console.log(` Listening on: http://localhost:${PORT}             `);
      console.log(` Healthcheck:  http://localhost:${PORT}/api/health  `);
      console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed all connections. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server Start Error]', error);
    process.exit(1);
  }
};

startServer();
