// wf2-app.jsx — compose intro + 2 skin sections into the design canvas

const {
  WF2_IntroCard,
  WF2_HUD_Home, WF2_HUD_Feed, WF2_HUD_About, WF2_HUD_Contact,
  WF2_TERM_Home, WF2_TERM_Feed, WF2_TERM_About, WF2_TERM_Contact,
} = window;

const W = 1320;
const H = 840;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="cover" title="Repo Foundry · v2" subtitle="One product, one palette, two skins. Pick what to keep.">
        <DCArtboard id="intro" label="00 · brief" width={W} height={H}><WF2_IntroCard /></DCArtboard>
      </DCSection>

      <DCSection id="hud" title="A · HUD skin" subtitle="Esports / agent-select. The default surface — interesting, dynamic, smoothly animated.">
        <DCArtboard id="hud-home"    label="A1 · home"    width={W} height={H}><WF2_HUD_Home    /></DCArtboard>
        <DCArtboard id="hud-feed"    label="A2 · feed"    width={W} height={H}><WF2_HUD_Feed    /></DCArtboard>
        <DCArtboard id="hud-about"   label="A3 · about"   width={W} height={H}><WF2_HUD_About   /></DCArtboard>
        <DCArtboard id="hud-contact" label="A4 · contact" width={W} height={H}><WF2_HUD_Contact /></DCArtboard>
      </DCSection>

      <DCSection id="term" title="B · Terminal skin" subtitle="Toggleable alternate — same data, same magenta, monospace window. Operator mode.">
        <DCArtboard id="term-home"    label="B1 · home"    width={W} height={H}><WF2_TERM_Home    /></DCArtboard>
        <DCArtboard id="term-feed"    label="B2 · feed"    width={W} height={H}><WF2_TERM_Feed    /></DCArtboard>
        <DCArtboard id="term-about"   label="B3 · about"   width={W} height={H}><WF2_TERM_About   /></DCArtboard>
        <DCArtboard id="term-contact" label="B4 · contact" width={W} height={H}><WF2_TERM_Contact /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
