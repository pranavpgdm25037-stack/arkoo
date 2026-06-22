import { Router } from "express";
import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";
import { eq, ilike, sql, and, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

const router = Router();

// Stats calculation using real DB data
router.post("/leads/stats", async (req, res) => {
  try {
    const stats = await db.select({
      total: sql<number>`count(*)`,
      hot: sql<number>`count(*) filter (where ${leadsTable.aiCategory} = 'HOT')`,
      warm: sql<number>`count(*) filter (where ${leadsTable.aiCategory} = 'WARM')`,
      cold: sql<number>`count(*) filter (where ${leadsTable.aiCategory} = 'COLD')`,
      avg_score: sql<number>`round(avg(${leadsTable.aiScore}))`,
    }).from(leadsTable);

    const statusCounts = await db.select({
      status: leadsTable.status,
      count: sql<number>`count(*)`
    }).from(leadsTable).groupBy(leadsTable.status);

    res.json({
      ...stats[0],
      by_status: statusCounts
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch lead stats" });
  }
});

// Fetch leads with filtering (Now using POST)
router.post("/leads", async (req, res) => {
  try {
    const { status, label, search } = req.body;
    
    let query = db.select({
      id: leadsTable.id,
      name: customersTable.name,
      contactInfo: customersTable.contactInfo,
      source: leadsTable.source,
      status: leadsTable.status,
      ai_score: leadsTable.aiScore,
      ai_label: leadsTable.aiCategory,
      project_type: projectsTable.type,
      location: customersTable.address,
      created_at: leadsTable.createdAt
    })
    .from(leadsTable)
    .leftJoin(customersTable, eq(leadsTable.id, customersTable.leadId))
    .leftJoin(projectsTable, eq(customersTable.id, projectsTable.customerId));

    const conditions = [];
    if (status) conditions.push(ilike(leadsTable.status, status));
    if (label) conditions.push(eq(leadsTable.aiCategory, label.toUpperCase() as any));
    if (search) {
      conditions.push(
        sql`(${customersTable.name} ILIKE ${'%' + search + '%'} OR ${customersTable.contactInfo} ILIKE ${'%' + search + '%'})`
      );
    }

    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions)).orderBy(desc(leadsTable.createdAt))
      : query.orderBy(desc(leadsTable.createdAt));

    const results = await finalQuery;

    // Parse contact info JSON strings if necessary
    const formattedResults = results.map(r => {
      let contact = r.contactInfo;
      try {
        if (typeof contact === 'string' && contact.startsWith('{')) {
          contact = JSON.parse(contact);
        }
      } catch (e) {}
      
      return {
        ...r,
        phone: typeof contact === 'object' ? (contact as any).phone : contact,
        email: typeof contact === 'object' ? (contact as any).email : ""
      };
    });

    res.json(formattedResults);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Fetch landing page leads
router.get("/leads/landing", async (req, res) => {
  try {
    const results = await db.select({
      id: leadsTable.id,
      name: customersTable.name,
      contactInfo: customersTable.contactInfo,
      source: leadsTable.source,
      status: leadsTable.status,
      ai_score: leadsTable.aiScore,
      ai_label: leadsTable.aiCategory,
      project_type: projectsTable.type,
      location: customersTable.address,
      budget: projectsTable.budget,
      area_sqft: projectsTable.areaSqft,
      timeline: projectsTable.timeline,
      rawData: leadsTable.rawData,
      created_at: leadsTable.createdAt
    })
    .from(leadsTable)
    .leftJoin(customersTable, eq(leadsTable.id, customersTable.leadId))
    .leftJoin(projectsTable, eq(customersTable.id, projectsTable.customerId))
    .where(ilike(leadsTable.source, "%landing%"))
    .orderBy(desc(leadsTable.createdAt));

    const formattedResults = results.map(r => {
      let contact = r.contactInfo;
      try {
        if (typeof contact === 'string' && contact.startsWith('{')) {
          contact = JSON.parse(contact);
        }
      } catch (e) {}

      let comments = "";
      if (r.rawData && typeof r.rawData === 'object') {
        const rawPayload = r.rawData as any;
        comments = rawPayload.requirements || "";
        if (comments.includes("Additional Comments:")) {
          comments = comments.split("Additional Comments:")[1]?.trim() || "";
        }
      }

      return {
        ...r,
        phone: typeof contact === 'object' ? (contact as any).phone : contact,
        email: typeof contact === 'object' ? (contact as any).email : "",
        comments: comments
      };
    });

    res.json(formattedResults);
  } catch (error) {
    console.error("Error fetching landing leads:", error);
    res.status(500).json({ error: "Failed to fetch landing leads" });
  }
});

// Export landing page leads to Excel
router.get("/leads/landing/export", async (req, res) => {
  try {
    const results = await db.select({
      id: leadsTable.id,
      name: customersTable.name,
      contactInfo: customersTable.contactInfo,
      source: leadsTable.source,
      status: leadsTable.status,
      ai_score: leadsTable.aiScore,
      ai_label: leadsTable.aiCategory,
      project_type: projectsTable.type,
      location: customersTable.address,
      budget: projectsTable.budget,
      area_sqft: projectsTable.areaSqft,
      timeline: projectsTable.timeline,
      rawData: leadsTable.rawData,
      created_at: leadsTable.createdAt
    })
    .from(leadsTable)
    .leftJoin(customersTable, eq(leadsTable.id, customersTable.leadId))
    .leftJoin(projectsTable, eq(customersTable.id, projectsTable.customerId))
    .where(ilike(leadsTable.source, "%landing%"))
    .orderBy(desc(leadsTable.createdAt));

    const dataRows = results.map(r => {
      let contact = r.contactInfo;
      try {
        if (typeof contact === 'string' && contact.startsWith('{')) {
          contact = JSON.parse(contact);
        }
      } catch (e) {}

      let comments = "";
      if (r.rawData && typeof r.rawData === 'object') {
        const rawPayload = r.rawData as any;
        comments = rawPayload.requirements || "";
        if (comments.includes("Additional Comments:")) {
          comments = comments.split("Additional Comments:")[1]?.trim() || "";
        }
      }

      const phone = typeof contact === 'object' ? (contact as any).phone : contact;
      const email = typeof contact === 'object' ? (contact as any).email : "";

      return {
        "Submission ID": r.id,
        "Customer Name": r.name || "N/A",
        "Phone Number": phone || "N/A",
        "Email Address": email || "N/A",
        "Project Type": r.project_type || "N/A",
        "Project Location": r.location || "N/A",
        "Project Area (Sq. Ft.)": r.area_sqft || "N/A",
        "Estimated Budget (INR)": r.budget || "N/A",
        "Completion Timeline": r.timeline || "N/A",
        "AI Score": r.ai_score || 0,
        "AI Category": r.ai_label || "PENDING",
        "Status": r.status || "Form Pending",
        "Comments": comments || "N/A",
        "Date Submitted": r.created_at ? new Date(r.created_at).toLocaleString() : "N/A"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Landing Page Submissions");

    // Set custom column widths for readability
    worksheet["!cols"] = [
      { wch: 15 }, // ID
      { wch: 25 }, // Name
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 20 }, // Project Type
      { wch: 25 }, // Location
      { wch: 20 }, // Area
      { wch: 20 }, // Budget
      { wch: 20 }, // Timeline
      { wch: 10 }, // AI Score
      { wch: 15 }, // AI Category
      { wch: 15 }, // Status
      { wch: 40 }, // Comments
      { wch: 25 }  // Date Submitted
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=landing_page_submissions.xlsx"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting landing leads:", error);
    res.status(500).json({ error: "Failed to export landing leads" });
  }
});

router.get("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      res.status(400).json({ error: "Invalid lead ID" });
      return;
    }
    const [result] = await db.select({
      id: leadsTable.id,
      name: customersTable.name,
      contactInfo: customersTable.contactInfo,
      source: leadsTable.source,
      status: leadsTable.status,
      ai_score: leadsTable.aiScore,
      ai_label: leadsTable.aiCategory,
      project_type: projectsTable.type,
      budget: projectsTable.budget,
      area_sqft: projectsTable.areaSqft,
      location: customersTable.address,
      timeline: projectsTable.timeline,
      notes: leadsTable.rawData, // Or a specific notes field if exists
      created_at: leadsTable.createdAt
    })
    .from(leadsTable)
    .leftJoin(customersTable, eq(leadsTable.id, customersTable.leadId))
    .leftJoin(projectsTable, eq(customersTable.id, projectsTable.customerId))
    .where(eq(leadsTable.id, leadId))
    .limit(1);

    if (!result) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead details" });
  }
});

router.patch("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      res.status(400).json({ error: "Invalid lead ID" });
      return;
    }
    const { status, ai_label } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (ai_label) updateData.aiCategory = ai_label;

    await db.update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, leadId));

    res.json({ success: true, message: "Lead updated successfully" });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

export default router;
