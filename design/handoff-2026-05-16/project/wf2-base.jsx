// wf2-base.jsx — shared sketch primitives + skin toggle + intro card
// Exports to window so wf2-hud.jsx and wf2-term.jsx can use them.

const ACCENT = '#ff2d6e';   // hot magenta — shared across both skins
const PAPER = '#0e0c10';    // shared dark base
const INK = '#f3eee6';      // bone text
const INK_2 = 'rgba(243,238,230,0.7)';
const INK_3 = 'rgba(243,238,230,0.5)';
const INK_4 = 'rgba(243,238,230,0.25)';
const LINE = 'rgba(243,238,230,0.4)';

const wf2BaseCSS = `
.wf {
  width: 100%; height: 100%;
  background: ${PAPER};
  color: ${INK};
  font-family: 'Patrick Hand', 'Caveat', cursive;
  font-size: 17px;
  line-height: 1.25;
  position: relative;
  overflow: hidden;
}
.wf .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.02em; }

.wf-tag {
  position: absolute; top: 14px; left: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: ${INK_3}; z-index: 5;
}
.wf-tag b { color: ${ACCENT}; font-weight: 600; }

.wf-tech {
  position: absolute; bottom: 14px; right: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: ${INK_3}; text-align: right;
  max-width: 420px; z-index: 5;
}
.wf-tech b { color: ${ACCENT}; font-weight: 600; }

.wf-chrome {
  position: absolute; top: 12px; right: 18px; z-index: 5;
  display: inline-flex; align-items: center; gap: 8px;
}
.wf-skin {
  display: inline-flex; align-items: center; gap: 0;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em;
  border: 1px solid ${LINE}; border-radius: 14px; overflow: hidden;
  background: rgba(243,238,230,0.04);
}
.wf-skin span { padding: 4px 10px; color: ${INK_3}; }
.wf-skin span.on { background: ${ACCENT}; color: ${PAPER}; }

.wf-acc {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 6px;
  border: 1px solid ${LINE}; border-radius: 14px;
  background: rgba(243,238,230,0.04);
}
.wf-acc-dot {
  width: 14px; height: 14px; border-radius: 8px;
  display: inline-block; cursor: pointer;
  border: 1.5px solid transparent;
  transition: transform 160ms ease, border-color 160ms ease;
}
.wf-acc-dot.on { border-color: ${INK}; transform: scale(1.05); box-shadow: 0 0 8px currentColor; }

.box     { border: 1.5px dashed ${LINE}; border-radius: 6px; background: rgba(243,238,230,0.03); color: inherit; }
.box-s   { border: 1.5px solid ${LINE}; border-radius: 6px; background: rgba(243,238,230,0.04); color: inherit; }
.box-f   { background: ${INK}; color: ${PAPER}; border: 1.5px solid ${INK}; border-radius: 6px; }
.box-acc { background: ${ACCENT}; color: ${PAPER}; border: 1.5px solid ${ACCENT}; border-radius: 6px; }

.scrib   { background-image: repeating-linear-gradient(135deg, rgba(243,238,230,0.07) 0 2px, transparent 2px 7px); }

.swig {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3' fill='none' stroke='%23ff2d6e' stroke-width='1.4'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: 0 100%;
  padding-bottom: 6px;
}

.tinytext { font-size: 10px; line-height: 1.3; color: ${INK_3}; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
.eyebrow  { font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; color: ${INK_3}; font-family: 'JetBrains Mono', monospace; }

.kbd {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  border: 1px solid ${LINE}; border-bottom-width: 2px;
  border-radius: 3px; padding: 1px 5px; background: rgba(243,238,230,0.06);
  color: ${INK_2};
}

/* motion annotation — appears as a hand-drawn note inside the wire */
.mot {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  color: ${ACCENT}; letter-spacing: 0.06em; text-transform: uppercase;
}
.mot::before { content: '✸'; font-size: 11px; }

/* live dot — pulsing accent */
.livedot {
  width: 8px; height: 8px; border-radius: 4px; background: ${ACCENT};
  box-shadow: 0 0 8px ${ACCENT};
  animation: livePulse 1.6s ease-in-out infinite;
  display: inline-block;
}
@keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.85); } }

@keyframes wf2-drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.drift { animation: wf2-drift 6s ease-in-out infinite; }

@keyframes wf2-ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-track { display: inline-flex; gap: 28px; animation: wf2-ticker 38s linear infinite; }

/* hatched corner accent (decorative HUD bracket) */
.brk {
  position: absolute; width: 18px; height: 18px;
  border-color: ${ACCENT}; border-style: solid; border-width: 0;
}
.brk.tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
.brk.tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
.brk.bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
.brk.br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }
`;

function Sketch({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: wf2BaseCSS }} />
      {children}
    </>
  );
}

const WF2_ACCENTS = [
  { k: 'magenta', c: '#ff2d6e', label: 'Hot Magenta' },
  { k: 'blue',    c: '#3d8bff', label: 'Electric Blue' },
  { k: 'green',   c: '#28d172', label: 'Phosphor Green' },
  { k: 'amber',   c: '#ffae3c', label: 'Amber' },
  { k: 'violet',  c: '#9b7cff', label: 'Iris Violet' },
];

function SkinToggle({ skin, accent = 'magenta' }) {
  return (
    <div className="wf-chrome">
      <div className="wf-skin">
        <span className={skin === 'hud' ? 'on' : ''}>HUD</span>
        <span className={skin === 'term' ? 'on' : ''}>TERMINAL</span>
      </div>
      <div className="wf-acc" title="accent · pick a colour">
        {WF2_ACCENTS.map(a => (
          <span
            key={a.k}
            className={'wf-acc-dot' + (a.k === accent ? ' on' : '')}
            style={{ background: a.c, color: a.c }}
            title={a.label}
          />
        ))}
      </div>
    </div>
  );
}

function MotionNote({ children }) {
  return <span className="mot">{children}</span>;
}

// ─────────── intro / cover ───────────

function IntroCard() {
  return (
    <Sketch>
      <div className="wf">
        <div style={{ position: 'absolute', inset: 0, background:
          'radial-gradient(ellipse 50% 50% at 20% 20%, rgba(255,45,110,0.18), transparent 60%),' +
          'radial-gradient(ellipse 40% 40% at 80% 80%, rgba(255,45,110,0.10), transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', inset: '56px 72px' }}>
          <div className="eyebrow" style={{ color: ACCENT }}>wireframes · v2 · two skins, four pages</div>

          <div style={{ fontSize: 92, lineHeight: 0.92, marginTop: 14, letterSpacing: '-0.01em' }}>
            Repo Foundry,<br />
            <span className="swig" style={{ paddingBottom: 8 }}>two ways to load in.</span>
          </div>

          <div style={{ marginTop: 26, fontSize: 22, maxWidth: 820, lineHeight: 1.35, color: INK_2 }}>
            One product, one type system, <b style={{ color: ACCENT }}>two skins</b> and <b style={{ color: ACCENT }}>five accents</b>.
            HUD is the default — esports loadout energy, smooth and intentional. TERMINAL is a
            one-toggle alternate for operator mode — same data, same accent, monospace everything.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 56 }}>
            {[
              ['HOME', 'agent select · live telemetry · scoreboard'],
              ['FEED', 'news ticker · repo highlights · sources rail'],
              ['ABOUT', 'operator dossier · lane manifest · ROE'],
              ['CONTACT', 'open comms · channels · ops status'],
            ].map(([n, k]) => (
              <div key={n} style={{ borderTop: `2px solid ${ACCENT}`, paddingTop: 12 }}>
                <div className="mono" style={{ fontSize: 11, color: ACCENT, letterSpacing: 0.18 }}>PAGE · {n}</div>
                <div className="tinytext" style={{ marginTop: 8, lineHeight: 1.5 }}>{k}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="wf-skin">
              <span className="on">HUD</span>
              <span>TERMINAL</span>
            </div>
            <div className="wf-acc">
              {WF2_ACCENTS.map(a => (
                <span
                  key={a.k}
                  className={'wf-acc-dot' + (a.k === 'magenta' ? ' on' : '')}
                  style={{ background: a.c, color: a.c }}
                  title={a.label}
                />
              ))}
            </div>
            <div className="tinytext">
              skin · <span className="kbd">T</span> &nbsp;·&nbsp; accent · <span className="kbd">1–5</span> &nbsp;·&nbsp; both persist to localStorage
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(5, max-content)', gap: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: INK_3, letterSpacing: 0.08 }}>
            {WF2_ACCENTS.map(a => (
              <div key={a.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: a.c }} />
                <span>{a.label.toUpperCase()}</span>
                <span style={{ opacity: 0.6 }}>{a.c}</span>
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: INK_3, letterSpacing: 0.16, textTransform: 'uppercase' }}>
            <span><span className="livedot" /> &nbsp;motion philosophy</span>
            <span>· 180–400ms eases · spring on hover · marquee 38s loop · zero bounce</span>
            <span style={{ flex: 1 }} />
            <span>scroll · drag · double-click to focus a frame</span>
          </div>
        </div>
      </div>
    </Sketch>
  );
}

Object.assign(window, {
  WF2_ACCENTS,
  WF2_ACCENT: ACCENT,
  WF2_PAPER: PAPER,
  WF2_INK: INK,
  WF2_INK2: INK_2,
  WF2_INK3: INK_3,
  WF2_INK4: INK_4,
  WF2_LINE: LINE,
  WF2_Sketch: Sketch,
  WF2_SkinToggle: SkinToggle,
  WF2_MotionNote: MotionNote,
  WF2_IntroCard: IntroCard,
});
