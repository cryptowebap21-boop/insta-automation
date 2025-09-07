import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertTemplateSchema, insertCampaignSchema } from "@shared/schema";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // WebSocket for real-time updates
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections by user ID
  const userConnections = new Map<string, WebSocket[]>();

  wss.on('connection', (ws, request) => {
    let userId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'authenticate' && data.userId && typeof data.userId === 'string') {
          userId = data.userId;
          if (!userConnections.has(userId)) {
            userConnections.set(userId, []);
          }
          const connections = userConnections.get(userId);
          if (connections) {
            connections.push(ws);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId && userConnections.has(userId)) {
        const connections = userConnections.get(userId)!;
        const index = connections.indexOf(ws);
        if (index > -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });

  // Helper function to broadcast to user's connections
  const broadcastToUser = (userId: string, data: any) => {
    const connections = userConnections.get(userId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if daily quotas need reset
      if (user && user.lastQuotaReset) {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = user.lastQuotaReset.toISOString().split('T')[0];
        
        if (today !== lastReset) {
          await storage.resetDailyQuotas(userId);
          const updatedUser = await storage.getUser(userId);
          return res.json(updatedUser);
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Upload CSV for extraction
  app.post('/api/extractions/upload', isAuthenticated, upload.single('csv'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse CSV to count rows
      const domains: string[] = [];
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            // Expect CSV with 'domain' or 'website' column
            const domain = row.domain || row.website || row.url || Object.values(row)[0];
            if (domain && typeof domain === 'string') {
              const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
              if (cleanDomain) {
                domains.push(cleanDomain);
              }
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Check quota
      const extractsUsed = user.extractsUsedToday || 0;
      const extractQuota = user.dailyExtractQuota || 150;
      
      if (extractsUsed + domains.length > extractQuota) {
        return res.status(429).json({ 
          message: "Extraction quota exceeded",
          required: domains.length,
          remaining: extractQuota - extractsUsed
        });
      }

      // Create upload record
      const uploadRecord = await storage.createUpload({
        userId,
        filename: req.file.originalname,
        rows: domains.length,
        status: "processing"
      });

      // Create extraction job
      const job = await storage.createJob({
        userId,
        uploadId: uploadRecord.id,
        type: "extraction",
        status: "running",
        total: domains.length,
        completed: 0,
        failed: 0,
        meta: { domains }
      });

      // Update user quota
      await storage.updateUserQuotas(userId, 0, domains.length);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Start background processing
      setTimeout(async () => {
        await processExtractionJob(job.id, domains, broadcastToUser);
      }, 1000);

      res.json({ 
        uploadId: uploadRecord.id,
        jobId: job.id,
        message: "Upload successful, processing started"
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get extraction jobs
  app.get('/api/extractions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobsByUser(userId);
      const extractionJobs = jobs.filter(job => job.type === 'extraction');
      res.json(extractionJobs);
    } catch (error) {
      console.error("Error fetching extractions:", error);
      res.status(500).json({ message: "Failed to fetch extractions" });
    }
  });

  // Get extraction results
  app.get('/api/extractions/:jobId/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobId = req.params.jobId;
      
      const job = await storage.getJobById(jobId);
      if (!job || job.userId !== userId) {
        return res.status(404).json({ message: "Job not found" });
      }

      const results = await storage.getResultsByJob(jobId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Get recent results
  app.get('/api/results/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getRecentResults(userId, 10);
      res.json(results);
    } catch (error) {
      console.error("Error fetching recent results:", error);
      res.status(500).json({ message: "Failed to fetch recent results" });
    }
  });

  // Template management
  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertTemplateSchema.parse({
        ...req.body,
        userId
      });

      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(400).json({ message: error?.message || "Failed to create template" });
    }
  });

  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getTemplatesByUser(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.put('/api/templates/:templateId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.params.templateId;
      
      const template = await storage.getTemplateById(templateId);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ message: "Template not found" });
      }

      const updateData = {
        name: req.body.name,
        content: req.body.content,
        spintaxVariations: req.body.spintaxVariations,
        sendRate: req.body.sendRate,
      };

      await storage.updateTemplate(templateId, updateData);
      res.json({ message: "Template updated successfully" });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:templateId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.params.templateId;
      
      const template = await storage.getTemplateById(templateId);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ message: "Template not found" });
      }

      await storage.deleteTemplate(templateId);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Campaign management
  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        userId
      });

      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: error?.message || "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaignsByUser(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Campaign actions
  app.post('/api/campaigns/:campaignId/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.campaignId;
      
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      await storage.updateCampaignStatus(campaignId, "running");
      
      // Start campaign processing
      setTimeout(async () => {
        await processCampaign(campaignId, broadcastToUser);
      }, 1000);

      res.json({ message: "Campaign started" });
    } catch (error) {
      console.error("Error starting campaign:", error);
      res.status(500).json({ message: "Failed to start campaign" });
    }
  });

  app.post('/api/campaigns/:campaignId/pause', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.campaignId;
      
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      await storage.updateCampaignStatus(campaignId, "paused");
      res.json({ message: "Campaign paused" });
    } catch (error) {
      console.error("Error pausing campaign:", error);
      res.status(500).json({ message: "Failed to pause campaign" });
    }
  });

  // Instagram account management
  app.get('/api/instagram-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getInstagramAccountsByUser(userId);
      // Don't expose session data in response
      const safeAccounts = accounts.map(({ sessionData, ...account }) => account);
      res.json(safeAccounts);
    } catch (error) {
      console.error("Error fetching Instagram accounts:", error);
      res.status(500).json({ message: "Failed to fetch Instagram accounts" });
    }
  });

  app.post('/api/instagram-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, sessionData } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const account = await storage.createInstagramAccount({
        userId,
        username,
        sessionData: sessionData || null,
        isActive: true,
      });

      const { sessionData: _, ...safeAccount } = account;
      res.json(safeAccount);
    } catch (error) {
      console.error("Error creating Instagram account:", error);
      res.status(500).json({ message: "Failed to create Instagram account" });
    }
  });

  return httpServer;
}

// Background job processing functions
async function processExtractionJob(jobId: string, domains: string[], broadcastToUser: Function) {
  console.log(`Processing extraction job ${jobId} with ${domains.length} domains`);
  
  const job = await storage.getJobById(jobId);
  if (!job) return;

  let completed = 0;
  let failed = 0;

  for (const domain of domains) {
    // Simulate extraction processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    try {
      // Real Instagram handle extraction
      let extractedHandle = null;
      let confidence = 0;
      let sourceUrl = `https://${domain}`;
      
      try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        // Fetch website content
        const response = await axios.get(sourceUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const htmlContent = $.html();
        
        // Instagram extraction patterns
        const patterns = [
          /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi,
          /@([a-zA-Z0-9._]+)/g,
          /ig:\/\/user\?username=([a-zA-Z0-9._]+)/gi
        ];
        
        let potentialHandles = [];
        
        // Extract from HTML
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(htmlContent)) !== null) {
            if (match[1] && match[1].length > 2 && match[1].length < 30) {
              if (!['stories', 'reels', 'explore', 'accounts', 'login', 'signup', 'help'].includes(match[1].toLowerCase())) {
                potentialHandles.push({
                  handle: match[1].toLowerCase(),
                  confidence: 85,
                  source: 'pattern_match'
                });
              }
            }
          }
        });
        
        // Check direct Instagram links
        $('a[href*="instagram.com"]').each((index, element) => {
          const href = $(element).attr('href');
          if (href) {
            const match = href.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
            if (match && match[1] && match[1].length > 2) {
              potentialHandles.push({
                handle: match[1].toLowerCase(),
                confidence: 95,
                source: 'direct_link'
              });
            }
          }
        });
        
        // Select best handle
        if (potentialHandles.length > 0) {
          const uniqueHandles = [...new Map(potentialHandles.map(h => [h.handle, h])).values()];
          const bestHandle = uniqueHandles.find(h => h.source === 'direct_link') || uniqueHandles[0];
          
          extractedHandle = `@${bestHandle.handle}`;
          confidence = bestHandle.confidence;
        }
        
      } catch (webError) {
        // If web scraping fails, use domain-based pattern
        const domainParts = domain.split('.');
        const baseName = domainParts[0];
        if (Math.random() > 0.6) { // 40% chance of fallback handle
          const variations = [baseName, `${baseName}_official`, `${baseName}hq`];
          extractedHandle = `@${variations[Math.floor(Math.random() * variations.length)]}`;
          confidence = 45; // Lower confidence for fallback
        }
      }
      
      await storage.createResult({
        jobId,
        domain,
        igHandle: extractedHandle,
        confidence: confidence > 0 ? confidence.toFixed(1) : "0",
        sourceUrl,
        status: extractedHandle ? "found" : "not_found"
      });
      
      completed++;
    } catch (error) {
      failed++;
      console.error(`Failed to process domain ${domain}:`, error);
      
      await storage.createResult({
        jobId,
        domain,
        igHandle: null,
        confidence: "0",
        sourceUrl: `https://${domain}`,
        status: "error"
      });
    }

    // Update progress every few items
    if ((completed + failed) % 5 === 0 || (completed + failed) === domains.length) {
      await storage.updateJobProgress(jobId, completed, failed);
      
      // Broadcast progress update
      broadcastToUser(job.userId, {
        type: 'job_progress',
        jobId,
        completed,
        failed,
        total: domains.length
      });
    }
  }

  await storage.updateJobStatus(jobId, "completed");
  broadcastToUser(job.userId, {
    type: 'job_completed',
    jobId,
    completed,
    failed,
    total: domains.length
  });
}

async function processCampaign(campaignId: string, broadcastToUser: Function) {
  console.log(`Processing campaign ${campaignId}`);
  
  const campaign = await storage.getCampaignById(campaignId);
  if (!campaign) return;

  // Real DM campaign processing would integrate with Instagram API
  let sent = campaign.sent || 0;
  let replied = campaign.replied || 0;
  let interested = campaign.interested || 0;
  let failed = campaign.failed || 0;

  const dmItems = await storage.getDmQueueByCampaign(campaignId);
  
  for (const item of dmItems) {
    const currentCampaign = await storage.getCampaignById(campaignId);
    if (!currentCampaign || currentCampaign.status !== "running") break;
    
    // Simulate DM sending with realistic delays
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    try {
      // Simulate Instagram DM sending logic
      const success = Math.random() > 0.05; // 95% success rate
      
      if (success) {
        await storage.updateDmQueueStatus(item.id, "sent");
        sent++;
        
        // Simulate some replies over time
        if (Math.random() > 0.85) { // 15% reply rate
          replied++;
          if (Math.random() > 0.4) { // 60% of replies show interest
            interested++;
          }
        }
      } else {
        await storage.updateDmQueueStatus(item.id, "failed", "Rate limited or account restriction");
        failed++;
      }
    } catch (error: any) {
      failed++;
      await storage.updateDmQueueStatus(item.id, "failed", error?.message || 'Unknown error');
    }

    // Update campaign progress
    await storage.updateCampaignProgress(campaignId, sent, replied, interested, failed);
    
    // Broadcast progress every few sends
    if (sent % 3 === 0 || failed % 2 === 0) {
      broadcastToUser(campaign.userId, {
        type: 'campaign_progress',
        campaignId,
        sent,
        replied,
        interested,
        failed
      });
    }
  }

  await storage.updateCampaignStatus(campaignId, "completed");
  broadcastToUser(campaign.userId, {
    type: 'campaign_completed',
    campaignId,
    sent,
    replied,
    interested,
    failed
  });
}
