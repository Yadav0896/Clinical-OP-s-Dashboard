"use client";

import { useState, useCallback, type CSSProperties } from "react";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-dm" });
const jetMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-mono" });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TEAL = "#0D9488";
const TEAL_LIGHT = "#CCFBF1";
const TEAL_DARK = "#0F766E";
const SLATE = "#1E293B";
const SLATE_50 = "#F8FAFC";
const SLATE_100 = "#F1F5F9";
const SLATE_200 = "#E2E8F0";
const SLATE_400 = "#94A3B8";
const SLATE_500 = "#64748B";
const SLATE_700 = "#334155";
const RED = "#DC2626";
const RED_BG = "#FEE2E2";
const GREEN = "#059669";
const GREEN_BG = "#D1FAE5";
const AMBER = "#D97706";
const AMBER_BG = "#FEF3C7";
const BLUE = "#2563EB";

const DRUGS = [
  { id: "xolair", name: "Xolair", generic: "omalizumab" },
  { id: "dupixent", name: "Dupixent", generic: "dupilumab" },
  { id: "nucala", name: "Nucala", generic: "mepolizumab" },
  { id: "fasenra", name: "Fasenra", generic: "benralizumab" },
  { id: "tezspire", name: "Tezspire", generic: "tezepelumab" },
  { id: "cinqair", name: "Cinqair", generic: "reslizumab" },
  { id: "exdensur", name: "Exdensur", generic: "depemokimab" },
];

const DRUG_INDICATIONS: Record<string, { id: string; name: string }[]> = {
  xolair: [
    { id: "allergic-asthma", name: "Allergic Asthma" },
    { id: "csu", name: "Chronic Spontaneous Urticaria (CSU)" },
    { id: "crswnp", name: "CRSwNP (Nasal Polyps)" },
    { id: "food-allergy", name: "IgE-Mediated Food Allergy" },
  ],
  dupixent: [
    { id: "eosinophilic-asthma", name: "Eosinophilic Asthma" },
    { id: "atopic-dermatitis", name: "Atopic Dermatitis" },
    { id: "crswnp", name: "CRSwNP (Nasal Polyps)" },
  ],
  nucala: [{ id: "eosinophilic-asthma", name: "Eosinophilic Asthma" }],
  fasenra: [{ id: "eosinophilic-asthma", name: "Eosinophilic Asthma" }],
  tezspire: [
    { id: "severe-asthma", name: "Severe Asthma (All Phenotypes)" },
    { id: "crswnp-tezspire", name: "CRSwNP (Tezspire)" },
  ],
  cinqair: [{ id: "eosinophilic-asthma-cinqair", name: "Eosinophilic Asthma (Cinqair)" }],
  exdensur: [{ id: "eosinophilic-asthma-exdensur", name: "Eosinophilic Asthma (Exdensur)" }],
};

const PAYERS = [
  { id: "uhc", name: "UnitedHealthcare (UHC)" },
  { id: "bcbs", name: "Blue Cross Blue Shield (BCBS)" },
  { id: "cigna", name: "Cigna" },
  { id: "aetna", name: "Aetna" },
  { id: "medicare", name: "Medicare" },
  { id: "co-medicaid", name: "Colorado Medicaid" },
];

const TABS = [
  { id: "icd10", label: "ICD-10 Validator", icon: "🔍" },
  { id: "docs", label: "Doc Recommender", icon: "📋" },
  { id: "gaps", label: "Gap Checker", icon: "⚡" },
  { id: "appeal", label: "Appeal Generator", icon: "✉️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ff = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', monospace";

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: `1px solid ${SLATE_200}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: 10,
  border: `1px solid ${SLATE_200}`,
  fontSize: 13,
  outline: "none",
  color: SLATE,
  fontFamily: ff,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const inputFocus: CSSProperties = {
  borderColor: TEAL,
  boxShadow: `0 0 0 3px ${TEAL_LIGHT}`,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 36,
};

const btnPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 22px",
  borderRadius: 10,
  background: TEAL,
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: ff,
  transition: "background 0.15s, transform 0.1s",
};

const btnPrimaryDisabled: CSSProperties = {
  ...btnPrimary,
  opacity: 0.5,
  cursor: "not-allowed",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: SLATE_500,
  marginBottom: 6,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MicroBadge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 6,
        background: bg,
        color: color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={TEAL}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>Analyzing...</span>
    </div>
  );
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: TEAL_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: SLATE, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 13, color: SLATE_400, margin: 0 }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

// Common selector group
function SelectorGroup({
  drug,
  indication,
  payer,
  indications,
  onDrugChange,
  onIndicationChange,
  onPayerChange,
}: {
  drug: string;
  indication: string;
  payer: string;
  indications: { id: string; name: string }[];
  onDrugChange: (v: string) => void;
  onIndicationChange: (v: string) => void;
  onPayerChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
      <div>
        <label style={labelStyle}>Drug</label>
        <select style={selectStyle} value={drug} onChange={(e) => { onDrugChange(e.target.value); onIndicationChange(""); }}>
          <option value="">Select drug...</option>
          {DRUGS.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.generic})</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Indication</label>
        <select
          style={{ ...selectStyle, opacity: drug ? 1 : 0.5 }}
          value={indication}
          onChange={(e) => onIndicationChange(e.target.value)}
          disabled={!drug}
        >
          <option value="">{drug ? "Select indication..." : "Select drug first"}</option>
          {indications.map((ind) => (
            <option key={ind.id} value={ind.id}>{ind.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Payer</label>
        <select style={selectStyle} value={payer} onChange={(e) => onPayerChange(e.target.value)}>
          <option value="">Select payer...</option>
          {PAYERS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("icd10");

  // ── Shared selector state ──
  const [drug, setDrug] = useState("");
  const [indication, setIndication] = useState("");
  const [payer, setPayer] = useState("");
  const indications = drug ? (DRUG_INDICATIONS[drug] ?? []) : [];

  const resetSelectors = useCallback(() => {
    setDrug("");
    setIndication("");
    setPayer("");
  }, []);

  // ── ICD-10 state ──
  const [icd10Code, setIcd10Code] = useState("");
  const [icd10Loading, setIcd10Loading] = useState(false);
  const [icd10Result, setIcd10Result] = useState<Record<string, unknown> | null>(null);
  const [icd10Error, setIcd10Error] = useState("");

  // ── Docs state ──
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsResult, setDocsResult] = useState<Record<string, unknown> | null>(null);
  const [docsError, setDocsError] = useState("");

  // ── Gap state ──
  const [gapLoading, setGapLoading] = useState(false);
  const [gapResult, setGapResult] = useState<Record<string, unknown> | null>(null);
  const [gapError, setGapError] = useState("");
  const [patientData, setPatientData] = useState({
    icd10Code: "",
    ige: "",
    eosinophils: "",
    feno: "",
    fev1: "",
    act: "",
    stepTherapyMonths: "",
    weight: "",
    easi: "",
    historicalEos: "",
    onOCS: false,
    hasSpecialist: false,
    onAntiIL5: false,
  });

  // ── Appeal state ──
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealResult, setAppealResult] = useState<Record<string, unknown> | null>(null);
  const [appealError, setAppealError] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const [appealPatient, setAppealPatient] = useState({
    patientName: "",
    mrn: "",
    dob: "",
    prescriber: "",
    ige: "",
    eosinophils: "",
    fev1: "",
    act: "",
    weight: "",
    stepTherapyMonths: "",
  });

  // ── Handlers ──
  const handleValidateICD10 = async () => {
    setIcd10Loading(true);
    setIcd10Result(null);
    setIcd10Error("");
    try {
      const res = await fetch("/api/validate-icd10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugId: drug, indicationId: indication, payerId: payer, code: icd10Code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");
      setIcd10Result(data);
    } catch (err) {
      setIcd10Error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIcd10Loading(false);
    }
  };

  const handleRecommendDocs = async () => {
    setDocsLoading(true);
    setDocsResult(null);
    setDocsError("");
    try {
      const res = await fetch("/api/recommend-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugId: drug, indicationId: indication, payerId: payer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get recommendations");
      setDocsResult(data);
    } catch (err) {
      setDocsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleCheckGaps = async () => {
    setGapLoading(true);
    setGapResult(null);
    setGapError("");
    try {
      const payload: Record<string, unknown> = { ...patientData };
      // Convert numeric strings
      ["ige", "eosinophils", "feno", "fev1", "act", "stepTherapyMonths", "weight", "easi", "historicalEos"].forEach((k) => {
        const v = (patientData as Record<string, unknown>)[k];
        if (typeof v === "string" && v !== "") payload[k] = Number(v);
        else if (v === "") delete payload[k];
      });
      const res = await fetch("/api/check-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugId: drug, indicationId: indication, payerId: payer, patientData: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gap check failed");
      setGapResult(data);
    } catch (err) {
      setGapError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGapLoading(false);
    }
  };

  const handleGenerateAppeal = async () => {
    setAppealLoading(true);
    setAppealResult(null);
    setAppealError("");
    try {
      const payload: Record<string, unknown> = {
        drugId: drug,
        indicationId: indication,
        payerId: payer,
        denialReason,
        patientData: { ...appealPatient },
      };
      // Convert numeric strings
      ["ige", "eosinophils", "fev1", "act", "weight", "stepTherapyMonths"].forEach((k) => {
        const v = (appealPatient as Record<string, unknown>)[k];
        if (typeof v === "string" && v !== "") (payload.patientData as Record<string, unknown>)[k] = Number(v);
        else if (v === "") delete (payload.patientData as Record<string, unknown>)[k];
      });
      const res = await fetch("/api/generate-appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Appeal generation failed");
      setAppealResult(data);
    } catch (err) {
      setAppealError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAppealLoading(false);
    }
  };

  const isSelectorsReady = drug && indication && payer;

  return (
    <div
      className={`${dmSans.variable} ${jetMono.variable}`}
      style={{ minHeight: "100vh", background: SLATE_50, fontFamily: ff }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        input:focus, select:focus, textarea:focus { border-color: ${TEAL} !important; box-shadow: 0 0 0 3px ${TEAL_LIGHT} !important; }
      `}</style>

      {/* ━━━ TOP BAR ━━━ */}
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${SLATE_200}`,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ textDecoration: "none", color: SLATE_500, fontSize: 18, fontWeight: 500 }}>←</a>
          <div style={{ width: 1, height: 24, background: SLATE_200 }} />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: SLATE }}>Maya AI Features</div>
            <div style={{ fontSize: 10, color: SLATE_400, fontWeight: 600 }}>
              PA INTELLIGENCE ENGINE{" "}
              <span style={{ color: TEAL, fontWeight: 700 }}>• 4 TOOLS</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MicroBadge text="BETA" color={TEAL} bg={TEAL_LIGHT} />
          <MicroBadge text="LIVE" color={GREEN} bg={GREEN_BG} />
        </div>
      </header>

      {/* ━━━ TAB NAVIGATION ━━━ */}
      <nav
        style={{
          background: "#fff",
          borderBottom: `1px solid ${SLATE_200}`,
          padding: "0 24px",
          display: "flex",
          gap: 4,
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: active ? `2.5px solid ${TEAL}` : "2.5px solid transparent",
                background: "transparent",
                color: active ? TEAL : SLATE_500,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: ff,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* ━━━ MAIN CONTENT ━━━ */}
      <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* ═══════════════════════════════════════════════════════════
            TAB 1: ICD-10 VALIDATOR
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === "icd10" && (
          <div className="fade-in">
            <SectionHeader
              icon="🔍"
              title="ICD-10 Code Validator"
              description="Validate diagnosis codes against payer-specific approved lists before PA submission."
            />

            <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
              <SelectorGroup
                drug={drug}
                indication={indication}
                payer={payer}
                indications={indications}
                onDrugChange={setDrug}
                onIndicationChange={setIndication}
                onPayerChange={setPayer}
              />

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1, maxWidth: 300 }}>
                  <label style={labelStyle}>ICD-10 Code</label>
                  <input
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                    placeholder="e.g. J45.50"
                    value={icd10Code}
                    onChange={(e) => setIcd10Code(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && isSelectorsReady && icd10Code && handleValidateICD10()}
                  />
                </div>
                <button
                  style={isSelectorsReady && icd10Code ? btnPrimary : btnPrimaryDisabled}
                  disabled={!isSelectorsReady || !icd10Code || icd10Loading}
                  onClick={handleValidateICD10}
                >
                  {icd10Loading ? <Spinner /> : <>Validate Code</>}
                </button>
              </div>
            </div>

            {icd10Error && (
              <div className="fade-in" style={{ ...cardStyle, padding: 16, borderColor: RED, borderLeft: `4px solid ${RED}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 4 }}>Error</div>
                <div style={{ fontSize: 12, color: SLATE_500 }}>{icd10Error}</div>
              </div>
            )}

            {icd10Result && (
              <div className="fade-in" style={{ ...cardStyle, padding: 24 }}>
                <ResultBanner valid={!!icd10Result.valid} title={!!icd10Result.valid ? "Code Validated" : "Code Rejected"} />
                <div style={{ marginTop: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SLATE }}>{String(icd10Result.message)}</div>
                </div>
                {!!icd10Result.validCodes && Array.isArray(icd10Result.validCodes) && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, marginBottom: 8, letterSpacing: "0.04em" }}>
                      APPROVED CODES FOR THIS COMBINATION
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(icd10Result.validCodes as { code: string; desc: string }[]).map((c) => (
                        <span
                          key={c.code}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            background: SLATE_50,
                            border: `1px solid ${SLATE_200}`,
                            fontSize: 12,
                            fontFamily: mono,
                            color: SLATE,
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ color: TEAL }}>{c.code}</span>{" "}
                          <span style={{ color: SLATE_400, fontWeight: 400 }}>- {c.desc}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!!icd10Result.rejectedCodes && Array.isArray(icd10Result.rejectedCodes) && (icd10Result.rejectedCodes as []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: RED, marginBottom: 8, letterSpacing: "0.04em" }}>
                      REJECTED CODES
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(icd10Result.rejectedCodes as { code: string; desc: string; reason: string }[]).map((c) => (
                        <div key={c.code} style={{ padding: "8px 14px", borderRadius: 8, background: RED_BG, fontSize: 12 }}>
                          <span style={{ fontFamily: mono, fontWeight: 700, color: RED }}>{c.code}</span>{" "}
                          <span style={{ color: SLATE_500 }}>- {c.desc}</span>
                          <div style={{ fontSize: 11, color: SLATE_500, marginTop: 2 }}>{c.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: DOCUMENT RECOMMENDER
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === "docs" && (
          <div className="fade-in">
            <SectionHeader
              icon="📋"
              title="Document Recommender"
              description="Get payer-specific document requirements with clinical rationale for each item."
            />

            <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
              <SelectorGroup
                drug={drug}
                indication={indication}
                payer={payer}
                indications={indications}
                onDrugChange={setDrug}
                onIndicationChange={setIndication}
                onPayerChange={setPayer}
              />

              <button
                style={isSelectorsReady ? btnPrimary : btnPrimaryDisabled}
                disabled={!isSelectorsReady || docsLoading}
                onClick={handleRecommendDocs}
              >
                {docsLoading ? <Spinner /> : <>Get Recommendations</>}
              </button>
            </div>

            {docsError && (
              <div className="fade-in" style={{ ...cardStyle, padding: 16, borderColor: RED, borderLeft: `4px solid ${RED}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 4 }}>Error</div>
                <div style={{ fontSize: 12, color: SLATE_500 }}>{docsError}</div>
              </div>
            )}

            {docsResult && (
              <div className="fade-in">
                {/* Summary bar */}
                <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>Document Checklist</div>
                  <MicroBadge text={`${Number(docsResult.totalDocs)} total`} color={SLATE_500} bg={SLATE_100} />
                  <MicroBadge text={`${Number(docsResult.requiredCount)} required`} color={RED} bg={RED_BG} />
                  <MicroBadge text={`${Number(docsResult.totalDocs) - Number(docsResult.requiredCount)} optional`} color={GREEN} bg={GREEN_BG} />
                </div>

                {/* Required */}
                {Array.isArray(docsResult.required) && docsResult.required.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: RED, marginBottom: 10, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: RED }} />
                      REQUIRED DOCUMENTS ({docsResult.required.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(docsResult.required as { name: string; rationale: string }[]).map((d, i) => (
                        <div key={i} style={{ ...cardStyle, padding: "14px 18px", borderLeft: `3px solid ${RED}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: SLATE }}>{d.name}</span>
                            <MicroBadge text="REQUIRED" color={RED} bg={RED_BG} />
                          </div>
                          <div style={{ fontSize: 12, color: SLATE_500 }}>{d.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional */}
                {Array.isArray(docsResult.optional) && docsResult.optional.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 10, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: GREEN }} />
                      OPTIONAL / RECOMMENDED ({docsResult.optional.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(docsResult.optional as { name: string; rationale: string }[]).map((d, i) => (
                        <div key={i} style={{ ...cardStyle, padding: "14px 18px", borderLeft: `3px solid ${GREEN}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: SLATE }}>{d.name}</span>
                            <MicroBadge text="OPTIONAL" color={GREEN} bg={GREEN_BG} />
                          </div>
                          <div style={{ fontSize: 12, color: SLATE_500 }}>{d.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: GAP CHECKER
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === "gaps" && (
          <div className="fade-in">
            <SectionHeader
              icon="⚡"
              title="Pre-Submission Gap Checker"
              description="Identify critical issues before submitting your PA — avoid preventable denials."
            />

            <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
              <SelectorGroup
                drug={drug}
                indication={indication}
                payer={payer}
                indications={indications}
                onDrugChange={setDrug}
                onIndicationChange={setIndication}
                onPayerChange={setPayer}
              />

              <div style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, marginBottom: 12, letterSpacing: "0.04em" }}>
                PATIENT DATA
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
                <FieldInput label="ICD-10 Code" placeholder="J45.50" value={patientData.icd10Code} onChange={(v) => setPatientData({ ...patientData, icd10Code: v })} />
                <FieldInput label="IgE (IU/mL)" placeholder="482" value={patientData.ige} onChange={(v) => setPatientData({ ...patientData, ige: v })} />
                <FieldInput label="Eosinophils (cells/uL)" placeholder="310" value={patientData.eosinophils} onChange={(v) => setPatientData({ ...patientData, eosinophils: v })} />
                <FieldInput label="FeNO (ppb)" placeholder="45" value={patientData.feno} onChange={(v) => setPatientData({ ...patientData, feno: v })} />
                <FieldInput label="FEV1 (% predicted)" placeholder="71" value={patientData.fev1} onChange={(v) => setPatientData({ ...patientData, fev1: v })} />
                <FieldInput label="ACT Score" placeholder="14" value={patientData.act} onChange={(v) => setPatientData({ ...patientData, act: v })} />
                <FieldInput label="Step Therapy (months)" placeholder="3" value={patientData.stepTherapyMonths} onChange={(v) => setPatientData({ ...patientData, stepTherapyMonths: v })} />
                <FieldInput label="Weight (kg)" placeholder="78" value={patientData.weight} onChange={(v) => setPatientData({ ...patientData, weight: v })} />
                <FieldInput label="EASI Score" placeholder="24" value={patientData.easi} onChange={(v) => setPatientData({ ...patientData, easi: v })} />
                <FieldInput label="Historical Eos (pre-tx)" placeholder="420" value={patientData.historicalEos} onChange={(v) => setPatientData({ ...patientData, historicalEos: v })} />
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <CheckboxField label="Currently on OCS" checked={patientData.onOCS} onChange={(v) => setPatientData({ ...patientData, onOCS: v })} />
                <CheckboxField label="Has specialist prescriber" checked={patientData.hasSpecialist} onChange={(v) => setPatientData({ ...patientData, hasSpecialist: v })} />
                <CheckboxField label="Currently on anti-IL-5" checked={patientData.onAntiIL5} onChange={(v) => setPatientData({ ...patientData, onAntiIL5: v })} />
              </div>

              <button
                style={isSelectorsReady ? btnPrimary : btnPrimaryDisabled}
                disabled={!isSelectorsReady || gapLoading}
                onClick={handleCheckGaps}
              >
                {gapLoading ? <Spinner /> : <>Run Gap Check</>}
              </button>
            </div>

            {gapError && (
              <div className="fade-in" style={{ ...cardStyle, padding: 16, borderColor: RED, borderLeft: `4px solid ${RED}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 4 }}>Error</div>
                <div style={{ fontSize: 12, color: SLATE_500 }}>{gapError}</div>
              </div>
            )}

            {gapResult && (
              <div className="fade-in">
                {/* Verdict banner */}
                <div
                  style={{
                    ...cardStyle,
                    padding: 20,
                    marginBottom: 16,
                    borderLeft: `4px solid ${String(gapResult.verdict) === "READY" ? GREEN : RED}`,
                    background: String(gapResult.verdict) === "READY" ? `${GREEN_BG}40` : `${RED_BG}40`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{String(gapResult.verdict) === "READY" ? "✅" : "🚫"}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: String(gapResult.verdict) === "READY" ? GREEN : RED }}>
                          {String(gapResult.verdict) === "READY" ? "READY TO SUBMIT" : "DO NOT SUBMIT"}
                        </div>
                        <div style={{ fontSize: 12, color: SLATE_500, marginTop: 2 }}>{String(gapResult.message)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <MicroBadge text={`${Number(gapResult.criticalCount)} critical`} color={RED} bg={RED_BG} />
                      <MicroBadge text={`${Number(gapResult.warningCount)} warning`} color={AMBER} bg={AMBER_BG} />
                      <MicroBadge text={`${Number(gapResult.passCount)} pass`} color={GREEN} bg={GREEN_BG} />
                    </div>
                  </div>
                </div>

                {/* Gap items */}
                {Array.isArray(gapResult.gaps) &&
                  (gapResult.gaps as { severity: string; title: string; detail: string; action?: string }[]).map((g, i) => {
                    const sevColor = g.severity === "critical" ? RED : g.severity === "warning" ? AMBER : GREEN;
                    const sevBg = g.severity === "critical" ? RED_BG : g.severity === "warning" ? AMBER_BG : GREEN_BG;
                    const sevLabel = g.severity.toUpperCase();
                    const icon = g.severity === "critical" ? "🚨" : g.severity === "warning" ? "⚠️" : "✓";

                    return (
                      <div
                        key={i}
                        className="fade-in"
                        style={{
                          ...cardStyle,
                          padding: "16px 20px",
                          marginBottom: 8,
                          borderLeft: `3px solid ${sevColor}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{g.title}</span>
                              <MicroBadge text={sevLabel} color={sevColor} bg={sevBg} />
                            </div>
                            <div style={{ fontSize: 12, color: SLATE_500, lineHeight: 1.6 }}>{g.detail}</div>
                            {g.action && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: "8px 14px",
                                  borderRadius: 8,
                                  background: `${TEAL_LIGHT}50`,
                                  border: `1px solid ${TEAL_LIGHT}`,
                                  fontSize: 12,
                                  color: TEAL_DARK,
                                  fontWeight: 600,
                                }}
                              >
                                💡 ACTION: {g.action}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 4: APPEAL LETTER GENERATOR
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === "appeal" && (
          <div className="fade-in">
            <SectionHeader
              icon="✉️"
              title="Appeal Letter Generator"
              description="Generate clinical appeal letters with evidence-based strategies and supporting citations."
            />

            <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
              <SelectorGroup
                drug={drug}
                indication={indication}
                payer={payer}
                indications={indications}
                onDrugChange={setDrug}
                onIndicationChange={setIndication}
                onPayerChange={setPayer}
              />

              {/* Denial reason */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Denial Reason</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 72, resize: "vertical", fontFamily: ff }}
                  placeholder="e.g. Insufficient documentation of step therapy failure"
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, marginBottom: 12, letterSpacing: "0.04em" }}>
                PATIENT INFORMATION
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
                <FieldInput label="Patient Name" placeholder="John Doe" value={appealPatient.patientName} onChange={(v) => setAppealPatient({ ...appealPatient, patientName: v })} />
                <FieldInput label="MRN" placeholder="NT-123456" value={appealPatient.mrn} onChange={(v) => setAppealPatient({ ...appealPatient, mrn: v })} />
                <FieldInput label="Date of Birth" placeholder="1985-03-15" value={appealPatient.dob} onChange={(v) => setAppealPatient({ ...appealPatient, dob: v })} />
                <FieldInput label="Prescriber" placeholder="Dr. Smith" value={appealPatient.prescriber} onChange={(v) => setAppealPatient({ ...appealPatient, prescriber: v })} />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, marginBottom: 12, letterSpacing: "0.04em" }}>
                CLINICAL DATA (OPTIONAL — strengthens the letter)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                <FieldInput label="IgE (IU/mL)" placeholder="482" value={appealPatient.ige} onChange={(v) => setAppealPatient({ ...appealPatient, ige: v })} />
                <FieldInput label="Eosinophils (cells/uL)" placeholder="310" value={appealPatient.eosinophils} onChange={(v) => setAppealPatient({ ...appealPatient, eosinophils: v })} />
                <FieldInput label="FEV1 (% predicted)" placeholder="71" value={appealPatient.fev1} onChange={(v) => setAppealPatient({ ...appealPatient, fev1: v })} />
                <FieldInput label="ACT Score" placeholder="14" value={appealPatient.act} onChange={(v) => setAppealPatient({ ...appealPatient, act: v })} />
                <FieldInput label="Weight (kg)" placeholder="78" value={appealPatient.weight} onChange={(v) => setAppealPatient({ ...appealPatient, weight: v })} />
                <FieldInput label="Step Therapy (months)" placeholder="3" value={appealPatient.stepTherapyMonths} onChange={(v) => setAppealPatient({ ...appealPatient, stepTherapyMonths: v })} />
              </div>

              <button
                style={isSelectorsReady && denialReason ? btnPrimary : btnPrimaryDisabled}
                disabled={!isSelectorsReady || !denialReason || appealLoading}
                onClick={handleGenerateAppeal}
              >
                {appealLoading ? <Spinner /> : <>Generate Appeal Letter</>}
              </button>
            </div>

            {appealError && (
              <div className="fade-in" style={{ ...cardStyle, padding: 16, borderColor: RED, borderLeft: `4px solid ${RED}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 4 }}>Error</div>
                <div style={{ fontSize: 12, color: SLATE_500 }}>{appealError}</div>
              </div>
            )}

            {appealResult && (
              <div className="fade-in">
                {/* Strategy preview */}
                {!!appealResult.strategy && (
                  <div style={{ ...cardStyle, padding: 20, marginBottom: 16, borderLeft: `4px solid ${TEAL}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, marginBottom: 8, letterSpacing: "0.04em" }}>
                      APPEAL STRATEGY
                    </div>
                    <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {String(appealResult.strategy)}
                    </div>
                  </div>
                )}

                {/* Citations */}
                {!!appealResult.citations && Array.isArray(appealResult.citations) && (appealResult.citations as unknown[]).length > 0 && (
                  <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, marginBottom: 10, letterSpacing: "0.04em" }}>
                      SUPPORTING CITATIONS ({(appealResult.citations as unknown[]).length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(appealResult.citations as string[]).map((c, i) => (
                        <div key={i} style={{ fontSize: 12, color: SLATE_500, padding: "6px 0", borderBottom: i < (appealResult.citations as unknown[]).length - 1 ? `1px solid ${SLATE_100}` : "none" }}>
                          <span style={{ fontWeight: 700, color: SLATE }}>{i + 1}.</span> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Letter */}
                {!!appealResult.letter && (
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        padding: "12px 20px",
                        background: SLATE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Generated Appeal Letter</div>
                      <button
                        onClick={() => {
                          const text = String(appealResult.letter);
                          navigator.clipboard.writeText(text);
                        }}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          background: TEAL,
                          color: "#fff",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: ff,
                        }}
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre
                      style={{
                        padding: 24,
                        fontSize: 12,
                        lineHeight: 1.8,
                        color: SLATE,
                        fontFamily: ff,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        maxHeight: 500,
                        overflowY: "auto",
                        background: SLATE_50,
                      }}
                    >
                      {String(appealResult.letter)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer
        style={{
          background: "#fff",
          borderTop: `1px solid ${SLATE_200}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <div style={{ fontSize: 11, color: SLATE_400 }}>
          Maya PA Intelligence Engine — AI Features Demo
        </div>
        <div style={{ fontSize: 11, color: SLATE_400 }}>
          Knowledge base: 7 drugs · 6 payers · 10 indications
        </div>
      </footer>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIELD HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FieldInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: SLATE,
        cursor: "pointer",
        fontFamily: ff,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: TEAL, width: 16, height: 16, cursor: "pointer" }}
      />
      {label}
    </label>
  );
}

function ResultBanner({ valid, title }: { valid: boolean; title: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        borderRadius: 10,
        background: valid ? GREEN_BG : RED_BG,
        borderLeft: `4px solid ${valid ? GREEN : RED}`,
      }}
    >
      <span style={{ fontSize: 20 }}>{valid ? "✅" : "❌"}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: valid ? GREEN : RED }}>{title}</div>
      </div>
    </div>
  );
}
