import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Supreme command
 * Generates text in the style of the Supreme logo with transparency
 */
export default {
  name: 'super',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat object
      const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Check for text input
      if (args.length === 0) {
        return message.reply('Usage: !supreme [text]\nExample: !supreme Cool Text');
      }
      
      // Join all arguments as the text
      const text = args.join(' ');
      
      // Basic content filtering
      if (containsInappropriateContent(text)) {
        return message.reply('I cannot generate images with inappropriate content.');
      }
      
      // Create the API URL with encoded parameter
      const apiUrl = `https://api.alexflipnote.dev/supreme?text=${encodeURIComponent(text)}`;
      
      // Download the generated image
      const mediaResponse = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/png' // Explicitly request PNG format
        }
      });
      
      // Convert to base64 for WhatsApp media
      const mediaData = Buffer.from(mediaResponse.data).toString('base64');
      
      // Create a MessageMedia object with PNG mime type to preserve transparency
      const media = new MessageMedia('image/png', mediaData, 'supreme.png');
      
      // Send as regular media to preserve transparency
      await message.reply(media);
      
    } catch (error) {
      console.error('Error generating Supreme logo:', error);
      await message.reply('Sorry, something went wrong generating your Supreme logo.');
    }
  }
};

/**
 * Basic check for inappropriate content
 */
function containsInappropriateContent(text: string): boolean {
  const inappropriateTerms = [
    'nsfw',
    'explicit',
    // Add other terms to filter
  ];
  
  const lowercaseText = text.toLowerCase();
  return inappropriateTerms.some(term => lowercaseText.includes(term));
}