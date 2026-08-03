import { Router } from "express";
import { db, leadsTable, customersTable, projectsTable, quotationsTable } from "@workspace/db";
import { eq, ilike, sql, and, desc, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";

const router = Router();

// Helper to calculate status based on 36-hour rule
export function getLeadActiveStatus(status: string, createdAt: string | Date): string {
  const s = (status || "").toLowerCase().trim();
  if (s === 'new' || s === 'form pending') {
    const createdTime = new Date(createdAt).getTime();
    const elapsedMs = Date.now() - createdTime;
    const CUTOFF_MS = 36 * 60 * 60 * 1000; // 36 hours
    if (elapsedMs > CUTOFF_MS) {
      return 'Lost';
    }
  }
  return status;
}

// Stats calculation using real DB data
router.post("/leads/stats", async (req, res) => {
  try {
    const leads = await db.select({
      id: leadsTable.id,
      status: leadsTable.status,
      aiCategory: leadsTable.aiCategory,
      aiScore: leadsTable.aiScore,
      createdAt: leadsTable.createdAt
    }).from(leadsTable);

    let total = leads.length;
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let totalScore = 0;

    const statusCountsMap: Record<string, number> = {};

    leads.forEach((l: any) => {
      const activeStatus = getLeadActiveStatus(l.status, l.createdAt);
      statusCountsMap[activeStatus] = (statusCountsMap[activeStatus] || 0) + 1;

      const cat = (l.aiCategory || 'PENDING').toUpperCase();
      if (cat === 'HOT') hot++;
      else if (cat === 'WARM') warm++;
      else if (cat === 'COLD') cold++;

      totalScore += (l.aiScore || 0);
    });

    const statusCounts = Object.entries(statusCountsMap).map(([status, count]) => ({
      status,
      count
    }));

    res.json({
      total,
      hot,
      warm,
      cold,
      avg_score: total > 0 ? Math.round(totalScore / total) : 0,
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

    // Parse contact info JSON strings, apply 36-hour rule, and filter by status in JS
    const formattedResults = [];
    for (const r of results) {
      let contact = r.contactInfo;
      try {
        if (typeof contact === 'string' && contact.startsWith('{')) {
          contact = JSON.parse(contact);
        }
      } catch (e) {}

      const activeStatus = getLeadActiveStatus(r.status, r.created_at);
      
      // Filter by status in JavaScript
      if (status && status !== "All") {
        if (activeStatus.toLowerCase() !== status.toLowerCase()) {
          continue;
        }
      }

      formattedResults.push({
        ...r,
        status: activeStatus,
        phone: typeof contact === 'object' && contact ? (contact as any).phone : contact,
        email: typeof contact === 'object' && contact ? (contact as any).email : ""
      });
    }

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

    const formattedResults = results.map((r: any) => {
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

      const activeStatus = getLeadActiveStatus(r.status, r.created_at);

      return {
        ...r,
        status: activeStatus,
        phone: typeof contact === 'object' && contact ? (contact as any).phone : contact,
        email: typeof contact === 'object' && contact ? (contact as any).email : "",
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

    const dataRows = results.map((r: any) => {
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

      const activeStatus = getLeadActiveStatus(r.status, r.created_at);
      const phone = typeof contact === 'object' && contact ? (contact as any).phone : contact;
      const email = typeof contact === 'object' && contact ? (contact as any).email : "";

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
        "Status": activeStatus || "Form Pending",
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

    let contact = result.contactInfo;
    try {
      if (typeof contact === 'string' && contact.startsWith('{')) {
        contact = JSON.parse(contact);
      }
    } catch (e) {}

    const phone = typeof contact === 'object' && contact ? (contact as any).phone : contact;
    const email = typeof contact === 'object' && contact ? (contact as any).email : "";

    let notesText = "";
    if (result.notes && typeof result.notes === 'object') {
      notesText = (result.notes as any).notes || "";
    }

    const formattedResult = {
      ...result,
      status: getLeadActiveStatus(result.status, result.created_at),
      phone: phone || "N/A",
      email: email || "N/A",
      notes: notesText,
      rawData: result.notes
    };

    res.json(formattedResult);
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
    const { status, ai_label, notes } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (ai_label) updateData.aiCategory = ai_label;

    if (notes !== undefined) {
      const [existing] = await db.select({ rawData: leadsTable.rawData }).from(leadsTable).where(eq(leadsTable.id, leadId)).limit(1);
      const currentRawData = existing?.rawData || {};
      const newRawData = typeof currentRawData === 'object' && currentRawData !== null 
        ? { ...currentRawData, notes } 
        : { notes };
      updateData.rawData = newRawData;
    }

    await db.update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, leadId));

    res.json({ success: true, message: "Lead updated successfully" });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

router.delete("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      res.status(400).json({ error: "Invalid lead ID" });
      return;
    }
    
    // Manual cascade delete
    // Find associated customers
    const customers = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.leadId, leadId));
    const customerIds = customers.map((c: any) => c.id);
    
    if (customerIds.length > 0) {
      // Find associated projects
      const projects = await db.select({ id: projectsTable.id }).from(projectsTable).where(inArray(projectsTable.customerId, customerIds));
      const projectIds = projects.map((p: any) => p.id);
      
      if (projectIds.length > 0) {
        // Delete quotations associated with these projects
        await db.delete(quotationsTable).where(inArray(quotationsTable.projectId, projectIds));
        
        // Delete projects
        await db.delete(projectsTable).where(inArray(projectsTable.customerId, customerIds));
      }
      
      // Delete customers
      await db.delete(customersTable).where(inArray(customersTable.id, customerIds));
    }
    
    // Delete lead directly
    await db.delete(leadsTable).where(eq(leadsTable.id, leadId));
    
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Fetch customers list with projects and leads info
router.get("/customers", async (req, res) => {
  try {
    const customers = await db.select().from(customersTable);
    const projects = await db.select().from(projectsTable);
    const leads = await db.select({
      id: leadsTable.id,
      rawData: leadsTable.rawData
    }).from(leadsTable);

    const formattedCustomers = customers.map((c: any) => {
      const customerProjects = projects.filter((p: any) => p.customerId === c.id);
      const relatedLead = leads.find((l: any) => l.id === c.leadId);

      return {
        id: c.id,
        name: c.name,
        contact_info: c.contactInfo,
        address: c.address,
        created_at: c.createdAt || new Date().toISOString(),
        lead_id: c.leadId,
        projects: customerProjects.map((p: any) => ({
          id: p.id,
          customer_id: p.customerId,
          type: p.type,
          area_sqft: p.areaSqft,
          budget: p.budget,
          timeline: p.timeline
        })),
        rawData: relatedLead?.rawData || {}
      };
    });

    return res.json(formattedCustomers);
  } catch (error) {
    console.error("Error fetching customers list:", error);
    return res.status(500).json({ error: "Failed to fetch customers list" });
  }
});

export default router;
