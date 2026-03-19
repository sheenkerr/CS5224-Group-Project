// ANSI colour codes
const BLUE = "\x1b[34m";   // INFO
const GREEN = "\x1b[32m";   // DEBUG
const YELLOW = "\x1b[33m";   // WARN
const RED = "\x1b[31m";   // ERROR
const RESET = "\x1b[0m";

function timestamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function formatLine(
    colour: string,
    level: string,
    context: string,
    message: string
): string {
    return (
        `${colour}[${level}] ${RESET}` +
        `${context} ` +
        `${timestamp()} ` +
        `${message}`
    );
}

/**
 * Creates a named logger instance.
 */
export function createLogger(context: string) {
    return {
        info(message: string): void {
            console.log(formatLine(BLUE, "INFO", context, message));
        },
        debug(message: string): void {
            console.log(formatLine(GREEN, "DEBUG", context, message));
        },
        warn(message: string): void {
            console.warn(formatLine(YELLOW, "WARN", context, message));
        },
        error(message: string, err?: unknown): void {
            console.error(formatLine(RED, "ERROR", context, message));
            if (err !== undefined) {
                console.error(err);
            }
        },
    };
}
