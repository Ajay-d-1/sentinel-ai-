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

function StatusDot({ status }) {
  const colors = { idle: "#444", thinking: "#facc15", streaming: "#00ff41", done: "#00ff41", error: "#ef4444" };
  const labels = { idle: "STANDBY", thinking: "PROCESSING", streaming: "TRANSMITTING", done: "READY", error: "ERROR" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: colors[status] || "#444",
          boxShadow: status === "streaming" ? "0 0 6px #00ff41" : "none",
          animation: status === "streaming" || status === "thinking" ? "sam-pulse 1s infinite" : "none",
        }}
      />
      <span style={{ fontSize: "11px", letterSpacing: "0.12em", color: colors[status] || "#444", fontFamily: "monospace" }}>
        {labels[status] || "UNKNOWN"}
      </span>
    </div>
  );
}

export default function SamanthaStream({ incident, mode, onModeToggle }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle");
  const [confidence, setConfidence] = useState(null);
  const textRef = useRef("");
  const lastProcessedRef = useRef(null);
  const abortRef = useRef(null);

  const triggerStream = useCallback(
    async (inc, currentMode) => {
      if (!inc) return;

      // Abort any ongoing stream
      if (abortRef.current) {
        abortRef.current.aborted = true;
      }
      const thisStream = { aborted: false };
      abortRef.current = thisStream;

      textRef.current = "";
      setText("");
      setStatus("thinking");
      setConfidence(inc.confidence || null);

      await new Promise((r) => setTimeout(r, 600));

      if (thisStream.aborted) return;
      setStatus("streaming");

      const prompt = buildPrompt(inc, currentMode);

      try {
        await streamFromGroq(prompt, (chunk) => {
          if (thisStream.aborted) return;
          textRef.current += chunk;
          setText(textRef.current);
        });
        if (!thisStream.aborted) {
          setStatus("done");
        }
      } catch (err) {
        console.error("Stream error:", err);
        if (!thisStream.aborted) {
          setStatus("error");
          setText("AI analysis temporarily unavailable. Review incident data in panels.");
        }
      }
    },
    []
  );

  // Trigger on new incident
  useEffect(() => {
    if (!incident) return;
    const incId = incident.id;
    if (incId === lastProcessedRef.current) return;
    lastProcessedRef.current = incId;
    triggerStream(incident, mode);
  }, [incident, triggerStream, mode]);

  // Re-trigger on mode change (only if already analyzed one)
  useEffect(() => {
    if (!incident || !lastProcessedRef.current) return;
    triggerStream(incident, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
              {status === "idle" ? "STANDBY" : status === "streaming" ? "ANALYZING..." : "READY"}
            </span>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: status === "idle" ? "var(--text-muted)" : "var(--accent-cyan)",
                boxShadow: status === "streaming" ? "0 0 10px var(--accent-cyan)" : "none",
                animation: status === "streaming" ? "cyber-pulse 1s infinite" : "none",
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
            {["analyst", "ceo"].map((m) => (
              <button
                key={m}
                onClick={() => onModeToggle && onModeToggle(m)}
                style={{
                  padding: "6px 14px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  border: "none",
                  background: mode === m ? "var(--accent-cyan)" : "transparent",
                  color: mode === m ? "#000" : "var(--text-secondary)",
                  fontWeight: "700",
                  transition: "all 0.2s",
                }}
              >
                {m.toUpperCase()}
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

      {/* Text area */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
        }}
      >
        {status === "idle" ? (
          <div style={{ color: "var(--text-muted)", fontSize: "14px", fontFamily: "var(--font-mono)", opacity: 0.7, lineHeight: 1.8 }}>
            <div>{">"} Awaiting threat telemetry...</div>
            <div>{">"} Defense sub-systems initialized.</div>
            <div>{">"} Select a pipeline event to begin AI co-analysis.</div>
          </div>
        ) : (
          <div
            className={status === "streaming" ? "sam-cursor" : ""}
            style={{
              color: isFP ? "var(--sev-benign-text)" : "var(--text-primary)",
              fontSize: "15px",
              lineHeight: "1.7",
              fontFamily: "var(--font-sans)",
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        )}
        {status === "thinking" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
            <div style={{ color: "var(--accent-cyan)", fontSize: "12px", letterSpacing: "0.1em" }}>ANALYZING THREAT DATA</div>
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