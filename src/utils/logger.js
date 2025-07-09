// AIDEV-NOTE: Centralized logging utility with production safety
const isDev = import.meta.env?.DEV;

export const logger = {
    log: (...args) => isDev && console.log(...args),
    warn: (...args) => isDev && console.warn(...args),
    error: (...args) => console.error(...args), // Always log errors
    debug: (...args) => isDev && console.debug(...args),
    info: (...args) => isDev && console.info(...args),
    group: (...args) => isDev && console.group(...args),
    groupEnd: () => isDev && console.groupEnd(),
    table: (...args) => isDev && console.table(...args)
};

export default logger;
