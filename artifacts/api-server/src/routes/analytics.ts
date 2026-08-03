import { Router } from "express";
import { db, leadsTable, projectsTable, campaignsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

// 1. Keep the old dashboard analytics endpoint for backwards compatibility
router.post("/analytics/dashboard", async (req, res) => {
  try {
    const pipelineMetrics = await db.select({
      total_pipeline_value: sql<number>`sum(cast(${projectsTable.budget} as numeric))`,
      average_deal_size: sql<number>`round(avg(cast(${projectsTable.budget} as numeric)))`,
      count: sql<number>`count(*)`
    }).from(projectsTable);

    const aiStats = await db.select({
      category: leadsTable.aiCategory,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.aiCategory);

    const statusStats = await db.select({
      status: leadsTable.status,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.status);

    res.json({
      revenue_metrics: {
        total_pipeline_value: pipelineMetrics[0]?.total_pipeline_value || 0,
        won_revenue: 0,
        average_deal_size: pipelineMetrics[0]?.average_deal_size || 0,
      },
      ai_qualification_stats: {
        hot: aiStats.find((s: any) => s.category === 'HOT')?.count || 0,
        warm: aiStats.find((s: any) => s.category === 'WARM')?.count || 0,
        cold: aiStats.find((s: any) => s.category === 'COLD')?.count || 0,
      },
      status_breakdown: statusStats,
      conversion_rates: {
        new_to_contacted: 85,
        contacted_to_qualified: 40,
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Helper to normalize lead source names
function normalizeLeadSource(raw: string): string {
  if (!raw) return "Website";
  const l = raw.toLowerCase().trim();
  if (l.includes("landing page") || l.includes("landing")) return "Landing Page";
  if (l.includes("instagram") || l.includes("meta") || l === "ig" || l.startsWith("ig ")) return "Instagram";
  if (l.includes("linkedin") || l === "li" || l.startsWith("li ") || l.includes("lead gen")) return "LinkedIn";
  if (l.includes("google") || l.includes("forms") || l.includes("sheets")) return "Google Forms";
  if (l.includes("arkoo lms") || l.includes("lms form") || l.includes("arkoo form")) return "Arkoo LMS Form";
  if (l.includes("website") || l.includes("web") || l.includes("contact")) return "Website";
  return raw.trim() || "Website";
}

// Helper to categorize lead status into Green / Yellow / Red colors
function getStatusCategory(statusStr: string, createdAtStr: string | Date): 'incoming' | 'attended' | 'lost' {
  if (!statusStr) return 'incoming';
  const s = statusStr.toLowerCase().trim();
  
  // Attended & Contacted (Yellow): Form Filled, Contacted, Qualified, Converted
  if (s === 'form filled' || s === 'contacted' || s === 'qualified' || s === 'converted') {
    return 'attended';
  }
  
  // Lost (Red): Lost
  if (s === 'lost') {
    return 'lost';
  }
  
  // Pending states (New, Form Pending): Check 36-hour rule
  if (s === 'new' || s === 'form pending') {
    const createdTime = new Date(createdAtStr).getTime();
    const elapsedMs = Date.now() - createdTime;
    const CUTOFF_MS = 36 * 60 * 60 * 1000; // 36 hours
    
    if (elapsedMs > CUTOFF_MS) {
      return 'lost'; // Turns into Lost (Red) if more than 36 hours
    } else {
      return 'incoming'; // Incoming (Green) if within 36 hours
    }
  }
  
  return 'incoming'; // default
}

// 2. Leads trend analytics endpoint (grouped by day, month, year)
router.post("/analytics/leads-trend", async (req, res) => {
  try {
    const { interval = "month", source = "All" } = req.body;

    // Retrieve all leads with status, source and createdAt
    const leads = await db.select({
      id: leadsTable.id,
      status: leadsTable.status,
      source: leadsTable.source,
      createdAt: leadsTable.createdAt
    }).from(leadsTable);

    // Initialize buckets
    let trendData: { key: string; label: string; incoming: number; attended: number; lost: number }[] = [];
    const now = new Date();

    if (interval === "day") {
      // Past 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendData.push({ key: dateStr, label, incoming: 0, attended: 0, lost: 0 });
      }
    } else if (interval === "year") {
      // Past 5 years
      const currentYear = now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const key = String(year);
        trendData.push({ key, label: key, incoming: 0, attended: 0, lost: 0 });
      }
    } else {
      // Past 12 months (default "month")
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        trendData.push({ key, label, incoming: 0, attended: 0, lost: 0 });
      }
    }

    // Filter and aggregate leads in memory
    leads.forEach((lead: any) => {
      const leadSource = normalizeLeadSource(lead.source);
      
      // Filter by source if requested
      if (source !== "All" && leadSource !== source) {
        return;
      }

      const createdDate = new Date(lead.createdAt);
      let matchKey = "";

      if (interval === "day") {
        matchKey = createdDate.toISOString().slice(0, 10);
      } else if (interval === "year") {
        matchKey = String(createdDate.getFullYear());
      } else {
        matchKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
      }

      const bucket = trendData.find(b => b.key === matchKey);
      if (bucket) {
        const cat = getStatusCategory(lead.status, lead.createdAt);
        if (cat === 'incoming') bucket.incoming++;
        else if (cat === 'attended') bucket.attended++;
        else if (cat === 'lost') bucket.lost++;
      }
    });

    // Compute aggregate summary
    const summary = {
      incoming: 0,
      attended: 0,
      lost: 0,
      total: 0,
      conversionRate: 0
    };

    trendData.forEach(b => {
      summary.incoming += b.incoming;
      summary.attended += b.attended;
      summary.lost += b.lost;
    });

    summary.total = summary.incoming + summary.attended + summary.lost;
    // Conversion rate: (Attended leads / Total leads) * 100
    summary.conversionRate = summary.total > 0 
      ? Math.round((summary.attended / summary.total) * 100) 
      : 0;

    res.json({
      trendData,
      summary
    });
  } catch (error) {
    console.error("Error fetching leads trend analytics:", error);
    res.status(500).json({ error: "Failed to fetch leads trend analytics" });
  }
});

// 3. Campaigns API CRUD
// List Campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await db.select().from(campaignsTable);
    const leads = await db.select({
      id: leadsTable.id,
      status: leadsTable.status,
      campaignId: leadsTable.campaignId,
      createdAt: leadsTable.createdAt
    }).from(leadsTable);

    // Enrich campaigns with lead counts
    const enrichedCampaigns = campaigns.map((c: any) => {
      const campLeads = leads.filter((l: any) => l.campaignId === c.id);
      
      const incoming = campLeads.filter((l: any) => getStatusCategory(l.status, l.createdAt) === 'incoming').length;
      const attended = campLeads.filter((l: any) => getStatusCategory(l.status, l.createdAt) === 'attended').length;
      const lost = campLeads.filter((l: any) => getStatusCategory(l.status, l.createdAt) === 'lost').length;

      return {
        ...c,
        leadCount: campLeads.length,
        stats: {
          incoming,
          attended,
          lost
        }
      };
    });

    return res.json(enrichedCampaigns);
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return res.status(500).json({ error: "Failed to list campaigns" });
  }
});

// Create Campaign
router.post("/campaigns", async (req, res) => {
  try {
    const { name, platform, targetId, budget, spent } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: "Name and Platform are required" });
    }

    const [newCampaign] = await db.insert(campaignsTable).values({
      name,
      platform,
      targetId: targetId || null,
      budget: budget ? parseInt(budget, 10) : 0,
      spent: spent ? parseInt(spent, 10) : 0
    }).returning();

    return res.json(newCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Delete Campaign
router.delete("/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }

    // 1. Unlink leads associated with this campaign
    await db.update(leadsTable)
      .set({ campaignId: null })
      .where(eq(leadsTable.campaignId, campaignId));

    // 2. Delete the campaign
    await db.delete(campaignsTable)
      .where(eq(campaignsTable.id, campaignId));

    return res.json({ success: true, message: `Campaign #${campaignId} deleted and associated leads unlinked.` });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return res.status(500).json({ error: "Failed to delete campaign" });
  }
});

export default router;
