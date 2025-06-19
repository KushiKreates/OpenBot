import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Logo command
 * Generates a custom logo-styled image with two text inputs
 * Preserves transparency in the output image
 */
export default {
  name: 'ph',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat object
      const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Check for appropriate arguments
      if (args.length < 2) {
        return message.reply('Usage: !ph [first text] [second text]\nExample: !ph Hello World');
      }
      
      // Split the arguments into two parts
      const firstText = args[0];
      const secondText = args.slice(1).join(' ');
      
      // Basic content filtering
      const inappropriateContent = containsInappropriateContent(firstText) || 
                                  containsInappropriateContent(secondText);
      
      if (inappropriateContent) {
        return message.reply('I cannot generate images with inappropriate content.');
      }
      
      // Create the API URL with encoded parameters
      const apiUrl = `https://api.alexflipnote.dev/pornhub?text=${encodeURIComponent(firstText)}&text2=${encodeURIComponent(secondText)}`;
      
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
      const media = new MessageMedia('image/png', mediaData, 'logo.png');
      
      // Send as regular media (not sticker) to preserve transparency
      await message.reply(media);
      
    } catch (error) {
      console.error('Error generating logo:', error);
      await message.reply('Sorry, something went wrong generating your logo image.');
    }
  }
};

/**
 * Basic check for inappropriate content
 * This is a simple implementation - consider using a more robust solution
 */
function containsInappropriateContent(text: string): boolean {
  const inappropriateTerms = [
    // Add terms that shouldn't be allowed in the generated images
    'nsfw',
    'explicit',
    // Add other terms to filter
  ];
  
  const lowercaseText = text.toLowerCase();
  return inappropriateTerms.some(term => lowercaseText.includes(term));
}