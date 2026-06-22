import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Linkedin, 
  Instagram, 
  Copy, 
  Check
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Settings() {
  const { session } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  
  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg">
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="text-violet-100 mt-1">Manage your account and platform preferences.</p>
          </div>
          <div className="relative z-10 p-3 bg-white/10 rounded-full backdrop-blur-md">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-muted-foreground/20 shadow-sm rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>Profile Details</CardTitle>
              </div>
              <CardDescription>Your personal account information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                  <div className="font-medium text-muted-foreground">Email Address</div>
                  <div className="md:col-span-2 font-medium">{session?.user?.email || 'Not logged in'}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                  <div className="font-medium text-muted-foreground">Role</div>
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Administrator
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-muted-foreground/20 shadow-sm rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive daily lead summaries</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Webhooks</Label>
                  <p className="text-sm text-muted-foreground">Ding on new leads</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20 shadow-sm rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Auth</Label>
                  <p className="text-sm text-muted-foreground">Not configured</p>
                </div>
                <Button variant="outline" size="sm">Setup</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Sessions</Label>
                  <p className="text-sm text-muted-foreground">1 device logged in</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-muted-foreground/20 shadow-lg rounded-2xl bg-card/60 backdrop-blur-md overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b pb-6">
              <div className="flex items-center gap-2.5">
                <Globe className="w-6 h-6 text-indigo-400 animate-pulse" />
                <div>
                  <CardTitle className="text-xl">Social & Website Lead Integrations</CardTitle>
                  <CardDescription className="text-slate-300 mt-1">Connect your active social pages and websites to capture leads automatically.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. LinkedIn Connector */}
                <div className="flex flex-col p-4 rounded-xl border bg-card/40 backdrop-blur-sm relative overflow-hidden group/card hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-[#0A66C2]">
                      <Linkedin className="w-5 h-5 fill-current" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20">
                      Active Webhook
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm">LinkedIn Lead Gen Forms</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Route corporate and professional prebuild inquiries directly into the CRM pipelines.</p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="bg-muted p-2 rounded-lg text-[10px] font-mono select-all flex justify-between items-center border">
                      <span className="truncate mr-2">https://arkoo-infra.onrender.com/api/webhooks/arkoo-lead</span>
                      <Button onClick={() => handleCopy("https://arkoo-infra.onrender.com/api/webhooks/arkoo-lead", "linkedin")} size="icon" variant="ghost" className="h-6 w-6 cursor-pointer">
                        {copied === "linkedin" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <a href="https://www.linkedin.com/company/arkoo-infra-trade-pvt-ltd/" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 cursor-pointer">
                        <Globe className="w-3 h-3" /> View LinkedIn Page
                      </Button>
                    </a>
                  </div>
                </div>

                {/* 2. Instagram Connector */}
                <div className="flex flex-col p-4 rounded-xl border bg-card/40 backdrop-blur-sm relative overflow-hidden group/card hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-[#E1306C]">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20">
                      Active Webhook
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm">Instagram Lead Ads</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Connect Meta Lead Ads and capture retail construction and design inquiries instantly.</p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="bg-muted p-2 rounded-lg text-[10px] font-mono select-all flex justify-between items-center border">
                      <span className="truncate mr-2">https://arkoo-infra.onrender.com/api/webhooks/arkoo-lead</span>
                      <Button onClick={() => handleCopy("https://arkoo-infra.onrender.com/api/webhooks/arkoo-lead", "instagram")} size="icon" variant="ghost" className="h-6 w-6 cursor-pointer">
                        {copied === "instagram" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <a href="https://www.instagram.com/arkooprebuild?igsh=MXQ4MnY3dHl1ODAxNg==" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 cursor-pointer">
                        <Globe className="w-3 h-3" /> View Instagram Profile
                      </Button>
                    </a>
                  </div>
                </div>

                {/* 3. Website Integration */}
                <div className="flex flex-col p-4 rounded-xl border bg-card/40 backdrop-blur-sm relative overflow-hidden group/card hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/20">
                      Embed Ready
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm">Official Website Integration</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Feed website contact forms from `www.arkooprebuild.com` directly into the CRM database.</p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="bg-muted p-2 rounded-lg text-[10px] font-mono select-all flex justify-between items-center border">
                      <span className="truncate mr-2">source: "Website"</span>
                      <Button onClick={() => handleCopy('{"source": "Website"}', "website")} size="icon" variant="ghost" className="h-6 w-6 cursor-pointer">
                        {copied === "website" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <a href="https://www.arkooprebuild.com/" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 cursor-pointer">
                        <Globe className="w-3 h-3" /> Go to Website
                      </Button>
                    </a>
                  </div>
                </div>

              </div>

            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </Layout>
  );
}
