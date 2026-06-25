import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Eye, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Lead {
  id: number;
  source: string;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    contactInfo: string;
  };
  project?: {
    type: string;
    bom?: string;
  };
  rawData: any;
}

export default function BOMEngine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBOM, setSelectedBOM] = useState<{leadName: string, bomText: string} | null>(null);

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/lms/leads"],
  });

  const generateBomMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const res = await fetch(`/api/lms/bom/generate/${leadId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate BOM");
      return data.bom;
    },
    onSuccess: (bomText, leadId) => {
      toast({
        title: "BOM Generated successfully!",
        description: "The AI has finished analyzing the drawings.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lms/leads"] });
      const lead = leads?.find(l => l.id === leadId);
      if (lead) {
        setSelectedBOM({ leadName: lead.customer?.name || 'Customer', bomText });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter leads that have uploaded documents
  const leadsWithDocs = leads?.filter(l => l.rawData?.uploadedDocuments && Object.keys(l.rawData.uploadedDocuments).length > 0) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI Bill of Materials Engine
        </h1>
        <p className="text-muted-foreground mt-2">
          Automatically extract structural details and generate material estimations from uploaded drawings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Leads with Drawings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {leadsWithDocs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No leads with uploaded drawings found.
                  </div>
                ) : (
                  leadsWithDocs.map(lead => {
                    const hasBOM = !!lead.rawData?.generatedBOM;
                    const docCount = Object.keys(lead.rawData.uploadedDocuments).length;
                    
                    return (
                      <div key={lead.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{lead.customer?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{lead.project?.type || "Project"}</div>
                          </div>
                          {hasBOM && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {docCount} Drawing{docCount !== 1 ? 's' : ''} Uploaded
                        </div>

                        <div className="flex gap-2">
                          {!hasBOM ? (
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              onClick={() => generateBomMutation.mutate(lead.id)}
                              disabled={generateBomMutation.isPending}
                            >
                              {generateBomMutation.isPending && generateBomMutation.variables === lead.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Generate AI BOM
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full"
                              onClick={() => setSelectedBOM({ leadName: lead.customer?.name || 'Customer', bomText: lead.rawData.generatedBOM })}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View BOM
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOM Viewer */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[600px] border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {selectedBOM ? `BOM: ${selectedBOM.leadName}` : 'Generated Bill of Materials'}
              </CardTitle>
              <CardDescription>
                {selectedBOM ? 'AI generated estimation based on drawing analysis.' : 'Select a lead to view or generate their BOM.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {selectedBOM ? (
                <div className="prose prose-sm max-w-none prose-blue">
                  <ReactMarkdown>{selectedBOM.bomText}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
                  <Package className="w-16 h-16 mb-4 opacity-20" />
                  <p>No BOM selected.</p>
                  <p className="text-sm">Click "View BOM" or "Generate AI BOM" on a lead from the list.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
