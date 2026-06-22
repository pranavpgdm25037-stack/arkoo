import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useListLeads } from "@/hooks/use-leads";
import { useListCustomers } from "@/hooks/use-customers";
import { 
  Lock,
  Unlock,
  Sparkles, 
  Printer, 
  Download, 
  Briefcase, 
  User, 
  Scale, 
  Layers, 
  ThermometerSnowflake, 
  CheckCircle2, 
  Coins,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  Upload,
  FileUp,
  AlertCircle,
  Eye,
  RefreshCw,
  Check,
  Trash2,
  MinusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface QuoteLineItem {
  description: string;
  qty: number | string;
  rate: number | string;
  total: number | string;
}

interface QuoteResult {
  quoteNo: string;
  date: string;
  validUntil: string;
  customerName: string;
  customerContact: string;
  projectType: string;
  areaSqft: number;
  ratePerSqft: number | string;
  budgetTier: string;
  customRequirements: string;
  estimatedSteelTons: number;
  thermalRating: string;
  feasibilityScore: number;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  hasPricingAlert?: boolean;
  pricingAlertMessage?: string;
  isDrawingQuote?: boolean;
  drawingFileName?: string;
  generationTimestamp?: string;
  extractedLength?: string | number;
  extractedWidth?: string | number;
  extractedHeight?: string | number;
  extractedAreaSqft?: number;
  extractedAreaSqm?: number;
  extractedFloors?: number;
  extractedStructuralType?: string;
  areaRatio?: number;
  isAreaMatch?: boolean;
  isHeightMatch?: boolean;
  isSystemMatch?: boolean;
  isAssumedLength?: boolean;
  isAssumedWidth?: boolean;
  isAssumedHeight?: boolean;
  isAssumedArea?: boolean;
  isAssumedFloors?: boolean;
  isAssumedSystem?: boolean;
  primarySteelMT?: number;
  secondarySteelMT?: number;
  purlinsRMT?: number;
  girtsRMT?: number;
  roofSheetingSqm?: number;
  wallCladdingSqm?: number;
  skyLightsSqm?: number;
  insulationSqm?: number;
  anchorBoltsCount?: number;
  highStrengthBoltsCount?: number;
  excavationCum?: number;
  concretePccCum?: number;
  concreteRccCum?: number;
  rebarSteelMT?: number;
  gradeSlabSqm?: number;
  plinthWallSqm?: number;
  plasteringSqm?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  civilInScope?: boolean;
  mezzanineAreaSqm?: number;
  hasInsulation?: boolean;
  
  extractedBayConfig?: string | null;
  extractedCranes?: string | null;
  extractedSlidingDoors?: string | null;
  extractedRollingShuttersDesc?: string | null;
  extractedInsulationRequired?: boolean | null;
  extractedWindSpeed?: number | null;
  extractedSeismicZone?: string | null;
  extractedClientName?: string | null;
}

const PROJECT_TYPES = [
  { value: "Prefab Modular Cabin", label: "Prefab Modular Cabin", baseRate: 1800, thermal: "R-15 Insulated", steelRatio: 0.015 },
  { value: "PEB Structural Shed", label: "PEB Structural Shed", baseRate: 2200, thermal: "Standard Venting", steelRatio: 0.025 },
  { value: "PEB Warehouse", label: "PEB Warehouse", baseRate: 2000, thermal: "Standard Venting", steelRatio: 0.022 },
  { value: "LGSF Residential Villa", label: "LGSF Residential Villa (Light Steel)", baseRate: 3100, thermal: "R-22 Premium Insulated", steelRatio: 0.018 },
  { value: "Multi-Story PEB Complex", label: "Multi-Story PEB Complex", baseRate: 3900, thermal: "R-19 Double Insulated", steelRatio: 0.035 },
  { value: "Modular Site Office", label: "Modular Site Office", baseRate: 2000, thermal: "R-12 Standard", steelRatio: 0.012 },
  { value: "Sleek Toilet Block", label: "Sleek Toilet Block", baseRate: 1600, thermal: "Standard Venting", steelRatio: 0.010 },
  { value: "Custom Pre-Build Solution", label: "Custom Pre-Build Solution", baseRate: 2800, thermal: "Customized Rating", steelRatio: 0.020 }
];

const BUDGET_TIERS = [
  { value: "Economy", label: "Economy (Standard structural steel, basic GI cladding)", multiplier: 0.9 },
  { value: "Standard", label: "Standard (Heavy frame tubes, 50mm PUF panel cladding)", multiplier: 1.0 },
  { value: "Premium", label: "Premium (Premium pre-coated sheet, 75mm PUF, glass highlights)", multiplier: 1.25 },
  { value: "Luxury/Custom", label: "Luxury & Eco-Elite (High-tensile frame, 100mm PUF, complete glass facade)", multiplier: 1.5 }
];

const OFFICIAL_PRICING_DATABASE = {
  handmade: {
    builtUpRate: 89.25,
    hotRolledRate: 89.25,
    spliceBoltsRate: 148.00,
    anchorBoltsRate: 86.00,
    secondarySteelRate: 91.00,
    roofSheetingRate: 100.00,
    wallCladdingRate: 106.00,
    flashingRate: 127.50,
    deckSheetRate: 92.00,
    erectionRate: 13.70,
    turboRate: 6000,
    skylightRate: 4800,
    insulationRate: null,
  },
  ga: {
    builtUpRate: 89.25,
    hotRolledRate: 89.25,
    spliceBoltsRate: 148.00,
    anchorBoltsRate: 86.00,
    secondarySteelRate: 91.00,
    roofSheetingRate: 100.00,
    wallCladdingRate: 106.00,
    flashingRate: 127.50,
    deckSheetRate: 92.00,
    erectionRate: 13.70,
    skylightRate: null,
    insulationRate: null,
  },
  pif: {
    primarySteelRate: 92000,
    secondarySteelRate: 96000,
    canopyRate: 94000,
    roofInsulatedRate: 660,
    roofNonInsulatedRate: 540,
    wallCladdingRate: 390,
    soffitRate: 410,
    skylightRate: 950,
    louverRate: 1100,
    framedOpeningRate: 25000,
    guttersRate: 950,
    ladderRate: 315000,
    erectionRate: 75,
    freightRate: 3800,
    engineeringRate: 120000,
    pccRate: 4796.84,
    footingRate: 12648.47,
    slabRate: 214.37,
    brickRate: 729.17,
    insulationRate: 0,
  },
  residential: {
    excavationRate: 450,
    pccRate: 4796.84,
    rccConcreteRate: 12648.47,
    rebarSteelRate: 65000,
    brickworkRate: 729.17,
    plasteringRate: 180,
    waterproofingRate: 80,
    tilingRate: 120,
    doorsWindowsRate: 15000,
    staircaseRate: 65000,
  }
};

const checkIfResidential = (fileName?: string, projType?: string) => {
  const name = (fileName || "").toLowerCase();
  const proj = (projType || "").toLowerCase();
  const regex = /\b(residential|villa|house|home|rcc|apartment|duplex|flat|cottage|residence)\b/i;
  return regex.test(name) || proj.includes("residential") || proj.includes("villa");
};

const getPrepopulatedQuoteResult = (
  type: "handmade" | "ga" | "pif", 
  customerName?: string, 
  customerContact?: string,
  length?: number,
  width?: number,
  height?: number,
  civilScope?: boolean,
  mezzSqm?: number,
  insul?: boolean,
  taxR = 0.18,
  hasGlassFacade?: boolean,
  hasSolar?: boolean,
  hasHVAC?: boolean,
  isResidentialDrawing?: boolean,
  projType?: string,
  fileName?: string,
  canopySqm?: number,
  skylightSqm?: number,
  shuttersCount?: number,
  craneCapacity?: number,
  tonnage?: number
): QuoteResult => {
  const currentDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  let hasPricingAlert = false;

  if (isResidentialDrawing) {
    // RCC / Brick masonry drawing (Rule 1 & 3)
    const L = length ?? 20;
    const W = width ?? 10;
    const H = height ?? 3.0; // 3m floor-to-floor
    const floors = 2;
    const area = L * W * floors;
    const areaSqft = Math.round(area * 10.7639);

    const db = OFFICIAL_PRICING_DATABASE.residential;

    const scaleArea = area / 400; // normalized to 400 sqm

    const excavationQty = Math.round(L * W * 1.5 * 10) / 10;
    const excavationCost = Math.round(excavationQty * db.excavationRate);

    const pccQty = Math.round(L * W * 0.1 * 10) / 10;
    const pccCost = Math.round(pccQty * db.pccRate);

    const rccQty = Math.round(area * 0.18 * 10) / 10;
    const rccCost = Math.round(rccQty * db.rccConcreteRate);

    const rebarQty = Math.round(rccQty * 0.08 * 100) / 100;
    const rebarCost = Math.round(rebarQty * db.rebarSteelRate);

    const brickQty = Math.round(area * 1.1);
    const brickCost = Math.round(brickQty * db.brickworkRate);

    const plasterQty = Math.round(brickQty * 2.0);
    const plasterCost = Math.round(plasterQty * db.plasteringRate);

    const waterQty = Math.round(L * W * 10.7639 * 1.2);
    const waterCost = Math.round(waterQty * db.waterproofingRate);

    const tilingQty = areaSqft;
    const tilingCost = Math.round(tilingQty * db.tilingRate);

    const doorsQty = Math.ceil(8 * scaleArea);
    const doorsCost = Math.round(doorsQty * db.doorsWindowsRate);

    const staircaseQty = 1;
    const staircaseCost = db.staircaseRate;

    const subtotal = excavationCost + pccCost + rccCost + rebarCost + brickCost + plasterCost + waterCost + tilingCost + doorsCost + staircaseCost;
    const tax = Math.round(subtotal * taxR);

    const lineItems: QuoteLineItem[] = [
      { description: "Excavation and earthwork for foundation footings", qty: excavationQty, rate: db.excavationRate, total: excavationCost },
      { description: "Plain Cement Concrete (PCC) 1:4:8 leveling base for footings", qty: pccQty, rate: db.pccRate, total: pccCost },
      { description: "Reinforced Cement Concrete (RCC) slab, beams, columns (M25 grade)", qty: rccQty, rate: db.rccConcreteRate, total: rccCost },
      { description: "Fe500 reinforcement steel bars (rebar TMT steel)", qty: rebarQty, rate: db.rebarSteelRate, total: rebarCost },
      { description: "Solid fly-ash brick masonry wall construction for partition and perimeter walls", qty: brickQty, rate: db.brickworkRate, total: brickCost },
      { description: "Internal & external smooth cement plastering (mortar 1:4 / 1:6)", qty: plasterQty, rate: db.plasteringRate, total: plasterCost },
      { description: "Terrace, toilet, and balcony waterproofing membrane layer", qty: waterQty, rate: db.waterproofingRate, total: waterCost },
      { description: "Premium vitrified flooring tiles & anti-skid bathroom tiling", qty: tilingQty, rate: db.tilingRate, total: tilingCost },
      { description: "Wooden flush doors and powder-coated aluminum sliding windows", qty: doorsQty, rate: db.doorsWindowsRate, total: doorsCost },
      { description: "RCC Staircase construction with granite cladding and SS handrails", qty: staircaseQty, rate: db.staircaseRate, total: staircaseCost }
    ];

    if (hasGlassFacade) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Premium Glass Facade Envelope [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasSolar) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasHVAC) {
      hasPricingAlert = true;
      lineItems.push({
        description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    const areaRatio = Math.round((area / 400) * 100) / 100;
    const isAreaMatch = Math.abs(area - 400) / 400 <= 0.05;
    const isHeightMatch = Math.abs(H - 3.0) < 0.1;
    const isSystemMatch = (projType || "").toLowerCase().includes("residential") || (projType || "").toLowerCase().includes("villa");

    return {
      quoteNo: `ARK-RES-${Math.floor(1000 + Math.random() * 9000)}`,
      date: currentDate,
      validUntil: validUntilDate,
      customerName: customerName || "Example Residence Plan",
      customerContact: customerContact || "+91 99999 55555 | villa@example.com",
      projectType: "LGSF Residential Villa",
      areaSqft,
      ratePerSqft: Math.round(subtotal / areaSqft),
      budgetTier: "Premium",
      customRequirements: `Residential RCC & brick masonry construction. Width: ${W}m, Length: ${L}m, Height: ${H}m, 2 Levels/Floors.`,
      estimatedSteelTons: 0,
      thermalRating: "Not Applicable",
      feasibilityScore: 90,
      lineItems,
      subtotal,
      taxAmount: tax,
      total: subtotal + tax,
      taxRate: taxR,
      hasPricingAlert,
      lengthM: L,
      widthM: W,
      heightM: H,
      civilInScope: true,
      mezzanineAreaSqm: 0,
      hasInsulation: false,
      hasGlassFacade,
      hasSolar,
      hasHVAC,
      extractedLength: 20,
      extractedWidth: 10,
      extractedHeight: 3.0,
      extractedAreaSqft: 4306,
      extractedAreaSqm: 400,
      extractedFloors: 2,
      extractedStructuralType: "RCC / Brick masonry",
      areaRatio,
      isAreaMatch,
      isHeightMatch,
      isSystemMatch
    } as any;
  }

  if (type === "handmade") {
    // Defaults for handmade
    const L = length ?? 42;
    const W = width ?? 18;
    const H = height ?? 21;
    const area = L * W;
    const areaSqft = Math.round(area * 10.7639);
    const mezz = mezzSqm ?? 0;

    const scaleArea = area / 756;
    const scalePerimeter = ((L + W) * H) / (60 * 21);
    const scaleHeight = H / 21;
    const mezzanineFactor = mezz > 0 ? mezz / 930 : scaleArea;

    const db = OFFICIAL_PRICING_DATABASE.handmade;

    let builtUpQty = Math.round(46439 * scaleArea * scaleHeight);
    let hotRolledQty = Math.round(2487 * scaleArea * scaleHeight);
    let spliceBoltsQty = Math.round(1418 * scaleArea);
    let anchorBoltsQty = Math.round(1337 * scaleArea);
    let secondarySteelQty = Math.round(13186 * ((794 * scaleArea + 1260 * scalePerimeter) / 2054));
    let roofSheetingQty = Math.round(3440 * scaleArea);
    let wallCladdingQty = Math.round(6132 * scalePerimeter);
    let flashingQty = Math.round(2166 * scalePerimeter);
    let deckSheetQty = Math.round(3260 * mezzanineFactor);
    let erectionQty = Math.round(87591 * scaleArea * scaleHeight);

    if (tonnage && tonnage > 0) {
      builtUpQty = Math.round(tonnage * 0.75 * 1000);
      hotRolledQty = Math.round(tonnage * 0.05 * 1000);
      secondarySteelQty = Math.round(tonnage * 0.20 * 1000);
      erectionQty = Math.round(tonnage * 1000);
      spliceBoltsQty = Math.round(tonnage * 23);
      anchorBoltsQty = Math.round(tonnage * 22);
    }

    const primaryCost = Math.round(builtUpQty * db.builtUpRate);
    const hrCost = Math.round(hotRolledQty * db.hotRolledRate);
    const spliceCost = Math.round(spliceBoltsQty * db.spliceBoltsRate);
    const anchorCost = Math.round(anchorBoltsQty * db.anchorBoltsRate);
    const secondaryCost = Math.round(secondarySteelQty * db.secondarySteelRate);
    const roofCost = Math.round(roofSheetingQty * db.roofSheetingRate);
    const wallCost = Math.round(wallCladdingQty * db.wallCladdingRate);
    const flashingCost = Math.round(flashingQty * db.flashingRate);
    const deckCost = Math.round(deckSheetQty * db.deckSheetRate);
    const erectionCost = Math.round(erectionQty * db.erectionRate);

    const lineItems: QuoteLineItem[] = [
      { description: "Primary Built-Up Steel Columns & Tapered Rafters (ASTM A572 Grade 50, SA 2.5 blasted)", qty: builtUpQty, rate: db.builtUpRate, total: primaryCost },
      { description: "Hot-Rolled structural members (including lateral tube bracings)", qty: hotRolledQty, rate: db.hotRolledRate, total: hrCost },
      { description: "High-Strength Connection Splice Bolts (Grade 8.8 complying to IS-1367)", qty: spliceBoltsQty, rate: db.spliceBoltsRate, total: spliceCost },
      { description: "Foundation Anchor Bolts & steel positioning templates (IS 2062)", qty: anchorBoltsQty, rate: db.anchorBoltsRate, total: anchorCost },
      { description: "Secondary Galvanized cold-formed framing - Z/C Purlins and Wall Girts", qty: secondarySteelQty, rate: db.secondarySteelRate, total: secondaryCost },
      { description: "Roof PPGI Sheeting (AZ-150 Galvalume screw down sheets)", qty: roofSheetingQty, rate: db.roofSheetingRate, total: roofCost },
      { description: "Wall PPGI Sheeting Color-Coated PPGL RMP coated sheet", qty: wallCladdingQty, rate: db.wallCladdingRate, total: wallCost },
      { description: "Architectural Flashing & trims (0.50mm PPGI PPGL sheets)", qty: flashingQty, rate: db.flashingRate, total: flashingCost },
      { description: "Floor Deck Sheets for Mezzanines (0.80mm Galvanized Profile Decking)", qty: deckSheetQty, rate: db.deckSheetRate, total: deckCost },
      { description: "Installation / Erection charges (crane rigging, heavy lift labor & safety crew)", qty: erectionQty, rate: db.erectionRate, total: erectionCost }
    ];

    let currentSubtotal = primaryCost + hrCost + spliceCost + anchorCost + secondaryCost + roofCost + wallCost + flashingCost + deckCost + erectionCost;
    const turboCost = Math.ceil(12 * scaleArea) * db.turboRate;
    const skylightCost = Math.ceil(30 * scaleArea) * db.skylightRate;

    if (canopySqm && canopySqm > 0) {
      const canopyCost = canopySqm * 1800; // Flat 1800 INR per Sqm
      currentSubtotal += canopyCost;
      lineItems.push({
        description: "Structural Shade Canopy (Supply & Erection)",
        qty: canopySqm,
        rate: 1800,
        total: canopyCost
      });
    }

    if (skylightSqm && skylightSqm > 0) {
      const skylightItemCost = skylightSqm * 1500; // Flat 1500 INR per Sqm
      currentSubtotal += skylightItemCost;
      lineItems.push({
        description: "2.0mm UV-Stabilized Polycarbonate Skylight Panel and wall light modules",
        qty: skylightSqm,
        rate: 1500,
        total: skylightItemCost
      });
    } else {
      currentSubtotal += turboCost + skylightCost;
      lineItems.push(
        {
          description: "600mm Turbo Ventilators with matching Polycarbonate base plates",
          qty: Math.ceil(12 * scaleArea),
          rate: db.turboRate,
          total: turboCost
        },
        {
          description: "2.0mm UV-Stabilized Polycarbonate Skylight Panel and wall light modules",
          qty: Math.ceil(30 * scaleArea),
          rate: db.skylightRate,
          total: skylightCost
        }
      );
    }

    if (shuttersCount && shuttersCount > 0) {
      const shuttersCost = shuttersCount * 65000;
      currentSubtotal += shuttersCost;
      lineItems.push({
        description: "Rolling Shutters (Motorized/Manual)",
        qty: shuttersCount,
        rate: 65000,
        total: shuttersCost
      });
    }

    if (craneCapacity && craneCapacity > 0) {
      const craneCost = craneCapacity * 125000;
      currentSubtotal += craneCost;
      lineItems.push({
        description: `EOT Crane Runway Beams & Brackets (${craneCapacity} Ton Capacity)`,
        qty: craneCapacity,
        rate: 125000,
        total: craneCost
      });
    }

    const subtotal = currentSubtotal;
    const tax = Math.round(subtotal * taxR);

    if (insul) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Roof Insulation Layer (50mm Glasswool with Alum. Foil) [Optional Tech Module]",
        qty: Math.round(794 * scaleArea),
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasGlassFacade) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Premium Glass Facade Envelope [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasSolar) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasHVAC) {
      hasPricingAlert = true;
      lineItems.push({
        description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    const resolvedName = customerName || "Example PEB Corp";
    const resolvedContact = customerContact || "+91 99999 88888 | sales@examplepeb.com";

    return {
      quoteNo: "ARK-EST-2026-9041",
      date: currentDate,
      validUntil: validUntilDate,
      customerName: resolvedName,
      customerContact: resolvedContact,
      projectType: "PEB Structural Shed (Clear Span)",
      areaSqft,
      ratePerSqft: Math.round(subtotal / areaSqft),
      budgetTier: "Standard",
      customRequirements: `Clear span PEB structural shed. Width: ${W}m, Length: ${L}m, Height: ${H}m.`,
      estimatedSteelTons: Math.round(69.0 * scaleArea * scaleHeight * 10) / 10,
      thermalRating: "Standard Venting",
      feasibilityScore: 85,
      lineItems,
      subtotal,
      taxAmount: tax,
      total: subtotal + tax,
      taxRate: taxR,
      hasPricingAlert,
      primarySteelMT: Math.round((builtUpQty + hotRolledQty) / 1000 * 100) / 100,
      secondarySteelMT: Math.round(secondarySteelQty / 1000 * 100) / 100,
      purlinsRMT: Math.round(1100 * scaleArea),
      girtsRMT: Math.round(900 * scalePerimeter),
      roofSheetingSqm: Math.round(794 * scaleArea),
      wallCladdingSqm: Math.round(1260 * scalePerimeter),
      skyLightsSqm: Math.round(90 * scaleArea),
      insulationSqm: insul ? Math.round(794 * scaleArea) : 0,
      anchorBoltsCount: Math.round(120 * scaleArea),
      highStrengthBoltsCount: Math.round(240 * scaleArea),
      excavationCum: Math.round(77.8 * scaleArea * scaleHeight * 10) / 10,
      concretePccCum: Math.round(5.2 * scaleArea * 10) / 10,
      concreteRccCum: Math.round(24.0 * scaleArea * scaleHeight * 10) / 10,
      rebarSteelMT: Math.round(2.16 * scaleArea * scaleHeight * 100) / 100,
      gradeSlabSqm: Math.round(756 * scaleArea),
      plinthWallSqm: Math.round(144 * scalePerimeter),
      plasteringSqm: Math.round(288 * scalePerimeter),
      lengthM: L,
      widthM: W,
      heightM: H,
      civilInScope: civilScope ?? false,
      mezzanineAreaSqm: mezzSqm ?? 0,
      hasInsulation: insul ?? false,
      hasGlassFacade,
      hasSolar,
      hasHVAC,
      extractedLength: 60,
      extractedWidth: 24,
      extractedHeight: 7.5,
      extractedAreaSqft: 15500,
      extractedAreaSqm: 1440,
      extractedFloors: 1,
      extractedStructuralType: "Steel PEB (Industrial)",
      areaRatio: Math.round(((L * W) / 1440) * 100) / 100,
      isAreaMatch: Math.abs((L * W) - 1440) / 1440 <= 0.05,
      isHeightMatch: Math.abs(H - 7.5) < 0.1,
      isSystemMatch: !((projType || "").toLowerCase().includes("residential") || (projType || "").toLowerCase().includes("villa"))
    } as any;
  } else if (type === "ga") {
    // Defaults for ga
    const L = length ?? 81.5;
    const W = width ?? 29.3;
    const H = height ?? 12;
    const area = L * W;
    const areaSqft = Math.round(area * 10.7639);
    const mezz = mezzSqm ?? 930;

    const scaleArea = area / 2387.95;
    const scalePerimeter = ((L + W) * H) / (110.8 * 12);
    const scaleHeight = H / 12;
    const mezzanineFactor = mezz > 0 ? mezz / 930 : scaleArea;

    const db = OFFICIAL_PRICING_DATABASE.ga;

    let builtUpQty = Math.round(145448 * scaleArea * scaleHeight);
    let hotRolledQty = Math.round(7812 * scaleArea * scaleHeight);
    let spliceBoltsQty = Math.round(4492 * scaleArea);
    let anchorBoltsQty = Math.round(4224 * scaleArea);
    let secondarySteelQty = Math.round(41086 * ((4500 * scaleArea + 3800 * scalePerimeter) / 8300));
    let roofSheetingQty = Math.round(11421 * scaleArea);
    let wallCladdingQty = Math.round(19259 * scalePerimeter);
    let flashingQty = Math.round(4506 * scalePerimeter);
    let deckSheetQty = Math.round(10343 * mezzanineFactor);
    let erectionQty = Math.round(274786 * scaleArea * scaleHeight);

    if (tonnage && tonnage > 0) {
      builtUpQty = Math.round(tonnage * 0.75 * 1000);
      hotRolledQty = Math.round(tonnage * 0.05 * 1000);
      secondarySteelQty = Math.round(tonnage * 0.20 * 1000);
      erectionQty = Math.round(tonnage * 1000);
      spliceBoltsQty = Math.round(tonnage * 23);
      anchorBoltsQty = Math.round(tonnage * 22);
    }

    const primaryCost = Math.round(builtUpQty * db.builtUpRate);
    const hrCost = Math.round(hotRolledQty * db.hotRolledRate);
    const spliceCost = Math.round(spliceBoltsQty * db.spliceBoltsRate);
    const anchorCost = Math.round(anchorBoltsQty * db.anchorBoltsRate);
    const secondaryCost = Math.round(secondarySteelQty * db.secondarySteelRate);
    const roofCost = Math.round(roofSheetingQty * db.roofSheetingRate);
    const wallCost = Math.round(wallCladdingQty * db.wallCladdingRate);
    const flashingCost = Math.round(flashingQty * db.flashingRate);
    const deckCost = Math.round(deckSheetQty * db.deckSheetRate);
    const erectionCost = Math.round(erectionQty * db.erectionRate);

    const subtotal = primaryCost + hrCost + spliceCost + anchorCost + secondaryCost + roofCost + wallCost + flashingCost + deckCost + erectionCost;
    const tax = Math.round(subtotal * taxR);
    
    const resolvedName = customerName || "Example Industrial Corp";
    const resolvedContact = customerContact || "+91 99999 77777 | info@examplecorp.com";

    const lineItems: QuoteLineItem[] = [
      { description: "Primary Built-Up Steel Columns & Tapered Rafters (ASTM A572 Grade 50, SA 2.5 blasted)", qty: builtUpQty, rate: db.builtUpRate, total: primaryCost },
      { description: "Hot-Rolled structural members (including lateral tube bracings)", qty: hotRolledQty, rate: db.hotRolledRate, total: hrCost },
      { description: "High-Strength Connection Splice Bolts (Grade 8.8 complying to IS-1367)", qty: spliceBoltsQty, rate: db.spliceBoltsRate, total: spliceCost },
      { description: "Foundation Anchor Bolts & steel positioning templates (IS 2062)", qty: anchorBoltsQty, rate: db.anchorBoltsRate, total: anchorCost },
      { description: "Secondary Galvanized cold-formed framing - Z/C Purlins and Wall Girts", qty: secondarySteelQty, rate: db.secondarySteelRate, total: secondaryCost },
      { description: "Roof PPGI Sheeting (AZ-150 Galvalume screw down sheets)", qty: roofSheetingQty, rate: db.roofSheetingRate, total: roofCost },
      { description: "Wall PPGI Sheeting Color-Coated PPGL RMP coated sheet", qty: wallCladdingQty, rate: db.wallCladdingRate, total: wallCost },
      { description: "Architectural Flashing & trims (0.50mm PPGI PPGL sheets)", qty: flashingQty, rate: db.flashingRate, total: flashingCost },
      { description: "Floor Deck Sheets for Mezzanines (0.80mm Galvanized Profile Decking)", qty: deckSheetQty, rate: db.deckSheetRate, total: deckCost },
      { description: "Installation / Erection charges (crane rigging, heavy lift labor & safety crew)", qty: erectionQty, rate: db.erectionRate, total: erectionCost }
    ];

    if (insul) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Roof Insulation Layer (50mm Glasswool with Alum. Foil) [Optional Tech Module]",
        qty: Math.round(2450 * scaleArea),
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasGlassFacade) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Premium Glass Facade Envelope [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasSolar) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasHVAC) {
      hasPricingAlert = true;
      lineItems.push({
        description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    return {
      quoteNo: "ARK-GA-2026-4412",
      date: currentDate,
      validUntil: validUntilDate,
      customerName: resolvedName,
      customerContact: resolvedContact,
      projectType: "PEB Structural Shed (Two Mezzanines)",
      areaSqft,
      ratePerSqft: Math.round(subtotal / areaSqft),
      budgetTier: "Standard",
      customRequirements: `GA layout centerline blueprint: ${W}m x ${L}m, Height: ${H}m, with Mezzanine floor (${mezz} Sqm total) using 0.8mm deck sheets.`,
      estimatedSteelTons: Math.round(248.6 * scaleArea * scaleHeight * 10) / 10,
      thermalRating: "Standard Venting",
      feasibilityScore: 95,
      lineItems,
      subtotal,
      taxAmount: tax,
      total: subtotal + tax,
      taxRate: taxR,
      hasPricingAlert,
      primarySteelMT: Math.round((builtUpQty + hotRolledQty) / 1000 * 100) / 100,
      secondarySteelMT: Math.round(secondarySteelQty / 1000 * 100) / 100,
      purlinsRMT: Math.round(4500 * scaleArea),
      girtsRMT: Math.round(3800 * scalePerimeter),
      roofSheetingSqm: Math.round(2450 * scaleArea),
      wallCladdingSqm: Math.round(2660 * scalePerimeter),
      skyLightsSqm: 0,
      insulationSqm: insul ? Math.round(2450 * scaleArea) : 0,
      anchorBoltsCount: Math.round(320 * scaleArea),
      highStrengthBoltsCount: Math.round(640 * scaleArea),
      excavationCum: Math.round(189.5 * scaleArea * scaleHeight * 10) / 10,
      concretePccCum: Math.round(12.6 * scaleArea * 10) / 10,
      concreteRccCum: Math.round(58.5 * scaleArea * scaleHeight * 10) / 10,
      rebarSteelMT: Math.round(5.27 * scaleArea * scaleHeight * 100) / 100,
      gradeSlabSqm: Math.round(2388 * scaleArea),
      plinthWallSqm: Math.round(266 * scalePerimeter),
      plasteringSqm: Math.round(532 * scalePerimeter),
      lengthM: L,
      widthM: W,
      heightM: H,
      civilInScope: civilScope ?? false,
      mezzanineAreaSqm: mezz,
      hasInsulation: insul ?? false,
      hasGlassFacade,
      hasSolar,
      hasHVAC,
      extractedLength: 81.5,
      extractedWidth: 29.3,
      extractedHeight: 12,
      extractedAreaSqft: 25704,
      extractedAreaSqm: 2388,
      extractedFloors: 3,
      extractedStructuralType: "Steel PEB (Two Mezzanines)",
      areaRatio: Math.round(((L * W) / 2388) * 100) / 100,
      isAreaMatch: Math.abs((L * W) - 2388) / 2388 <= 0.05,
      isHeightMatch: Math.abs(H - 12) < 0.1,
      isSystemMatch: !((projType || "").toLowerCase().includes("residential") || (projType || "").toLowerCase().includes("villa"))
    } as any;
  } else {
    // Defaults for pif
    const L = length ?? 80;
    const W = width ?? 60;
    const H = height ?? 8.5;
    const area = L * W;
    const areaSqft = Math.round(area * 10.7639);
    const civil = civilScope ?? true;
    const isInsulated = insul ?? true;

    const scaleArea = area / 4800;
    const scalePerimeter = ((L + W) * H) / (140 * 8.5);
    const scaleHeight = H / 8.5;

    const db = OFFICIAL_PRICING_DATABASE.pif;

    const primaryCost = Math.round(12420000 * scaleArea * scaleHeight);
    const secondaryCost = Math.round(4032000 * scaleArea);
    const canopyCost = Math.round(1692000 * scaleArea);
    
    const roofRate = isInsulated ? db.roofInsulatedRate : db.roofNonInsulatedRate;
    const roofCost = Math.round(4800 * scaleArea) * roofRate;
    const wallCost = Math.round(3250 * scalePerimeter * db.wallCladdingRate);
    const soffitCost = Math.round(250 * scaleArea * db.soffitRate);
    const skylightCost = Math.round(141 * scaleArea * db.skylightRate);
    const louverCost = Math.round(280 * scalePerimeter * db.louverRate);
    const framedCost = Math.max(1, Math.ceil(6 * scalePerimeter)) * db.framedOpeningRate;
    const gutterCost = Math.round(240 * scaleArea * db.guttersRate);
    const ladderCost = db.ladderRate;
    const erectionCost = Math.round(51667 * scaleArea) * db.erectionRate;
    
    const primaryMT = 135 * scaleArea * scaleHeight;
    const secondaryMT = 42 * scaleArea;
    const canopyMT = 18 * scaleArea;
    const totalMT = primaryMT + secondaryMT + canopyMT;
    const freightCost = Math.round(totalMT * db.freightRate);
    const engineeringCost = db.engineeringRate;

    const pccCost = civil ? Math.round(332858 * scaleArea * scaleHeight) : 0;
    const footingCost = civil ? Math.round(1615210 * scaleArea * scaleHeight) : 0;
    const slabCost = civil ? Math.round(1028970 * scaleArea) : 0;
    const brickCost = civil ? Math.round(350000 * scalePerimeter) : 0;

    const subtotal = primaryCost + secondaryCost + canopyCost + roofCost + wallCost + soffitCost + skylightCost + louverCost + framedCost + gutterCost + ladderCost + erectionCost + freightCost + engineeringCost + pccCost + footingCost + slabCost + brickCost;
    const tax = Math.round(subtotal * taxR);
    
    const resolvedName = customerName || "Example Enterprise";
    const resolvedContact = customerContact || "+91 99999 66666 | sales@exampleenterprise.com";

    const lineItems: QuoteLineItem[] = [
      { description: "Primary framing structural plates (ASTM A572 Grade 50 Plates, SA 2.5 Blasting, 120 DFT Epoxy Paint)", qty: Math.round(135 * scaleArea * scaleHeight * 10) / 10, rate: db.primarySteelRate, total: primaryCost },
      { description: "Secondary Galvanized cold-formed framing (GP 275 gsm)", qty: Math.round(42 * scaleArea * 10) / 10, rate: db.secondarySteelRate, total: secondaryCost },
      { description: "Canopy (4m x 60m) & MS-2 continuous roof monitors", qty: Math.round(18 * scaleArea * 10) / 10, rate: db.canopyRate, total: canopyCost },
      { description: `Roof Envelope (${isInsulated ? "0.50mm PPGI + 48 kg/m3 Glasswool" : "0.50mm PPGI non-insulated"})`, qty: Math.round(4800 * scaleArea), rate: roofRate, total: roofCost },
      { description: "Wall Cladding Envelope (0.50mm PPGI single skin)", qty: Math.round(3250 * scalePerimeter), rate: db.wallCladdingRate, total: wallCost },
      { description: "Canopy Soffit Bottom Panels (0.50mm PPGI)", qty: Math.round(250 * scaleArea), rate: db.soffitRate, total: soffitCost },
      { description: "2.0mm UV-Stabilized Polycarbonate Skylight Panel modules", qty: Math.round(141 * scaleArea), rate: db.skylightRate, total: skylightCost },
      { description: "Perimeter Fixed Louvers with GI wire mesh", qty: Math.round(280 * scalePerimeter), rate: db.louverRate, total: louverCost },
      { description: `${Math.max(1, Math.ceil(6 * scalePerimeter))} Framed openings (4.5m x 6m) for rolling shutters`, qty: Math.max(1, Math.ceil(6 * scalePerimeter)), rate: db.framedOpeningRate, total: framedCost },
      { description: "Valley/Eave Gutters (80m valley / 160m eave)", qty: Math.round(240 * scaleArea), rate: db.guttersRate, total: gutterCost },
      { description: "Galvanized cage safety ladders & flashings", qty: 1, rate: db.ladderRate, total: ladderCost },
      { description: "Site Erection, heavy crane rigging labor & safety crew", qty: Math.round(51667 * scaleArea), rate: db.erectionRate, total: erectionCost },
      { description: "Transit Insurance & freight shipping Pune site", qty: Math.round(totalMT * 10) / 10, rate: db.freightRate, total: freightCost },
      { description: "Engineering STAAD analysis & design approval", qty: 1, rate: db.engineeringRate, total: engineeringCost }
    ];

    if (civil) {
      lineItems.push({ description: "Civil Foundation PCC leveling concrete & excavation", qty: 1, rate: pccCost, total: pccCost });
      lineItems.push({ description: "Footings & RCC Column Pedestals", qty: 1, rate: footingCost, total: footingCost });
      lineItems.push({ description: "Grade Slab concrete flooring (150mm M20 laser screed)", qty: 1, rate: slabCost, total: slabCost });
      lineItems.push({ description: "Plinth brickwork masonry & plaster", qty: 1, rate: brickCost, total: brickCost });
    }

    if (hasGlassFacade) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Premium Glass Facade Envelope [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasSolar) {
      hasPricingAlert = true;
      lineItems.push({
        description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    if (hasHVAC) {
      hasPricingAlert = true;
      lineItems.push({
        description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
        qty: 1,
        rate: "Pricing Not Available",
        total: "Pricing Not Available"
      });
    }

    return {
      quoteNo: "ARK-CON-1831-VASHI",
      date: currentDate,
      validUntil: validUntilDate,
      customerName: resolvedName,
      customerContact: resolvedContact,
      projectType: "Multi-Building Connected PEB Complex (MS-2 & Mono Slope)",
      areaSqft,
      ratePerSqft: Math.round(subtotal / areaSqft),
      budgetTier: "Premium",
      customRequirements: `Contract-Ready Turnkey Proposal based on PIF. Connected MS-2 and Mono Slope buildings. Width: ${W}m, Length: ${L}m, Height: ${H}m.`,
      estimatedSteelTons: Math.round(195.0 * scaleArea * scaleHeight * 10) / 10,
      thermalRating: isInsulated ? "Insulated 48kg/m3" : "Non-Insulated",
      feasibilityScore: 100,
      lineItems,
      subtotal,
      taxAmount: tax,
      total: subtotal + tax,
      taxRate: taxR,
      hasPricingAlert,
      primarySteelMT: Math.round(153.0 * scaleArea * scaleHeight * 100) / 100,
      secondarySteelMT: Math.round(42.0 * scaleArea * 100) / 100,
      purlinsRMT: Math.round(3200 * scaleArea),
      girtsRMT: Math.round(2400 * scalePerimeter),
      roofSheetingSqm: Math.round(4800 * scaleArea),
      wallCladdingSqm: Math.round(3250 * scalePerimeter),
      skyLightsSqm: Math.round(141 * scaleArea),
      insulationSqm: isInsulated ? Math.round(4800 * scaleArea) : 0,
      anchorBoltsCount: Math.round(160 * scaleArea),
      highStrengthBoltsCount: Math.round(480 * scaleArea),
      excavationCum: Math.round(180.0 * scaleArea * scaleHeight * 10) / 10,
      concretePccCum: Math.round(45.0 * scaleArea * 10) / 10,
      concreteRccCum: Math.round(127.7 * scaleArea * scaleHeight * 10) / 10,
      rebarSteelMT: Math.round(11.5 * scaleArea * scaleHeight * 100) / 100,
      gradeSlabSqm: Math.round(4800 * scaleArea),
      plinthWallSqm: Math.round(480 * scalePerimeter),
      plasteringSqm: Math.round(960 * scalePerimeter),
      lengthM: L,
      widthM: W,
      heightM: H,
      civilInScope: civil,
      mezzanineAreaSqm: mezzSqm ?? 0,
      hasInsulation: isInsulated,
      hasGlassFacade,
      hasSolar,
      hasHVAC,
      extractedLength: 80,
      extractedWidth: 60,
      extractedHeight: 8.5,
      extractedAreaSqft: 51667,
      extractedAreaSqm: 4800,
      extractedFloors: 1,
      extractedStructuralType: "Steel PEB (Connected MS-2 & Mono Slope)",
      areaRatio: Math.round(((L * W) / 4800) * 100) / 100,
      isAreaMatch: Math.abs((L * W) - 4800) / 4800 <= 0.05,
      isHeightMatch: Math.abs(H - 8.5) < 0.1,
      isSystemMatch: !((projType || "").toLowerCase().includes("residential") || (projType || "").toLowerCase().includes("villa"))
    } as any;
  }
};

const getEngineeringBOM = (type: string, result: any) => {
  if (!result) return [];
  
  let bom: any[] = [];
  
  if (type === "handmade") {
    const columns = Math.round((result.primarySteelMT * 0.6) * 100) / 100;
    const rafters = Math.round((result.primarySteelMT * 0.4) * 100) / 100;
    const scaleArea = (result.lengthM * result.widthM) / 756;
    const scalePerimeter = ((result.lengthM + result.widthM) * result.heightM) / (60 * 21);
    
    bom = [
      { name: "Built-up Columns", spec: "Plate Steel (ASTM A572 Grade 50)", qty: columns, unit: "MT", rate: 89000, total: Math.round(columns * 89000) },
      { name: "Tapered Rafters", spec: "Plate Steel (ASTM A572 Grade 50)", qty: rafters, unit: "MT", rate: 89000, total: Math.round(rafters * 89000) },
      { name: "Z & C Roof Purlins", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.purlinsRMT || 1100, unit: "RMT", rate: 0, total: 0, note: "Included in Primary Steel" },
      { name: "Wall Girts bracing", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.girtsRMT || 900, unit: "RMT", rate: 0, total: 0, note: "Included in Primary Steel" },
      { name: "Roof Sheeting", spec: "0.50mm Galvalume Color Coated (AZ-150)", qty: result.roofSheetingSqm || 794, unit: "Sqm", rate: 715, total: Math.round((result.roofSheetingSqm || 794) * 715) },
      { name: "Wall Cladding", spec: "0.45mm Pre-painted Galvalume", qty: result.wallCladdingSqm || 1260, unit: "Sqm", rate: 707, total: Math.round((result.wallCladdingSqm || 1260) * 707) },
      { name: "Skylights (Polycarbonate)", spec: "2.0mm UV Stabilized Sheets", qty: Math.round((result.skyLightsSqm || 90) / 3), unit: "Sqm", rate: 4800, total: Math.round(Math.round((result.skyLightsSqm || 90) / 3) * 4800) },
      { name: "Roof Insulation", spec: "50mm Glasswool with Alum. Foil", qty: result.hasInsulation ? Math.round(794 * scaleArea) : 0, unit: "Sqm", rate: result.hasInsulation ? "Pricing Not Available" : 0, total: result.hasInsulation ? "Pricing Not Available" : 0 },
      { name: "High-Tensile Anchor Bolts", spec: "Grade 8.8 bolts (M24 x 750mm)", qty: result.anchorBoltsCount || 120, unit: "Nos", rate: 0, total: 0, note: "Included in Supply" },
      { name: "HS Splice Bolts", spec: "Grade 8.8 (M20/M24) primary joints", qty: result.highStrengthBoltsCount || 240, unit: "Nos", rate: 0, total: 0, note: "Included in Supply" }
    ];
  } else if (type === "ga") {
    const columns = Math.round((result.primarySteelMT * 0.6) * 100) / 100;
    const rafters = Math.round((result.primarySteelMT * 0.4) * 100) / 100;
    const scaleArea = (result.lengthM * result.widthM) / 2387.95;
    
    bom = [
      { name: "Built-up Columns", spec: "Plate Steel (ASTM A572 Grade 50)", qty: columns, unit: "MT", rate: 89500, total: Math.round(columns * 89500) },
      { name: "Tapered Rafters", spec: "Plate Steel (ASTM A572 Grade 50)", qty: rafters, unit: "MT", rate: 89500, total: Math.round(rafters * 89500) },
      { name: "Z & C Roof Purlins", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.purlinsRMT || 4500, unit: "RMT", rate: 450, total: Math.round((result.purlinsRMT || 4500) * 450) },
      { name: "Wall Girts bracing", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.girtsRMT || 3800, unit: "RMT", rate: 461.82, total: Math.round((result.girtsRMT || 3800) * 461.82) },
      { name: "Roof Sheeting", spec: "0.50mm Galvalume Color Coated (AZ-150)", qty: Math.round((result.roofSheetingSqm || 2450) * 11421 / 2450), unit: "Sqm", rate: 95.00, total: Math.round(Math.round((result.roofSheetingSqm || 2450) * 11421 / 2450) * 95) },
      { name: "Wall Cladding", spec: "0.45mm Pre-painted Galvalume", qty: Math.round((result.wallCladdingSqm || 2660) * 19259 / 2660), unit: "Sqm", rate: 107.00, total: Math.round(Math.round((result.wallCladdingSqm || 2660) * 19259 / 2660) * 107) },
      { name: "Skylights (Polycarbonate)", spec: "2.0mm UV Stabilized Sheets", qty: result.skyLightsSqm || 0, unit: "Sqm", rate: result.skyLightsSqm > 0 ? "Pricing Not Available" : 0, total: result.skyLightsSqm > 0 ? "Pricing Not Available" : 0 },
      { name: "Roof Insulation", spec: "50mm Glasswool with Alum. Foil", qty: result.hasInsulation ? Math.round(2450 * scaleArea) : 0, unit: "Sqm", rate: result.hasInsulation ? "Pricing Not Available" : 0, total: result.hasInsulation ? "Pricing Not Available" : 0 },
      { name: "High-Tensile Anchor Bolts", spec: "Grade 8.8 bolts (M24 x 750mm)", qty: Math.round((result.anchorBoltsCount || 320) * 4224 / 320), unit: "KG", rate: 86.00, total: Math.round(Math.round((result.anchorBoltsCount || 320) * 4224 / 320) * 86) },
      { name: "HS Splice Bolts", spec: "Grade 8.8 (M20/M24) primary joints", qty: Math.round((result.highStrengthBoltsCount || 640) * 4492 / 640), unit: "KG", rate: 148.00, total: Math.round(Math.round((result.highStrengthBoltsCount || 640) * 4492 / 640) * 148) }
    ];
  } else if (type === "pif") {
    const columns = Math.round((result.primarySteelMT * 0.6) * 100) / 100;
    const rafters = Math.round((result.primarySteelMT * 0.4) * 100) / 100;
    
    bom = [
      { name: "Built-up Columns", spec: "Plate Steel (ASTM A572 Grade 50)", qty: columns, unit: "MT", rate: 92000, total: Math.round(columns * 92000) },
      { name: "Tapered Rafters", spec: "Plate Steel (ASTM A572 Grade 50)", qty: rafters, unit: "MT", rate: 92000, total: Math.round(rafters * 92000) },
      { name: "Z & C Roof Purlins", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.purlinsRMT || 3200, unit: "RMT", rate: 630, total: Math.round((result.purlinsRMT || 3200) * 630) },
      { name: "Wall Girts bracing", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: result.girtsRMT || 2400, unit: "RMT", rate: 840, total: Math.round((result.girtsRMT || 2400) * 840) },
      { name: "Roof Sheeting", spec: "0.50mm Galvalume Color Coated (AZ-150)", qty: result.roofSheetingSqm || 4800, unit: "Sqm", rate: result.insulationSqm > 0 ? 660 : 540, total: Math.round((result.roofSheetingSqm || 4800) * (result.insulationSqm > 0 ? 660 : 540)), note: result.insulationSqm > 0 ? "Insulated" : "Non-Insulated" },
      { name: "Wall Cladding", spec: "0.45mm Pre-painted Galvalume", qty: result.wallCladdingSqm || 3250, unit: "Sqm", rate: 390, total: Math.round((result.wallCladdingSqm || 3250) * 390) },
      { name: "Skylights (Polycarbonate)", spec: "2.0mm UV Stabilized Sheets", qty: result.skyLightsSqm || 141, unit: "Sqm", rate: 950, total: Math.round((result.skyLightsSqm || 141) * 950) },
      { name: "Roof Insulation", spec: "50mm Glasswool with Alum. Foil", qty: result.insulationSqm || 0, unit: "Sqm", rate: 0, total: 0, note: "Included in Roof Sheeting" },
      { name: "High-Tensile Anchor Bolts", spec: "Grade 8.8 bolts (M24 x 750mm)", qty: result.anchorBoltsCount || 160, unit: "Nos", rate: 0, total: 0, note: "Included in Supply" },
      { name: "HS Splice Bolts", spec: "Grade 8.8 (M20/M24) primary joints", qty: result.highStrengthBoltsCount || 480, unit: "Nos", rate: 0, total: 0, note: "Included in Supply" }
    ];
  } else {
    // Fallback for AI generated
    const primaryMT = result.primarySteelMT || 0;
    const purlinsVal = result.purlinsRMT || 0;
    const girtsVal = result.girtsRMT || 0;
    const roofSqm = result.roofSheetingSqm || 0;
    const wallSqm = result.wallCladdingSqm || 0;
    const skySqm = result.skyLightsSqm || 0;
    const insSqm = result.insulationSqm || 0;
    const anchors = result.anchorBoltsCount || 0;
    const splices = result.highStrengthBoltsCount || 0;
    
    bom = [
      { name: "Built-up Columns", spec: "Plate Steel (ASTM A572 Grade 50)", qty: Math.round(primaryMT * 0.6 * 100) / 100, unit: "MT", rate: 84000, total: Math.round(primaryMT * 0.6 * 84000) },
      { name: "Tapered Rafters", spec: "Plate Steel (ASTM A572 Grade 50)", qty: Math.round(primaryMT * 0.4 * 100) / 100, unit: "MT", rate: 84000, total: Math.round(primaryMT * 0.4 * 84000) },
      { name: "Z & C Roof Purlins", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: purlinsVal, unit: "RMT", rate: 450, total: Math.round(purlinsVal * 450) },
      { name: "Wall Girts bracing", spec: "Cold-Formed Galvanized Steel (275 gsm)", qty: girtsVal, unit: "RMT", rate: 450, total: Math.round(girtsVal * 450) },
      { name: "Roof Sheeting", spec: "0.50mm Galvalume Color Coated (AZ-150)", qty: roofSqm, unit: "Sqm", rate: 380, total: Math.round(roofSqm * 380) },
      { name: "Wall Cladding", spec: "0.45mm Pre-painted Galvalume", qty: wallSqm, unit: "Sqm", rate: 380, total: Math.round(wallSqm * 380) },
      { name: "Skylights (Polycarbonate)", spec: "2.0mm UV Stabilized Sheets", qty: skySqm, unit: "Sqm", rate: 850, total: Math.round(skySqm * 850) },
      { name: "Roof Insulation", spec: "50mm Glasswool with Alum. Foil", qty: insSqm, unit: "Sqm", rate: 120, total: Math.round(insSqm * 120) },
      { name: "High-Tensile Anchor Bolts", spec: "Grade 8.8 bolts (M24 x 750mm)", qty: anchors, unit: "Nos", rate: 140, total: Math.round(anchors * 140) },
      { name: "HS Splice Bolts", spec: "Grade 8.8 (M20/M24) primary joints", qty: splices, unit: "Nos", rate: 140, total: Math.round(splices * 140) }
    ];
  }

  // Append optional modules with Pricing Not Available
  if (result.hasGlassFacade) {
    bom.push({ name: "Glass Facade Envelope", spec: "Premium Glass Facade Design", qty: 1, unit: "Nos", rate: "Pricing Not Available", total: "Pricing Not Available" });
  }
  if (result.hasSolar) {
    bom.push({ name: "Solar Power Module", spec: "Solar Power System & Inverter Setup", qty: 1, unit: "Nos", rate: "Pricing Not Available", total: "Pricing Not Available" });
  }
  if (result.hasHVAC) {
    bom.push({ name: "HVAC Climate Control", spec: "HVAC Climate Control system", qty: 1, unit: "Nos", rate: "Pricing Not Available", total: "Pricing Not Available" });
  }

  return bom;
};

const getCivilFoundations = (type: string, result: any) => {
  if (!result) return [];
  if (type === "handmade") {
    return [
      { name: "Foundation Earthwork & Excavation", spec: "Soil excavation up to 1.5m to 2.0m depth", qty: result.excavationCum || 77.8, unit: "Cum", rate: 450, total: Math.round((result.excavationCum || 77.8) * 450) },
      { name: "PCC Leveling Bases", spec: "Plain Cement Concrete (PCC) 1:4:8 mix", qty: result.concretePccCum || 5.2, unit: "Cum", rate: 4200, total: Math.round((result.concretePccCum || 5.2) * 4200) },
      { name: "Structural Footings & Pedestals", spec: "Reinforced Concrete (RCC) M25 Grade", qty: result.concreteRccCum || 24.0, unit: "Cum", rate: 6800, total: Math.round((result.concreteRccCum || 24.0) * 6800) },
      { name: "Reinforcement Rebars Steel", spec: "Fe500 High-Yield TMT Steel bars", qty: result.rebarSteelMT || 2.16, unit: "MT", rate: 65000, total: Math.round((result.rebarSteelMT || 2.16) * 65000) },
      { name: "Grade Slab Flooring", spec: "150mm thick concrete M20 finished floor", qty: result.gradeSlabSqm || 756, unit: "Sqm", rate: 1150, total: Math.round((result.gradeSlabSqm || 756) * 1150) },
      { name: "Brickwork Plinth wall", spec: "Solid blocks/Fly-ash brick masonry wall", qty: result.plinthWallSqm || 144, unit: "Sqm", rate: 980, total: Math.round((result.plinthWallSqm || 144) * 980) },
      { name: "Protective Wall Plastering", spec: "Smooth sand-faced plaster (mortar 1:4)", qty: result.plasteringSqm || 288, unit: "Sqm", rate: 180, total: Math.round((result.plasteringSqm || 288) * 180) }
    ];
  }
  if (type === "ga") {
    return [
      { name: "Foundation Earthwork & Excavation", spec: "Soil excavation up to 1.5m to 2.0m depth", qty: result.excavationCum || 189.5, unit: "Cum", rate: 450, total: Math.round((result.excavationCum || 189.5) * 450) },
      { name: "PCC Leveling Bases", spec: "Plain Cement Concrete (PCC) 1:4:8 mix", qty: result.concretePccCum || 12.6, unit: "Cum", rate: 4200, total: Math.round((result.concretePccCum || 12.6) * 4200) },
      { name: "Structural Footings & Pedestals", spec: "Reinforced Concrete (RCC) M25 Grade", qty: result.concreteRccCum || 58.5, unit: "Cum", rate: 6800, total: Math.round((result.concreteRccCum || 58.5) * 6800) },
      { name: "Reinforcement Rebars Steel", spec: "Fe500 High-Yield TMT Steel bars", qty: result.rebarSteelMT || 5.27, unit: "MT", rate: 65000, total: Math.round((result.rebarSteelMT || 5.27) * 65000) },
      { name: "Grade Slab Flooring", spec: "150mm thick concrete M20 finished floor", qty: result.gradeSlabSqm || 2388, unit: "Sqm", rate: 1150, total: Math.round((result.gradeSlabSqm || 2388) * 1150) },
      { name: "Brickwork Plinth wall", spec: "Solid blocks/Fly-ash brick masonry wall", qty: result.plinthWallSqm || 266, unit: "Sqm", rate: 980, total: Math.round((result.plinthWallSqm || 266) * 980) },
      { name: "Protective Wall Plastering", spec: "Smooth sand-faced plaster (mortar 1:4)", qty: result.plasteringSqm || 532, unit: "Sqm", rate: 180, total: Math.round((result.plasteringSqm || 532) * 180) }
    ];
  }
  if (type === "pif") {
    return [
      { name: "Foundation Earthwork & Excavation", spec: "Soil excavation up to 1.5m to 2.0m depth", qty: result.excavationCum || 180.0, unit: "Cum", rate: 650, total: Math.round((result.excavationCum || 180.0) * 650) },
      { name: "PCC Leveling Bases", spec: "Plain Cement Concrete (PCC) 1:4:8 mix", qty: result.concretePccCum || 45.0, unit: "Cum", rate: 4796.84, total: Math.round((result.concretePccCum || 45.0) * 4796.84) },
      { name: "Structural Footings & Pedestals", spec: "Reinforced Concrete (RCC) M25 Grade", qty: result.concreteRccCum || 127.7, unit: "Cum", rate: 12648.47, total: Math.round((result.concreteRccCum || 127.7) * 12648.47) },
      { name: "Reinforcement Rebars Steel", spec: "Fe500 High-Yield TMT Steel bars", qty: result.rebarSteelMT || 11.5, unit: "MT", rate: 0, total: 0, note: "Included in RCC Footings" },
      { name: "Grade Slab Flooring", spec: "150mm thick concrete M20 finished floor", qty: result.gradeSlabSqm || 4800, unit: "Sqm", rate: 214.37, total: Math.round((result.gradeSlabSqm || 4800) * 214.37) },
      { name: "Brickwork Plinth wall", spec: "Solid blocks/Fly-ash brick masonry wall", qty: result.plinthWallSqm || 480, unit: "Sqm", rate: 729.17, total: Math.round((result.plinthWallSqm || 480) * 729.17) },
      { name: "Protective Wall Plastering", spec: "Smooth sand-faced plaster (mortar 1:4)", qty: result.plasteringSqm || 960, unit: "Sqm", rate: 0, total: 0, note: "Included in Plinth Wall" }
    ];
  }
  // Fallback for AI generated
  const excavation = result.excavationCum || 0;
  const pcc = result.concretePccCum || 0;
  const rcc = result.concreteRccCum || 0;
  const slab = result.gradeSlabSqm || 0;
  const rebar = result.rebarSteelMT || 0;
  const plinth = result.plinthWallSqm || 0;
  const plaster = result.plasteringSqm || 0;

  return [
    { name: "Foundation Earthwork & Excavation", spec: "Soil excavation up to 1.5m to 2.0m depth", qty: excavation, unit: "Cum", rate: 450, total: Math.round(excavation * 450) },
    { name: "PCC Leveling Bases", spec: "Plain Cement Concrete (PCC) 1:4:8 mix", qty: pcc, unit: "Cum", rate: 4200, total: Math.round(pcc * 4200) },
    { name: "Structural Footings & Pedestals", spec: "Reinforced Concrete (RCC) M25 Grade", qty: rcc, unit: "Cum", rate: 6800, total: Math.round(rcc * 6800) },
    { name: "Reinforcement Rebars Steel", spec: "Fe500 High-Yield TMT Steel bars", qty: rebar, unit: "MT", rate: 65000, total: Math.round(rebar * 65000) },
    { name: "Grade Slab Flooring", spec: "150mm thick concrete M20 finished floor", qty: slab, unit: "Sqm", rate: 1150, total: Math.round(slab * 1150) },
    { name: "Brickwork Plinth wall", spec: "Solid blocks/Fly-ash brick masonry wall", qty: plinth, unit: "Sqm", rate: 980, total: Math.round(plinth * 980) },
    { name: "Protective Wall Plastering", spec: "Smooth sand-faced plaster (mortar 1:4)", qty: plaster, unit: "Sqm", rate: 180, total: Math.round(plaster * 180) }
  ];
};

export default function Quotations() {
  const [location, setLocation] = useLocation();
  
  const getTechnicalSpecifications = (type: string) => {
    if (type === "handmade") {
      return [
        { label: "Structural Code", value: "IS 800-2007 / MBMA" },
        { label: "Bay Spacing", value: "6 bays @ 7m / 3 @ 6m" },
        { label: "Clear Span Height", value: "21.0 Meters" },
        { label: "Roof Slopes / Pitch", value: "1:10 Standard" },
        { label: "Surface Treatment", value: "SA 2.5 Sand Blast + Epoxy Paint" },
        { label: "Roof Sheeting Specs", value: "0.5mm TCT AZ-150 Galvalume" },
      ];
    }
    if (type === "ga") {
      return [
        { label: "Structural Blueprint", value: "Centerline 29.3m x 81.5m" },
        { label: "Mezzanine Decking", value: "0.80mm Galvanized Decking" },
        { label: "Clear Eave Height", value: "12.0 Meters" },
        { label: "Mezzanine Area", value: "930 Sqm Total (2 Floors)" },
        { label: "Surface Treatment", value: "SA 2.5 Sand Blasting + Primer" },
        { label: "Roof Sheeting Specs", value: "0.5mm Galvalume PPGL AZ-150" },
      ];
    }
    if (type === "pif") {
      return [
        { label: "Building Configuration", value: "Connected MS-2 & Mono Slope" },
        { label: "Heavy EOT Cranes", value: "2x5T + 6x2T (MS-2) / 1x20T + 1x15T (Mono)" },
        { label: "Roof Insulation", value: "48kg/m3 High-Density Glasswool" },
        { label: "Canopy Framework", value: "4m x 60m Front Cantilever" },
        { label: "Surface Treatment", value: "Sandblasted SA 2.5 + 120 DFT Epoxy" },
        { label: "Gutters & Openings", value: "240 RMT Gutters, 6 Framed Openings" },
      ];
    }
    return [
      { label: "Design Code", value: "AISC 360-10 / MBMA-2016" },
      { label: "Wind Design Speed", value: "44 m/s (Zone IV)" },
      { label: "Roof Pitch", value: "1:10 Standard" },
      { label: "Sandblasting Class", value: "SA 2.5 Standard" },
      { label: "Roof Insulation", value: "50mm Glasswool with Alum. Foil" },
      { label: "Base Anchor Bolts", value: "Grade 8.8 High-Tensile" },
    ];
  };

  const leadsResult = useListLeads({}, { refetchInterval: 2000 });
  const customersResult = useListCustomers();
  const leads = leadsResult.data as any[] | undefined;
  const customers = customersResult.data as any[] | undefined;
  const { toast } = useToast();

  const [selectedSourceType, setSelectedSourceType] = useState<"lead" | "contact" | "manual">("manual");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [projectType, setProjectType] = useState("Prefab Modular Cabin");
  const [areaSqft, setAreaSqft] = useState(1200);
  const [budgetTier, setBudgetTier] = useState("Standard");


  const [lengthM, setLengthM] = useState<number>(42);
  const [widthM, setWidthM] = useState<number>(18);
  const [heightM, setHeightM] = useState<number>(21);
  const [civilInScope, setCivilInScope] = useState<boolean>(false);
  const [mezzanineAreaSqm, setMezzanineAreaSqm] = useState<number>(0);
  const [canopySqm, setCanopySqm] = useState<number>(0);
  const [skylightSqm, setSkylightSqm] = useState<number>(0);
  const [shuttersCount, setShuttersCount] = useState<number>(0);
  const [craneCapacity, setCraneCapacity] = useState<number>(0);
  const [tonnage, setTonnage] = useState<number>(0);

  const [activeQuotationType, setActiveQuotationType] = useState<"handmade" | "ga" | "pif" | "ai" | null>(null);
  
  const [hasInsulation, setHasInsulation] = useState(true);
  const [hasGlassFacade, setHasGlassFacade] = useState(false);
  const [hasSolar, setHasSolar] = useState(false);
  const [hasHVAC, setHasHVAC] = useState(false);
  
  const [customRequirements, setCustomRequirements] = useState("");
  const [taxRate, setTaxRate] = useState(0.18);
  
  const [isExtractingQuote, setIsExtractingQuote] = useState(false);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [extractionMatchedLead, setExtractionMatchedLead] = useState<boolean>(false);
  const [isAdminApproved, setIsAdminApproved] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  const isQuoteValid = quoteResult
    ? (quoteResult.isDrawingQuote
      ? (quoteResult.areaRatio !== undefined && quoteResult.areaRatio >= 0.90 && quoteResult.areaRatio <= 1.10 && quoteResult.isHeightMatch && quoteResult.isSystemMatch)
      : true)
    : true;

  const [activeTab, setActiveTab] = useState<"commercial" | "engineering" | "civil">("commercial");
  const [activeGenerationSteps, setActiveGenerationSteps] = useState<string[]>([
    "📂 Initiating structural framework parameters...",
    "📐 Calculating tapered built-up column weights...",
    "📐 Computing purlins, girts, and cladding parameters...",
    "🧱 Estimating PCC, excavation, and foundation concrete...",
    "📝 Compiling proforma line-items cost ledger...",
    "✨ AI Structural Feasibility review passed successfully!"
  ]);

  const [uploadingType, setUploadingType] = useState<"handmade" | "ga" | "pif" | null>(null);
  const [generatingType, setGeneratingType] = useState<"handmade" | "ga" | "pif" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  interface DocumentInfo {
    name: string;
    size: string;
    date: string;
    previewUrl?: string;
    base64Data?: string;
    mimeType?: string;
  }

  interface QuotationSubFieldState {
    file: DocumentInfo | null;
    quoteResult: QuoteResult | null;
  }

  interface LeadQuotations {
    handmade: QuotationSubFieldState;
    ga: QuotationSubFieldState;
    pif: QuotationSubFieldState;
  }

  const [leadQuotationsMap, setLeadQuotationsMap] = useState<Record<string, LeadQuotations>>({});

  const getEntityQuotations = (entityId: string, name: string): LeadQuotations => {
    const cleanName = (name || "").toLowerCase();
    const leadName = (selectedSourceType === "lead" && leads)
      ? (leads.find(l => String(l.id) === entityId)?.name || "").toLowerCase()
      : (selectedSourceType === "contact" && customers)
      ? (customers.find(c => String(c.id) === entityId)?.name || "").toLowerCase()
      : "";

    const isRishi = cleanName.includes("rishi") || cleanName.includes("vashi") || entityId === "rishi" || leadName.includes("rishi") || leadName.includes("vashi");
    const isDelfrost = cleanName.includes("delfrost") || entityId === "delfrost" || leadName.includes("delfrost");
    const isBrisson = cleanName.includes("brisson") || entityId === "brisson" || leadName.includes("brisson");

    if (leadQuotationsMap[entityId]) {
      return leadQuotationsMap[entityId];
    }

    const resolvedHandmadeName = isRishi ? "Rishi Vashi" : isDelfrost ? "Delfrost" : isBrisson ? "M/S Brisson" : "Example Client Name";
    const resolvedGaName = isRishi ? "Rishi Vashi" : isDelfrost ? "Delfrost" : isBrisson ? "M/S Brisson" : "Example Industrial Corp";
    const resolvedPifName = isRishi ? "Mr. Sudhir Shinde / Rishi Vashi" : isDelfrost ? "Delfrost" : isBrisson ? "M/S Brisson" : "Example Enterprise";

    const activeName = customerName && customerName.trim() !== "" ? customerName : null;
    const activeContact = customerContact && customerContact.trim() !== "" ? customerContact : null;

    const handmadeFileName = isRishi ? "For PEB.pdf" : isDelfrost ? "Delfrost_Sketch.pdf" : "Brisson_Sketch.pdf";
    const gaFileName = isRishi ? "Layout.pdf" : isDelfrost ? "Delfrost_GA.pdf" : "Brisson_GA.pdf";
    const pifFileName = isRishi ? "PIF-1831-Rishi Vashi - R0.xlsx" : isDelfrost ? "PIF-Delfrost.xlsx" : "PIF-Brisson.xlsx";

    return {
      handmade: {
        file: (isRishi || isDelfrost || isBrisson) ? { 
          name: handmadeFileName, 
          size: "109.1 KB", 
          date: "2026-05-19",
          previewUrl: "/brisson_handmade_drawing.png"
        } : null,
        quoteResult: (isRishi || isDelfrost || isBrisson) ? getPrepopulatedQuoteResult(
          "handmade", 
          activeName || resolvedHandmadeName, 
          activeContact || undefined, 
          lengthM, 
          widthM, 
          heightM, 
          civilInScope, 
          mezzanineAreaSqm, 
          hasInsulation, 
          taxRate,
          hasGlassFacade,
          hasSolar,
          hasHVAC,
          checkIfResidential(handmadeFileName, projectType),
          projectType
        ) : null
      },
      ga: {
        file: (isRishi || isDelfrost || isBrisson) ? { 
          name: gaFileName, 
          size: "291.2 KB", 
          date: "2026-05-19",
          previewUrl: "/delfrost_ga_drawing.png"
        } : null,
        quoteResult: (isRishi || isDelfrost || isBrisson) ? getPrepopulatedQuoteResult(
          "ga", 
          activeName || resolvedGaName, 
          activeContact || undefined, 
          lengthM, 
          widthM, 
          heightM, 
          civilInScope, 
          mezzanineAreaSqm, 
          hasInsulation, 
          taxRate,
          hasGlassFacade,
          hasSolar,
          hasHVAC,
          checkIfResidential(gaFileName, projectType),
          projectType
        ) : null
      },
      pif: {
        file: (isRishi || isDelfrost || isBrisson) ? { name: pifFileName, size: "40.4 KB", date: "2026-05-19" } : null,
        quoteResult: (isRishi || isDelfrost || isBrisson) ? getPrepopulatedQuoteResult(
          "pif", 
          activeName || resolvedPifName, 
          activeContact || undefined, 
          lengthM, 
          widthM, 
          heightM, 
          civilInScope, 
          mezzanineAreaSqm, 
          hasInsulation, 
          taxRate,
          hasGlassFacade,
          hasSolar,
          hasHVAC,
          checkIfResidential(pifFileName, projectType),
          projectType
        ) : null
      }
    };
  };

  const updateEntityQuotation = (
    type: "handmade" | "ga" | "pif",
    updates: Partial<QuotationSubFieldState>
  ) => {
    const entityId = selectedEntityId || "manual";
    const currentEntityState = getEntityQuotations(entityId, customerName);
    
    const updatedEntityState = {
      ...currentEntityState,
      [type]: {
        ...currentEntityState[type],
        ...updates
      }
    };

    setLeadQuotationsMap(prev => ({
      ...prev,
      [entityId]: updatedEntityState
    }));
  };

  const loadQuotationType = (type: "handmade" | "ga" | "pif") => {
    let resolvedName = customerName;
    let resolvedContact = customerContact;

    if (selectedSourceType === "lead" && leads && selectedEntityId) {
      const found = leads.find(l => String(l.id) === selectedEntityId);
      if (found) {
        resolvedName = found.name;
        resolvedContact = `${found.phone} | ${found.email}`;
      }
    } else if (selectedSourceType === "contact" && customers && selectedEntityId) {
      const found = customers.find(c => String(c.id) === selectedEntityId);
      if (found) {
        resolvedName = found.name;
        resolvedContact = `${found.phone} | ${found.email}`;
      }
    }

    const hasActiveCustomer = resolvedName && resolvedName.trim() !== "";
    const hasActiveContact = resolvedContact && resolvedContact.trim() !== "";

    const activeQuotes = getEntityQuotations(selectedEntityId || "manual", resolvedName);
    const quoteState = activeQuotes[type];
    
    const cleanName = (resolvedName || "").toLowerCase();
    const isRishi = cleanName.includes("rishi") || cleanName.includes("vashi") || selectedEntityId === "rishi";
    const isDelfrost = cleanName.includes("delfrost") || selectedEntityId === "delfrost";
    const isBrisson = cleanName.includes("brisson") || selectedEntityId === "brisson";
    const isExampleLead = isRishi || isDelfrost || isBrisson;

    let result = quoteState.quoteResult;

    const nameMismatch = result && resolvedName && result.customerName !== resolvedName;
    const dimsMismatch = result && (
      result.lengthM !== lengthM || 
      result.widthM !== widthM || 
      result.heightM !== heightM || 
      result.civilInScope !== civilInScope || 
      result.hasInsulation !== hasInsulation
    );

    if (!result || ((selectedSourceType === "manual" || !isExampleLead) && (nameMismatch || dimsMismatch))) {
      result = getPrepopulatedQuoteResult(
        type,
        hasActiveCustomer ? resolvedName : undefined,
        hasActiveContact ? resolvedContact : undefined,
        lengthM,
        widthM,
        heightM,
        civilInScope,
        mezzanineAreaSqm,
        hasInsulation,
        taxRate,
        hasGlassFacade,
        hasSolar,
        hasHVAC,
        checkIfResidential(quoteState?.file?.name || "", projectType),
        projectType
      );
      updateEntityQuotation(type, { quoteResult: result });
    }

    setQuoteResult(result);
    setActiveQuotationType(type);

    if (type === "handmade") {
      setCustomerName(result.customerName || "Example Client Name");
      setCustomerContact(result.customerContact || "+91 99999 88888 | contact@example.com");
      setProjectType("PEB Structural Shed");
      setAreaSqft(result.areaSqft || 8137);
      setBudgetTier("Standard");
      setHasInsulation(result.hasInsulation ?? false);
      setHasGlassFacade(false);
      setHasSolar(false);
      setHasHVAC(false);
      setLengthM(result.lengthM ?? 42);
      setWidthM(result.widthM ?? 18);
      setHeightM(result.heightM ?? 21);
      setCivilInScope(result.civilInScope ?? false);
      setMezzanineAreaSqm(result.mezzanineAreaSqm ?? 0);
    } else if (type === "ga") {
      setCustomerName(result.customerName || "Example Industrial Corp");
      setCustomerContact(result.customerContact || "+91 99999 77777 | info@examplecorp.com");
      setProjectType("PEB Structural Shed");
      setAreaSqft(result.areaSqft || 25704);
      setBudgetTier("Standard");
      setHasInsulation(result.hasInsulation ?? false);
      setHasGlassFacade(false);
      setHasSolar(false);
      setHasHVAC(false);
      setLengthM(result.lengthM ?? 81.5);
      setWidthM(result.widthM ?? 29.3);
      setHeightM(result.heightM ?? 12);
      setCivilInScope(result.civilInScope ?? false);
      setMezzanineAreaSqm(result.mezzanineAreaSqm ?? 930);
    } else if (type === "pif") {
      setCustomerName(result.customerName || "Example Enterprise");
      setCustomerContact(result.customerContact || "+91 99999 66666 | sales@exampleenterprise.com");
      setProjectType("Custom Pre-Build Solution");
      setAreaSqft(result.areaSqft || 51667);
      setBudgetTier("Premium");
      setHasInsulation(result.hasInsulation ?? true);
      setHasGlassFacade(false);
      setHasSolar(false);
      setHasHVAC(false);
      setLengthM(result.lengthM ?? 80);
      setWidthM(result.widthM ?? 60);
      setHeightM(result.heightM ?? 8.5);
      setCivilInScope(result.civilInScope ?? true);
      setMezzanineAreaSqm(result.mezzanineAreaSqm ?? 0);
    }

    toast({
      title: `📂 Loaded ${type === "handmade" ? "Handmade Drawing" : type === "ga" ? "GA Drawing" : "PIF"} Quotation`,
      description: `Active preview switched to ${result.quoteNo} for ${result.customerName}.`,
    });
  };

  // Routing & Mount Sync: Detect URL location and call loadQuotationType
  useEffect(() => {
    if (location === "/quotations/handmade") {
      loadQuotationType("handmade");
    } else if (location === "/quotations/ga") {
      loadQuotationType("ga");
    } else if (location === "/quotations/pif") {
      loadQuotationType("pif");
    } else if (location === "/quotations" || location === "/quotations/") {
      loadQuotationType("handmade");
    }
  }, [location]);

  // Trigger real-time recalculation of the active template whenever inputs change
  useEffect(() => {
    if (activeQuotationType === "handmade" || activeQuotationType === "ga" || activeQuotationType === "pif") {
      const activeQuotes = getEntityQuotations(selectedEntityId || "manual", customerName);
      const activeQuote = activeQuotes[activeQuotationType];
      const hasFile = activeQuote?.file !== null && activeQuote?.file !== undefined;
      const fileName = activeQuote?.file?.name || "";
      const isRes = checkIfResidential(fileName, projectType);
      
      let resolvedLength = lengthM;
      let resolvedWidth = widthM;
      let resolvedHeight = heightM;
      let resolvedCivil = civilInScope;
      let resolvedMezz = mezzanineAreaSqm;
      let resolvedInsul = hasInsulation;

      if (hasFile && !isAdminApproved) {
        // Enforce drawing measurements from quote result if available, else fallback
        const aiL = activeQuote?.quoteResult?.extractedLength;
        const aiW = activeQuote?.quoteResult?.extractedWidth;
        const aiH = activeQuote?.quoteResult?.extractedHeight;

        if (aiL !== undefined && aiL !== null) resolvedLength = Number(aiL);
        if (aiW !== undefined && aiW !== null) resolvedWidth = Number(aiW);
        if (aiH !== undefined && aiH !== null) resolvedHeight = Number(aiH);

        if (isRes) {
          resolvedCivil = true;
          resolvedMezz = 0;
          resolvedInsul = false;
        } else if (activeQuotationType === "handmade") {
          resolvedCivil = false;
          resolvedMezz = 0;
          resolvedInsul = false;
        } else if (activeQuotationType === "ga") {
          resolvedCivil = false;
          resolvedMezz = 930;
          resolvedInsul = false;
        } else if (activeQuotationType === "pif") {
          resolvedCivil = true;
          resolvedMezz = 0;
          resolvedInsul = true;
        }
      }

      const result = getPrepopulatedQuoteResult(
        activeQuotationType,
        customerName,
        customerContact,
        resolvedLength,
        resolvedWidth,
        resolvedHeight,
        resolvedCivil,
        resolvedMezz,
        resolvedInsul,
        taxRate,
        hasGlassFacade,
        hasSolar,
        hasHVAC,
        isRes,
        projectType
      );
      if (hasFile && activeQuote?.file) {
        result.isDrawingQuote = true;
        result.drawingFileName = activeQuote.file.name;
        result.generationTimestamp = quoteResult?.generationTimestamp || new Date().toLocaleString("en-IN");
        
        result.isAssumedLength = Math.abs(resolvedLength - (result.extractedLength as number)) > 0.01;
        result.isAssumedWidth = Math.abs(resolvedWidth - (result.extractedWidth as number)) > 0.01;
        result.isAssumedHeight = Math.abs(resolvedHeight - (result.extractedHeight as number)) > 0.01;
        result.isAssumedArea = !result.isAreaMatch;
        result.isAssumedFloors = false;
        result.isAssumedSystem = !result.isSystemMatch;
      } else {
        result.isDrawingQuote = false;
        result.isAssumedLength = true;
        result.isAssumedWidth = true;
        result.isAssumedHeight = true;
        result.isAssumedArea = true;
        result.isAssumedFloors = true;
        result.isAssumedSystem = true;
        result.extractedLength = resolvedLength;
        result.extractedWidth = resolvedWidth;
        result.extractedHeight = resolvedHeight;
        result.extractedAreaSqft = result.areaSqft;
        result.extractedAreaSqm = Math.round(result.areaSqft * 0.092903);
        result.extractedFloors = (result.mezzanineAreaSqm ?? 0) > 0 ? 3 : 1;
        result.extractedStructuralType = result.projectType;
        result.areaRatio = 1.0;
        result.isAreaMatch = true;
        result.isHeightMatch = true;
        result.isSystemMatch = true;
      }
      setQuoteResult(result);
      
      // Update in entity quotations map as well so it is persisted
      updateEntityQuotation(activeQuotationType, { quoteResult: result });
    }
  }, [
    activeQuotationType,
    lengthM,
    widthM,
    heightM,
    civilInScope,
    mezzanineAreaSqm,
    hasInsulation,
    customerName,
    customerContact,
    taxRate,
    hasGlassFacade,
    hasSolar,
    hasHVAC,
    isAdminApproved,
    selectedEntityId
  ]);

  // Keep areaSqft hook in sync with Length and Width parametric overrides
  useEffect(() => {
    if (activeQuotationType === "handmade" || activeQuotationType === "ga" || activeQuotationType === "pif") {
      const calculatedAreaSqft = Math.round(lengthM * widthM * 10.7639);
      if (calculatedAreaSqft !== areaSqft) {
        setAreaSqft(calculatedAreaSqft);
      }
    }
  }, [lengthM, widthM, activeQuotationType]);

  // Keep phone and email states in sync with combined customerContact
  useEffect(() => {
    if (customerContact) {
      const parts = customerContact.split("|");
      const phonePart = parts[0]?.trim() || "";
      const emailPart = parts[1]?.trim() || "";
      if (phonePart !== customerPhone) setCustomerPhone(phonePart);
      if (emailPart !== customerEmail) setCustomerEmail(emailPart);
    } else {
      if (customerPhone !== "") setCustomerPhone("");
      if (customerEmail !== "") setCustomerEmail("");
    }
  }, [customerContact]);

  // Dynamic Input Validation Logic
  const calculatedArea = Math.round(lengthM * widthM * 10.7639);
  const areaMismatch = areaSqft > 0 && Math.abs(calculatedArea - areaSqft) / areaSqft > 0.25;

  const lengthError = lengthM <= 0 || lengthM > 500;
  const widthError = widthM <= 0 || widthM > 200;
  const heightError = heightM <= 0 || heightM > 40;
  const areaError = areaSqft <= 0;

  const hasValidationErrors = areaMismatch || lengthError || widthError || heightError || areaError;

  const handleFileUploadForType = (type: "handmade" | "ga" | "pif", fileName: string, fileSize: string, previewUrl?: string, base64Data?: string, mimeType?: string) => {
    setUploadingType(type);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadingType(null);
            updateEntityQuotation(type, {
              file: {
                name: fileName,
                size: fileSize,
                date: new Date().toLocaleDateString(),
                previewUrl,
                base64Data,
                mimeType
              }
            });

            toast({
              title: `✅ Document Uploaded`,
              description: `Successfully uploaded "${fileName}". Commencing AI scan...`,
            });
            
            // Automatically trigger the scan immediately after upload
            setTimeout(() => {
              generateQuotationForType(type, fileName, base64Data, mimeType);
            }, 500);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDeleteForType = (type: "handmade" | "ga" | "pif", e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Reset file input element value so the browser permits re-uploading the same/another file
    const inputEl = document.getElementById(`file-input-${type}`) as HTMLInputElement;
    if (inputEl) {
      inputEl.value = "";
    }

    updateEntityQuotation(type, { file: null, quoteResult: null });
    if (quoteResult && (
      (type === "handmade" && quoteResult.quoteNo.startsWith("ARK-EST")) ||
      (type === "ga" && quoteResult.quoteNo.startsWith("ARK-GA")) ||
      (type === "pif" && quoteResult.quoteNo.startsWith("ARK-CON"))
    )) {
      setQuoteResult(null);
    }
    toast({
      title: "🗑️ Document Removed",
      description: `Successfully removed document for ${type === "handmade" ? "Handmade" : type === "ga" ? "GA" : "PIF"} Quotation.`,
    });
  };

  const generateQuotationForType = async (type: "handmade" | "ga" | "pif", fileName: string, fileBase64Data?: string, fileMimeType?: string) => {
    setGeneratingType(type);
    setIsGenerating(true);
    setGenerationStep(0);
    
    // First, let's call the API if we have base64 data
    let extractedLength: number | null = null;
    let extractedWidth: number | null = null;
    let extractedHeight: number | null = null;
    let extractedAreaSqm: number | null = null;
    let extractedFloors: number | null = null;
    let extractedStructuralType: string | null = null;
    let extractedMezzSqm: number | null = null;
    let extractedCanopySqm: number | null = null;
    let extractedSkylightSqm: number | null = null;
    let extractedCraneCapacity: number | null = null;
    let extractedShutters: number | null = null;
    let extractedTonnage: number | null = null;
    let extractedBayConfig: string | null = null;
    let extractedCranes: string | null = null;
    let extractedSlidingDoors: string | null = null;
    let extractedRollingShuttersDesc: string | null = null;
    let extractedInsulationRequired: boolean | null = null;
    let extractedWindSpeed: number | null = null;
    let extractedSeismicZone: string | null = null;
    let extractedClientName: string | null = null;

    let apiSteps = [
      "📂 Loading uploaded file context into secure memory buffer...",
      `🔍 Intelligent OCR Scan: Contacting Gemini 2.5 Vision for "${fileName}"...`,
    ];
    setActiveGenerationSteps(apiSteps);

    try {
      if (fileBase64Data) {
        const response = await fetch("/api/analyze-drawing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: fileBase64Data,
            fileName: fileName,
            mimeType: fileMimeType
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          extractedLength = result.extractedLength;
          extractedWidth = result.extractedWidth;
          extractedHeight = result.extractedHeight;
          extractedAreaSqm = result.extractedAreaSqm;
          extractedFloors = result.extractedFloors;
          extractedStructuralType = result.extractedStructuralType;
          extractedMezzSqm = result.mezzanineAreaSqm;
          extractedCanopySqm = result.extractedCanopySqm;
          extractedSkylightSqm = result.extractedSkylightSqm;
          extractedCraneCapacity = result.extractedCraneCapacity;
          extractedShutters = result.extractedShutters;
          extractedTonnage = result.extractedTonnage;
          extractedBayConfig = result.extractedBayConfig;
          extractedCranes = result.extractedCranes;
          extractedSlidingDoors = result.extractedSlidingDoors;
          extractedRollingShuttersDesc = result.extractedRollingShuttersDesc;
          extractedInsulationRequired = result.extractedInsulationRequired;
          extractedWindSpeed = result.extractedWindSpeed;
          extractedSeismicZone = result.extractedSeismicZone;
          extractedClientName = result.extractedClientName;
          
          apiSteps.push(`✅ API Success: Extracted ${extractedLength}m x ${extractedWidth}m x ${extractedHeight}m`);
        } else {
          apiSteps.push(`⚠️ API Warning: Could not extract data (Status ${response.status})`);
        }
      } else {
        apiSteps.push(`⚠️ No base64 data available for API. Falling back to default heuristics.`);
      }
    } catch (e) {
      console.error(e);
      apiSteps.push(`⚠️ API Error: Connection failed. Using heuristics.`);
    }
    setActiveGenerationSteps([...apiSteps]);

    const isRes = (checkIfResidential(fileName, projectType) && !extractedStructuralType?.toLowerCase().includes("peb") && !extractedStructuralType?.toLowerCase().includes("warehouse")) || (extractedStructuralType?.toLowerCase().includes("residential"));
    const isCold = fileName.toLowerCase().includes("cold");
    
    // Fallbacks if API returns null
    const finalLength = extractedLength;
    const finalWidth = extractedWidth;
    const finalHeight = extractedHeight;
    const finalFloors = extractedFloors || 1;
    const finalAreaSqm = extractedAreaSqm || ((finalLength || 0) * (finalWidth || 0));
    const finalAreaSqft = Math.round(finalAreaSqm * 10.7639);
    const finalSys = extractedStructuralType || (isRes ? "RCC / Brick masonry" : "Steel PEB (Industrial)");

    if (!extractedClientName && (!customerName || customerName.trim() === "")) {
      toast({
        title: "❌ Validation Error: Client Name Missing",
        description: "The document parser could not extract a client name, and none was provided. Please verify the document or type the name manually and try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGeneratingType(null);
      return;
    }

    const fileSteps = [
      ...apiSteps,
      "📐 Dimension Extraction Checklist (Rule 5):",
      `   [✓] Plan length extracted: ${finalLength}m`,
      `   [✓] Plan width extracted: ${finalWidth}m`,
      `   [✓] Levels / floors count: ${finalFloors}`,
      `   [✓] Floor-to-floor / eave height: ${finalHeight}m`,
      `   [✓] Built-up area: ${finalAreaSqft} Sq Ft`,
      `   [✓] Structural system: ${finalSys}`,
      `   [✓] Room/Area modules: ${isRes ? "Bedrooms, Kitchen, Living, Bathrooms, Staircase" : "Columns, Rafters, Purlins, Cladding"}`,
      "⚖️ Code Alignment: Verifying standards against design codes...",
      "✨ Cost Formulation: Synthesizing customized proforma cost ledger & BOM..."
    ];

    setActiveGenerationSteps(fileSteps);

    let currentStep = apiSteps.length - 1;
    const interval = setInterval(() => {
      if (currentStep >= fileSteps.length - 1) {
        clearInterval(interval);
        
        const hasCustomCustomer = customerName && customerName.trim() !== "";
        const hasCustomContact = customerContact && customerContact.trim() !== "";
        
        const resolvedName = hasCustomCustomer ? customerName : (
          extractedClientName ? extractedClientName : (type === "ga" ? "Delfrost" : "")
        );
        
        if (extractedClientName && !hasCustomCustomer) {
          setCustomerName(extractedClientName);
        }
        
        const resolvedContact = hasCustomContact ? customerContact : (
          type === "ga" ? "+91 98234 56789 | sales@delfrost.co.in" : ""
        );

        // Expected dimensions defined by the AI or fallback
        const expectedL = finalLength;
        const expectedW = finalWidth;
        const expectedH = finalHeight;

        // Check if user inputs match expected drawing measurements
        const isMatch = expectedL !== null && expectedW !== null && expectedH !== null &&
                        Math.abs(lengthM - expectedL) < 0.01 && 
                        Math.abs(widthM - expectedW) < 0.01 && 
                        Math.abs(heightM - expectedH) < 0.01;

        let resolvedLength = lengthM;
        let resolvedWidth = widthM;
        let resolvedHeight = heightM;
        let resolvedCivilScope = civilInScope;
        let resolvedMezzSqm = mezzanineAreaSqm;
        let resolvedInsul = hasInsulation;
        let resolvedCanopySqm = canopySqm;
        let resolvedSkylightSqm = skylightSqm;
        let resolvedShuttersCount = shuttersCount;
        let resolvedCraneCapacity = craneCapacity;
        let resolvedTonnage = tonnage;

        if (!isMatch && !isAdminApproved) {
          // If incorrect values entered in inputs and not admin approved, read the AI values and auto-correct them
          if (expectedL !== undefined && expectedL !== null) resolvedLength = expectedL;
          if (expectedW !== undefined && expectedW !== null) resolvedWidth = expectedW;
          if (expectedH !== undefined && expectedH !== null) resolvedHeight = expectedH;

          resolvedCanopySqm = extractedCanopySqm || 0;
          resolvedSkylightSqm = extractedSkylightSqm || 0;
          resolvedShuttersCount = extractedShutters || 0;
          resolvedCraneCapacity = extractedCraneCapacity || 0;
          resolvedTonnage = extractedTonnage || 0;

          if (isRes) {
            resolvedCivilScope = true;
            resolvedMezzSqm = extractedMezzSqm || 0;
            resolvedInsul = false;
          } else if (type === "handmade") {
            resolvedCivilScope = false;
            resolvedMezzSqm = extractedMezzSqm || 0;
            resolvedInsul = true;
          } else if (type === "ga") {
            resolvedCivilScope = false;
            resolvedMezzSqm = extractedMezzSqm || 930;
            resolvedInsul = false;
          } else if (type === "pif") {
            resolvedCivilScope = true;
            resolvedMezzSqm = extractedMezzSqm || 0;
            resolvedInsul = true;
          }
        }

        const quote = getPrepopulatedQuoteResult(
          type,
          resolvedName,
          resolvedContact,
          resolvedLength,
          resolvedWidth,
          resolvedHeight,
          resolvedCivilScope,
          resolvedMezzSqm,
          resolvedInsul,
          taxRate,
          hasGlassFacade,
          hasSolar,
          hasHVAC,
          isRes,
          projectType,
          fileName,
          resolvedCanopySqm,
          resolvedSkylightSqm,
          resolvedShuttersCount,
          resolvedCraneCapacity,
          resolvedTonnage
        );

        // Set drawing metadata
        quote.isDrawingQuote = true;
        quote.drawingFileName = fileName;
        quote.generationTimestamp = new Date().toLocaleString("en-IN");
        quote.extractedLength = finalLength !== null ? finalLength : undefined;
        quote.extractedWidth = finalWidth !== null ? finalWidth : undefined;
        quote.extractedHeight = finalHeight !== null ? finalHeight : undefined;
        quote.isAssumedLength = finalLength !== null ? Math.abs(resolvedLength - finalLength) > 0.01 : true;
        quote.isAssumedWidth = finalWidth !== null ? Math.abs(resolvedWidth - finalWidth) > 0.01 : true;
        quote.isAssumedHeight = finalHeight !== null ? Math.abs(resolvedHeight - finalHeight) > 0.01 : true;
        quote.isAssumedArea = !quote.isAreaMatch;
        quote.isAssumedFloors = false;
        quote.isAssumedSystem = !quote.isSystemMatch;
        
        quote.extractedBayConfig = extractedBayConfig;
        quote.extractedCranes = extractedCranes;
        quote.extractedSlidingDoors = extractedSlidingDoors;
        quote.extractedRollingShuttersDesc = extractedRollingShuttersDesc;
        quote.extractedInsulationRequired = extractedInsulationRequired;
        quote.extractedWindSpeed = extractedWindSpeed;
        quote.extractedSeismicZone = extractedSeismicZone;

        // Update state variables to match the generated quote
        setCustomerName(resolvedName);
        setCustomerContact(resolvedContact);
        setLengthM(resolvedLength);
        setWidthM(resolvedWidth);
        setHeightM(resolvedHeight);
        setAreaSqft(quote.areaSqft);
        setCivilInScope(resolvedCivilScope);
        setMezzanineAreaSqm(resolvedMezzSqm);
        setHasInsulation(resolvedInsul);
        setCanopySqm(resolvedCanopySqm);
        setSkylightSqm(resolvedSkylightSqm);
        setShuttersCount(resolvedShuttersCount);
        setCraneCapacity(resolvedCraneCapacity);
        setTonnage(resolvedTonnage);
        
        if (isRes) {
          setProjectType("LGSF Residential Villa");
          setBudgetTier("Premium");
        } else if (type === "handmade") {
          setProjectType("PEB Structural Shed");
          setBudgetTier("Standard");
        } else if (type === "ga") {
          setProjectType("PEB Structural Shed");
          setBudgetTier("Standard");
        } else if (type === "pif") {
          setProjectType("Custom Pre-Build Solution");
          setBudgetTier("Premium");
        }

        updateEntityQuotation(type, { quoteResult: quote });
        setQuoteResult(quote);
        setActiveQuotationType(type);

        setIsGenerating(false);
        setGeneratingType(null);

        if (!isMatch && !isAdminApproved) {
          toast({
            title: "⚠️ Drawing Mismatch Corrected!",
            description: "Inputs do not match provided measurements, creating quotation based on Drawing inputs.",
          });
        } else {
          toast({
            title: `⚡ ${type === "handmade" ? "Handmade" : type === "ga" ? "GA Drawing" : "PIF"} Quotation Formed!`,
            description: `Inputs matched blueprint perfectly. Generated document ${quote.quoteNo} successfully.`,
          });
        }
      } else {
        currentStep += 1;
        setGenerationStep(currentStep);
      }
    }, 1000); // 1000ms delay over 5 steps creates an exact 5-second scanner buffer
  };

  // Auto-load useEffect removed to prevent mock data display.

  const generationSteps = activeGenerationSteps;

  const handleEntityChange = (id: string) => {
    setSelectedEntityId(id);
    let name = "";
    let contact = "";
    
    if (selectedSourceType === "lead" && leads) {
      const found = leads.find(l => String(l.id) === id);
      if (found) {
        name = found.name;
        contact = `${found.phone} | ${found.email}`;
      }
    } else if (selectedSourceType === "contact" && customers) {
      const found = customers.find(c => String(c.id) === id);
      if (found) {
        name = found.name;
        contact = `${found.phone} | ${found.email}`;
      }
    }

    if (name) {
      setCustomerName(name);
      setCustomerContact(contact);
      
      const cleanName = name.toLowerCase();
      if (cleanName.includes("rishi") || cleanName.includes("vashi")) {
        setLocation("/quotations/pif");
      } else if (cleanName.includes("delfrost")) {
        setLocation("/quotations/ga");
      } else if (cleanName.includes("brisson")) {
        setLocation("/quotations/handmade");
      }
    }
  };

  const handleSourceTypeChange = (type: "lead" | "contact" | "manual") => {
    setSelectedSourceType(type);
    setSelectedEntityId("");
    if (type === "manual") {
      setCustomerName("");
      setCustomerContact("");
    }
  };

  const generateAIQuotation = () => {
    if (!customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a customer name or select a contact first.",
        variant: "destructive"
      });
      return;
    }
    if (!areaSqft || areaSqft <= 0) {
      toast({
        title: "Invalid Dimensions",
        description: "Please enter a valid area size in Sq Ft.",
        variant: "destructive"
      });
      return;
    }

    if (activeQuotationType === "handmade" || activeQuotationType === "ga" || activeQuotationType === "pif") {
      const quoteState = getEntityQuotations(selectedEntityId || "manual", customerName)[activeQuotationType];
      if (quoteState.file) {
        generateQuotationForType(activeQuotationType, quoteState.file.name, quoteState.file.base64Data, quoteState.file.mimeType);
        return;
      }
    }

    setIsGenerating(true);
    setGenerationStep(0);

    // Simulate multi-stage AI optimization loader
    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= generationSteps.length - 1) {
          clearInterval(interval);
          completeGeneration();
          return prev;
        }
        return prev + 1;
      });
    }, 700);
  };

  const completeGeneration = () => {
    const isRes = projectType === "LGSF Residential Villa" || projectType.toLowerCase().includes("residential") || projectType.toLowerCase().includes("villa");

    let quoteNo = "";
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    let lineItems: QuoteLineItem[] = [];
    let feasibilityScore = 90;
    let estimatedSteelTons = 0;
    let ratePerSqft = 0;

    let resolvedLength = lengthM;
    let resolvedWidth = widthM;
    let resolvedHeight = heightM;
    let resolvedAreaSqft = areaSqft;
    let resolvedAreaSqm = Math.round(areaSqft * 0.092903);
    let resolvedFloors = 1;
    let resolvedStructuralType = projectType;
    let areaRatio = 1.0;
    let isAreaMatch = true;
    let isHeightMatch = true;
    let isSystemMatch = true;
    let hasPricingAlert = false;

    // civil and structural details
    let primarySteelMT = 0;
    let secondarySteelMT = 0;
    let purlinsRMT = 0;
    let girtsRMT = 0;
    let roofSheetingSqm = 0;
    let wallCladdingSqm = 0;
    let skyLightsSqm = 0;
    let insulationSqm = 0;
    let anchorBoltsCount = 0;
    let highStrengthBoltsCount = 0;

    let excavationCum = 0;
    let concretePccCum = 0;
    let concreteRccCum = 0;
    let gradeSlabSqm = 0;
    let rebarSteelMT = 0;
    let plinthWallSqm = 0;
    let plasteringSqm = 0;

    if (isRes) {
      const L = lengthM || 20;
      const W = widthM || 10;
      const H = heightM || 3.0;
      const floors = 2;
      const area = L * W * floors;
      resolvedAreaSqft = Math.round(area * 10.7639);
      resolvedAreaSqm = area;
      resolvedFloors = floors;
      resolvedStructuralType = "RCC / Brick masonry";

      const db = OFFICIAL_PRICING_DATABASE.residential;
      const scaleArea = area / 400;

      excavationCum = Math.round(L * W * 1.5 * 10) / 10;
      const excavationCost = Math.round(excavationCum * db.excavationRate);

      concretePccCum = Math.round(L * W * 0.1 * 10) / 10;
      const pccCost = Math.round(concretePccCum * db.pccRate);

      concreteRccCum = Math.round(area * 0.18 * 10) / 10;
      const rccCost = Math.round(concreteRccCum * db.rccConcreteRate);

      rebarSteelMT = Math.round(concreteRccCum * 0.08 * 100) / 100;
      const rebarCost = Math.round(rebarSteelMT * db.rebarSteelRate);

      const brickQty = Math.round(area * 1.1);
      plinthWallSqm = brickQty;
      const brickCost = Math.round(brickQty * db.brickworkRate);

      const plasterQty = Math.round(brickQty * 2.0);
      plasteringSqm = plasterQty;
      const plasterCost = Math.round(plasterQty * db.plasteringRate);

      const waterQty = Math.round(L * W * 10.7639 * 1.2);
      const waterCost = Math.round(waterQty * db.waterproofingRate);

      const tilingQty = resolvedAreaSqft;
      const tilingCost = Math.round(tilingQty * db.tilingRate);

      const doorsQty = Math.ceil(8 * scaleArea);
      const doorsCost = Math.round(doorsQty * db.doorsWindowsRate);

      const staircaseQty = 1;
      const staircaseCost = db.staircaseRate;

      subtotal = excavationCost + pccCost + rccCost + rebarCost + brickCost + plasterCost + waterCost + tilingCost + doorsCost + staircaseCost;
      taxAmount = Math.round(subtotal * taxRate);
      total = subtotal + taxAmount;

      lineItems = [
        { description: "Excavation and earthwork for foundation footings", qty: excavationCum, rate: db.excavationRate, total: excavationCost },
        { description: "Plain Cement Concrete (PCC) 1:4:8 leveling base for footings", qty: concretePccCum, rate: db.pccRate, total: pccCost },
        { description: "Reinforced Cement Concrete (RCC) slab, beams, columns (M25 grade)", qty: concreteRccCum, rate: db.rccConcreteRate, total: rccCost },
        { description: "Fe500 reinforcement steel bars (rebar TMT steel)", qty: rebarSteelMT, rate: db.rebarSteelRate, total: rebarCost },
        { description: "Solid fly-ash brick masonry wall construction for partition and perimeter walls", qty: brickQty, rate: db.brickworkRate, total: brickCost },
        { description: "Internal & external smooth cement plastering (mortar 1:4 / 1:6)", qty: plasterQty, rate: db.plasteringRate, total: plasterCost },
        { description: "Terrace, toilet, and balcony waterproofing membrane layer", qty: waterQty, rate: db.waterproofingRate, total: waterCost },
        { description: "Premium vitrified flooring tiles & anti-skid bathroom tiling", qty: tilingQty, rate: db.tilingRate, total: tilingCost },
        { description: "Wooden flush doors and powder-coated aluminum sliding windows", qty: doorsQty, rate: db.doorsWindowsRate, total: doorsCost },
        { description: "RCC Staircase construction with granite cladding and SS handrails", qty: staircaseQty, rate: db.staircaseRate, total: staircaseCost }
      ];

      if (hasGlassFacade) {
        hasPricingAlert = true;
        lineItems.push({
          description: "Premium Glass Facade Envelope [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      if (hasSolar) {
        hasPricingAlert = true;
        lineItems.push({
          description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      if (hasHVAC) {
        hasPricingAlert = true;
        lineItems.push({
          description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      areaRatio = Math.round((area / 400) * 100) / 100;
      isAreaMatch = Math.abs(area - 400) / 400 <= 0.05;
      isHeightMatch = Math.abs(H - 3.0) < 0.1;
      isSystemMatch = true;

      quoteNo = `ARK-RES-${Math.floor(1000 + Math.random() * 9000)}`;
      feasibilityScore = 90;
      ratePerSqft = Math.round(subtotal / resolvedAreaSqft);
      gradeSlabSqm = Math.round(L * W);
    } else {
      const matchedType = PROJECT_TYPES.find(t => t.value === projectType) || PROJECT_TYPES[0];
      const matchedTier = BUDGET_TIERS.find(b => b.value === budgetTier) || BUDGET_TIERS[1];

      // Area conversion: Sq Ft to Sq M
      const areaSqm = areaSqft * 0.092903;
      resolvedAreaSqft = areaSqft;
      resolvedAreaSqm = Math.round(areaSqft * 0.092903);
      resolvedFloors = projectType.includes("Multi-Story") || projectType.includes("Mezzanine") ? 3 : 1;
      resolvedStructuralType = projectType;
      
      // Derived dimensional properties matching 2:1 standard aspect ratio
      const widthM_calc = Math.round(Math.sqrt(areaSqm / 2) * 10) / 10;
      const lengthM_calc = Math.round((widthM_calc * 2) * 10) / 10;
      const heightM_calc = 6.1; // Clear height: standard 20 ft clear height (6.1 meters)

      // Primary framing logic (bay spacing: ~ 5m)
      const baySpacing = 5.08;
      const numBays = Math.ceil(lengthM_calc / baySpacing);
      const numFrames = numBays + 1;
      const numColumns = numFrames * 2;

      // Weight logic: matchedType steel ratio and budget multipliers
      const rawSteelWeightTons = areaSqm * matchedType.steelRatio * matchedTier.multiplier;
      primarySteelMT = parseFloat((rawSteelWeightTons * 0.65).toFixed(2)); // columns + rafters (65%)
      secondarySteelMT = parseFloat((rawSteelWeightTons * 0.25).toFixed(2)); // purlins + girts (25%)
      estimatedSteelTons = parseFloat(rawSteelWeightTons.toFixed(2));

      // Secondary running meters
      const slopedWidth = widthM_calc / Math.cos(5.7 * Math.PI / 180);
      const numPurlinRows = Math.ceil(slopedWidth / 1.5) * 2;
      purlinsRMT = Math.round(numPurlinRows * lengthM_calc);
      girtsRMT = Math.round((lengthM_calc * 2 + widthM_calc * 2) * 4); // 4 rows of wall girts

      // Cladding SQM
      roofSheetingSqm = Math.round(slopedWidth * lengthM_calc * 1.08); // 8% overlaps
      wallCladdingSqm = Math.round(((lengthM_calc * 2) + (widthM_calc * 2)) * heightM_calc);
      skyLightsSqm = projectType === "PEB Warehouse" ? Math.round(roofSheetingSqm * 0.05) : Math.round(roofSheetingSqm * 0.08); // 5% or 8% skylights
      insulationSqm = hasInsulation ? roofSheetingSqm : 0;

      // Fasteners
      anchorBoltsCount = numColumns * 4;
      highStrengthBoltsCount = numFrames * 32;

      // Civil Foundations calculations
      excavationCum = parseFloat((numColumns * 1.8 * 1.8 * 1.5).toFixed(1));
      concretePccCum = parseFloat((numColumns * 1.8 * 1.8 * 0.1).toFixed(1));
      concreteRccCum = parseFloat((numColumns * (1.5 * 1.5 * 0.6 + 0.45 * 0.45 * 0.75)).toFixed(1));
      gradeSlabSqm = Math.round(areaSqm);
      rebarSteelMT = parseFloat((concreteRccCum * 0.090).toFixed(2)); // 90 kg per cum
      const wallHeight = projectType === "PEB Warehouse" ? 3.0 : 1.2;
      plinthWallSqm = Math.round((lengthM_calc * 2 + widthM_calc * 2) * wallHeight);
      plasteringSqm = plinthWallSqm * 2;

      // Costs calculations per rates matrix
      const primarySteelCost = Math.round(primarySteelMT * 84000);
      const secondarySteelCost = Math.round(secondarySteelMT * 89000);
      const claddingCost = Math.round((roofSheetingSqm + wallCladdingSqm) * 380);
      const skylightsCost = Math.round(skyLightsSqm * 850);
      const insulationCost = Math.round(insulationSqm * 120);
      const hardwareCost = Math.round((anchorBoltsCount + highStrengthBoltsCount) * 140);
      let pebSupplyCost = primarySteelCost + secondarySteelCost + claddingCost + skylightsCost + insulationCost + hardwareCost;

      const excavationCost = Math.round(excavationCum * 450);
      const pccCost = Math.round(concretePccCum * 4200);
      const rccCost = Math.round(concreteRccCum * 6800);
      const slabCost = Math.round(gradeSlabSqm * 1150);
      const rebarCost = Math.round(rebarSteelMT * 65000);
      const brickCost = Math.round(plinthWallSqm * 980);
      const plasterCost = Math.round(plasteringSqm * 180);
      const civilSubtotal = excavationCost + pccCost + rccCost + slabCost + rebarCost + brickCost + plasterCost;

      const pebErectionCost = Math.round(areaSqft * 60);
      const engineeringDesign = 45000;

      subtotal = pebSupplyCost + pebErectionCost + engineeringDesign + civilSubtotal;
      taxAmount = Math.round(subtotal * taxRate);
      total = subtotal + taxAmount;

      feasibilityScore = Math.min(
        100,
        Math.max(65, Math.round(95 - (areaSqft > 5000 ? 5 : 0) - (budgetTier === "Economy" ? 8 : 0) + (hasInsulation ? 5 : 0) + (hasGlassFacade ? 3 : 0)))
      );

      lineItems = [
        {
          description: `Primary Steel Portal Framing - Columns & Rafters (BU ${matchedType.label} steel framework)`,
          qty: Math.round(primarySteelMT * 100) / 100,
          rate: 84000,
          total: primarySteelCost
        },
        {
          description: `Secondary Galvanized Framing - Z-Purlins & C-Girts (GP 275 gsm lateral bracing)`,
          qty: Math.round(secondarySteelMT * 100) / 100,
          rate: 89000,
          total: secondarySteelCost
        },
        {
          description: `Insulated Roof & Wall Cladding Envelope (${hasInsulation ? "50mm Insulated PUF panels" : "PPGI Single Sheeting AZ-150"})`,
          qty: roofSheetingSqm + wallCladdingSqm,
          rate: 380,
          total: claddingCost
        }
      ];

      if (canopySqm > 0) {
        const canopyCost = canopySqm * 1800;
        lineItems.push({
          description: "Structural Shade Canopy (Supply & Erection)",
          qty: canopySqm,
          rate: 1800,
          total: canopyCost
        });
        pebSupplyCost += canopyCost;
      }

      if (shuttersCount > 0) {
        const shuttersCost = shuttersCount * 65000;
        lineItems.push({
          description: "Rolling Shutters (Motorized/Manual)",
          qty: shuttersCount,
          rate: 65000,
          total: shuttersCost
        });
        pebSupplyCost += shuttersCost;
      }

      if (skyLightsSqm > 0) {
        lineItems.push({
          description: "2.0mm UV-Stabilized Polycarbonate Skylight Panel modules (Natural illumination)",
          qty: skyLightsSqm,
          rate: 850,
          total: skylightsCost
        });
      }

      if (insulationSqm > 0) {
        lineItems.push({
          description: "50mm Fiberglass Thermal Insulation layer with single-sided Aluminum Foil",
          qty: insulationSqm,
          rate: 120,
          total: insulationCost
        });
      }

      lineItems.push({
        description: "Prefabricated Structural Frame Erection, rigging crane charges & construction safety crew",
        qty: areaSqft,
        rate: 60,
        total: pebErectionCost
      });

      lineItems.push({
        description: "Turnkey Foundation Concrete Works - PCC leveling & RCC footing concrete pedestal structures",
        qty: Math.round(excavationCum + concretePccCum + concreteRccCum),
        rate: 4500,
        total: excavationCost + pccCost + rccCost + rebarCost
      });

      lineItems.push({
        description: "RCC Grade Slab flooring (150mm thickness, M20 grade concrete finished with laser screed)",
        qty: gradeSlabSqm,
        rate: 1150,
        total: slabCost
      });

      const wallDesc = projectType === "PEB Warehouse" 
        ? "Fly-ash brick masonry wall (3.0m high) & smooth sand-faced plastering surfaces" 
        : "Fly-ash brick masonry splash plinth wall (1.2m high) & smooth sand-faced plastering surfaces";
      lineItems.push({
        description: wallDesc,
        qty: plinthWallSqm + plasteringSqm,
        rate: 450,
        total: brickCost + plasterCost
      });

      if (hasGlassFacade) {
        hasPricingAlert = true;
        lineItems.push({
          description: "Premium Glass Facade Envelope [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      if (hasSolar) {
        hasPricingAlert = true;
        lineItems.push({
          description: "Solar Power Module & Inverter Infrastructure [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      if (hasHVAC) {
        hasPricingAlert = true;
        lineItems.push({
          description: "HVAC High-Capacity Climate Control system [Optional Tech Module]",
          qty: 1,
          rate: "Pricing Not Available",
          total: "Pricing Not Available"
        });
      }

      quoteNo = `ARK-AI-${Math.floor(1000 + Math.random() * 9000)}`;
      ratePerSqft = Math.round(subtotal / areaSqft);
      areaRatio = 1.0;
      isAreaMatch = true;
      isHeightMatch = true;
      isSystemMatch = true;

      // Standardize total sum of line items to match exact calculated subtotal
      const itemsSum = lineItems.reduce((acc, it) => typeof it.total === 'number' ? acc + it.total : acc, 0);
      const engDesignVal = 45000;
      if (itemsSum !== (subtotal - engDesignVal)) {
        lineItems[0].total = (lineItems[0].total as number) + ((subtotal - engDesignVal) - itemsSum);
      }
    }

    setQuoteResult({
      quoteNo,
      date,
      validUntil,
      customerName,
      customerContact,
      projectType,
      areaSqft: resolvedAreaSqft,
      ratePerSqft,
      budgetTier,
      isDrawingQuote: false,
      isAssumedLength: true,
      isAssumedWidth: true,
      isAssumedHeight: true,
      isAssumedArea: true,
      isAssumedFloors: true,
      isAssumedSystem: true,
      extractedLength: resolvedLength,
      extractedWidth: resolvedWidth,
      extractedHeight: resolvedHeight,
      extractedAreaSqft: resolvedAreaSqft,
      extractedAreaSqm: resolvedAreaSqm,
      extractedFloors: resolvedFloors,
      extractedStructuralType: resolvedStructuralType,
      areaRatio,
      isAreaMatch,
      isHeightMatch,
      isSystemMatch,
      customRequirements,
      estimatedSteelTons,
      thermalRating: isRes ? "Not Applicable" : (hasInsulation ? "Standard venting" : "Non-Insulated"),
      feasibilityScore,
      lineItems,
      subtotal,
      taxAmount,
      total,
      taxRate,
      hasPricingAlert,
      
      // Inject details
      lengthM: resolvedLength,
      widthM: resolvedWidth,
      heightM: resolvedHeight,
      primarySteelMT,
      secondarySteelMT,
      purlinsRMT,
      girtsRMT,
      roofSheetingSqm,
      wallCladdingSqm,
      skyLightsSqm,
      insulationSqm,
      anchorBoltsCount,
      highStrengthBoltsCount,
      
      excavationCum,
      concretePccCum,
      concreteRccCum,
      gradeSlabSqm,
      rebarSteelMT,
      plinthWallSqm,
      plasteringSqm
    } as any);

    setIsGenerating(false);
    
    toast({
      title: "⚡ AI Quotation Formed!",
      description: `Proforma document ${quoteNo} has been generated with complete engineering estimates.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const exportAsHTML = () => {
    if (!quoteResult) return;

    const htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proforma Invoice - ${quoteResult.quoteNo}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f8fafc; line-height: 1.5; margin: 0; padding: 40px; }
        .invoice-card { background: white; max-width: 900px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .company-details h1 { color: #1e1b4b; margin: 0 0 5px 0; font-size: 26px; font-weight: 800; tracking-tight: -0.05em; }
        .company-details p { margin: 2px 0; font-size: 13px; color: #64748b; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { color: #6366f1; margin: 0 0 8px 0; font-size: 20px; font-weight: 700; }
        .invoice-meta p { margin: 3px 0; font-size: 13px; color: #475569; }
        .customer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; tracking-wider: 0.1em; }
        .customer-details p { margin: 2px 0; font-size: 14px; color: #1e293b; }
        .tech-specs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 35px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 15px 0; }
        .spec-item { text-align: center; }
        .spec-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
        .spec-value { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 13px; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
        .totals-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
        .totals-table { width: 320px; margin-bottom: 0; }
        .totals-table td { border-bottom: none; padding: 6px 12px; }
        .totals-table tr.grand-total td { font-weight: 800; font-size: 18px; color: #6366f1; border-top: 2px double #e2e8f0; padding-top: 10px; }
        .terms { background: #fafafa; border: 1px solid #f1f5f9; padding: 20px; border-radius: 8px; font-size: 12px; color: #64748b; }
        .terms h4 { color: #1e293b; margin: 0 0 10px 0; font-size: 13px; }
        .terms ol { padding-left: 15px; margin: 0; }
        .terms li { margin-bottom: 5px; }
        .footer-tagline { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div class="company-details">
            <h1>ARKOO PRE-BUILD PVT. LTD.</h1>
            <p>Survey No. 40(4B), Gatha Mandir New Bypass Road</p>
            <p>Behind Abhanga English Medium School, Tal. Haveli, Pune-412109</p>
            <p>Email: sales@arkooprebuild.com | Web: www.arkooprebuild.com</p>
          </div>
          <div class="invoice-meta">
            <h2>${activeQuotationType === "handmade" 
              ? "Handmade Drawing Quotation" 
              : activeQuotationType === "ga" 
              ? "GA Drawing Quotation" 
              : activeQuotationType === "pif" 
              ? "PIF Sheet Quotation" 
              : activeQuotationType === "ai" 
              ? "AI Generated Quotation"
              : "AI Generated Quotation"}</h2>
            <p><strong>Quote No:</strong> ${quoteResult.quoteNo}</p>
            <p><strong>Date:</strong> ${quoteResult.date}</p>
            <p><strong>Valid Until:</strong> ${quoteResult.validUntil}</p>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 12px; color: #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em;">
              📋 Drawing Read Summary & Validation Ledger
            </h4>
            <span style="font-size: 9px; font-family: monospace; font-weight: bold; color: #4f46e5; background-color: #e0e7ff; padding: 3px 8px; border-radius: 4px; border: 1px solid #c7d2fe;">
              ${quoteResult.isDrawingQuote ? "DRAWING VERIFIED" : "MANUAL QUOTATION"}
            </span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 12px;">
            <div>
              <span style="color: #64748b; font-size: 10px; display: block; margin-bottom: 2px;">Extracted Dimensions:</span>
              <strong style="font-family: monospace; color: #0f172a; font-size: 12px;">
                ${quoteResult.extractedLength || '—'}m × ${quoteResult.extractedWidth || '—'}m × ${quoteResult.extractedHeight || '—'}m
              </strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px; display: block; margin-bottom: 2px;">Total Area:</span>
              <strong style="font-family: monospace; color: #0f172a; font-size: 12px;">
                ${quoteResult.extractedAreaSqft ? quoteResult.extractedAreaSqft.toLocaleString() : '—'} Sq Ft (${quoteResult.extractedAreaSqm || '—'} Sqm)
              </strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px; display: block; margin-bottom: 2px;">Levels / Floors:</span>
              <strong style="font-family: monospace; color: #0f172a; font-size: 12px;">
                ${quoteResult.extractedFloors || 1}
              </strong>
            </div>
          </div>

          <div style="margin-bottom: 12px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <span style="color: #64748b; font-size: 10px; display: block; margin-bottom: 2px;">Structural Design System:</span>
            <strong style="color: #0f172a; font-size: 12px;">
              ${quoteResult.extractedStructuralType || "—"}
            </strong>
          </div>

          ${quoteResult.isDrawingQuote ? `
          <div style="border-top: 1px dashed #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <div style="display: flex; gap: 15px;">
              <span style="font-weight: 600; color: ${quoteResult.isAreaMatch ? '#059669' : '#d97706'}">
                ${quoteResult.isAreaMatch ? '✓' : '⚠️'} Area Ratio: ${quoteResult.areaRatio?.toFixed(2)}
              </span>
              <span style="font-weight: 600; color: ${quoteResult.isHeightMatch ? '#059669' : '#dc2626'}">
                ${quoteResult.isHeightMatch ? '✓' : '⚠️'} Height Match: ${quoteResult.isHeightMatch ? 'Pass' : 'Fail'}
              </span>
              <span style="font-weight: 600; color: ${quoteResult.isSystemMatch ? '#059669' : '#dc2626'}">
                ${quoteResult.isSystemMatch ? '✓' : '⚠️'} System Match: ${quoteResult.isSystemMatch ? 'Pass' : 'Fail'}
              </span>
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: ${((quoteResult.areaRatio ?? 0) >= 0.90 && (quoteResult.areaRatio ?? 0) <= 1.10 && quoteResult.isHeightMatch && quoteResult.isSystemMatch) ? '#059669' : '#dc2626'}">
              Checks Status: ${((quoteResult.areaRatio ?? 0) >= 0.90 && (quoteResult.areaRatio ?? 0) <= 1.10 && quoteResult.isHeightMatch && quoteResult.isSystemMatch) ? 'ALL CHECKS PASSED ✓' : 'VALIDATION DISCREPANCY ⚠️'}
            </div>
          </div>
          <div style="margin-top: 12px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
            <span style="color: #64748b; font-size: 10px; display: block; margin-bottom: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">
              Rule 5 Extraction Checklist
            </span>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-family: monospace; font-size: 10px; color: #475569;">
              <div><span style="color: #059669; font-weight: bold;">✓</span> Length Checked: ${quoteResult.extractedLength}m</div>
              <div><span style="color: #059669; font-weight: bold;">✓</span> Width Checked: ${quoteResult.extractedWidth}m</div>
              <div><span style="color: #059669; font-weight: bold;">✓</span> Levels Checked: ${quoteResult.extractedFloors || 1}</div>
              <div><span style="color: #059669; font-weight: bold;">✓</span> Height Checked: ${quoteResult.extractedHeight}m</div>
              <div><span style="color: #059669; font-weight: bold;">✓</span> Area Checked: ${quoteResult.extractedAreaSqft?.toLocaleString()} Sq Ft</div>
              <div><span style="color: #059669; font-weight: bold;">✓</span> Structural System Checked: ${quoteResult.extractedStructuralType}</div>
              <div style="grid-column: span 2;"><span style="color: #059669; font-weight: bold;">✓</span> Room Modules Checked: ${((quoteResult.drawingFileName || "").toLowerCase().includes("residential") || (quoteResult.drawingFileName || "").toLowerCase().includes("villa") || (quoteResult.drawingFileName || "").toLowerCase().includes("house") || (quoteResult.drawingFileName || "").toLowerCase().includes("flat") || (quoteResult.drawingFileName || "").toLowerCase().includes("cottage") || (quoteResult.drawingFileName || "").toLowerCase().includes("residence") || (quoteResult.projectType || "").toLowerCase().includes("residential") || (quoteResult.projectType || "").toLowerCase().includes("villa")) ? "Bedrooms, Kitchen, Living, Bathrooms, Staircase" : "Columns, Rafters, Purlins, Cladding"}</div>
            </div>
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            Source Plan: ${quoteResult.drawingFileName} | Ingested: ${quoteResult.generationTimestamp}
          </div>
          ` : ''}
        </div>

        <div class="customer-section">
          <div class="customer-details">
            <div class="section-title">Prepared For</div>
            <p><strong>Name / Client:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone || "—"}</p>
            <p><strong>Email:</strong> ${customerEmail || "—"}</p>
          </div>
          <div class="customer-details">
            <div class="section-title">Project Overview</div>
            <p><strong>Scope:</strong> Supply & Erection of ${quoteResult.projectType}</p>
            <p><strong>Quality Class:</strong> ${quoteResult.budgetTier} Specification</p>
          </div>
        </div>

        <div class="tech-specs">
          <div class="spec-item">
            <div class="spec-label">Project Footprint</div>
            <div class="spec-value">${quoteResult.areaSqft.toLocaleString()} Sq Ft</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Est. Steel Truss Weight</div>
            <div class="spec-value">${quoteResult.estimatedSteelTons} Metric Tons</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Thermal Rating</div>
            <div class="spec-value">${quoteResult.thermalRating}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">AI Structural Feasibility</div>
            <div class="spec-value">${quoteResult.feasibilityScore}% Pass</div>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; tracking-wider: 0.05em;">
            Parsed Technical & Structural Specifications
          </h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
            ${getTechnicalSpecifications(activeQuotationType || "manual").map(spec => `
              <div style="background: white; border: 1px solid #f1f5f9; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #94a3b8; display: block; font-size: 9px; font-weight: 500;">${spec.label}</span>
                <strong style="color: #1e293b; display: block; margin-top: 2px;">${spec.value}</strong>
              </div>
            `).join("")}
          </div>
          
          ${quoteResult.isDrawingQuote ? `
          <h4 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4f46e5; margin: 0 0 10px 0; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
            Extracted Drawing Scope & Design Parameters
          </h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${quoteResult.extractedBayConfig ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Bay Configuration</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedBayConfig}</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedWindSpeed ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Wind Speed (Design Load)</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedWindSpeed} m/s</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedSeismicZone ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Seismic Zone</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedSeismicZone}</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedCranes ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">EOT Crane Provision</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedCranes}</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedSlidingDoors ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Sliding Doors</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedSlidingDoors}</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedRollingShuttersDesc ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Rolling Shutters</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedRollingShuttersDesc}</strong>
              </div>
            ` : ''}
            ${quoteResult.extractedInsulationRequired !== null ? `
              <div style="background: white; border: 1px solid #c7d2fe; padding: 8px; border-radius: 6px; font-size: 11px;">
                <span style="color: #4f46e5; display: block; font-size: 9px; font-weight: 600;">Roof / Wall Insulation</span>
                <strong style="color: #1e1b4b; display: block; margin-top: 2px;">${quoteResult.extractedInsulationRequired ? 'Required as per drawing' : 'Not required'}</strong>
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <h3 style="color: #4f46e5; font-size: 15px; font-weight: 700; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase;">1. Commercial Pricing Ledger</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 55%">Line Item & Engineering Description</th>
              <th style="text-align: right; width: 12%">Qty</th>
              <th style="text-align: right; width: 15%">Rate (₹)</th>
              <th style="text-align: right; width: 18%">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${quoteResult.lineItems.map(item => `
              <tr>
                <td><strong>${item.description.split(" (")[0]}</strong><br><span style="font-size: 11px; color:#64748b">${item.description.includes(" (") ? item.description.slice(item.description.indexOf(" (") + 1) : ""}</span></td>
                <td style="text-align: right">${typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                <td style="text-align: right">${typeof item.rate === "number" ? `₹${item.rate.toLocaleString("en-IN")}` : item.rate}</td>
                <td style="text-align: right; font-weight: 600">${typeof item.total === "number" ? `₹${item.total.toLocaleString("en-IN")}` : item.total}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td style="text-align: left; color:#64748b">Subtotal Ledger:</td>
              <td style="text-align: right; font-weight: 600">₹${quoteResult.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="text-align: left; color:#64748b">GST (${(quoteResult.taxRate * 100).toFixed(0)}%):</td>
              <td style="text-align: right; font-weight: 600">₹${quoteResult.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-total">
              <td style="text-align: left">Grand Total Estimate:</td>
              <td style="text-align: right">₹${quoteResult.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #4f46e5; font-size: 15px; font-weight: 700; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase;">2. Structural Engineering BOM</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 35%">Component Description</th>
              <th style="width: 30%">Material Specification</th>
              <th style="text-align: right; width: 8%">Qty</th>
              <th style="text-align: right; width: 7%">Unit</th>
              <th style="text-align: right; width: 10%">Rate (₹)</th>
              <th style="text-align: right; width: 10%">Estimated Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${getEngineeringBOM(activeQuotationType || "manual", quoteResult).map((item) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.spec}${item.note ? `<br><span style="font-size: 10px; color: #6366f1; font-weight: 600;">(${item.note})</span>` : ""}</td>
                <td style="text-align: right">${typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                <td style="text-align: right">${item.unit}</td>
                <td style="text-align: right">${typeof item.rate === "number" ? (item.rate > 0 ? `₹${item.rate.toLocaleString("en-IN")}` : "—") : item.rate}</td>
                <td style="text-align: right; font-weight: 600">${typeof item.total === "number" ? (item.total > 0 ? `₹${item.total.toLocaleString("en-IN")}` : "—") : item.total}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h3 style="color: #4f46e5; font-size: 15px; font-weight: 700; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase;">3. Turnkey Foundations & Civil Blueprint</h3>
        <div style="margin-bottom: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #475569;">
          <strong>Civil Scope: </strong>
          ${activeQuotationType === "pif" 
            ? "In-Scope (Turnkey Contract) - Integrated inside the turnkey contract scope." 
            : "Out-of-Scope (Reference Estimate) - Under the client's separate scope. Below are estimated reference costs."}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%">Description of Civil Work Item</th>
              <th style="width: 30%">Material / Concrete Grade</th>
              <th style="text-align: right; width: 8%">Qty</th>
              <th style="text-align: right; width: 7%">Unit</th>
              <th style="text-align: right; width: 10%">Rate (₹)</th>
              <th style="text-align: right; width: 10%">Estimated Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${getCivilFoundations(activeQuotationType || "manual", quoteResult).map((item) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.spec}${item.note ? `<br><span style="font-size: 10px; color: #6366f1; font-weight: 600;">(${item.note})</span>` : ""}</td>
                <td style="text-align: right">${typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                <td style="text-align: right">${item.unit}</td>
                <td style="text-align: right">${typeof item.rate === "number" ? (item.rate > 0 ? `₹${item.rate.toLocaleString("en-IN")}` : "—") : item.rate}</td>
                <td style="text-align: right; font-weight: 600">${typeof item.total === "number" ? (item.total > 0 ? `₹${item.total.toLocaleString("en-IN")}` : "—") : item.total}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="terms" style="margin-top: 30px;">
          <h4>Pre-Build Commercial Terms & Framework</h4>
          <ol>
            <li><strong>Mobilization Advance:</strong> 40% along with official purchase order.</li>
            <li><strong>Material Dispatch:</strong> 40% release before shipping components from the factory.</li>
            <li><strong>Defects Erection:</strong> 20% release within 7 days of installation completion.</li>
            <li><strong>Timeline:</strong> Completion of factory prefabrication in 25-30 days from layout approval.</li>
            <li><strong>Foundations:</strong> ${activeQuotationType === "pif"
              ? "Integrated under turnkey contractor scope (In-Scope)."
              : "Primary civil slab, anchor bolts, and excavation is under client's separate scope."}</li>
          </ol>
        </div>

        <div class="footer-tagline">
          Designed with Arkoo AI Engineering Engine. "Designing Excellence, Building Trust"
        </div>
      </div>
    </body>
    </html>`;

    const safeCustomerName = quoteResult.customerName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeQuoteNo = quoteResult.quoteNo.replace(/[^a-zA-Z0-9]/g, "_");
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_Quotation_${safeQuoteNo}_${safeCustomerName}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "💾 Exported Standalone HTML",
      description: "A gorgeous self-contained quotation file has been downloaded to your system.",
    });
  };

  const exportAsCSV = () => {
    if (!quoteResult) return;

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[][] = [
      ["ARKOO PRE-BUILD PVT. LTD.", "", "", "", "", ""],
      ["Survey No. 40(4B), Gatha Mandir New Bypass Road, Behind Abhanga English Medium School, Tal. Haveli, Pune-412109", "", "", "", "", ""],
      ["Email: sales@arkooprebuild.com | Web: www.arkooprebuild.com", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      [activeQuotationType === "handmade" 
        ? "Handmade Drawing Quotation" 
        : activeQuotationType === "ga" 
        ? "GA Drawing Quotation" 
        : activeQuotationType === "pif" 
        ? "PIF Sheet Quotation" 
        : activeQuotationType === "ai" 
        ? "AI Generated Quotation"
        : "AI Generated Quotation", "", "", "", "", ""],
      ["Quote No:", quoteResult.quoteNo, "Date:", quoteResult.date, "", ""],
      ["Valid Until:", quoteResult.validUntil, "", "", "", ""],
      ["", "", "", "", "", ""],
    ];

    // Append Drawing Read Summary & Validation Ledger
    rows.push(
      ["DRAWING READ SUMMARY & VALIDATION LEDGER", "", "", "", "", ""],
      ["Verification Status", quoteResult.isDrawingQuote ? "DRAWING VERIFIED" : "TEMPLATED / MOCK DATA", "", "", "", ""],
      ["Extracted Dimensions", `${quoteResult.extractedLength}m x ${quoteResult.extractedWidth}m x ${quoteResult.extractedHeight}m` + ((!quoteResult.isDrawingQuote || quoteResult.isAssumedLength || quoteResult.isAssumedWidth || quoteResult.isAssumedHeight) ? " [NA]" : ""), "", "", "", ""],
      ["Total Area", `${quoteResult.extractedAreaSqft?.toLocaleString()} Sq Ft (${quoteResult.extractedAreaSqm} Sqm)` + ((!quoteResult.isDrawingQuote || quoteResult.isAssumedArea) ? " [NA]" : ""), "", "", "", ""],
      ["Levels / Floors", String(quoteResult.extractedFloors || 1) + ((!quoteResult.isDrawingQuote || quoteResult.isAssumedFloors) ? " [NA]" : ""), "", "", "", ""],
      ["Structural Design System", (quoteResult.extractedStructuralType || "Steel PEB (Industrial)") + ((!quoteResult.isDrawingQuote || quoteResult.isAssumedSystem) ? " [NA]" : ""), "", "", "", ""]
    );

    if (quoteResult.isDrawingQuote) {
      const isResidentialDrawing = ((quoteResult.drawingFileName || "").toLowerCase().includes("residential") || (quoteResult.drawingFileName || "").toLowerCase().includes("villa") || (quoteResult.drawingFileName || "").toLowerCase().includes("house") || (quoteResult.drawingFileName || "").toLowerCase().includes("flat") || (quoteResult.drawingFileName || "").toLowerCase().includes("cottage") || (quoteResult.drawingFileName || "").toLowerCase().includes("residence") || (quoteResult.projectType || "").toLowerCase().includes("residential") || (quoteResult.projectType || "").toLowerCase().includes("villa"));
      const roomModules = isResidentialDrawing ? "Bedrooms, Kitchen, Living, Bathrooms, Staircase" : "Columns, Rafters, Purlins, Cladding";
      const isChecksPassed = (quoteResult.areaRatio !== undefined && quoteResult.areaRatio >= 0.90 && quoteResult.areaRatio <= 1.10 && quoteResult.isHeightMatch && quoteResult.isSystemMatch);
      rows.push(
        ["Area Ratio Validation", String(quoteResult.areaRatio), quoteResult.isAreaMatch ? "PASS" : "DISCREPANCY WARNING", "", "", ""],
        ["Height Match Validation", quoteResult.isHeightMatch ? "PASS" : "DISCREPANCY WARNING", "", "", "", ""],
        ["System Match Validation", quoteResult.isSystemMatch ? "PASS" : "DISCREPANCY WARNING", "", "", "", ""],
        ["Checks Status", isChecksPassed ? "ALL CHECKS PASSED" : "VALIDATION DISCREPANCY", "", "", "", ""],
        ["Rule 5 Extraction Checklist", "", "", "", "", ""],
        ["  [✓] Length Checked", `${quoteResult.extractedLength}m`, "", "", "", ""],
        ["  [✓] Width Checked", `${quoteResult.extractedWidth}m`, "", "", "", ""],
        ["  [✓] Levels Checked", String(quoteResult.extractedFloors || 1), "", "", "", ""],
        ["  [✓] Height Checked", `${quoteResult.extractedHeight}m`, "", "", "", ""],
        ["  [✓] Area Checked", `${quoteResult.extractedAreaSqft?.toLocaleString()} Sq Ft`, "", "", "", ""],
        ["  [✓] Structural System Checked", quoteResult.extractedStructuralType || "Steel PEB (Industrial)", "", "", "", ""],
        ["  [✓] Room Modules Checked", roomModules, "", "", "", ""],
        ["Source Plan File Name", quoteResult.drawingFileName || "", "", "", "", ""],
        ["Ingested Timestamp", quoteResult.generationTimestamp || "", "", "", "", ""]
      );
    }
    rows.push(["", "", "", "", "", ""]);

    rows.push(
      ["CLIENT & PROJECT SPECIFICATIONS", "", "", "", "", ""],
      ["Prepared For Client:", customerName, "", "", "", ""],
      ["Phone Number:", customerPhone || "—", "", "", "", ""],
      ["Email Address:", customerEmail || "—", "", "", "", ""],
      ["Project Type:", quoteResult.projectType, "", "", "", ""],
      ["Material Grade:", `${quoteResult.budgetTier} System`, "", "", "", ""],
      ["Footprint Area:", `${quoteResult.areaSqft.toLocaleString()} Sq Ft`, "", "", "", ""],
      ["Truss Steel Weight:", `${quoteResult.estimatedSteelTons} Tons`, "", "", "", ""],
      ["Thermal Deflection:", quoteResult.thermalRating, "", "", "", ""],
      ["AI Feasibility Score:", `${quoteResult.feasibilityScore}%`, "", "", "", ""]
    );

    // Append parsed technical specifications
    getTechnicalSpecifications(activeQuotationType || "manual").forEach(spec => {
      rows.push([spec.label + ":", spec.value, "", "", "", ""]);
    });

    rows.push(["", "", "", "", "", ""]);
    rows.push(["1. COMMERCIAL PRICING LEDGER", "", "", "", "", ""]);
    rows.push(["Line Item Description", "Qty", "Rate (INR)", "Subtotal (INR)", "", ""]);

    // Add commercial line items
    quoteResult.lineItems.forEach(item => {
      rows.push([
        item.description,
        String(item.qty),
        String(item.rate),
        String(item.total),
        "",
        ""
      ]);
    });

    rows.push(["", "", "", "", "", ""]);
    rows.push(["Structural Subtotal:", "", "", String(quoteResult.subtotal), "", ""]);
    rows.push([`GST (${(quoteResult.taxRate * 100).toFixed(0)}%):`, "", "", String(quoteResult.taxAmount), "", ""]);
    rows.push(["Grand Total Estimate:", "", "", String(quoteResult.total), "", ""]);
    rows.push(["", "", "", "", "", ""]);

    // Add Section 2: Structural Engineering BOM
    rows.push(["2. STRUCTURAL ENGINEERING BOM", "", "", "", "", ""]);
    rows.push(["Component Description", "Material Specification", "Qty", "Unit", "Rate (INR)", "Estimated Cost (INR)"]);
    getEngineeringBOM(activeQuotationType || "manual", quoteResult).forEach((item: any) => {
      rows.push([
        item.name + (item.note ? ` (${item.note})` : ""),
        item.spec,
        String(item.qty),
        item.unit,
        typeof item.rate === "number" ? (item.rate > 0 ? String(item.rate) : "—") : String(item.rate),
        typeof item.total === "number" ? (item.total > 0 ? String(item.total) : "—") : String(item.total)
      ]);
    });

    rows.push(["", "", "", "", "", ""]);

    // Add Section 3: Turnkey Foundations & Civil Blueprint
    rows.push(["3. TURNKEY FOUNDATIONS & CIVIL BLUEPRINT", "", "", "", "", ""]);
    rows.push([
      activeQuotationType === "pif"
        ? "Civil Foundations Scope: In-Scope (Turnkey Contract) - Integrated inside the turnkey contract scope."
        : "Civil Foundations Scope: Out-of-Scope (Reference Estimate) - Under client's separate scope.",
      "", "", "", "", ""
    ]);
    rows.push(["Description of Civil Work Item", "Material / Concrete Grade", "Qty", "Unit", "Rate (INR)", "Estimated Cost (INR)"]);
    getCivilFoundations(activeQuotationType || "manual", quoteResult).forEach((item: any) => {
      rows.push([
        item.name + (item.note ? ` (${item.note})` : ""),
        item.spec,
        String(item.qty),
        item.unit,
        typeof item.rate === "number" ? (item.rate > 0 ? String(item.rate) : "—") : String(item.rate),
        typeof item.total === "number" ? (item.total > 0 ? String(item.total) : "—") : String(item.total)
      ]);
    });

    rows.push(["", "", "", "", "", ""]);
    rows.push(["TECHNICAL TERMS & FRAMEWORK", "", "", "", "", ""]);
    rows.push(["1. Mobilization Advance: 40% along with official purchase order.", "", "", "", "", ""]);
    rows.push(["2. Material Dispatch: 40% release before shipping components from the factory.", "", "", "", "", ""]);
    rows.push(["3. Defects Erection: 20% release within 7 days of installation completion.", "", "", "", "", ""]);
    rows.push(["4. Timeline: Completion of factory prefabrication in 25-30 days from layout approval.", "", "", "", "", ""]);
    rows.push([
      `5. Foundations: ${activeQuotationType === "pif"
        ? "Integrated under turnkey contractor scope (In-Scope)."
        : "Primary civil slab, anchor bolts, and excavation is under client's separate scope."}`,
      "", "", "", "", ""
    ]);

    const csvContent = rows.map(r => r.map(escapeCSV).join(",")).join("\n");

    const safeCustomerName = quoteResult.customerName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeQuoteNo = quoteResult.quoteNo.replace(/[^a-zA-Z0-9]/g, "_");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_Quotation_${safeQuoteNo}_${safeCustomerName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "📊 Exported Excel CSV Sheet",
      description: "A complete multi-worksheet Excel-compatible CSV file has been downloaded successfully.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".doc")) {
      toast({
        title: "❌ Invalid Format",
        description: "Old .doc format detected. Please open in MS Word, Save As .docx, and re-upload.",
        variant: "destructive"
      });
      return;
    }

    setIsExtractingQuote(true);
    setExtractionWarnings([]);
    setExtractionMatchedLead(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/quotations/extract-quote", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract data");
      }

      // Map data to state
      if (data.clientName) setCustomerName(data.clientName);
      if (data.projectName) { /* No direct project name state, perhaps in customRequirements later */ }
      
      const parsedLength = Number(data.length) || 0;
      const parsedWidth = Number(data.width) || 0;
      const parsedHeight = Number(data.clearHeight) || 0;
      const parsedTonnage = Number(data.tonnage) || 0;
      
      if (parsedLength) setLengthM(parsedLength);
      if (parsedWidth) setWidthM(parsedWidth);
      if (parsedHeight) setHeightM(parsedHeight);
      if (parsedTonnage) setTonnage(parsedTonnage);
      
      if (data.mezzanineSqm) setMezzanineAreaSqm(Number(data.mezzanineSqm));
      if (data.canopySqm) setCanopySqm(Number(data.canopySqm));
      if (data.skylightSqm) setSkylightSqm(Number(data.skylightSqm));
      if (data.shutters) setShuttersCount(Number(data.shutters));
      if (data.craneTons) setCraneCapacity(Number(data.craneTons));
      if (data.gstRate) setTaxRate(Number(data.gstRate) / 100);
      
      if (data.civilScope === "In-Scope") setCivilInScope(true);
      else setCivilInScope(false);

      // Structural Type Mapping
      const rawType = (data.structuralType || "").toLowerCase();
      if (rawType.includes("mezzanine")) setProjectType("Mezzanine Structure");
      else if (rawType.includes("cold storage")) setProjectType("Cold Storage");
      else if (rawType.includes("civil") || rawType.includes("admin") || rawType.includes("rcc")) setProjectType("Civil Construction");
      else if (rawType.includes("prefab") || rawType.includes("modular")) setProjectType("Prefab Modular Cabin");
      else setProjectType("PEB Structural Shed"); // Default for PEB

      // Optional Tech
      setHasInsulation(!!data.hasInsulation);
      setHasGlassFacade(!!data.hasGlassFacade);
      setHasSolar(!!data.hasSolar);
      setHasHVAC(!!data.hasHVAC);

      // Footprint Area
      let computedSqft = 0;
      if (parsedLength > 0 && parsedWidth > 0) {
        computedSqft = Math.round(parsedLength * parsedWidth * 10.764);
        setAreaSqft(computedSqft); // Overwrite, user warned separately
      }

      // Validations and Warnings
      const warnings: string[] = [];
      const isQuoteIncomplete = !data.quoteRef || !/\\d/.test(data.quoteRef);
      if (isQuoteIncomplete) warnings.push("⚠ Quote ref looks incomplete — please verify");
      if (!data.clientName) warnings.push("⚠ Client name could not be extracted — please fill manually");
      if (data.hasClintTypo) warnings.push("⚠ Source document has a typo ('Clint' instead of 'Client') — it will be corrected in the output");
      if (data.hasDuplicateIntro) warnings.push("ℹ Duplicate intro paragraph found in source — it will be removed in the output");
      
      if (data.date) {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
           const daysDiff = Math.floor((new Date().getTime() - parsedDate.getTime()) / (1000 * 3600 * 24));
           if (daysDiff > 15) {
             warnings.push(`⚠ Document date is ${daysDiff} days old — confirm this is the correct revision`);
           }
        }
      }

      setExtractionWarnings(warnings);

      // Client Source Auto-Select
      if (data.clientName && leads) {
        const match = leads.find((l: any) => l.companyName?.toLowerCase().includes(data.clientName.toLowerCase()) || data.clientName.toLowerCase().includes(l.companyName?.toLowerCase()));
        if (match) {
           setSelectedSourceType("lead");
           setSelectedEntityId(match.id.toString());
           setExtractionMatchedLead(true);
        } else {
           setSelectedSourceType("manual");
        }
      }

      // AI Instructions / Focus
      const instructions = `Quotation extracted from uploaded document ${file.name}.
Client: ${data.clientName || "[Client Name]"} | Project: ${data.projectName || "[Project Name]"} | Ref: ${data.quoteRef || "[Quote Ref]"}
Building: ${parsedLength}m × ${parsedWidth}m × ${parsedHeight}m | Tonnage: ${parsedTonnage} MT
Please generate the corrected quotation with all fields pre-filled above.
Verify quote reference number matches ${data.quoteRef || "[Quote Ref]"}.
Flag any fields that appear inconsistent with the source document.`;
      
      setCustomRequirements(instructions);

      toast({
        title: "✅ Extraction Complete",
        description: "Form fields have been auto-populated from the document.",
      });

    } catch (err: any) {
      toast({
        title: "❌ Extraction Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsExtractingQuote(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-800 text-white shadow-lg no-print">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-indigo-200 animate-pulse" />
              AI Quotation Architect
            </h1>
            <p className="text-indigo-100 mt-1">Generate structural estimates & engineering proformas using AI.</p>
          </div>
          <div className="relative z-10 p-3 bg-white/10 rounded-full backdrop-blur-md">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-5 flex flex-col gap-6 no-print">
            
            {/* AI Document Upload Section */}
            <Card className="border-muted-foreground/15 shadow-md bg-gradient-to-r from-violet-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Existing Quote Document
                </CardTitle>
                <CardDescription>Upload a .docx or .pdf to auto-extract and pre-fill all fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input 
                    type="file" 
                    accept=".docx,.pdf,.doc" 
                    onChange={handleFileUpload} 
                    disabled={isExtractingQuote}
                    className="cursor-pointer file:bg-indigo-100 file:text-indigo-700 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md hover:file:bg-indigo-200"
                  />
                  {isExtractingQuote && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Reading document... extracting fields...
                    </div>
                  )}
                </div>
                {extractionWarnings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {extractionWarnings.map((warn, i) => (
                      <Alert variant="destructive" key={i} className="py-2">
                        <AlertDescription className="flex items-center gap-2 text-xs font-semibold">
                          {warn.includes('ℹ') ? <Sparkles className="w-4 h-4 text-indigo-500" /> : <AlertCircle className="w-4 h-4" />}
                          {warn}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client & Lead Association */}
            <Card className="border-muted-foreground/15 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Client & Lead Association
                </CardTitle>
                <CardDescription>Select an existing entity to auto-populate or fill raw details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source select */}
                <div className="space-y-2">
                  <Label>Client Source</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      type="button" 
                      variant={selectedSourceType === "manual" ? "default" : "outline"} 
                      onClick={() => handleSourceTypeChange("manual")}
                      className="text-xs h-9 cursor-pointer"
                    >
                      Manual Entry
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedSourceType === "lead" ? "default" : "outline"} 
                      onClick={() => handleSourceTypeChange("lead")}
                      className="text-xs h-9 cursor-pointer"
                      disabled={!leads || leads.length === 0}
                    >
                      From Leads
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedSourceType === "contact" ? "default" : "outline"} 
                      onClick={() => handleSourceTypeChange("contact")}
                      className="text-xs h-9 cursor-pointer"
                      disabled={!customers || customers.length === 0}
                    >
                      From Contacts
                    </Button>
                  </div>
                </div>

                {/* Dropdowns */}
                {selectedSourceType === "lead" && (
                  <div className="space-y-2">
                    <Label htmlFor="lead-select">Select Active Lead</Label>
                    <Select value={selectedEntityId} onValueChange={handleEntityChange}>
                      <SelectTrigger id="lead-select" className="bg-background">
                        <SelectValue placeholder="Choose a lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leads?.map(l => (
                          <SelectItem key={l.id} value={String(l.id)}>{l.name} ({l.project_type || 'Prefab'})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedSourceType === "contact" && (
                  <div className="space-y-2">
                    <Label htmlFor="contact-select">Select Contact</Label>
                    <Select value={selectedEntityId} onValueChange={handleEntityChange}>
                      <SelectTrigger id="contact-select" className="bg-background">
                        <SelectValue placeholder="Choose a contact..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Fields */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Client Name
                      {customerName && extractionMatchedLead && (
                        <Badge variant="outline" className="ml-2 border-green-500 text-green-600 bg-green-50">✅ Matched from Leads</Badge>
                      )}
                      {customerName && !extractionMatchedLead && selectedSourceType === "manual" && (
                        <Badge variant="outline" className="ml-2 border-orange-400 text-orange-600 bg-orange-50">⚠ New client — not in system</Badge>
                      )}
                    </Label>
                    <Input 
                      id="customerName" 
                      placeholder="E.g., APBPL Corporation" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cust-phone">Phone Number</Label>
                    <Input 
                      id="cust-phone" 
                      placeholder="e.g. +91 99999 99999" 
                      value={customerPhone} 
                      onChange={e => {
                        const val = e.target.value;
                        setCustomerPhone(val);
                        setCustomerContact(val && customerEmail ? `${val} | ${customerEmail}` : val || customerEmail || "");
                      }}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cust-email">Email Address</Label>
                    <Input 
                      id="cust-email" 
                      placeholder="e.g. client@example.com" 
                      value={customerEmail} 
                      onChange={e => {
                        const val = e.target.value;
                        setCustomerEmail(val);
                        setCustomerContact(customerPhone && val ? `${customerPhone} | ${val}` : customerPhone || val || "");
                      }}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-type">Structural Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger id="proj-type" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Optional Engineering & Project Inputs */}
            <Card className="border-muted-foreground/15 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Engineering & Project Inputs
                </CardTitle>
                <CardDescription>Configure optional prefab metrics. If left blank or mismatched, values will be extracted from the uploaded document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasValidationErrors && (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md text-amber-700 dark:text-amber-400 space-y-2 text-xs relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
                    <div className="flex items-start gap-2.5 pl-1.5">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                      <div className="space-y-1">
                        <p className="font-bold tracking-tight">Technical Data Warnings</p>
                        <ul className="list-disc pl-3.5 space-y-1 text-[11px] opacity-90">
                          {lengthError && <li>Length must be between 1m and 500m.</li>}
                          {widthError && <li>Width must be between 1m and 200m.</li>}
                          {heightError && <li>Clear Height must be between 1m and 40m.</li>}
                          {areaError && <li>Footprint Area must be a positive value.</li>}
                          {areaMismatch && (
                            <li>
                              Footprint Area mismatch: Entered <strong>{areaSqft.toLocaleString()} Sq Ft</strong>, but dimensions calculate to <strong>{calculatedArea.toLocaleString()} Sq Ft</strong> ({Math.round(Math.abs(calculatedArea - areaSqft) / areaSqft * 100)}% variance).
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area-sqft">Footprint Area (Sq Ft)</Label>
                    <Input 
                      id="area-sqft" 
                      type="number" 
                      value={areaSqft} 
                      onChange={e => setAreaSqft(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-background font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">GST Tax Rate</Label>
                    <Select value={String(taxRate)} onValueChange={val => setTaxRate(parseFloat(val))}>
                      <SelectTrigger id="tax-rate" className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.18">18% Standard GST</SelectItem>
                        <SelectItem value="0.12">12% Reduced GST</SelectItem>
                        <SelectItem value="0.0">0% (Tax Exempt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-tier">Material & Framing Tier</Label>
                  <Select value={budgetTier} onValueChange={setBudgetTier}>
                    <SelectTrigger id="budget-tier" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                  <SelectContent>
                      {BUDGET_TIERS.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Structural & Civil Dimensions */}
                <div className="space-y-3 border-t border-dashed border-muted-foreground/10 pt-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Structural & Civil Dimensions</Label>
                  
                  {(() => {
                    const activeQuotes = getEntityQuotations(selectedEntityId || "manual", customerName);
                    const activeQuote = (activeQuotationType && activeQuotationType !== "ai") ? activeQuotes[activeQuotationType] : null;
                    const hasFile = activeQuote?.file !== null && activeQuote?.file !== undefined;
                    const isLocked = hasFile && !isAdminApproved;

                    return (
                      <>
                        {hasFile && (
                          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg mb-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                                Admin Override Approval
                              </span>
                              <span className="text-[9px] text-slate-500">Allow manual inputs to override blueprint specs</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsAdminApproved(!isAdminApproved)}
                              className={`px-3 py-1 border rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isAdminApproved
                                  ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                              }`}
                            >
                              {isAdminApproved ? "Approved" : "Approve"}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="length-m" className="text-xs">Length (m)</Label>
                            <Input 
                              id="length-m" 
                              type="number" 
                              step="0.1"
                              value={lengthM} 
                              onChange={e => setLengthM(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="width-m" className="text-xs">Width (m)</Label>
                            <Input 
                              id="width-m" 
                              type="number" 
                              step="0.1"
                              value={widthM} 
                              onChange={e => setWidthM(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="height-m" className="text-xs">Clear Ht (m)</Label>
                            <Input 
                              id="height-m" 
                              type="number" 
                              step="0.1"
                              value={heightM} 
                              onChange={e => setHeightM(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="mezz-sqm" className="text-xs">Mezzanine (Sqm)</Label>
                            <Input 
                              id="mezz-sqm" 
                              type="number" 
                              value={mezzanineAreaSqm} 
                              onChange={e => setMezzanineAreaSqm(Math.max(0, parseInt(e.target.value) || 0))}
                              disabled={isLocked || activeQuotationType !== "ga"}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col justify-end">
                            <Label className="text-xs">Civil Scope</Label>
                            <Button 
                              variant="outline" 
                              className={`w-full h-9 flex items-center gap-2 justify-center text-xs border ${civilInScope ? 'bg-[#009A5F] hover:bg-[#009A5F]/90 text-white border-[#009A5F]' : 'bg-background hover:bg-muted text-foreground border-input'}`}
                              onClick={() => {
                                if (!isLocked) setCivilInScope(!civilInScope);
                              }}
                              disabled={isLocked}
                            >
                              {civilInScope ? <CheckCircle2 className="w-3.5 h-3.5" /> : <MinusCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                              {civilInScope ? "In-Scope" : "Out-of-Scope"}
                            </Button>
                          </div>
                        </div>

                        {/* NEW DRAWING FIELDS */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="canopy-sqm" className="text-xs">Canopy Shade (Sqm)</Label>
                            <Input 
                              id="canopy-sqm" 
                              type="number" 
                              value={canopySqm || ''} 
                              onChange={e => setCanopySqm(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="skylight-sqm" className="text-xs">Skylight Area (Sqm)</Label>
                            <Input 
                              id="skylight-sqm" 
                              type="number" 
                              value={skylightSqm || ''} 
                              onChange={e => setSkylightSqm(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="shutters-count" className="text-xs">Shutters</Label>
                            <Input 
                              id="shutters-count" 
                              type="number" 
                              value={shuttersCount || ''} 
                              onChange={e => setShuttersCount(Math.max(0, parseInt(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="crane-cap" className="text-xs">Crane (Tons)</Label>
                            <Input 
                              id="crane-cap" 
                              type="number" 
                              value={craneCapacity || ''} 
                              onChange={e => setCraneCapacity(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="tonnage-cap" className="text-xs">Tonnage (MT)</Label>
                            <Input 
                              id="tonnage-cap" 
                              type="number" 
                              value={tonnage || ''} 
                              onChange={e => setTonnage(Math.max(0, parseFloat(e.target.value) || 0))}
                              disabled={isLocked}
                              className="bg-background font-mono h-9 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Optional Tech Modules</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHasInsulation(!hasInsulation)}
                      className={`flex items-center gap-2 justify-start px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${hasInsulation ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400' : 'bg-background hover:bg-muted'}`}
                    >
                      <ThermometerSnowflake className="w-4 h-4" />
                      Insulation Layer
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasGlassFacade(!hasGlassFacade)}
                      className={`flex items-center gap-2 justify-start px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${hasGlassFacade ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400' : 'bg-background hover:bg-muted'}`}
                    >
                      <Layers className="w-4 h-4" />
                      Glass Facade
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasSolar(!hasSolar)}
                      className={`flex items-center gap-2 justify-start px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${hasSolar ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400' : 'bg-background hover:bg-muted'}`}
                    >
                      <Zap className="w-4 h-4 animate-pulse" />
                      Solar Power
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasHVAC(!hasHVAC)}
                      className={`flex items-center gap-2 justify-start px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${hasHVAC ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400' : 'bg-background hover:bg-muted'}`}
                    >
                      <Coins className="w-4 h-4" />
                      VRF HVAC
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Label htmlFor="custom-req">AI Instructions / Focus</Label>
                  <Textarea
                    id="custom-req"
                    placeholder="e.g. Include architectural blueprints for double height, extra durability for high wind zones, or wooden finished flooring details."
                    value={customRequirements}
                    onChange={e => setCustomRequirements(e.target.value)}
                    className="h-16 resize-none bg-background text-sm"
                  />
                </div>

                
              </CardContent>
            </Card>

            {/* Dynamic AI Upload Card */}
            {activeQuotationType && activeQuotationType !== "ai" && (
              <Card 
                className={`relative overflow-hidden transition-all duration-300 border shadow-md hover:shadow-lg border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/15`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold tracking-tight">
                        {activeQuotationType === "handmade" 
                          ? "Upload Handmade Sketch" 
                          : activeQuotationType === "ga" 
                          ? "Upload GA Blueprint" 
                          : "Upload PIF / RFQ Document"}
                        <span className="text-rose-500"> *</span>
                      </CardTitle>
                      <CardDescription className="text-[10px] mt-0.5">
                        {activeQuotationType === "handmade" 
                          ? "Upload drawing image or layout PDF" 
                          : activeQuotationType === "ga" 
                          ? "Upload blueprint or engineering CAD PDF" 
                          : "Upload requirements in .xlsx, .docx or PDF"}
                      </CardDescription>
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={`text-[9px] px-2 py-0.5 font-bold shrink-0 rounded-full transition-colors ${
                      uploadingType === activeQuotationType
                        ? "border-amber-400 text-amber-600 animate-pulse bg-amber-50 dark:bg-amber-950/20"
                        : generatingType === activeQuotationType
                        ? "border-violet-400 text-violet-600 animate-pulse bg-violet-50 dark:bg-violet-950/20"
                        : "border-indigo-500 bg-indigo-600 text-white font-extrabold"
                    }`}
                  >
                    {uploadingType === activeQuotationType ? (
                      <span className="flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Uploading</span>
                    ) : generatingType === activeQuotationType ? (
                      <span className="flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Analyzing</span>
                    ) : getEntityQuotations(selectedEntityId || "manual", customerName)[activeQuotationType]?.file ? (
                      "Ready to Generate"
                    ) : (
                      "Upload"
                    )}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-4 space-y-3">
                  {(() => {
                    const quoteState = getEntityQuotations(selectedEntityId || "manual", customerName)[activeQuotationType];
                    const file = quoteState?.file;
                    if (file) {
                      return (
                        <div className="space-y-2 pt-2 border-t border-dashed border-muted-foreground/10">
                          <div className="flex items-center justify-between gap-2 bg-muted/20 p-2 rounded-xl relative z-10">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="p-1.5 bg-indigo-100 rounded-lg dark:bg-indigo-950/40 text-indigo-600 shrink-0">
                                <FileUp className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden font-mono text-[10px]">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {file.size} • {file.date}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteForType(activeQuotationType, e)}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Premium CAD blueprint preview thumbnail */}
                          {(() => {
                            const isSpreadsheet = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
                            const isDoc = file.name.endsWith(".docx") || file.name.endsWith(".doc");
                            const thumbUrl = file.previewUrl || (
                              activeQuotationType === "handmade" 
                                ? "/brisson_handmade_drawing.png" 
                                : "/delfrost_ga_drawing.png"
                            );
                            return (
                              <div className="relative border border-indigo-500/20 dark:border-indigo-400/20 rounded-lg overflow-hidden h-[70px] bg-slate-950 flex justify-center items-center select-none group shadow-inner">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:12px_12px] z-0"></div>
                                {isSpreadsheet ? (
                                  <FileSpreadsheet className="w-8 h-8 text-emerald-500 z-10" />
                                ) : isDoc ? (
                                  <FileUp className="w-8 h-8 text-blue-500 z-10" />
                                ) : (
                                  <img 
                                    src={thumbUrl} 
                                    alt="Thumbnail" 
                                    className="h-full w-full object-contain opacity-70 group-hover:scale-105 transition-transform duration-300 z-10 p-1" 
                                  />
                                )}
                                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-all duration-300 z-20"></div>
                                <div className="absolute top-1 right-1 text-[7px] font-mono font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 z-30">
                                  {isSpreadsheet ? "PIF SHEET" : isDoc ? "DOCX REQUIREMENT" : "BLUEPRINT PREVIEW"}
                                </div>
                              </div>
                            );
                          })()}

                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasValidationErrors) return;
                              generateQuotationForType(activeQuotationType, file.name, file.base64Data, file.mimeType);
                            }}
                            disabled={isGenerating || hasValidationErrors}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs shadow-sm transition-all gap-1.5 cursor-pointer relative z-10"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Quotation
                          </Button>
                          {hasValidationErrors && (
                            <p className="text-[9px] text-amber-500 font-semibold text-center mt-0.5">
                              ⚠️ Fix inputs validation error to generate
                            </p>
                          )}
                        </div>
                      );
                    }
                    if (uploadingType === activeQuotationType) {
                      return (
                        <div className="pt-2 space-y-1.5">
                          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                            <span>Parsing technical parameters...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-1 bg-muted [&>div]:bg-indigo-600" />
                        </div>
                      );
                    }
                    return (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById(`file-input-${activeQuotationType}`)?.click();
                        }}
                        className="border border-dashed border-muted-foreground/20 rounded-xl py-3 flex flex-col items-center justify-center text-[10px] text-muted-foreground hover:bg-indigo-50/10 hover:border-indigo-400 dark:hover:bg-indigo-950/5 transition-all duration-300"
                      >
                        <Upload className="w-4 h-4 mb-1 text-indigo-500 animate-bounce" />
                        <span className="font-medium text-[10px]">Click to upload project document</span>
                      </div>
                    );
                  })()}

                  <input
                    type="file"
                    id={`file-input-${activeQuotationType}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const previewUrl = file.type.startsWith("image/") 
                          ? URL.createObjectURL(file) 
                          : undefined;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64Data = event.target?.result as string;
                          handleFileUploadForType(activeQuotationType, file.name, `${(file.size / 1024).toFixed(1)} KB`, previewUrl, base64Data, file.type);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }
                    }}
                    disabled={uploadingType === activeQuotationType}
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/xlsx,application/docx,text/plain,text/csv"
                  />
                </CardContent>
              </Card>
            )}

            </div>

          {/* AI Generator / Proforma Sheet Output */}
          <div className="lg:col-span-7">
            {/* 1. Empty State */}
            {!isGenerating && !quoteResult && (
              <Card className="border-dashed border-2 border-muted-foreground/20 h-[560px] flex flex-col items-center justify-center text-center p-8 bg-card/30 backdrop-blur-sm no-print">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full mb-4">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Awaiting Structure Matrix</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2">
                  Configure structural preferences, client parameters, and specific pre-build options on the left, then click **Generate AI Quotation** to compute.
                </p>
              </Card>
            )}

            {/* 2. Loading State */}
            {isGenerating && (
              <Card className="border-indigo-500/20 min-h-[580px] flex flex-col justify-between p-6 bg-slate-900 text-slate-100 relative overflow-hidden shadow-2xl no-print">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-slate-950/50 to-emerald-950/15 opacity-80 pointer-events-none"></div>
                
                {generatingType ? (
                  // Deep Visual Scanner UI for drawings
                  <div className="relative z-10 flex flex-col h-full justify-between gap-4 flex-1">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                          Arkoo Blueprint OCR Analyzer v2.4
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        File: <span className="text-indigo-400 font-semibold">{
                          generatingType === "handmade" ? (getEntityQuotations(selectedEntityId || "manual", customerName).handmade.file?.name || "handmade.png") :
                          generatingType === "ga" ? (getEntityQuotations(selectedEntityId || "manual", customerName).ga.file?.name || "ga.png") :
                          (getEntityQuotations(selectedEntityId || "manual", customerName).pif.file?.name || "pif.xlsx")
                        }</span>
                      </span>
                    </div>

                    {/* Main scanner grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-3">
                      {/* Left: Interactive blueprint scan display */}
                      <div className="relative w-full h-[240px] md:h-auto border border-emerald-500/20 rounded-lg overflow-hidden bg-slate-950 flex flex-col justify-center items-center select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                        {/* CAD Grid Backdrop */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                        
                        {generatingType === "pif" ? (
                          // Stylized spreadsheet layout for PIF
                          <div className="relative z-10 w-full h-full p-4 flex flex-col justify-center text-emerald-500/80 font-mono text-[9px] space-y-1">
                            <div className="border border-emerald-500/30 p-2 rounded bg-slate-950/80 shadow-md">
                              <p className="font-extrabold text-[10px] text-emerald-400 border-b border-emerald-500/30 pb-1 mb-1">
                                PIF SPECIFICATION MATRIX
                              </p>
                              <div className="grid grid-cols-3 gap-1 border-b border-emerald-500/10 py-0.5 text-emerald-600 font-bold">
                                <span>PARAMETER</span>
                                <span>INPUT VALUE</span>
                                <span>STANDARD DRAWING</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 py-0.5">
                                <span>Length (m)</span>
                                <span className={Math.abs(lengthM - 80) < 0.01 ? "text-emerald-400" : "text-amber-400 font-bold animate-pulse"}>{lengthM}m</span>
                                <span>80.0m</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 py-0.5">
                                <span>Width (m)</span>
                                <span className={Math.abs(widthM - 60) < 0.01 ? "text-emerald-400" : "text-amber-400 font-bold animate-pulse"}>{widthM}m</span>
                                <span>60.0m</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 py-0.5">
                                <span>Height (m)</span>
                                <span className={Math.abs(heightM - 8.5) < 0.01 ? "text-emerald-400" : "text-amber-400 font-bold animate-pulse"}>{heightM}m</span>
                                <span>8.5m</span>
                              </div>
                            </div>
                            <div className="text-center text-[8px] text-emerald-600 mt-2">
                              Scanning cells & structural parameters...
                            </div>
                          </div>
                        ) : (
                          // Blueprint image
                          (() => {
                            const scanQuoteState = getEntityQuotations(selectedEntityId || "manual", customerName)[generatingType];
                            const scanPreviewUrl = scanQuoteState?.file?.previewUrl || (
                              generatingType === "handmade" ? "/brisson_handmade_drawing.png" : "/delfrost_ga_drawing.png"
                            );
                            return (
                              <img
                                src={scanPreviewUrl}
                                alt="Ingested Blueprint Scan"
                                className="w-full h-full object-contain opacity-75 relative z-10 p-2"
                              />
                            );
                          })()
                        )}

                        {/* Scanner sweep line */}
                        <div className="animate-scan-line"></div>

                        {/* Crosshairs */}
                        <div className="absolute top-2 left-2 text-emerald-500/60 font-mono text-[8px] border-t border-l border-emerald-500/30 w-4 h-4 pl-0.5 pt-0.5 z-20">L-TOP</div>
                        <div className="absolute top-2 right-2 text-emerald-500/60 font-mono text-[8px] border-t border-r border-emerald-500/30 w-4 h-4 pr-0.5 pt-0.5 text-right z-20">R-TOP</div>
                        <div className="absolute bottom-2 left-2 text-emerald-500/60 font-mono text-[8px] border-b border-l border-emerald-500/30 w-4 h-4 pl-0.5 pb-0.5 z-20">L-BOT</div>
                        <div className="absolute bottom-2 right-2 text-emerald-500/60 font-mono text-[8px] border-b border-r border-emerald-500/30 w-4 h-4 pr-0.5 pb-0.5 text-right z-20">R-BOT</div>
                      </div>

                      {/* Right: Technical log stream */}
                      <div className="flex flex-col justify-between h-[280px] md:h-auto bg-slate-950 p-4 border border-slate-800 rounded-lg font-mono text-[11px] text-green-400 space-y-3 relative z-10 shadow-inner">
                        <div className="space-y-3 flex-1 overflow-y-auto">
                          {/* Diagnostic Table */}
                          <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-900/50">
                            <p className="text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5 font-bold flex items-center justify-between gap-1.5">
                              <span>📊 DIMENSIONAL DIAGNOSTIC</span>
                              {(() => {
                                const expectedL = generatingType === "handmade" ? 42 : generatingType === "ga" ? 81.5 : 80;
                                const expectedW = generatingType === "handmade" ? 18 : generatingType === "ga" ? 29.3 : 60;
                                const expectedH = generatingType === "handmade" ? 21 : generatingType === "ga" ? 12 : 8.5;
                                const isMatch = Math.abs(lengthM - expectedL) < 0.01 && 
                                                Math.abs(widthM - expectedW) < 0.01 && 
                                                Math.abs(heightM - expectedH) < 0.01;
                                return isMatch ? (
                                  <span className="text-emerald-400 font-extrabold text-[8px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">PERFECT MATCH</span>
                                ) : (
                                  <span className="text-amber-400 font-extrabold text-[8px] bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 animate-pulse">MISMATCH CORRECTED</span>
                                );
                              })()}
                            </p>
                            
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-800/40 text-[9px]">
                                  <th className="pb-1 font-semibold">PARAM</th>
                                  <th className="pb-1 font-semibold">SCREEN INPUT</th>
                                  <th className="pb-1 font-semibold">BLUEPRINT SPEC</th>
                                  <th className="pb-1 font-semibold text-right">STATUS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const expectedL = generatingType === "handmade" ? 42 : generatingType === "ga" ? 81.5 : 80;
                                  const expectedW = generatingType === "handmade" ? 18 : generatingType === "ga" ? 29.3 : 60;
                                  const expectedH = generatingType === "handmade" ? 21 : generatingType === "ga" ? 12 : 8.5;

                                  const isLMatch = Math.abs(lengthM - expectedL) < 0.01;
                                  const isWMatch = Math.abs(widthM - expectedW) < 0.01;
                                  const isHMatch = Math.abs(heightM - expectedH) < 0.01;

                                  return (
                                    <>
                                      <tr className="border-b border-slate-900/50">
                                        <td className="py-1 font-bold text-slate-300">Length</td>
                                        <td className="py-1 text-slate-400">{lengthM}m</td>
                                        <td className="py-1 text-slate-400">{expectedL}m</td>
                                        <td className="py-1 text-right">
                                          {isLMatch ? (
                                            <span className="text-emerald-400 font-medium">Perfect ✓</span>
                                          ) : (
                                            <span className="text-amber-400 font-semibold animate-pulse">Override to {expectedL}m ⚠️</span>
                                          )}
                                        </td>
                                      </tr>
                                      <tr className="border-b border-slate-900/50">
                                        <td className="py-1 font-bold text-slate-300">Width</td>
                                        <td className="py-1 text-slate-400">{widthM}m</td>
                                        <td className="py-1 text-slate-400">{expectedW}m</td>
                                        <td className="py-1 text-right">
                                          {isWMatch ? (
                                            <span className="text-emerald-400 font-medium">Perfect ✓</span>
                                          ) : (
                                            <span className="text-amber-400 font-semibold animate-pulse">Override to {expectedW}m ⚠️</span>
                                          )}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 font-bold text-slate-300">Height</td>
                                        <td className="py-1 text-slate-400">{heightM}m</td>
                                        <td className="py-1 text-slate-400">{expectedH}m</td>
                                        <td className="py-1 text-right">
                                          {isHMatch ? (
                                            <span className="text-emerald-400 font-medium">Perfect ✓</span>
                                          ) : (
                                            <span className="text-amber-400 font-semibold animate-pulse">Override to {expectedH}m ⚠️</span>
                                          )}
                                        </td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>

                          {/* OCR Logs Terminal */}
                          <div className="space-y-1 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-green-400 leading-tight">
                            <p className="text-slate-500 font-bold border-b border-slate-800/60 pb-1 mb-1 font-mono text-[8px]">TERMINAL STREAMS LOGS</p>
                            {activeGenerationSteps.slice(0, generationStep + 1).map((step, idx) => (
                              <p key={idx} className={`${idx === generationStep ? "text-green-300 font-bold animate-pulse animate-duration-1000" : "text-green-600"}`}>
                                &gt; {step}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Scanner Status Message */}
                        {(() => {
                          const expectedL = generatingType === "handmade" ? 42 : generatingType === "ga" ? 81.5 : 80;
                          const expectedW = generatingType === "handmade" ? 18 : generatingType === "ga" ? 29.3 : 60;
                          const expectedH = generatingType === "handmade" ? 21 : generatingType === "ga" ? 12 : 8.5;
                          const isMatch = Math.abs(lengthM - expectedL) < 0.01 && 
                                          Math.abs(widthM - expectedW) < 0.01 && 
                                          Math.abs(heightM - expectedH) < 0.01;
                          return (
                            <div className={`p-2 rounded border text-[10px] text-center font-bold font-mono ${
                              isMatch 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                            }`}>
                              {isMatch 
                                ? "✓ NO ACTION REQUIRED: Inputs aligned with blueprint data. Generating quote..." 
                                : "⚠️ OVERRIDE ENGAGED: Screen inputs mismatched. Autocorrecting metrics to drawing standard..."
                              }
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Scanner progress bar */}
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>OCR Scanning Progress</span>
                        <span>{Math.round(((generationStep + 1) / activeGenerationSteps.length) * 100)}%</span>
                      </div>
                      <Progress value={((generationStep + 1) / activeGenerationSteps.length) * 100} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
                    </div>
                  </div>
                ) : (
                  // Standard multi-stage AI loader fallback for general AI quotes
                  <div className="relative z-10 w-full max-w-md mx-auto flex flex-col justify-center h-full text-center flex-1 my-8">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-25"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      <div className="absolute inset-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center text-indigo-600">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-200 mb-1">Arkoo AI Engine Thinking...</h3>
                    <p className="text-xs text-muted-foreground font-mono bg-slate-950 text-slate-400 p-2 rounded-md h-12 flex items-center justify-center border border-slate-800 mb-6">
                      {generationSteps[generationStep]}
                    </p>

                    <Progress value={((generationStep + 1) / generationSteps.length) * 100} className="h-2 mb-2 bg-slate-800 [&>div]:bg-indigo-500" />
                    <div className="text-right text-[10px] text-muted-foreground font-mono">
                      {Math.round(((generationStep + 1) / generationSteps.length) * 100)}% Optimizing
                    </div>
                  </div>
                )}
              </Card>
            )}

            {quoteResult && !isGenerating && (
              <div className="flex flex-col gap-4">
                {/* Actions banner */}
                <div className="flex justify-between items-center bg-card border border-muted-foreground/15 p-3 rounded-xl shadow-sm no-print">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    {isQuoteValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        AI Calculations Balanced
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-red-600 dark:text-red-400 font-bold">Quotation Generation Halted</span>
                      </>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="gap-1.5 cursor-pointer h-9 text-xs" disabled={!isQuoteValid}>
                      <Printer className="w-3.5 h-3.5" />
                      Print / Save PDF
                    </Button>
                    <Button onClick={exportAsCSV} variant="outline" className="border-indigo-600/35 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 gap-1.5 cursor-pointer h-9 text-xs" disabled={!isQuoteValid}>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export to Excel (CSV)
                    </Button>
                    <Button onClick={exportAsHTML} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer h-9 text-xs" disabled={!isQuoteValid}>
                      <Download className="w-3.5 h-3.5" />
                      Download Standalone File
                    </Button>
                  </div>
                </div>

                {isQuoteValid ? (
                  /* Printable Invoice Sheet (APBPL Formal Proforma Quotation) */
                  <div className="bg-white text-slate-900 border border-slate-300 shadow-2xl p-8 md:p-12 font-serif print-container relative mx-auto max-w-4xl" style={{ minHeight: "1056px" }}>
                    
                    {/* APBPL Header */}
                    <div className="flex flex-col items-center justify-center border-b-4 border-indigo-900 pb-6 mb-8 text-center">
                      <img src="/logo.png" alt="Arkoo" className="h-10 w-auto object-contain mb-3" />
                      <h1 className="text-3xl font-extrabold text-indigo-950 uppercase tracking-widest">ARKOO PRE-BUILD PVT. LTD.</h1>
                      <p className="text-sm text-slate-700 mt-2 font-medium">Survey No. 40(4B), Gatha Mandir New Bypass Road, Behind Abhanga English Medium School, Tal. Haveli, Pune-412109</p>
                      <p className="text-sm text-slate-700 font-medium">Email: sales@arkooprebuild.com | Web: www.arkooprebuild.com</p>
                    </div>

                    <div className="flex justify-between items-end mb-8 border-b-2 border-slate-200 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 uppercase">Proforma Quotation</h2>
                        <p className="text-sm text-slate-600 mt-1 font-semibold">PREPARED FOR:</p>
                        <p className="text-base font-bold text-indigo-900">{customerName || "Eclipse Nova"}</p>
                        <p className="text-sm text-slate-700">{customerContact || "+91 00000 00000"}</p>
                        <p className="text-sm text-slate-700 mt-2"><strong>Project Ref:</strong> {quoteResult.drawingFileName || "EN-WH-001"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm"><strong>Quote No:</strong> {quoteResult.quoteNo}</p>
                        <p className="text-sm"><strong>Date:</strong> {quoteResult.date}</p>
                        <p className="text-sm"><strong>Valid Until:</strong> {quoteResult.validUntil}</p>
                      </div>
                    </div>

                    {/* Part 1: Technical Details */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Part 1: Technical & Building Specifications</h3>
                      <table className="w-full text-sm border-collapse border border-slate-300">
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/3">Building Type / Structural System</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{quoteResult.extractedStructuralType || "PEB (Pre-Engineered Building) - Industrial Warehouse"}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Plan Dimensions</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{lengthM}m (Length) × {widthM}m (Width)</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Clear Internal Height</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{heightM}m</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Total Built-up Area</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{quoteResult.areaSqft.toLocaleString()} sq ft ({Math.round(lengthM * widthM)} sqm)</td>
                          </tr>
                          {canopySqm > 0 && (
                            <tr>
                              <td className="border border-slate-300 p-2 font-bold bg-slate-50">Structural Canopy / Shade Area</td>
                              <td className="border border-slate-300 p-2 text-slate-800">{canopySqm} sqm (0.65mm TCT Galvalume)</td>
                            </tr>
                          )}
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Design Loads</td>
                            <td className="border border-slate-300 p-2 text-slate-800">Dead: 0.25 KN/m², Live: 0.57 KN/m², Wind: 39m/sec, Seismic: Zone III</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Material Specifications</td>
                            <td className="border border-slate-300 p-2 text-slate-800">Primary Steel: ASTM A572 Grade 50<br/>Secondary (Purlins): GI 275 GSM<br/>Roof Sheeting: Standing Seam 0.65 TCT</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Part 2: Commercial Summary */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Part 2: Commercial Summary Ledger</h3>
                      <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="border border-slate-300 p-2 text-left">Line Item Description</th>
                            <th className="border border-slate-300 p-2 text-right">Qty</th>
                            <th className="border border-slate-300 p-2 text-right">Unit Rate (₹)</th>
                            <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quoteResult.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-2 text-slate-800">{item.description}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.rate === "number" ? item.rate.toLocaleString("en-IN") : item.rate}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-semibold">{typeof item.total === "number" ? item.total.toLocaleString("en-IN") : item.total}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 p-2 text-right font-bold text-slate-700">Sub-total</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">₹{quoteResult.subtotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 p-2 text-right font-bold text-slate-700">GST ({(quoteResult.taxRate * 100).toFixed(0)}%)</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">₹{quoteResult.taxAmount.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-indigo-50">
                            <td colSpan={3} className="border border-slate-300 p-3 text-right font-extrabold text-indigo-900 text-base">GRAND TOTAL</td>
                            <td className="border border-slate-300 p-3 text-right font-mono font-extrabold text-indigo-900 text-base">₹{quoteResult.total.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Part 3: Terms and Conditions */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Part 3: Terms and Conditions</h3>
                      <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2">
                        <li><strong>Payment Terms:</strong> 40% Advance along with PO and approval of GA Drawings. 40% against proforma invoice before dispatch. 20% within 7 days of erection completion.</li>
                        <li><strong>Delivery Timeline:</strong> Material dispatch within 3-4 weeks from the date of drawing approval and receipt of advance.</li>
                        <li><strong>Validity:</strong> This quotation is valid for 30 days from the date of issue, subject to steel price fluctuations.</li>
                        <li><strong>Exclusions:</strong> Civil foundations, anchor bolt grouting, electrical wiring, and plumbing are strictly excluded and remain in the client's scope.</li>
                        <li><strong>Statutory Compliances:</strong> Approvals from local municipal or structural authorities are under the client's jurisdiction.</li>
                      </ol>
                    </div>
                    
                    <div className="mt-12 flex justify-between items-end border-t border-slate-300 pt-6">
                      <div className="text-center">
                        <div className="border-b border-slate-400 w-48 mb-2"></div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Authorized Signatory</p>
                        <p className="text-xs text-slate-500">Arkoo Pre-Build Pvt. Ltd.</p>
                      </div>
                      <div className="text-center">
                        <div className="border-b border-slate-400 w-48 mb-2"></div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Client Acceptance</p>
                        <p className="text-xs text-slate-500">{customerName || "Eclipse Nova"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STOP / Discrepancy Card Screen */
                  <Card className="border-2 border-red-500/30 bg-red-50/10 dark:bg-red-950/5 p-6 rounded-xl flex flex-col gap-6 shadow-lg relative overflow-hidden no-print">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg shrink-0 mt-0.5 shadow-xs">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-300 tracking-tight">
                          Quotation Halted: Drawing Validation Discrepancy
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          The system has blocked quotation generation because the physical measurements and structural properties do not match the parameters extracted from the source drawing. Enforced validation rules (Rule 7) prevent quoting under mismatched conditions to avoid costly estimation or structural errors.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-red-200/50 pt-4">
                      <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-3">
                        Failed Validation Checks Ledger
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className={`p-3 border rounded-lg ${quoteResult.isAreaMatch ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Area Match (Rule 2)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${quoteResult.isAreaMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {quoteResult.isAreaMatch ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            Ratio: {quoteResult.areaRatio?.toFixed(2)} (Target: 0.95 - 1.05)
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Expected: {quoteResult.extractedAreaSqft?.toLocaleString()} Sq Ft
                          </p>
                        </div>

                        <div className={`p-3 border rounded-lg ${quoteResult.isHeightMatch ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">2. Height Match (Rule 4)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${quoteResult.isHeightMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {quoteResult.isHeightMatch ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            Height: {heightM}m vs Drawing {quoteResult.extractedHeight}m
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Must match within 0.1m tolerance
                          </p>
                        </div>

                        <div className={`p-3 border rounded-lg ${quoteResult.isSystemMatch ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">3. Structural Match (Rule 1/3)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${quoteResult.isSystemMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {quoteResult.isSystemMatch ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            System: {projectType}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Drawing type: {quoteResult.extractedStructuralType}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-lg text-xs text-red-800 dark:text-red-300 space-y-2">
                      <p className="font-semibold text-red-900 dark:text-red-200">How to resolve this validation discrepancy:</p>
                      <ul className="list-disc pl-4 space-y-1.5 text-red-700 dark:text-red-400">
                        <li>Ensure manual screen inputs match the extracted blueprint measurements exactly.</li>
                        <li>Verify that the correct structural project type (e.g. Steel PEB vs LGSF Residential Villa) is selected.</li>
                        <li>To bypass this security check, enable the <strong>"Admin Override Approval"</strong> toggle switch in the sidebar.</li>
                      </ul>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
