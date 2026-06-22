import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListLeads, useGetLeadsStats } from "@/hooks/use-leads";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { Search, Flame, Thermometer, Snowflake, TrendingUp, Users, Zap, PlusCircle, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";

function getLabelColor(label: string) {
  switch (label) {
    case "HOT": 
    case "Hot": 
      return "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
    case "WARM":
    case "Warm": 
      return "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
    case "COLD":
    case "Cold": 
      return "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    default: 
      return "bg-slate-100 text-slate-700";
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");

  const { toast } = useToast();

  const queryParams = {
    ...(search ? { search } : {}),
    ...(labelFilter !== "All" ? { label: labelFilter } : {}),
    ...(statusFilter !== "All" ? { status: statusFilter } : {})
  };

  const { data: leadsData, isLoading: isLeadsLoading } = useListLeads(queryParams, { refetchInterval: 2000 });
  const leads = leadsData as any[] | undefined;
  const { data: stats, isLoading: isStatsLoading } = useGetLeadsStats({ refetchInterval: 2000 });

  // Extract unique sources dynamically from leads list
  const uniqueSources = leads
    ? Array.from(new Set(leads.map((l: any) => l.source || "N/A").filter(Boolean)))
    : [];

  // Client-side filtering by Source
  const filteredLeads = leads?.filter((lead: any) => {
    if (sourceFilter === "All") return true;
    return (lead.source || "N/A") === sourceFilter;
  });



  const exportLeadsToCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast({
        title: "⚠️ No Leads to Export",
        description: "The current lead list is empty. Modify filters before exporting.",
        variant: "destructive"
      });
      return;
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[][] = [
      ["ARKOO LEADS REPORT", "", "", "", "", "", ""],
      ["Generated At:", new Date().toLocaleString(), "", "", "", "", ""],
      ["Filter Active - Label:", labelFilter, "Status:", statusFilter, "Source:", sourceFilter, ""],
      ["", "", "", "", "", "", ""],
      ["Lead Name", "Email", "Phone", "AI Score", "AI Label", "Pipeline Status", "Source", "Ingested Date"]
    ];

    filteredLeads.forEach((lead: any) => {
      rows.push([
        lead.name || "N/A",
        lead.email || "N/A",
        lead.phone || "N/A",
        String(lead.ai_score || 0),
        lead.ai_label || "N/A",
        lead.status || "New",
        lead.source || "N/A",
        new Date(lead.created_at).toLocaleDateString()
      ]);
    });

    // Add aggregate footer
    rows.push(["", "", "", "", "", "", "", ""]);
    rows.push([
      "Total Leads Count:",
      `${filteredLeads.length} Leads`,
      "Average AI Score:",
      `${Math.round(filteredLeads.reduce((acc: number, l: any) => acc + (l.ai_score || 0), 0) / filteredLeads.length)}%`,
      "",
      "",
      "",
      ""
    ]);

    const csvContent = rows.map(r => r.map(escapeCSV).join(",")).join("\n");

    const safeDate = new Date().toISOString().slice(0,10).replace(/[^a-zA-Z0-9]/g, "_");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_Leads_Report_${safeDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "📊 Exported Leads to CSV",
      description: `Successfully exported ${filteredLeads.length} leads matching current filters.`,
    });
  };

  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">Lead Command Center</h1>
            <p className="text-blue-100 mt-1">Real-time AI qualification and pipeline management.</p>
          </div>
          <div className="flex gap-2 relative z-10">
            <Button 
              onClick={exportLeadsToCSV} 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-md font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Leads (CSV)
            </Button>

          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all glow-card-blue bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Leads</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.total || 0}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all glow-card-rose bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Hot Leads</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                  <Flame className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats?.hot || 0}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all glow-card-orange bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Warm Leads</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600">
                  <Thermometer className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.warm || 0}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all glow-card-blue bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Cold Leads</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                  <Snowflake className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.cold || 0}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all glow-card-purple bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Avg Score</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {isStatsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{Math.round(stats?.avg_score || 0)}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-sm">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email or phone..."
              className="pl-10 bg-background/50 border-muted-foreground/20 rounded-lg h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto items-center">
            <ToggleGroup type="single" value={labelFilter} onValueChange={(v) => { if(v) setLabelFilter(v); }} size="sm" className="bg-background/50 border border-muted-foreground/20 rounded-lg p-1">
              <ToggleGroupItem value="All" className="rounded-md">All</ToggleGroupItem>
              <ToggleGroupItem value="Hot" className="rounded-md data-[state=on]:text-red-600 data-[state=on]:bg-red-100 dark:data-[state=on]:bg-red-900/30">Hot</ToggleGroupItem>
              <ToggleGroupItem value="Warm" className="rounded-md data-[state=on]:text-orange-600 data-[state=on]:bg-orange-100 dark:data-[state=on]:bg-orange-900/30">Warm</ToggleGroupItem>
              <ToggleGroupItem value="Cold" className="rounded-md data-[state=on]:text-blue-600 data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900/30">Cold</ToggleGroupItem>
            </ToggleGroup>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-background/50 border-muted-foreground/20 rounded-lg h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Form Pending">Form Pending</SelectItem>
                <SelectItem value="Form Filled">Form Filled</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[130px] bg-background/50 border-muted-foreground/20 rounded-lg h-10">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                {uniqueSources.map(src => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Total Summary Row */}
        <motion.div 
          variants={itemVariants} 
          className="bg-indigo-50/10 dark:bg-indigo-950/10 border border-indigo-500/20 rounded-xl p-4 flex flex-wrap gap-x-12 gap-y-4 justify-start items-center font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Count</span>
            <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
              {filteredLeads?.length || 0} Leads
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Score</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">
                {filteredLeads && filteredLeads.length > 0
                  ? Math.round(filteredLeads.reduce((acc: number, l: any) => acc + (l.ai_score || 0), 0) / filteredLeads.length)
                  : 0}%
              </span>
              <Progress 
                value={
                  filteredLeads && filteredLeads.length > 0
                    ? Math.round(filteredLeads.reduce((acc: number, l: any) => acc + (l.ai_score || 0), 0) / filteredLeads.length)
                    : 0
                } 
                className="w-24 h-1.5 bg-indigo-200" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 text-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Labels</span>
            <div className="flex gap-2 font-mono font-bold">
              <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200/20">H:{filteredLeads?.filter((l: any) => l.ai_label?.toUpperCase() === 'HOT').length}</span>
              <span className="text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-200/20">W:{filteredLeads?.filter((l: any) => l.ai_label?.toUpperCase() === 'WARM').length}</span>
              <span className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200/20">C:{filteredLeads?.filter((l: any) => l.ai_label?.toUpperCase() === 'COLD').length}</span>
            </div>
          </div>


        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-muted-foreground/20 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Contact</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">AI Score</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Label</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Source</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {isLeadsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24 mt-1" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24 rounded" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredLeads?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64">
                          <div className="flex flex-col items-center justify-center text-muted-foreground h-full space-y-3">
                            <div className="p-4 rounded-full bg-muted/50">
                              <Search className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">No leads found</p>
                            <p className="text-sm opacity-70">Adjust your filters or wait for new leads to arrive.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredLeads?.map((lead) => (
                          <motion.tr 
                            key={lead.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="group hover:bg-muted/30 transition-colors border-b"
                          >
                            <TableCell className="font-medium">
                              <Link href={`/leads/${lead.id}`} className="text-primary hover:text-blue-600 transition-colors">
                                {lead.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{lead.email}</div>
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">{lead.phone}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium w-6 text-right text-sm">{lead.ai_score}</span>
                                <Progress value={lead.ai_score} className="w-16 h-1.5" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getLabelColor(lead.ai_label)}>
                                {lead.ai_label}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <LeadStatusSelect id={lead.id} initialStatus={lead.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {lead.source || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
