import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Linkedin, 
  Instagram, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  Briefcase, 
  Users,
  CheckCircle,
  XCircle,
  FileSpreadsheet
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const COLORS = ["#0A66C2", "#E1306C", "#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

export default function Analytics() {
  const [interval, setInterval] = useState("month");
  const [sourceFilter, setSourceFilter] = useState("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. New Campaign Form State
  const [campaignName, setCampaignName] = useState("");
  const [campaignPlatform, setCampaignPlatform] = useState("LinkedIn");
  const [campaignTargetId, setCampaignTargetId] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignSpent, setCampaignSpent] = useState("");

  // 2. Fetch Leads Trend Data
  const { data: trendDataRes, isLoading: isTrendLoading } = useQuery({
    queryKey: ["leads-trend", interval, sourceFilter],
    queryFn: async () => {
      const res = await fetch("/api/analytics/leads-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, source: sourceFilter })
      });
      if (!res.ok) throw new Error("Failed to fetch leads trend");
      return res.json();
    },
    refetchInterval: 5000
  });

  // 3. Fetch Campaigns Data
  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 5000
  });

  // 4. Create Campaign Mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign: any) => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign)
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campaign Created",
        description: "New campaign added successfully!"
      });
      // Clear Form
      setCampaignName("");
      setCampaignTargetId("");
      setCampaignBudget("");
      setCampaignSpent("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create campaign",
        variant: "destructive"
      });
    }
  });

  // 5. Delete Campaign Mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campaign Deleted",
        description: "Campaign was deleted and associated leads unlinked."
      });
    }
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !campaignPlatform) {
      toast({
        title: "Validation Error",
        description: "Please specify Campaign Name and Platform.",
        variant: "destructive"
      });
      return;
    }
    createCampaignMutation.mutate({
      name: campaignName,
      platform: campaignPlatform,
      targetId: campaignTargetId,
      budget: campaignBudget ? parseFloat(campaignBudget) : 0,
      spent: campaignSpent ? parseFloat(campaignSpent) : 0
    });
  };

  const trendData = trendDataRes?.trendData || [];
  const summary = trendDataRes?.summary || { incoming: 0, attended: 0, lost: 0, total: 0, conversionRate: 0 };

  // Calculate platform share dynamically from the campaigns and leads
  const pieData = campaigns 
    ? [
        { name: "LinkedIn Ads", value: campaigns.filter(c => c.platform === "LinkedIn").reduce((acc, c) => acc + (c.leadCount || 0), 0) },
        { name: "Instagram Ads", value: campaigns.filter(c => c.platform === "Instagram").reduce((acc, c) => acc + (c.leadCount || 0), 0) },
        // Fallback for general website leads not linked to specific campaign
        { name: "Other Ingestion", value: Math.max(0, summary.total - campaigns.reduce((acc, c) => acc + (c.leadCount || 0), 0)) }
      ].filter(d => d.value > 0)
    : [];

  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Banner Title */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg border border-indigo-900/50">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-indigo-400" />
              Marketing & Sales Analytics
            </h1>
            <p className="text-indigo-200 mt-1">Monitor leads acquisition trends, platform distribution, and active ad campaign performance.</p>
          </div>
        </motion.div>

        {/* Tabs Container */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-sm font-medium cursor-pointer">Performance Analytics</TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-lg px-4 py-2 text-sm font-medium cursor-pointer">Campaign Manager</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filter Bar */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-card/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Interval:</span>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Source Filter:</span>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Ingestions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Ingestions</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn Leads</SelectItem>
                    <SelectItem value="Instagram">Instagram Leads</SelectItem>
                    <SelectItem value="Landing Page">Landing Page</SelectItem>
                    <SelectItem value="Website">Direct Website</SelectItem>
                    <SelectItem value="Google Forms">Google Forms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Metrics cards row */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Incoming */}
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-all border-emerald-500/10 bg-emerald-500/5 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Sales Leads Incoming</CardTitle>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-full text-emerald-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{summary.incoming}</div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">Status: New & Form Submissions</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 2: Attended */}
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-all border-amber-500/10 bg-amber-500/5 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300">Attended & Contacted</CardTitle>
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-full text-amber-600">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{summary.attended}</div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Status: Contacted & Qualified</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 3: Lost */}
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-all border-rose-500/10 bg-rose-500/5 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-rose-800 dark:text-rose-300">Leads Lost</CardTitle>
                    <div className="p-2 bg-rose-100 dark:bg-rose-950 rounded-full text-rose-600">
                      <XCircle className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{summary.lost}</div>
                    <p className="text-[10px] text-rose-600 dark:text-rose-500 mt-1">Status: Dropped / Rejected</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card 4: Conv Rate */}
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-all border-indigo-500/10 bg-indigo-500/5 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Attention / Ingestion Rate</CardTitle>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-full text-indigo-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{summary.conversionRate}%</div>
                    <Progress value={summary.conversionRate} className="h-1.5 mt-2 bg-indigo-100 dark:bg-indigo-900" />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Line graph section */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Leads Ingest & Action Timeline
                  </CardTitle>
                  <CardDescription>
                    Visualizing incoming leads compared with follow-up engagement and lost pipelines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {isTrendLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground text-sm animate-pulse">Loading trend records...</span>
                    </div>
                  ) : trendData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No leads generated inside this interval.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis 
                          dataKey="label" 
                          tickLine={false} 
                          axisLine={{ stroke: '#ccc', strokeWidth: 0.5 }} 
                          tick={{ fill: '#888', fontSize: 11 }}
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={{ stroke: '#ccc', strokeWidth: 0.5 }} 
                          tick={{ fill: '#888', fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "rgba(30, 41, 59, 0.95)", 
                            border: "none", 
                            borderRadius: "12px", 
                            color: "#fff",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                          }}
                        />
                        <Legend iconType="circle" />
                        <Line 
                          type="monotone" 
                          dataKey="incoming" 
                          name="Incoming (Green)" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          activeDot={{ r: 6 }} 
                          dot={{ r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attended" 
                          name="Attended (Yellow)" 
                          stroke="#eab308" 
                          strokeWidth={2.5} 
                          activeDot={{ r: 6 }} 
                          dot={{ r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lost" 
                          name="Lost (Red)" 
                          stroke="#ef4444" 
                          strokeWidth={2.5} 
                          activeDot={{ r: 6 }} 
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Ingestion Share breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="shadow-lg border bg-card/60 backdrop-blur-md h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Platform Acquisition Share</CardTitle>
                    <CardDescription>Percentage distribution of leads from ad webhooks.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[220px] flex items-center justify-center relative">
                    {pieData.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No campaign attribution available.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-xs text-muted-foreground uppercase font-semibold">Total leads</span>
                          <span className="text-2xl font-bold">{summary.total}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                  {pieData.length > 0 && (
                    <div className="px-6 pb-6 space-y-2 border-t pt-4">
                      {pieData.map((d, index) => (
                        <div key={d.name} className="flex justify-between text-xs items-center">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="font-medium">{d.name}</span>
                          </div>
                          <span className="font-semibold">{d.value} ({Math.round((d.value / summary.total) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="shadow-lg border bg-card/60 backdrop-blur-md h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Recent Leads Attribution</CardTitle>
                    <CardDescription>Attributing lead captures to active social campaigns.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Ingestion Source</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Budget Progress</TableHead>
                          <TableHead className="text-right">Total Leads</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isCampaignsLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading campaigns...</TableCell></TableRow>
                        ) : !campaigns || campaigns.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No active campaigns configured.</TableCell></TableRow>
                        ) : (
                          campaigns.map(c => {
                            const spentPercent = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
                            return (
                              <TableRow key={c.id} className="hover:bg-muted/20">
                                <TableCell className="font-semibold text-sm">{c.name}</TableCell>
                                <TableCell>
                                  <Badge className={c.platform === "LinkedIn" ? "bg-blue-600/10 text-blue-600 border-blue-200" : "bg-pink-600/10 text-pink-600 border-pink-200"}>
                                    {c.platform === "LinkedIn" ? <Linkedin className="w-3 h-3 mr-1 fill-current" /> : <Instagram className="w-3 h-3 mr-1" />}
                                    {c.platform}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[200px]">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span>Spent: ₹{c.spent}</span>
                                      <span>Budget: ₹{c.budget}</span>
                                    </div>
                                    <Progress value={spentPercent} className="h-1" />
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm text-indigo-600">{c.leadCount || 0} leads</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Campaigns Tab Content */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Campaign Creator form */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="shadow-lg border bg-card/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                      <Briefcase className="w-5 h-5 text-indigo-500" />
                      Add Ad Campaign
                    </CardTitle>
                    <CardDescription>
                      Register a LinkedIn or Instagram campaign to automatically link webhook leads.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Campaign Name</label>
                        <Input 
                          placeholder="e.g. Summer Construction Offer" 
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Ad Platform</label>
                        <Select value={campaignPlatform} onValueChange={setCampaignPlatform}>
                          <SelectTrigger>
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LinkedIn">LinkedIn Ads</SelectItem>
                            <SelectItem value="Instagram">Instagram / Meta Ads</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex justify-between">
                          <span>Linked Ad Form/Ad ID</span>
                          <span className="text-[10px] text-muted-foreground italic">(Sent via webhook payload)</span>
                        </label>
                        <Input 
                          placeholder="e.g. 102938475" 
                          value={campaignTargetId}
                          onChange={(e) => setCampaignTargetId(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Budget (₹)</label>
                          <Input 
                            type="number" 
                            placeholder="50000" 
                            value={campaignBudget}
                            onChange={(e) => setCampaignBudget(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Spent (₹)</label>
                          <Input 
                            type="number" 
                            placeholder="12000" 
                            value={campaignSpent}
                            onChange={(e) => setCampaignSpent(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer mt-2"
                        disabled={createCampaignMutation.isPending}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Campaigns List Grid */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="shadow-lg border bg-card/60 backdrop-blur-md h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Active Social Ad Campaigns</CardTitle>
                    <CardDescription>
                      Monitor budget allocations, real-time ROI, and leads counts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isCampaignsLoading ? (
                      <div className="text-center py-10 text-muted-foreground text-sm">Loading campaign manager...</div>
                    ) : !campaigns || campaigns.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl p-6">
                        No campaigns created yet. Create one on the left to start tracking ROI!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaigns.map(c => {
                          const spentPercent = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
                          return (
                            <Card key={c.id} className="border hover:shadow-md transition-all p-4 bg-card/80 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <Badge className={c.platform === "LinkedIn" ? "bg-blue-600/10 text-blue-600 border-blue-200" : "bg-pink-600/10 text-pink-600 border-pink-200"}>
                                    {c.platform === "LinkedIn" ? <Linkedin className="w-3.5 h-3.5 mr-1 fill-current" /> : <Instagram className="w-3.5 h-3.5 mr-1" />}
                                    {c.platform}
                                  </Badge>
                                  <Button 
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete campaign "${c.name}"?`)) {
                                        deleteCampaignMutation.mutate(c.id);
                                      }
                                    }}
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <h3 className="font-bold text-base text-foreground mb-1 leading-snug">{c.name}</h3>
                                <p className="text-[11px] text-muted-foreground mb-4">Form/Ad ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{c.targetId || "N/A"}</code></p>
                              </div>

                              <div className="space-y-3.5 pt-3 border-t">
                                {/* Leads Status Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span>Total Leads</span>
                                    <span className="text-indigo-600 font-bold">{c.leadCount || 0}</span>
                                  </div>
                                  {c.leadCount > 0 && (
                                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                                      <div className="bg-emerald-500" style={{ width: `${Math.round(((c.stats?.incoming || 0) / c.leadCount) * 100)}%` }} title={`Incoming: ${c.stats?.incoming}`}></div>
                                      <div className="bg-amber-500" style={{ width: `${Math.round(((c.stats?.attended || 0) / c.leadCount) * 100)}%` }} title={`Attended: ${c.stats?.attended}`}></div>
                                      <div className="bg-rose-500" style={{ width: `${Math.round(((c.stats?.lost || 0) / c.leadCount) * 100)}%` }} title={`Lost: ${c.stats?.lost}`}></div>
                                    </div>
                                  )}
                                  <div className="flex gap-2 text-[9px] text-muted-foreground">
                                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Incoming ({c.stats?.incoming || 0})</span>
                                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Attended ({c.stats?.attended || 0})</span>
                                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Lost ({c.stats?.lost || 0})</span>
                                  </div>
                                </div>

                                {/* Budget progress */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground">Budget Spent: <strong>₹{c.spent}</strong></span>
                                    <span className="text-muted-foreground font-medium">Limit: ₹{c.budget}</span>
                                  </div>
                                  <Progress value={spentPercent} className={`h-1.5 ${spentPercent > 90 ? "bg-rose-100 text-rose-500" : ""}`} />
                                  <div className="flex justify-end text-[9px] text-muted-foreground font-semibold">
                                    <span className={spentPercent > 90 ? "text-rose-500" : ""}>{spentPercent}% spent</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </TabsContent>
        </Tabs>

      </motion.div>
    </Layout>
  );
}
