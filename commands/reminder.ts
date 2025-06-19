import { Message } from 'whatsapp-web.js';
import { jobManager, Job } from '../Jobs/jobManager';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid @types/uuid

/**
 * Remind command
 * Sets a reminder that will notify the user after the specified time
 */
export default {
  name: 'remind',
  async execute(message: Message, args: string[]) {
    try {
      if (args.length < 2) {
        return message.reply('Usage: !remind <time> <message>\n' +
          'Examples:\n' +
          '!remind 30s Take out the trash\n' +
          '!remind 5m Call mom\n' +
          '!remind 2h Meeting with team\n' +
          '!remind 1d Check project status');
      }
      
      const timeStr = args[0].toLowerCase();
      const reminderText = args.slice(1).join(' ');
      
      // Parse the time string (e.g., 30s, 5m, 2h, 1d)
      const timeValue = parseInt(timeStr);
      const timeUnit = timeStr.replace(/[0-9]/g, '');
      
      if (isNaN(timeValue) || timeValue <= 0) {
        return message.reply('Invalid time format. Please specify a positive number followed by s (seconds), m (minutes), h (hours), or d (days).');
      }
      
      // Calculate the execution time
      let milliseconds = 0;
      switch (timeUnit) {
        case 's':
          milliseconds = timeValue * 1000;
          break;
        case 'm':
          milliseconds = timeValue * 60 * 1000;
          break;
        case 'h':
          milliseconds = timeValue * 60 * 60 * 1000;
          break;
        case 'd':
          milliseconds = timeValue * 24 * 60 * 60 * 1000;
          break;
        default:
          return message.reply('Invalid time unit. Please use s (seconds), m (minutes), h (hours), or d (days).');
      }
      
      const executionTime = Date.now() + milliseconds;
      const userId = message.from;
      const jobId = `remind_${uuidv4()}`;
      
      // Create the reminder job
      await jobManager.createJob(jobId, userId, executionTime, {
        reminderText,
        chatId: message.from
      });
      
      // Format a human-readable time
      const readableTime = formatTimeString(milliseconds);
      
      await message.reply(`✅ Reminder set! I'll remind you about "${reminderText}" in ${readableTime}.`);
      
    } catch (error) {
      console.error('Error setting reminder:', error);
      await message.reply('Sorry, something went wrong setting your reminder.');
    }
  }
};

/**
 * Format milliseconds into a human-readable string
 */
function formatTimeString(milliseconds: number): string {
  if (milliseconds < 60000) {
    // Less than a minute
    return `${Math.round(milliseconds / 1000)} seconds`;
  } else if (milliseconds < 3600000) {
    // Less than an hour
    return `${Math.round(milliseconds / 60000)} minutes`;
  } else if (milliseconds < 86400000) {
    // Less than a day
    return `${Math.round(milliseconds / 3600000)} hours`;
  } else {
    // Days
    return `${Math.round(milliseconds / 86400000)} days`;
  }
}