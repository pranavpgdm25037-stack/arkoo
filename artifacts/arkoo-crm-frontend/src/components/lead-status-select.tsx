import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateLead } from "@/hooks/use-leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["Form Pending", "Form Filled", "Contacted", "Qualified", "Converted", "Lost"];

function normalizeStatus(raw: string): string {
  if (!raw) return "Form Pending";
  const s = raw.toLowerCase().trim();
  if (s === "new") return "Form Pending";
  if (s === "form pending") return "Form Pending";
  if (s === "form filled") return "Form Filled";
  if (s === "contacted") return "Contacted";
  if (s === "qualified") return "Qualified";
  if (s === "converted") return "Converted";
  if (s === "lost") return "Lost";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getStatusColor(status: string) {
  switch (status) {
    case "Form Pending":
      return "text-orange-600 bg-orange-100 hover:bg-orange-200 border-orange-200";
    case "Form Filled":
      return "text-purple-600 bg-purple-100 hover:bg-purple-200 border-purple-200";
    case "Contacted":
      return "text-blue-600 bg-blue-100 hover:bg-blue-200 border-blue-200";
    case "Qualified":
      return "text-amber-600 bg-amber-100 hover:bg-amber-200 border-amber-200";
    case "Converted":
      return "text-emerald-600 bg-emerald-100 hover:bg-emerald-200 border-emerald-200";
    case "Lost":
      return "text-rose-600 bg-rose-100 hover:bg-rose-200 border-rose-200";
    default:
      return "text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200";
  }
}

export function LeadStatusSelect({ id, initialStatus, variant = "default" }: { id: string; initialStatus: string; variant?: "default" | "inline" }) {
  const normalizedInitial = normalizeStatus(initialStatus);
  const [status, setStatus] = useState(normalizedInitial);
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateLead.mutate({
      id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['lead', id] });
        toast({
          title: "Status updated",
          description: `Lead status changed to ${newStatus}`,
        });
      },
      onError: () => {
        setStatus(normalizedInitial); // revert
        toast({
          title: "Update failed",
          description: "Could not update lead status.",
          variant: "destructive"
        });
      }
    });
  };

  const statusColorClass = getStatusColor(status);

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={updateLead.isPending}>
      <SelectTrigger 
        className={variant === "inline" 
          ? `h-7 border-0 font-medium hover:opacity-80 focus:ring-0 px-3 py-1 rounded-full text-xs ${statusColorClass}` 
          : `w-[140px] font-medium border-0 px-3 rounded-full text-xs hover:opacity-80 ${statusColorClass}`}
      >
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map(s => (
          <SelectItem key={s} value={s}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(s).split(' ')[1]}`} />
              {s}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
