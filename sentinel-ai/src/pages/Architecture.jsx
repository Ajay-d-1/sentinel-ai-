export default function Architecture() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020902",
      color: "#00ff41",
      fontFamily: "monospace",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "32px",
        paddingBottom: "16px",
        borderBottom: "1px solid #0d2b0d",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: "#00ff41", boxShadow: "0 0 8px #00ff41",
          }} />
          <span style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "0.2em" }}>
            SENTINEL AI
          </span>
          <span style={{ fontSize: "11px", color: "#1a5a1a" }}>
            SYSTEM ARCHITECTURE
          </span>
        </div>
        <a href="/" style={{
          padding: "6px 14px",
          background: "#0a1a0a",
          border: "1px solid #1a3a1a",
          borderRadius: "4px",
          color: "#2a6b2a",
          textDecoration: "none",
          fontSize: "11px",
          letterSpacing: "0.1em",
        }}>
          ← BACK TO DASHBOARD
        </a>
      </div>

      {/* Architecture Diagram */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}>

        {/* Row 1: Log Sources */}
        <div style={{
          background: "#050f05",
          border: "1px solid #0d2b0d",
          borderRadius: "8px",
          padding: "20px 32px",
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "11px",
            color: "#2a6b2a",
            letterSpacing: "0.15em",
            marginBottom: "12px",
            fontWeight: "bold",
          }}>
            LOG SOURCES
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {["Network IDS", "Endpoint EDR", "Application Logs", "DNS Flows", "Proxy Data"].map((source) => (
              <div key={source} style={{
                background: "#0a1a0a",
                border: "1px solid #1a3a1a",
                borderRadius: "4px",
                padding: "10px 20px",
                fontSize: "11px",
                color: "#c8f7c8",
              }}>
                {source}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ color: "#1a3a1a", fontSize: "20px" }}>↓</div>

        {/* Row 2: Normalization Engine */}
        <div style={{
          background: "#0a1a0a",
          border: "1px solid #00ff41",
          borderRadius: "8px",
          padding: "20px 32px",
          width: "70%",
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{
            fontSize: "12px",
            color: "#00ff41",
            letterSpacing: "0.15em",
            fontWeight: "bold",
            marginBottom: "8px",
          }}>
            NORMALIZATION ENGINE
          </div>
          <div style={{
            fontSize: "10px",
            color: "#2a6b2a",
          }}>
            Parse logs → Extract IOCs → Enrich with Geo/ASN data
          </div>
          <div style={{
            position: "absolute",
            right: "-12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#020902",
            padding: "4px 8px",
            fontSize: "9px",
            color: "#2a6b2a",
            border: "1px solid #1a3a1a",
            borderRadius: "3px",
          }}>
            Supabase
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ color: "#1a3a1a", fontSize: "20px" }}>↓</div>

        {/* Row 3: Correlation Engine */}
        <div style={{
          background: "#0a1a0a",
          border: "1px solid #00ff41",
          borderRadius: "8px",
          padding: "20px 32px",
          width: "70%",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "12px",
            color: "#00ff41",
            letterSpacing: "0.15em",
            fontWeight: "bold",
            marginBottom: "8px",
          }}>
            CORRELATION ENGINE
          </div>
          <div style={{
            fontSize: "10px",
            color: "#2a6b2a",
            marginBottom: "12px",
          }}>
            Multi-layer signal correlation with 5-stage kill chain mapping
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            {["RECON", "INITIAL ACCESS", "EXECUTION", "LATERAL MOVE", "EXFILTRATION"].map((stage, i) => (
              <div key={stage} style={{
                background: "#030a03",
                border: "1px solid #1a3a1a",
                borderRadius: "3px",
                padding: "6px 12px",
                fontSize: "9px",
                color: i === 4 ? "#ef4444" : i === 3 ? "#f97316" : i === 2 ? "#facc15" : "#6b7280",
              }}>
                {stage}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ color: "#1a3a1a", fontSize: "20px" }}>↓</div>

        {/* Row 4: Samantha AI */}
        <div style={{
          background: "#0a1a0a",
          border: "1px solid #00ff41",
          borderRadius: "8px",
          padding: "20px 32px",
          width: "70%",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "12px",
            color: "#00ff41",
            letterSpacing: "0.15em",
            fontWeight: "bold",
            marginBottom: "8px",
          }}>
            SAMANTHA AI
          </div>
          <div style={{
            fontSize: "10px",
            color: "#2a6b2a",
            marginBottom: "12px",
          }}>
            Groq LLM (llama-3.3-70b) — Real-time threat narration & analysis
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <span style={{
              background: "#030a03",
              border: "1px solid #1a3a1a",
              borderRadius: "3px",
              padding: "4px 10px",
              fontSize: "9px",
              color: "#c8f7c8",
            }}>
              Analyst Mode
            </span>
            <span style={{
              background: "#030a03",
              border: "1px solid #1a3a1a",
              borderRadius: "3px",
              padding: "4px 10px",
              fontSize: "9px",
              color: "#c8f7c8",
            }}>
              CEO Mode
            </span>
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ color: "#1a3a1a", fontSize: "20px" }}>↓</div>

        {/* Row 5: Playbook Generator */}
        <div style={{
          background: "#0a1a0a",
          border: "1px solid #00ff41",
          borderRadius: "8px",
          padding: "20px 32px",
          width: "70%",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "12px",
            color: "#00ff41",
            letterSpacing: "0.15em",
            fontWeight: "bold",
            marginBottom: "8px",
          }}>
            PLAYBOOK GENERATOR
          </div>
          <div style={{
            fontSize: "10px",
            color: "#2a6b2a",
          }}>
            Dynamic response steps per threat type with progress tracking
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ color: "#1a3a1a", fontSize: "20px" }}>↓</div>

        {/* Row 6: SOC Dashboard */}
        <div style={{
          background: "#050f05",
          border: "2px solid #00ff41",
          borderRadius: "8px",
          padding: "24px 40px",
          width: "85%",
          textAlign: "center",
          boxShadow: "0 0 20px #00ff4120",
        }}>
          <div style={{
            fontSize: "14px",
            color: "#00ff41",
            letterSpacing: "0.2em",
            fontWeight: "bold",
            marginBottom: "16px",
          }}>
            SOC DASHBOARD v3.1
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { label: "Kill Chain", desc: "5-Stage Progress" },
              { label: "Incident Feed", desc: "Realtime Updates" },
              { label: "AI Narration", desc: "Samantha Stream" },
              { label: "Response", desc: "Decision + Playbook" },
            ].map((item) => (
              <div key={item.label} style={{
                background: "#030a03",
                border: "1px solid #1a3a1a",
                borderRadius: "4px",
                padding: "12px",
              }}>
                <div style={{
                  fontSize: "10px",
                  color: "#00ff41",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: "9px",
                  color: "#2a6b2a",
                }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div style={{
          marginTop: "16px",
          padding: "12px 24px",
          background: "#030a03",
          border: "1px solid #0d2b0d",
          borderRadius: "4px",
          fontSize: "10px",
          color: "#2a6b2a",
        }}>
          TECH STACK: React + Vite + Supabase (Postgres + Realtime) + Groq LLM
        </div>
      </div>
    </div>
  );
}
