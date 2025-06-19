/**
 * 
 * @param message The message to log
 * This function logs a message with a timestap to the console.
 */

export function log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}