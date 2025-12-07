import Terrarium from "@/components/Terrarium";

export default function Home() {
  return (
    <main>
      <Terrarium />

      {/* Overlay Content - Hidden by default or minimal so it doesn't obstruct the view, 
          but we want to keep the "Relay" context visible somewhere. */}
      <div className="pointer-events-none fixed bottom-4 right-4 text-right font-mono text-[10px] text-neutral-500">
        <p>PROJECT: ANTIGRAVITY REF No. 949C</p>
        <p>ITERATION: GENESIS</p>
      </div>
    </main>
  );
}
