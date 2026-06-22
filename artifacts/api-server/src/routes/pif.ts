import { Router } from "express";
import path from "path";
import ExcelJS from "exceljs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = Router();

// strict NA fallback resolver
const resolveField = (manualVal: any, aiVal: any) => {
  if (manualVal !== undefined && manualVal !== null && manualVal !== "") {
    return manualVal;
  }
  if (aiVal !== undefined && aiVal !== null && aiVal !== "") {
    return aiVal;
  }
  return "NA";
};

router.post("/pif/generate", async (req, res) => {
  try {
    const { manualData, fileData, fileName } = req.body;
    
    // 1. Ingestion Pipeline & Simulated AI Parsing
    let extractedData: any = {
      project_meta: {},
      structural: {},
      crane: {},
      mezzanine: {},
      schedule: {}
    };
    
    if (fileData) {
      const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
      const ext = path.extname(fileName || "").toLowerCase();
      let textContent = "";
      
      try {
        if (ext === '.pdf') {
          const pdfData = await pdfParse(buffer);
          textContent = pdfData.text;
        } else {
          textContent = buffer.toString('utf-8');
        }
      } catch (parseErr) {
        console.warn("Failed to parse file text content:", parseErr);
      }

      // Robust Line-Splitting & Key-Value Extraction Layer
      const lines = textContent.split(/\r?\n/);
      const parsedDoc: Record<string, string> = {};
      for (const line of lines) {
        if (line.includes(':')) {
           const idx = line.indexOf(':');
           const key = line.substring(0, idx).trim().toLowerCase();
           const val = line.substring(idx + 1).trim();
           // Remove any trailing periods or formatting noise if needed, but let's keep it literal
           parsedDoc[key] = val;
        }
      }

      // Fuzzy Finder helper to map Document Keys robustly
      const findValue = (searchKey: string) => {
        const k = searchKey.toLowerCase();
        for (const [docKey, docVal] of Object.entries(parsedDoc)) {
          if (docKey.includes(k)) return docVal;
        }
        return "";
      };

      // 1. Main Header Meta Keys
      extractedData.project_meta.client_name = findValue("client name");
      extractedData.project_meta.project_name = findValue("project name");
      
      // 2. Building Parameters Group
      extractedData.building_type = findValue("building type");
      extractedData.structural.width_m = findValue("clear span width");
      extractedData.structural.length_m = findValue("total length");
      extractedData.structural.clear_height_m = findValue("eave clear height");
      extractedData.structural.roof_slope = findValue("roof slope") || findValue("pitch");
      extractedData.structural.wind_bracing = findValue("wind bracing");
      extractedData.structural.gutter_type = findValue("type of gutter");
      extractedData.structural.downtake_pipe = findValue("downtake pipe");
      extractedData.structural.welding = findValue("welding standard");
      extractedData.structural.brick_wall = findValue("brick wall height");

      // 3. Secondary Framing Group
      extractedData.structural.purlins_girts = findValue("purlins & girts");
      extractedData.structural.sag_rods = findValue("sag rod");
      extractedData.structural.connection_bolts = findValue("connection bolt");
      extractedData.structural.insulation = findValue("insulation type");

      // 4. Crane & Mezzanine Groups
      extractedData.crane.capacity = findValue("crane capacity");
      extractedData.crane.type = findValue("crane type");
      extractedData.crane.hook_height = findValue("hook height minimum");
    }
    
    const mData = manualData || {};

    // 2. Output Generation using exceljs
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("PIF Document", {
      views: [{ showGridLines: false }]
    });

    // --- Style Configurations ---
    const TITLE_BG = "FFB8CCE3"; // Soft Ice Blue
    const SECTION_BG = "FFB7DEE8"; // Soft Light Teal/Blue
    const HEADER_ROW_BG = "FFEFEFEF"; // Light Gray
    
    const fontBase: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 11, bold: false };
    const fontBold: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 11, bold: true };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Columns setup (Sl.no, Description, Details)
    sheet.columns = [
      { width: 8 },
      { width: 55 },
      { width: 45 }
    ];

    let currentRow = 1;

    // Helper function to render a section header
    const renderSectionHeader = (title: string) => {
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const cell = sheet.getCell(`A${currentRow}`);
      cell.value = title;
      cell.font = fontBold;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
      cell.border = borderStyle;
      sheet.getCell(`B${currentRow}`).border = borderStyle;
      sheet.getCell(`C${currentRow}`).border = borderStyle;
      currentRow++;
      
      // Column sub-headers
      const cols = ["Sl.no", "Description", "Details"];
      cols.forEach((val, idx) => {
        const hCell = sheet.getCell(currentRow, idx + 1);
        hCell.value = val;
        hCell.font = fontBold;
        hCell.border = borderStyle;
        hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ROW_BG } };
      });
      currentRow++;
    };

    // Helper function to render a grid of rows
    const renderGridRows = (rows: any[][]) => {
      rows.forEach(row => {
        row.forEach((val, idx) => {
          const cell = sheet.getCell(currentRow, idx + 1);
          cell.value = val;
          cell.font = fontBase;
          cell.border = borderStyle;
        });
        currentRow++;
      });
    };

    // ==========================================
    // 1. Header Information
    // ==========================================
    sheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = "PROJECT INFORMATION FORM (PIF)";
    titleCell.font = fontBold;
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_BG } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = borderStyle;
    sheet.getCell(`B${currentRow}`).border = borderStyle;
    sheet.getCell(`C${currentRow}`).border = borderStyle;
    currentRow++;

    const topHeaders = [
      ["QRF NO", resolveField(mData.qrfNo, extractedData.project_meta.qrf_no)],
      ["Client Name", resolveField(mData.clientName, extractedData.project_meta.client_name)],
      ["Job No", resolveField(mData.jobNo, extractedData.project_meta.job_no)],
      ["Department", resolveField(mData.department, extractedData.project_meta.department)],
      ["Type of Industries", resolveField(mData.industryType, extractedData.project_meta.industry_type)],
      ["Project Name", resolveField(mData.projectName, extractedData.project_meta.project_name)],
      ["RFQ", resolveField(mData.rfq, extractedData.project_meta.rfq)],
      ["PIF REV", resolveField(mData.pifRev, extractedData.project_meta.pif_rev)]
    ];

    topHeaders.forEach(([label, value]) => {
      sheet.getCell(`A${currentRow}`).value = label;
      sheet.getCell(`A${currentRow}`).font = fontBold;
      sheet.getCell(`A${currentRow}`).border = borderStyle;
      
      sheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const valCell = sheet.getCell(`B${currentRow}`);
      valCell.value = value;
      valCell.font = fontBase;
      valCell.border = borderStyle;
      sheet.getCell(`C${currentRow}`).border = borderStyle;
      currentRow++;
    });
    currentRow++; // Empty spacing row

    // ==========================================
    // 2. (Building-1) Building Parameters Details Table
    // ==========================================
    renderSectionHeader("(Building-1) Building Parameters Details");
    renderGridRows([
      ["1", "Building Type", resolveField(mData.buildingType, extractedData.building_type)],
      ["2", "Width (m)", resolveField(mData.width, extractedData.structural.width_m)],
      ["3", "Length(m)", resolveField(mData.length, extractedData.structural.length_m)],
      ["4", "Clear height (m)", resolveField(mData.eaveHeight, extractedData.structural.clear_height_m)],
      ["5", "Width Module", resolveField(mData.widthModule, extractedData.structural.width_module)],
      ["6", "Roof Slope", resolveField(mData.roofSlope, extractedData.structural.roof_slope)],
      ["7", "Side Wall Column spacing (m) (C/C)", resolveField(mData.sideWallSpacing, extractedData.structural.side_wall_spacing)],
      ["8", "End Wall Col Spacing (C/C)", resolveField(mData.endWallSpacing, extractedData.structural.end_wall_spacing)],
      ["9", "Wind Bracing at Roof, Wall & Intermediate column lines", resolveField(mData.windBracing, extractedData.structural.wind_bracing)],
      ["10", "Type Of gutter", resolveField(mData.gutterType, extractedData.structural.gutter_type)],
      ["11", "Eave Condition", resolveField(mData.eaveCondition, extractedData.structural.eave_condition)],
      ["12", "Downtake Pipe", resolveField(mData.downtakePipe, extractedData.structural.downtake_pipe)],
      ["13", "Welding", resolveField(mData.welding, extractedData.structural.welding)],
      ["14", "Brick wall", resolveField(mData.brickWall, extractedData.structural.brick_wall)]
    ]);
    currentRow++;

    // ==========================================
    // 3. Secondary Framing Group (Rows 16-24)
    // ==========================================
    renderSectionHeader("Secondary Framing Group");
    renderGridRows([
      ["1", "Purlins & Girts", resolveField(mData.purlinsGirts, extractedData.structural.purlins_girts)],
      ["2", "Sag rod", resolveField(mData.sagRods, extractedData.structural.sag_rods)],
      ["3", "Connection bolts", resolveField(mData.connectionBolts, extractedData.structural.connection_bolts)],
      ["4", "Insulation", resolveField(mData.insulation, extractedData.structural.insulation)]
    ]);
    currentRow++;

    // ==========================================
    // 3. Crane Details Section Table
    // ==========================================
    renderSectionHeader("Crane Details Section");
    renderGridRows([
      ["1", "Nos of Crane", resolveField(mData.nosOfCrane, extractedData.crane.nos_of_crane)],
      ["2", "Capacity of Crane", resolveField(mData.craneCapacity, extractedData.crane.capacity)],
      ["3", "Run", resolveField(mData.craneRun, extractedData.crane.run)],
      ["4", "Type of Crane", resolveField(mData.craneType, extractedData.crane.type)],
      ["5", "Hook Height", resolveField(mData.craneHookHeight, extractedData.crane.hook_height)],
      ["6", "Crane Data", resolveField(mData.craneData, extractedData.crane.data)],
      ["7", "Crane Walk way", resolveField(mData.craneWalkway, extractedData.crane.walkway)],
      ["8", "Crane Operations", resolveField(mData.craneOperations, extractedData.crane.operations)],
      ["9", "Note", resolveField(mData.craneNote, extractedData.crane.note)]
    ]);
    currentRow++;

    // ==========================================
    // 4. Mezzanine Floor Details Section Table
    // ==========================================
    renderSectionHeader("Mezzanine Floor Details Section");
    renderGridRows([
      ["1", "Mezzanine Area", resolveField(mData.mezzanineArea, extractedData.mezzanine.area)],
      ["2", "Mezzanine Column Spacing", resolveField(mData.mezzanineColSpacing, extractedData.mezzanine.col_spacing)],
      ["3", "Height", resolveField(mData.mezzanineHeight, extractedData.mezzanine.height)],
      ["4", "Live Load", resolveField(mData.mezzanineLiveLoad, extractedData.mezzanine.live_load)],
      ["5", "Dead Load", resolveField(mData.mezzanineDeadLoad, extractedData.mezzanine.dead_load)],
      ["6", "Mezzanine Beam Depth", resolveField(mData.mezzanineBeamDepth, extractedData.mezzanine.beam_depth)],
      ["7", "Staircase and Handrails", resolveField(mData.mezzanineStairs, extractedData.mezzanine.stairs)],
      ["8", "Handrails on Mezzanine", resolveField(mData.mezzanineHandrails, extractedData.mezzanine.handrails)],
      ["9", "Checkered Plate", resolveField(mData.mezzanineCheckeredPlate, extractedData.mezzanine.checkered_plate)],
      ["10", "Deck Sheet", resolveField(mData.mezzanineDeckSheet, extractedData.mezzanine.deck_sheet)]
    ]);
    currentRow++;

    // ==========================================
    // 5. Commited Schedule Details & Validation Section Table
    // ==========================================
    renderSectionHeader("Commited Schedule Details & Validation Section");
    renderGridRows([
      ["1", "LOI /PO", resolveField(mData.schLoiPo, extractedData.schedule.loi_po)],
      ["2", "Coloumn Reaction", resolveField(mData.schColReaction, extractedData.schedule.col_reaction)],
      ["3", "STAAD Approvals", resolveField(mData.schStaadApp, extractedData.schedule.staad_approvals)],
      ["4", "AB Submission", resolveField(mData.schAbSub, extractedData.schedule.ab_submission)],
      ["5", "AB Approvals", resolveField(mData.schAbApp, extractedData.schedule.ab_approvals)]
    ]);

    // Generate output buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Final_Unified_PIF.xlsx"',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    });
    res.end(Buffer.from(buffer));
    
  } catch (err: any) {
    console.error("PIF Generation Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
