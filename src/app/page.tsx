import Terrarium from "@/components/Terrarium";

export default function Home() {
  return (
    <main>
      <Terrarium />

      {/* Overlay Content - Hidden by default or minimal so it doesn't obstruct the view, 
          but we want to keep the "Relay" context visible somewhere. */}
      <div className="pointer-events-none fixed bottom-4 right-4 text-right font-mono text-[10px] text-neutral-500">
        <p>PROJECT: NEON ACE</p>
        <p>ITERATION: RELAY 6 (WINGMAN)</p>
      </div>
    </main>
  );
}
