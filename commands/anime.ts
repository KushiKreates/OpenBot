import { Message } from 'whatsapp-web.js';
import axios from 'axios';
import { AnyARecord } from 'node:dns';
import { log } from '../base/log';

interface AnimeResponse {
  data: {
    title: string;
    synopsis: string;
    score: number;
    episodes: number;
    status: string;
    length: number;
  };
}

// Export as default (ES Module style)
export default {
  name: 'anime',
  async execute(message: Message, args: string[]) {
    try {
       const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      if (!args.length) {
        return message.reply('Please provide an anime name to search!');
      }

      const searchQuery = args.join(' ');
      const response = await axios.get<AnimeResponse>(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=1`
      );



      if (!response.data.data.length) {
        return message.reply('No anime found with that name!');
      }

      log(`Found anime: ${response.data}`);

      const anime = response.data.data[0];
      const animeInfo = `*${anime.title}*\n\n` +
        `📝 Synopsis: ${anime.synopsis}\n\n` +
        `⭐ Rating: ${anime.score}\n` +
        `🎬 Episodes: ${anime.episodes}\n` +
        `📺 Status: ${anime.status}`
        + `\n \n Powered by Nadhi.dev ⚙️`;

      await message.reply(animeInfo);
    } catch (error) {
      console.error('Error fetching anime:', error);
      await message.reply('Sorry, there was an error fetching the anime information.');
    }
  }
};