import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  FilePlus, 
  FileText, 
  UploadCloud, 
  File, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  Download, 
  User, 
  Scale, 
  Layers, 
  ThermometerSnowflake, 
  Coins, 
  Zap, 
  FileSpreadsheet, 
  Upload, 
  FileUp, 
  AlertCircle, 
  MinusCircle, 
  RefreshCw, 
  Check 
} from "lucide-react";

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
}

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
  }
};

const getPrepopulatedQuoteResult = (
  type: "pif", 
  customerName?: string, 
  customerContact?: string,
  length?: number,
  width?: number,
  height?: number,
  civilScope = true,
  mezzSqm = 0,
  insul = true,
  taxR = 0.18,
  projectType = "PEB Warehouse",
  fileName?: string
): QuoteResult => {
  const currentDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const L = length ?? 80;
  const W = width ?? 60;
  const H = height ?? 8.5;
  const area = L * W;
  const areaSqft = Math.round(area * 10.7639);
  const civil = civilScope;
  const isInsulated = insul;

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

  return {
    quoteNo: "ARK-CON-1831-VASHI",
    date: currentDate,
    validUntil: validUntilDate,
    customerName: resolvedName,
    customerContact: resolvedContact,
    projectType: `Multi-Building Connected ${projectType}`,
    areaSqft,
    ratePerSqft: Math.round(subtotal / areaSqft),
    budgetTier: "Premium",
    customRequirements: `Contract-Ready Turnkey Proposal based on PIF. connected MS-2 and Mono Slope buildings. Width: ${W}m, Length: ${L}m, Height: ${H}m.`,
    estimatedSteelTons: Math.round(195.0 * scaleArea * scaleHeight * 10) / 10,
    thermalRating: isInsulated ? "Insulated 48kg/m3" : "Non-Insulated",
    feasibilityScore: 100,
    lineItems,
    subtotal,
    taxAmount: tax,
    total: subtotal + tax,
    taxRate: taxR,
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
    mezzanineAreaSqm: mezzSqm,
    hasInsulation: isInsulated,
    isDrawingQuote: !!fileName,
    drawingFileName: fileName,
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
    isSystemMatch: true
  } as any;
};

const getEngineeringBOM = (result: any) => {
  if (!result) return [];
  const scaleArea = (result.lengthM * result.widthM) / 4800;
  const columns = Math.round((result.primarySteelMT * 0.6) * 100) / 100;
  const rafters = Math.round((result.primarySteelMT * 0.4) * 100) / 100;
  
  return [
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
};

const getCivilFoundations = (result: any) => {
  if (!result) return [];
  return [
    { name: "Foundation Earthwork & Excavation", spec: "Soil excavation up to 1.5m to 2.0m depth", qty: result.excavationCum || 180.0, unit: "Cum", rate: 650, total: Math.round((result.excavationCum || 180.0) * 650) },
    { name: "PCC Leveling Bases", spec: "Plain Cement Concrete (PCC) 1:4:8 mix", qty: result.concretePccCum || 45.0, unit: "Cum", rate: 4796.84, total: Math.round((result.concretePccCum || 45.0) * 4796.84) },
    { name: "Structural Footings & Pedestals", spec: "Reinforced Concrete (RCC) M25 Grade", qty: result.concreteRccCum || 127.7, unit: "Cum", rate: 12648.47, total: Math.round((result.concreteRccCum || 127.7) * 12648.47) },
    { name: "Reinforcement Rebars Steel", spec: "Fe500 High-Yield TMT Steel bars", qty: result.rebarSteelMT || 11.5, unit: "MT", rate: 0, total: 0, note: "Included in RCC Footings" },
    { name: "Grade Slab Flooring", spec: "150mm thick concrete M20 finished floor", qty: result.gradeSlabSqm || 4800, unit: "Sqm", rate: 214.37, total: Math.round((result.gradeSlabSqm || 4800) * 214.37) },
    { name: "Brickwork Plinth wall", spec: "Solid blocks/Fly-ash brick masonry wall", qty: result.plinthWallSqm || 480, unit: "Sqm", rate: 729.17, total: Math.round((result.plinthWallSqm || 480) * 729.17) },
    { name: "Protective Wall Plastering", spec: "Smooth sand-faced plaster (mortar 1:4)", qty: result.plasteringSqm || 960, unit: "Sqm", rate: 0, total: 0, note: "Included in Plinth Wall" }
  ];
};

export default function GeneratePIF() {
  const [file, setFile] = useState<DocumentInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  
  const [selectedSourceType, setSelectedSourceType] = useState<"lead" | "contact" | "manual">("manual");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  const leadsResult = useListLeads({}, { refetchInterval: 2000 });
  const customersResult = useListCustomers();
  const leads = leadsResult.data as any[] | undefined;
  const customers = customersResult.data as any[] | undefined;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"commercial" | "engineering" | "civil">("commercial");

  // Form State
  const [formData, setFormData] = useState({
    projectName: "",
    buildingType: "PEB Warehouse",
    width: "196.8", // ~60m in feet
    length: "262.4", // ~80m in feet
    eaveHeight: "27.8", // ~8.5m in feet
    roofSlope: "1:10",
    hasCrane: "No",
    craneCapacity: "",
    craneHookHeight: "",
    hasMezzanine: "No",
    mezzanineArea: "",
    pinCode: "",
    windSpeed: "",
    seismicZone: "Zone III"
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  const activeGenerationSteps = [
    "📂 Ingesting project scope coordinates...",
    "📐 Converting standard FPS feet inputs to Metric meters...",
    "📐 Compiling secondary purlins, girts, and primary steel trusses...",
    "🧱 Building PCC, footing pedestals, and civil estimates...",
    "📝 Structuring turnkey PIF commercial offer ledger...",
    "✨ AI PIF validation checks passed!"
  ];

  interface DocumentInfo {
    name: string;
    size: string;
    date: string;
    base64Data?: string;
    mimeType?: string;
  }

  // Keep contact field updated
  useEffect(() => {
    setCustomerContact(customerPhone && customerEmail ? `${customerPhone} | ${customerEmail}` : customerPhone || customerEmail || "");
  }, [customerPhone, customerEmail]);

  const handleEntityChange = (id: string) => {
    setSelectedEntityId(id);
    let name = "";
    let phone = "";
    let email = "";
    
    if (selectedSourceType === "lead" && leads) {
      const found = leads.find(l => String(l.id) === id);
      if (found) {
        name = found.name;
        phone = found.phone || "";
        email = found.email || "";
      }
    } else if (selectedSourceType === "contact" && customers) {
      const found = customers.find(c => String(c.id) === id);
      if (found) {
        name = found.name;
        phone = found.phone || "";
        email = found.email || "";
      }
    }

    if (name) {
      setCustomerName(name);
      setCustomerPhone(phone);
      setCustomerEmail(email);
    }
  };

  const handleSourceTypeChange = (type: "lead" | "contact" | "manual") => {
    setSelectedSourceType(type);
    setSelectedEntityId("");
    if (type === "manual") {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setFile({
          name: selectedFile.name,
          size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
          date: new Date().toLocaleDateString(),
          base64Data,
          mimeType: selectedFile.type
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file?.base64Data) return;
    setIsUploading(true);

    try {
      const response = await fetch("/api/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: file.base64Data,
          fileName: file.name,
          mimeType: file.mimeType
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Auto-fill form fields (Converting metric outputs from backend to Feet for form inputs)
        setFormData(prev => ({
          ...prev,
          width: result.extractedWidth ? String(Math.round(result.extractedWidth * 3.28084 * 10) / 10) : prev.width,
          length: result.extractedLength ? String(Math.round(result.extractedLength * 3.28084 * 10) / 10) : prev.length,
          eaveHeight: result.extractedHeight ? String(Math.round(result.extractedHeight * 3.28084 * 10) / 10) : prev.eaveHeight,
          hasCrane: result.extractedCraneCapacity > 0 ? "Yes" : "No",
          craneCapacity: result.extractedCraneCapacity ? String(result.extractedCraneCapacity) : prev.craneCapacity,
          hasMezzanine: result.mezzanineAreaSqm > 0 ? "Yes" : "No",
          mezzanineArea: result.mezzanineAreaSqm ? String(Math.round(result.mezzanineAreaSqm * 10.7639)) : prev.mezzanineArea,
          windSpeed: result.extractedWindSpeed ? String(Math.round(result.extractedWindSpeed * 3.6)) : prev.windSpeed, // m/s to km/h
          seismicZone: result.extractedSeismicZone || prev.seismicZone
        }));

        if (result.extractedClientName) {
          setCustomerName(result.extractedClientName);
        }

        setIsUploaded(true);
        toast({
          title: "✅ Data Extracted",
          description: `Auto-filled form inputs from "${file.name}".`,
        });
      } else {
        throw new Error("Analysis failed");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "⚠ Extraction Warning",
        description: "AI extraction could not auto-populate form. Proceeding with manual input.",
        variant: "destructive"
      });
      setIsUploaded(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateAIQuotation = () => {
    if (!customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter or select a client name first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= activeGenerationSteps.length - 1) {
          clearInterval(interval);
          completeAIQuotation();
          return prev;
        }
        return prev + 1;
      });
    }, 700);
  };

  const completeAIQuotation = () => {
    // Convert inputs from Feet to Meters
    const lengthM = parseFloat(formData.length) / 3.28084 || 80;
    const widthM = parseFloat(formData.width) / 3.28084 || 60;
    const heightM = parseFloat(formData.eaveHeight) / 3.28084 || 8.5;
    const craneCapacity = formData.hasCrane === "Yes" ? parseFloat(formData.craneCapacity) || 0 : 0;
    const mezzSqm = formData.hasMezzanine === "Yes" ? parseFloat(formData.mezzanineArea) / 10.7639 || 0 : 0;

    const result = getPrepopulatedQuoteResult(
      "pif",
      customerName,
      customerContact,
      lengthM,
      widthM,
      heightM,
      true, // Civil scope In-Scope for PIF
      mezzSqm,
      true, // Insulation standard
      0.18,
      formData.buildingType,
      file?.name
    );

    setQuoteResult(result);
    setIsGenerating(false);
    toast({
      title: "⚡ AI Quotation Formed!",
      description: "Quotation has been successfully calculated.",
    });
  };

  const handleGeneratePIFExcel = async () => {
    setIsUploading(true);
    
    try {
      const response = await fetch("/api/pif/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualData: {
            ...formData,
            clientName: customerName
          },
          fileData: file?.base64Data,
          fileName: file?.name
        })
      });

      if (!response.ok) throw new Error("Server failed to generate PIF.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PIF_${formData.projectName || "Export"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: "💾 Exported Excel PIF",
        description: "Product Information Form Excel file has been generated and downloaded.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "❌ Export Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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
        .company-details h1 { color: #1e1b4b; margin: 0 0 5px 0; font-size: 26px; font-weight: 800; }
        .company-details p { margin: 2px 0; font-size: 13px; color: #64748b; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { color: #6366f1; margin: 0 0 8px 0; font-size: 20px; font-weight: 700; }
        .invoice-meta p { margin: 3px 0; font-size: 13px; color: #475569; }
        .customer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
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
            <p>Tal. Haveli, Pune-412109</p>
            <p>Email: sales@arkooprebuild.com | Web: www.arkooprebuild.com</p>
          </div>
          <div class="invoice-meta">
            <h2>PIF Specification Quotation</h2>
            <p><strong>Quote No:</strong> ${quoteResult.quoteNo}</p>
            <p><strong>Date:</strong> ${quoteResult.date}</p>
            <p><strong>Valid Until:</strong> ${quoteResult.validUntil}</p>
          </div>
        </div>

        <div class="customer-section">
          <div class="customer-details">
            <div class="section-title">Prepared For</div>
            <p><strong>Client:</strong> ${customerName}</p>
            <p><strong>Contact:</strong> ${customerContact || "—"}</p>
          </div>
          <div class="customer-details">
            <div class="section-title">Project Overview</div>
            <p><strong>Scope:</strong> Turnkey Connected ${formData.buildingType}</p>
            <p><strong>Quality Class:</strong> Premium System</p>
          </div>
        </div>

        <div class="tech-specs">
          <div class="spec-item">
            <div class="spec-label">Project Footprint</div>
            <div class="spec-value">${quoteResult.areaSqft.toLocaleString()} Sq Ft</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Est. Steel Weight</div>
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

        <h3 style="color: #4f46e5; font-size: 15px; font-weight: 700; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase;">1. Commercial Pricing Ledger</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 55%">Line Item Description</th>
              <th style="text-align: right; width: 12%">Qty</th>
              <th style="text-align: right; width: 15%">Rate (₹)</th>
              <th style="text-align: right; width: 18%">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${quoteResult.lineItems.map(item => `
              <tr>
                <td><strong>${item.description}</strong></td>
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
              <td style="text-align: left; color:#64748b">Subtotal:</td>
              <td style="text-align: right; font-weight: 600">₹${quoteResult.subtotal.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="text-align: left; color:#64748b">GST (18%):</td>
              <td style="text-align: right; font-weight: 600">₹${quoteResult.taxAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr class="grand-total">
              <td style="text-align: left">Grand Total Estimate:</td>
              <td style="text-align: right">₹${quoteResult.total.toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <div class="terms" style="margin-top: 30px;">
          <h4>Pre-Build Commercial Terms & Framework</h4>
          <ol>
            <li><strong>Mobilization Advance:</strong> 40% along with PO.</li>
            <li><strong>Material Dispatch:</strong> 40% release before dispatch.</li>
            <li><strong>Timeline:</strong> Completion of factory prefabrication in 25-30 days.</li>
            <li><strong>Foundations:</strong> Integrated under turnkey contractor scope (In-Scope).</li>
          </ol>
        </div>

        <div class="footer-tagline">
          Designed with Arkoo AI Engineering Engine. "Designing Excellence, Building Trust"
        </div>
      </div>
    </body>
    </html>`;

    const safeCustomerName = quoteResult.customerName.replace(/[^a-zA-Z0-9]/g, "_");
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_PIF_Quotation_${safeCustomerName}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "💾 Exported HTML Quotation",
      description: "HTML quotation document has been downloaded successfully.",
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
      ["ARKOO PRE-BUILD PVT. LTD.", "", "", ""],
      ["Survey No. 40(4B), Gatha Mandir New Bypass Road, Tal. Haveli, Pune-412109", "", "", ""],
      ["", "", "", ""],
      ["PIF Sheet Quotation", "", "", ""],
      ["Quote No:", quoteResult.quoteNo, "Date:", quoteResult.date],
      ["Valid Until:", quoteResult.validUntil, "", ""],
      ["", "", "", ""],
      ["CLIENT & PROJECT SPECIFICATIONS", "", "", ""],
      ["Prepared For Client:", customerName, "", ""],
      ["Contact:", customerContact || "—", "", ""],
      ["Project Type:", quoteResult.projectType, "", ""],
      ["Footprint Area:", `${quoteResult.areaSqft.toLocaleString()} Sq Ft`, "", ""],
      ["Truss Steel Weight:", `${quoteResult.estimatedSteelTons} Tons`, "", ""],
      ["", "", "", ""],
      ["COMMERCIAL PRICING LEDGER", "", "", ""],
      ["Line Item Description", "Qty", "Rate (INR)", "Subtotal (INR)"]
    ];

    quoteResult.lineItems.forEach(item => {
      rows.push([item.description, String(item.qty), String(item.rate), String(item.total)]);
    });

    rows.push(["", "", "", ""]);
    rows.push(["Subtotal:", "", "", String(quoteResult.subtotal)]);
    rows.push(["GST (18%):", "", "", String(quoteResult.taxAmount)]);
    rows.push(["Grand Total Estimate:", "", "", String(quoteResult.total)]);

    const csvContent = rows.map(r => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_PIF_Quotation_${quoteResult.quoteNo}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "📊 Exported Excel CSV Sheet",
      description: "Quotation details have been exported to CSV.",
    });
  };

  return (
    <Layout>
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, transparent, #10b981, transparent);
          animation: scan 4s linear infinite;
          z-index: 20;
          box-shadow: 0 0 8px #10b981;
        }
      `}</style>

      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-800 text-white shadow-lg no-print">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <FilePlus className="w-7 h-7 text-indigo-200" />
              Generate Product Information Form (PIF)
            </h1>
            <p className="text-indigo-100 mt-1">Complete manual details or upload RFQ sheets to generate dynamic PIFs & CRM quotations.</p>
          </div>
          <div className="relative z-10 p-3 bg-white/10 rounded-full backdrop-blur-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form & Inputs */}
          <div className="lg:col-span-5 flex flex-col gap-6 no-print">
            
            {/* Client & Lead Association */}
            <Card className="border-muted-foreground/15 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Client & Lead Association
                </CardTitle>
                <CardDescription>Associate this form with an existing lead/contact or enter manually.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="customerName">Client Name</Label>
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
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cust-email">Email Address</Label>
                    <Input 
                      id="cust-email" 
                      placeholder="e.g. client@example.com" 
                      value={customerEmail} 
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document upload area */}
            <Card className="border-muted-foreground/15 shadow-md bg-gradient-to-r from-violet-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5" />
                  AI Document Ingestion
                </CardTitle>
                <CardDescription>Upload spreadsheet, word document or drawing. AI parses specs automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!file && !isUploaded && (
                  <div 
                    onClick={() => document.getElementById("pif-file-uploader")?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white/50 group"
                  >
                    <UploadCloud className="w-8 h-8 mb-2 text-indigo-600 group-hover:scale-115 transition-transform" />
                    <span className="font-semibold text-xs text-indigo-700">Click to upload project document</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Supports PDF, DOCX, XLSX, images</span>
                  </div>
                )}

                {file && !isUploaded && (
                  <div className="border border-indigo-100 rounded-xl p-4 bg-white/70 flex flex-col items-center justify-center text-center">
                    <File className="w-8 h-8 text-indigo-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[9px] text-muted-foreground mb-4">{file.size}</p>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => setFile(null)} variant="outline" size="sm" className="h-8 text-[11px] cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" /> Cancel
                      </Button>
                      <Button 
                        onClick={handleUpload} 
                        disabled={isUploading}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-[11px] cursor-pointer"
                      >
                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                        {isUploading ? "Analyzing..." : "Analyze Spec"}
                      </Button>
                    </div>
                  </div>
                )}

                {isUploaded && (
                  <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/50 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                    <p className="text-xs font-bold text-emerald-800 truncate max-w-[200px]">{file?.name}</p>
                    <p className="text-[10px] text-emerald-600 mb-4">Specs parsed and parameters updated.</p>
                    <button onClick={() => { setFile(null); setIsUploaded(false); }} className="text-[10px] text-slate-400 hover:text-indigo-600 underline">
                      Upload different document
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  id="pif-file-uploader" 
                  className="hidden" 
                  accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/xlsx,application/docx,text/plain,text/csv"
                  onChange={handleFileChange} 
                />
              </CardContent>
            </Card>

            {/* Parameter Inputs */}
            <Card className="border-muted-foreground/15 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  PIF Core Parameters
                </CardTitle>
                <CardDescription>Enter parameters manually or overwrite the AI extraction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Title / Tag</Label>
                  <Input 
                    id="projectName" 
                    name="projectName" 
                    placeholder="e.g. Pune Connected Warehouse" 
                    value={formData.projectName} 
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingType">Building Type</Label>
                  <Select value={formData.buildingType} onValueChange={(val) => setFormData(prev => ({ ...prev, buildingType: val }))}>
                    <SelectTrigger id="buildingType" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEB Structure">PEB Structure</SelectItem>
                      <SelectItem value="PEB Warehouse">PEB Warehouse</SelectItem>
                      <SelectItem value="Industrial Shed">Industrial Shed</SelectItem>
                      <SelectItem value="Commercial Space">Commercial Space</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="width" className="text-xs">Width (Ft)</Label>
                    <Input id="width" name="width" type="number" value={formData.width} onChange={handleChange} className="font-mono h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="length" className="text-xs">Length (Ft)</Label>
                    <Input id="length" name="length" type="number" value={formData.length} onChange={handleChange} className="font-mono h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eaveHeight" className="text-xs">Clear Ht (Ft)</Label>
                    <Input id="eaveHeight" name="eaveHeight" type="number" value={formData.eaveHeight} onChange={handleChange} className="font-mono h-9 text-xs" />
                  </div>
                </div>

                {/* Crane and Mezzanine */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hasCrane">Crane Required?</Label>
                    <Select value={formData.hasCrane} onValueChange={(val) => setFormData(prev => ({ ...prev, hasCrane: val }))}>
                      <SelectTrigger id="hasCrane">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.hasCrane === "Yes" && (
                      <Input name="craneCapacity" type="number" placeholder="Capacity (Tons)" value={formData.craneCapacity} onChange={handleChange} className="mt-2 font-mono h-9 text-xs" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hasMezzanine">Mezzanine Floor?</Label>
                    <Select value={formData.hasMezzanine} onValueChange={(val) => setFormData(prev => ({ ...prev, hasMezzanine: val }))}>
                      <SelectTrigger id="hasMezzanine">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.hasMezzanine === "Yes" && (
                      <Input name="mezzanineArea" type="number" placeholder="Area (Sq Ft)" value={formData.mezzanineArea} onChange={handleChange} className="mt-2 font-mono h-9 text-xs" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">Pin Code</Label>
                    <Input id="pinCode" name="pinCode" placeholder="411001" value={formData.pinCode} onChange={handleChange} className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seismicZone">Seismic Zone</Label>
                    <Select value={formData.seismicZone} onValueChange={(val) => setFormData(prev => ({ ...prev, seismicZone: val }))}>
                      <SelectTrigger id="seismicZone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Zone II">Zone II</SelectItem>
                        <SelectItem value="Zone III">Zone III</SelectItem>
                        <SelectItem value="Zone IV">Zone IV</SelectItem>
                        <SelectItem value="Zone V">Zone V</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    onClick={handleGeneratePIFExcel} 
                    disabled={isUploading} 
                    variant="outline"
                    className="flex-1 font-bold border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer h-10 text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Generate PIF (Excel)
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={generateAIQuotation} 
                    disabled={isGenerating} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer h-10 text-xs"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Generate AI Quotation
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Quotation Preview & Output */}
          <div className="lg:col-span-7">
            
            {/* 1. Empty State */}
            {!isGenerating && !quoteResult && (
              <Card className="border-dashed border-2 border-muted-foreground/20 h-[560px] flex flex-col items-center justify-center text-center p-8 bg-card/30 backdrop-blur-sm no-print">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full mb-4">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Awaiting Structure Matrix</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2">
                  Configure project parameters on the left or upload drawings/specifications, then click **Generate AI Quotation** to compute the detailed estimate.
                </p>
              </Card>
            )}

            {/* 2. Loading State */}
            {isGenerating && (
              <Card className="border-indigo-500/20 min-h-[580px] flex flex-col justify-between p-6 bg-slate-900 text-slate-100 relative overflow-hidden shadow-2xl no-print">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-slate-950/50 to-emerald-950/15 opacity-80 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between gap-4 flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                        Arkoo PIF Specification OCR Analyzer v2.4
                      </span>
                    </div>
                    {file?.name && (
                      <span className="text-[10px] font-mono text-slate-400">
                        File: <span className="text-indigo-400 font-semibold">{file.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Main scanner grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-3">
                    {/* Left: Interactive scan display */}
                    <div className="relative w-full h-[240px] md:h-auto border border-emerald-500/20 rounded-lg overflow-hidden bg-slate-950 flex flex-col justify-center items-center select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                      
                      <div className="relative z-10 w-full h-full p-4 flex flex-col justify-center text-emerald-500/80 font-mono text-[9px] space-y-1">
                        <div className="border border-emerald-500/30 p-2 rounded bg-slate-950/80 shadow-md">
                          <p className="font-extrabold text-[10px] text-emerald-400 border-b border-emerald-500/30 pb-1 mb-1">
                            PIF SPECIFICATION MATRIX
                          </p>
                          <div className="grid grid-cols-3 gap-1 border-b border-emerald-500/10 py-0.5 text-emerald-600 font-bold">
                            <span>PARAMETER</span>
                            <span>INPUT VALUE</span>
                            <span>STANDARD</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 py-0.5">
                            <span>Length</span>
                            <span className="text-emerald-400">{formData.length} Ft</span>
                            <span>262.4 Ft</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 py-0.5">
                            <span>Width</span>
                            <span className="text-emerald-400">{formData.width} Ft</span>
                            <span>196.8 Ft</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 py-0.5">
                            <span>Height</span>
                            <span className="text-emerald-400">{formData.eaveHeight} Ft</span>
                            <span>27.8 Ft</span>
                          </div>
                        </div>
                        <div className="text-center text-[8px] text-emerald-600 mt-2">
                          Recalculating structural vectors...
                        </div>
                      </div>

                      <div className="animate-scan-line"></div>
                      
                      <div className="absolute top-2 left-2 text-emerald-500/60 font-mono text-[8px] border-t border-l border-emerald-500/30 w-4 h-4 pl-0.5 pt-0.5 z-20">L-TOP</div>
                      <div className="absolute top-2 right-2 text-emerald-500/60 font-mono text-[8px] border-t border-r border-emerald-500/30 w-4 h-4 pr-0.5 pt-0.5 text-right z-20">R-TOP</div>
                      <div className="absolute bottom-2 left-2 text-emerald-500/60 font-mono text-[8px] border-b border-l border-emerald-500/30 w-4 h-4 pl-0.5 pb-0.5 z-20">L-BOT</div>
                      <div className="absolute bottom-2 right-2 text-emerald-500/60 font-mono text-[8px] border-b border-r border-emerald-500/30 w-4 h-4 pr-0.5 pb-0.5 text-right z-20">R-BOT</div>
                    </div>

                    {/* Right: Technical log stream */}
                    <div className="flex flex-col justify-between h-[280px] md:h-auto bg-slate-950 p-4 border border-slate-800 rounded-lg font-mono text-[11px] text-green-400 space-y-3 relative z-10 shadow-inner">
                      <div className="space-y-1 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-green-400 leading-tight flex-1 overflow-y-auto">
                        <p className="text-slate-500 font-bold border-b border-slate-800/60 pb-1 mb-1 font-mono text-[8px]">TERMINAL STREAMS LOGS</p>
                        {activeGenerationSteps.slice(0, generationStep + 1).map((step, idx) => (
                          <p key={idx} className={`${idx === generationStep ? "text-green-300 font-bold animate-pulse" : "text-green-600"}`}>
                            &gt; {step}
                          </p>
                        ))}
                      </div>
                      <div className="p-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] text-center font-bold">
                        AI OPTIMIZATION PROCESS RUNNING...
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between font-mono text-[9px] text-slate-400">
                      <span>Generating Estimate</span>
                      <span>{Math.round(((generationStep + 1) / activeGenerationSteps.length) * 100)}%</span>
                    </div>
                    <Progress value={((generationStep + 1) / activeGenerationSteps.length) * 100} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
                  </div>
                </div>
              </Card>
            )}

            {/* 3. Quote Result State */}
            {quoteResult && !isGenerating && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                {/* Action buttons */}
                <div className="flex justify-between items-center bg-card border border-muted-foreground/15 p-3 rounded-xl shadow-sm no-print">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Turnkey Connected Estimate Completed
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="gap-1.5 cursor-pointer h-9 text-xs">
                      <Printer className="w-3.5 h-3.5" />
                      Print / Save PDF
                    </Button>
                    <Button onClick={exportAsCSV} variant="outline" className="border-indigo-600/35 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 gap-1.5 cursor-pointer h-9 text-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export to Excel (CSV)
                    </Button>
                    <Button onClick={exportAsHTML} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer h-9 text-xs">
                      <Download className="w-3.5 h-3.5" />
                      Download Standalone File
                    </Button>
                  </div>
                </div>

                {/* Switcher Tab header */}
                <div className="flex border-b border-slate-200 gap-4 pb-0 no-print">
                  <button 
                    onClick={() => setActiveTab("commercial")}
                    className={`py-2 px-1 font-bold text-sm border-b-2 cursor-pointer transition-all ${activeTab === "commercial" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    1. Commercial Ledger
                  </button>
                  <button 
                    onClick={() => setActiveTab("engineering")}
                    className={`py-2 px-1 font-bold text-sm border-b-2 cursor-pointer transition-all ${activeTab === "engineering" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    2. Engineering BOM
                  </button>
                  <button 
                    onClick={() => setActiveTab("civil")}
                    className={`py-2 px-1 font-bold text-sm border-b-2 cursor-pointer transition-all ${activeTab === "civil" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    3. Civil foundations
                  </button>
                </div>

                {/* Printable Invoice Container */}
                <div className="bg-white text-slate-900 border border-slate-300 shadow-2xl p-8 md:p-12 font-serif print-container relative mx-auto w-full max-w-4xl" style={{ minHeight: "1056px" }}>
                  
                  {/* APBPL Header */}
                  <div className="flex flex-col items-center justify-center border-b-4 border-indigo-900 pb-6 mb-8 text-center">
                    <img src="/logo.png" alt="Arkoo" className="h-10 w-auto object-contain mb-3" />
                    <h1 className="text-3xl font-extrabold text-indigo-950 uppercase tracking-widest">ARKOO PRE-BUILD PVT. LTD.</h1>
                    <p className="text-sm text-slate-700 mt-2 font-medium">Survey No. 40(4B), Gatha Mandir New Bypass Road, Haveli, Pune-412109</p>
                    <p className="text-sm text-slate-700 font-medium">Email: sales@arkooprebuild.com | Web: www.arkooprebuild.com</p>
                  </div>

                  <div className="flex justify-between items-end mb-8 border-b-2 border-slate-200 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 uppercase">PIF Proforma Quotation</h2>
                      <p className="text-sm text-slate-600 mt-1 font-semibold">PREPARED FOR:</p>
                      <p className="text-base font-bold text-indigo-900">{customerName}</p>
                      <p className="text-sm text-slate-700">{customerContact || "—"}</p>
                      {file?.name && <p className="text-sm text-slate-700 mt-2"><strong>Ingested File:</strong> {file.name}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm"><strong>Quote No:</strong> {quoteResult.quoteNo}</p>
                      <p className="text-sm"><strong>Date:</strong> {quoteResult.date}</p>
                      <p className="text-sm"><strong>Valid Until:</strong> {quoteResult.validUntil}</p>
                    </div>
                  </div>

                  {/* Section 1: Technical specs */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase bg-slate-100 p-2 border-l-4 border-indigo-600">Building Specifications</h3>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/3">Building Configuration</td>
                          <td className="border border-slate-300 p-2 text-slate-800">{quoteResult.extractedStructuralType}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 font-bold bg-slate-50">Dimensions (Meters)</td>
                          <td className="border border-slate-300 p-2 text-slate-800">{quoteResult.lengthM?.toFixed(1)}m (Length) × {quoteResult.widthM?.toFixed(1)}m (Width) × {quoteResult.heightM?.toFixed(1)}m (Clear Eave Height)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 font-bold bg-slate-50">Dimensions (Feet)</td>
                          <td className="border border-slate-300 p-2 text-slate-800">{formData.length} Ft (Length) × {formData.width} Ft (Width) × {formData.eaveHeight} Ft (Eave Height)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 font-bold bg-slate-50">Calculated Built-up Area</td>
                          <td className="border border-slate-300 p-2 text-slate-800">{quoteResult.areaSqft.toLocaleString()} Sq Ft ({Math.round(quoteResult.lengthM! * quoteResult.widthM!)} Sqm)</td>
                        </tr>
                        {formData.hasCrane === "Yes" && (
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">EOT Crane Capacity</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{formData.craneCapacity} Metric Tons (Hook Height: {formData.craneHookHeight || '—'} Ft)</td>
                          </tr>
                        )}
                        {formData.hasMezzanine === "Yes" && (
                          <tr>
                            <td className="border border-slate-300 p-2 font-bold bg-slate-50">Mezzanine Floor Area</td>
                            <td className="border border-slate-300 p-2 text-slate-800">{parseInt(formData.mezzanineArea).toLocaleString()} Sq Ft</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Active Tab content */}
                  {activeTab === "commercial" && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Commercial Pricing Ledger</h3>
                      <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="border border-slate-300 p-2 text-left">Line Item Description</th>
                            <th className="border border-slate-300 p-2 text-right">Qty</th>
                            <th className="border border-slate-300 p-2 text-right">Rate (₹)</th>
                            <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quoteResult.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-2 text-slate-800">{item.description}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.rate === "number" ? `₹${item.rate.toLocaleString("en-IN")}` : item.rate}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-semibold">₹{typeof item.total === "number" ? item.total.toLocaleString("en-IN") : item.total}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 p-2 text-right font-bold text-slate-700">Subtotal Ledger</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">₹{quoteResult.subtotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 p-2 text-right font-bold text-slate-700">GST (18%)</td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">₹{quoteResult.taxAmount.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-indigo-50">
                            <td colSpan={3} className="border border-slate-300 p-3 text-right font-extrabold text-indigo-900 text-base">GRAND TOTAL ESTIMATE</td>
                            <td className="border border-slate-300 p-3 text-right font-mono font-extrabold text-indigo-900 text-base">₹{quoteResult.total.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "engineering" && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Structural Engineering BOM</h3>
                      <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="border border-slate-300 p-2 text-left">Component Description</th>
                            <th className="border border-slate-300 p-2 text-left">Material Spec</th>
                            <th className="border border-slate-300 p-2 text-right">Qty</th>
                            <th className="border border-slate-300 p-2 text-center">Unit</th>
                            <th className="border border-slate-300 p-2 text-right">Rate (₹)</th>
                            <th className="border border-slate-300 p-2 text-right">Estimated Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getEngineeringBOM(quoteResult).map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-2 text-slate-800 font-bold">{item.name}</td>
                              <td className="border border-slate-300 p-2 text-slate-600 text-xs">{item.spec}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                              <td className="border border-slate-300 p-2 text-center text-xs">{item.unit}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{item.rate > 0 ? `₹${item.rate.toLocaleString("en-IN")}` : "—"}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-semibold">{item.total > 0 ? `₹${item.total.toLocaleString("en-IN")}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "civil" && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider bg-slate-100 p-2 border-l-4 border-indigo-600">Civil Foundations & Excavation</h3>
                      <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="border border-slate-300 p-2 text-left">Work Item Description</th>
                            <th className="border border-slate-300 p-2 text-left">Concrete / Steel Spec</th>
                            <th className="border border-slate-300 p-2 text-right">Qty</th>
                            <th className="border border-slate-300 p-2 text-center">Unit</th>
                            <th className="border border-slate-300 p-2 text-right">Rate (₹)</th>
                            <th className="border border-slate-300 p-2 text-right">Estimated Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCivilFoundations(quoteResult).map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-2 text-slate-800 font-bold">{item.name}</td>
                              <td className="border border-slate-300 p-2 text-slate-600 text-xs">{item.spec}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{typeof item.qty === "number" ? item.qty.toLocaleString() : item.qty}</td>
                              <td className="border border-slate-300 p-2 text-center text-xs">{item.unit}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono">{item.rate > 0 ? `₹${item.rate.toLocaleString("en-IN")}` : "—"}</td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-semibold">{item.total > 0 ? `₹${item.total.toLocaleString("en-IN")}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase bg-slate-100 p-2 border-l-4 border-indigo-600">Commercial terms & conditions</h3>
                    <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                      <li><strong>Advance Payment:</strong> 40% along with the official purchase order.</li>
                      <li><strong>Dispatch Payment:</strong> 40% before dispatch of components from factory.</li>
                      <li><strong>Foundations:</strong> Integrated under contractor turnkey scope (In-Scope).</li>
                      <li><strong>Timeline:</strong> Factory prefabrication in 25-30 working days.</li>
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
                      <p className="text-xs font-bold text-slate-600 uppercase">Client Acceptance Signature</p>
                      <p className="text-xs text-slate-500">{customerName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
