import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Send, Loader2, Building2, User, MapPin, Ruler, Wallet, Clock, FileText, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  fullname: string;
  emailaddress: string;
  phonenumber: string;
  projectlocation: string;
  projecttype: string;
  proposedarea: string;
  estimatedbudget: string;
  completiontimeline: string;
  additionalrequirements: string;
  landStatus: string;
  hasArchitect: string;
  architectName: string;
  architectContact: string;
  lookingForArchitect: string;
  govtApprovals: string;
  fileArchitectural: File | null;
  fileTender: File | null;
  fileSupporting: File | null;
}

interface FieldError {
  [key: string]: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROJECT_TYPES = [
  "PEB Structure",
  "PEB Warehouse",
  "Industrial Shed",
  "Commercial Space",
  "Interior Design",
  "Architectural Pre-Build",
];

const BUDGET_RANGES = [
  "Under 10 Lakhs",
  "10 – 25 Lakhs",
  "25 – 50 Lakhs",
  "50 Lakhs – 1 Crore",
  "Above 1 Crore",
];

const TIMELINES = [
  "Immediate (ASAP)",
  "Within 1 Month",
  "1 – 3 Months",
  "3 – 6 Months",
  "6 – 12 Months",
  "Exploring / Not Sure",
];

const EMPTY_FORM: FormData = {
  fullname: "",
  emailaddress: "",
  phonenumber: "",
  projectlocation: "",
  projecttype: "",
  proposedarea: "",
  estimatedbudget: "",
  completiontimeline: "",
  additionalrequirements: "",
  landStatus: "",
  hasArchitect: "",
  architectName: "",
  architectContact: "",
  lookingForArchitect: "",
  govtApprovals: "",
  fileArchitectural: null,
  fileTender: null,
  fileSupporting: null,
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(data: FormData): FieldError {
  const errors: FieldError = {};
  if (!data.fullname.trim()) errors.fullname = "Full name is required.";
  if (!data.emailaddress.trim()) {
    errors.emailaddress = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailaddress)) {
    errors.emailaddress = "Please enter a valid email address.";
  }
  if (!data.phonenumber.trim()) errors.phonenumber = "Phone number is required.";
  if (!data.projectlocation.trim()) errors.projectlocation = "Project location is required.";
  if (!data.projecttype) errors.projecttype = "Please select a project type.";
  if (!data.proposedarea.trim()) {
    errors.proposedarea = "Proposed area is required.";
  } else if (isNaN(Number(data.proposedarea)) || Number(data.proposedarea) <= 0) {
    errors.proposedarea = "Please enter a valid area in Sq. Ft.";
  }
  if (!data.estimatedbudget) errors.estimatedbudget = "Please select a budget range.";
  if (!data.completiontimeline) errors.completiontimeline = "Please select a timeline.";
  
  if (!data.landStatus) errors.landStatus = "Please select land ownership status.";
  if (!data.hasArchitect) errors.hasArchitect = "Please specify if you have hired an architect.";
  
  if (data.hasArchitect === "Yes") {
    if (!data.architectName.trim()) errors.architectName = "Architect name is required.";
    if (!data.architectContact.trim()) errors.architectContact = "Architect contact is required.";
  } else if (data.hasArchitect === "No") {
    if (!data.lookingForArchitect) errors.lookingForArchitect = "Please answer this question.";
  }

  if (!data.govtApprovals) errors.govtApprovals = "Please specify government approval status.";

  return errors;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
}

function FieldWrapper({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-rose-400 text-xs mt-1.5"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

function TextInput({
  id, name, value, onChange, placeholder, type = "text", error,
}: {
  id: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; error?: string;
}) {
  return (
    <FieldWrapper error={error}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/70 border text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all ${
          error ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"
        }`}
      />
    </FieldWrapper>
  );
}

function SelectInput({
  id, name, value, onChange, options, placeholder, error,
}: {
  id: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; placeholder: string; error?: string;
}) {
  return (
    <FieldWrapper error={error}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800/70 border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all appearance-none cursor-pointer ${
          value ? "text-slate-100" : "text-slate-500"
        } ${error ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-800 text-slate-100">{opt}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}

function FileInput({
  id, name, accept, label, onChange, file,
}: {
  id: string; name: string; accept: string; label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; file: File | null;
}) {
  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className="flex items-center justify-between w-full px-4 py-3 border border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 border-slate-700 hover:border-indigo-500/50 transition-all"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-slate-200 truncate">{file ? file.name : label}</span>
            <span className="text-xs text-slate-500">{file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : accept}</span>
          </div>
        </div>
        <div className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-all shrink-0">
          {file ? "Change" : "Upload"}
        </div>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center justify-center text-center py-12 px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
        className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-white mb-3"
      >
        Specifications Received!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-slate-400 max-w-sm leading-relaxed"
      >
        Thank you for submitting your project details. Our engineering team is reviewing your specifications and will reach out to you shortly with a custom layout and cost estimate.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 px-5 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm"
      >
        📩 A confirmation email has been sent to your inbox.
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorEl = document.getElementById(Object.keys(validationErrors)[0]);
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Construct AI-ready payload (Simulated uploads)
      const aiPayload = {
        submission_meta: {
          timestamp: new Date().toISOString()
        },
        business_data: {
          land_status: form.landStatus,
          government_approvals_completed: form.govtApprovals === "Yes",
          architect_status: {
            hired: form.hasArchitect === "Yes",
            architect_name: form.architectName || null,
            architect_contact: form.architectContact || null,
            looking_for_architect: form.hasArchitect === "No" ? (form.lookingForArchitect === "Yes") : null
          }
        },
        uploaded_documents: {
          architectural_drawings: form.fileArchitectural ? [`https://storage.arkoo.com/mock/${form.fileArchitectural.name}`] : [],
          tender_drawings: form.fileTender ? [`https://storage.arkoo.com/mock/${form.fileTender.name}`] : [],
          supporting_documents: form.fileSupporting ? [`https://storage.arkoo.com/mock/${form.fileSupporting.name}`] : []
        },
        // Old form fields for backward compatibility
        ...form
      };

      const response = await fetch("/api/lms/google-form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiPayload,
          source: "Arkoo LMS Form",
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="flex items-center gap-2.5 font-bold text-lg text-white">
          <img src="/logo.png" alt="Arkoo Logo" className="h-7 w-auto object-contain rounded brightness-125" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-300 bg-clip-text text-transparent">
            Arkoo Prebuild
          </span>
        </div>
        <div className="ml-auto text-xs text-slate-500">Project Specification Form</div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          {/* Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="relative overflow-hidden px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent border-b border-white/5">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-3 py-1 rounded-full mb-3">
                  <Building2 className="w-3 h-3" />
                  Project Specification Form
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  Tell Us About Your Project
                </h1>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                  Fill in your project details below and our engineering team will prepare a custom layout and cost estimate for you.
                </p>
              </div>
            </div>

            {/* Form / Success */}
            <div className="px-8 py-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <SuccessScreen key="success" />
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    noValidate
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="space-y-8"
                  >
                    {/* ── Section 1: Your Details ── */}
                    <div>
                      <SectionHeader
                        icon={User}
                        title="Your Details"
                        subtitle="Contact information so we can reach you"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label required>Full Name</Label>
                          <TextInput
                            id="fullname"
                            name="fullname"
                            value={form.fullname}
                            onChange={handleChange}
                            placeholder="e.g. Rajesh Kumar"
                            error={errors.fullname}
                          />
                        </div>
                        <div>
                          <Label required>Email Address</Label>
                          <TextInput
                            id="emailaddress"
                            name="emailaddress"
                            type="email"
                            value={form.emailaddress}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            error={errors.emailaddress}
                          />
                        </div>
                        <div>
                          <Label required>Phone / Contact Number</Label>
                          <TextInput
                            id="phonenumber"
                            name="phonenumber"
                            value={form.phonenumber}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            error={errors.phonenumber}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* ── Section 2: Project Details ── */}
                    <div>
                      <SectionHeader
                        icon={Building2}
                        title="Project Details"
                        subtitle="Specifications for your structure"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label required>Project Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                            <FieldWrapper error={errors.projectlocation}>
                              <input
                                id="projectlocation"
                                name="projectlocation"
                                type="text"
                                value={form.projectlocation}
                                onChange={handleChange}
                                placeholder="City / State (e.g. Pune, Maharashtra)"
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/70 border text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all ${
                                  errors.projectlocation ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"
                                }`}
                              />
                            </FieldWrapper>
                          </div>
                        </div>

                        <div>
                          <Label required>Project Type</Label>
                          <SelectInput
                            id="projecttype"
                            name="projecttype"
                            value={form.projecttype}
                            onChange={handleChange}
                            options={PROJECT_TYPES}
                            placeholder="Select structure type..."
                            error={errors.projecttype}
                          />
                        </div>

                        <div>
                          <Label required>Proposed Area (Sq. Ft.)</Label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                            <FieldWrapper error={errors.proposedarea}>
                              <input
                                id="proposedarea"
                                name="proposedarea"
                                type="number"
                                min={1}
                                value={form.proposedarea}
                                onChange={handleChange}
                                placeholder="e.g. 5000"
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/70 border text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all ${
                                  errors.proposedarea ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"
                                }`}
                              />
                            </FieldWrapper>
                          </div>
                        </div>

                        <div>
                          <Label required>Estimated Budget</Label>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none z-10" />
                            <FieldWrapper error={errors.estimatedbudget}>
                              <select
                                id="estimatedbudget"
                                name="estimatedbudget"
                                value={form.estimatedbudget}
                                onChange={handleChange}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/70 border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all appearance-none cursor-pointer ${
                                  form.estimatedbudget ? "text-slate-100" : "text-slate-500"
                                } ${errors.estimatedbudget ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"}`}
                              >
                                <option value="" disabled>Select budget range...</option>
                                {BUDGET_RANGES.map((b) => (
                                  <option key={b} value={b} className="bg-slate-800 text-slate-100">{b}</option>
                                ))}
                              </select>
                            </FieldWrapper>
                          </div>
                        </div>

                        <div>
                          <Label required>Completion Timeline</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none z-10" />
                            <FieldWrapper error={errors.completiontimeline}>
                              <select
                                id="completiontimeline"
                                name="completiontimeline"
                                value={form.completiontimeline}
                                onChange={handleChange}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/70 border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all appearance-none cursor-pointer ${
                                  form.completiontimeline ? "text-slate-100" : "text-slate-500"
                                } ${errors.completiontimeline ? "border-rose-500/60" : "border-slate-700/60 hover:border-slate-600"}`}
                              >
                                <option value="" disabled>Select timeline...</option>
                                {TIMELINES.map((t) => (
                                  <option key={t} value={t} className="bg-slate-800 text-slate-100">{t}</option>
                                ))}
                              </select>
                            </FieldWrapper>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <Label>Additional Requirements / Design Notes</Label>
                          <FieldWrapper>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                              <textarea
                                id="additionalrequirements"
                                name="additionalrequirements"
                                value={form.additionalrequirements}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Any special requirements, design preferences, number of floors, overhead crane requirement, mezzanine floor, etc."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all resize-none"
                              />
                            </div>
                          </FieldWrapper>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* ── Section 3: Engineering & Regulatory ── */}
                    <div>
                      <SectionHeader
                        icon={Building2} // Reuse icon or change to something else
                        title="Engineering & Regulatory"
                        subtitle="Details about land, approvals, and documents"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div>
                          <Label required>Land Ownership Status</Label>
                          <SelectInput
                            id="landStatus"
                            name="landStatus"
                            value={form.landStatus}
                            onChange={handleChange}
                            options={["Owned Land", "Rented Land"]}
                            placeholder="Select status..."
                            error={errors.landStatus}
                          />
                        </div>

                        <div>
                          <Label required>Government Approvals Completed?</Label>
                          <SelectInput
                            id="govtApprovals"
                            name="govtApprovals"
                            value={form.govtApprovals}
                            onChange={handleChange}
                            options={["Yes", "No"]}
                            placeholder="Select yes/no..."
                            error={errors.govtApprovals}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <Label required>Have you hired an architect?</Label>
                          <div className="w-1/2 pr-2">
                            <SelectInput
                              id="hasArchitect"
                              name="hasArchitect"
                              value={form.hasArchitect}
                              onChange={handleChange}
                              options={["Yes", "No"]}
                              placeholder="Select yes/no..."
                              error={errors.hasArchitect}
                            />
                          </div>
                        </div>

                        <AnimatePresence mode="popLayout">
                          {form.hasArchitect === "Yes" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
                            >
                              <div>
                                <Label required>Architect Name</Label>
                                <TextInput
                                  id="architectName"
                                  name="architectName"
                                  value={form.architectName}
                                  onChange={handleChange}
                                  placeholder="Enter architect's name"
                                  error={errors.architectName}
                                />
                              </div>
                              <div>
                                <Label required>Architect Contact Number</Label>
                                <TextInput
                                  id="architectContact"
                                  name="architectContact"
                                  type="tel"
                                  value={form.architectContact}
                                  onChange={handleChange}
                                  placeholder="Enter architect's contact"
                                  error={errors.architectContact}
                                />
                              </div>
                            </motion.div>
                          )}

                          {form.hasArchitect === "No" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="sm:col-span-2 overflow-hidden"
                            >
                              <div className="w-1/2 pr-2">
                                <Label required>Are you looking for an architect?</Label>
                                <SelectInput
                                  id="lookingForArchitect"
                                  name="lookingForArchitect"
                                  value={form.lookingForArchitect}
                                  onChange={handleChange}
                                  options={["Yes", "No"]}
                                  placeholder="Select yes/no..."
                                  error={errors.lookingForArchitect}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="sm:col-span-2 mt-4 space-y-4">
                          <Label>Document Uploads (Optional but Recommended)</Label>
                          <div className="grid grid-cols-1 gap-3">
                            <FileInput
                              id="fileArchitectural"
                              name="fileArchitectural"
                              accept=".pdf,.png,.jpg,.jpeg"
                              label="Architectural Drawings (PDF, Image)"
                              onChange={handleFileChange}
                              file={form.fileArchitectural}
                            />
                            <FileInput
                              id="fileTender"
                              name="fileTender"
                              accept=".pdf"
                              label="Tender Drawings (PDF)"
                              onChange={handleFileChange}
                              file={form.fileTender}
                            />
                            <FileInput
                              id="fileSupporting"
                              name="fileSupporting"
                              accept=".pdf,.doc,.docx"
                              label="Supporting Documents (PDF, Word)"
                              onChange={handleFileChange}
                              file={form.fileSupporting}
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Honeypot (anti-spam, hidden) */}
                    <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                    {/* Submit Error */}
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{submitError}</span>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      id="submit-apply-form"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Project Specifications
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                      Fields marked with <span className="text-rose-400">*</span> are required.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            © {new Date().getFullYear()} Arkoo Pre-Build Pvt. Ltd. · All rights reserved.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
