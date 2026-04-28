import type { Finding, Report } from "../types.js";

export function formatHtml(report: Report): string {
  const findingCards = report.findings.length === 0
    ? `<section class="empty"><h2>No findings</h2><p>No findings across checked surfaces. Review project-specific risks before release.</p></section>`
    : report.findings.map(formatFindingCard).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>Agent Reliability Report</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17202a;
      --muted: #5d6875;
      --paper: #f6f8fb;
      --panel: #ffffff;
      --soft: #eef3f8;
      --line: #d6dde8;
      --green: #1f7a5b;
      --blue: #245da8;
      --amber: #aa620f;
      --red: #b42318;
      --shadow: 0 18px 48px rgba(23, 32, 42, .10);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      overflow-x: hidden;
      background:
        linear-gradient(90deg, rgba(36, 93, 168, .05) 1px, transparent 1px),
        linear-gradient(0deg, rgba(23, 32, 42, .04) 1px, transparent 1px),
        var(--paper);
      background-size: 34px 34px;
    }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 44px 0 64px; }
    .hero {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 28px;
      align-items: stretch;
      margin-bottom: 24px;
    }
    .title, .score, .finding, .empty, .facts {
      background: rgba(255,255,255,.94);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .title { padding: 34px; }
    .eyebrow {
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
      letter-spacing: 0;
      text-transform: uppercase;
      color: var(--blue);
      font-weight: 800;
    }
    h1 { font-size: 58px; line-height: .95; margin: 18px 0; letter-spacing: 0; max-width: 12ch; overflow-wrap: anywhere; word-break: normal; }
    h2 { margin: 0 0 12px; font-size: 22px; overflow-wrap: anywhere; }
    p { color: var(--muted); font-size: 16px; line-height: 1.55; overflow-wrap: anywhere; }
    .score { padding: 30px; display: grid; align-content: space-between; min-height: 280px; }
    .score-number { font-size: 94px; line-height: 1; font-weight: 900; }
    .grade { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: var(--ink); color: var(--paper); font-size: 34px; font-weight: 900; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 24px 0; }
    .stat { background: var(--panel); border: 1px solid var(--line); padding: 14px; min-height: 82px; }
    .stat strong { display: block; font-size: 28px; }
    .stat span { color: var(--muted); font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
    .facts { padding: 22px; margin-bottom: 18px; }
    .facts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .fact { border-left: 4px solid var(--blue); background: var(--soft); padding: 12px; overflow-wrap: anywhere; min-width: 0; border-radius: 6px; }
    .findings { display: grid; gap: 14px; }
    .finding { padding: 20px; border-left: 8px solid var(--line); }
    .finding.critical { border-left-color: var(--red); }
    .finding.high { border-left-color: #d13b2f; }
    .finding.medium { border-left-color: var(--amber); }
    .finding.low { border-left-color: var(--blue); }
    .finding.info { border-left-color: var(--green); }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .pill { border: 1px solid var(--line); background: var(--soft); padding: 5px 8px; border-radius: 6px; font: 12px ui-monospace, Consolas, monospace; overflow-wrap: anywhere; }
    .label { color: var(--ink); font-weight: 800; }
    .evidence {
      display: block;
      width: 100%;
      max-width: 100%;
      margin-top: 8px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfcfe;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    code { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; overflow-wrap: anywhere; }
    .empty { padding: 28px; }
    @media (max-width: 820px) {
      main { width: calc(100% - 24px); max-width: 1120px; padding: 24px 0 40px; }
      .hero, .facts-grid { grid-template-columns: 1fr; }
      .hero > *, .facts-grid > * { min-width: 0; }
      h1 { font-size: 32px; line-height: 1; max-width: 12ch; }
      p { max-width: 26ch; }
      .title, .score, .finding, .empty, .facts { padding: 18px; }
      .score { min-height: 190px; }
      .score-number { font-size: 72px; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="title">
        <div class="eyebrow">Agent Reliability Kit</div>
        <h1>Agent-ready repository report</h1>
        <p>Local-first checks for AI coding agents, CI proof, secret hygiene, README quality, and MCP/tooling risk.</p>
      </div>
      <aside class="score">
        <div>
          <div class="eyebrow">Score</div>
          <div class="score-number">${report.score}</div>
        </div>
        <div class="grade">${report.grade}</div>
      </aside>
    </section>
    <section class="stats">
      ${stat("Critical", report.summary.critical)}
      ${stat("High", report.summary.high)}
      ${stat("Medium", report.summary.medium)}
      ${stat("Low", report.summary.low)}
      ${stat("Total", report.summary.total)}
    </section>
    <section class="facts">
      <h2>Repository Signals</h2>
      <div class="facts-grid">
        ${fact("Agent files", report.facts.agentInstructionFiles)}
        ${fact("Commands", report.facts.detectedCommands)}
        ${fact("Workflows", report.facts.workflows)}
      </div>
    </section>
    <section class="findings">${findingCards}</section>
  </main>
</body>
</html>`;
}

function stat(label: string, value: number): string {
  return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function fact(label: string, value: unknown): string {
  const content = Array.isArray(value) && value.length > 0 ? value.map((item) => `<code>${escapeHtml(String(item))}</code>`).join("<br>") : "none";
  return `<div class="fact"><strong>${escapeHtml(label)}</strong><p>${content}</p></div>`;
}

function formatFindingCard(finding: Finding): string {
  const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "repository";
  return `<article class="finding ${finding.severity}">
    <h2>${escapeHtml(finding.title)}</h2>
    <div class="meta">
      <span class="pill">Severity: ${escapeHtml(finding.severity)}</span>
      <span class="pill">Rule: ${escapeHtml(finding.id)}</span>
      <span class="pill">File: ${escapeHtml(location)}</span>
    </div>
    <p><strong>Reason:</strong> ${escapeHtml(finding.why)}</p>
    <p><strong>Next action:</strong> ${escapeHtml(finding.next)}</p>
    ${finding.evidence ? `<p><span class="label">Evidence:</span><code class="evidence">${escapeHtml(finding.evidence)}</code></p>` : ""}
  </article>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
