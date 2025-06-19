/**
 * My second try at a good whatsapp bot
 * This bot is made for me and my friends :D
 */

import { existsSync } from "fs";
import { log } from "./base/log";
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import { loadAllCommands, processMessage, setupCommandWatcher } from "./commandHandler";
import { jobManager } from "./Jobs/jobManager";

async function initialize() {
        await loadAllCommands();
        setupCommandWatcher();
        log('Bot initialized with dynamic command loading');
}


async function main(): Promise<void> {
    console.log('Running Preflights for bot.')

    // Check for Cache Directory

    if (!existsSync('./cache')) {
        log('Cache directory does not exist, creating it now.')
        await fs.promises.mkdir('./cache', { recursive: true });
    } else {
        log('Cache directory exists, skipping creation.')
    }

    log('Initializing Commands ');
    initialize().catch(error => {
    log(`Error loading commands ${error}`);
    });

    log('Creating WhatsApp Client with LocalAuth.');

    const client = new Client({
        authStrategy: new LocalAuth(), // Saves session data to disk
        
        puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--log-level=3",
            "--no-default-browser-check",
            "--disable-site-isolation-trials",
            "--no-experiments",
            "--ignore-gpu-blacklist",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
            "--enable-gpu",
            "--disable-default-apps",
            "--enable-features=NetworkService",
            "--disable-webgl",
            "--disable-threaded-animation",
            "--disable-threaded-scrolling",
            "--disable-in-process-stack-traces",
            "--disable-histogram-customizer",
            "--disable-gl-extensions",
            "--disable-composited-antialiasing",
            "--disable-canvas-aa",
            "--disable-3d-apis",
            "--disable-accelerated-2d-canvas",
            "--disable-accelerated-jpeg-decoding",
            "--disable-accelerated-mjpeg-decode",
            "--disable-app-list-dismiss-on-blur",
            "--disable-accelerated-video-decode"
        ]
    }
    });

    client.on('qr', (qr: string) => {
    log('QR Code received. Scan with WhatsApp to log in:');
    qrcode.generate(qr, { small: true });
    });

    // Handle authentication
    client.on('authenticated', () => {
        console.log('Authentication successful!');
    });

    client.on('auth_failure', (error) => {
        console.error('Authentication failed:', error);
    });

    jobManager.on('jobComplete', async (job) => {
    log(`Job ${job.id} completed, sending notification...`);
  
    if (job.data?.chatId && job.data?.reminderText) {
        try {
        const chat = await client.getChatById(job.data.chatId);
        await chat.sendMessage(`⏰ *REMINDER:* ${job.data.reminderText}`);
        } catch (error) {
        console.error(`Failed to send reminder for job ${job.id}:`, error);
        }
    }
    });

    client.on('message', async (message: Message) => {
        console.log(`Message received: ${message.body}`);

        await processMessage(message);

        
    });

    await client.initialize();









        

 
}


// Run the main function with Preflights 

main().then(() => {
    log('Preflights completed successfully, starting bot now.')
}).catch((error) => {
    log(`An error occurred during preflights: ${error}`);
    process.exit(1);
});
    
