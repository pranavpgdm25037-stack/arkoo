import { Router } from "express";
import { db, leadsTable, projectsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/analytics/dashboard", async (req, res) => {
  try {
    // 1. Pipeline Metrics
    const pipelineMetrics = await db.select({
      total_pipeline_value: sql<number>`sum(cast(${projectsTable.budget} as numeric))`,
      average_deal_size: sql<number>`round(avg(cast(${projectsTable.budget} as numeric)))`,
      count: sql<number>`count(*)`
    }).from(projectsTable);

    // 2. AI Qualification Stats
    const aiStats = await db.select({
      category: leadsTable.aiCategory,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.aiCategory);

    // 3. Status Conversion Stats
    const statusStats = await db.select({
      status: leadsTable.status,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.status);

    res.json({
      revenue_metrics: {
        total_pipeline_value: pipelineMetrics[0]?.total_pipeline_value || 0,
        won_revenue: 0, // Need 'won' status leads for this
        average_deal_size: pipelineMetrics[0]?.average_deal_size || 0,
      },
      ai_qualification_stats: {
        hot: aiStats.find(s => s.category === 'HOT')?.count || 0,
        warm: aiStats.find(s => s.category === 'WARM')?.count || 0,
        cold: aiStats.find(s => s.category === 'COLD')?.count || 0,
      },
      status_breakdown: statusStats,
      conversion_rates: {
        // Placeholder for real logic involving history/transitions
        new_to_contacted: 85,
        contacted_to_qualified: 40,
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
router.get("/analytics/ads", async (req, res) => {
  try {
    // 1. Get real lead counts grouped by source from DB
    const sourceStats = await db.select({
      source: leadsTable.source,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.source);

    // Default mock ad metrics for different platforms
    const defaultMetrics: Record<string, any> = {
      "LinkedIn": { spend: 1250, impressions: 45000, clicks: 1200 },
      "Instagram": { spend: 800, impressions: 72000, clicks: 3500 },
      "Website": { spend: 400, impressions: 15000, clicks: 800 },
      "Google": { spend: 1500, impressions: 25000, clicks: 1800 }
    };

    // Build platform breakdown list
    const platformsData = [];

    // Map through sources that we have mock data for
    for (const [platform, metrics] of Object.entries(defaultMetrics)) {
      // Find real leads for this platform. Case-insensitive match.
      const dbStats = sourceStats.find(s => s.source.toLowerCase() === platform.toLowerCase());
      const leads = dbStats ? Number(dbStats.count) : 0;
      
      const cpl = leads > 0 ? Number((metrics.spend / leads).toFixed(2)) : 0;
      const ctr = Number(((metrics.clicks / metrics.impressions) * 100).toFixed(2));

      platformsData.push({
        platform,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr,
        spend: metrics.spend,
        leads,
        cpl
      });
    }

    // Add any sources from DB that are not in defaultMetrics
    for (const stat of sourceStats) {
      const exists = platformsData.find(p => p.platform.toLowerCase() === stat.source.toLowerCase());
      if (!exists && stat.source && stat.source.trim() !== "") {
        platformsData.push({
          platform: stat.source,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          spend: 0,
          leads: Number(stat.count),
          cpl: 0
        });
      }
    }

    // Calculate totals
    const totalSpend = platformsData.reduce((sum, p) => sum + p.spend, 0);
    const totalLeads = platformsData.reduce((sum, p) => sum + p.leads, 0);
    const totalClicks = platformsData.reduce((sum, p) => sum + p.clicks, 0);
    const avgCpl = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0;

    res.json({
      summary: {
        totalSpend,
        totalLeads,
        totalClicks,
        avgCpl
      },
      platforms: platformsData
    });

  } catch (error) {
    console.error("Error fetching ad analytics:", error);
    res.status(500).json({ error: "Failed to fetch ad analytics" });
  }
});

export default router;
