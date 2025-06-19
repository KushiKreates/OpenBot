import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Interface for the Meme API response
 */
interface MemeResponse {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
}

/**
 * Halal command
 * Fetches a random meme from r/Izlam and sends it as a sticker
 */

export default {
  name: 'halal',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat for typing indicator
      const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Fetch a random halal meme from r/Izlam
      const response = await axios.get<MemeResponse>('https://meme-api.com/gimme/Izlam');
      const memeData = response.data;
      
      // Check if the meme is appropriate (not NSFW)
      if (memeData.nsfw) {
        return message.reply('AMERICAN PIG CONTENT. Astaghfirullah brother/sister! 🙏');
      }
      
      // Download the image
      const imageResponse = await axios.get(memeData.url, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64 for WhatsApp media
      const mediaData = Buffer.from(imageResponse.data).toString('base64');
      
      // Create a MessageMedia object
      const media = new MessageMedia(
        memeData.url.endsWith('.png') ? 'image/png' : 'image/jpeg', 
        mediaData, 
        'halal_meme.jpg'
      );
      
      // Send as sticker with caption in the message
      await message.reply(media, undefined, {
        sendMediaAsSticker: true,
        stickerAuthor: "Halal Memes Bot",
        stickerName: memeData.title.substring(0, 30) // Trim title to reasonable length
      });
      
      // Send the title separately so people know what the meme is about
      //await message.reply(`*${memeData.title}*\n👍 ${memeData.ups} upvotes • by u/${memeData.author}`);
      
    } catch (error) {
      console.error('Error fetching halal meme:', error);
      await message.reply('Sorry, couldn\'t fetch a halal meme right now. Try again later, insha\'Allah.');
    }
  }
};