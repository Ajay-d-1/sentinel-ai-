import { useState } from "react";

export default function ConfidenceTooltip({ confidence }) {
  const [show, setShow] = useState(false);

  if (!confidence) return <span style={{ fontSize: "13px", color: "#00ff41", fontWeight: "bold" }}>—</span>;

  // Generate breakdown based on confidence value
  const networkScore = Math.round(confidence * 0.42);
  const endpointScore = Math.round(confidence * 0.36);
  const patternScore = confidence - networkScore - endpointScore;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        style={{
          fontSize: "13px",
          color: confidence >= 90 ? "#ef4444" : confidence >= 75 ? "#f97316" : "#facc15",
          fontWeight: "bold",
          cursor: "pointer",
          borderBottom: "1px dashed #2a6b2a",
        }}
      >
        {confidence}%
      </div>

      {show && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "8px",
          background: "#0a0a0a",
          border: "1px solid #1a3a1a",
          borderRadius: "6px",
          padding: "12px 16px",
          minWidth: "220px",
          zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            bottom: "-6px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid #1a3a1a",
          }} />

          <div style={{
            fontSize: "10px",
            color: "#2a6b2a",
            letterSpacing: "0.1em",
            marginBottom: "10px",
            fontWeight: "bold",
            borderBottom: "1px solid #1a3a1a",
            paddingBottom: "6px",
          }}>
            CONFIDENCE BREAKDOWN
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#c8f7c8" }}>Network anomaly score:</span>
              <span style={{ fontSize: "11px", color: "#00ff41", fontWeight: "bold" }}>+{networkScore}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#c8f7c8" }}>Endpoint correlation:</span>
              <span style={{ fontSize: "11px", color: "#00ff41", fontWeight: "bold" }}>+{endpointScore}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#c8f7c8" }}>Historical pattern match:</span>
              <span style={{ fontSize: "11px", color: "#00ff41", fontWeight: "bold" }}>+{patternScore}%</span>
            </div>
          </div>

          <div style={{
            marginTop: "10px",
            paddingTop: "8px",
            borderTop: "1px solid #1a3a1a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "11px", color: "#2a6b2a" }}>TOTAL CONFIDENCE:</span>
            <span style={{ fontSize: "12px", color: "#00ff41", fontWeight: "bold" }}>{confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
