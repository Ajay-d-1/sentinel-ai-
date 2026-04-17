import { useState, useCallback, useMemo, useEffect } from "react";
import KillChain from "../components/KillChain";
import IncidentFeed from "../components/IncidentFeed";
import SamanthaStream from "../components/SamanthaStream";
import DecisionPanel from "../components/DecisionPanel";
import PlaybookPanel from "../components/PlaybookPanel";
import ConfidenceTooltip from "../components/ConfidenceTooltip";
import Architecture from "./Architecture";

export default function Dashboard() {
  const [mode, setMode] = useState("analyst");
  const [currentStage, setCurrentStage] = useState(-1);
  const [activeIncident, setActiveIncident] = useState(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stageMap = useMemo(
    () => ({
      RECON: 0,
      INITIAL_ACCESS: 1,
      EXECUTION: 2,
      LATERAL_MOVEMENT: 3,
      EXFILTRATION: 4,
    }),
    []
  );

  const handleIncident = useCallback(
    (inc) => {
      setActiveIncident(inc);
      if (inc.stage && stageMap[inc.stage] !== undefined) {
        setCurrentStage(stageMap[inc.stage]);
      }
    },
    [stageMap]
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top navbar - Premium Enterprise Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "64px",
          background: "var(--bg-panel)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          borderBottom: "1px solid var(--bg-border)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "var(--accent-cyan)",
              boxShadow: "0 0 12px var(--accent-cyan)",
              animation: "cyber-pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "0.05em", color: "#fff" }}>
            SENTINEL<span style={{ color: "var(--accent-cyan)" }}>.</span>AI
          </span>
          <div style={{ height: "24px", borderLeft: "1px solid var(--text-muted)", margin: "0 8px" }}></div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Enterprise SOC Platform
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={() => setShowArchitecture(!showArchitecture)}
            style={{
              padding: "6px 16px",
              background: showArchitecture ? "var(--accent-cyan-glow)" : "transparent",
              border: `1px solid ${showArchitecture ? "var(--accent-cyan)" : "var(--bg-border)"}`,
              borderRadius: "6px",
              color: showArchitecture ? "#fff" : "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {showArchitecture ? "Close Architecture" : "View Architecture"}
          </button>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "14px", color: "#fff", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>
              {clock}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>LOCAL TIME</span>
          </div>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "rgba(20, 184, 166, 0.1)",
              border: "1px solid rgba(20, 184, 166, 0.3)",
              borderRadius: "20px",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5eead4" }}></div>
            <span style={{ fontSize: "11px", color: "#5eead4", fontWeight: "600", letterSpacing: "0.05em" }}>ALL SYSTEMS ACTIVE</span>
          </div>
        </div>
      </header>

      {showArchitecture ? (
        <div style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 1, padding: "24px" }}>
          <Architecture />
        </div>
      ) : (
        /* Main grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr 320px",
            gap: "20px",
            padding: "20px",
            flex: 1,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
            maxWidth: "1800px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden" }}>
            <KillChain currentStage={currentStage} />
            <IncidentFeed onSelectIncident={handleIncident} />
          </div>

          {/* Center column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden" }}>
            <SamanthaStream incident={activeIncident} mode={mode} onModeToggle={setMode} />

            {/* Threat stats bar */}
            <div
              style={{
                background: "var(--bg-panel)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--bg-border)",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "16px",
                flexShrink: 0,
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              {[
                { label: "STATUS", value: activeIncident ? "ACTIVE" : "SCANNING", isAlert: !!activeIncident },
                { label: "THREAT_TYPE", value: activeIncident?.threat_type || "—" },
                { label: "PIPELINE_STAGE", value: activeIncident?.stage || "—" },
                { label: "MITRE_ATT&CK", value: activeIncident?.mitre_technique || "—" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "16px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "6px" }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: stat.isAlert ? "#fda4af" : stat.value !== "—" ? "#fff" : "var(--text-muted)",
                      fontWeight: stat.value !== "—" ? "700" : "500",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {stat.value.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "6px" }}>
                  CONFIDENCE_SCORE
                </div>
                {activeIncident ? (
                  <ConfidenceTooltip confidence={activeIncident.confidence} />
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden" }}>
            <DecisionPanel incident={activeIncident} attackId={activeIncident?.attack_id} />
            <PlaybookPanel incident={activeIncident} />
          </div>
        </div>
      )}
    </div>
  );
}