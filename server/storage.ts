import {
  users,
  uploads,
  jobs,
  results,
  templates,
  campaigns,
  dmQueue,
  usageLog,
  instagramAccounts,
  type User,
  type UpsertUser,
  type Upload,
  type Job,
  type Result,
  type Template,
  type Campaign,
  type DmQueue,
  type UsageLog,
  type InstagramAccount,
  type InsertUpload,
  type InsertJob,
  type InsertResult,
  type InsertTemplate,
  type InsertCampaign,
  type InsertDmQueue,
  type InsertUsageLog,
  type InsertInstagramAccount,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserQuotas(userId: string, dmsUsed: number, extractsUsed: number): Promise<void>;
  resetDailyQuotas(userId: string): Promise<void>;

  // Upload operations
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUploadsByUser(userId: string): Promise<Upload[]>;
  updateUploadStatus(uploadId: string, status: string): Promise<void>;

  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJobsByUser(userId: string): Promise<Job[]>;
  getJobById(jobId: string): Promise<Job | undefined>;
  updateJobProgress(jobId: string, completed: number, failed: number): Promise<void>;
  updateJobStatus(jobId: string, status: string): Promise<void>;

  // Result operations
  createResult(result: InsertResult): Promise<Result>;
  getResultsByJob(jobId: string): Promise<Result[]>;
  getRecentResults(userId: string, limit?: number): Promise<Result[]>;

  // Template operations
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplatesByUser(userId: string): Promise<Template[]>;
  getTemplateById(templateId: string): Promise<Template | undefined>;
  updateTemplate(templateId: string, template: Partial<InsertTemplate>): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;

  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByUser(userId: string): Promise<Campaign[]>;
  getCampaignById(campaignId: string): Promise<Campaign | undefined>;
  updateCampaignStatus(campaignId: string, status: string): Promise<void>;
  updateCampaignProgress(campaignId: string, sent: number, replied: number, interested: number, failed: number): Promise<void>;

  // DM Queue operations
  createDmQueueItem(item: InsertDmQueue): Promise<DmQueue>;
  getDmQueueByCampaign(campaignId: string): Promise<DmQueue[]>;
  updateDmQueueStatus(itemId: string, status: string, errorMessage?: string): Promise<void>;

  // Usage tracking
  createUsageLog(log: InsertUsageLog): Promise<UsageLog>;
  getUsageByUserAndDate(userId: string, date: string): Promise<UsageLog | undefined>;

  // Instagram accounts
  createInstagramAccount(account: InsertInstagramAccount): Promise<InstagramAccount>;
  getInstagramAccountsByUser(userId: string): Promise<InstagramAccount[]>;
  getActiveInstagramAccounts(userId: string): Promise<InstagramAccount[]>;
  updateInstagramAccountSession(accountId: string, sessionData: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserQuotas(userId: string, dmsUsed: number, extractsUsed: number): Promise<void> {
    await db
      .update(users)
      .set({
        dmsUsedToday: sql`${users.dmsUsedToday} + ${dmsUsed}`,
        extractsUsedToday: sql`${users.extractsUsedToday} + ${extractsUsed}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async resetDailyQuotas(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        dmsUsedToday: 0,
        extractsUsedToday: 0,
        lastQuotaReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Upload operations
  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [newUpload] = await db.insert(uploads).values(upload).returning();
    return newUpload;
  }

  async getUploadsByUser(userId: string): Promise<Upload[]> {
    return await db
      .select()
      .from(uploads)
      .where(eq(uploads.userId, userId))
      .orderBy(desc(uploads.createdAt));
  }

  async updateUploadStatus(uploadId: string, status: string): Promise<void> {
    await db
      .update(uploads)
      .set({ status })
      .where(eq(uploads.id, uploadId));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobsByUser(userId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobById(jobId: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    return job;
  }

  async updateJobProgress(jobId: string, completed: number, failed: number): Promise<void> {
    await db
      .update(jobs)
      .set({
        completed,
        failed,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    await db
      .update(jobs)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  // Result operations
  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values(result).returning();
    return newResult;
  }

  async getResultsByJob(jobId: string): Promise<Result[]> {
    return await db
      .select()
      .from(results)
      .where(eq(results.jobId, jobId))
      .orderBy(desc(results.createdAt));
  }

  async getRecentResults(userId: string, limit = 10): Promise<Result[]> {
    return await db
      .select({
        id: results.id,
        jobId: results.jobId,
        domain: results.domain,
        igHandle: results.igHandle,
        confidence: results.confidence,
        sourceUrl: results.sourceUrl,
        status: results.status,
        createdAt: results.createdAt,
      })
      .from(results)
      .innerJoin(jobs, eq(results.jobId, jobs.id))
      .where(eq(jobs.userId, userId))
      .orderBy(desc(results.createdAt))
      .limit(limit);
  }

  // Template operations
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async getTemplatesByUser(userId: string): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, userId), eq(templates.isActive, true)))
      .orderBy(desc(templates.createdAt));
  }

  async getTemplateById(templateId: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, templateId));
    return template;
  }

  async updateTemplate(templateId: string, template: Partial<InsertTemplate>): Promise<void> {
    await db
      .update(templates)
      .set({
        ...template,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await db
      .update(templates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(campaignId: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    return campaign;
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    await db
      .update(campaigns)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  }

  async updateCampaignProgress(campaignId: string, sent: number, replied: number, interested: number, failed: number): Promise<void> {
    await db
      .update(campaigns)
      .set({
        sent,
        replied,
        interested,
        failed,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  }

  // DM Queue operations
  async createDmQueueItem(item: InsertDmQueue): Promise<DmQueue> {
    const [newItem] = await db.insert(dmQueue).values(item).returning();
    return newItem;
  }

  async getDmQueueByCampaign(campaignId: string): Promise<DmQueue[]> {
    return await db
      .select()
      .from(dmQueue)
      .where(eq(dmQueue.campaignId, campaignId))
      .orderBy(desc(dmQueue.createdAt));
  }

  async updateDmQueueStatus(itemId: string, status: string, errorMessage?: string): Promise<void> {
    await db
      .update(dmQueue)
      .set({
        status,
        errorMessage,
        sentAt: status === 'sent' ? new Date() : undefined,
      })
      .where(eq(dmQueue.id, itemId));
  }

  // Usage tracking
  async createUsageLog(log: InsertUsageLog): Promise<UsageLog> {
    const [newLog] = await db.insert(usageLog).values(log).returning();
    return newLog;
  }

  async getUsageByUserAndDate(userId: string, date: string): Promise<UsageLog | undefined> {
    const [usage] = await db
      .select()
      .from(usageLog)
      .where(and(eq(usageLog.userId, userId), eq(usageLog.date, date)));
    return usage;
  }

  // Instagram accounts
  async createInstagramAccount(account: InsertInstagramAccount): Promise<InstagramAccount> {
    const [newAccount] = await db.insert(instagramAccounts).values(account).returning();
    return newAccount;
  }

  async getInstagramAccountsByUser(userId: string): Promise<InstagramAccount[]> {
    return await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .orderBy(desc(instagramAccounts.createdAt));
  }

  async getActiveInstagramAccounts(userId: string): Promise<InstagramAccount[]> {
    return await db
      .select()
      .from(instagramAccounts)
      .where(and(eq(instagramAccounts.userId, userId), eq(instagramAccounts.isActive, true)))
      .orderBy(desc(instagramAccounts.lastUsed));
  }

  async updateInstagramAccountSession(accountId: string, sessionData: string): Promise<void> {
    await db
      .update(instagramAccounts)
      .set({
        sessionData,
        lastUsed: new Date(),
      })
      .where(eq(instagramAccounts.id, accountId));
  }
}

export const storage = new DatabaseStorage();
