import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, closeRedisConnection } from './config/redis';
import { getCasbinEnforcer } from './config/casbin';
import { config } from './config/environment';
import { logger, logError } from './config/logger';

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    getRedisClient();

    // Initialize CASBIN
    await getCasbinEnforcer();
    
    // Note: Policies should be seeded manually or via a migration script
    // Uncomment to seed default policies:
    // const { seedDefaultPolicies } = await import('../../../../packages/casbin-config/src/seed-policies');
    // await seedDefaultPolicies(enforcer);

    // Start server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📝 API available at http://localhost:${port}${config.apiPrefix}`);
      logger.info(`🏥 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logError(error as Error, 'Bootstrap');
    process.exit(1);
  }
}

// Handle graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    // Close MongoDB connection
    await disconnectDatabase();
    logger.info('✅ MongoDB connection closed');
    
    // Close Redis connection
    await closeRedisConnection();
    logger.info('✅ Redis connection closed');
    
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logError(error, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

bootstrap();
