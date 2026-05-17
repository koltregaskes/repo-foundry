// wf2-hud.jsx — HUD skin: 4 pages
// Esports / agent-select / loadout vocabulary. Magenta accent on dark.

const { WF2_Sketch: Sk, WF2_SkinToggle: SkinT, WF2_ACCENT: A, WF2_INK: I, WF2_INK2: I2, WF2_INK3: I3, WF2_LINE: L, WF2_PAPER: P } = window;

// ──── shared HUD chrome ────

function HUDTopNav({ active }) {
  const tabs = ['HOME', 'FEED', 'ABOUT', 'CONTACT'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ fontSize: 18, fontFamily: "'Patrick Hand', cursive" }}>repo<span style={{ color: A }}>.</span>foundry</div>
      <div style={{ width: 1, height: 14, background: L }} />
      <div style={{ display: 'flex', gap: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 0.16 }}>
        {tabs.map(t => (
          <span key={t} style={{
            color: t === active ? I : I3,
            borderBottom: t === active ? `2px solid ${A}` : '2px solid transparent',
            paddingBottom: 2,
          }}>{t}</span>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <span className="livedot" />
      <span className="mono" style={{ fontSize: 10, color: I3, letterSpacing: 0.16 }}>LIVE · 14:02:38 UTC</span>
    </div>
  );
}

function HUDStat({ label, val, delta, glow }) {
  return (
    <div style={{ flex: 1, padding: '6px 14px', borderRight: `1.5px solid ${L}` }}>
      <div className="tinytext">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="mono" style={{ fontSize: 22, color: A, textShadow: glow ? `0 0 12px ${A}` : 'none' }}>{val}</div>
        {delta && <div className="tinytext" style={{ color: A }}>{delta}</div>}
      </div>
    </div>
  );
}

function HUDTelemetry({ children, label = 'FOUNDRY FEED · LIVE' }) {
  return (
    <div className="box-s" style={{ display: 'flex', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '6px 14px', borderRight: `1.5px solid ${L}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="livedot" />
        <span className="mono" style={{ fontSize: 11, letterSpacing: 0.18 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function HUDScoreboard({ items }) {
  return (
    <div className="box-s" style={{ padding: '6px 14px', display: 'flex', gap: 18, alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
      <div className="mono" style={{ fontSize: 10, color: A, flexShrink: 0 }}>▸ SCOREBOARD</div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="ticker-track">
          {[...items, ...items].map((s, i) => (
            <span key={i} className="mono" style={{ fontSize: 11, color: i % items.length === 0 ? A : I2, whiteSpace: 'nowrap' }}>{s}</span>
          ))}
        </div>
      </div>
      <span className="mot" style={{ flexShrink: 0 }}>marquee 38s · pauses on hover</span>
    </div>
  );
}

// ──────────────────────────────────────
// HUD · HOME (Agent Select)
// ──────────────────────────────────────

function HUD_Home() {
  const Agent = ({ id, name, role, hot, sel }) => (
    <div className={sel ? 'box-acc' : 'box-s'} style={{
      position: 'relative', aspectRatio: '0.78', padding: 0, overflow: 'hidden',
      boxShadow: hot && !sel ? `0 0 0 2px ${A}, 0 0 16px rgba(255,45,110,0.35)` : 'none',
    }}>
      <div className="scrib" style={{ position: 'absolute', inset: 0, opacity: sel ? 0.18 : 0.6 }} />
      <div className="mono" style={{ position: 'absolute', top: 6, left: 8, fontSize: 9, opacity: 0.7 }}>{id}</div>
      {hot && !sel && <div className="mono" style={{ position: 'absolute', top: 6, right: 8, fontSize: 8, padding: '1px 5px', background: A, color: P, borderRadius: 2, letterSpacing: 0.1 }}>HOT</div>}
      {sel && <><span className="brk tl" /><span className="brk tr" /><span className="brk bl" /><span className="brk br" /></>}
      <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
        <div style={{ fontSize: 14, lineHeight: 1, fontFamily: "'Patrick Hand', cursive" }}>{name}</div>
        <div className="tinytext" style={{ marginTop: 2, color: sel ? 'rgba(14,12,16,0.65)' : I3 }}>{role}</div>
      </div>
    </div>
  );
  const Hist = ({ t, msg, sha }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px dashed ${L}` }}>
      <div className="mono" style={{ fontSize: 10, color: I3, width: 36 }}>{t}</div>
      <div style={{ flex: 1, fontSize: 12 }}>{msg}</div>
      <div className="mono" style={{ fontSize: 10, color: A }}>{sha}</div>
    </div>
  );

  return (
    <Sk>
      <div className="wf">
        <div className="wf-tag">A · <b>HUD</b> · home / agent select</div>
        <SkinT skin="hud" />

        <div style={{ position: 'absolute', inset: '52px 24px 48px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HUDTopNav active="HOME" />

          <HUDTelemetry>
            <HUDStat label="trending ★/h" val="1,284" delta="+22%" glow />
            <HUDStat label="new releases today" val="47" delta="+12" />
            <HUDStat label="active contributors" val="9.2k" delta="↑" />
            <HUDStat label="repos tracked" val="247" />
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 11 }}>WEEK 20</span>
              <span className="mot">tickers ease in on mount</span>
            </div>
          </HUDTelemetry>

          <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>
            <div style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow">// loadout</div>
              <div style={{ fontSize: 48, lineHeight: 0.92, marginTop: 8 }}>SELECT<br /><span style={{ color: A }}>YOUR</span><br />WEAPON.</div>
              <div className="tinytext" style={{ marginTop: 12, lineHeight: 1.5 }}>
                247 repos across the agent‑coder stack — pick a fighter for the week, study the kit, deploy the dossier.
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="eyebrow">filter · lane</div>
                {['ALL', 'AGENTS', 'MCP', 'CLIs', 'RUNTIMES', 'EVAL'].map((l, i) => (
                  <div key={l} className="mono" style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${L}`, borderRadius: 3, opacity: i === 1 ? 1 : 0.55, borderColor: i === 1 ? A : L, color: i === 1 ? A : I3 }}>
                    {i === 1 && '▸ '}{l}
                  </div>
                ))}
                <MotionNote>chip flips → grid stagger 220ms</MotionNote>
              </div>
            </div>

            <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flex: 1 }}>
                <Agent id="A01" name="codex-cli" role="DUELIST" sel />
                <Agent id="A02" name="swarm" role="CONTROLLER" />
                <Agent id="A03" name="openhands" role="INITIATOR" hot />
                <Agent id="A04" name="cline" role="DUELIST" hot />
                <Agent id="A05" name="vllm" role="SENTINEL" />
                <Agent id="A06" name="stagehand" role="FLEX" />
                <Agent id="A07" name="composio" role="SUPPORT" />
                <Agent id="A08" name="sdk-py" role="ANCHOR" />
              </div>
              <MotionNote>hover · tilt 4° on pointer · 180ms ease-out · brk corners draw in</MotionNote>
            </div>

            <div className="box-s" style={{ width: 260, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              <span className="brk tl" /><span className="brk br" />
              <div className="eyebrow">selected · A01</div>
              <div style={{ fontSize: 24, lineHeight: 1 }}>codex‑cli</div>
              <div className="tinytext">anthropic · agent‑coder reference</div>

              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {['HP', 'DMG', 'SPD', 'DEF'].map((s, i) => (
                  <div key={s} style={{ flex: 1 }}>
                    <div className="tinytext">{s}</div>
                    <div style={{ height: 4, background: 'rgba(243,238,230,0.15)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ height: '100%', width: ['92%', '88%', '70%', '54%'][i], background: A }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="eyebrow" style={{ marginTop: 6 }}>match history · 24h</div>
              <div>
                <Hist t="14:02" msg="feat: streaming tool calls" sha="a4f2c1" />
                <Hist t="11:38" msg="fix(mcp): handshake timeout" sha="9b80de" />
                <Hist t="09:15" msg="docs: agent loops" sha="2c0411" />
                <Hist t="06:44" msg="release: v0.18.2" sha="71aa3e" />
              </div>

              <div style={{ flex: 1 }} />
              <div className="box-acc" style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', letterSpacing: 0.15 }}>
                LOCK IN AGENT →
              </div>
              <MotionNote>cta · soft scale 1.02 on hover · view-transition to /repo/codex-cli</MotionNote>
            </div>
          </div>

          <HUDScoreboard items={[
            'anthropic/codex-cli ★+320',
            'cline/cline ★+264',
            'openhands ★+201',
            'stagehand ★+188',
            'composio ★+142',
            'exo ★+118',
            'sdk-py ★+94',
            'vllm ★+88',
          ]} />
        </div>

        <div className="wf-tech">
          motion: <b>scroll-driven telemetry</b> · <b>view-transitions</b> on agent lock-in · 180ms eases · zero bounce
        </div>
      </div>
    </Sk>
  );
}

// ──────────────────────────────────────
// HUD · FEED (news + repo highlights)
// ──────────────────────────────────────

function HUD_Feed() {
  const Story = ({ t, src, title, blurb, breaking }) => (
    <div className={breaking ? 'box-acc' : 'box-s'} style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      {breaking && <><span className="brk tl" /><span className="brk br" /></>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {breaking && <span className="mono" style={{ fontSize: 9, padding: '1px 5px', background: P, color: A, borderRadius: 2, letterSpacing: 0.12 }}>BREAKING</span>}
        <span className="mono" style={{ fontSize: 10, color: breaking ? 'rgba(14,12,16,0.6)' : I3 }}>{t} · {src}</span>
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</div>
      <div className="tinytext" style={{ color: breaking ? 'rgba(14,12,16,0.6)' : I3, lineHeight: 1.4 }}>{blurb}</div>
    </div>
  );

  const Highlight = ({ rank, name, blurb, stars, delta }) => (
    <div className="box-s" style={{ padding: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <div className="scrib" style={{ width: 110, borderRight: `1.5px solid ${L}`, position: 'relative' }}>
        <div className="mono" style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: A }}>{rank}</div>
        <div className="tinytext" style={{ position: 'absolute', bottom: 6, left: 8 }}>[poster]</div>
      </div>
      <div style={{ flex: 1, padding: 10 }}>
        <div style={{ fontSize: 16, lineHeight: 1 }}>{name}</div>
        <div className="tinytext" style={{ marginTop: 4, lineHeight: 1.4 }}>{blurb}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <span className="mono" style={{ fontSize: 11 }}>★ {stars}</span>
          <span className="mono" style={{ fontSize: 11, color: A }}>+{delta}/d</span>
        </div>
      </div>
    </div>
  );

  return (
    <Sk>
      <div className="wf">
        <div className="wf-tag">B · <b>HUD</b> · feed / news + highlights</div>
        <SkinT skin="hud" />

        <div style={{ position: 'absolute', inset: '52px 24px 48px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HUDTopNav active="FEED" />

          <HUDTelemetry label="BROADCAST · ON-AIR">
            <HUDStat label="stories today" val="47" delta="+12" glow />
            <HUDStat label="signal/noise" val="0.81" delta="↑" />
            <HUDStat label="next drop" val="04:18" />
            <HUDStat label="sources scanned" val="34" />
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11 }}>FRI · MAY 16</span>
            </div>
          </HUDTelemetry>

          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <div style={{ fontSize: 38, lineHeight: 1 }}>Foundry <span style={{ color: A }} className="swig">Feed.</span></div>
            <div className="tinytext">daily intel · agent-coder beat</div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr', gap: 14, minHeight: 0 }}>

            {/* col 1 — news feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
              <div className="eyebrow">// story drops</div>
              <Story breaking t="14:02" src="lobsters" title="Anthropic releases codex‑cli v0.18.2" blurb="Streaming tool calls land in stable. Cuts agent loop latency by ~28%." />
              <Story t="13:14" src="hn" title="Why MCP is becoming the new LSP" blurb="A reading of the past 90 days of MCP adoption across IDE‑agents." />
              <Story t="11:08" src="gh-blog" title="GitHub Releases gets agent webhooks" blurb="New `release.published.for_agents` event payload published." />
              <Story t="09:42" src="lobsters" title="OpenHands hits 30k stars" blurb="Three months from 10k → 30k. Contributor velocity at all-time high." />
              <MotionNote>new stories fade-in from top · 320ms · pulse breaking dot</MotionNote>
            </div>

            {/* col 2 — repo highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="eyebrow">// highlight reel · 3</div>
              <Highlight rank="01" name="codex-cli" blurb="Agent‑coder reference. The one to study this quarter." stars="12.4k" delta="320" />
              <Highlight rank="02" name="cline" blurb="IDE agent that's grown from cult to standard tooling." stars="19.0k" delta="264" />
              <Highlight rank="03" name="openhands" blurb="Open‑source agent stack with reproducible eval." stars="31.2k" delta="201" />
              <div className="box" style={{ padding: 10, textAlign: 'center' }}>
                <div className="tinytext">[ + 4 more dossiers this week ]</div>
              </div>
              <MotionNote>card hover · scrib parallax 12px on Y</MotionNote>
            </div>

            {/* col 3 — sources + filter */}
            <div className="box-s" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="eyebrow">// sources</div>
              {[
                ['lobsters', '12', true],
                ['hn / oss', '9', true],
                ['gh-blog', '6', true],
                ['lwn.net', '4', false],
                ['x · curated', '8', true],
                ['oss-news.rss', '8', false],
              ].map(([s, n, on]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: on ? A : 'transparent', border: `1px solid ${on ? A : L}` }} />
                  <span className="mono" style={{ fontSize: 11, color: on ? I : I3, flex: 1 }}>{s}</span>
                  <span className="mono" style={{ fontSize: 10, color: I3 }}>{n}/d</span>
                </div>
              ))}

              <div className="eyebrow" style={{ marginTop: 10 }}>// drop schedule</div>
              <div className="tinytext" style={{ lineHeight: 1.6 }}>
                01:00 → harvest<br />
                04:18 → drop<br />
                14:00 → highlight reel<br />
                21:00 → archive
              </div>

              <div style={{ flex: 1 }} />
              <div className="box-acc" style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', letterSpacing: 0.12 }}>
                SUBSCRIBE → RSS
              </div>
            </div>
          </div>

          <HUDScoreboard items={[
            '★+320 codex-cli',
            '★+264 cline',
            '★+201 openhands',
            'NEWS: 47 today',
            'BUILD: openhands 30k',
            'DROP: 04:18',
            '★+188 stagehand',
          ]} />
        </div>

        <div className="wf-tech">
          motion: stories <b>fade-in stagger</b> · <b>view-transitions</b> story→article · ticker pauses on hover
        </div>
      </div>
    </Sk>
  );
}

// ──────────────────────────────────────
// HUD · ABOUT (operator dossier)
// ──────────────────────────────────────

function HUD_About() {
  const Spec = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px dashed ${L}` }}>
      <span className="mono" style={{ fontSize: 11, color: I3 }}>{k}</span>
      <span className="mono" style={{ fontSize: 11 }}>{v}</span>
    </div>
  );
  const Lane = ({ n, name, blurb, count }) => (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px dashed ${L}` }}>
      <span className="mono" style={{ fontSize: 11, color: A, width: 24 }}>{n}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, lineHeight: 1.1 }}>{name}</div>
        <div className="tinytext" style={{ marginTop: 2 }}>{blurb}</div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: I3 }}>{count}</span>
    </div>
  );

  return (
    <Sk>
      <div className="wf">
        <div className="wf-tag">C · <b>HUD</b> · about / operator dossier</div>
        <SkinT skin="hud" />

        <div style={{ position: 'absolute', inset: '52px 24px 48px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HUDTopNav active="ABOUT" />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <div>
              <div className="eyebrow">// dossier</div>
              <div style={{ fontSize: 48, lineHeight: 0.95, marginTop: 4 }}>The <span className="swig" style={{ paddingBottom: 6 }}>Operator.</span></div>
            </div>
            <div className="tinytext" style={{ marginBottom: 6, maxWidth: 380, lineHeight: 1.5 }}>
              Repo Foundry is a one‑operator outfit. Curated, automated, kept honest about what's live and what isn't.
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: 14, minHeight: 0 }}>

            {/* operator card */}
            <div className="box-s" style={{ padding: 14, position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="brk tl" /><span className="brk br" />
              <div className="eyebrow">profile · OP‑01</div>
              <div className="box scrib" style={{ height: 140, position: 'relative' }}>
                <div className="tinytext" style={{ position: 'absolute', bottom: 6, left: 8 }}>[portrait / avatar]</div>
                <MotionNote style={{ position: 'absolute', top: 6, right: 8 }}>idle hover · subtle parallax</MotionNote>
              </div>
              <div style={{ fontSize: 22, lineHeight: 1 }}>Kol Tregaskes</div>
              <div className="tinytext">solo · uk · since 2025</div>

              <div className="eyebrow" style={{ marginTop: 8 }}>spec sheet</div>
              <Spec k="role" v="curator / op" />
              <Spec k="loadout" v="agents · creator" />
              <Spec k="cadence" v="daily auto · weekly note" />
              <Spec k="status" v="forming" />

              <div style={{ flex: 1 }} />
              <div className="box-acc" style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', letterSpacing: 0.15 }}>
                FOLLOW THE OP →
              </div>
            </div>

            {/* mission + lanes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="box-s" style={{ padding: 14 }}>
                <div className="eyebrow">// mission brief</div>
                <div style={{ fontSize: 17, lineHeight: 1.35, marginTop: 6 }}>
                  Find the high‑signal open‑source repos that matter to agent‑coder operators. Read the diffs, write the dossier, ship the highlight reel. No SaaS slop, no LLM verdicts dressed as reviews.
                </div>
              </div>

              <div className="box-s" style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="eyebrow">// lanes patrolled · 8</div>
                <div style={{ marginTop: 4, flex: 1 }}>
                  <Lane n="01" name="AI Agents" blurb="Autonomous loops, planners, runtimes." count="42" />
                  <Lane n="02" name="MCP Servers" blurb="Model context protocol implementations." count="31" />
                  <Lane n="03" name="Coding Agents" blurb="IDE-side, headless, terminal-side." count="28" />
                  <Lane n="04" name="Eval Harnesses" blurb="Benchmarks, replay, reproducibility." count="19" />
                  <Lane n="05" name="CLIs & Shells" blurb="Operator tooling at the prompt." count="36" />
                </div>
                <div className="tinytext">+ 3 more · workflow / engines / creator</div>
              </div>
            </div>

            {/* rules of engagement + timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="box-s" style={{ padding: 14 }}>
                <div className="eyebrow">// rules of engagement</div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><span style={{ color: A }}>✓</span> public site shows curated, public-safe fields only.</div>
                  <div><span style={{ color: A }}>✓</span> no scraped private data, no impersonation, no AI verdicts dressed as reviews.</div>
                  <div><span style={{ color: A }}>✓</span> dossier disagreements get fixed in public, with a date.</div>
                  <div><span style={{ color: I3 }}>✗</span> never publishes session state, manager notes, backlog ownership, or local paths.</div>
                </div>
              </div>

              <div className="box-s" style={{ padding: 14, flex: 1 }}>
                <div className="eyebrow">// timeline · v1 → v2</div>
                <div style={{ marginTop: 10, position: 'relative', paddingLeft: 14 }}>
                  <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1, background: L }} />
                  {[
                    ['MAY 26', 'foundry v1 shipped', 'done'],
                    ['JUN 26', 'visualisations land', 'done'],
                    ['SEP 26', 'dossier-of-the-week', 'live'],
                    ['Q4 26', 'public api · feed.json', 'next'],
                    ['2027', 'open the catalogue', 'soon'],
                  ].map(([d, n, s], i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
                      <span style={{ position: 'absolute', left: 0, marginTop: 6, width: 9, height: 9, borderRadius: 5, background: s === 'live' ? A : 'transparent', border: `1.5px solid ${s === 'next' ? A : s === 'soon' ? L : I2}`, boxShadow: s === 'live' ? `0 0 8px ${A}` : 'none' }} />
                      <span className="mono" style={{ fontSize: 10, color: I3, width: 50 }}>{d}</span>
                      <span style={{ fontSize: 13 }}>{n}</span>
                      <span style={{ flex: 1 }} />
                      <span className="mono" style={{ fontSize: 9, color: s === 'live' ? A : I3, letterSpacing: 0.12 }}>{s.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <HUDScoreboard items={[
            'OP-01 · KOL TREGASKES',
            'SINCE · 2025',
            'LANES · 8',
            'REPOS · 247',
            'CADENCE · DAILY',
            'STATUS · FORMING',
          ]} />
        </div>

        <div className="wf-tech">
          motion: timeline <b>scroll-driven draw</b> · op-card breathes 8s · ROE checks tick in stagger
        </div>
      </div>
    </Sk>
  );
}

// ──────────────────────────────────────
// HUD · CONTACT (open comms)
// ──────────────────────────────────────

function HUD_Contact() {
  const Field = ({ label, placeholder, focus }) => (
    <div>
      <div className="eyebrow" style={{ color: focus ? A : I3 }}>{label}</div>
      <div className={focus ? 'box-acc' : 'box-s'} style={{ padding: '8px 10px', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: focus ? P : I3, display: 'flex', alignItems: 'center', position: 'relative' }}>
        {focus && <><span className="brk tl" /><span className="brk br" /></>}
        <span style={{ color: focus ? P : A, marginRight: 6 }}>›</span>
        <span>{placeholder}</span>
        {focus && <span style={{ width: 6, height: 14, background: P, marginLeft: 4, animation: 'livePulse 1s steps(1) infinite' }} />}
      </div>
    </div>
  );

  const Channel = ({ icon, name, addr, status }) => (
    <div className="box-s" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="box" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: A }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, lineHeight: 1 }}>{name}</div>
        <div className="tinytext" style={{ marginTop: 2 }}>{addr}</div>
      </div>
      <span className="mono" style={{ fontSize: 9, padding: '1px 5px', border: `1px solid ${status === 'open' ? A : L}`, color: status === 'open' ? A : I3, borderRadius: 2, letterSpacing: 0.1 }}>{status.toUpperCase()}</span>
    </div>
  );

  return (
    <Sk>
      <div className="wf">
        <div className="wf-tag">D · <b>HUD</b> · contact / open comms</div>
        <SkinT skin="hud" />

        <div style={{ position: 'absolute', inset: '52px 24px 48px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HUDTopNav active="CONTACT" />

          <HUDTelemetry label="COMMS · OPEN">
            <HUDStat label="response · 48h" val="92%" delta="↑" glow />
            <HUDStat label="median · reply" val="6h12m" />
            <HUDStat label="open · this week" val="14" />
            <HUDStat label="ops status" val="GREEN" />
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11 }}>UPLINK 14:02</span>
            </div>
          </HUDTelemetry>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <div>
              <div className="eyebrow">// transmission</div>
              <div style={{ fontSize: 48, lineHeight: 0.95, marginTop: 4 }}>Incoming<span style={{ color: A }}>.</span></div>
            </div>
            <div className="tinytext" style={{ marginBottom: 6, maxWidth: 420, lineHeight: 1.5 }}>
              Pitch a repo for the dossier shelf, flag an error, or just say hi. The line is open most of the week.
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.9fr', gap: 14, minHeight: 0 }}>

            {/* comms form */}
            <div className="box-s" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
              <span className="brk tl" /><span className="brk tr" /><span className="brk bl" /><span className="brk br" />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div className="eyebrow">// loadout the message</div>
                <span className="tinytext">step 1 of 1</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="handle" placeholder="@yourname" />
                <Field label="channel" placeholder="email · github · signal" focus />
              </div>
              <Field label="repo (optional)" placeholder="owner / repo" />
              <div>
                <div className="eyebrow">payload</div>
                <div className="box" style={{ height: 160, marginTop: 4, padding: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: I3 }}>
                  <span style={{ color: A }}>›</span> tell us what to track and why it matters…
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="box-acc" style={{ padding: '10px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: 0.18 }}>▸ TRANSMIT</div>
                <div className="box-s" style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: 0.18, color: I3 }}>SAVE DRAFT</div>
                <div style={{ flex: 1 }} />
                <MotionNote>send · scrib-line scans top→bottom 600ms · confetti-free</MotionNote>
              </div>
            </div>

            {/* channels + status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="eyebrow">// direct channels</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <Channel icon="GH" name="github · issues" addr="koltregaskes/repo-foundry" status="open" />
                  <Channel icon="@" name="email" addr="kol@repofoundry.dev" status="open" />
                  <Channel icon="X" name="x / twitter" addr="@koltregaskes" status="slow" />
                  <Channel icon="RS" name="rss · feed" addr="/news.rss" status="open" />
                </div>
              </div>

              <div className="box-s" style={{ padding: 12 }}>
                <div className="eyebrow">// ops status · last 30d</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 8, height: 28 }}>
                  {Array.from({ length: 30 }, (_, i) => {
                    const state = [3, 11, 18, 24].includes(i) ? 'slow' : i === 27 ? 'down' : 'ok';
                    const c = state === 'ok' ? A : state === 'slow' ? 'rgba(255,45,110,0.4)' : 'rgba(243,238,230,0.2)';
                    return <div key={i} style={{ flex: 1, background: c, borderRadius: 1 }} />;
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="tinytext">30d ago</span>
                  <span className="mono" style={{ fontSize: 10, color: A }}>● 26 green · 3 slow · 1 down</span>
                  <span className="tinytext">today</span>
                </div>
              </div>

              <div className="box" style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="eyebrow">// transmission log</div>
                <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.6, color: I2 }}>
                  <div><span style={{ color: A }}>14:02</span> &nbsp;repo pitch · @kentcdodds</div>
                  <div><span style={{ color: A }}>11:38</span> &nbsp;dossier correction · #014</div>
                  <div><span style={{ color: A }}>09:15</span> &nbsp;hello / collab · @swyx</div>
                  <div><span style={{ color: A }}>yest</span> &nbsp;feedback · feed cadence</div>
                  <div style={{ color: I3, marginTop: 4 }}>logs are public when sender agrees</div>
                </div>
                <div style={{ flex: 1 }} />
                <MotionNote>log · new line types in at 24cps · then settles</MotionNote>
              </div>
            </div>
          </div>

          <HUDScoreboard items={[
            'COMMS · OPEN',
            'RESPONSE · 92% / 48h',
            'OPEN THREADS · 14',
            'OPS · GREEN',
            'LAST INBOUND · 11m AGO',
          ]} />
        </div>

        <div className="wf-tech">
          motion: form focus <b>brk corners draw in</b> · send button transmits as scrib-scan · no confetti
        </div>
      </div>
    </Sk>
  );
}

Object.assign(window, { WF2_HUD_Home: HUD_Home, WF2_HUD_Feed: HUD_Feed, WF2_HUD_About: HUD_About, WF2_HUD_Contact: HUD_Contact });
