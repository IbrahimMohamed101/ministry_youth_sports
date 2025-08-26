const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;
const path = require('path');

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    const log = `${timestamp} ${level}: ${stack || message}`;
    return log;
});

// Create logger instance
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        align(),
        logFormat
    ),
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new transports.File({ 
            filename: path.join(__dirname, '../../logs/error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to `combined.log`
        new transports.File({ 
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.errors({ stack: true }),
            align(),
            logFormat
        )
    }));
}

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
        logger.info(message.trim());
    }
};

module.exports = logger;
