// Repo Foundry — 5 sketchy wireframes
// Each is a low-fi homepage exploration. Hand-drawn vibe, mostly b&w, one accent per direction.

const W = 1280;
const H = 820;

// ───────── shared sketch primitives ─────────

const sketchStyles = `
.wf {
  width: 100%; height: 100%;
  background: #faf7f1;
  color: #1a1614;
  font-family: 'Patrick Hand', 'Caveat', cursive;
  font-size: 17px;
  line-height: 1.25;
  position: relative;
  overflow: hidden;
  --ink: #1a1614;
  --ink-2: #3a342f;
  --ink-3: #6b635c;
  --paper: #faf7f1;
  --paper-2: #efeae0;
  --accent: #d4a72c;
}
.wf .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.02em; }
.wf .ui { font-family: 'Inter', system-ui, sans-serif; }

.wf-tag {
  position: absolute; top: 14px; left: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-3);
}
.wf-tag b { color: var(--accent); font-weight: 600; }

.wf-tech {
  position: absolute; bottom: 14px; right: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-3); text-align: right;
  max-width: 360px;
}
.wf-tech b { color: var(--accent); font-weight: 600; }

/* sketchy box helper */
.box { border: 1.5px dashed var(--ink-2); border-radius: 6px; background: rgba(255,255,255,0.35); }
.box-solid { border: 1.5px solid var(--ink-2); border-radius: 6px; background: rgba(255,255,255,0.6); }
.box-fill { border: 1.5px solid var(--ink); border-radius: 6px; background: var(--ink); color: var(--paper); }

.scrib { background-image: repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 7px); }
.scrib-h { background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 1.5px, transparent 1.5px 6px); }

.kbd {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  border: 1px solid var(--ink-2); border-bottom-width: 2px;
  border-radius: 3px; padding: 1px 5px; background: var(--paper-2);
  color: var(--ink-2);
}

.tinytext { font-size: 10px; line-height: 1.3; color: var(--ink-3); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
.eyebrow { font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-3); font-family: 'JetBrains Mono', monospace; }

/* swiggle underline */
.swig {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3' fill='none' stroke='%231a1614' stroke-width='1.2'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: 0 100%;
  padding-bottom: 6px;
}

/* arrow marker */
.arr::after { content: '→'; color: var(--accent); margin-left: 6px; font-family: 'JetBrains Mono', monospace; }
`;

function Sketch({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sketchStyles }} />
      {children}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// 01 — STEAM LIBRARY
// Left rail of lanes, hero "featured repo", horizontal shelves below.
// Tech: CSS view-transitions for shelf→dossier morph
// ─────────────────────────────────────────────────────────

function W01_Steam() {
  const Lane = ({ n, label, count, active }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 4,
      background: active ? 'rgba(67,181,129,0.18)' : 'transparent',
      borderLeft: active ? '2px solid #43b581' : '2px solid transparent',
      fontSize: 14, color: active ? 'var(--ink)' : 'var(--ink-2)',
    }}>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', width: 18 }}>{n}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{count}</span>
    </div>
  );
  const Card = ({ title, tag, stars }) => (
    <div style={{ flex: '0 0 200px' }}>
      <div className="box scrib" style={{ height: 112, marginBottom: 6, position: 'relative' }}>
        <div className="tinytext" style={{ position: 'absolute', top: 4, left: 6 }}>[screenshot]</div>
        <div className="mono" style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, background: 'rgba(255,255,255,0.7)', padding: '1px 4px', borderRadius: 2 }}>{stars}</div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.15 }}>{title}</div>
      <div className="tinytext" style={{ marginTop: 2 }}>{tag}</div>
    </div>
  );
  const Shelf = ({ title, count, children }) => (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <div className="swig" style={{ fontSize: 18 }}>{title}</div>
        <div className="tinytext">{count} repos</div>
        <div style={{ flex: 1 }} />
        <div className="tinytext arr">see lane</div>
      </div>
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>{children}</div>
    </div>
  );

  return (
    <Sketch>
      <div className="wf" style={{ '--accent': '#43b581' }}>
        <div className="wf-tag">01 / <b>Steam Library</b> · left rail + shelves</div>

        {/* layout */}
        <div style={{ position: 'absolute', inset: '44px 24px 50px 24px', display: 'flex', gap: 18 }}>

          {/* left rail */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="eyebrow">workspace</div>
              <div style={{ fontSize: 22, marginTop: 2 }}>Repo<br />Foundry.</div>
              <div className="tinytext" style={{ marginTop: 4 }}>247 tracked · updated 14:02</div>
            </div>

            <div className="box-solid" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>⌕</span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>search the foundry…</span>
              <span style={{ flex: 1 }} />
              <span className="kbd">⌘K</span>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>my lanes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Lane n="01" label="AI Agents" count="42" active />
                <Lane n="02" label="MCP Servers" count="31" />
                <Lane n="03" label="Coding Agents" count="28" />
                <Lane n="04" label="Eval Harnesses" count="19" />
                <Lane n="05" label="CLIs & Shells" count="36" />
                <Lane n="06" label="Workflow Auto." count="24" />
                <Lane n="07" label="Game Engines" count="22" />
                <Lane n="08" label="Creator Systems" count="45" />
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>recently viewed</div>
              <div className="tinytext" style={{ lineHeight: 1.5 }}>
                anthropic/codex-cli<br />
                modelcontext/sdk-py<br />
                openai/swarm
              </div>
            </div>
          </div>

          {/* main */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* hero featured */}
            <div className="box-solid" style={{ display: 'flex', height: 240, padding: 0, overflow: 'hidden' }}>
              <div className="scrib" style={{ flex: 1.4, borderRight: '1.5px solid var(--ink-2)', position: 'relative' }}>
                <div className="tinytext" style={{ position: 'absolute', top: 8, left: 10 }}>[ hero screenshot / repo README art ]</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(transparent, rgba(255,255,255,0.85))' }}>
                  <div className="eyebrow">featured dossier · week 20</div>
                  <div style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>anthropic / codex‑cli</div>
                </div>
              </div>
              <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="tinytext">why it matters</div>
                <div style={{ fontSize: 14, lineHeight: 1.35 }}>
                  Reference implementation of the agent‑coder stack — moved from POC to <em>weapon</em> in 6 weeks.
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div><div className="tinytext">stars</div><div className="mono" style={{ fontSize: 22 }}>12.4k</div></div>
                  <div><div className="tinytext">★/day</div><div className="mono" style={{ fontSize: 22, color: 'var(--accent)' }}>+320</div></div>
                  <div><div className="tinytext">last release</div><div className="mono" style={{ fontSize: 13, marginTop: 4 }}>v0.18.2 · 3d</div></div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="box-fill" style={{ padding: '6px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>OPEN DOSSIER →</div>
                  <div className="box-solid" style={{ padding: '6px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>GITHUB ↗</div>
                </div>
              </div>
            </div>

            <Shelf title="Recently updated" count="38">
              <Card title="modelcontext / sdk-py" tag="MCP · v1.4 · 3h ago" stars="★ 8.1k" />
              <Card title="openai / swarm" tag="Agent · 7h ago" stars="★ 6.3k" />
              <Card title="vllm-project / vllm" tag="Runtime · 11h ago" stars="★ 28k" />
              <Card title="all-hands-ai / openhands" tag="Agent · 1d ago" stars="★ 31k" />
              <Card title="cline / cline" tag="IDE agent · 1d ago" stars="★ 19k" />
            </Shelf>

            <Shelf title="New this week" count="12">
              <Card title="exo-explore / exo" tag="Distributed · NEW" stars="★ 2.1k" />
              <Card title="stagehand / stagehand" tag="Browser agent" stars="★ 4.4k" />
              <Card title="composio / composio" tag="Tool infra" stars="★ 7.8k" />
              <Card title="livekit / agents" tag="Voice · NEW" stars="★ 3.2k" />
              <Card title="zed-industries / zed" tag="Editor" stars="★ 49k" />
            </Shelf>

          </div>
        </div>

        <div className="wf-tech">
          tech moment: <b>view transitions</b> on shelf → dossier &nbsp;·&nbsp; container queries for lane shelves
        </div>
      </div>
    </Sketch>
  );
}

// ─────────────────────────────────────────────────────────
// 02 — ESPORTS HUD / AGENT SELECT
// Top telemetry bar, central agent-select grid, side detail panel, scoreboard footer.
// Tech: scroll-driven animations for stat tickers; @container for grid response
// ─────────────────────────────────────────────────────────

function W02_Esports() {
  const Stat = ({ label, val, delta }) => (
    <div style={{ flex: 1, padding: '6px 12px', borderRight: '1.5px solid var(--ink-2)' }}>
      <div className="tinytext">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="mono" style={{ fontSize: 22, color: 'var(--accent)' }}>{val}</div>
        <div className="tinytext" style={{ color: delta?.startsWith('+') ? 'var(--accent)' : 'var(--ink-3)' }}>{delta}</div>
      </div>
    </div>
  );

  const Agent = ({ id, name, role, hot, sel }) => (
    <div className={sel ? 'box-fill' : 'box-solid'} style={{
      position: 'relative', aspectRatio: '0.78', padding: 0, overflow: 'hidden',
      boxShadow: hot ? '0 0 0 2px var(--accent)' : 'none',
    }}>
      <div className="scrib" style={{ position: 'absolute', inset: 0, opacity: sel ? 0.18 : 0.6 }} />
      <div className="mono" style={{ position: 'absolute', top: 4, left: 6, fontSize: 9, opacity: 0.7 }}>{id}</div>
      {hot && <div className="mono" style={{ position: 'absolute', top: 4, right: 6, fontSize: 8, padding: '1px 4px', background: 'var(--accent)', color: '#1a1614', borderRadius: 2, letterSpacing: 0.1 }}>HOT</div>}
      <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
        <div style={{ fontSize: 13, lineHeight: 1, fontFamily: "'Patrick Hand', cursive" }}>{name}</div>
        <div className="tinytext" style={{ marginTop: 2, color: sel ? 'rgba(250,247,241,0.6)' : 'var(--ink-3)' }}>{role}</div>
      </div>
    </div>
  );

  const HistoryRow = ({ t, msg, sha }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px dashed var(--ink-2)' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', width: 36 }}>{t}</div>
      <div style={{ flex: 1, fontSize: 12 }}>{msg}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{sha}</div>
    </div>
  );

  return (
    <Sketch>
      <div className="wf" style={{ '--accent': '#ff2d6e', background: '#0e0c10', color: '#f3eee6' }}>
        <style>{`
          .wf .box, .wf .box-solid { border-color: rgba(243,238,230,0.55); background: rgba(243,238,230,0.04); color: inherit; }
          .wf .box-fill { background: #f3eee6; color: #0e0c10; border-color: #f3eee6; }
          .wf .swig { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3' fill='none' stroke='%23f3eee6' stroke-width='1.2'/%3E%3C/svg%3E"); }
          .wf .tinytext, .wf .eyebrow { color: rgba(243,238,230,0.55); }
          .wf .scrib { background-image: repeating-linear-gradient(135deg, rgba(243,238,230,0.08) 0 2px, transparent 2px 7px); }
        `}</style>
        <div className="wf-tag" style={{ color: 'rgba(243,238,230,0.55)' }}>02 / <b style={{ color: 'var(--accent)' }}>Esports HUD</b> · agent select grid</div>

        <div style={{ position: 'absolute', inset: '44px 24px 50px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* telemetry bar */}
          <div className="box-solid" style={{ display: 'flex', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '6px 14px', borderRight: '1.5px solid rgba(243,238,230,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              <span className="mono" style={{ fontSize: 11, letterSpacing: 0.18 }}>FOUNDRY FEED · LIVE</span>
            </div>
            <Stat label="trending ★/h" val="1,284" delta="+22%" />
            <Stat label="new releases today" val="47" delta="+12" />
            <Stat label="active contributors" val="9.2k" delta="↑" />
            <Stat label="repos tracked" val="247" delta="" />
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11 }}>14:02:38 UTC</span>
            </div>
          </div>

          {/* main 3-column: title • agent grid • detail panel */}
          <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

            <div style={{ width: 220, display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow">// repo.foundry</div>
              <div style={{ fontSize: 44, lineHeight: 0.95, marginTop: 6 }}>SELECT<br /><span style={{ color: 'var(--accent)' }}>YOUR</span><br />WEAPON.</div>
              <div className="tinytext" style={{ marginTop: 10, lineHeight: 1.5 }}>
                247 repos across the agent‑coder stack — pick a fighter for the week, study the kit, deploy the dossier.
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="eyebrow">filter by lane</div>
                {['ALL', 'AGENTS', 'MCP', 'CLIs', 'RUNTIMES', 'EVAL'].map((l, i) => (
                  <div key={l} className="mono" style={{ fontSize: 11, padding: '3px 8px', border: '1px solid rgba(243,238,230,0.55)', borderRadius: 3, opacity: i === 0 ? 1 : 0.55 }}>
                    {i === 0 && '▸ '}{l}
                  </div>
                ))}
              </div>
            </div>

            {/* agent grid */}
            <div style={{ flex: 1.4, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <Agent id="A01" name="codex-cli" role="DUELIST" hot sel />
              <Agent id="A02" name="swarm" role="CONTROLLER" />
              <Agent id="A03" name="openhands" role="INITIATOR" />
              <Agent id="A04" name="cline" role="DUELIST" hot />
              <Agent id="A05" name="vllm" role="SENTINEL" />
              <Agent id="A06" name="stagehand" role="FLEX" />
              <Agent id="A07" name="composio" role="SUPPORT" />
              <Agent id="A08" name="sdk-py" role="ANCHOR" />
            </div>

            {/* detail */}
            <div className="box-solid" style={{ width: 260, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="eyebrow">selected · A01</div>
              <div style={{ fontSize: 22, lineHeight: 1 }}>codex‑cli</div>
              <div className="tinytext">anthropic · agent‑coder reference</div>

              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {['HP', 'DMG', 'SPD', 'DEF'].map((s, i) => (
                  <div key={s} style={{ flex: 1 }}>
                    <div className="tinytext">{s}</div>
                    <div style={{ height: 4, background: 'rgba(243,238,230,0.15)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ height: '100%', width: ['92%', '88%', '70%', '54%'][i], background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6 }}>
                <div className="eyebrow">match history · last 24h</div>
                <div style={{ marginTop: 6 }}>
                  <HistoryRow t="14:02" msg="feat: streaming tool calls" sha="a4f2c1" />
                  <HistoryRow t="11:38" msg="fix(mcp): handshake timeout" sha="9b80de" />
                  <HistoryRow t="09:15" msg="docs: agent loops" sha="2c0411" />
                  <HistoryRow t="06:44" msg="release: v0.18.2" sha="71aa3e" />
                </div>
              </div>

              <div style={{ flex: 1 }} />
              <div className="box-fill" style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', letterSpacing: 0.15 }}>
                LOCK IN AGENT →
              </div>
            </div>
          </div>

          {/* scoreboard footer */}
          <div className="box-solid" style={{ padding: '6px 14px', display: 'flex', gap: 18, alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>▸ SCOREBOARD</div>
            {['anthropic/codex-cli ★+320', 'cline/cline ★+264', 'openhands ★+201', 'stagehand ★+188', 'composio ★+142', 'exo ★+118'].map((s, i) => (
              <div key={i} className="mono" style={{ fontSize: 11, color: i === 0 ? 'var(--accent)' : 'rgba(243,238,230,0.7)' }}>{s}</div>
            ))}
          </div>
        </div>

        <div className="wf-tech" style={{ color: 'rgba(243,238,230,0.55)' }}>
          tech moment: <b style={{ color: 'var(--accent)' }}>scroll-driven anim</b> on telemetry · container queries · view-transitions on agent lock-in
        </div>
      </div>
    </Sketch>
  );
}

// ─────────────────────────────────────────────────────────
// 03 — TERMINAL / BBS
// Monospace top-to-bottom. ASCII logo. Repo rows as text. News dump sidebar.
// Tech: anchor positioning for inline detail popovers; CRT scanlines
// ─────────────────────────────────────────────────────────

function W03_Terminal() {
  const Row = ({ idx, name, lane, stars, delta, age, hot }) => (
    <div className="mono" style={{
      display: 'grid', gridTemplateColumns: '24px 1fr 90px 70px 60px 60px', gap: 10,
      padding: '3px 8px', fontSize: 12, alignItems: 'center',
      borderLeft: hot ? '2px solid var(--accent)' : '2px solid transparent',
      background: hot ? 'rgba(40,209,114,0.06)' : 'transparent',
    }}>
      <span style={{ color: 'var(--accent)' }}>›</span>
      <span style={{ color: 'var(--ink)' }}>{name}</span>
      <span style={{ color: 'var(--ink-3)' }}>{lane}</span>
      <span style={{ color: 'var(--ink-2)' }}>★ {stars}</span>
      <span style={{ color: 'var(--accent)' }}>{delta}</span>
      <span style={{ color: 'var(--ink-3)' }}>{age}</span>
    </div>
  );
  const News = ({ t, src, msg }) => (
    <div style={{ padding: '6px 0', borderBottom: '1px dashed var(--ink-2)' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t} · {src}</div>
      <div className="mono" style={{ fontSize: 12, marginTop: 2 }}>{msg}</div>
    </div>
  );

  return (
    <Sketch>
      <div className="wf" style={{ '--accent': '#28a745', background: '#0a0c08', color: '#d4e3c8' }}>
        <style>{`
          .wf .box, .wf .box-solid { border-color: rgba(212,227,200,0.4); background: transparent; color: inherit; }
          .wf .box-fill { background: var(--accent); color: #0a0c08; border-color: var(--accent); }
          .wf .tinytext, .wf .eyebrow { color: rgba(212,227,200,0.55); }
          .wf::before {
            content: ''; position: absolute; inset: 0; pointer-events: none;
            background: repeating-linear-gradient(0deg, rgba(212,227,200,0.04) 0 1px, transparent 1px 3px);
            mix-blend-mode: screen;
          }
        `}</style>
        <div className="wf-tag" style={{ color: 'rgba(212,227,200,0.55)' }}>03 / <b style={{ color: 'var(--accent)' }}>Terminal · BBS</b> · monospace everything</div>

        <div style={{ position: 'absolute', inset: '44px 24px 50px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ASCII header */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <pre className="mono" style={{ fontSize: 11, lineHeight: 1.1, color: 'var(--accent)', margin: 0 }}>{`
 ____                  ____                      __
/\\  _\\\\               /\\  _\\\\                  /\\ \\
\\ \\ \\_/  __  ___ \\___ \\ \\ \\_/  ___  __  __    __\\ \\ \\__  ___ __  __
 \\ \\ \\__/ __\\/ ' _\` __\\\\ \\ \\__/ __\\/\\ \\/\\ \\  /'_\`\\\\ \\  _ \\/' _ \`\\\\ \\/'__\`
  \\ \\_\\\\___/\\ \\_/\\ \\/  \\ \\_\\\\___/ \\ \\ \\_\\ \\/\\ \\L\\ \\\\ \\ \\_\\ \\ \\/\\ \\\\__/\\__
   \\/_/\\____/\\_\\\\ \\_\\   \\/_/\\____/\\ \\____/\\ \\____/  \\ \\____\\\\ \\_\\ \\_\\\\____\\
                                  \\/___/  \\/___/    \\/___/  \\/_/\\/_/\\/____/
            `}</pre>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>kernel · foundry v1.2</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>● uplink 14:02:38 UTC</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>247 repos · 12 lanes</div>
            </div>
          </div>

          {/* command line */}
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--accent)' }}>kol@foundry</span>
            <span>:~</span>
            <span style={{ color: 'var(--ink-3)' }}>$</span>
            <span>list --lane=agents --sort=stars/d --limit=12</span>
            <span style={{ flex: 1 }} />
            <span className="kbd" style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor' }}>/</span>
            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>fuzzy</span>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

            {/* repo table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="mono" style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 90px 70px 60px 60px', gap: 10,
                padding: '3px 8px', fontSize: 10, color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-2)', textTransform: 'uppercase', letterSpacing: 0.1,
              }}>
                <span>#</span><span>repo</span><span>lane</span><span>stars</span><span>Δ/day</span><span>last</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <Row idx="001" name="anthropic/codex-cli" lane="agents" stars="12.4k" delta="+320" age="3h" hot />
                <Row idx="002" name="cline/cline" lane="ide-agent" stars="19.0k" delta="+264" age="1d" hot />
                <Row idx="003" name="all-hands-ai/openhands" lane="agents" stars="31.2k" delta="+201" age="7h" />
                <Row idx="004" name="modelcontext/sdk-py" lane="mcp" stars="8.1k" delta="+188" age="3h" />
                <Row idx="005" name="stagehand/stagehand" lane="agents" stars="4.4k" delta="+142" age="11h" />
                <Row idx="006" name="composio/composio" lane="infra" stars="7.8k" delta="+118" age="18h" />
                <Row idx="007" name="openai/swarm" lane="agents" stars="6.3k" delta="+94" age="7h" />
                <Row idx="008" name="vllm-project/vllm" lane="runtimes" stars="28k" delta="+88" age="11h" />
                <Row idx="009" name="exo-explore/exo" lane="distributed" stars="2.1k" delta="+71" age="2d" />
                <Row idx="010" name="zed-industries/zed" lane="editors" stars="49k" delta="+62" age="1d" />
                <Row idx="011" name="livekit/agents" lane="voice" stars="3.2k" delta="+54" age="2d" />
                <Row idx="012" name="block/goose" lane="agents" stars="11k" delta="+47" age="6h" />
              </div>
              <div className="mono" style={{ marginTop: 'auto', padding: '6px 8px', fontSize: 10, color: 'var(--ink-3)', borderTop: '1px dashed var(--ink-2)' }}>
                showing 12 of 42 · <span style={{ color: 'var(--accent)' }}>j/k</span> nav · <span style={{ color: 'var(--accent)' }}>↵</span> open dossier · <span style={{ color: 'var(--accent)' }}>?</span> help
              </div>
            </div>

            {/* news dump */}
            <div style={{ width: 280, borderLeft: '1px dashed var(--ink-2)', paddingLeft: 14, display: 'flex', flexDirection: 'column' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.18 }}>// news.dump</div>
              <div style={{ marginTop: 4, flex: 1, overflow: 'hidden' }}>
                <News t="14:02" src="lobsters" msg="Anthropic releases codex-cli v0.18.2" />
                <News t="13:14" src="hn" msg="Why MCP is the new LSP" />
                <News t="11:08" src="gh-blog" msg="GitHub Releases gets agent webhooks" />
                <News t="09:42" src="lobsters" msg="OpenHands hits 30k stars" />
                <News t="08:30" src="hn" msg="vLLM benchmark sweep — May 2026" />
                <News t="06:15" src="oss-rss" msg="Cline maintainers post governance update" />
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>tail -f /news</div>
            </div>
          </div>
        </div>

        <div className="wf-tech" style={{ color: 'rgba(212,227,200,0.55)' }}>
          tech moment: <b style={{ color: 'var(--accent)' }}>CSS anchor positioning</b> for inline detail popovers · CRT scanlines · keyboard nav
        </div>
      </div>
    </Sketch>
  );
}

// ─────────────────────────────────────────────────────────
// 04 — POKÉDEX / TRADING-CARD COLLECTOR
// Repos as collectible cards with stat bars. Catalogue feel.
// Tech: View Transitions for card-flip into dossier
// ─────────────────────────────────────────────────────────

function W04_Pokedex() {
  const Card = ({ n, name, type, hp, art, sel }) => (
    <div className={sel ? 'box-fill' : 'box-solid'} style={{
      aspectRatio: '0.72', padding: 6, display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: sel ? '0 0 0 2px var(--accent), 0 6px 0 -2px var(--accent)' : 'none',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
        <span className="mono" style={{ opacity: 0.6 }}>#{n}</span>
        <span className="mono" style={{ padding: '1px 5px', border: '1px solid currentColor', borderRadius: 8, fontSize: 9, letterSpacing: 0.1 }}>{type}</span>
      </div>
      <div className="box scrib" style={{ flex: 1, borderColor: 'currentColor', position: 'relative', background: art }}>
        <div className="tinytext" style={{ position: 'absolute', bottom: 4, left: 6, color: sel ? 'rgba(250,247,241,0.7)' : undefined }}>[poster]</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1 }}>{name}</div>
      <div className="mono" style={{ fontSize: 10, opacity: 0.7 }}>HP {hp} · LV {Math.floor(parseInt(hp) / 6)}</div>
    </div>
  );

  return (
    <Sketch>
      <div className="wf" style={{ '--accent': '#d4a72c' }}>
        <div className="wf-tag">04 / <b>Foundry Dex</b> · trading-card collector</div>

        <div style={{ position: 'absolute', inset: '44px 24px 50px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div>
              <div className="eyebrow">catalogue</div>
              <div style={{ fontSize: 36, lineHeight: 0.95 }}>The Foundry <span style={{ color: 'var(--accent)' }}>Dex.</span></div>
              <div className="tinytext" style={{ marginTop: 6 }}>247 / ∞ repos logged · ⌖ 42 in lane: AI Agents</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ k: 'ALL', a: 1 }, { k: 'AGENT', a: 1 }, { k: 'MCP' }, { k: 'CLI' }, { k: 'INFRA' }, { k: 'CREATOR' }, { k: 'GAME' }].map((t, i) => (
                <div key={t.k} className="mono" style={{
                  fontSize: 10, padding: '4px 9px', border: '1.5px solid var(--ink-2)', borderRadius: 12,
                  background: t.a ? 'var(--ink)' : 'transparent', color: t.a ? 'var(--paper)' : 'var(--ink-2)',
                }}>{t.k}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, gap: 18, minHeight: 0 }}>

            {/* grid */}
            <div style={{ flex: 1.6, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 10 }}>
              <Card n="001" name="codex-cli" type="AGENT" hp="124" art="linear-gradient(135deg, #faf7f1, #efeae0)" sel />
              <Card n="002" name="cline" type="AGENT" hp="190" art="linear-gradient(135deg, #f3eee3, #e8e0cd)" />
              <Card n="003" name="openhands" type="AGENT" hp="312" art="linear-gradient(135deg, #f7f1e2, #ebdfc4)" />
              <Card n="004" name="swarm" type="AGENT" hp="63" art="linear-gradient(135deg, #efeae0, #d8d0c0)" />
              <Card n="005" name="sdk-py" type="MCP" hp="81" art="linear-gradient(135deg, #fcf4e0, #f3e3b8)" />
              <Card n="006" name="stagehand" type="AGENT" hp="44" art="linear-gradient(135deg, #f5efe2, #e5d9bf)" />
              <Card n="007" name="composio" type="INFRA" hp="78" art="linear-gradient(135deg, #ede6d4, #d1c4a0)" />
              <Card n="008" name="vllm" type="RUNTIME" hp="280" art="linear-gradient(135deg, #f4ecd6, #e6d3a8)" />
              <Card n="009" name="exo" type="DIST" hp="21" art="linear-gradient(135deg, #f1ecdd, #dccfae)" />
              <Card n="010" name="zed" type="EDITOR" hp="490" art="linear-gradient(135deg, #efe9d7, #d8c89b)" />
            </div>

            {/* featured spread */}
            <div className="box-solid" style={{ width: 290, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="eyebrow">featured · #001</div>
              <div style={{ fontSize: 28, lineHeight: 1 }}>codex‑cli</div>
              <div className="tinytext">anthropic · AGENT type</div>

              <div className="box scrib" style={{ height: 140, marginTop: 6 }}>
                <div className="tinytext" style={{ padding: 6 }}>[card art — full bleed]</div>
              </div>

              <div className="eyebrow" style={{ marginTop: 4 }}>stat block</div>
              {[
                ['stars', '12.4k', '93'],
                ['velocity', '+320 ★/d', '88'],
                ['contribs', '184', '72'],
                ['cadence', 'weekly', '95'],
              ].map(([l, v, w]) => (
                <div key={l} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 50px', gap: 8, alignItems: 'center', fontSize: 11 }}>
                  <span className="mono" style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.1 }}>{l}</span>
                  <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--ink-2)' }}>
                    <div style={{ height: '100%', width: `${w}%`, background: 'var(--accent)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10, textAlign: 'right' }}>{v}</span>
                </div>
              ))}

              <div style={{ flex: 1 }} />
              <div className="box-fill" style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', letterSpacing: 0.15 }}>
                FLIP CARD → DOSSIER
              </div>
            </div>
          </div>

          {/* footer rail */}
          <div className="mono" style={{ display: 'flex', gap: 18, fontSize: 11, color: 'var(--ink-3)' }}>
            <span>showing 10 of 247</span>
            <span style={{ color: 'var(--accent)' }}>● 3 new this week</span>
            <span>completion: 247 / ∞</span>
            <span style={{ flex: 1 }} />
            <span>sort: stars ▾</span>
            <span>view: grid ▾</span>
          </div>
        </div>

        <div className="wf-tech">
          tech moment: <b>view transitions</b> · card flip → dossier &nbsp;·&nbsp; popover API for filters · holo-foil with CSS @property gradients
        </div>
      </div>
    </Sketch>
  );
}

// ─────────────────────────────────────────────────────────
// 05 — CONSOLE OS DASHBOARD (PS5/Xbox)
// Big tiles. Focus-driven. Cinematic hero. Background ambient.
// Tech: WebGL/Canvas ambient bg + native <dialog> deep-link
// ─────────────────────────────────────────────────────────

function W05_ConsoleOS() {
  const RowCard = ({ title, sub, w = 180, hot, hero }) => (
    <div className={hero ? 'box-fill' : 'box-solid'} style={{
      flex: `0 0 ${w}px`, height: hero ? 180 : 120, padding: 0,
      position: 'relative', overflow: 'hidden',
      boxShadow: hot ? '0 0 0 2px var(--accent), 0 0 20px rgba(124,92,255,0.4)' : 'none',
    }}>
      <div className="scrib" style={{ position: 'absolute', inset: 0, opacity: hero ? 0.18 : 0.5 }} />
      {hot && <div className="mono" style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', background: 'var(--accent)', color: '#0c0a14', borderRadius: 2, letterSpacing: 0.1 }}>NEW</div>}
      <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8 }}>
        <div style={{ fontSize: hero ? 18 : 13, lineHeight: 1 }}>{title}</div>
        <div className="tinytext" style={{ marginTop: 2, color: hero ? 'rgba(250,247,241,0.7)' : undefined }}>{sub}</div>
      </div>
    </div>
  );

  const Row = ({ title, count, children, focus }) => (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 16, color: focus ? 'var(--accent)' : undefined }} className={focus ? 'swig' : ''}>{title}</div>
        <div className="tinytext">{count}</div>
        <div style={{ flex: 1 }} />
        <div className="tinytext">{focus ? '◀ ● ● ● ▶' : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>{children}</div>
    </div>
  );

  return (
    <Sketch>
      <div className="wf" style={{ '--accent': '#7c5cff', background: '#0c0a14', color: '#f3eee6' }}>
        <style>{`
          .wf .box, .wf .box-solid { border-color: rgba(243,238,230,0.4); background: rgba(243,238,230,0.04); color: inherit; }
          .wf .box-fill { background: rgba(124,92,255,0.18); border-color: var(--accent); color: inherit; }
          .wf .swig { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3' fill='none' stroke='%237c5cff' stroke-width='1.4'/%3E%3C/svg%3E"); }
          .wf .tinytext, .wf .eyebrow { color: rgba(243,238,230,0.55); }
          .wf .scrib { background-image: repeating-linear-gradient(135deg, rgba(243,238,230,0.08) 0 2px, transparent 2px 7px); }
          .wf::before {
            content: ''; position: absolute; inset: -10%; pointer-events: none;
            background:
              radial-gradient(ellipse 40% 40% at 20% 30%, rgba(124,92,255,0.28), transparent 70%),
              radial-gradient(ellipse 35% 35% at 80% 70%, rgba(255,80,180,0.18), transparent 70%);
            filter: blur(20px);
          }
        `}</style>
        <div className="wf-tag" style={{ color: 'rgba(243,238,230,0.55)' }}>05 / <b style={{ color: 'var(--accent)' }}>Console OS</b> · cinematic dashboard</div>

        <div style={{ position: 'absolute', inset: '44px 28px 50px 28px', display: 'flex', flexDirection: 'column' }}>

          {/* top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 14, fontFamily: "'Patrick Hand', cursive" }}>Repo Foundry<span style={{ color: 'var(--accent)' }}>.</span></div>
            <div className="mono" style={{ fontSize: 10, color: 'rgba(243,238,230,0.55)', letterSpacing: 0.18 }}>FRIDAY · MAY 16 · 14:02</div>
            <div style={{ flex: 1 }} />
            <div className="mono" style={{ fontSize: 10, padding: '4px 10px', border: '1px solid rgba(243,238,230,0.4)', borderRadius: 14 }}>HOME</div>
            <div className="mono" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 14, color: 'rgba(243,238,230,0.5)' }}>LANES</div>
            <div className="mono" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 14, color: 'rgba(243,238,230,0.5)' }}>NEWS</div>
            <div className="mono" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 14, color: 'rgba(243,238,230,0.5)' }}>VIZ</div>
            <div style={{ width: 1, height: 18, background: 'rgba(243,238,230,0.3)' }} />
            <div style={{ width: 24, height: 24, borderRadius: 12, border: '1.5px solid var(--accent)', display: 'grid', placeItems: 'center', fontSize: 11 }}>K</div>
          </div>

          {/* cinematic hero */}
          <div className="box-solid" style={{ marginTop: 18, height: 240, padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div className="scrib" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at left, transparent, rgba(12,10,20,0.85))' }} />
            <div style={{ position: 'absolute', top: 18, right: 18, fontSize: 10, color: 'rgba(243,238,230,0.45)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.18 }}>NOW PLAYING · WEEK 20 DOSSIER</div>
            <div style={{ position: 'absolute', left: 22, bottom: 18, maxWidth: 460 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>LANE · AI AGENTS</div>
              <div style={{ fontSize: 44, lineHeight: 0.95, marginTop: 4 }}>codex‑cli</div>
              <div className="tinytext" style={{ marginTop: 6 }}>Reference implementation of the agent‑coder stack — moved from POC to weapon in 6 weeks.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <div className="box-fill" style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 0.18 }}>▶ &nbsp;OPEN DOSSIER</div>
                <div className="box-solid" style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 0.18 }}>+ TRACK</div>
                <div style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(243,238,230,0.5)' }}>★ 12.4k · +320/d</div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: 28, bottom: 18, display: 'flex', gap: 6 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: i === 0 ? 24 : 8, height: 4, borderRadius: 2, background: i === 0 ? 'var(--accent)' : 'rgba(243,238,230,0.3)' }} />
              ))}
            </div>
          </div>

          <Row title="Continue watching" count="6 dossiers" focus>
            <RowCard title="modelcontext/sdk-py" sub="MCP · v1.4" />
            <RowCard title="openai/swarm" sub="Agent" />
            <RowCard title="all-hands-ai/openhands" sub="Agent · 31k★" />
            <RowCard title="cline/cline" sub="IDE agent" />
            <RowCard title="vllm-project/vllm" sub="Runtime · 28k★" />
            <RowCard title="exo-explore/exo" sub="Distributed" />
          </Row>

          <Row title="New this week" count="12">
            <RowCard title="stagehand" sub="Browser agent" hot />
            <RowCard title="composio" sub="Tool infra" hot />
            <RowCard title="livekit/agents" sub="Voice agents" hot />
            <RowCard title="block/goose" sub="Agent · 11k★" />
            <RowCard title="zed-industries/zed" sub="Editor · 49k★" />
            <RowCard title="phidata" sub="Agent framework" />
          </Row>

        </div>

        <div className="wf-tech" style={{ color: 'rgba(243,238,230,0.55)' }}>
          tech moment: <b style={{ color: 'var(--accent)' }}>WebGL ambient</b> · <b style={{ color: 'var(--accent)' }}>native &lt;dialog&gt;</b> for dossier deep-link · D-pad keyboard nav
        </div>
      </div>
    </Sketch>
  );
}

// ───── intro / cover card ─────

function IntroCard() {
  return (
    <Sketch>
      <div className="wf" style={{ background: '#1a1614', color: '#faf7f1' }}>
        <style>{`
          .wf .swig { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3' fill='none' stroke='%23d4a72c' stroke-width='1.4'/%3E%3C/svg%3E"); }
          .wf .tinytext, .wf .eyebrow { color: rgba(250,247,241,0.55); }
        `}</style>
        <div style={{ position: 'absolute', inset: '60px 80px' }}>
          <div className="eyebrow" style={{ color: '#d4a72c' }}>wireframes · v1 · low-fi</div>
          <div style={{ fontSize: 92, lineHeight: 0.92, marginTop: 12, letterSpacing: '-0.01em' }}>
            Repo Foundry<span style={{ color: '#d4a72c' }}>,</span><br />
            <span className="swig">five ways</span> in.
          </div>
          <div style={{ marginTop: 26, fontSize: 22, maxWidth: 760, lineHeight: 1.3 }}>
            Five gaming-coded directions for the homepage. Each picks a different visual vocabulary and a different bit of newest web tech. Pick a favourite, steal bits from the others, and we'll fork the winner into a high-fi pass.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 44 }}>
            {[
              ['01', 'Steam Library', 'left rail · shelves · view‑transitions', '#43b581'],
              ['02', 'Esports HUD', 'agent select · live telemetry · scroll‑anim', '#ff2d6e'],
              ['03', 'Terminal / BBS', 'monospace · ASCII · anchor positioning', '#28d172'],
              ['04', 'Foundry Dex', 'card collector · stat bars · card‑flip VT', '#d4a72c'],
              ['05', 'Console OS', 'cinematic rows · WebGL bg · &lt;dialog&gt;', '#7c5cff'],
            ].map(([n, name, kit, color]) => (
              <div key={n} style={{ borderTop: `2px solid ${color}`, paddingTop: 10 }}>
                <div className="mono" style={{ fontSize: 11, color, letterSpacing: 0.16 }}>WIRE {n}</div>
                <div style={{ fontSize: 20, marginTop: 4 }}>{name}</div>
                <div className="tinytext" style={{ marginTop: 6, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: kit }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 60, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="tinytext">SCROLL / DRAG TO PAN · SCROLL WHEEL TO ZOOM · DOUBLE-CLICK A FRAME TO FOCUS</div>
          </div>
        </div>
      </div>
    </Sketch>
  );
}

// ─────────────────────────────────────────────────────────
// Canvas composition
// ─────────────────────────────────────────────────────────

function App() {
  return (
    <DesignCanvas>
      <DCSection id="cover" title="Repo Foundry" subtitle="Five wireframe directions — pick your favourite, mix and match.">
        <DCArtboard id="intro" label="00 · Brief" width={W} height={H}><IntroCard /></DCArtboard>
      </DCSection>

      <DCSection id="wires" title="Wireframes" subtitle="Each homepage tries a different gaming reference + a different piece of newest web tech.">
        <DCArtboard id="w01-steam" label="01 · Steam Library" width={W} height={H}><W01_Steam /></DCArtboard>
        <DCArtboard id="w02-esports" label="02 · Esports HUD" width={W} height={H}><W02_Esports /></DCArtboard>
        <DCArtboard id="w03-terminal" label="03 · Terminal / BBS" width={W} height={H}><W03_Terminal /></DCArtboard>
        <DCArtboard id="w04-pokedex" label="04 · Foundry Dex" width={W} height={H}><W04_Pokedex /></DCArtboard>
        <DCArtboard id="w05-console" label="05 · Console OS" width={W} height={H}><W05_ConsoleOS /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
