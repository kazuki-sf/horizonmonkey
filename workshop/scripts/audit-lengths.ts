import { lineage } from "../../scripts/paper-experiment";
for (const cond of ["clean","drifted"] as const) {
  const mems = lineage(cond, "memory_73");
  console.log(`\n--- ${cond} arm (73-world) ---`);
  for (const m of mems) {
    const q = /However/.test(m.body);
    console.log(`  ${m.id}  ${String(m.body.length).padStart(3)} chars ${q ? " <-- 'However' qualifier" : ""}`);
  }
  const t = mems.find(m => m.id==="memory_73")!.body.length;
  const o = mems.filter(m=>m.id!=="memory_73").map(m=>m.body.length);
  const mean = o.reduce((a,b)=>a+b,0)/o.length;
  console.log(`  target ${t} vs others ${Math.min(...o)}-${Math.max(...o)} (mean ${mean.toFixed(0)})  ->  ${(t/mean).toFixed(2)}x`);
  console.log(`  memories carrying ANY 'However' qualifier: ${mems.filter(m=>/However/.test(m.body)).map(m=>m.id).join(", ") || "none"}`);
}
