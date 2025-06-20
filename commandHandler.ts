import { Message } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { aiResponse } from './ChatHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Command {
  name: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

const prefix = '!';
const commands = new Map<string, Command>();
const commandsPath = path.join(__dirname, 'commands');

/**
 * Actually effective command loader that uses file content hashes to track changes
 * and forces module reloading when content changes
 */
const commandVersions = new Map<string, string>();

// Get file content hash to detect actual changes
function getFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return Buffer.from(content).toString('base64').slice(0, 20); // Use first 20 chars as fingerprint
  } catch (error) {
    return 'error-reading-file';
  }
}

// Check if command has actually changed
function hasCommandChanged(commandName: string, filePath: string): boolean {
  const newHash = getFileHash(filePath);
  const oldHash = commandVersions.get(commandName);
  
  if (newHash !== oldHash) {
    console.log(`Command ${commandName} content changed: ${oldHash} -> ${newHash}`);
    commandVersions.set(commandName, newHash);
    return true;
  }
  
  console.log(`Command ${commandName} unchanged (hash: ${newHash})`);
  return false;
}

// Load a command from its module file
export async function loadCommand(commandName: string, force = false): Promise<boolean> {
  const extensions = ['.js', '.ts'];
  
  for (const ext of extensions) {
    const filePath = path.join(commandsPath, `${commandName}${ext}`);
    if (fs.existsSync(filePath)) {
      // Only reload if the file content has changed or force=true
      if (!force && !hasCommandChanged(commandName, filePath)) {
        console.log(`Skipping reload of unchanged command: ${commandName}`);
        return true;
      }
      
      try {
        console.log(`FORCE RELOADING command: ${commandName}`);
        
        // Completely bypass module cache using a temporary file
        const tempDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create a temporary copy with a unique name
        const tempFile = path.join(tempDir, `${commandName}_${Date.now()}${ext}`);
        fs.copyFileSync(filePath, tempFile);
        
        // Import from the temporary file
        const importPath = `file://${tempFile}`;
        const commandModule = await import(importPath);
        
        if (commandModule.default && commandModule.default.name) {
          commands.set(commandModule.default.name, commandModule.default);
          console.log(`✅ Successfully loaded command: ${commandModule.default.name} (${new Date().toISOString()})`);
          
          // Clean up the temp file after a delay
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFile);
            } catch (e) {
              // Ignore errors during cleanup
            }
          }, 1000);
          
          return true;
        } else {
          console.error(`Invalid command module structure in ${commandName}`);
        }
      } catch (error) {
        console.error(`Error loading command ${commandName}:`, error);
      }
      break;
    }
  }
  
  return false;
}

export async function loadAllCommands(): Promise<void> {
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log(`Created commands directory: ${commandsPath}`);
  }
  
  // Create temp directory if needed
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') || file.endsWith('.ts')
  );

  // Clear existing commands
  commands.clear();
  
  // Load each command
  for (const file of commandFiles) {
    const commandName = path.basename(file).split('.')[0];
    await loadCommand(commandName, true); // Force reload all
  }
  
  console.log(`Loaded ${commands.size} commands: ${Array.from(commands.keys()).join(', ')}`);
}

/**
 * Handle messages that aren't commands
 * This is a placeholder that will be replaced with actual chat handler
 */
export async function handleChat(message: Message): Promise<void> {
  const chatId = message.from;
  const userText = message.body;
  
   const chat = await message.getChat();
    await chat.sendStateTyping();
    
    // Get AI response using our service
    const response = await aiResponse(userText, chatId);
    
    // Send response
    await message.reply(response);

  
}

export async function processMessage(message: Message): Promise<void> {
  // If message doesn't start with prefix, send to chat handler
  if (!message.body.startsWith(prefix)) {
    await handleChat(message);
    return;
  }

  const args = message.body.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) {
    // Empty command (just prefix), send to chat handler
    await handleChat(message);
    return;
  }

  // Special reload command
  if (commandName === 'reload') {
    const targetCommand = args[0];
    
    if (!targetCommand) {
      await message.reply('Reloading all commands...');
      await loadAllCommands();
      await message.reply(`Reloaded ${commands.size} commands: ${Array.from(commands.keys()).join(', ')}`);
      return;
    }
    
    await message.reply(`Reloading command: ${targetCommand}`);
    const success = await loadCommand(targetCommand, true); // Force reload
    
    if (success) {
      await message.reply(`Command "${targetCommand}" reloaded successfully`);
    } else {
      await message.reply(`Failed to reload "${targetCommand}" - command file not found`);
    }
    return;
  }

  // Regular command execution
  const command = commands.get(commandName);
  if (!command) {
    console.log(`Command not found: ${commandName}`);
    
    // Command not found, pass to chat handler
    await handleChat(message);
    return;
  }

  try {
    console.log(`Executing command: ${commandName}`);
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing command '${commandName}':`, error);
    await message.reply('There was an error executing that command!');
  }
}

export function setupCommandWatcher(): void {
  fs.watch(commandsPath, async (eventType, filename) => {
    if (!filename) return;
    
    if (filename.endsWith('.js') || filename.endsWith('.ts')) {
      const commandName = path.basename(filename).split('.')[0];
      console.log(`Detected ${eventType} in ${filename}, reloading command ${commandName}...`);
      
      // Introduce a small delay to ensure file writing is complete
      setTimeout(async () => {
        const success = await loadCommand(commandName, true); // Force reload
        if (success) {
          console.log(`✅ Auto-reloaded command: ${commandName}`);
        } else {
          console.error(`❌ Failed to auto-reload command: ${commandName}`);
        }
      }, 200);
    }
  });
  
  console.log(`Watching for changes in ${commandsPath}`);
}