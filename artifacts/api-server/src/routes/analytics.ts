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

export default router;
