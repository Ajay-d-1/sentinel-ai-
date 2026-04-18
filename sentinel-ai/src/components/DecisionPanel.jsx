import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DecisionPanel({ incident, attackId }) {
  const [notes, setNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastDecision, setLastDecision] = useState(null);

  async function handleSubmit(decision) {
    setSaving(true);

    // Try inserting to attack_decisions table
    const { error } = await supabase.from("attack_decisions").insert({
      attack_id: attackId || incident?.attack_id || "unknown",
      decision,
      notes,
      action_taken: actionTaken,
    });

    if (error) {
      console.warn("Decision save warning:", error.message);
      // Even if DB save fails, show the UI feedback
    }

    setLastDecision(decision);
    setSaving(false);
    setNotes("");
    setActionTaken("");

    // Reset after 3 seconds
    setTimeout(() => setLastDecision(null), 3000);
  }

  const hasIncident = !!incident;

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--bg-border)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--bg-border)",
          background: "var(--bg-surface)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "600", letterSpacing: "0.05em" }}>
          DECISION LOG
        </div>
        {lastDecision && (
          <span
            style={{
              fontSize: "9px",
              padding: "2px 8px",
              borderRadius: "3px",
              background: lastDecision === "FALSE POSITIVE" ? "rgba(20, 184, 166, 0.15)" : "rgba(225, 29, 72, 0.15)",
              border: `1px solid ${lastDecision === "FALSE POSITIVE" ? "rgba(20, 184, 166, 0.5)" : "rgba(225, 29, 72, 0.5)"}`,
              color: lastDecision === "FALSE POSITIVE" ? "#5eead4" : "#fda4af",
              letterSpacing: "0.05em"
            }}
          >
            ✓ {lastDecision}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        {!hasIncident ? (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px 0", fontFamily: "var(--font-sans)", fontWeight: "500" }}>
            Select an incident to take action
          </div>
        ) : (
          <>
            {/* Incident summary */}
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid var(--bg-border)",
                borderRadius: "6px",
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}
            >
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{incident.threat_type}</span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span>{incident.stage}</span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span
                style={{
                  fontWeight: "bold",
                  color:
                    incident.severity === "CRITICAL"
                      ? "var(--sev-critical-text)"
                      : incident.severity === "HIGH"
                      ? "var(--sev-high-text)"
                      : "var(--sev-medium-text)",
                }}
              >
                {incident.severity}
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.1em",
                  fontWeight: "600",
                }}
              >
                SOC ENGINEER NOTES
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this incident..."
                style={{
                  width: "100%",
                  minHeight: "72px",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "6px",
                  padding: "12px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bg-border)")}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.1em",
                  fontWeight: "600",
                }}
              >
                ACTION TAKEN
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g., Blocked IP, Isolated host..."
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "6px",
                  padding: "12px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bg-border)")}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {["CONFIRMED", "FALSE POSITIVE", "ESCALATED"].map((decision) => (
                <button
                  key={decision}
                  onClick={() => handleSubmit(decision)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    background: saving ? "var(--bg-surface)" : "rgba(15, 23, 42, 0.4)",
                    border: `1px solid ${
                      decision === "FALSE POSITIVE" ? "rgba(20, 184, 166, 0.5)" : decision === "ESCALATED" ? "rgba(234, 88, 12, 0.5)" : "rgba(225, 29, 72, 0.5)"
                    }`,
                    borderRadius: "6px",
                    color:
                      decision === "FALSE POSITIVE" ? "#5eead4" : decision === "ESCALATED" ? "#fdba74" : "#fda4af",
                    fontFamily: "var(--font-sans)",
                    fontSize: "10px",
                    letterSpacing: "0.05em",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.target.style.background = decision === "FALSE POSITIVE" ? "rgba(20, 184, 166, 0.15)" : decision === "ESCALATED" ? "rgba(234, 88, 12, 0.15)" : "rgba(225, 29, 72, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.target.style.background = "rgba(15, 23, 42, 0.4)";
                  }}
                >
                  {saving ? "SAVING..." : decision}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
