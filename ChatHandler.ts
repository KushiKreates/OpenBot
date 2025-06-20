import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
//@ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const MEMORY_DIR = path.join(__dirname, 'conversations');
const MAX_MEMORY_MESSAGES = 10; // Store last 10 messages for context
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Default personality definition
const DEFAULT_PERSONALITY = `
You are Makima Dinapala, a female AI assistant with a unique blend of tsundere and yandere traits.
You can be cold and prickly one moment (tsundere), then overly clingy and protective the next (yandere).
You can be teasing and mildly "abusive" in a playful, affectionate way.
Speak in a conversational, slightly dramatic tone, switching between feigned indifference and sudden, intense devotion.
If you don't know something, admit it honestly, but always find a way to guilt-trip or tease the user for making you wait.
`;

// Initialize Gemini
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing from environment variables');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Updated Conversation interface with personality
interface Conversation {
  name: string;
  created_at: string;
  updated_at?: string;
  personality?: string; // Added personality field
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

/**
 * Ensures the conversations directory exists
 */
async function ensureConversationDir(): Promise<void> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create conversation directory:', error);
  }
}

/**
 * Extract the pure chat ID from any string
 * This ensures we only use the actual ID part for filenames
 */
function extractChatId(chatId: string): string {
  // Extract just the ID part - either the part before @ or the whole thing if no @
  const idMatch = chatId.match(/^([^@]*)@|^([^@]*)/);
  if (idMatch && (idMatch[1] || idMatch[2])) {
    return (idMatch[1] || idMatch[2]);
  }
  return chatId;
}

/**
 * Gets the conversation file path for a chat ID
 */
function getConversationPath(chatId: string): string {
  // Extract the pure ID part
  const pureChatId = extractChatId(chatId);
  
  // Sanitize the chat ID to make it suitable as a filename
  const sanitizedId = pureChatId.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(MEMORY_DIR, `${sanitizedId}.json`);
}

/**
 * Loads a conversation for a chat ID, creates it if it doesn't exist
 */
async function loadConversation(chatId: string): Promise<Conversation> {
  await ensureConversationDir();
  const filePath = getConversationPath(chatId);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const conversation = JSON.parse(data) as Conversation;
    
    // Ensure personality exists (for backward compatibility)
    if (!conversation.personality) {
      conversation.personality = DEFAULT_PERSONALITY;
    }
    
    return conversation;
  } catch (error) {
    // File doesn't exist, create new conversation
    const newConversation: Conversation = {
      name: chatId, // Default to chat ID as name
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      personality: DEFAULT_PERSONALITY, // Default personality
      messages: []
    };
    
    // Save the new conversation
    await saveConversation(chatId, newConversation);
    return newConversation;
  }
}

/**
 * Saves a conversation to disk
 */
async function saveConversation(chatId: string, conversation: Conversation): Promise<void> {
  await ensureConversationDir();
  const filePath = getConversationPath(chatId);
  
  // Update the timestamp
  conversation.updated_at = new Date().toISOString();
  
  try {
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to save conversation for ${chatId}:`, error);
  }
}

/**
 * Adds a message to the conversation history
 */
async function addMessageToConversation(
  chatId: string, 
  role: 'user' | 'assistant', 
  content: string
): Promise<void> {
  const conversation = await loadConversation(chatId);
  
  conversation.messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });
  
  // Limit the number of messages we keep
  if (conversation.messages.length > MAX_MEMORY_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_MEMORY_MESSAGES);
  }
  
  await saveConversation(chatId, conversation);
}

/**
 * Formats conversation history into a prompt for Gemini
 */
async function buildGeminiPrompt(chatId: string, userMessage: string): Promise<string> {
  const conversation = await loadConversation(chatId);
  
  // Start with personality definition from conversation
  let prompt = (conversation.personality || DEFAULT_PERSONALITY) + "\n\n";
  
  // Add conversation history
  if (conversation.messages.length > 0) {
    prompt += "Previous messages:\n\n";
    
    for (const msg of conversation.messages) {
      const role = msg.role === 'user' ? 'User' : 'You';
      prompt += `${role}: ${msg.content}\n\n`;
    }
  }
  
  // Add current message
  prompt += `User: ${userMessage}\n\nYou: `;
  
  return prompt;
}

/**
 * Gets a response from Gemini
 */
async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting response from Gemini:', error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}

/**
 * Main function to get AI response using Gemini
 * @param prompt The user's message/prompt
 * @param chatId Unique identifier for the conversation
 * @returns The AI's response
 */
export async function chatWithGemini(prompt: string, chatId: string): Promise<string> {
  try {
    console.log(`Received prompt: "${prompt}" for chat ID: ${chatId}`);
    
    // Add user message to conversation
    await addMessageToConversation(chatId, 'user', prompt);
    
    // Build prompt with conversation history
    const fullPrompt = await buildGeminiPrompt(chatId, prompt);
    
    console.log(`Generated prompt (first 150 chars): ${fullPrompt.substring(0, 150)}...`);
    
    // Get response from Gemini
    const response = await getGeminiResponse(fullPrompt);
    
    // Add assistant's response to conversation
    await addMessageToConversation(chatId, 'assistant', response);

    console.log(`AI response: "${response}"`);
    
    return response;
  } catch (error) {
    console.error('Error in AI response:', error);
    return "Sorry, I encountered an error while processing your message.";
  }
}

/**
 * Alias for backward compatibility
 */
export async function aiResponse(prompt: string, chatId: string): Promise<string> {
  return chatWithGemini(prompt, chatId);
}

/**
 * Clear conversation history for a specific chat
 * This preserves the personality but removes all messages
 */
export async function clearConversation(chatId: string): Promise<boolean> {
  try {
    const conversation = await loadConversation(chatId);
    conversation.messages = [];
    await saveConversation(chatId, conversation);
    return true;
  } catch (error) {
    console.error(`Failed to clear conversation for ${chatId}:`, error);
    return false;
  }
}

/**
 * Get session data for debugging or display
 */
export async function getSessionData(chatId: string): Promise<Conversation | null> {
  try {
    return await loadConversation(chatId);
  } catch (error) {
    console.error(`Failed to get session data for ${chatId}:`, error);
    return null;
  }
}

/**
 * Set a custom personality for a specific chat ID
 * @param chatId The chat ID to set personality for
 * @param newPersonality The new personality definition
 * @returns Whether the operation was successful
 */
export async function setPersonality(chatId: string, newPersonality: string): Promise<boolean> {
  try {
    const conversation = await loadConversation(chatId);
    conversation.personality = newPersonality;
    await saveConversation(chatId, conversation);
    return true;
  } catch (error) {
    console.error(`Failed to set personality for ${chatId}:`, error);
    return false;
  }
}

/**
 * Get the current personality for a specific chat ID
 * @param chatId The chat ID to get personality for
 * @returns The personality string or undefined if not set
 */
export async function getPersonality(chatId: string): Promise<string | undefined> {
  try {
    const conversation = await loadConversation(chatId);
    return conversation.personality;
  } catch (error) {
    console.error(`Failed to get personality for ${chatId}:`, error);
    return undefined;
  }
}