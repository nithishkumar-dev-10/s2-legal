import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Scale, MessageSquare, Gavel, Calendar, FileText,
  ShieldAlert, Send, Paperclip, User, Briefcase,
  Plus, Clock, MapPin, AlertTriangle, Loader2,
  Menu, X, Trash2, ChevronRight, Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Message, FileAttachment, UserRole, Case, Hearing } from "./types";
import { legalService } from "./services/apiService";

type Tab = "chat" | "cases" | "hearings";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "urgent";
}

// ── Quick action suggestions ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Summarize a petition",         query: "Summarize this petition and identify key legal claims." },
  { label: "IPC → BNS mapping",            query: "Map IPC 302, IPC 420, and IPC 498A to new BNS sections precisely." },
  { label: "Draft bail application",        query: "Draft a brief bail application under Section 439 CrPC mapped to BNSS." },
  { label: "Jurisdiction & filing steps",  query: "What are the steps for filing a quashing petition in the High Court?" },
];

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Add Case Modal ────────────────────────────────────────────────────────────
interface AddCaseModalProps {
  onClose: () => void;
  onSave: (c: Partial<Case>, hearingDate: string, hearingTime: string, hearingTitle: string) => void;
}

function AddCaseModal({ onClose, onSave }: AddCaseModalProps) {
  const [form, setForm] = useState({
    case_number: "", petitioner: "", respondent: "",
    court_name: "", hearing_date: "", hearing_time: "10:30",
    hearing_title: "First Mention",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Register Case</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-0.5">Secure Docket Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-legal-muted uppercase tracking-widest mb-1 block">Case Number *</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-legal-primary"
                placeholder="e.g. 1024/2025" value={form.case_number} onChange={(e) => set("case_number", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-legal-muted uppercase tracking-widest mb-1 block">Court / Bench</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-legal-primary"
                placeholder="e.g. Supreme Court" value={form.court_name} onChange={(e) => set("court_name", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-legal-muted uppercase tracking-widest mb-1 block">Petitioner *</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-legal-primary"
                placeholder="Full name" value={form.petitioner} onChange={(e) => set("petitioner", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-legal-muted uppercase tracking-widest mb-1 block">Respondent *</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-legal-primary"
                placeholder="Full name" value={form.respondent} onChange={(e) => set("respondent", e.target.value)} />
            </div>
          </div>

          <div className="p-4 bg-legal-primary/5 border border-legal-primary/20 rounded-2xl space-y-3">
            <p className="text-[10px] font-black text-legal-primary uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-legal-primary rounded-full animate-pulse inline-block" />
              Smart Scheduler — Next Hearing
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Date</label>
                <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-legal-primary"
                  value={form.hearing_date} onChange={(e) => set("hearing_date", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Time</label>
                <input type="time" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-legal-primary"
                  value={form.hearing_time} onChange={(e) => set("hearing_time", e.target.value)} />
              </div>
            </div>
          </div>

          <button
            disabled={!form.case_number || !form.petitioner || !form.respondent}
            onClick={() => onSave(
              { case_number: form.case_number, petitioner: form.petitioner, respondent: form.respondent, court_name: form.court_name || "N/A" },
              form.hearing_date, form.hearing_time, form.hearing_title,
            )}
            className="w-full bg-legal-primary text-white font-black py-3.5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-legal-primary/90 transition-all shadow-lg shadow-legal-primary/20"
          >
            Authorize Registration
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState<UserRole>("client");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [tab, setTab] = useState<Tab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddCase, setShowAddCase] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [c, h] = await Promise.all([legalService.getCases(), legalService.getHearings()]);
    setCases(c);
    setHearings(h);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── 24h hearing alerts ─────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      hearings.forEach((h) => {
        const dt = new Date(`${h.date}T${h.time}`);
        if (dt > now && dt <= cutoff) {
          const nid = `alert-${h.id}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === nid)) return prev;
            return [{ id: nid, title: "24H HEARING ALERT", message: `${h.title} at ${h.court} — tomorrow at ${h.time}`, type: "urgent" }, ...prev];
          });
        }
      });
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [hearings]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() };
    const aiId = (Date.now() + 1).toString();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", timestamp: new Date() };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    await legalService.analyzeQuery(
      input,
      messages,
      role,
      attachments,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) => m.id === aiId ? { ...m, content: m.content + chunk } : m)
        );
      },
      async (fullText) => {
        setLoading(false);

        // Auto-extract hearings from response
        const hMatch = fullText.match(/HEARING_DATA:\s*({[^}]+})/);
        if (hMatch) {
          try {
            const d = JSON.parse(hMatch[1]);
            await legalService.createHearing({ title: d.title, date: d.date, time: d.time, court: d.court, details: "AI extracted" });
            loadData();
          } catch { /* ignore */ }
        }

        // Auto-extract cases from response
        const cMatch = fullText.match(/CASE_METADATA:\s*({[^}]+})/);
        if (cMatch) {
          try {
            const d = JSON.parse(cMatch[1]);
            await legalService.createCase({ case_number: d.caseNumber, petitioner: d.petitioner, respondent: d.respondent, court_name: d.courtName });
            loadData();
          } catch { /* ignore */ }
        }
      }
    );
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments((prev) => [...prev, { name: file.name, type: file.type, data: ev.target!.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // ── Register case manually ─────────────────────────────────────────────────
  const handleAddCase = async (caseData: Partial<Case>, hearingDate: string, hearingTime: string, hearingTitle: string) => {
    const created = await legalService.createCase(caseData);
    if (created && hearingDate) {
      await legalService.createHearing({
        case_id: created.id,
        title: `${hearingTitle} — ${caseData.case_number}`,
        date: hearingDate, time: hearingTime,
        court: caseData.court_name ?? "N/A", details: "",
      });
    }
    setShowAddCase(false);
    loadData();
    setNotifications((prev) => [
      { id: `reg-${Date.now()}`, title: "CASE REGISTERED", message: `${caseData.case_number} added to vault. Reminders active.`, type: "info" },
      ...prev,
    ]);
  };

  // ── Sidebar nav items ──────────────────────────────────────────────────────
  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "chat",     icon: <MessageSquare size={20} />, label: "AI Assistant" },
    { id: "cases",    icon: <Briefcase size={20} />,     label: "Case Registry" },
    { id: "hearings", icon: <Calendar size={20} />,      label: "Hearing Schedule" },
  ];

  const urgentHearings = hearings.filter((h) => {
    const dt = new Date(`${h.date}T${h.time}`);
    return dt > new Date() && dt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Notifications ── */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              className={cn(
                "pointer-events-auto bg-white rounded-2xl shadow-xl border-l-4 p-4",
                n.type === "urgent" ? "border-rose-500" : "border-legal-primary"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", n.type === "urgent" ? "text-rose-500" : "text-legal-primary")}>
                  {n.title}
                </span>
                <button onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))} className="text-slate-300 hover:text-slate-500">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 272 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-legal-primary text-white overflow-hidden flex flex-col shrink-0"
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-legal-accent/20 rounded-xl flex items-center justify-center">
            <Scale className="text-legal-accent" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">S2 Legal Pro</h1>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">AI Agent System</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold",
                tab === item.id ? "bg-white/15 text-white shadow-inner" : "text-white/50 hover:bg-white/8 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === "hearings" && urgentHearings.length > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {urgentHearings.length}
                </span>
              )}
              {item.id === "chat" && notifications.length > 0 && (
                <span className="ml-auto bg-legal-accent text-legal-primary text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Role switcher */}
        <div className="p-4 border-t border-white/10">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Active Role</p>
          <div className="flex bg-black/20 rounded-xl p-1 gap-1">
            {(["client", "advocate"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 py-2 text-[11px] font-black rounded-lg capitalize transition-all",
                  role === r ? "bg-legal-accent text-legal-primary shadow" : "text-white/40 hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-white/20 font-medium mt-2 px-1 leading-relaxed">
            {role === "advocate" ? "Technical depth · BNS/BNSS precision" : "Plain English · Step-by-step guidance"}
          </p>
        </div>
      </motion.aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", role === "advocate" ? "bg-legal-muted" : "bg-emerald-400")} />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {role === "advocate" ? "Professional Mode" : "Plain English Mode"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-400" onClick={() => setTab("hearings")}>
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>
            )}
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── CHAT TAB ── */}
            {tab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">

                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-20">
                      <div className="w-20 h-20 bg-legal-primary/6 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <Gavel className="text-legal-primary" size={36} />
                      </div>
                      <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">How can I help?</h2>
                      <p className="text-slate-400 text-sm leading-relaxed mb-10">
                        {role === "client"
                          ? "Ask about your rights, legal procedures, or get document summaries in plain English."
                          : "Perform legal research, analyse clauses, map IPC → BNS, or draft court documents."}
                      </p>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {QUICK_ACTIONS.map((a) => (
                          <button
                            key={a.label}
                            onClick={() => { setInput(a.query); }}
                            className="p-4 text-sm bg-white border border-slate-200 rounded-2xl hover:border-legal-primary hover:shadow-md text-left font-semibold text-slate-600 hover:text-legal-primary transition-all group"
                          >
                            <ChevronRight size={14} className="mb-1 text-slate-300 group-hover:text-legal-primary transition-colors" />
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4 max-w-4xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1",
                        msg.role === "user"
                          ? "bg-legal-primary text-white shadow-md shadow-legal-primary/20"
                          : "bg-white border border-slate-200 text-legal-primary shadow-sm"
                      )}>
                        {msg.role === "user" ? <User size={16} /> : <Scale size={16} />}
                      </div>

                      <div className={cn("flex flex-col gap-1 max-w-[82%]", msg.role === "user" ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-5 py-3.5 rounded-2xl shadow-sm",
                          msg.role === "user"
                            ? "bg-legal-primary text-white rounded-tr-none text-sm leading-relaxed"
                            : "bg-white border border-slate-100 rounded-tl-none"
                        )}>
                          {msg.role === "user"
                            ? <p className="whitespace-pre-wrap">{msg.content}</p>
                            : (
                              msg.content === "" && loading
                                ? <div className="flex gap-1.5 py-1 px-1">
                                    {[0, 0.15, 0.3].map((d, i) => (
                                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d }}
                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                    ))}
                                  </div>
                                : <div className="markdown-body text-slate-700"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            )}
                        </div>
                        <span className="text-[9px] text-slate-300 uppercase tracking-widest font-bold px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-5 bg-white border-t border-slate-100">
                  <div className="max-w-4xl mx-auto">
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {attachments.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
                            <FileText size={13} />
                            <span className="truncate max-w-[120px]">{f.name}</span>
                            <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="hover:text-rose-500 transition-colors">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-legal-primary focus-within:shadow-md transition-all">
                      <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-300 hover:text-legal-primary transition-colors rounded-xl">
                        <Paperclip size={19} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFiles} className="hidden" multiple accept="image/*,.pdf" />

                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={role === "client" ? "Describe your legal situation..." : "Enter query, paste document, or ask for BNS mapping..."}
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 py-3 resize-none max-h-36 text-sm leading-relaxed placeholder-slate-300"
                      />

                      <button
                        onClick={handleSend}
                        disabled={loading || (!input.trim() && attachments.length === 0)}
                        className={cn(
                          "p-3 rounded-xl transition-all flex items-center justify-center w-12 h-12",
                          loading || (!input.trim() && attachments.length === 0)
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-legal-primary text-white shadow-lg shadow-legal-primary/25 hover:scale-105 active:scale-95"
                        )}
                      >
                        {loading ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
                      </button>
                    </div>
                    <p className="text-[9px] text-center text-slate-300 mt-2 uppercase tracking-widest font-bold">
                      S2 Legal AI · Educational Prototype · Indian Law Framework · Verify with an Advocate
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CASES TAB ── */}
            {tab === "cases" && (
              <motion.div key="cases" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-8 h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Case Registry</h2>
                    <p className="text-slate-400 text-sm mt-1">{cases.length} cases · AI auto-extracts from chat</p>
                  </div>
                  <button onClick={() => setShowAddCase(true)}
                    className="flex items-center gap-2 bg-legal-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-legal-primary/20 hover:scale-105 transition-all text-sm">
                    <Plus size={18} /> New Case
                  </button>
                </div>

                {cases.length === 0 ? (
                  <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                    <Briefcase className="mx-auto text-slate-200 mb-4" size={52} />
                    <p className="text-slate-400 font-semibold">No cases yet.</p>
                    <p className="text-slate-300 text-sm mt-1">Register manually or chat — AI will extract automatically.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cases.map((c) => (
                      <motion.div key={c.id} layout className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-500 text-[9px] font-black uppercase tracking-wider rounded-full">{c.status}</span>
                          <button onClick={async () => { await legalService.deleteCase(c.id); loadData(); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-slate-200 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">{c.case_number}</h3>
                        <p className="text-xs text-slate-400 font-semibold mb-4 uppercase tracking-wider">{c.court_name}</p>
                        <div className="space-y-2.5 pt-4 border-t border-slate-50">
                          {[{ label: "Petitioner", val: c.petitioner, icon: <User size={14} /> }, { label: "Respondent", val: c.respondent, icon: <ShieldAlert size={14} /> }].map((row) => (
                            <div key={row.label} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">{row.icon}</div>
                              <div>
                                <p className="text-[9px] text-slate-300 uppercase font-black tracking-widest">{row.label}</p>
                                <p className="text-sm font-semibold text-slate-700">{row.val}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── HEARINGS TAB ── */}
            {tab === "hearings" && (
              <motion.div key="hearings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-8 h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hearing Schedule</h2>
                    <p className="text-slate-400 text-sm mt-1">{hearings.length} hearings · 24h alerts active</p>
                  </div>
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </div>
                </div>

                {hearings.length === 0 ? (
                  <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                    <Calendar className="mx-auto text-slate-200 mb-4" size={52} />
                    <p className="text-slate-400 font-semibold">No hearings scheduled.</p>
                    <p className="text-slate-300 text-sm mt-1">Register a case with a hearing date, or mention hearing info in chat.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hearings.map((h) => {
                      const dt = new Date(`${h.date}T${h.time}`);
                      const isUrgent = dt > new Date() && dt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
                      return (
                        <motion.div key={h.id} layout
                          className={cn("bg-white border rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group",
                            isUrgent ? "border-rose-200 bg-rose-50/30" : "border-slate-100"
                          )}
                        >
                          <div className={cn("flex flex-col items-center justify-center rounded-2xl p-4 min-w-[80px] text-center", isUrgent ? "bg-rose-100" : "bg-slate-50")}>
                            <span className={cn("text-2xl font-black", isUrgent ? "text-rose-600" : "text-legal-primary")}>{dt.getDate()}</span>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", isUrgent ? "text-rose-400" : "text-slate-300")}>
                              {dt.toLocaleDateString("en-IN", { month: "short" })}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {isUrgent && <span className="px-2 py-0.5 bg-rose-100 text-rose-500 text-[9px] font-black uppercase rounded-full animate-pulse">24H Alert</span>}
                              <h3 className="text-lg font-black text-slate-900 truncate">{h.title}</h3>
                            </div>
                            <div className="flex gap-4 mt-1">
                              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><Clock size={13} />{h.time}</span>
                              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><MapPin size={13} />{h.court}</span>
                            </div>
                          </div>

                          <button onClick={async () => { await legalService.deleteHearing(h.id); loadData(); }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-slate-200 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Legal disclaimer floating button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="bg-white border border-slate-200 p-3 rounded-full shadow-xl cursor-help text-amber-400 hover:scale-110 transition-all">
          <AlertTriangle size={22} />
        </div>
        <div className="absolute bottom-full right-0 mb-3 w-72 bg-slate-900 text-white p-4 rounded-2xl text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 shadow-2xl">
          <div className="flex items-center gap-2 mb-2 text-amber-400 font-black uppercase tracking-wider text-[10px]">
            <ShieldAlert size={13} /> Legal Disclaimer
          </div>
          S2 Legal AI Pro is an educational prototype for Indian law research. AI output may be inaccurate. Always verify with a licensed Advocate. This tool does not create an attorney-client relationship.
        </div>
      </div>

      {/* Add Case Modal */}
      <AnimatePresence>
        {showAddCase && <AddCaseModal onClose={() => setShowAddCase(false)} onSave={handleAddCase} />}
      </AnimatePresence>

    </div>
  );
}
