import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Image,
  Info,
  Eye,
  EyeOff,
  Mail,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  PenLine,
  Palette,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { supabase } from "./lib/supabase";

const LOCAL_STORAGE_KEY = "lingualai-workspace-state";
const API_BASE = "/.netlify/functions";
const FILE_BUCKET = "lingualai-files";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const NAV_ITEMS = [
  { id: "chat", label: "New Chat", icon: MessageCircle },
  { id: "grammar", label: "Grammar", icon: PenLine },
  { id: "translate", label: "Translate", icon: Globe },
  { id: "history", label: "History", icon: BookOpen },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const REGIONS = {
  nigeria: "Nigerian English",
  ghana: "Ghanaian English",
  kenya: "Kenyan English",
  southafrica: "South African English",
  pan: "Pan-African English",
  international: "International English",
};

const LANGUAGES = {
  en: "English",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  tw: "Twi",
  ga: "Ga",
  sw: "Swahili",
  am: "Amharic",
  zu: "Zulu",
  so: "Somali",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic",
};

const SPEECH_LANGUAGE_CODES = {
  en: "en",
  yo: "yo",
  ig: "ig",
  ha: "ha",
  tw: "ak",
  ga: "gaa",
  sw: "sw",
  am: "am",
  zu: "zu",
  so: "so",
  fr: "fr",
  pt: "pt",
  ar: "ar",
};

const TONES = {
  professional: "Professional",
  formal: "Formal",
  casual: "Casual",
  friendly: "Friendly",
  academic: "Academic",
  confident: "Confident",
  persuasive: "Persuasive",
  natural: "Keep my voice",
};

const TRANSLATION_MODES = ["None", "Context-aware", "Formal", "Casual", "Business", "Academic"];

const INFO_SECTIONS = [
  {
    title: "About Lingual AI",
    body: [
      "Lingual AI was created with a simple belief: language should never be a barrier to opportunity.",
      "Across Africa, millions of people learn, work, create, and connect in different languages every day. Whether it is writing an assignment, preparing a job application, communicating at work, or learning a new language, finding the right words can make all the difference.",
      "Lingual AI helps you write better, translate faster, learn more effectively, and communicate with confidence. From grammar correction and rewriting to translation and language learning, our goal is to make powerful language tools accessible to everyone.",
      "We are proud to be building for Africa while creating solutions that can serve people anywhere in the world.",
      "One language. Endless possibilities.",
    ],
  },
  {
    title: "Data & Privacy",
    body: [
      "Your privacy matters to us.",
      "Lingual AI is designed to collect only the information needed to provide a better experience. We currently collect your account email, name, selected purpose, preferences, saved history, and uploaded content you choose to use in the app.",
      "We do not sell your personal information. We do not share your information with advertisers.",
      "You remain in control of your data and may update or delete your profile information at any time.",
    ],
  },
  {
    title: "Privacy Policy",
    body: [
      "Last updated: June 2026",
      "At Lingual AI, we believe privacy should be simple. We collect only the information necessary to provide and improve our services.",
      "When you create a profile, we may collect your name and your purpose for using Lingual AI, such as studying, work, language learning, content creation, or personal use.",
      "We use this information to personalize your experience, improve our products and features, and better understand how people use Lingual AI.",
      "We do not sell your personal information, collect unnecessary personal details, or share your information with advertisers.",
      "You are free to update or delete your profile information at any time. If we make significant changes to this policy, we will notify users through the app.",
    ],
  },
  {
    title: "Help & Support",
    body: [
      "Need help? We are here for you.",
      "Whether you have questions, feedback, feature suggestions, or you are experiencing an issue, our support team is ready to assist.",
      "Email: supportlingualai@gmail.com",
      "We aim to respond to all inquiries as quickly as possible.",
    ],
  },
  {
    title: "Contact Us",
    body: [
      "We would love to hear from you.",
      "For support, feedback, partnerships, or general inquiries:",
      "Email: supportlingualai@gmail.com",
      "Thank you for using Lingual AI.",
    ],
  },
];

const PURPOSES = [
  "Study & School",
  "Work & Career",
  "Learn a Language",
  "Improve My Writing",
  "Other / Personal Use",
];

const DEFAULT_PROFILE = {
  name: "",
  purpose: "",
  region: "nigeria",
  language: "en",
  tone: "professional",
  keepVoice: true,
};

function loadStoredState() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStoredState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function safeScore(value, fallback = 72) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${period}${name ? `, ${name}` : ""}.`;
}

function getPurposeLine(purpose) {
  const lines = {
    "Study & School": "Let us make your studies easier to understand and easier to express.",
    "Work & Career": "Let us help you write with confidence for work, business, and opportunity.",
    "Learn a Language": "Let us practice, understand, and use language with more confidence.",
    "Improve My Writing": "Let us strengthen your writing while keeping your own voice.",
    "Other / Personal Use": "What would you like to work on today?",
  };
  return lines[purpose] || "What would you like to work on today?";
}

function grammarEncouragement(analysis, previousChecks) {
  if (!analysis) return "";
  if (analysis.improvement >= 25) return "Strong improvement. The message is much clearer now.";
  if (previousChecks >= 2 && analysis.improvement > 0) return "You are getting cleaner with each check. This version reads better.";
  if (analysis.correctedScore >= 92 && analysis.improvement <= 8) return "This was already strong. I only tightened the wording.";
  return "";
}

function historyFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    title: row.title,
    originalText: row.original_text,
    result: row.result,
    messages: row.messages || [],
    attachments: row.attachments || [],
    analysis: row.analysis,
    targetLang: row.target_lang,
    day: row.day,
    date: row.created_at ? new Date(row.created_at).toLocaleString() : "",
  };
}

function historyToRow(entry, userId) {
  return {
    id: String(entry.id),
    user_id: userId,
    type: entry.type,
    label: entry.label || entry.type,
    title: entry.title || sessionTitle(entry),
    original_text: entry.originalText || "",
    result: entry.result || "",
    messages: entry.messages || [],
    attachments: entry.attachments || [],
    analysis: entry.analysis || null,
    target_lang: entry.targetLang || null,
    day: entry.day || todayKey(),
    updated_at: new Date().toISOString(),
  };
}

function friendlyServiceError(error, fallback = "Something went wrong. Please try again.") {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("file preview") || message.includes("backend") || message.includes("failed to fetch")) {
    return "AI tools are not available in this preview. Please test this feature on the live app.";
  }
  if (message.includes("timeout") || message.includes("aborted")) return "This took too long. Please try again.";
  if (message.includes("rate limit") || message.includes("too many")) return "Too many requests. Please wait a few minutes and try again.";
  if (message.includes("401") || message.includes("403")) return "This feature is not available right now. Please try again later.";
  if (message.includes("network")) return "Connection problem. Check your internet and try again.";
  return fallback;
}

function cleanTranslationOutput(value) {
  return String(value || "")
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^\s*(translation|translated text|answer)\s*:\s*/i, "")
    .replace(/^\s*[-*]\s*/gm, "")
    .replace(/^["“”']|["“”']$/g, "")
    .trim();
}

function safeFileName(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function inferMimeType(file) {
  const type = file?.type;
  if (type && type !== "application/octet-stream") return type;
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".md")) return "text/markdown";
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".json")) return "application/json";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return type || "text/plain";
}

function sanitizeAttachment(item) {
  if (!item) return item;
  const { dataUrl, url, textContext, ...safe } = item;
  return safe;
}

async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageLimit = Math.min(pdf.numPages, 40);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(`Page ${pageNumber}\n${pageText}`);
  }

  const text = pages.join("\n\n").trim();
  return {
    text,
    pageCount: pdf.numPages,
    truncated: pdf.numPages > pageLimit,
  };
}

function LogoMark({ className = "w-12 h-12" }) {
  return (
    <img src="./lingual-ai-logo-exact-transparent.png" alt="Lingual AI logo mark" className={`${className} object-contain`} />
  );
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function CopyButton({ text, muted }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button onClick={copy} className={`inline-flex items-center gap-1.5 text-sm ${muted} hover:text-current transition-colors`}>
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ChatBubble({ message, theme, darkMode, onOpenAttachment }) {
  const isUser = message.role === "user";
  return (
    <div className={`group ${isUser ? "ml-auto" : ""} max-w-[88%]`}>
      <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${isUser ? "bg-violet-500 text-white" : `${darkMode ? "bg-white/8" : "bg-slate-100"}`}`}>
        {message.content}
        {message.attachments?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments.map((item) => (
              <button
                key={item.id || item.storagePath || item.name}
                type="button"
                onClick={() => onOpenAttachment?.(item)}
                className={`inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
                  isUser ? "border-white/25 bg-white/10 text-white" : darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                }`}
              >
                {item.type === "image" ? <Image className="w-3.5 h-3.5 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`mt-1 flex ${isUser ? "justify-end" : "justify-start"} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}>
        <CopyButton text={message.content} muted={isUser ? "text-violet-100" : theme.muted} />
      </div>
    </div>
  );
}

function sessionTitle(item) {
  if (!item) return "Untitled";
  if (item.title) return item.title;
  if (item.label && item.originalText) return `${item.label}: ${item.originalText.slice(0, 42)}`;
  return item.label || item.originalText?.slice(0, 48) || "Untitled";
}

export default function LingualAIApp() {
  const saved = useMemo(loadStoredState, []);
  const [view, setView] = useState("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [darkMode, setDarkMode] = useState(saved.darkMode ?? true);
  const [autoSave, setAutoSave] = useState(saved.autoSave ?? true);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [profileSyncStatus, setProfileSyncStatus] = useState("");
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE, ...(saved.profile || {}) });
  const [welcomeName, setWelcomeName] = useState(saved.profile?.name || "");
  const [welcomePurpose, setWelcomePurpose] = useState(saved.profile?.purpose || "");
  const [welcomeStep, setWelcomeStep] = useState(saved.profile?.name ? "purpose" : "name");
  const [history, setHistory] = useState(saved.history || []);
  const [grammarHistory, setGrammarHistory] = useState(saved.grammarHistory || []);
  const [chatMessages, setChatMessages] = useState([]);
  const [grammarInput, setGrammarInput] = useState(saved.grammarInput || "");
  const [grammarResult, setGrammarResult] = useState("");
  const [grammarAnalysis, setGrammarAnalysis] = useState(null);
  const [showGrammarDetails, setShowGrammarDetails] = useState(false);
  const [translateInput, setTranslateInput] = useState(saved.translateInput || "");
  const [translateResult, setTranslateResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [region, setRegion] = useState(saved.region || profile.region);
  const [tone, setTone] = useState(saved.tone || profile.tone);
  const [targetLang, setTargetLang] = useState(saved.targetLang || profile.language);
  const [translationMode, setTranslationMode] = useState(saved.translationMode || "None");
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("all");
  const [chatInput, setChatInput] = useState("");
  const [fileContext, setFileContext] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [fileStatus, setFileStatus] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatSessionIdRef = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthReady(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    async function loadCloudData() {
      const [{ data: cloudProfile }, { data: cloudHistory }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("history_items").select("*").eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(80),
      ]);
      if (cancelled) return;
      if (cloudProfile) {
        const nextProfile = {
          name: cloudProfile.name || "",
          purpose: cloudProfile.purpose || "",
          region: cloudProfile.region || "nigeria",
          language: cloudProfile.language || "en",
          tone: cloudProfile.tone || "professional",
          keepVoice: cloudProfile.keep_voice ?? true,
        };
        setProfile(nextProfile);
        setWelcomeName(nextProfile.name);
        setWelcomePurpose(nextProfile.purpose);
      }
      if (cloudHistory) setHistory(cloudHistory.map(historyFromRow));
    }
    loadCloudData();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id || !profile.name || !profile.purpose) return;
    const timeoutId = setTimeout(() => {
      supabase.from("profiles").upsert({
        id: session.user.id,
        name: profile.name,
        purpose: profile.purpose,
        region: profile.region,
        language: profile.language,
        tone: profile.tone,
        keep_voice: profile.keepVoice,
        updated_at: new Date().toISOString(),
      });
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [profile, session?.user?.id]);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!autoSave) return;
    saveStoredState({
      view,
      darkMode,
      autoSave,
      profile,
      history,
      grammarHistory,
      grammarInput,
      translateInput,
      region,
      tone,
      targetLang,
      translationMode,
    });
  }, [autoSave, darkMode, grammarHistory, grammarInput, history, profile, region, targetLang, tone, translateInput, translationMode, view]);

  const theme = darkMode
    ? {
        bg: "bg-[#0d0d14] text-slate-100",
        shell: "bg-[#101018]",
        card: "bg-white/5 border-white/10",
        input: "bg-white/5 text-slate-100 placeholder-slate-500 border-white/10",
        muted: "text-slate-400",
        hover: "hover:bg-white/8",
        optionBg: "#171720",
        optionText: "#f1f5f9",
      }
    : {
        bg: "bg-slate-50 text-slate-900",
        shell: "bg-white",
        card: "bg-white border-slate-200",
        input: "bg-white text-slate-900 placeholder-slate-400 border-slate-200",
        muted: "text-slate-500",
        hover: "hover:bg-slate-100",
        optionBg: "#ffffff",
        optionText: "#0f172a",
      };

  const hasCompletedWelcome = Boolean(profile.name && profile.purpose);
  const personalization = `${profile.name ? `The user's name is ${profile.name}. ` : ""}Reason for using LingualAI: ${profile.purpose || "not specified"}. Preferred tone: ${TONES[profile.tone]}. Preferred language: ${LANGUAGES[profile.language]}. ${profile.keepVoice ? "Preserve the user's natural/local voice when possible." : "Use clean standard writing."}`;
  const greetingLine = getGreeting(profile.name);
  const purposeLine = getPurposeLine(profile.purpose);

  const callAPI = useCallback(async (messages, system, maxTokens = 1800) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(`${API_BASE}/groq-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "groq/compound",
          max_tokens: maxTokens,
          messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`service ${response.status}`);
      const data = await response.json();
      return data?.content || data?.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Request timed out. Please try again.");
      if (window.location.protocol === "file:") {
        throw new Error("file preview");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const callVision = async ({ prompt, image }) => {
    const response = await fetch(`${API_BASE}/groq-vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image }),
    });
    if (!response.ok) throw new Error(`vision ${response.status}`);
    const data = await response.json();
    return data.content || "";
  };

  const transcribeAudio = async ({ audio, mimeType, language }) => {
    const response = await fetch(`${API_BASE}/groq-audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio, mimeType, language }),
    });
    if (!response.ok) throw new Error(`voice ${response.status}`);
    const data = await response.json();
    return data.text || "";
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const uploadUserFile = async (file, metadata = {}) => {
    if (!session?.user?.id) throw new Error("Sign in to save files.");
    const storagePath = `${session.user.id}/${Date.now()}-${safeFileName(file.name)}`;
    const mimeType = inferMimeType(file);
    const { error: uploadError } = await supabase.storage
      .from(FILE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeType,
      });
    if (uploadError) throw uploadError;

    const attachment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: mimeType.startsWith("image/") ? "image" : "file",
      name: file.name,
      mimeType,
      size: file.size,
      storagePath,
      preview: metadata.preview || "",
      pageCount: metadata.pageCount || null,
      truncated: metadata.truncated || false,
    };

    supabase.from("user_files").insert({
      user_id: session.user.id,
      file_name: file.name,
      file_type: attachment.mimeType,
      storage_path: storagePath,
      metadata: {
        size: file.size,
        preview: attachment.preview,
        pageCount: attachment.pageCount,
        truncated: attachment.truncated,
      },
    }).then(({ error: fileError }) => {
      if (fileError) console.error("File metadata save failed", fileError);
    });

    return attachment;
  };

  const openStoredAttachment = async (item) => {
    if (!item?.storagePath) return;
    const { data, error: signedUrlError } = await supabase.storage
      .from(FILE_BUCKET)
      .createSignedUrl(item.storagePath, 60);
    if (signedUrlError || !data?.signedUrl) {
      showToast("Could not open that file.", "error");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const authIndicator = (message, type = "info") => {
    setAuthStatus({ message, type });
    if (type === "error") setError(message);
  };

  const friendlyAuthMessage = (message = "") => {
    const text = message.toLowerCase();
    if (text.includes("invalid login") || text.includes("invalid credentials")) return "Incorrect email or password.";
    if (text.includes("already registered") || text.includes("already exists") || text.includes("user already")) return "An account already exists with this email. Sign in instead.";
    if (text.includes("signup is disabled")) return "Account creation is temporarily unavailable.";
    if (text.includes("email not confirmed")) return "Please confirm your email before signing in.";
    if (text.includes("email provider is disabled") || text.includes("email logins are disabled")) return "Email login is temporarily unavailable.";
    if (text.includes("rate limit") || text.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
    if (text.includes("failed to fetch") || text.includes("network")) return "Connection problem. Check your internet and try again.";
    if (text.includes("password")) return message;
    return message || "Something went wrong. Please try again.";
  };

  const handleAuth = async () => {
    if (!authEmail.trim()) {
      authIndicator("Email is required.", "error");
      return;
    }
    if (!isValidEmail(authEmail)) {
      authIndicator("Enter a valid email address.", "error");
      return;
    }
    if (!authPassword) {
      authIndicator("Password is required.", "error");
      return;
    }
    if (authPassword.length < 6) {
      authIndicator("Password must be at least 6 characters.", "error");
      return;
    }
    setLoading(true);
    setError("");
    setAuthStatus(null);
    try {
      const credentials = { email: authEmail.trim(), password: authPassword };
      const { error: authError } = authMode === "signup"
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);
      if (authError) throw authError;
      setAuthStatus(null);
    } catch (err) {
      const message = friendlyAuthMessage(err.message);
      authIndicator(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(DEFAULT_PROFILE);
    setHistory([]);
    setGrammarHistory([]);
    setChatMessages([]);
    setWelcomeName("");
    setWelcomePurpose("");
    setWelcomeStep("name");
    setView("chat");
    showToast("Signed out");
  };

  const addHistory = (entry) => {
    const nextEntry = { id: entry.id || Date.now(), date: new Date().toLocaleString(), day: todayKey(), ...entry };
    setHistory((items) => [nextEntry, ...items.filter((item) => item.id !== nextEntry.id)].slice(0, 80));
    if (session?.user?.id) {
      supabase
        .from("history_items")
        .upsert(historyToRow(nextEntry, session.user.id))
        .then(({ error: historyError }) => {
          if (historyError) {
            console.error("History save failed", historyError);
            showToast("Saved here, but account history did not update.", "error");
          }
        });
    }
    return nextEntry;
  };

  const runGrammar = async () => {
    if (!grammarInput.trim()) return;
    setLoading(true);
    setError("");
    setGrammarResult("");
    setGrammarAnalysis(null);
    setShowGrammarDetails(false);
    try {
      const raw = await callAPI(
        [{ role: "user", content: `Correct this text. Preserve meaning and the user's voice.\n\nText: ${grammarInput}` }],
        `You are LingualAI, an African grammar coach. Return ONLY JSON with this shape: {"corrected_text":"","original_grammar_score":0,"corrected_grammar_score":0,"improvement_percentage":0,"mistakes":[]}. Do not add praise or extra notes.\n${personalization}`,
        1800,
      );
      const parsed = extractJson(raw);
      const result = parsed?.corrected_text || parsed?.improved_text || raw;
      const nextAnalysis = {
        originalScore: safeScore(parsed?.original_grammar_score, 68),
        correctedScore: safeScore(parsed?.corrected_grammar_score, 91),
        improvement: safeScore(parsed?.improvement_percentage, 23),
        encouragement: "",
        issues: Array.isArray(parsed?.mistakes) ? parsed.mistakes : [],
      };
      nextAnalysis.encouragement = grammarEncouragement(nextAnalysis, grammarHistory.length);
      setGrammarResult(result);
      setGrammarAnalysis(nextAnalysis);
      setGrammarHistory((items) => [
        { id: Date.now(), day: todayKey(), originalScore: nextAnalysis.originalScore, correctedScore: nextAnalysis.correctedScore, improvement: nextAnalysis.improvement },
        ...items,
      ]);
      addHistory({
        type: "grammar",
        label: "Grammar",
        title: `Grammar: ${grammarInput.slice(0, 44)}`,
        originalText: grammarInput,
        result,
        analysis: nextAnalysis,
        messages: [
          { role: "user", content: grammarInput },
          { role: "assistant", content: result },
        ],
      });
      showToast("Grammar ready", "success");
    } catch (err) {
      setError(friendlyServiceError(err, "Grammar check failed. Please try again."));
      showToast("Grammar check failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const runTranslate = async () => {
    if (!translateInput.trim()) return;
    setLoading(true);
    setError("");
    setTranslateResult("");
    try {
      const language = LANGUAGES[targetLang];
      const raw = await callAPI(
        [{ role: "user", content: `Target language: ${language}\nMode: ${translationMode}\n\nText to translate:\n${translateInput}` }],
        `You are Lingual AI's production translation engine.
Detect the source language automatically and translate the meaning into ${language}.
Return ONLY the final translated text.
Do not add headings, labels, bullets, notes, explanations, word breakdowns, alternatives, pronunciation, or encouragement.
If the user writes an instruction like "translate X to Yoruba", translate only X, not the instruction.
Preserve names, numbers, emojis, line breaks, and formatting.
For African languages, use natural everyday phrasing a fluent speaker would accept. Avoid stiff literal translations.
${translationMode === "None" ? "Use a natural everyday translation." : `Use this tone/mode: ${translationMode}.`}
${personalization}`,
        1200,
      );
      const result = cleanTranslationOutput(raw);
      setTranslateResult(result);
      addHistory({
        type: "translate",
        label: "Translate",
        title: `Translate to ${language}: ${translateInput.slice(0, 34)}`,
        originalText: translateInput,
        result,
        targetLang,
        messages: [
          { role: "user", content: translateInput },
          { role: "assistant", content: result },
        ],
      });
      showToast("Translation ready", "success");
    } catch (err) {
      setError(friendlyServiceError(err, "Translation failed. Please try again."));
      showToast("Translation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const message = chatInput.trim();
    if (fileStatus) {
      showToast(fileStatus);
      return;
    }
    if (!message && attachments.length === 0) return;
    const attachmentSummary = attachments.map((item) => item.name).join(", ");
    const imageAttachment = attachments.find((item) => item.type === "image" && item.dataUrl);
    const unreadableFiles = attachments.filter((item) => item.extractionError);
    if (!message && unreadableFiles.length > 0 && !fileContext.trim() && !imageAttachment) {
      setError("This file is attached, but I cannot read its text yet. It may need OCR.");
      return;
    }
    const savedAttachments = attachments.map(sanitizeAttachment);
    const userContent = message || (attachmentSummary ? `Read the attached file${attachments.length > 1 ? "s" : ""}.` : "");
    const userMessage = {
      role: "user",
      content: `${userContent}${attachmentSummary ? `\n\nAttached: ${attachmentSummary}` : ""}`,
      date: new Date().toLocaleTimeString(),
      attachments: savedAttachments,
    };
    const baseMessages = [...chatMessages, userMessage];
    setChatMessages(baseMessages);
    setChatInput("");
    setLoading(true);
    setError("");
    try {
      const attachmentContext = attachments.map((item) => item.textContext).filter(Boolean).join("\n\n---\n\n");
      const context = attachmentContext ? `\nUploaded file context:\n${attachmentContext.slice(0, 16000)}` : "";
      const chatTask = message || (context ? "Read the attached file and give a clear, useful summary. Mention the key points only." : "Help with the attached file.");
      const raw = imageAttachment
        ? await callVision({
            prompt: `${message || "Read this image and tell me what text or useful information you can extract."}${context}`,
            image: imageAttachment.dataUrl,
          })
        : await callAPI(
            [{ role: "user", content: `${chatTask}${context}` }],
            `You are LingualAI, a friendly African writing, school, career, and communication assistant. The user can ask for grammar correction, rewriting, summaries, essays, emails, captions, CV help, explanations, or general support. Answer directly and cleanly. If the user asks for a direct translation in chat, return only the translated text with no heading, no notes, no alternatives, no word breakdown, and no explanation. If they ask for a rewrite, only show the rewritten text unless they ask for explanation. ${personalization}`,
            2400,
          );
      const assistantMessage = { role: "assistant", content: raw, date: new Date().toLocaleTimeString() };
      const nextMessages = [...baseMessages, assistantMessage];
      setChatMessages(nextMessages);
      addHistory({
        id: chatSessionIdRef.current,
        type: "chat",
        label: "Chat",
        title: nextMessages.find((item) => item.role === "user")?.content?.slice(0, 54) || `Chat with ${attachmentSummary}`,
        originalText: userContent || attachmentSummary,
        result: raw,
        messages: nextMessages,
        attachments: savedAttachments,
      });
      setAttachments([]);
      setFileContext("");
    } catch (err) {
      const message = friendlyServiceError(err, "Chat failed. Please try again.");
      setError(message);
      setChatMessages([
        ...baseMessages,
        {
          role: "assistant",
          content: message,
          date: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextFile = async (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (file.size > 10 * 1024 * 1024) {
      showToast("File is too large. Please upload a file under 10 MB.", "error");
      return;
    }
    setFileStatus(`Reading ${file.name}...`);
    try {
      if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
        const extracted = await extractPdfText(file);
        let attachment;
        if (!extracted.text) {
          try {
            attachment = await uploadUserFile(file, {
            preview: "PDF attached - text not readable",
              pageCount: extracted.pageCount,
              truncated: extracted.truncated,
            });
          } catch (uploadError) {
            console.error("PDF upload failed", uploadError);
            attachment = {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              type: "file",
              name: file.name,
              mimeType: file.type || "application/pdf",
              size: file.size,
              preview: "PDF attached - text not readable",
              localOnly: true,
            };
          }
          setAttachments((items) => [...items, { ...attachment, extractionError: "This PDF may be scanned and needs OCR." }]);
          showToast("PDF attached, but its text is not readable yet. It may need OCR.", "error");
          return;
        }
        const text = extracted.text.slice(0, 30000);
        const fileBlock = `File: ${file.name}\nType: PDF\nPages: ${extracted.pageCount}${extracted.truncated ? " (first 40 pages read)" : ""}\n\n${text}`;
        try {
          attachment = await uploadUserFile(file, {
            preview: `${extracted.pageCount} page PDF${extracted.truncated ? " - first 40 pages read" : ""}`,
            pageCount: extracted.pageCount,
            truncated: extracted.truncated,
          });
        } catch (uploadError) {
          console.error("PDF upload failed", uploadError);
          attachment = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "file",
            name: file.name,
            mimeType: file.type || "application/pdf",
            size: file.size,
            preview: `${extracted.pageCount} page PDF`,
            localOnly: true,
          };
          showToast("PDF attached here, but cloud file storage is not ready.", "error");
        }
        setFileContext((current) => `${current ? `${current}\n\n---\n\n` : ""}${fileBlock}`);
        setAttachments((items) => [...items, { ...attachment, textContext: fileBlock }]);
        if (!attachment.localOnly) showToast("PDF attached", "success");
        return;
      }

      const text = await file.text();
      const fileBlock = `File: ${file.name}\nType: Text\n\n${text.slice(0, 30000)}`;
      let attachment;
      try {
        attachment = await uploadUserFile(file, { preview: text.slice(0, 500) });
      } catch (uploadError) {
        console.error("File upload failed", uploadError);
        attachment = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "file",
          name: file.name,
          mimeType: file.type || "text/plain",
          size: file.size,
          preview: text.slice(0, 500),
          localOnly: true,
        };
        showToast("File attached here, but cloud file storage is not ready.", "error");
      }
      setFileContext((current) => `${current ? `${current}\n\n---\n\n` : ""}${fileBlock}`);
      setAttachments((items) => [...items, { ...attachment, textContext: fileBlock }]);
      if (!attachment.localOnly) showToast("File attached", "success");
    } catch (err) {
      console.error("File read failed", err);
      showToast("Could not read that file", "error");
    } finally {
      setFileStatus("");
    }
  };

  const handleImage = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Image is too large. Please upload a file under 10 MB.", "error");
      return;
    }
    setFileStatus(`Preparing ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      let attachment;
      try {
        attachment = await uploadUserFile(file, { preview: "Image file" });
      } catch (uploadError) {
        console.error("Image upload failed", uploadError);
        attachment = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "image",
          name: file.name,
          mimeType: file.type || "image/*",
          size: file.size,
          preview: "Image file",
          localOnly: true,
        };
        showToast("Image attached here, but cloud file storage is not ready.", "error");
      }
      setAttachments((items) => [...items, { ...attachment, dataUrl, url: URL.createObjectURL(file) }]);
      if (!attachment.localOnly) showToast("Image attached", "success");
      setFileStatus("");
    };
    reader.onerror = () => {
      setFileStatus("");
      showToast("Could not read that image", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleAttachment = async (file) => {
    if (!file) return;
    if (inferMimeType(file).startsWith("image/")) {
      handleImage(file);
      return;
    }
    await handleTextFile(file);
  };

  const appendTranscript = (transcript) => {
    if (!transcript) return;
    if (view === "translate") setTranslateInput((text) => `${text}${text ? " " : ""}${transcript}`);
    else setChatInput((text) => `${text}${text ? " " : ""}${transcript}`);
  };

  const startBrowserVoiceFallback = () => {
    if (!speechSupported) {
      showToast("Voice input needs microphone support in this browser.", "error");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = targetLang === "en" ? "en-US" : `${targetLang}-${targetLang.toUpperCase()}`;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || []).map((result) => result?.[0]?.transcript || "").join(" ").trim();
      appendTranscript(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const startVoice = async () => {
    if (listening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    if (window.location.protocol === "file:") {
      startBrowserVoiceFallback();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      startBrowserVoiceFallback();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined });
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            setLoading(true);
            const transcript = await transcribeAudio({
              audio: String(reader.result || ""),
              mimeType: blob.type || "audio/webm",
              language: SPEECH_LANGUAGE_CODES[view === "translate" ? targetLang : profile.language] || "en",
            });
            appendTranscript(transcript);
            showToast("Voice captured", "success");
          } catch (err) {
            setError(friendlyServiceError(err, "Voice transcription failed."));
            showToast("Voice transcription failed", "error");
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setListening(true);
      showToast("Listening. Tap Voice again when you are done.");
    } catch (err) {
      startBrowserVoiceFallback();
    }
  };

  const clearWorkspace = () => {
    setGrammarInput("");
    setGrammarResult("");
    setGrammarAnalysis(null);
    setTranslateInput("");
    setTranslateResult("");
    setError("");
    setChatInput("");
    setFileContext("");
    setAttachments([]);
    setFileStatus("");
  };

  const startFreshChat = () => {
    setChatMessages([]);
    setChatInput("");
    setFileContext("");
    setAttachments([]);
    setFileStatus("");
    setActiveSession(null);
    chatSessionIdRef.current = Date.now();
    setView("chat");
    setDrawerOpen(false);
    showToast("New chat started");
  };

  const stats = useMemo(() => {
    const grammarCount = grammarHistory.length;
    const avgBefore = grammarCount ? Math.round(grammarHistory.reduce((sum, item) => sum + safeScore(item.originalScore), 0) / grammarCount) : 0;
    const avgAfter = grammarCount ? Math.round(grammarHistory.reduce((sum, item) => sum + safeScore(item.correctedScore), 0) / grammarCount) : 0;
    const days = new Set(history.map((item) => item.day)).size;
    const translations = history.filter((item) => item.type === "translate").length;
    return {
      grammarCount,
      avgBefore,
      avgAfter,
      improvement: Math.max(0, avgAfter - avgBefore),
      streak: history.some((item) => item.day === todayKey()) ? Math.max(1, days) : 0,
      translations,
      sessions: history.length,
      vocabulary: Math.min(100, 40 + translations * 4 + grammarCount * 3),
    };
  }, [grammarHistory, history]);

  const filteredHistory = history.filter((item) => {
    const matchesType = historyType === "all" || item.type === historyType;
    const messageText = (item.messages || []).map((message) => message.content).join(" ");
    const attachmentText = (item.attachments || []).map((attachment) => attachment.name).join(" ");
    const text = `${item.label} ${item.title} ${item.originalText} ${item.result} ${messageText} ${attachmentText}`.toLowerCase();
    return matchesType && text.includes(historySearch.toLowerCase());
  });

  const selectView = (id) => {
    setActiveSession(null);
    if (id === "chat") {
      startFreshChat();
      return;
    }
    setView(id);
    setDrawerOpen(false);
    if (id !== "settings") setSettingsPanel(null);
  };

  const openSession = (item) => {
    setActiveSession(item);
    setDrawerOpen(false);
    setView("session");
  };

  const continueWelcome = () => {
    if (!welcomeName.trim()) {
      showToast("Add your name first.", "error");
      return;
    }
    setWelcomeStep("purpose");
  };

  const saveProfileToCloud = async (nextProfile) => {
    if (!session?.user?.id) {
      setProfileSyncStatus("Please sign in before saving your profile.");
      return false;
    }
    setProfileSyncStatus("Saving profile...");
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: session.user.id,
      name: nextProfile.name,
      purpose: nextProfile.purpose,
      region: nextProfile.region,
      language: nextProfile.language,
      tone: nextProfile.tone,
      keep_voice: nextProfile.keepVoice,
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      console.error("Profile save failed", profileError);
      setProfileSyncStatus("Could not save changes. Please try again.");
      setError("Could not save profile. Please try again.");
      showToast("Could not save profile.", "error");
      return false;
    }
    setProfileSyncStatus(`Profile saved at ${new Date().toLocaleTimeString()}.`);
    return true;
  };

  const saveCurrentProfile = async () => {
    if (!profile.name.trim() || !profile.purpose) {
      showToast("Add your name and purpose first.", "error");
      return;
    }
    setLoading(true);
    setError("");
    const nextProfile = { ...profile, name: profile.name.trim() };
    setProfile(nextProfile);
    const savedProfile = await saveProfileToCloud(nextProfile);
    setLoading(false);
    if (savedProfile) showToast("Profile saved.", "success");
  };

  const completeWelcome = async () => {
    if (!welcomePurpose) {
      showToast("Choose what brings you here.", "error");
      return;
    }
    const nextProfile = {
      ...profile,
      name: welcomeName.trim(),
      purpose: welcomePurpose,
    };
    setLoading(true);
    setError("");
    setProfile(nextProfile);
    const savedProfile = await saveProfileToCloud(nextProfile);
    setLoading(false);
    if (!savedProfile) return;
    setView("chat");
    showToast(`Welcome, ${welcomeName.trim()}. Profile saved.`, "success");
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    setWelcomeName("");
    setWelcomePurpose("");
    setWelcomeStep("name");
    setView("chat");
    showToast("Profile reset. You can start again.");
  };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? "h-full" : "hidden lg:flex"} ${theme.shell} border-r ${darkMode ? "border-white/10" : "border-slate-200"} w-72 flex-col`}>
      <div className="p-5 border-b border-white/10">
        <div>
          <p className="font-black text-2xl tracking-tight">Lingual AI</p>
          <p className={`text-xs ${theme.muted}`}>Workspace</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selectView(id)}
            className={classNames(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              view === id ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25" : `${theme.muted} ${theme.hover} hover:text-current`,
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      <button onClick={() => selectView("profile")} className={`m-3 p-3 rounded-xl ${theme.card} border text-left`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
            {(profile.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{profile.name || "Personalize"}</p>
            <p className={`text-xs ${theme.muted}`}>{profile.purpose || "Tell Lingual AI about you"}</p>
          </div>
        </div>
      </button>
    </aside>
  );

  const Topbar = () => (
    <header className={`lg:hidden sticky top-0 z-40 ${theme.shell} border-b ${darkMode ? "border-white/10" : "border-slate-200"} px-4 py-3 flex items-center justify-between`}>
      <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg bg-white/5">
        <Menu className="w-5 h-5" />
      </button>
      <span className="inline-flex items-center gap-2 font-black tracking-tight">
        <LogoMark className="w-6 h-6" />
        Lingual AI
      </span>
      <button onClick={() => selectView("profile")} className="p-2 rounded-lg bg-white/5">
        <UserRound className="w-5 h-5" />
      </button>
    </header>
  );

  const PageHeader = ({ eyebrow, title, subtitle }) => (
    <div className="mb-5">
      <p className="text-xs font-black text-violet-400 uppercase tracking-widest mb-2">{eyebrow}</p>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1 break-words">{title}</h1>
      {subtitle && <p className={`text-sm ${theme.muted}`}>{subtitle}</p>}
    </div>
  );

  const BackButton = () => (
    <button
      onClick={() => setSettingsPanel(null)}
      className={`mb-4 w-10 h-10 rounded-xl border grid place-items-center ${theme.input} ${theme.hover}`}
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );

  const ToolTextarea = ({ value, onChange, buttonLabel, onRun, extraControls }) => (
    <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
      {extraControls}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your text here..."
        className={`w-full p-4 resize-none h-48 sm:h-56 focus:outline-none text-sm leading-relaxed ${darkMode ? "bg-transparent text-slate-100 placeholder-slate-500" : "bg-transparent text-slate-900 placeholder-slate-400"}`}
      />
      <div className={`border-t ${darkMode ? "border-white/10 bg-white/3" : "border-slate-100 bg-slate-50"} px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between`}>
        <p className={`text-xs ${theme.muted}`}>{value.trim().split(/\s+/).filter(Boolean).length} words - {value.length} chars</p>
        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <button onClick={clearWorkspace} className={`px-4 py-2 rounded-xl text-sm ${theme.muted} ${theme.hover}`}>Reset</button>
          <button onClick={onRun} disabled={loading || !value.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-violet-500/25">
            {loading ? "Working..." : <><Zap className="w-4 h-4" /> {buttonLabel}</>}
          </button>
        </div>
      </div>
    </div>
  );

  const PlainResult = ({ title = "Result", text, sourceText }) => (
    <>
      {error && <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
      {text && (
        <div className={`${theme.card} border border-violet-500/30 rounded-2xl overflow-hidden mt-4`}>
          <div className="p-4">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">{title}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
          <div className={`border-t ${darkMode ? "border-white/10 bg-white/3" : "border-slate-100 bg-slate-50"} px-4 py-3 flex gap-3 flex-wrap justify-end`}>
            <CopyButton text={text} muted={theme.muted} />
            <button
              onClick={() => {
                const blob = new Blob([`ORIGINAL:\n${sourceText || ""}\n\n---\n\nRESULT:\n${text}`], { type: "text/plain" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `lingual-${Date.now()}.txt`;
                link.click();
              }}
              className={`inline-flex items-center gap-1.5 text-sm ${theme.muted} hover:text-current`}
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      )}
    </>
  );
  const renderChat = () => (
    <section className="max-w-5xl mx-auto min-h-[calc(100vh-84px)] lg:min-h-0 flex flex-col">
      <div className="pt-8 sm:pt-10 pb-6 sm:pb-6 text-center flex-1 lg:flex-none flex flex-col justify-center min-h-[36vh] lg:min-h-0">
        <LogoMark className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2 sm:mb-3">{greetingLine}</h1>
        <p className={`text-base sm:text-lg ${theme.muted}`}>{purposeLine}</p>
      </div>

      <div className={`${theme.card} border border-violet-500/30 rounded-[1.35rem] p-4 sm:p-5 shadow-2xl shadow-violet-500/10 sticky bottom-3 lg:static`}>
        {chatMessages.length > 0 && (
          <div className="max-h-72 overflow-auto space-y-3 mb-4 pr-1">
            {chatMessages.slice(-6).map((message, index) => (
              <ChatBubble key={index} message={message} theme={theme} darkMode={darkMode} onOpenAttachment={openStoredAttachment} />
            ))}
          </div>
        )}
        <textarea
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Ask anything... fix grammar, rewrite, summarize, explain, draft emails..."
          className={`w-full h-28 sm:h-44 resize-none bg-transparent focus:outline-none text-base leading-relaxed ${darkMode ? "placeholder-slate-500" : "placeholder-slate-400"}`}
        />
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <div key={item.id} className={`px-3 py-2 rounded-xl border text-xs ${item.extractionError ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" : theme.input}`}>
                {item.type === "image" ? <Image className="w-3.5 h-3.5 inline mr-1" /> : <FileText className="w-3.5 h-3.5 inline mr-1" />}
                <span>{item.name}</span>
                {item.preview && <span className={`ml-1 ${theme.muted}`}>- {item.preview}</span>}
                <button onClick={() => setAttachments((list) => list.filter((next) => next.id !== item.id))} className="ml-2 text-red-300">x</button>
              </div>
            ))}
          </div>
        )}
        {fileStatus && (
          <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${theme.input}`}>
            {fileStatus}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <label className={`px-3 py-2 rounded-xl border ${theme.card} text-sm cursor-pointer inline-flex items-center justify-center gap-2`}>
              <FileText className="w-4 h-4" /> Attach
              <input
                type="file"
                className="hidden"
                multiple
                accept=".txt,.md,.csv,.json,.pdf,application/pdf,image/png,image/jpeg,image/webp,image/*"
                onChange={async (event) => {
                  for (const file of Array.from(event.target.files || [])) {
                    await handleAttachment(file);
                  }
                  event.target.value = "";
                }}
              />
            </label>
            <label className={`px-3 py-2 rounded-xl border ${theme.card} text-sm cursor-pointer inline-flex items-center justify-center gap-2`}>
              <Image className="w-4 h-4" /> Image
              <input type="file" className="hidden" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} />
            </label>
            <button type="button" onClick={startVoice} className={`px-3 py-2 rounded-xl border ${listening ? "bg-red-500/10 border-red-500/30 text-red-300" : theme.card} text-sm inline-flex items-center justify-center gap-2`}>
              <Mic className="w-4 h-4" /> {listening ? "Stop" : "Voice"}
            </button>
          </div>
          <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
            <span className={`text-xs ${theme.muted}`}>{chatInput.length}/5000</span>
            <button onClick={sendChat} disabled={loading || Boolean(fileStatus) || (!chatInput.trim() && attachments.length === 0)} className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shadow-lg shadow-violet-500/25 disabled:opacity-40">
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </section>
  );

  const renderGrammar = () => (
    <section>
      <PageHeader eyebrow="Grammar Checker" title="Correct grammar and understand your mistakes" />
      <ToolTextarea value={grammarInput} onChange={setGrammarInput} buttonLabel="Check Grammar" onRun={runGrammar} />
      {grammarAnalysis && (
        <div className="grid gap-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Before", `${grammarAnalysis.originalScore}%`, "text-red-400"],
              ["Boost", `+${grammarAnalysis.improvement}%`, "text-yellow-400"],
              ["After", `${grammarAnalysis.correctedScore}%`, "text-emerald-400"],
            ].map(([label, value, color]) => (
              <div key={label} className={`${theme.card} border rounded-xl p-4 text-center`}>
                <p className={`text-xs ${theme.muted}`}>{label}</p>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          {grammarAnalysis.encouragement && (
            <div className={`${theme.card} border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-300`}>
              {grammarAnalysis.encouragement}
            </div>
          )}
        </div>
      )}
      <PlainResult title="Corrected text" text={grammarResult} sourceText={grammarInput} />
      {grammarAnalysis?.issues?.length > 0 && grammarResult && (
        <div className="mt-3">
          <button onClick={() => setShowGrammarDetails((value) => !value)} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${theme.input}`}>
            {showGrammarDetails ? "Hide mistakes" : "Show mistakes"}
          </button>
          {showGrammarDetails && (
            <div className={`${theme.card} border rounded-xl p-4 mt-3 space-y-2`}>
              {grammarAnalysis.issues.map((item, index) => <p key={index} className={`text-sm ${theme.muted}`}>{item}</p>)}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderTranslate = () => (
    <section>
      <PageHeader eyebrow="Translator" title="Translate text" />
      <ToolTextarea value={translateInput} onChange={setTranslateInput} buttonLabel="Translate" onRun={runTranslate} extraControls={
        <div className="grid sm:grid-cols-3 gap-3 p-4 border-b border-white/10">
          <ControlSelect label="Translate to" value={targetLang} onChange={setTargetLang} options={LANGUAGES} theme={theme} />
          <ControlSelect label="Mode" value={translationMode} onChange={setTranslationMode} options={TRANSLATION_MODES} theme={theme} />
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">Voice</p>
            <button type="button" onClick={startVoice} className={`w-full rounded-lg border px-3 py-2 text-xs ${listening ? "bg-red-500/10 border-red-500/30 text-red-300" : theme.input}`}>
              <Mic className="w-4 h-4 inline mr-1" /> {listening ? "Stop" : "Voice"}
            </button>
          </div>
        </div>
      } />
      <PlainResult title={`${LANGUAGES[targetLang]} translation`} text={translateResult} sourceText={translateInput} />
    </section>
  );

  const renderHistory = () => (
    <section>
      <PageHeader eyebrow="History" title="Saved work and uploaded context" />
      <div className={`${theme.card} border rounded-2xl p-4 mb-4 grid sm:grid-cols-[1fr_180px] gap-3`}>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-3 ${theme.muted}`} />
          <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search history..." className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm ${theme.input}`} />
        </div>
        <select value={historyType} onChange={(event) => setHistoryType(event.target.value)} className={`rounded-xl border px-3 py-2 text-sm ${theme.input}`}>
          {["all", "chat", "grammar", "translate"].map((type) => (
            <option key={type} value={type} style={{ backgroundColor: theme.optionBg, color: theme.optionText }}>{type}</option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className={`${theme.card} border rounded-2xl p-10 text-center ${theme.muted}`}>No saved history yet.</div>
        ) : filteredHistory.map((item) => (
          <button key={item.id} onClick={() => openSession(item)} className={`w-full text-left ${theme.card} border rounded-xl p-4 ${theme.hover}`}>
            <div className="flex justify-between gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">{item.type}</span>
              <span className={`text-xs ${theme.muted}`}>{item.date}</span>
            </div>
            <p className="text-sm font-black truncate">{sessionTitle(item)}</p>
            <p className={`text-sm ${theme.muted} line-clamp-2 mt-1`}>{item.originalText}</p>
          </button>
        ))}
      </div>
    </section>
  );

  const renderProgress = () => (
    <section>
      <PageHeader eyebrow="Progress" title="Learning statistics" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Grammar score", `${stats.avgAfter || 0}%`, "Average corrected score"],
          ["Writing boost", `+${stats.improvement}%`, "Average improvement"],
          ["Vocabulary score", `${stats.vocabulary}%`, "Based on grammar and translation work"],
          ["Daily streak", `${stats.streak} day${stats.streak === 1 ? "" : "s"}`, "Days with saved activity"],
          ["Sessions", stats.sessions, "All saved activities"],
          ["Translations", stats.translations, "Saved translations"],
          ["Chats", history.filter((item) => item.type === "chat").length, "Saved chat sessions"],
          ["Completed lessons", stats.grammarCount, "Grammar checks completed"],
        ].map(([label, value, desc]) => (
          <div key={label} className={`${theme.card} border rounded-2xl p-4`}>
            <p className={`text-xs ${theme.muted} mb-1`}>{label}</p>
            <p className="text-3xl font-black text-violet-400">{value}</p>
            <p className={`text-xs ${theme.muted} mt-2`}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const settingsRows = [
    { id: "appearance", label: "Appearance", description: darkMode ? "Dark mode" : "Light mode", icon: Palette },
    { id: "data", label: "Data & Privacy", description: "Saved data and controls", icon: Shield },
    { id: "privacy", label: "Privacy Policy", description: "Policy details", icon: BookOpen },
    { id: "about", label: "About Lingual AI", description: "Our story", icon: Info },
    { id: "support", label: "Help & Support", description: "Get help", icon: HelpCircle },
    { id: "contact", label: "Contact Us", description: "Email support", icon: Mail },
  ];

  const infoByTitle = Object.fromEntries(INFO_SECTIONS.map((section) => [section.title, section]));

  const renderProfile = () => (
    <section>
      <PageHeader eyebrow="Profile" title={`${profile.name || "Your"} profile`} />
      <div className={`${theme.card} border border-violet-500/20 rounded-2xl p-5 mb-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 grid place-items-center">
            <LogoMark className="w-16 h-16" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black">{profile.name ? `Hey ${profile.name}, Lingual AI is set up for you.` : "Tell Lingual AI what to call you."}</h2>
            <p className={`text-sm ${theme.muted} mt-1`}>{profile.purpose ? `You are mainly here for ${profile.purpose.toLowerCase()}.` : "Add your purpose so the assistant can feel more useful and personal."}</p>
          </div>
        </div>
      </div>
      <div className={`${theme.card} border rounded-2xl p-4 grid gap-4`}>
        <div className={`rounded-xl border px-4 py-3 text-sm ${theme.input}`}>
          <p className="font-semibold">Account</p>
          <p className={`${theme.muted} break-all`}>{session?.user?.email || "Not signed in"}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} theme={theme} placeholder="What should Lingual AI call you?" />
          <ControlSelect label="Purpose" value={profile.purpose} onChange={(value) => setProfile({ ...profile, purpose: value })} options={PURPOSES} theme={theme} />
          <ControlSelect label="Preferred language" value={profile.language} onChange={(value) => setProfile({ ...profile, language: value })} options={LANGUAGES} theme={theme} />
          <ControlSelect label="Tone" value={profile.tone} onChange={(value) => setProfile({ ...profile, tone: value })} options={TONES} theme={theme} />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={profile.keepVoice} onChange={(event) => setProfile({ ...profile, keepVoice: event.target.checked })} />
          Keep my local voice when improving my writing
        </label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button onClick={saveCurrentProfile} disabled={loading} className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black disabled:opacity-50">
            {loading ? "Saving..." : "Save profile"}
          </button>
          {profileSyncStatus && <p className={`text-sm ${profileSyncStatus.includes("failed") || profileSyncStatus.includes("No signed") ? "text-red-400" : "text-emerald-400"}`}>{profileSyncStatus}</p>}
        </div>
      </div>
    </section>
  );

  const renderAppearance = () => (
    <section>
      <BackButton />
      <PageHeader eyebrow="Appearance" title="Appearance" />
      <div className={`${theme.card} border rounded-2xl p-4 flex items-center justify-between gap-4`}>
        <div>
          <h2 className="font-black">Theme</h2>
          <p className={`text-sm ${theme.muted}`}>{darkMode ? "Dark mode is active." : "Light mode is active."}</p>
        </div>
        <button onClick={() => setDarkMode((value) => !value)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </section>
  );

  const renderInfoDetail = (section) => (
    <section>
      <BackButton />
      <PageHeader eyebrow="Settings" title={section.title} />
      <article className={`${theme.card} border rounded-2xl p-5`}>
        <div className="space-y-3">
          {section.body.map((paragraph) => (
            <p key={paragraph} className={`text-sm leading-relaxed ${theme.muted}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );

  const renderDataPrivacy = () => (
    <section>
      <BackButton />
      <PageHeader eyebrow="Data & Privacy" title="Data & Privacy" />
      <div className="grid gap-4">
        <article className={`${theme.card} border rounded-2xl p-5`}>
          <h2 className="text-lg font-black mb-3">What is saved here</h2>
          <p className={`text-sm leading-relaxed ${theme.muted}`}>Lingual AI saves your profile and history to your account so you can return to your work from another device.</p>
        </article>
        <article className={`${theme.card} border rounded-2xl p-5`}>
          <h2 className="text-lg font-black mb-3">Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAutoSave((value) => !value)} className={`px-4 py-2 rounded-xl border text-sm ${theme.input}`}>Auto-save: {autoSave ? "On" : "Off"}</button>
            <button onClick={resetProfile} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${theme.input}`}>
              <RotateCcw className="w-4 h-4" /> Reset Profile
            </button>
            <button onClick={() => { setHistory([]); setGrammarHistory([]); setChatMessages([]); showToast("Local history cleared"); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
              <Trash2 className="w-4 h-4" /> Clear this device
            </button>
            <button onClick={signOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
              <X className="w-4 h-4" /> Sign out
            </button>
          </div>
        </article>
      </div>
    </section>
  );

  const renderSettings = () => {
    if (settingsPanel === "appearance") return renderAppearance();
    if (settingsPanel === "data") return renderDataPrivacy();
    if (settingsPanel === "privacy") return renderInfoDetail(infoByTitle["Privacy Policy"]);
    if (settingsPanel === "about") return renderInfoDetail(infoByTitle["About Lingual AI"]);
    if (settingsPanel === "support") return renderInfoDetail(infoByTitle["Help & Support"]);
    if (settingsPanel === "contact") return renderInfoDetail(infoByTitle["Contact Us"]);

    return (
      <section>
        <PageHeader eyebrow="Settings" title="Settings" />
        <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
          {settingsRows.map(({ id, label, description, icon: Icon }) => (
            <button key={id} onClick={() => setSettingsPanel(id)} className={`w-full flex items-center gap-4 px-4 py-4 text-left border-b last:border-b-0 ${theme.hover} ${darkMode ? "border-white/10" : "border-slate-100"}`}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 grid place-items-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black">{label}</p>
                <p className={`text-sm ${theme.muted}`}>{description}</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${theme.muted}`} />
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderSession = () => {
    if (!activeSession) return renderHistory();
    return (
      <section className="max-w-4xl mx-auto">
        <button onClick={() => setView("history")} className={`mb-4 w-10 h-10 rounded-xl border grid place-items-center ${theme.input} ${theme.hover}`} aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader eyebrow={activeSession.type || "Session"} title={sessionTitle(activeSession)} />
        <div className="space-y-3">
          {(activeSession.messages || [
            { role: "user", content: activeSession.originalText },
            { role: "assistant", content: activeSession.result },
          ]).map((message, index) => (
            <ChatBubble key={index} message={message} theme={theme} darkMode={darkMode} onOpenAttachment={openStoredAttachment} />
          ))}
        </div>
        {activeSession.result && (
          <div className="mt-4 flex justify-end">
            <CopyButton text={activeSession.result} muted={theme.muted} />
          </div>
        )}
      </section>
    );
  };

  const renderAuth = () => (
    <div className={`min-h-screen ${theme.bg} font-sans grid place-items-center p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <LogoMark className="w-11 h-11" />
            <span className="text-2xl font-black tracking-tight">Lingual AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            {authMode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className={`text-sm ${theme.muted}`}>Your chats, translations, grammar checks, and progress stay with your account.</p>
        </div>

        <div className={`${theme.card} border rounded-3xl p-5 sm:p-7 shadow-2xl shadow-violet-500/10`}>
          <div className="grid gap-4">
            <Field label="Email" value={authEmail} onChange={setAuthEmail} theme={theme} placeholder="you@example.com" />
            {authEmail && !isValidEmail(authEmail) && (
              <p className="text-xs text-red-400 -mt-2">Enter a valid email address.</p>
            )}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Password</p>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  onKeyUp={(event) => setCapsLockOn(event.getModifierState?.("CapsLock") || false)}
                  onKeyDown={(event) => setCapsLockOn(event.getModifierState?.("CapsLock") || false)}
                  placeholder="At least 6 characters"
                  className={`w-full rounded-xl border px-3 py-3 pr-12 text-sm ${theme.input}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.muted} hover:text-current`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsLockOn && <p className="text-xs text-yellow-400 mt-2">Caps Lock is on.</p>}
            </div>
          </div>
          {authStatus && (
            <div
              className={classNames(
                "mt-5 rounded-2xl border px-4 py-3 text-sm",
                authStatus.type === "error" && "border-red-500/30 bg-red-500/10 text-red-300",
                authStatus.type === "info" && `${theme.input}`,
              )}
            >
              {authStatus.message}
            </div>
          )}
          <button onClick={handleAuth} disabled={loading} className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black shadow-lg shadow-violet-500/25 disabled:opacity-50">
            {loading ? (authMode === "signup" ? "Creating account..." : "Signing in...") : authMode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button
            onClick={() => {
              setAuthMode((mode) => mode === "signup" ? "signin" : "signup");
              setAuthStatus(null);
              setError("");
            }}
            className={`w-full mt-4 text-sm font-semibold ${theme.muted} hover:text-current`}
          >
            {authMode === "signup" ? "I already have an account" : "Create a new account"}
          </button>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 border rounded-xl px-4 py-3 text-sm shadow-lg bg-red-500/20 border-red-500/30 text-red-300">
          {toast.message}
        </div>
      )}
    </div>
  );

  const renderView = () => {
    if (view === "session") return renderSession();
    if (view === "profile") return renderProfile();
    if (view === "grammar") return renderGrammar();
    if (view === "translate") return renderTranslate();
    if (view === "history") return renderHistory();
    if (view === "progress") return renderProgress();
    if (view === "settings") return renderSettings();
    return renderChat();
  };

  if (!authReady) {
    return (
      <div className={`min-h-screen ${theme.bg} font-sans grid place-items-center p-4`}>
        <div className="text-center">
          <LogoMark className="w-14 h-14 mx-auto mb-4" />
          <p className={`text-sm ${theme.muted}`}>Loading Lingual AI...</p>
        </div>
      </div>
    );
  }

  if (!session) return renderAuth();

  if (!hasCompletedWelcome) {
    return (
      <div className={`min-h-screen ${theme.bg} font-sans grid place-items-center p-4`}>
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <LogoMark className="w-11 h-11" />
              <span className="text-2xl font-black tracking-tight">Lingual AI</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
              {welcomeStep === "name" ? "What should I call you?" : `Nice to meet you, ${welcomeName.trim() || "there"}.`}
            </h1>
            <p className={`text-base ${theme.muted}`}>
              {welcomeStep === "name" ? "Start with your name. You can personalize everything else later." : "What brings you here today?"}
            </p>
          </div>

          <div className={`${theme.card} border rounded-3xl p-5 sm:p-7 shadow-2xl shadow-violet-500/10`}>
            {welcomeStep === "name" ? (
              <>
                <Field label="Your name" value={welcomeName} onChange={setWelcomeName} theme={theme} placeholder="Enter your name" />
                <button onClick={continueWelcome} className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black shadow-lg shadow-violet-500/25">
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PURPOSES.map((purpose) => (
                    <button
                      key={purpose}
                      onClick={() => setWelcomePurpose(purpose)}
                      className={classNames(
                        "text-left px-4 py-4 rounded-2xl border transition-all font-semibold",
                        welcomePurpose === purpose ? "bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/25" : `${theme.card} ${theme.hover} ${theme.muted}`,
                      )}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setWelcomeStep("name")} className={`sm:w-40 py-3 rounded-2xl border font-bold ${theme.input}`}>
                    Back
                  </button>
                  <button onClick={completeWelcome} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black shadow-lg shadow-violet-500/25">
                    Start with Lingual AI
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 border rounded-xl px-4 py-3 text-sm shadow-lg bg-red-500/20 border-red-500/30 text-red-300">
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} font-sans`}>
      <Topbar />
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="hidden lg:flex h-[73px] items-center justify-between px-6 border-b border-white/10">
            <div />
            <button onClick={() => selectView("profile")} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${theme.card} border text-sm`}>
              <UserRound className="w-4 h-4" /> {profile.name || "Create Profile"}
            </button>
          </div>
          <div className="px-3 py-4 sm:p-6 max-w-7xl mx-auto">{renderView()}</div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-label="Close navigation drawer" />
          <div className="relative h-full w-72 max-w-[84vw]">
            <button onClick={() => setDrawerOpen(false)} className="absolute right-3 top-3 z-10 p-2 rounded-lg bg-white/10">
              <X className="w-4 h-4" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 border rounded-xl px-4 py-3 text-sm shadow-lg ${toast.type === "error" ? "bg-red-500/20 border-red-500/30 text-red-300" : "bg-violet-500/20 border-violet-500/30 text-violet-200"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function ControlSelect({ label, value, onChange, options, theme }) {
  const entries = Array.isArray(options) ? options.map((item) => [item, item]) : Object.entries(options);
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-lg px-3 py-2 text-xs sm:text-sm border ${theme.input} focus:outline-none focus:ring-2 focus:ring-violet-500/40`}>
        {entries.map(([key, text]) => (
          <option key={key} value={key} style={{ backgroundColor: theme.optionBg, color: theme.optionText }}>{text}</option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, theme, placeholder }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`w-full rounded-lg px-3 py-2 text-sm border ${theme.input} focus:outline-none focus:ring-2 focus:ring-violet-500/40`} />
    </label>
  );
}

