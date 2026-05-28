import pino from "pino";
import type { Logger } from "pino";

// Only use pino-pretty in development environment
const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }
    : {}),
});

export type { Logger };

export interface HasLogger {
  logger: Logger;
}
