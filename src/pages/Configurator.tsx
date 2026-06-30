import { GlitchText } from "@/components/GlitchText";
import { ConfiguratorTerminal } from "@/components/ConfiguratorTerminal";

export default function Configurator() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 md:px-8 py-10">
        <div className="text-[10px] tracking-[0.5em] text-primary mb-3 animate-flicker">
          // PROTOCOL 07 / CUSTOM FABRICATION UNIT
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-none">
          <GlitchText>FABRICATE</GlitchText>
          <span className="text-stroke-red"> /YOUR SIGNAL</span>
        </h1>
      </div>
      <ConfiguratorTerminal />
    </div>
  );
}
