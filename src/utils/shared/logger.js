import { createLogger, format, transports } from "winston";
import chalk from "chalk";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const { timestamp, combine, printf, json } = format;

/**
 * Winston log format for JSON logs.
 * Logs messages with a timestamp in JSON format.
 */
const jsonLogFormat = combine(
  timestamp(),
  printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }),
  json()
);

/**
 * Winston log format for console logs.
 * Uses Chalk to style log levels for better readability.
 */
const consoleLogFormat = combine(
  timestamp(),
  printf(({ level, message, timestamp }) => {
    const levelStyles = {
      info: chalk.bgGreenBright.black.bold(level.toUpperCase()),
      error: chalk.bgRedBright.black.bold(level.toUpperCase()),
      warn: chalk.bgYellowBright.black.bold(level.toUpperCase()),
      debug: chalk.bgBlueBright.black.bold(level.toUpperCase()),
    };

    if (typeof message === "object") {
      try {
        message = JSON.stringify(message, null, 2);
      } catch (_error) {
        message =
          "[Circular Reference Error] Unable to stringify object. Please see log file.";
      }
    }

    const styledLevel = levelStyles[level] || level.toUpperCase();
    const styledTimestamp = chalk.gray(`[${timestamp}]`);

    return `${styledTimestamp} ${styledLevel}: ${message}`;
  })
);

/**
 * List of Winston transports for logging.
 * Logs to console and optionally to a file in development.
 */
const transportsList = [
  new transports.Console({
    format: consoleLogFormat,
  }),
];

if (process.env.NODE_ENV === "development") {
  transportsList.push(
    new transports.File({
      filename: "logs/app.log",
      format: jsonLogFormat,
    })
  );
}

/**
 * Winston logger instance for application-wide logging.
 */
const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(timestamp()),
  transports: transportsList,
});

/**
 * Handles uncaught exceptions and logs the error.
 */
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});

/**
 * Handles unhandled promise rejections and logs the error.
 */
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

export default logger;
