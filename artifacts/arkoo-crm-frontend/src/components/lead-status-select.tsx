import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateLead } from "@/hooks/use-leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["New", "Form Pending", "Form Filled", "Contacted", "Qualified", "Converted", "Lost"];

function normalizeStatus(raw: string): string {
  if (!raw) return "New";
  const s = raw.toLowerCase().trim();
  if (s === "new") return "New";
  if (s === "form pending") return "Form Pending";
  if (s === "form filled") return "Form Filled";
  if (s === "contacted") return "Contacted";
  if (s === "qualified") return "Qualified";
  if (s === "converted") return "Converted";
  if (s === "lost") return "Lost";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={updateLead.isPending}>
      <SelectTrigger className={variant === "inline" ? "h-7 border-0 bg-transparent shadow-none font-medium hover:bg-muted/50 focus:ring-0 px-2" : "w-[140px]"}>
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
