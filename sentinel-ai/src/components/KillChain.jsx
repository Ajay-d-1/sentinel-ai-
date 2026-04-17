export default function KillChain({ currentStage = -1 }) {
  const steps = [
    { id: "RECON", label: "Reconnaissance", desc: "Discovery & Enum" },
    { id: "INITIAL_ACCESS", label: "Initial Access", desc: "Credential/Exploit" },
    { id: "EXECUTION", label: "Execution", desc: "Malware Run" },
    { id: "LATERAL_MOVEMENT", label: "Lateral Move", desc: "Network Spread" },
    { id: "EXFILTRATION", label: "Exfiltration", desc: "Data Extrusion" },
  ];

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--bg-border)",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.15em", fontWeight: "600", marginBottom: "16px", textTransform: "uppercase" }}>
        Kill Chain Pipeline
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
        {/* Background track line */}
        <div 
          style={{ 
            position: "absolute", 
            top: "16px", 
            left: "10%", 
            right: "10%", 
            height: "2px", 
            background: "rgba(51, 65, 85, 0.5)", 
            zIndex: 0 
          }} 
        />
        
        {/* Active track line */}
        <div 
          style={{ 
            position: "absolute", 
            top: "16px", 
            left: "10%", 
            width: currentStage >= 0 ? `${Math.min(currentStage * 20, 80)}%` : "0%", 
            height: "2px", 
            background: "var(--accent-cyan)", 
            boxShadow: "0 0 8px var(--accent-cyan)",
            transition: "width 0.5s ease-out",
            zIndex: 1 
          }} 
        />

        {steps.map((s, i) => {
          const isActive = currentStage >= i;
          const isCurrent = currentStage === i;
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, width: "60px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: `2px solid ${isActive ? "var(--accent-cyan)" : "var(--text-muted)"}`,
                  background: isActive ? "rgba(15, 23, 42, 0.9)" : "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isCurrent ? "0 0 15px var(--accent-cyan-glow)" : "none",
                  transition: "all 0.3s",
                }}
              >
                {isActive ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--text-muted)", opacity: 0.5 }}></div>
                )}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  marginTop: "12px",
                  textAlign: "center",
                  lineHeight: "1.2",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: isActive ? "var(--text-secondary)" : "rgba(100, 116, 139, 0.5)",
                  marginTop: "4px",
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}