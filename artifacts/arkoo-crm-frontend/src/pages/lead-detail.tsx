import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useGetLead, useUpdateLead, useSendFormEmail } from "@/hooks/use-leads";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { ArrowLeft, Mail, Phone, Calendar, Save, Building2, BookOpen, Clock, FileText, MapPin, Wallet, Download, Loader2 } from "lucide-react";


function formatBudget(value: any) {
  if (!value) return "Not Specified";
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

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: leadData, isLoading } = useGetLead(id as string);
  const lead = leadData as any;
  console.log("DEBUG - lead detail:", lead);
  
  const updateLead = useUpdateLead();
  const sendFormEmail = useSendFormEmail();
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
    if (!label) return "bg-slate-500 text-white";
    switch (label.toUpperCase()) {
      case "HOT": return "bg-red-500 text-white";
      case "WARM": return "bg-amber-500 text-white";
      case "COLD": return "bg-blue-500 text-white";
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
            {(lead.status === "New" || lead.status === "Form Pending") && (
              <Button 
                variant="outline" 
                className="bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-900 text-indigo-700 font-semibold"
                disabled={sendFormEmail.isPending}
                onClick={() => {
                  sendFormEmail.mutate(lead.id, {
                    onSuccess: (data: any) => {
                      toast({
                        title: "Form email sent",
                        description: `Specification form invite sent successfully.${data.previewUrl ? ` Preview URL: ${data.previewUrl}` : ''}`,
                      });
                    },
                    onError: (err: any) => {
                      toast({
                        title: "Failed to send email",
                        description: err.message || "Could not trigger email.",
                        variant: "destructive"
                      });
                    }
                  });
                }}
              >
                {sendFormEmail.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Form
              </Button>
            )}
            <LeadStatusSelect id={lead.id} initialStatus={lead.status} />

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
                      <div className="text-sm text-muted-foreground">Project Type</div>
                      <div className="font-medium">{lead.project_type || lead.raw_data?.projectType || lead.raw_data?.projecttype || lead.raw_data?.['Project Type'] || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details Card */}
            <Card>
              <CardHeader className="pb-4 border-b flex flex-row items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4 mr-1" /> Location
                    </div>
                    <div className="font-medium text-base">
                      {lead.location || lead.raw_data?.projectLocation || lead.raw_data?.projectlocation || lead.raw_data?.['Project Location'] || 'Not Specified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Type</div>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                      {lead.project_type || lead.raw_data?.projectType || lead.raw_data?.projecttype || lead.raw_data?.['Project Type'] || 'Not Specified'}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <FileText className="w-4 h-4 mr-1" /> Area
                    </div>
                    <div className="font-medium text-base">
                      {lead.area_sqft || lead.raw_data?.projectAreaSqft || lead.raw_data?.proposedarea || lead.raw_data?.['Project Area'] || 'Not Specified'} Sq. Ft.
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Wallet className="w-4 h-4 mr-1" /> Budget
                    </div>
                    <div className="font-medium text-emerald-600 text-base">
                      {lead.raw_data?.estimatedBudget || lead.raw_data?.['Estimated Budget'] || lead.raw_data?.estimatedbudget || lead.raw_data?.budget || (lead.budget ? formatBudget(lead.budget) : 'Not Specified')}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4 mr-1" /> Timeline
                    </div>
                    <div className="font-medium text-base">
                      {lead.timeline || lead.raw_data?.completionTimeline || lead.raw_data?.completiontimeline || lead.raw_data?.['Completion Timeline'] || 'Not Specified'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engineering & Regulatory Card */}
            <Card>
              <CardHeader className="pb-4 border-b flex flex-row items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">Engineering & Regulatory</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-sm text-muted-foreground">Land Ownership Status</div>
                    <div className="font-medium">{lead.raw_data?.landownership || lead.raw_data?.landStatus || 'Not Specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Government Approvals</div>
                    <div className="font-medium">{lead.raw_data?.govapprovals || lead.raw_data?.govtApprovals || 'Not Specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Architect Hired</div>
                    <div className="font-medium">
                      {lead.raw_data?.hiredarchitect || lead.raw_data?.hasArchitect || 'Not Specified'}
                      {(lead.raw_data?.architectName || lead.raw_data?.architectContact) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {lead.raw_data.architectName && <span>{lead.raw_data.architectName}</span>}
                          {lead.raw_data.architectName && lead.raw_data.architectContact && <span> • </span>}
                          {lead.raw_data.architectContact && <span>{lead.raw_data.architectContact}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <div className="text-sm text-muted-foreground">Additional Requirements / Design Notes</div>
                    <div className="font-medium whitespace-pre-wrap">{lead.raw_data?.additionalrequirements || (lead.raw_data?.requirements && !lead.raw_data.requirements.includes('Project Type:') ? lead.raw_data.requirements : 'None')}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-semibold">Uploaded Documents</h3>
                  </div>
                  {lead.raw_data?.uploadedDocuments && Object.keys(lead.raw_data.uploadedDocuments).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(lead.raw_data.uploadedDocuments).map(([key, url]: [string, any]) => {
                        const fullUrl = url.startsWith('/') ? `https://arkoo-u8sx.onrender.com${url}` : url;
                        const isImage = fullUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                        
                        return (
                          <div key={key} className="flex flex-col justify-between p-3 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center mb-2">
                              <FileText className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="text-sm font-semibold text-slate-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                            
                            {isImage ? (
                              <div className="relative group w-full h-32 rounded-lg overflow-hidden border bg-white mt-1 mb-3">
                                <img src={fullUrl} alt={key} className="w-full h-full object-cover" />
                                <a href={fullUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-medium gap-1 cursor-pointer backdrop-blur-[2px]">
                                  <Download className="w-5 h-5" />
                                  View / Download
                                </a>
                              </div>
                            ) : (
                              <div className="w-full h-12 bg-white border rounded-lg mt-1 mb-3 flex items-center justify-center text-xs text-slate-400">
                                Document File
                              </div>
                            )}

                            <a href={fullUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                              <Download className="w-3 h-3 mr-1" /> Open File
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No documents uploaded.</div>
                  )}
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
