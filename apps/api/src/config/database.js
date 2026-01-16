import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from './logger';
// Connection options for better stability and reliability
const mongooseOptions = {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2, // Minimum number of connections in the pool
    maxIdleTimeMS: 300000, // Close connections after 5 minutes of inactivity (increased from 30s)
    // Timeout settings
    serverSelectionTimeoutMS: 30000, // Timeout for server selection (increased from 5s)
    socketTimeoutMS: 0, // 0 = no timeout (let MongoDB handle it) - prevents premature disconnections
    connectTimeoutMS: 30000, // Timeout for initial connection (increased from 10s)
    // Heartbeat settings
    heartbeatFrequencyMS: 30000, // Send heartbeat every 30 seconds (reduced frequency from 10s)
    // Retry settings
    retryWrites: true, // Retry writes on transient errors
    retryReads: true, // Retry reads on transient errors
    // Auto-reconnect settings
    autoIndex: true, // Build indexes automatically
    autoCreate: false, // Don't auto-create collections
    // Additional stability settings
    bufferCommands: true, // Buffer commands when disconnected
};
let isConnecting = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let eventListenersSetup = false;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000; // 5 seconds
async function reconnect() {
    // Check if already connected or connecting
    if (mongoose.connection.readyState === 1) {
        logger.info('MongoDB already connected, skipping reconnection');
        reconnectAttempts = 0;
        isConnecting = false;
        return;
    }
    // Don't reconnect if already attempting
    if (isConnecting) {
        logger.debug('MongoDB reconnection already in progress, skipping');
        return;
    }
    // Reset attempts if connection state changed (e.g., manually reconnected)
    if (mongoose.connection.readyState === 2) {
        logger.debug('MongoDB is connecting, resetting attempt counter');
        reconnectAttempts = 0;
        isConnecting = false;
        return;
    }
    if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached. Please check MongoDB connection.`);
        isConnecting = false;
        return;
    }
    isConnecting = true;
    reconnectAttempts++;
    logger.warn(`Attempting to reconnect to MongoDB (Attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
    try {
        // Only close if connection is in a disconnected state (0) or closing state (3)
        // Don't close if already disconnected or if connection is in progress
        const readyState = mongoose.connection.readyState;
        if (readyState !== 0 && readyState !== 3) {
            logger.debug(`MongoDB connection state: ${readyState}, skipping close`);
        }
        else if (readyState === 3) {
            // Connection is closing, wait a bit before reconnecting
            logger.debug('MongoDB connection is closing, waiting before reconnect');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Connect (or reconnect if needed)
        await mongoose.connect(config.mongoUri, mongooseOptions);
        reconnectAttempts = 0; // Reset on successful reconnection
        isConnecting = false;
        logger.info('✅ MongoDB reconnected successfully');
    }
    catch (error) {
        logger.error(`❌ MongoDB reconnection attempt ${reconnectAttempts} failed:`, error);
        isConnecting = false;
        if (reconnectAttempts < maxReconnectAttempts) {
            // Exponential backoff: increase delay with each attempt
            const delay = reconnectDelay * Math.min(reconnectAttempts, 3);
            logger.debug(`Retrying reconnection in ${delay}ms...`);
            reconnectTimer = setTimeout(() => {
                reconnect();
            }, delay);
        }
        else {
            logger.error('❌ All reconnection attempts exhausted. MongoDB connection failed.');
        }
    }
}
export async function connectDatabase() {
    try {
        // Set up event listeners only once
        if (!eventListenersSetup) {
            setupEventListeners();
            eventListenersSetup = true;
        }
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            logger.info('MongoDB already connected');
            return;
        }
        // Validate connection string before attempting connection
        if (!config.mongoUri || config.mongoUri === 'mongodb://localhost:27017/euroasiann') {
            logger.warn('⚠️  Using default MongoDB URI. Set MONGODB_URI in .env file for production.');
        }
        // Check if connection string looks like MongoDB Atlas
        const isAtlas = config.mongoUri.includes('mongodb.net') || config.mongoUri.includes('mongodb+srv://');
        if (isAtlas) {
            logger.info('🔗 Connecting to MongoDB Atlas...');
            // Validate Atlas connection string format
            if (!config.mongoUri.match(/mongodb\+srv:\/\/[^:]+:[^@]+@/)) {
                logger.warn('⚠️  MongoDB Atlas connection string may be missing username/password');
            }
        }
        await mongoose.connect(config.mongoUri, mongooseOptions);
        logger.info('✅ MongoDB connected successfully');
        reconnectAttempts = 0; // Reset on successful connection
    }
    catch (error) {
        // Provide helpful error messages for common issues
        if (error?.code === 8000 || error?.codeName === 'AtlasError' || error?.message?.includes('bad auth')) {
            logger.error('❌ MongoDB Atlas Authentication Failed');
            logger.error('💡 Common fixes:');
            logger.error('   1. Check username and password in MONGODB_URI');
            logger.error('   2. URL-encode special characters in password (e.g., @ becomes %40)');
            logger.error('   3. Verify IP address is whitelisted in MongoDB Atlas Network Access');
            logger.error('   4. Ensure database user exists and has proper permissions');
            logger.error('   5. Check connection string format: mongodb+srv://username:password@cluster.mongodb.net/database');
            // Mask password in error message for security
            const maskedUri = config.mongoUri?.replace(/:([^:@]+)@/, ':****@') || 'N/A';
            logger.error(`   Connection string: ${maskedUri}`);
        }
        else if (error?.message?.includes('ENOTFOUND') || error?.message?.includes('getaddrinfo')) {
            logger.error('❌ MongoDB Host Not Found');
            logger.error('💡 Check if:');
            logger.error('   1. MongoDB Atlas cluster is running');
            logger.error('   2. Connection string hostname is correct');
            logger.error('   3. Internet connection is active');
        }
        else if (error?.message?.includes('timeout')) {
            logger.error('❌ MongoDB Connection Timeout');
            logger.error('💡 Check if:');
            logger.error('   1. IP address is whitelisted in MongoDB Atlas');
            logger.error('   2. Firewall is blocking the connection');
            logger.error('   3. MongoDB Atlas cluster is accessible');
        }
        logger.error('❌ MongoDB initial connection error:', error);
        throw error;
    }
}
function setupEventListeners() {
    // Remove existing listeners to avoid duplicates
    mongoose.connection.removeAllListeners();
    // Connection error handler (handled separately below to catch auth errors)
    // Disconnection handler with auto-reconnect
    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected - attempting to reconnect...');
        // Only attempt reconnection if:
        // 1. Not already connecting
        // 2. Haven't exceeded max attempts
        // 3. Connection is actually disconnected (readyState === 0)
        const readyState = mongoose.connection.readyState;
        if (readyState === 0 && !isConnecting && reconnectAttempts < maxReconnectAttempts) {
            // Clear any existing reconnect timer
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            // Add a small delay to prevent rapid reconnection attempts
            // This gives MongoDB time to fully close the connection
            reconnectTimer = setTimeout(() => {
                reconnect();
            }, reconnectDelay);
        }
        else if (readyState !== 0) {
            logger.debug(`MongoDB disconnected event received but readyState is ${readyState}, skipping reconnect`);
        }
    });
    // Handle authentication errors separately - don't retry as they won't fix themselves
    mongoose.connection.on('error', (err) => {
        if (err?.code === 8000 || err?.codeName === 'AtlasError' || err?.message?.includes('bad auth')) {
            logger.error('❌ MongoDB Authentication Error - Stopping reconnection attempts');
            logger.error('💡 Please fix authentication issues (see error details above) before retrying');
            // Stop reconnection attempts for auth errors
            isConnecting = false;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            reconnectAttempts = maxReconnectAttempts; // Prevent further attempts
        }
        else {
            logger.error('MongoDB connection error:', err);
            isConnecting = false;
        }
    });
    // Connected handler
    mongoose.connection.on('connected', () => {
        logger.info('✅ MongoDB connected');
        reconnectAttempts = 0;
        isConnecting = false;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    });
    // Reconnected handler
    mongoose.connection.on('reconnected', () => {
        logger.info('✅ MongoDB reconnected');
        reconnectAttempts = 0;
        isConnecting = false;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    });
    // Connection timeout handler
    mongoose.connection.on('timeout', () => {
        logger.warn('MongoDB connection timeout');
    });
    // Close handler
    mongoose.connection.on('close', () => {
        logger.warn('MongoDB connection closed');
        isConnecting = false;
    });
}
// Graceful shutdown function
export async function disconnectDatabase() {
    try {
        // Clear any pending reconnection attempts
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        // Reset connection state
        isConnecting = false;
        reconnectAttempts = 0;
        // Close the connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        logger.info('✅ MongoDB disconnected gracefully');
    }
    catch (error) {
        logger.error('❌ Error disconnecting from MongoDB:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map