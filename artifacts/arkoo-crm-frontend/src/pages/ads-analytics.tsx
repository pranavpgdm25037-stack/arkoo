import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Globe, 
  Linkedin, 
  Instagram, 
  Check,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AdsAnalytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/lms/analytics/ads"],
  });

  const getPlatformIcon = (platform: string) => {
    switch(platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-5 h-5 text-[#0A66C2]" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-[#E1306C]" />;
      case 'website': return <Globe className="w-5 h-5 text-indigo-500" />;
      case 'google': return <Globe className="w-5 h-5 text-green-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ads Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Measure cross-platform advertisement performance and CRM lead generation.
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Top KPIs */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analyticsData?.summary?.totalSpend?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all connected platforms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Leads Generated</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData?.summary?.totalLeads?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Captured directly into CRM</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Avg Cost Per Lead (CPL)</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analyticsData?.summary?.avgCpl?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Global average CPL</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData?.summary?.totalClicks?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ad interactions</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Spend vs Leads by Platform</CardTitle>
                    <CardDescription>Visualizing efficiency across your marketing channels</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.platforms || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="platform" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="spend" name="Ad Spend ($)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="leads" name="Leads Captured" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Integration Status widget */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="h-full border-muted-foreground/20 shadow-lg bg-card/60 backdrop-blur-md">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-indigo-400" />
                      Active Connections
                    </CardTitle>
                    <CardDescription className="text-slate-300">Data pipelines actively feeding CRM</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        </div>
                        <span className="font-medium text-sm">LinkedIn Ads</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Live
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-md">
                          <Instagram className="w-4 h-4 text-[#E1306C]" />
                        </div>
                        <span className="font-medium text-sm">Instagram Ads</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Live
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                          <Globe className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-sm">Website PIF</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Live
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Platform Detail Table */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                  <CardDescription>Detailed metrics per marketing channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Source / Platform</th>
                          <th className="px-4 py-3 font-medium text-right">Impressions</th>
                          <th className="px-4 py-3 font-medium text-right">Clicks</th>
                          <th className="px-4 py-3 font-medium text-right">CTR</th>
                          <th className="px-4 py-3 font-medium text-right">Total Spend</th>
                          <th className="px-4 py-3 font-medium text-right">Leads (CRM)</th>
                          <th className="px-4 py-3 font-medium text-right">CPL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData?.platforms?.map((row: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2 font-medium">
                              {getPlatformIcon(row.platform)}
                              {row.platform}
                            </td>
                            <td className="px-4 py-3 text-right">{row.impressions.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">{row.clicks.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">{row.ctr}%</td>
                            <td className="px-4 py-3 text-right font-medium">${row.spend.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-medium text-primary">{row.leads}</td>
                            <td className="px-4 py-3 text-right">${row.cpl.toFixed(2)}</td>
                          </tr>
                        ))}
                        {(!analyticsData?.platforms || analyticsData.platforms.length === 0) && (
                          <tr>
                            <td colSpan={7} className="text-center py-6 text-muted-foreground">No ad data available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </>
        )}
      </motion.div>
    </Layout>
  );
}
