const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function streamFromGroq(promptOrMessages, onChunk) {
  try {
    const isArray = Array.isArray(promptOrMessages)
    
    const systemMessage = {
      role: 'system',
      content: `You are Samantha, an elite AI cybersecurity analyst embedded in SENTINEL AI — a real-time SOC threat detection engine.

You have two briefing modes:
- ANALYST mode (SOC Engineer): Technical, precise, uses MITRE ATT&CK framework terminology. Short sharp sentences. Reference specific techniques, tactics, IOCs. Speak like a senior threat hunter finding and fixing vulnerabilities.
- CEO mode (Incident Commander): Plain English, zero jargon. Focus on coordinating response teams, business impact, risk exposure, and recommended executive action. Speak like a trusted incident commander briefing the response team.

Core capabilities you reference:
- Multi-layer signal correlation (Network + Endpoint + Application layers)
- Kill chain stage mapping (Reconnaissance → Initial Access → Execution → Lateral Movement → Exfiltration)
- Confidence scoring based on cross-layer evidence fusion
- False positive detection through behavioral baseline comparison
- MITRE ATT&CK technique and tactic mapping

Rules:
- Never say "I think" or "maybe" — you are confident and decisive
- Always mention the specific MITRE technique when in analyst mode
- Keep responses to 3-5 sentences maximum
- If it's a false positive, explain WHY it's benign with clear reasoning
- When severity is CRITICAL, convey urgency
- Reference cross-layer correlation when confidence is above 85%`,
    }

    let messages = isArray ? promptOrMessages : [{ role: 'user', content: promptOrMessages }]
    
    if (messages.length > 0 && messages[0].role !== 'system') {
      messages = [systemMessage, ...messages]
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        stream: true,
        temperature: 0.7,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', response.status, errText)
      onChunk(`[AI temporarily unavailable — Status ${response.status}. Incident data displayed above.]`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.delta?.content
          if (text) onChunk(text)
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    console.error('Groq stream error:', err)
    onChunk('[Network error — AI analysis unavailable. Review incident data manually.]')
  }
}

export function buildPrompt(incident, mode) {
  const stage = incident.stage || 'UNKNOWN'
  const threat = incident.threat_type || 'UNKNOWN_THREAT'
  const severity = incident.severity || 'UNKNOWN'
  const mitre = incident.mitre_technique || 'N/A'
  const mitreTactic = incident.mitre_tactic || 'N/A'
  const confidence = incident.confidence || 0
  const isFP = incident.is_false_positive
  const layers = incident.layers_involved || []
  const correlated = incident.correlated

  if (isFP) {
    return mode === 'ceo'
      ? `A ${threat} alert was triggered but our AI engine already verified it is a false positive. Explain in plain English why no action is needed and how this saves the team time. Reason: ${incident.false_positive_reason || 'Behavioral baseline match'}`
      : `False positive detected. Threat: ${threat}. Stage: ${stage}. MITRE: ${mitre} (${mitreTactic}). Confidence: ${confidence}%. Reason: ${incident.false_positive_reason || 'Behavioral baseline match'}. Confirm BENIGN classification and explain your confidence using cross-layer analysis.`
  }

  const layerStr = layers.length > 0 ? `Layers involved: ${layers.join(', ')}.` : ''
  const corrStr = correlated ? 'Cross-layer correlation CONFIRMED — high-confidence incident.' : ''

  return mode === 'ceo'
    ? `A ${severity} severity ${threat} attack has been detected in the ${stage} stage of the kill chain. Confidence: ${confidence}%. ${corrStr} Explain what is happening, what the business risk is, and what action the executive team should take RIGHT NOW.`
    : `INCIDENT BRIEF: ${threat} detected at kill chain stage ${stage}. Severity: ${severity}. Confidence: ${confidence}%. MITRE ATT&CK: ${mitre} (Tactic: ${mitreTactic}). ${layerStr} ${corrStr} Provide rapid technical assessment, evidence indicators, and recommended immediate containment action.`
}