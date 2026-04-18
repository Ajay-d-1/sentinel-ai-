import { useState, useEffect, useRef } from "react";
import { streamFromGroq } from "../lib/groq";

const PLAYBOOKS = {
  PORT_SCAN: [
    "Monitor target network segment for continued scanning activity",
    "Rate-limit or block source IP at perimeter firewall",
    "Log all source IPs and scan patterns for threat intel",
    "Alert SOC team for potential reconnaissance activity",
    "Correlate with endpoint logs for post-scan activity",
  ],
  BRUTE_FORCE: [
    "Lock affected user account immediately",
    "Block source IP at network perimeter",
    "Force MFA re-enrollment for target account",
    "Audit authentication logs for successful logins",
    "Review all sessions from compromised credentials",
  ],
  MALWARE_EXECUTION: [
    "Isolate affected host from network immediately",
    "Kill malicious process and capture memory dump",
    "Create forensic disk image for analysis",
    "Scan adjacent hosts for similar indicators of compromise",
    "Update endpoint detection rules with new IOCs",
  ],
  LATERAL_MOVEMENT: [
    "Segment network to contain lateral spread",
    "Revoke compromised credentials immediately",
    "Audit east-west traffic between network segments",
    "Deploy endpoint detection on all reachable hosts",
    "Review SMB/RDP/WMI logs for unusual access patterns",
  ],
  DATA_EXFILTRATION: [
    "Block egress traffic to suspicious destinations immediately",
    "Preserve all logs and packet captures as evidence",
    "Notify Data Protection Officer and Legal team",
    "Engage Incident Response team for breach protocol",
    "Assess data classification of potentially exfiltrated files",
  ],
  BACKUP_PROCESS: [
    "Verify process with system administrator",
    "Whitelist verified backup process hash",
    "Document false positive for future reference",
    "Close alert as BENIGN — no action required",
  ],
  C2_BEACONING: [
    "Block C2 domain/IP at DNS and firewall immediately",
    "Isolate compromised host from network",
    "Hunt for additional beacons across all network segments",
    "Capture and analyze beacon traffic patterns",
    "Check threat intel databases for C2 infrastructure",
  ],
  SQL_INJECTION: [
    "Block source IP at WAF and network firewall",
    "Review affected database for unauthorized modifications",
    "Audit application logs for successful injection attempts",
    "Patch vulnerable application endpoint",
    "Scan database for backdoor accounts or data changes",
  ],
  DNS_TUNNELING: [
    "Block suspicious DNS domains at resolver level",
    "Monitor DNS query volume and entropy patterns",
    "Isolate endpoint generating tunneling traffic",
    "Analyze DNS payload for encoded data exfiltration",
    "Update DNS firewall rules with new indicators",
  ],
  PRIVILEGE_ESCALATION: [
    "Revoke elevated privileges immediately",
    "Audit all actions taken with escalated permissions",
    "Review privilege escalation path and close vulnerability",
    "Check for persistence mechanisms installed during escalation",
    "Reset affected system to known-good state",
  ],
  PHISHING: [
    "Quarantine phishing email across all mailboxes",
    "Reset credentials of any user who clicked the link",
    "Block phishing domain at proxy and DNS",
    "Scan endpoints of affected users for malware delivery",
    "Submit phishing indicators to threat intelligence platform",
  ],
  ZERO_DAY_EXPLOIT: [
    "Isolate affected systems from network immediately",
    "Capture memory dumps and forensic images",
    "Engage vendor security team with exploit details",
    "Deploy virtual patching via WAF/IPS rules",
    "Hunt for exploitation across all vulnerable assets",
  ],
  RANSOMWARE: [
    "Disconnect affected systems from network immediately",
    "Identify ransomware variant from ransom note / file extension",
    "Check for available decryption tools",
    "Restore from clean, verified backups",
    "Report to law enforcement and regulatory bodies",
  ],
};

const DEFAULT_PLAYBOOK = [
  "Review incident details and threat classification",
  "Investigate affected systems and network segments",
  "Contain threat to prevent further spread",
  "Collect and preserve forensic evidence",
  "Document findings and remediation actions",
  "Escalate to senior analysts if severity is HIGH/CRITICAL",
];

export default function PlaybookPanel({ incident }) {
  const [completedSteps, setCompletedSteps] = useState({});
  const [aiPlaybook, setAiPlaybook] = useState(null);
  const [generating, setGenerating] = useState(false);

  if (!incident) {
    return (
      <div
        style={{
          background: "#050f05",
          border: "1px solid #0d2b0d",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#2a6b2a", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: "12px" }}>
          RESPONSE PLAYBOOK
        </div>
        <div style={{ fontSize: "11px", color: "#1a4a1a", textAlign: "center", padding: "20px 0" }}>
          Select an incident to view response playbook
        </div>
      </div>
    );
  }

  const threatType = incident.threat_type || "UNKNOWN";
  const steps = PLAYBOOKS[threatType] || aiPlaybook || DEFAULT_PLAYBOOK;
  const completed = completedSteps[incident.id] || new Set();
  const isCustomThreat = !PLAYBOOKS[threatType] && !aiPlaybook;

  const toggleStep = (idx) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(idx)) {
      newCompleted.delete(idx);
    } else {
      newCompleted.add(idx);
    }
    setCompletedSteps({ ...completedSteps, [incident.id]: newCompleted });
  };

  const generateAIPlaybook = async () => {
    setGenerating(true);
    let result = "";
    const prompt = `Generate exactly 5 numbered incident response steps for a ${threatType} attack at ${incident.stage} stage with ${incident.severity} severity. Each step should be a single actionable sentence. Format: just the steps, one per line, no numbering, no bullets.`;
    
    await streamFromGroq(prompt, (chunk) => {
      result += chunk;
    });

    const steps = result
      .split("\n")
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter((s) => s.length > 10)
      .slice(0, 6);

    if (steps.length > 0) {
      setAiPlaybook(steps);
    }
    setGenerating(false);
  };

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <div
      style={{
        flex: 1,
        background: "var(--bg-panel)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--bg-border)",
        borderRadius: "12px",
        padding: "20px",
        overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "600", letterSpacing: "0.05em" }}>
            RESPONSE PLAYBOOK
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "2px" }}>
            {incident?.threat_type || "NO THREAT SELECTED"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isCustomThreat && (
            <button
              onClick={generateAIPlaybook}
              disabled={generating}
              style={{
                padding: "6px 10px",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "4px",
                color: "var(--accent-cyan)",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                cursor: generating ? "not-allowed" : "pointer",
                letterSpacing: "0.05em",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              {generating ? "GENERATING..." : "AI PLAYBOOK"}
            </button>
          )}
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              fontFamily: "var(--font-mono)",
              color: completed.size === steps.length ? "var(--sev-benign-text)" : "var(--accent-cyan)",
            }}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "2px",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: completed.size === steps.length ? "var(--sev-benign-text)" : "var(--accent-cyan)",
            transition: "width 0.3s ease",
            boxShadow: completed.size === steps.length ? "0 0 10px var(--sev-benign-bg)" : "0 0 10px var(--accent-cyan-glow)",
          }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {steps.map((step, idx) => {
          const isDone = completed.has(idx);
          return (
            <div
              key={idx}
              onClick={() => toggleStep(idx)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 16px",
                background: isDone ? "rgba(20, 184, 166, 0.05)" : "rgba(15, 23, 42, 0.4)",
                border: `1px solid ${isDone ? "rgba(20, 184, 166, 0.3)" : "var(--bg-border)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: isDone ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDone) e.currentTarget.style.background = "var(--bg-surface)";
              }}
              onMouseLeave={(e) => {
                if (!isDone) e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: `2px solid ${isDone ? "var(--sev-benign-text)" : "var(--text-muted)"}`,
                  background: isDone ? "var(--sev-benign-text)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                  transition: "all 0.2s"
                }}
              >
                {isDone && <span style={{ color: "#000", fontSize: "12px", fontWeight: "bold" }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", letterSpacing: "0.1em", fontWeight: "600" }}>
                  STEP {idx + 1}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: isDone ? "var(--text-secondary)" : "var(--text-primary)",
                    textDecoration: isDone ? "line-through" : "none",
                    lineHeight: "1.5",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {step}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completed.size === steps.length && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "var(--sev-benign-bg)",
            border: "1px solid var(--sev-benign-border)",
            borderRadius: "8px",
            textAlign: "center",
            boxShadow: "0 0 15px rgba(20, 184, 166, 0.15)",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--sev-benign-text)", fontWeight: "700", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span>✓</span> PLAYBOOK COMPLETE
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>All response steps executed successfully.</div>
        </div>
      )}
    </div>
  );
}
