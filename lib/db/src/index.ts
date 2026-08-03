import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const { Pool } = pg;

let realDb: any;
let realPool: any;

try {
  const connStr = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
  realPool = new Pool({ connectionString: connStr });
  realDb = drizzle(realPool, { schema });
} catch (e) {
  console.warn("[Database Library] Real database client pool creation failed.");
}

export const pool = realPool;

// ============================================================================
// SIMULATED DATABASE ENGINE (LOCAL FALLBACK JSON LEDGER)
// ============================================================================
const FALLBACK_DB_PATH = path.resolve(process.cwd(), "../../arkoo_db_fallback.json");

const loadMockDb = () => {
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf-8"));
      if (data && typeof data === 'object') {
        let modified = false;
        if (!data.campaigns) {
          data.campaigns = [
            {
              id: 1,
              name: "LinkedIn Summer Sale 2026",
              platform: "LinkedIn",
              status: "active",
              targetId: "li-form-123",
              budget: 50000,
              spent: 12000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 2,
              name: "Instagram Retail Promo",
              platform: "Instagram",
              status: "active",
              targetId: "ig-ad-456",
              budget: 30000,
              spent: 15000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          if (data.leads && data.leads[0]) data.leads[0].campaignId = 1;
          if (data.leads && data.leads[1]) data.leads[1].campaignId = 2;
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
        }
        return data;
      }
    } catch (e) {}
  }

  // Seed default dummy data
  const defaultData = {
    users: [
      {
        id: "mock-user-uuid-1111-2222",
        email: "arkooprebuildai@gmail.com",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    leads: [
      {
        id: 151,
        source: "Landing Page",
        rawData: {
          notes: "Prospect wants a PEB industrial warehouse for storage.",
          requirements: "Size: 100 x 50 ft. Clear height: 24 ft. Location: Pune. Budget: ₹15L. Additional Comments: Need it completed in 3 months."
        },
        aiScore: 85,
        aiCategory: "HOT",
        status: "Form Filled",
        assignedToUserId: "mock-user-uuid-1111-2222",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 152,
        source: "Instagram",
        rawData: {
          notes: "Enquired about cold storage PEB construction.",
          requirements: "Location: Mumbai. Area: 12,000 sq ft."
        },
        aiScore: 65,
        aiCategory: "WARM",
        status: "contacted",
        assignedToUserId: "mock-user-uuid-1111-2222",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    customers: [
      {
        id: 101,
        leadId: 151,
        name: "Pranav Patel",
        contactInfo: JSON.stringify({ email: "pranav@example.com", phone: "+919876543210" }),
        address: "Pune, Maharashtra"
      },
      {
        id: 102,
        leadId: 152,
        name: "Rajesh Sharma",
        contactInfo: JSON.stringify({ email: "rajesh@example.com", phone: "+919812345678" }),
        address: "Mumbai, Maharashtra"
      }
    ],
    projects: [
      {
        id: 201,
        customerId: 101,
        type: "PEB Warehouse",
        areaSqft: 5000,
        budget: "1500000",
        timeline: "1 - 3 months"
      },
      {
        id: 202,
        customerId: 102,
        type: "Cold Storage",
        areaSqft: 12000,
        budget: "4500000",
        timeline: "3 - 6 months"
      }
    ],
    quotations: [],
    campaigns: [
      {
        id: 1,
        name: "LinkedIn Summer Sale 2026",
        platform: "LinkedIn",
        status: "active",
        targetId: "li-form-123",
        budget: 50000,
        spent: 12000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Instagram Retail Promo",
        platform: "Instagram",
        status: "active",
        targetId: "ig-ad-456",
        budget: 30000,
        spent: 15000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
  return defaultData;
};

const saveMockDb = (data: any) => {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[Database Library Mock] Failed to save database to local ledger:", e);
  }
};

// SQL-to-Mock parser & interpreter
async function runFallbackSql(sqlText: string, params: any[]) {
  const dbData = loadMockDb();
  sqlText = sqlText.toLowerCase();
  console.log(`\n🔍 [Mock DB SQL Interpreter] Evaluating query:\n   SQL: ${sqlText}\n   Params: ${JSON.stringify(params)}`);

  // 1. Stats total count:
  // e.g. select count(*), count(*) filter (where "ai_category" = 'HOT') ... from "leads"
  if (sqlText.includes('count(*)') && sqlText.includes('ai_category') && !sqlText.includes('group by')) {
    const leads = dbData.leads;
    const total = leads.length;
    const hot = leads.filter((l: any) => l.aiCategory === 'HOT').length;
    const warm = leads.filter((l: any) => l.aiCategory === 'WARM').length;
    const cold = leads.filter((l: any) => l.aiCategory === 'COLD').length;
    const totalScore = leads.reduce((sum: number, l: any) => sum + (l.aiScore || 0), 0);
    const avg_score = total > 0 ? Math.round(totalScore / total) : 0;
    
    const result = [{
      total,
      hot,
      warm,
      cold,
      avg_score
    }];
    console.log(`   [Interpreter Result] Stats total count:`, result);
    return result;
  }

  // 2. Stats by status (group by):
  // e.g. select "status", count(*) from "leads" group by "status"
  if (sqlText.includes('count(*)') && sqlText.includes('group by') && sqlText.includes('status')) {
    const leads = dbData.leads;
    const counts: Record<string, number> = {};
    leads.forEach((l: any) => {
      const s = l.status || 'new';
      counts[s] = (counts[s] || 0) + 1;
    });
    const result = Object.keys(counts).map(status => ({
      status,
      count: counts[status]
    }));
    console.log(`   [Interpreter Result] Stats by status:`, result);
    return result;
  }

  // 3. Single lead detail:
  // e.g. select ... from "leads" ... where "leads"."id" = $1 limit 1
  if (sqlText.includes('from "leads"') && sqlText.includes('limit 1')) {
    const targetId = params[0] || (sqlText.match(/id"\s*=\s*(\d+)/)?.[1]);
    const leadId = typeof targetId === 'string' ? parseInt(targetId, 10) : targetId;
    if (leadId) {
      const lead = dbData.leads.find((l: any) => l.id === leadId);
      if (lead) {
        const customer = dbData.customers.find((c: any) => c.leadId === lead.id) || {};
        const project = dbData.projects.find((p: any) => p.customerId === customer.id) || {};
        const result = [{
          id: lead.id,
          name: customer.name || "",
          contactInfo: customer.contactInfo || "{}",
          source: lead.source,
          status: lead.status,
          aiScore: lead.aiScore,
          aiCategory: lead.aiCategory,
          type: project.type || "",
          address: customer.address || "",
          createdAt: lead.createdAt,
          budget: project.budget || "",
          areaSqft: project.areaSqft || 0,
          timeline: project.timeline || "",
          rawData: lead.rawData
        }];
        console.log(`   [Interpreter Result] Single lead detail #${leadId}`);
        return result;
      }
    }
  }

  // 4. Leads list / landing leads query:
  // e.g. select ... from "leads" ...
  if (sqlText.includes('select') && sqlText.includes('from "leads"')) {
    let results = dbData.leads.map((lead: any) => {
      const customer = dbData.customers.find((c: any) => c.leadId === lead.id) || {};
      const project = dbData.projects.find((p: any) => p.customerId === customer.id) || {};
      return {
        id: lead.id,
        name: customer.name || "",
        contactInfo: customer.contactInfo || "{}",
        source: lead.source,
        status: lead.status,
        aiScore: lead.aiScore,
        aiCategory: lead.aiCategory,
        type: project.type || "",
        address: customer.address || "",
        createdAt: lead.createdAt,
        budget: project.budget || "",
        areaSqft: project.areaSqft || 0,
        timeline: project.timeline || "",
        rawData: lead.rawData,
        campaignId: lead.campaignId || null
      };
    });

    if (sqlText.includes('landing')) {
      results = results.filter((r: any) => String(r.source).toLowerCase().includes('landing'));
    }

    // Sort by created_at desc
    results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`   [Interpreter Result] Leads count:`, results.length);
    return results;
  }

  // 4a. Campaigns list query:
  if (sqlText.includes('select') && sqlText.includes('from "campaigns"')) {
    const campaigns = dbData.campaigns || [];
    console.log(`   [Interpreter Result] Campaigns count:`, campaigns.length);
    return campaigns;
  }

  // 5. Update lead status/notes:
  // e.g. update "leads" set "status" = $1, "ai_category" = $2 ... where "leads"."id" = $3
  if (sqlText.includes('update "leads"')) {
    const leadId = params[params.length - 1];
    if (leadId) {
      const leadIndex = dbData.leads.findIndex((l: any) => l.id === leadId);
      if (leadIndex !== -1) {
        const lead = dbData.leads[leadIndex];
        params.forEach((param: any) => {
          if (typeof param === 'string') {
            const lowerParam = param.toLowerCase();
            if (['new', 'contacted', 'qualified', 'form filled', 'form pending'].includes(lowerParam)) {
              lead.status = param;
            } else if (['hot', 'warm', 'cold'].includes(param.toUpperCase())) {
              lead.aiCategory = param.toUpperCase();
            }
          } else if (typeof param === 'object' && param !== null) {
            lead.rawData = { ...lead.rawData, ...param };
          }
        });
        lead.updatedAt = new Date().toISOString();
        dbData.leads[leadIndex] = lead;
        saveMockDb(dbData);
        console.log(`   [Interpreter Result] Lead #${leadId} updated.`);
      }
    }
    return [{ affectedRows: 1 }];
  }

  // 6. Delete operations:
  if (sqlText.includes('delete from')) {
    const idParam = params[0];
    if (idParam && sqlText.includes('leads')) {
      dbData.leads = dbData.leads.filter((l: any) => l.id !== idParam);
      const customer = dbData.customers.find((c: any) => c.leadId === idParam);
      if (customer) {
        dbData.projects = dbData.projects.filter((p: any) => p.customerId !== customer.id);
        dbData.customers = dbData.customers.filter((c: any) => c.id !== customer.id);
      }
      saveMockDb(dbData);
      console.log(`   [Interpreter Result] Lead #${idParam} deleted.`);
    } else if (idParam && sqlText.includes('campaigns')) {
      dbData.campaigns = (dbData.campaigns || []).filter((c: any) => c.id !== idParam);
      dbData.leads.forEach((l: any) => {
        if (l.campaignId === idParam) {
          l.campaignId = null;
        }
      });
      saveMockDb(dbData);
      console.log(`   [Interpreter Result] Campaign #${idParam} deleted.`);
    }
    return [{ affectedRows: 1 }];
  }

  // 7. Insert operations:
  if (sqlText.includes('insert into')) {
    const tableMatch = sqlText.match(/insert into "([^"]+)"/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const parts = sqlText.split(/values/i);
      if (parts.length === 2) {
        const colPart = parts[0];
        const valPart = parts[1];
        
        const colStart = colPart.indexOf('(');
        const colEnd = colPart.lastIndexOf(')');
        const columns = colPart.substring(colStart + 1, colEnd).split(',').map(c => c.replace(/"/g, '').trim());
        
        const valBlock = valPart.split(/returning/i)[0].trim();
        const valStart = valBlock.indexOf('(');
        const valEnd = valBlock.lastIndexOf(')');
        const values = valBlock.substring(valStart + 1, valEnd).split(',').map(v => v.trim());

        const record: Record<string, any> = {};
        columns.forEach((col, idx) => {
          const valToken = values[idx];
          if (valToken && valToken.startsWith('$')) {
            const paramIdx = parseInt(valToken.slice(1), 10) - 1;
            record[col] = params[paramIdx];
          }
        });

        if (tableName === 'leads') {
          const newLead = {
            id: Math.max(...dbData.leads.map((l: any) => l.id), 0) + 1,
            source: record.source || 'Website',
            status: record.status || 'Form Pending',
            aiScore: record.ai_score || 0,
            aiCategory: record.ai_category || 'PENDING',
            rawData: record.raw_data || {},
            campaignId: record.campaign_id || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          dbData.leads.push(newLead);
          saveMockDb(dbData);
          console.log(`   [Interpreter Result] New Lead inserted: #${newLead.id}`);
          return [newLead];
        } else if (tableName === 'customers') {
          const newCustomer = {
            id: Math.max(...dbData.customers.map((c: any) => c.id), 0) + 1,
            leadId: record.lead_id,
            name: record.name || 'Not Specified',
            contactInfo: record.contact_info || '{}',
            address: record.address || '',
            createdAt: new Date().toISOString()
          };
          dbData.customers.push(newCustomer);
          saveMockDb(dbData);
          console.log(`   [Interpreter Result] New Customer inserted: #${newCustomer.id}`);
          return [newCustomer];
        } else if (tableName === 'projects') {
          const newProject = {
            id: Math.max(...dbData.projects.map((p: any) => p.id), 0) + 1,
            customerId: record.customer_id,
            type: record.type || 'PEB Structure',
            areaSqft: record.area_sqft || 0,
            budget: record.budget || '0',
            timeline: record.timeline || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          dbData.projects.push(newProject);
          saveMockDb(dbData);
          console.log(`   [Interpreter Result] New Project inserted: #${newProject.id}`);
          return [newProject];
        } else if (tableName === 'quotations') {
          const newQuotation = {
            id: Math.max(...(dbData.quotations || []).map((q: any) => q.id), 0) + 1,
            projectId: record.project_id,
            version: record.version || 1,
            totalAmount: record.total_amount || '0',
            pdfUrl: record.pdf_url || '',
            status: record.status || 'draft',
            createdAt: new Date().toISOString()
          };
          if (!dbData.quotations) dbData.quotations = [];
          dbData.quotations.push(newQuotation);
          saveMockDb(dbData);
          console.log(`   [Interpreter Result] New Quotation inserted: #${newQuotation.id}`);
          return [newQuotation];
        } else if (tableName === 'campaigns') {
          const newCampaign = {
            id: Math.max(...(dbData.campaigns || []).map((c: any) => c.id), 0) + 1,
            name: record.name || 'Unnamed Campaign',
            platform: record.platform || 'LinkedIn',
            status: record.status || 'active',
            targetId: record.target_id || '',
            budget: record.budget || 0,
            spent: record.spent || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if (!dbData.campaigns) dbData.campaigns = [];
          dbData.campaigns.push(newCampaign);
          saveMockDb(dbData);
          console.log(`   [Interpreter Result] New Campaign inserted: #${newCampaign.id}`);
          return [newCampaign];
        }
      }
    }
  }

  return [];
}

// Global flag to track connection health
const getDbMockFlag = () => {
  if ((globalThis as any).__useMockDb) return true;
  return false;
};

// Recursive Proxy builder to capture chain operations
function wrapBuilder(builder: any, operationName: string): any {
  if (!builder || typeof builder !== 'object') return builder;

  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        const originalThen = target.then;
        if (typeof originalThen === 'function') {
          return function(onfulfilled?: any, onrejected?: any) {
            if (getDbMockFlag()) {
              const { sql: sqlText, params } = target.toSQL();
              const p = runFallbackSql(sqlText, params);
              return onfulfilled ? p.then(onfulfilled) : p;
            }

            return originalThen.call(target, onfulfilled, async (err: any) => {
              if (err.message?.includes('tenant') || err.message?.includes('ENOTFOUND') || err.message?.includes('connection') || err.message?.includes('timeout') || err.code === 'XX000') {
                console.warn(`[Database Proxy] Query failed: ${err.message}. Enabling mock DB fallback.`);
                (globalThis as any).__useMockDb = true;
                
                const { sql: sqlText, params } = target.toSQL();
                try {
                  const fallbackResult = await runFallbackSql(sqlText, params);
                  if (onfulfilled) return onfulfilled(fallbackResult);
                  return fallbackResult;
                } catch (fallbackErr) {
                  console.error('[Database Proxy] Fallback query execution failed:', fallbackErr);
                }
              }
              if (onrejected) return onrejected(err);
              throw err;
            });
          };
        }
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return (...args: any[]) => {
          const res = val.apply(target, args);
          return wrapBuilder(res, operationName);
        };
      }
      return val;
    }
  });
}

export const db = new Proxy(realDb, {
  get(target, prop, receiver) {
    if (['select', 'insert', 'update', 'delete'].includes(prop as string)) {
      return (...args: any[]) => {
        const realCall = Reflect.get(target, prop, target);
        const queryInstance = realCall.apply(target, args);
        return wrapBuilder(queryInstance, prop as string);
      };
    }
    return Reflect.get(target, prop, receiver);
  }
});

export * from "./schema";
