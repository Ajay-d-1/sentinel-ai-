import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function IncidentFeed({ onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [connStatus, setConnStatus] = useState("connecting");
  const listRef = useRef(null);
  const mountedParams = useRef(true);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (mountedParams.current) {
        setIncidents(data || []);
        setConnStatus("live");
      }
    } catch (e) {
      console.error("Feed error:", e);
      if (mountedParams.current) setConnStatus("error");
    }
  };

  useEffect(() => {
    mountedParams.current = true;
    fetchIncidents();

    const channel = supabase
      .channel("public:incidents")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incidents" }, (payload) => {
        if (!mountedParams.current) return;
        setIncidents((prev) => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && mountedParams.current) {
          setConnStatus("live");
        }
      });

    const fallbackPoll = setInterval(fetchIncidents, 3000);

    return () => {
      mountedParams.current = false;
      clearInterval(fallbackPoll);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClick = (inc) => {
    setSelectedId(inc.id);
    onSelectIncident(inc);
  };

  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" && !i.is_false_positive).length;
  const highCount = incidents.filter((i) => i.severity === "HIGH" && !i.is_false_positive).length;

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--bg-border)",
        borderRadius: "12px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--bg-border)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "600", letterSpacing: "0.05em" }}>
            INCIDENT FEED
          </div>
          {criticalCount > 0 && (
            <span
              style={{
                fontSize: "10px",
                background: "var(--sev-critical-bg)",
                border: "1px solid var(--sev-critical-border)",
                borderRadius: "4px",
                padding: "2px 8px",
                color: "var(--sev-critical-text)",
                fontWeight: "700",
                animation: "pulse-border 1.5s infinite",
              }}
            >
              {criticalCount} CRITICAL
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: connStatus === "live" ? "var(--accent-cyan)" : "var(--text-muted)", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connStatus === "live" ? "var(--accent-cyan)" : "var(--text-muted)", display: "inline-block", boxShadow: connStatus === "live" ? "0 0 8px var(--accent-cyan)" : "none" }}></span>
            {connStatus.toUpperCase()} · {incidents.length} ALERTS
          </span>
        </div>
      </div>

      {/* Severity summary bar */}
      {incidents.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(15, 23, 42, 0.4)",
            flexShrink: 0,
          }}
        >
          {[
            { label: "CRITICAL", count: criticalCount, color: "var(--sev-critical-text)" },
            { label: "HIGH", count: highCount, color: "var(--sev-high-text)" },
            { label: "MED", count: incidents.filter((i) => i.severity === "MEDIUM").length, color: "var(--sev-medium-text)" },
            { label: "LOW", count: incidents.filter((i) => i.severity === "LOW").length, color: "var(--sev-low-text)" },
            { label: "FP", count: incidents.filter((i) => i.is_false_positive).length, color: "var(--sev-benign-text)" },
          ].map((s) => (
            <span key={s.label} style={{ fontSize: "10px", color: s.color, letterSpacing: "0.05em", fontWeight: "600" }}>
              {s.count} {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Incident list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {incidents.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>NO ACTIVE INCIDENTS</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Awaiting telemetry from endpoints.
            </div>
          </div>
        ) : (
          incidents.map((inc, idx) => {
            const isSelected = inc.id === selectedId;
            const isBenign = inc.is_false_positive;
            // Get CSS vars based on severity
            const cssVarBase = isBenign ? "--sev-benign" : inc.severity ? `--sev-${inc.severity.toLowerCase()}` : "--sev-low";

            return (
              <div
                key={inc.id}
                onClick={() => handleClick(inc)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isSelected ? "var(--bg-surface-hover)" : "transparent",
                  borderLeft: isSelected ? `3px solid var(${cssVarBase}-text)` : "3px solid transparent",
                  animation: "slide-down-fade 0.3s ease-out",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--bg-surface)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        color: `var(${cssVarBase}-text)`,
                        fontWeight: "700",
                        letterSpacing: "0.1em",
                        padding: "2px 6px",
                        border: `1px solid var(${cssVarBase}-border)`,
                        borderRadius: "4px",
                        background: `var(${cssVarBase}-bg)`,
                      }}
                    >
                      {isBenign ? "BENIGN" : inc.severity || "UNKNOWN"}
                    </span>
                    {(inc.correlated || (inc.layers_involved && inc.layers_involved.length > 1)) && (
                      <span
                        style={{
                          fontSize: "8px",
                          color: "var(--accent-cyan)",
                          background: "var(--accent-cyan-glow)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          borderRadius: "3px",
                          padding: "1px 5px",
                          letterSpacing: "0.1em",
                          fontWeight: "600",
                        }}
                      >
                        CORR
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {inc.created_at && (Date.now() - new Date(inc.created_at.endsWith('Z') || inc.created_at.includes('+') ? inc.created_at : inc.created_at + 'Z').getTime() < 30000) && (
                      <span style={{ fontSize: "9px", background: "var(--accent-cyan)", color: "#000", padding: "1px 5px", borderRadius: "3px", fontWeight: "700", animation: "cyber-pulse 1.5s infinite" }}>
                        NEW
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {inc.created_at ? new Date(inc.created_at.endsWith('Z') || inc.created_at.includes('+') ? inc.created_at : inc.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "—"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "600", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                  {inc.threat_type}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", gap: "8px", fontFamily: "var(--font-sans)" }}>
                  <span>{inc.stage}</span>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span>{inc.mitre_technique || "—"}</span>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span>{inc.confidence ? `${inc.confidence}% CONF` : "—"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(225, 29, 72, 0.4); box-shadow: 0 0 0 transparent; }
          50% { border-color: rgba(225, 29, 72, 1); box-shadow: 0 0 10px rgba(225, 29, 72, 0.5); }
        }
      `}</style>
    </div>
  );
}
