import { useState, useEffect, useRef, useCallback } from "react";
import { streamFromGroq, buildPrompt } from "../lib/groq";

const WAVEFORM_BARS = 28;

function Waveform({ streaming }) {
  const [bars, setBars] = useState(Array(WAVEFORM_BARS).fill(4));

  useEffect(() => {
    if (!streaming) {
      setBars(Array(WAVEFORM_BARS).fill(4));
      return;
    }
    const interval = setInterval(() => {
      setBars(
        Array(WAVEFORM_BARS)
          .fill(0)
          .map((_, i) => 8 + Math.sin(Date.now() * 0.005 + i * 0.6) * 12 + Math.random() * 8)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [streaming]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "40px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: `${h}px`,
            background: streaming ? "#00ff41" : "#1a3a1a",
            borderRadius: "2px",
            transition: "height 0.12s ease",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function SamanthaStream({ incident, mode, onModeToggle }) {
  const [uiMessages, setUiMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [confidence, setConfidence] = useState(null);
  const [chatInput, setChatInput] = useState("");
  
  const conversationRef = useRef([]);
  const abortRef = useRef(null);
  const lastProcessedRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [uiMessages, status]);

  const triggerStream = useCallback(
    async (inc, currentMode) => {
      if (!inc) return;

      if (abortRef.current) {
        abortRef.current.aborted = true;
      }
      const thisStream = { aborted: false };
      abortRef.current = thisStream;

      setUiMessages([]);
      conversationRef.current = [];
      setStatus("thinking");
      setConfidence(inc.confidence || null);

      await new Promise((r) => setTimeout(r, 600));

      if (thisStream.aborted) return;
      setStatus("streaming");

      const prompt = buildPrompt(inc, currentMode);
      conversationRef.current = [{ role: 'user', content: prompt }];
      
      setUiMessages([{ sender: 'samantha', text: '' }]);

      let currentText = "";
      try {
        await streamFromGroq(conversationRef.current, (chunk) => {
          if (thisStream.aborted) return;
          currentText += chunk;
          setUiMessages((prev) => {
            const m = [...prev];
            m[m.length - 1].text = currentText;
            return m;
          });
        });
        if (!thisStream.aborted) {
          setStatus("done");
          conversationRef.current.push({ role: 'assistant', content: currentText });
        }
      } catch (err) {
        console.error("Stream error:", err);
        if (!thisStream.aborted) {
          setStatus("error");
          setUiMessages([{ sender: 'samantha', text: "AI analysis temporarily unavailable." }]);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!incident) return;
    const incId = incident.id;
    if (incId === lastProcessedRef.current) return;
    lastProcessedRef.current = incId;
    triggerStream(incident, mode);
  }, [incident, triggerStream, mode]);

  useEffect(() => {
    if (!incident || !lastProcessedRef.current) return;
    triggerStream(incident, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || status === "thinking" || status === "streaming") return;

    const userText = chatInput.trim();
    setChatInput("");
    setUiMessages((prev) => [...prev, { sender: 'user', text: userText }, { sender: 'samantha', text: '' }]);
    conversationRef.current.push({ role: 'user', content: userText });

    setStatus("thinking");

    if (abortRef.current) abortRef.current.aborted = true;
    const thisStream = { aborted: false };
    abortRef.current = thisStream;

    let currentText = "";
    try {
      setStatus("streaming");
      await streamFromGroq(conversationRef.current, (chunk) => {
        if (thisStream.aborted) return;
        currentText += chunk;
        setUiMessages((prev) => {
          const m = [...prev];
          m[m.length - 1].text = currentText;
          return m;
        });
      });
      if (!thisStream.aborted) {
        setStatus("done");
        conversationRef.current.push({ role: 'assistant', content: currentText });
      }
    } catch (err) {
      console.error("Stream error:", err);
      if (!thisStream.aborted) {
        setStatus("error");
        setUiMessages((prev) => {
          const m = [...prev];
          m[m.length - 1].text = "Connection error while processing follow-up.";
          return m;
        });
      }
    }
  };

  const isFP = incident?.is_false_positive;
  const severity = incident?.severity;
  const severityColor =
    { LOW: "#6b7280", MEDIUM: "#facc15", HIGH: "#f97316", CRITICAL: "#ef4444" }[severity] || "#6b7280";

  return (
    <div
      style={{
        background: "#050f05",
        border: "1px solid #0d2b0d",
        borderRadius: "8px",
        overflow: "hidden",
        fontFamily: "monospace",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes sam-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes sam-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .sam-cursor::after { content: '▋'; color: #00ff41; animation: sam-blink 0.8s infinite; margin-left: 2px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--bg-border)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: `2px solid ${status === "streaming" ? "var(--accent-cyan)" : "var(--bg-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: status === "streaming" ? "var(--accent-cyan)" : "#fff",
              fontSize: "18px",
              fontWeight: "bold",
              background: status === "streaming" ? "var(--accent-cyan-glow)" : "transparent",
              boxShadow: status === "streaming" ? "0 0 15px var(--accent-cyan-glow)" : "none",
              transition: "all 0.3s",
            }}
          >
            S
          </div>
          <div>
            <div style={{ color: "var(--accent-cyan)", fontSize: "14px", fontWeight: "700", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
              SAMANTHA
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "4px" }}>
              SENTINEL AI COPROCESSOR
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", color: status === "idle" ? "var(--text-muted)" : "var(--accent-cyan)", letterSpacing: "0.1em", fontWeight: "600" }}>
              {status === "idle" ? "STANDBY" : status === "streaming" ? "ANALYZING..." : status === "thinking" ? "PROCESSING..." : "READY"}
            </span>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: status === "idle" ? "var(--text-muted)" : "var(--accent-cyan)",
                boxShadow: status === "streaming" || status === "thinking" ? "0 0 10px var(--accent-cyan)" : "none",
                animation: status === "streaming" || status === "thinking" ? "cyber-pulse 1s infinite" : "none",
              }}
            ></div>
          </div>

          <div
            style={{
              display: "flex",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--bg-border)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {[{key: "analyst", label: "SOC ENGINEER"}, {key: "ceo", label: "INCIDENT CMDR"}].map((m) => (
              <button
                key={m.key}
                onClick={() => onModeToggle && onModeToggle(m.key)}
                style={{
                  padding: "6px 14px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  border: "none",
                  background: mode === m.key ? "var(--accent-cyan)" : "transparent",
                  color: mode === m.key ? "#000" : "var(--text-secondary)",
                  fontWeight: "700",
                  transition: "all 0.2s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waveform & Stats row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid var(--bg-border)",
          background: "rgba(15, 23, 42, 0.4)",
        }}
      >
        <Waveform streaming={status === "streaming"} />
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {confidence !== null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "4px" }}>CONFIDENCE</div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  fontFamily: "var(--font-mono)",
                  color: confidence >= 90 ? "var(--sev-critical-text)" : confidence >= 75 ? "var(--sev-high-text)" : "var(--sev-medium-text)",
                }}
              >
                {confidence}%
              </div>
            </div>
          )}
          {severity && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "4px" }}>SEVERITY</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-mono)",
                  color: isFP ? "var(--sev-benign-text)" : severityColor === "#ef4444" ? "var(--sev-critical-text)" : severityColor === "#f97316" ? "var(--sev-high-text)" : "var(--text-primary)",
                }}
              >
                {isFP ? "BENIGN" : severity}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analysis Dashboard */}
      {incident && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          padding: "16px 24px",
          borderBottom: "1px solid var(--bg-border)",
          background: "rgba(5, 15, 5, 0.6)",
        }}>
          {/* Severity Gauge */}
          <div style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid var(--bg-border)",
            borderRadius: "8px",
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "10px" }}>SEVERITY LEVEL</div>
            <div style={{ fontSize: "20px", fontWeight: "800", fontFamily: "var(--font-mono)", color: severityColor, marginBottom: "10px" }}>
              {isFP ? "BENIGN" : severity || "—"}
            </div>
            <div style={{ height: "6px", background: "rgba(30,30,30,0.8)", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{
                height: "100%",
                borderRadius: "3px",
                transition: "width 0.5s ease",
                width: severity === "LOW" ? "25%" : severity === "MEDIUM" ? "50%" : severity === "HIGH" ? "75%" : severity === "CRITICAL" ? "100%" : "0%",
                background: severity === "LOW" ? "#3b82f6" : severity === "MEDIUM" ? "#f59e0b" : severity === "HIGH" ? "#f97316" : severity === "CRITICAL" ? "#ef4444" : "#333",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              <span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
            </div>
          </div>

          {/* Confidence Ring */}
          <div style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid var(--bg-border)",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "8px", alignSelf: "flex-start" }}>CONFIDENCE</div>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1a2a1a" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none"
                stroke={confidence >= 90 ? "#ef4444" : confidence >= 75 ? "#f97316" : confidence >= 50 ? "#facc15" : "#22c55e"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(confidence || 0) * 2.01} 201`}
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
              <text x="40" y="44" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800" fontFamily="monospace">{confidence || 0}%</text>
            </svg>
          </div>

          {/* Kill Chain Stage */}
          <div style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid var(--bg-border)",
            borderRadius: "8px",
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "10px" }}>KILL CHAIN STAGE</div>
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "40px" }}>
              {["RECON", "ACCESS", "EXEC", "MOVE", "EXFIL"].map((stage, i) => {
                const stageMap = { RECON: 0, INITIAL_ACCESS: 1, EXECUTION: 2, LATERAL_MOVEMENT: 3, EXFILTRATION: 4 };
                const current = stageMap[incident.stage] ?? -1;
                const active = i <= current;
                return (
                  <div key={stage} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{
                      width: "100%", height: active ? `${20 + i * 5}px` : "12px",
                      background: active ? (i === current ? "#00ff41" : "rgba(0,255,65,0.3)") : "#1a2a1a",
                      borderRadius: "3px", transition: "all 0.5s ease",
                      boxShadow: i === current ? "0 0 8px rgba(0,255,65,0.5)" : "none",
                    }} />
                    <span style={{ fontSize: "7px", color: active ? "#00ff41" : "var(--text-muted)", letterSpacing: "0.05em" }}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Threat Badge */}
          <div style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid var(--bg-border)",
            borderRadius: "8px",
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "10px" }}>ACTIVE THREAT</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>
                {incident.threat_type?.includes("EXFIL") ? "📤" : incident.threat_type?.includes("LATERAL") ? "🔀" : incident.threat_type?.includes("MALWARE") ? "🦠" : incident.threat_type?.includes("BRUTE") ? "🔨" : incident.threat_type?.includes("SCAN") ? "🔍" : incident.threat_type?.includes("SQL") ? "💉" : incident.threat_type?.includes("XSS") ? "⚡" : incident.threat_type?.includes("HEADER") ? "🛡️" : "⚠️"}
              </span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "var(--font-mono)" }}>{incident.threat_type?.replace(/_/g, " ") || "UNKNOWN"}</div>
                <div style={{ fontSize: "10px", color: "var(--accent-cyan)", marginTop: "2px" }}>{incident.mitre_technique || "—"} · {incident.mitre_tactic?.replace(/_/g, " ") || "Unknown"}</div>
              </div>
            </div>
            <span style={{
              fontSize: "9px", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", letterSpacing: "0.1em",
              background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)", color: "#00ff41",
            }}>
              {incident.layers_involved?.join(" · ") || "NETWORK"}
            </span>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {status === "idle" ? (
          <div style={{ color: "var(--text-muted)", fontSize: "14px", fontFamily: "var(--font-mono)", opacity: 0.7, lineHeight: 1.8 }}>
            <div>{">"} Awaiting threat telemetry...</div>
            <div>{">"} Defense sub-systems initialized.</div>
            <div>{">"} Select a pipeline event to begin AI co-analysis.</div>
          </div>
        ) : (
          uiMessages.map((msg, idx) => {
            const isLast = idx === uiMessages.length - 1;
            const isSamantha = msg.sender === 'samantha';
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isSamantha ? "flex-start" : "flex-end",
                  background: isSamantha ? "transparent" : "rgba(20, 184, 166, 0.1)",
                  border: isSamantha ? "none" : "1px solid rgba(20, 184, 166, 0.3)",
                  borderRadius: isSamantha ? "0" : "8px",
                  padding: isSamantha ? "0" : "12px 16px",
                  maxWidth: isSamantha ? "100%" : "85%",
                  color: isSamantha 
                    ? (isFP ? "var(--sev-benign-text)" : "var(--text-primary)") 
                    : "var(--accent-cyan)",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  fontFamily: "var(--font-sans)",
                  whiteSpace: "pre-wrap",
                }}
                className={isSamantha && isLast && status === "streaming" ? "sam-cursor" : ""}
              >
                {msg.text}
              </div>
            );
          })
        )}
        {status === "thinking" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <div style={{ color: "var(--accent-cyan)", fontSize: "12px", letterSpacing: "0.1em" }}>ANALYZING DATA</div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--accent-cyan)",
                  animation: `cyber-pulse 1s infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      {status !== "idle" && (
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            gap: "12px"
          }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={status === "thinking" || status === "streaming"}
            placeholder="Ask Samantha for deeper analysis..."
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid var(--bg-border)",
              borderRadius: "6px",
              padding: "10px 16px",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || status === "thinking" || status === "streaming"}
            style={{
              background: "var(--accent-cyan)",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              padding: "0 20px",
              fontWeight: "700",
              fontSize: "12px",
              letterSpacing: "0.05em",
              cursor: (!chatInput.trim() || status === "thinking" || status === "streaming") ? "not-allowed" : "pointer",
              opacity: (!chatInput.trim() || status === "thinking" || status === "streaming") ? 0.5 : 1,
              transition: "all 0.2s"
            }}
          >
            SEND
          </button>
        </form>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--bg-border)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-surface)",
        }}
      >
        <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "600" }}>
          MITRE ATT&CK · {incident?.mitre_technique || "-"}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>
          {incident?.mitre_tactic || "NO ACTIVE THREAT"}
        </div>
      </div>
    </div>
  );
}