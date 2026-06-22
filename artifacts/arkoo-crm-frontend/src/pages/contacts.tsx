import { motion, AnimatePresence } from "framer-motion";
import { useListCustomers } from "@/hooks/use-customers";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, FileDown, Eye, FileText, MapPin, Calendar, IndianRupee, HardHat, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Contacts() {
  const { data: customers, isLoading } = useListCustomers();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const downloadExcel = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) return;
    
    const headers = [
      "Name", "Email", "Phone", "Location/Address", "Added On", 
      "Project Type", "Proposed Area", "Estimated Budget", "Completion Timeline",
      "Land Ownership Status", "Government Approvals", "Architect Hired", "Additional Requirements"
    ];
    
    const rows = filteredCustomers.map(customer => {
      const proj = customer.projects && customer.projects.length > 0 ? customer.projects[0] : {};
      const raw = customer.rawData || {};
      
      return [
        customer.name,
        customer.email,
        customer.phone,
        customer.address || "-",
        new Date(customer.created_at).toLocaleDateString(),
        proj.type || "-",
        proj.area_sqft || proj.areaSqft || "-",
        proj.budget || "-",
        proj.timeline || "-",
        raw.landownership || "-",
        raw.govapprovals || "-",
        raw.hiredarchitect || "-",
        raw.requirements || raw.message || "-"
      ];
    });
    
    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Arkoo_LMS_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">Manage Data</h1>
            <p className="text-emerald-100 mt-1">Manage all your synced CRM leads and customers.</p>
          </div>
          <div className="relative z-10 p-3 bg-white/10 rounded-full backdrop-blur-md">
            <Users className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-sm">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search data..."
              className="pl-10 bg-background/50 border-muted-foreground/20 rounded-lg h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer h-10"
            disabled={!filteredCustomers || filteredCustomers.length === 0}
          >
            <FileDown className="w-4 h-4" />
            <span>Export to Excel</span>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-muted-foreground/20 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Email / Phone</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Project Type</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Location</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Budget</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right">Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredCustomers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64">
                          <div className="flex flex-col items-center justify-center text-muted-foreground h-full space-y-3">
                            <div className="p-4 rounded-full bg-muted/50">
                              <Users className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">No contacts found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers?.map((customer) => (
                        <motion.tr 
                          key={customer.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-muted/30 transition-colors border-b cursor-pointer"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">{customer.email}</span>
                              <span className="text-xs font-mono text-muted-foreground/70">{customer.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.projects?.[0]?.type ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-normal">
                                {customer.projects[0].type}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{customer.address || '-'}</TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {customer.projects?.[0]?.budget || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm text-right">
                            {new Date(customer.created_at).toLocaleDateString()}
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

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto sm:max-w-[600px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              Customer Details
            </SheetTitle>
          </SheetHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <Search className="w-4 h-4 text-emerald-500" /> Contact Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Added On</p>
                    <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <HardHat className="w-4 h-4 text-emerald-500" /> Project Details
                </h3>
                {selectedCustomer.projects && selectedCustomer.projects.length > 0 ? (
                  selectedCustomer.projects.map((proj: any, idx: number) => (
                    <div key={idx} className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</p>
                          <p className="font-medium">{selectedCustomer.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{proj.type || 'N/A'}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><FileSpreadsheet className="w-3 h-3"/> Area</p>
                          <p className="font-medium">{proj.area_sqft || proj.areaSqft ? `${proj.area_sqft || proj.areaSqft} Sq. Ft.` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Budget</p>
                          <p className="font-medium text-emerald-700">{proj.budget ? `${proj.budget}` : 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Timeline</p>
                          <p className="font-medium">{proj.timeline || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No projects found.</p>
                )}
              </div>

              {/* Engineering & Regulatory */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> Engineering & Regulatory
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Land Ownership Status</p>
                    <p className="font-medium">{selectedCustomer.rawData?.landownership || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Government Approvals</p>
                    <p className="font-medium">{selectedCustomer.rawData?.govapprovals || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Architect Hired</p>
                    <p className="font-medium">{selectedCustomer.rawData?.hiredarchitect || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Additional Requirements</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedCustomer.rawData?.requirements || selectedCustomer.rawData?.message || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <FileDown className="w-4 h-4 text-emerald-500" /> Uploaded Documents
                </h3>
                <div className="space-y-2">
                  {selectedCustomer.rawData?.uploadedDocuments && Object.keys(selectedCustomer.rawData.uploadedDocuments).length > 0 ? (
                    Object.entries(selectedCustomer.rawData.uploadedDocuments).map(([key, url]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          </div>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" /> View
                          </Button>
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
