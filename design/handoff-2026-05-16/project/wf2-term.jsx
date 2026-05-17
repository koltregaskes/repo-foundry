// wf2-term.jsx — Terminal skin: 4 pages
// Same data, same magenta accent, monospace window UI. Operator mode.

const { WF2_Sketch: Sk2, WF2_SkinToggle: SkinT2, WF2_ACCENT: A2, WF2_INK: I_, WF2_INK2: I2_, WF2_INK3: I3_, WF2_LINE: L_, WF2_PAPER: P_ } = window;

// Shared window chrome + tabs

function TermWindow({ active, cmd, children }) {
  const tabs = [
    { k: 'HOME', p: '~/home', n: '01' },
    { k: 'FEED', p: '~/feed', n: '02' },
    { k: 'ABOUT', p: '~/about', n: '03' },
    { k: 'CONTACT', p: '~/contact', n: '04' },
  ];

  return (
    <div className="box-s" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* CRT scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(243,238,230,0.04) 0 1px, transparent 1px 3px)',
        mixBlendMode: 'screen', zIndex: 2,
      }} />
      {/* magenta glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 40% 40% at 20% 20%, rgba(255,45,110,0.12), transparent 60%)',
      }} />

      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: `1.5px solid ${L_}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i === 0 ? A2 : i === 1 ? 'rgba(255,45,110,0.55)' : 'rgba(255,45,110,0.25)' }} />
          ))}
        </div>
        <div style={{ flex: 1, textAlign: 'center', color: I3_, letterSpacing: 0.16 }}>
          kol@foundry · zsh — {cmd}
        </div>
        <div style={{ color: I3_ }}>—  ☐  ✕</div>
      </div>

      {/* tab strip */}
      <div style={{ display: 'flex', borderBottom: `1.5px solid ${L_}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        {tabs.map(t => (
          <div key={t.k} style={{
            padding: '6px 14px',
            color: t.k === active ? I_ : I3_,
            background: t.k === active ? 'rgba(255,45,110,0.12)' : 'transparent',
            borderBottom: t.k === active ? `2px solid ${A2}` : '2px solid transparent',
            borderRight: `1px solid ${L_}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: t.k === active ? A2 : I3_ }}>{t.n}</span>
            <span>{t.p}</span>
            {t.k === active && <span style={{ color: I3_, marginLeft: 4 }}>●</span>}
          </div>
        ))}
        <div style={{ flex: 1, padding: '6px 14px', textAlign: 'right', color: I3_, letterSpacing: 0.16 }}>
          [+] new tab
        </div>
      </div>

      {/* prompt */}
      <div style={{ padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, borderBottom: `1px dashed ${L_}` }}>
        <span style={{ color: A2 }}>kol@foundry</span>
        <span style={{ color: I3_ }}>:</span>
        <span>{active.toLowerCase()}</span>
        <span style={{ color: I3_ }}> $ </span>
        <span>{cmd}</span>
        <span className="livedot" style={{ marginLeft: 6, width: 7, height: 14, borderRadius: 1, verticalAlign: 'middle' }} />
      </div>

      {/* body */}
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 14px', borderTop: `1.5px solid ${L_}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: I3_, letterSpacing: 0.12 }}>
        <span><span className="livedot" /> uplink</span>
        <span>● 247 repos · 8 lanes</span>
        <span>● ttl 6h</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: A2 }}>j/k</span> nav &nbsp;·&nbsp; <span style={{ color: A2 }}>↵</span> open &nbsp;·&nbsp; <span style={{ color: A2 }}>:</span> cmd &nbsp;·&nbsp; <span style={{ color: A2 }}>T</span> skin &nbsp;·&nbsp; <span style={{ color: A2 }}>?</span> help
      </div>
    </div>
  );
}

// ───── shared ─────

function PageFrame({ tag, skin = 'term', children }) {
  return (
    <Sk2>
      <div className="wf">
        <div className="wf-tag">{tag}</div>
        <SkinT2 skin={skin} />
        <div style={{ position: 'absolute', inset: '52px 24px 48px 24px', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </Sk2>
  );
}

// ──────────────────────────────────────
// TERM · HOME
// ──────────────────────────────────────

function TERM_Home() {
  const Row = ({ idx, name, lane, stars, delta, age, hot, sel }) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 32px 1fr 100px 70px 60px 60px', gap: 10,
      padding: '4px 8px', fontSize: 12, alignItems: 'center',
      background: sel ? 'rgba(255,45,110,0.16)' : 'transparent',
      borderLeft: sel ? `2px solid ${A2}` : '2px solid transparent',
      color: sel ? I_ : I2_,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <span style={{ color: sel ? A2 : I3_ }}>{sel ? '▸' : ' '}</span>
      <span style={{ color: I3_ }}>{idx}</span>
      <span>{name}</span>
      <span style={{ color: I3_ }}>{lane}</span>
      <span>★ {stars}</span>
      <span style={{ color: A2 }}>{delta}</span>
      <span style={{ color: I3_ }}>{age}</span>
      {hot && <span style={{ position: 'absolute', right: 12, fontSize: 8, padding: '1px 4px', background: A2, color: P_, borderRadius: 2 }}>HOT</span>}
    </div>
  );

  return (
    <PageFrame tag={<>A · <b>TERM</b> · home · agent select</>}>
      <TermWindow active="HOME" cmd="foundry list --lane=agents --sort=stars/d --limit=10">

        <div style={{ display: 'flex', gap: 16, height: '100%' }}>

          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column' }}>
            <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.05, color: A2, margin: 0 }}>{`
   ___   ___ ___ _____    ___ ___ _   _ _  _ ___  _____   __
  | _ \\ | __| _ \\  _  |  | __/ _ \\ | | | \\| |   \\| _ \\ \\ / /
  |   / | _||  _/ |_| |  | _| (_) | |_| | .\` | |) |   /\\ V /
  |_|_\\ |___|_|     _    |_| \\___/\\___/|_|\\_|___/|_|_\\ |_|
                  _/_/   v1 · operator mode
`}</pre>

            <div style={{ marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I3_, letterSpacing: 0.04 }}>
              ┌─ select your weapon ──────────────── 42 found ───┐
            </div>
            <div style={{ marginTop: 6, flex: 1 }}>
              <Row idx="A01" name="anthropic/codex-cli" lane="agents" stars="12.4k" delta="+320" age="3h" sel />
              <Row idx="A02" name="cline/cline" lane="ide-agent" stars="19.0k" delta="+264" age="1d" hot />
              <Row idx="A03" name="openhands" lane="agents" stars="31.2k" delta="+201" age="7h" hot />
              <Row idx="A04" name="modelcontext/sdk-py" lane="mcp" stars="8.1k" delta="+188" age="3h" />
              <Row idx="A05" name="stagehand" lane="agents" stars="4.4k" delta="+142" age="11h" />
              <Row idx="A06" name="composio" lane="infra" stars="7.8k" delta="+118" age="18h" />
              <Row idx="A07" name="openai/swarm" lane="agents" stars="6.3k" delta="+94" age="7h" />
              <Row idx="A08" name="vllm-project/vllm" lane="runtimes" stars="28k" delta="+88" age="11h" />
              <Row idx="A09" name="exo-explore/exo" lane="distributed" stars="2.1k" delta="+71" age="2d" />
              <Row idx="A10" name="block/goose" lane="agents" stars="11k" delta="+47" age="6h" />
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I3_, marginTop: 6 }}>
              └────── showing 10 of 42 · &gt;&gt; for next page ──────┘
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="mot">row hover · soft magenta wash · 120ms</span>
            </div>
          </div>

          {/* right panel */}
          <div style={{ width: 280, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I2_, lineHeight: 1.5, borderLeft: `1px dashed ${L_}`, paddingLeft: 14 }}>
            <div style={{ color: A2 }}>// ./codex-cli/info</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: I3_ }}>name </span> anthropic/codex-cli<br />
              <span style={{ color: I3_ }}>role </span> <span style={{ color: A2 }}>DUELIST</span><br />
              <span style={{ color: I3_ }}>stars</span> 12,431<br />
              <span style={{ color: I3_ }}>velo </span> <span style={{ color: A2 }}>+320 ★/d</span><br />
              <span style={{ color: I3_ }}>rel  </span> v0.18.2 (3d ago)<br />
              <span style={{ color: I3_ }}>lang </span> typescript · python
            </div>

            <div style={{ marginTop: 14, color: A2 }}>// stat block</div>
            <pre style={{ margin: '6px 0', color: I2_ }}>
{`HP  ▰▰▰▰▰▰▰▰▰▱  92
DMG ▰▰▰▰▰▰▰▰▰▱  88
SPD ▰▰▰▰▰▰▰▱▱▱  70
DEF ▰▰▰▰▰▱▱▱▱▱  54`}
            </pre>

            <div style={{ marginTop: 12, color: A2 }}>// match.history --24h</div>
            <pre style={{ margin: '6px 0', color: I2_, lineHeight: 1.4 }}>
{`14:02  feat: streaming tools
11:38  fix(mcp): handshake
09:15  docs: agent loops
06:44  release: v0.18.2 ★`}
            </pre>

            <div style={{ marginTop: 14, color: A2 }}>$ open --dossier codex-cli</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: A2 }}>[ ↵ ]</span> lock in &nbsp; <span style={{ color: A2 }}>[ d ]</span> dossier &nbsp; <span style={{ color: A2 }}>[ t ]</span> skin
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="mot">cursor blinks 1.0s · no input lag</span>
            </div>
          </div>
        </div>
      </TermWindow>

      <div className="wf-tech">
        motion: <b>j/k</b> nav with row glow · <b>view-transitions</b> on ↵ · CRT scanlines · cursor blink 1s
      </div>
    </PageFrame>
  );
}

// ──────────────────────────────────────
// TERM · FEED
// ──────────────────────────────────────

function TERM_Feed() {
  const News = ({ t, src, msg, breaking }) => (
    <div style={{ padding: '6px 8px', borderBottom: `1px dashed ${L_}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, background: breaking ? 'rgba(255,45,110,0.12)' : 'transparent', borderLeft: breaking ? `2px solid ${A2}` : '2px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: I3_ }}>
        <span style={{ color: A2 }}>{t}</span>
        <span>· {src}</span>
        {breaking && <span style={{ color: A2, marginLeft: 'auto', letterSpacing: 0.12 }}>● BREAKING</span>}
      </div>
      <div style={{ marginTop: 2, color: I_ }}>{msg}</div>
    </div>
  );

  return (
    <PageFrame tag={<>B · <b>TERM</b> · feed · stories &amp; highlights</>}>
      <TermWindow active="FEED" cmd="tail -f /var/foundry/feed --highlights=3">

        <div style={{ display: 'flex', gap: 16, height: '100%' }}>

          {/* left: news stream */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: A2 }}>// foundry/feed · {`{`}stories: 47, since: 04:18 UTC{`}`}</div>
            <pre style={{ margin: '4px 0 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I3_ }}>{`┌─ STORY DROPS ──────────────────────────── live ──┐`}</pre>
            <div style={{ flex: 1 }}>
              <News breaking t="14:02" src="lobsters" msg="Anthropic releases codex-cli v0.18.2 — streaming tool calls land in stable" />
              <News t="13:14" src="hn" msg="Why MCP is becoming the new LSP (90 days of adoption)" />
              <News t="11:08" src="gh-blog" msg="GitHub Releases gets agent webhooks · new payload" />
              <News t="09:42" src="lobsters" msg="OpenHands hits 30k stars — contributor velocity at ATH" />
              <News t="08:30" src="hn" msg="vLLM benchmark sweep — May 2026" />
              <News t="06:15" src="oss-rss" msg="Cline maintainers post governance update" />
              <News t="yest" src="x" msg="composio v0.7 ships universal tool schema" />
            </div>
            <pre style={{ margin: '0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I3_ }}>{`└─ tail -f · 7 of 47 · press SPACE for more ───────┘`}</pre>
            <div style={{ marginTop: 8 }}>
              <span className="mot">new lines type at 24cps · breaking pulses · auto-pause on hover</span>
            </div>
          </div>

          {/* right: highlight reel */}
          <div style={{ width: 360, display: 'flex', flexDirection: 'column', borderLeft: `1px dashed ${L_}`, paddingLeft: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: I2_ }}>
            <div style={{ color: A2 }}>// highlight.reel --top=3</div>

            {[
              { rank: '01', name: 'codex-cli', blurb: 'agent-coder reference. the one to study.', stars: '12.4k', delta: '+320' },
              { rank: '02', name: 'cline', blurb: 'ide agent grown from cult to standard.', stars: '19.0k', delta: '+264' },
              { rank: '03', name: 'openhands', blurb: 'open-source agent stack · reproducible eval.', stars: '31.2k', delta: '+201' },
            ].map(h => (
              <div key={h.rank} style={{ marginTop: 12, padding: '8px 10px', border: `1px solid ${L_}`, borderRadius: 4, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: A2 }}>#{h.rank}</span>
                  <span style={{ fontSize: 14, color: I_, fontFamily: "'Patrick Hand', cursive", letterSpacing: 0 }}>{h.name}</span>
                  <span style={{ flex: 1 }} />
                  <span>★ {h.stars}</span>
                  <span style={{ color: A2 }}>{h.delta}/d</span>
                </div>
                <div style={{ marginTop: 4, color: I3_ }}>{h.blurb}</div>
                <div style={{ marginTop: 4, fontSize: 10, color: A2 }}>$ open --dossier {h.name}</div>
              </div>
            ))}

            <div style={{ marginTop: 14, color: A2 }}>// sources</div>
            <pre style={{ margin: '6px 0', color: I2_, lineHeight: 1.5 }}>
{`[●] lobsters     12/d
[●] hn / oss      9/d
[●] gh-blog       6/d
[ ] lwn.net       4/d
[●] x · curated   8/d
[ ] oss-news.rss  8/d`}
            </pre>

            <div style={{ flex: 1 }} />
            <div style={{ marginTop: 14, padding: '6px 10px', background: A2, color: P_, fontSize: 11, letterSpacing: 0.14, textAlign: 'center' }}>
              ▸ SUBSCRIBE → /feed.rss
            </div>
          </div>
        </div>
      </TermWindow>

      <div className="wf-tech">
        motion: tail <b>types at 24cps</b> · breaking row pulses · click row → view-transition to article
      </div>
    </PageFrame>
  );
}

// ──────────────────────────────────────
// TERM · ABOUT
// ──────────────────────────────────────

function TERM_About() {
  return (
    <PageFrame tag={<>C · <b>TERM</b> · about · whoami / operator</>}>
      <TermWindow active="ABOUT" cmd="man foundry · whoami · cat /rules-of-engagement">

        <div style={{ display: 'flex', gap: 16, height: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.5 }}>

          {/* left: op profile + mission */}
          <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: A2 }}>$ whoami</div>
            <pre style={{ margin: '6px 0 14px', color: I2_, fontSize: 11 }}>
{`NAME   Kol Tregaskes
ROLE   curator / operator
HOME   uk
SINCE  2025
STATUS forming
ALIAS  OP-01
`}</pre>

            <div style={{ color: A2 }}>$ cat ./mission.brief</div>
            <div style={{ margin: '6px 0 14px', padding: '10px 12px', border: `1px dashed ${L_}`, color: I_, fontSize: 13, lineHeight: 1.4 }}>
              Find the high-signal open-source repos that matter to agent-coder operators. Read the diffs, write the dossier, ship the highlight reel. No SaaS slop, no LLM verdicts dressed as reviews.
            </div>

            <div style={{ color: A2 }}>$ ls ./lanes</div>
            <pre style={{ margin: '6px 0', color: I2_, fontSize: 11, flex: 1, lineHeight: 1.6 }}>
{`drwxr-xr-x  01 ai-agents          42 /agents
drwxr-xr-x  02 mcp-servers         31 /mcp
drwxr-xr-x  03 coding-agents       28 /coding
drwxr-xr-x  04 eval-harnesses      19 /eval
drwxr-xr-x  05 clis-and-shells     36 /clis
drwxr-xr-x  06 workflow-auto       24 /flow
drwxr-xr-x  07 game-engines        22 /engines
drwxr-xr-x  08 creator-systems     45 /creator`}
            </pre>

            <div style={{ marginTop: 8 }}>
              <span className="mot">man page · scroll-bind right column on focus</span>
            </div>
          </div>

          {/* right: ROE + timeline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: `1px dashed ${L_}`, paddingLeft: 14 }}>
            <div style={{ color: A2 }}>$ cat /rules-of-engagement</div>
            <pre style={{ margin: '6px 0 14px', color: I2_, fontSize: 11, lineHeight: 1.6 }}>
{`[✓] public site → curated, public-safe fields only
[✓] no scraped private data
[✓] no AI verdicts dressed as reviews
[✓] dossier disagreements fixed in public, dated
[✗] never publish: session, manager notes,
    backlog ownership, local paths
[✗] no impersonation, no shadow signals`}
            </pre>

            <div style={{ color: A2 }}>$ git log --milestones</div>
            <pre style={{ margin: '6px 0 14px', color: I2_, fontSize: 11, lineHeight: 1.6 }}>
{`● MAY 26  foundry v1 shipped         done
● JUN 26  visualisations land         done
● SEP 26  dossier-of-the-week         live
○ Q4 26   public api · feed.json      next
○ 2027    open the catalogue          soon`}
            </pre>

            <div style={{ color: A2 }}>$ stat ./foundry</div>
            <pre style={{ margin: '6px 0', color: I2_, fontSize: 11, lineHeight: 1.6 }}>
{`repos       247
lanes         8
dossiers     31
news/day  ~ 47
cadence   daily auto · weekly note
license   MIT (site) · per-repo`}
            </pre>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '8px 10px', background: A2, color: P_, fontSize: 11, letterSpacing: 0.14, textAlign: 'center' }}>
                ▸ FOLLOW THE OP
              </div>
              <div style={{ flex: 1, padding: '8px 10px', border: `1px solid ${L_}`, color: I2_, fontSize: 11, letterSpacing: 0.14, textAlign: 'center' }}>
                git clone foundry
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="mot">milestone dots breathe 4s · live one pulses brighter</span>
            </div>
          </div>
        </div>
      </TermWindow>

      <div className="wf-tech">
        motion: <b>scroll-bind</b> two columns · milestone live-dot pulses · cursor never twitches
      </div>
    </PageFrame>
  );
}

// ──────────────────────────────────────
// TERM · CONTACT
// ──────────────────────────────────────

function TERM_Contact() {
  return (
    <PageFrame tag={<>D · <b>TERM</b> · contact · open comms</>}>
      <TermWindow active="CONTACT" cmd="foundry comms --open · awaiting message">

        <div style={{ display: 'flex', gap: 16, height: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.5 }}>

          {/* left: interactive prompt form */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: A2 }}>$ comms.transmit --interactive</div>
            <pre style={{ margin: '6px 0 12px', color: I3_, fontSize: 11 }}>
{`┌─ load the message ────────────────────────────────┐`}
            </pre>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ color: I3_, fontSize: 10 }}>? handle</div>
                <div style={{ padding: '6px 10px', border: `1px solid ${L_}`, color: I3_, fontSize: 12 }}>
                  <span style={{ color: A2 }}>›</span> @yourname
                </div>
              </div>

              <div>
                <div style={{ color: A2, fontSize: 10 }}>? channel <span style={{ color: I3_ }}>(focused)</span></div>
                <div style={{ padding: '6px 10px', border: `1.5px solid ${A2}`, color: I_, fontSize: 12, background: 'rgba(255,45,110,0.12)' }}>
                  <span style={{ color: A2 }}>›</span> email · github · signal
                  <span style={{ display: 'inline-block', width: 7, height: 14, background: A2, marginLeft: 4, verticalAlign: 'middle', animation: 'livePulse 1s steps(1) infinite' }} />
                </div>
              </div>

              <div>
                <div style={{ color: I3_, fontSize: 10 }}>? repo · optional</div>
                <div style={{ padding: '6px 10px', border: `1px solid ${L_}`, color: I3_, fontSize: 12 }}>
                  <span style={{ color: A2 }}>›</span> owner / repo
                </div>
              </div>

              <div>
                <div style={{ color: I3_, fontSize: 10 }}>? payload &nbsp;<span style={{ color: I3_ }}>(↵ for newline · ⌃d to send)</span></div>
                <div style={{ padding: '8px 10px', border: `1px solid ${L_}`, color: I3_, fontSize: 12, height: 110 }}>
                  <span style={{ color: A2 }}>›</span> tell us what to track and why it matters…
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <div style={{ padding: '8px 14px', background: A2, color: P_, fontSize: 11, letterSpacing: 0.18 }}>▸ TRANSMIT &nbsp; ⌃D</div>
              <div style={{ padding: '8px 14px', border: `1px solid ${L_}`, color: I2_, fontSize: 11, letterSpacing: 0.18 }}>SAVE DRAFT &nbsp; ⌃S</div>
              <div style={{ flex: 1 }} />
              <span className="mot">send → scan-line drops top→bottom · 600ms</span>
            </div>
          </div>

          {/* right: channels + status */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: `1px dashed ${L_}`, paddingLeft: 14, fontSize: 11 }}>
            <div style={{ color: A2 }}>$ comms.channels</div>
            <pre style={{ margin: '6px 0 14px', color: I2_, lineHeight: 1.6 }}>
{`[●] github   koltregaskes/repo-foundry   open
[●] email    kol@repofoundry.dev          open
[ ] x        @koltregaskes                slow
[●] rss      /news.rss                    open`}
            </pre>

            <div style={{ color: A2 }}>$ ops.status --window=30d</div>
            <div style={{ display: 'flex', gap: 2, margin: '8px 0', height: 22 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const state = [3, 11, 18, 24].includes(i) ? 'slow' : i === 27 ? 'down' : 'ok';
                const c = state === 'ok' ? A2 : state === 'slow' ? 'rgba(255,45,110,0.4)' : 'rgba(243,238,230,0.2)';
                return <div key={i} style={{ flex: 1, background: c, borderRadius: 1 }} />;
              })}
            </div>
            <pre style={{ margin: 0, color: I2_, fontSize: 10 }}>
{`30d ago →                          today
26 GREEN · 3 SLOW · 1 DOWN`}
            </pre>

            <div style={{ marginTop: 14, color: A2 }}>$ tail -n 6 /var/foundry/inbound.log</div>
            <pre style={{ margin: '6px 0', color: I2_, lineHeight: 1.6, fontSize: 11 }}>
{`14:02  repo pitch        @kentcdodds
11:38  dossier fix #014  ────
09:15  hello / collab     @swyx
yest   feedback           feed cadence
2d     repo pitch         @ thorsten
4d     dossier fix #009   ────`}
            </pre>

            <div style={{ flex: 1 }} />
            <pre style={{ margin: 0, color: I3_, fontSize: 10, letterSpacing: 0.06 }}>
{`ops.uptime  92% / 48h
median.tta  6h 12m
inbox       14 open
slo         48h response, public log`}
            </pre>
            <div style={{ marginTop: 8 }}>
              <span className="mot">log lines stream in newest-first · 240ms</span>
            </div>
          </div>
        </div>
      </TermWindow>

      <div className="wf-tech">
        motion: focused input gets <b>magenta caret</b> · transmit → scan-line drop · no confetti
      </div>
    </PageFrame>
  );
}

Object.assign(window, { WF2_TERM_Home: TERM_Home, WF2_TERM_Feed: TERM_Feed, WF2_TERM_About: TERM_About, WF2_TERM_Contact: TERM_Contact });
