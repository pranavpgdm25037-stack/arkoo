import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListLandingLeads } from "@/hooks/use-leads";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  FileSpreadsheet, 
  Search, 
  FileDown, 
  Eye, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  HardHat, 
  Flame, 
  Thermometer, 
  Snowflake, 
  Users, 
  Info,
  Clock
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

function getLabelColor(label: string) {
  const l = String(label).toUpperCase();
  switch (l) {
    case "HOT":
      return "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
    case "WARM":
      return "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.15)]";
    case "COLD":
      return "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getRawFieldValue(lead: any, fieldName: string): string {
  if (!lead || !lead.rawData) return "N/A";
  let data = lead.rawData;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return "N/A";
    }
  }
  return data[fieldName] || "N/A";
}

function formatBudget(value: any) {
  if (!value) return "N/A";
  const num = parseInt(value, 10);
  if (isNaN(num) || num === 0) return value;
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakhs`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function LandingLeads() {
  const { data: leadsData, isLoading } = useListLandingLeads({ refetchInterval: 5000 });
  const leads = leadsData as any[] | undefined;
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const filteredLeads = leads?.filter((l: any) => 
    (l.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.phone || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.location || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.project_type || "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalCount = leads?.length || 0;
  const hotCount = leads?.filter((l: any) => String(l.ai_label).toUpperCase() === "HOT").length || 0;
  const warmCount = leads?.filter((l: any) => String(l.ai_label).toUpperCase() === "WARM").length || 0;
  
  const totalArea = leads?.reduce((acc: number, l: any) => acc + (parseInt(l.area_sqft) || 0), 0) || 0;
  const avgArea = totalCount > 0 ? Math.round(totalArea / totalCount) : 0;

  const handleExport = () => {
    const link = document.createElement("a");
    link.href = "/api/leads/landing/export";
    link.setAttribute("download", `landing_page_submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header Banner */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-8 h-8 text-blue-100" />
              Landing Page Submissions
            </h1>
            <p className="text-blue-100 mt-1">Real-time user inquiries and specifications synced from the landing page form.</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-muted-foreground/10 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Submissions</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">{isLoading ? <Skeleton className="h-8 w-12" /> : totalCount}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hot Qualifications</p>
                <h3 className="text-3xl font-bold mt-2 text-rose-600">{isLoading ? <Skeleton className="h-8 w-12" /> : hotCount}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                <Flame className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warm / In-Progress</p>
                <h3 className="text-3xl font-bold mt-2 text-orange-600">{isLoading ? <Skeleton className="h-8 w-12" /> : warmCount}</h3>
              </div>
              <div className="p-3 bg-orange-500/10 text-orange-600 rounded-2xl">
                <Thermometer className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Project Area</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">{isLoading ? <Skeleton className="h-8 w-24" /> : `${avgArea.toLocaleString()} Sq. Ft.`}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                <HardHat className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Toolbar Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/80 backdrop-blur-sm p-3 rounded-xl border border-muted-foreground/15 shadow-sm">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, phone, location..."
              className="pl-10 bg-background/50 border-muted-foreground/20 rounded-lg h-10 w-full focus-visible:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer h-10"
            disabled={!filteredLeads || filteredLeads.length === 0}
          >
            <FileDown className="w-4 h-4" />
            <span>Export to Excel</span>
          </Button>
        </motion.div>

        {/* Leads Table */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-muted-foreground/15 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-semibold text-muted-foreground py-3.5">Name</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5">Contact</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5">Specifications</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5">AI Qualified</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-right">Submitted</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredLeads?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground h-full space-y-3">
                            <div className="p-4 rounded-full bg-muted/40 border border-dashed border-muted-foreground/25">
                              <FileSpreadsheet className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-lg font-medium">No submissions found</p>
                            <p className="text-sm text-muted-foreground">Submit enquiries on the landing page to populate this list.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads?.map((lead: any) => (
                        <motion.tr 
                          key={lead.id} 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="group hover:bg-muted/20 transition-colors border-b cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <TableCell className="font-semibold text-foreground py-4">
                            {lead.name}
                            <div className="block sm:hidden text-xs text-muted-foreground font-normal mt-0.5">{lead.phone}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col text-sm">
                              <span className="text-foreground/90 font-medium">{lead.email || "N/A"}</span>
                              <span className="text-xs text-muted-foreground font-mono">{lead.phone || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col text-sm gap-0.5">
                              <span className="font-semibold text-foreground/80">{lead.project_type || "N/A"}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                {lead.location || "N/A"}
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {lead.area_sqft ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                    {lead.area_sqft.toLocaleString()} Sq. Ft.
                                  </span>
                                ) : null}
                                {lead.budget && lead.budget !== "0" ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                    {formatBudget(lead.budget)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col items-start gap-1">
                              <Badge className={`font-semibold border text-xs ${getLabelColor(lead.ai_label)}`}>
                                {lead.ai_label || "PENDING"}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground mt-1.5 space-y-1 font-normal leading-tight">
                                <div><span className="text-muted-foreground/80 font-medium">Land:</span> <span className="font-semibold text-foreground/85">{getRawFieldValue(lead, "landownership")}</span></div>
                                <div><span className="text-muted-foreground/80 font-medium">Approvals:</span> <span className="font-semibold text-foreground/85">{getRawFieldValue(lead, "govapprovals")}</span></div>
                                <div><span className="text-muted-foreground/80 font-medium">Architect:</span> <span className="font-semibold text-foreground/85">{getRawFieldValue(lead, "hiredarchitect")}</span></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs text-right py-4">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : "N/A"}
                          </TableCell>
                          <TableCell className="text-center py-4" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelectedLead(lead)} 
                              className="text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Slide-out details drawer */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-[550px] overflow-y-auto bg-card border-l">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2.5 text-foreground border-b pb-4">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              Submission Details
            </SheetTitle>
          </SheetHeader>
          
          {selectedLead && (
            <div className="space-y-6 text-foreground">
              {/* Contact Card */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 border-b border-muted-foreground/10 pb-2">
                  <Users className="w-4.5 h-4.5" /> Client Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-semibold text-sm mt-0.5">{selectedLead.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submission Date</p>
                    <p className="font-medium text-sm mt-0.5">
                      {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="font-semibold text-sm mt-0.5 break-all">{selectedLead.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-semibold text-sm mt-0.5 font-mono">{selectedLead.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Specifications Card */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 border-b border-muted-foreground/10 pb-2">
                  <HardHat className="w-4.5 h-4.5" /> Project Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground">Project Type</p>
                    <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 mt-1">{selectedLead.project_type || "N/A"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Location</p>
                    <p className="font-semibold text-sm mt-0.5">{selectedLead.location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5"/> Project Area</p>
                    <p className="font-semibold text-sm mt-0.5">
                      {selectedLead.area_sqft ? `${selectedLead.area_sqft.toLocaleString()} Sq. Ft.` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5"/> Estimated Budget</p>
                    <p className="font-semibold text-sm mt-0.5 text-emerald-600">
                      {formatBudget(selectedLead.budget)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Completion Timeline</p>
                    <p className="font-semibold text-sm mt-0.5">{selectedLead.timeline || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Additional Specifications */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 border-b border-muted-foreground/10 pb-2">
                  <Info className="w-4.5 h-4.5" /> Additional Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground">Land Ownership Status</p>
                    <p className="font-semibold text-sm mt-0.5">{getRawFieldValue(selectedLead, "landownership")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Government Approvals</p>
                    <p className="font-semibold text-sm mt-0.5">{getRawFieldValue(selectedLead, "govapprovals")}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Hired Architect</p>
                    <p className="font-semibold text-sm mt-0.5">{getRawFieldValue(selectedLead, "hiredarchitect")}</p>
                  </div>
                </div>
              </div>

              {/* AI Lead Assessment */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 border-b border-muted-foreground/10 pb-2">
                  <Info className="w-4.5 h-4.5" /> AI Lead Assessment
                </h3>
                <div className="bg-muted/20 p-4 rounded-xl grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">AI Qualification</p>
                    <div className="mt-1">
                      <Badge className={`font-semibold border text-xs ${getLabelColor(selectedLead.ai_label)}`}>
                        {selectedLead.ai_label || "PENDING"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ingestion Sync Status</p>
                    <div className="mt-1">
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-200">{selectedLead.status || "Form Pending"}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements & Comments */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 border-b border-muted-foreground/10 pb-2">
                  <Calendar className="w-4.5 h-4.5" /> Client Comments
                </h3>
                <div className="bg-muted/25 p-4 rounded-xl">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/80">
                    {selectedLead.comments || "No comments or additional requirements provided."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
