import { Command } from "commander";
import { log } from "./base/log";
import fs from "fs/promises";

// Initialize command line program
const program = new Command();

/**
 * Function to clear the WWEB cache
 */
async function clearWWeb() {
  try {
    const wwebCachePath = "./.wwebjs_cache";
    try {
      await fs.access(wwebCachePath);
      await fs.rm(wwebCachePath, { recursive: true, force: true });
      log("WhatsApp Web cache cleared.");
    } catch (error) {
      log(`No WhatsApp Web cache found at ${wwebCachePath}`);
    }
  } catch (error) {
    log(`Error clearing cache: ${error.message}`);
  }
}

/**
 * Function to clear the WWEB auth
 */
async function clearWebauth() {
  try {
    const webauthPath = "./.wwebjs_auth";
    try {
      await fs.access(webauthPath);
      await fs.rm(webauthPath, { recursive: true, force: true });
      log("WhatsApp Web authentication cache cleared.");
    } catch (error) {
      log(`No WhatsApp Web authentication cache found at ${webauthPath}`);
    }
  } catch (error) {
    log(`Error clearing auth cache: ${error.message}`);
  }
}

// Set up proper command structure
program
  .name("whatsapp-bot-cli")
  .description("CLI to manage WhatsApp bot")
  .version("1.0.0");

program
  .command("clear:wweb")
  .description("Clear WhatsApp Web cache")
  .action(clearWWeb);

program
  .command("clear:wweb-auth")
  .description("Clear WhatsApp Web authentication cache")
  .action(clearWebauth);

program
  .command("clear:cache")
  .description("Clear bot cache directory")
  .action(() => {
    log("Cache clearing not implemented yet");
  });

// Parse arguments
program.parse();