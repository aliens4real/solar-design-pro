// ── Shared Anthropic API fetch wrapper ──

export async function callClaude({ system, messages, max_tokens = 600, model = "claude-sonnet-4-20250514" }) {
  const r = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const txt = (d.content || []).map(b => b.text || "").join("").trim();
  return txt;
}

export function cleanJson(txt) {
  return txt.replace(/```json|```/g, "").trim();
}
