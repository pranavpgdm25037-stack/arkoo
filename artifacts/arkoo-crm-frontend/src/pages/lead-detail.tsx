import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useGetLead, useUpdateLead } from "@/hooks/use-leads";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { ArrowLeft, Mail, Phone, Calendar, Save, Building2, BookOpen, Clock, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: leadData, isLoading } = useGetLead(id as string);
  const lead = leadData as any;
  
  const updateLead = useUpdateLead();
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (lead && initializedForId.current !== id) {
      initializedForId.current = id;
      setNotes(lead.notes || "");
    }
  }, [lead, id]);

  const handleSaveNotes = () => {
    if (notes === lead?.notes) return;
    
    updateLead.mutate({
      id,
      data: { notes }
    }, {
      onSuccess: () => {
        toast({ title: "Notes saved successfully" });
      },
      onError: () => {
        toast({ title: "Failed to save notes", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Lead not found</h2>
          <Link href="/dashboard">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case "Hot": return "bg-red-500 text-white";
      case "Warm": return "bg-amber-500 text-white";
      case "Cold": return "bg-blue-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-amber-500";
    return "text-blue-500";
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{lead.name}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <LeadStatusSelect id={lead.id} initialStatus={lead.status} />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Quotation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI Generated Quotation (Preview)</DialogTitle>
                  <DialogDescription>
                    This is a placeholder quotation format. The actual format will be provided later.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/30 p-6 rounded-md border font-mono text-sm whitespace-pre-wrap">
                  {`============================================
              ARKOO PREBUILD
============================================
Quotation For: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}

Date: ${new Date().toLocaleDateString()}
Quotation Ref: QTN-${lead.id.toString().substring(0, 8).toUpperCase()}
============================================

ITEM                           QTY    PRICE
--------------------------------------------
1. Preliminary Design           1   $500.00
2. 3D Architectural Renders     4   $1,200.00
3. Prebuild Material Package    1   $15,000.00
4. Implementation & Setup       1   $3,500.00

--------------------------------------------
SUBTOTAL:                           $20,200.00
TAX (18%):                          $3,636.00
============================================
TOTAL ESTIMATE:                     $23,836.00
============================================

* Note: This is an AI generated placeholder. 
Final numbers depend on material selection.`}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Email Address</div>
                      <div className="font-medium truncate">{lead.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone Number</div>
                      <div className="font-medium font-mono">{lead.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Lead Source</div>
                      <div className="font-medium">{lead.source || "Direct"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Course Interest</div>
                      <div className="font-medium">{lead.course_interest || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="flex flex-col min-h-[300px]">
              <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Notes</CardTitle>
                <Button 
                  size="sm" 
                  onClick={handleSaveNotes} 
                  disabled={notes === lead.notes || updateLead.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </Button>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <Textarea 
                  className="flex-1 min-h-[200px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
                  placeholder="Add notes about this lead here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mobile Status Select */}
            <div className="sm:hidden block">
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="font-medium">Status</div>
                  <LeadStatusSelect id={lead.id} initialStatus={lead.status} />
                </CardContent>
              </Card>
            </div>

            {/* AI Score Card */}
            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">AI Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center py-6">
                  <div className="relative flex items-center justify-center w-32 h-32 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="60" className="stroke-muted fill-none" strokeWidth="8" />
                      <circle 
                        cx="64" cy="64" r="60" 
                        className={`fill-none ${getScoreColor(lead.ai_score)}`} 
                        strokeWidth="8" 
                        strokeDasharray="377" 
                        strokeDashoffset={377 - (377 * lead.ai_score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-4xl font-bold font-mono tracking-tighter ${getScoreColor(lead.ai_score)}`}>
                        {lead.ai_score}
                      </span>
                    </div>
                  </div>
                  
                  <Badge className={`text-sm px-4 py-1 uppercase tracking-wider font-bold ${getLabelColor(lead.ai_label)} border-0 shadow-sm`}>
                    {lead.ai_label} LEAD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Meta Card */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Record Meta</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center"><Calendar className="w-4 h-4 mr-2" /> Created</span>
                  <span className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2" /> Last Updated</span>
                  <span className="font-medium">{lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '-'}</span>
                </div>
                {lead.assigned_to && (
                  <div className="flex justify-between items-center text-sm pt-4 border-t">
                    <span className="text-muted-foreground">Assignee</span>
                    <span className="font-medium">{lead.assigned_to}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
