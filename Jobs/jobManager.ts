import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 
 * Later add function to delete the Job file from json storage / cache
 */

/**
 * Job interface defining the structure of a job
 */
export interface Job {
  id: string;       // Unique identifier for the job
  userId: string;   // User who created the job
  time: number;     // Timestamp when job should execute
  setAt: number;    // Timestamp when job was created
  data?: any;       // Any additional data for the job
  completed?: boolean; // Whether this job has been completed
}

/**
 * Type for job completion event handler
 */
export type JobCompletionHandler = (job: Job) => Promise<void>;

/**
 * JobManager - Handles creating, retrieving, and managing jobs
 */
export class JobManager extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private cachePath: string;
  private checkInterval: NodeJS.Timeout | null = null;
  
  /**
   * Creates a new JobManager
   */
  constructor() {
    super();
    this.cachePath = path.join(__dirname, '..', 'cache', 'jobs');
    this.initialize();
  }
  
  /**
   * Initialize the JobManager
   */
  async initialize(): Promise<void> {
    await this.ensureCacheDirectory();
    await this.loadJobs();
    
    // Start checking for due jobs every second
    this.checkInterval = setInterval(() => {
      this.checkDueJobs();
    }, 1000);
  }
  
  /**
   * Create the cache directory if it doesn't exist
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cachePath, { recursive: true });
    } catch (err) {
      console.error('Failed to create jobs cache directory:', err);
    }
  }
  
  /**
   * Create a new job
   * @param id Unique identifier
   * @param userId User who created the job
   * @param time When the job should execute
   * @param data Additional data for the job
   */
  async createJob(id: string, userId: string, time: number, data?: any): Promise<Job> {
    const job: Job = {
      id,
      userId,
      time,
      setAt: Date.now(),
      data,
      completed: false
    };
    
    this.jobs.set(id, job);
    await this.saveJob(job);
    return job;
  }
  
  /**
   * Get a job by ID
   * @param id Job ID
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get all jobs for a specific user
   * @param userId User ID
   */
  getJobsByUser(userId: string): Job[] {
    return this.getAllJobs().filter(job => job.userId === userId);
  }
  
  /**
   * Delete a job
   * @param id Job ID
   */
  async deleteJob(id: string): Promise<boolean> {
    if (!this.jobs.has(id)) return false;
    
    this.jobs.delete(id);
    
    try {
      const jobPath = path.join(this.cachePath, `${id}.json`);
      await fs.unlink(jobPath);
      return true;
    } catch (err) {
      console.error(`Failed to delete job file ${id}:`, err);
      return false;
    }
  }
  
  /**
   * Save a job to disk
   * @param job Job to save
   */
  private async saveJob(job: Job): Promise<void> {
    try {
      const jobPath = path.join(this.cachePath, `${job.id}.json`);
      await fs.writeFile(jobPath, JSON.stringify(job, null, 2), 'utf8');
    } catch (err) {
      console.error(`Failed to save job ${job.id}:`, err);
    }
  }
  
  /**
   * Mark a job as completed
   * @param id Job ID
   */
  async completeJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;
    
    job.completed = true;
    await this.saveJob(job);
    return true;
  }
  
  /**
   * Load all jobs from disk
   */
  private async loadJobs(): Promise<void> {
    try {
      const files = await fs.readdir(this.cachePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const jobPath = path.join(this.cachePath, file);
            const jobData = await fs.readFile(jobPath, 'utf8');
            const job: Job = JSON.parse(jobData);
            
            // Only load jobs that aren't completed
            if (!job.completed) {
              this.jobs.set(job.id, job);
            }
          } catch (err) {
            console.error(`Failed to read job file ${file}:`, err);
          }
        }
      }
      
      console.log(`Loaded ${this.jobs.size} pending jobs`);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  }
  
  /**
   * Check for jobs that are due for execution
   */
  private checkDueJobs(): void {
    const now = Date.now();
    
    for (const job of this.jobs.values()) {
      // Skip already completed jobs
      if (job.completed) continue;
      
      // If the job's time has passed, emit completion event
      if (job.time <= now) {
        this.emit('jobComplete', job);
        this.completeJob(job.id);
      }
    }
  }
  
  /**
   * Stop the job checker
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create and export the global job manager instance
export const jobManager = new JobManager();