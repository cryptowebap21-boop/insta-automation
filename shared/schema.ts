import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").default("free"), // free, starter, pro, agency
  planRenewalAt: timestamp("plan_renewal_at"),
  dailyDmQuota: integer("daily_dm_quota").default(10),
  dailyExtractQuota: integer("daily_extract_quota").default(150),
  dmsUsedToday: integer("dms_used_today").default(0),
  extractsUsedToday: integer("extracts_used_today").default(0),
  lastQuotaReset: timestamp("last_quota_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CSV Upload jobs
export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  filename: varchar("filename").notNull(),
  rows: integer("rows").notNull(),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Background processing jobs
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  uploadId: varchar("upload_id").references(() => uploads.id),
  type: varchar("type").notNull(), // extraction, dm_campaign
  status: varchar("status").default("pending"), // pending, running, completed, failed
  total: integer("total").default(0),
  completed: integer("completed").default(0),
  failed: integer("failed").default(0),
  meta: jsonb("meta"), // Additional job data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Extraction results
export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  domain: varchar("domain").notNull(),
  igHandle: varchar("ig_handle"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  sourceUrl: text("source_url"),
  status: varchar("status").default("found"), // found, not_found, error
  createdAt: timestamp("created_at").defaultNow(),
});

// DM Templates
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  content: text("content").notNull(),
  spintaxVariations: integer("spintax_variations").default(3),
  sendRate: varchar("send_rate").default("moderate"), // conservative, moderate, aggressive
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// DM Campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  templateId: varchar("template_id").references(() => templates.id).notNull(),
  name: varchar("name").notNull(),
  status: varchar("status").default("draft"), // draft, scheduled, running, paused, completed, failed
  totalHandles: integer("total_handles").default(0),
  sent: integer("sent").default(0),
  replied: integer("replied").default(0),
  interested: integer("interested").default(0),
  failed: integer("failed").default(0),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// DM Queue
export const dmQueue = pgTable("dm_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id).notNull(),
  igHandle: varchar("ig_handle").notNull(),
  message: text("message").notNull(),
  status: varchar("status").default("pending"), // pending, sent, replied, interested, not_fit, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking
export const usageLog = pgTable("usage_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  dmsUsed: integer("dms_used").default(0),
  extractsUsed: integer("extracts_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Instagram accounts for multi-account support
export const instagramAccounts = pgTable("instagram_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  username: varchar("username").notNull(),
  sessionData: text("session_data"), // Encrypted session cookies
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type DmQueue = typeof dmQueue.$inferSelect;
export type UsageLog = typeof usageLog.$inferSelect;
export type InstagramAccount = typeof instagramAccounts.$inferSelect;

// Insert schemas
export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResultSchema = createInsertSchema(results).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDmQueueSchema = createInsertSchema(dmQueue).omit({
  id: true,
  createdAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLog).omit({
  id: true,
  createdAt: true,
});

export const insertInstagramAccountSchema = createInsertSchema(instagramAccounts).omit({
  id: true,
  createdAt: true,
});

export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertDmQueue = z.infer<typeof insertDmQueueSchema>;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type InsertInstagramAccount = z.infer<typeof insertInstagramAccountSchema>;
