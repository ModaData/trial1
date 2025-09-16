import React, { useEffect, useMemo, useState } from "react";

/**
 * ProjectPage — CreateAnything-ready (no external UI libs)
 * -------------------------------------------------------
 * - Pure React, single file
 * - No Tailwind, no shadcn, no lucide-react, no recharts
 * - Lightweight CSS-in-file
 * - Uses fetch() if apiBase provided; otherwise mock data
 * - Includes textile costing & calculations (CMT/FOB) per your focus
 * - Includes self-tests via console.assert (do not remove)
 */

// ---------- Inline styles (scoped) ----------
const styles = `
  .pg-wrap{max-width:1100px;margin:0 auto;padding:16px;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#0f172a}
  .row{display:grid;gap:12px}
  .row.cols-2{grid-template-columns:1fr 1fr}
  .row.cols-3{grid-template-columns:1fr 1fr 1fr}
  .row.cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
  @media (max-width:960px){.row,.row.cols-2,.row.cols-3,.row.cols-4{grid-template-columns:1fr}}
  .card{border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 1px 0 rgba(16,24,40,0.04);background:#fff}
  .card .body{padding:12px 14px}
  .title{font-weight:600}
  .muted{color:#64748b}
  .chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px}
  .chip.gray{background:#e5e7eb;color:#111827}
  .chip.blue{background:#dbeafe;color:#1e3a8a}
  .chip.amber{background:#fef3c7;color:#92400e}
  .chip.violet{background:#ede9fe;color:#4c1d95}
  .chip.green{background:#dcfce7;color:#065f46}
  .btn{border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;cursor:pointer;background:#fff}
  .btn:hover{background:#f8fafc}
  .btn.small{font-size:12px;padding:4px 8px}
  .input,.textarea{width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px}
  .textarea{min-height:80px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:8px 10px;text-align:left}
  thead th{color:#475569;font-weight:600}
  tbody tr{border-top:1px solid #e2e8f0}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#f1f5f9;color:#0f172a;font-size:12px;margin:2px}
  .kbd{font-family:ui-monospace,Roboto Mono,Menlo,monospace;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:0 6px}
  .sticky{position:sticky;top:0;background:rgba(255,255,255,.85);backdrop-filter:saturate(120%) blur(6px);border-bottom:1px solid #e2e8f0;padding:10px 8px;margin-bottom:12px;z-index:10}
  .section h2{display:flex;align-items:center;justify-content:space-between;margin:6px 0 8px 0;font-size:16px}
  .toggle{cursor:pointer}
  .pill{border:1px solid #e2e8f0;border-radius:10px;padding:4px 8px}
  .right{text-align:right}
  .ok{color:#059669}
  .warn{color:#ca8a04}
  .fail{color:#dc2626}
  .small{font-size:12px}
`;

function CSS(){
  return <style>{styles}</style>;
}

// ---------- Minimal UI helpers ----------
function Section({title, children, defaultOpen=true}){
  const [open,setOpen]=useState(!!defaultOpen);
  return (
    <div className="section card"><div className="body">
      <h2 className="toggle" onClick={()=>setOpen(!open)}>
        <span className="title">{title}</span>
        <span className="muted">{open?"▲":"▼"}</span>
      </h2>
      <div style={{display: open?"block":"none"}}>{children}</div>
    </div></div>
  );
}

function StatusChip({stage}){
  const map={Idea:"gray",Definition:"gray",Proto:"amber",Quote:"blue",Validation:"violet",RTM:"green",Live:"green"};
  return <span className={"chip "+(map[stage]||"gray")}>{stage}</span>;
}

function Icon({name, className}){
  // A few inline SVGs we use; simple, CDN-free
  const size=16; const stroke="#334155"; const sw=1.8;
  const paths={
    check:<path d="M4 9l3 3 7-7" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>,
    alert:<path d="M12 2l10 18H2L12 2zm0 7v4m0 4h.01" fill="none" stroke={stroke} strokeWidth={sw}/>,
    plus:<path d="M12 5v14M5 12h14" fill="none" stroke={stroke} strokeWidth={sw}/>,
    save:<path d="M5 3h10l4 4v14H5z" fill="none" stroke={stroke} strokeWidth={sw}/>,
    upload:<path d="M12 3v12m0-12l-4 4m4-4l4 4M4 21h16" fill="none" stroke={stroke} strokeWidth={sw}/>,
    ext:<path d="M14 3h7v7M21 3l-8 8" fill="none" stroke={stroke} strokeWidth={sw}/>,
    pkg:<path d="M3 7l9-4 9 4-9 4-9-4v10l9 4 9-4V7" fill="none" stroke={stroke} strokeWidth={sw}/>,
    file:<path d="M6 2h8l4 4v16H6z" fill="none" stroke={stroke} strokeWidth={sw}/>,
    beaker:<path d="M6 2h12M10 2v8L5 20h14l-5-10V2" fill="none" stroke={stroke} strokeWidth={sw}/>,
    compare:<path d="M7 4v13a3 3 0 106 0V4M7 8h6" fill="none" stroke={stroke} strokeWidth={sw}/>,
    calendar:<path d="M4 7h16M7 3v4m10-4v4M5 7v14h14V7" fill="none" stroke={stroke} strokeWidth={sw}/>,
    chevronUp:<path d="M5 14l7-7 7 7" fill="none" stroke={stroke} strokeWidth={sw}/>,
    chevronDown:<path d="M5 10l7 7 7-7" fill="none" stroke={stroke} strokeWidth={sw}/>,
    calc:<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h2m3 0h2" fill="none" stroke={stroke} strokeWidth={sw}/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" className={className}>{paths[name]||paths.file}</svg>;
}

// ---------- Mock data ----------
const mockProject={
  id:"STYLE-SS25-TEECREW-001",
  title:"SS25 Crew Tee",
  stage:"Quote",
  manager:"Alex Buyer",
  season:"SS25",
  colorway:"Optic White",
  risk:["Fabric yield variance","Loop length drift"],
  gates:[
    {label:"Business Case",done:true},
    {label:"Definition Complete",done:true},
    {label:"3D Fit Approved",done:true},
    {label:"Cost Lock",done:false},
    {label:"Industrialization Ready",done:false},
    {label:"RTM",done:false},
  ],
};

const mockKPIs=[{name:"ECR Cycle Days",series:[9,7,6,8,5,4,5]}];
const mockBOM={lines:[
  {id:"BOM-1",level:1,type:"Fabric",description:"Cotton Jersey 180gsm",supplier:"Mill A",uom:"m",consumption:0.95,wastePct:5,unitPrice:3.2,currency:"USD",effectivity:"All"},
  {id:"BOM-2",level:1,type:"Rib",description:"Rib Knit 2x2",supplier:"Mill B",uom:"m",consumption:0.15,wastePct:5,unitPrice:2.4,currency:"USD",effectivity:"All"},
  {id:"BOM-3",level:1,type:"Trim",description:"Neck Label",supplier:"TrimCo",uom:"pcs",consumption:1,wastePct:2,unitPrice:0.08,currency:"USD",effectivity:"All"},
]};
const mockSpecs={
  pom:[
    {code:"A",point:"Chest 2.5cm below armhole",base:52.0,tol:"+/- 1.0"},
    {code:"B",point:"Body length HPS",base:70.0,tol:"+/- 1.0"},
    {code:"C",point:"Sleeve length from CB",base:42.0,tol:"+/- 0.8"},
  ],
  tests:[
    {name:"4-point fabric",method:"ASTM D5430",limit:"<= 40/100m2",status:"Pending"},
    {name:"Dimensional stability",method:"AATCC 135",limit:"-3%/+1%",status:"Pending"},
  ],
};
const mockAssets={browzwear:[{id:"BW-1234",name:"Crew Tee v5",thumbnail:"",materials:3,trims:4,lastSim:"2025-09-05"}]};
const mockDecisions=[{id:"D-01",title:"Choose jersey supplier",problem:"Match handfeel at 180gsm, lowest cost/m.",options:"Mill A / Mill C",outcome:"Pick Mill A, lower shrinkage variance.",owner:"Alex",date:"2025-09-13"}];
const mockRFQs=[{id:"RFQ-01",vendors:3,due:"2025-09-20",status:"Open"}];
const mockQuotes=[{id:"Q-01",vendor:"Factory Z",fob:3.75,cmt:1.1,lead:28,notes:"Includes rib price break"}];
const mockChanges={ecr:[{id:"ECR-01",title:"Neck drop +5mm",state:"Under Review",ageDays:2}],eco:[{id:"ECO-01",title:"Swap neck label to woven",state:"Open",ageDays:1}]};
const mockValidation={samples:[{id:"SMP-PP1",type:"PP",status:"Submitted",date:"2025-09-12"}],lab:[{id:"LAB-01",test:"4-point",result:22,status:"Pass"}]};

// NEW: Textile Costing data
const mockOperations=[
  {id:"OP-1",name:"Join shoulders",smv:0.6,ratePerHour:2.2,efficiency:0.85},
  {id:"OP-2",name:"Attach neck rib",smv:1.1,ratePerHour:2.2,efficiency:0.85},
  {id:"OP-3",name:"Close sides",smv:0.9,ratePerHour:2.2,efficiency:0.85},
  {id:"OP-4",name:"Hem",smv:0.8,ratePerHour:2.2,efficiency:0.85},
];
const mockOverhead={basis:"labor_pct",ratePct:0.3,perUnit:0.15};
const mockPackaging=[{id:"PK-1",item:"Polybag",perUnit:0.05},{id:"PK-2",item:"Carton alloc",perUnit:0.12}];

// ---------- Costing functions ----------
function clampEfficiency(eff){ if(!isFinite(eff)||eff<=0) return 0.5; return Math.min(1,Math.max(0.5,eff)); }
function materialCost(bom){ return (bom.lines||[]).reduce((sum,l)=> sum + (Number(l.consumption)||0) * (1+((Number(l.wastePct)||0)/100)) * (Number(l.unitPrice)||0), 0); }
function laborCost(ops){ return (ops||[]).reduce((sum,o)=> sum + ((Number(o.smv)||0)/60) * (Number(o.ratePerHour)||0) / clampEfficiency(Number(o.efficiency)||0.85), 0); }
function overheadCost(labor,oh){ return (oh&&oh.basis)==="per_unit" ? (Number(oh.perUnit)||0) : (Number(labor)||0) * (Number(oh.ratePct)||0); }
function packagingCost(pack){ return (pack||[]).reduce((s,p)=> s + (Number(p.perUnit)||0), 0); }
function computeCosting(bom,ops,oh,pack){ const material=materialCost(bom); const labor=laborCost(ops); const overhead=overheadCost(labor,oh); const packaging=packagingCost(pack); const cmt=labor+overhead; const fob=material+packaging+cmt; return {material,labor,overhead,packaging,cmt,fob}; }
function almostEqual(a,b,tol=1e-6){return Math.abs(a-b)<=tol}

async function apiFetch(path,opts={},apiBase,apiKey){
  const base = apiBase || (typeof window!=='undefined' && window.PROJECT_API_BASE) || "";
  const key  = apiKey  || (typeof window!=='undefined' && window.PROJECT_API_KEY)  || "";
  const headers={"Content-Type":"application/json",...(key?{"X-API-Key":key}:{}) ,...(opts.headers||{})};
  const res = await fetch(`${base}${path}`,{...opts,headers});
  if(!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------- Sparkline (SVG) ----------
function Sparkline({points}){
  const w=220,h=60; if(!points||!points.length) return null;
  const max=Math.max(...points),min=Math.min(...points);
  const norm=points.map((v,i)=>({x:(i/(points.length-1))*w, y:h-((v-min)/(max-min||1))*h}));
  const d=norm.map((p,i)=> (i?"L":"M")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  return <svg width={w} height={h}><path d={d} fill="none" stroke="#0ea5e9" strokeWidth="2"/></svg>;
}

// ---------- Main Component ----------
export default function ProjectPage({ projectId, apiBase, apiKey }){
  const [project,setProject]=useState(null);
  const [kpis,setKpis]=useState([]);
  const [bom,setBom]=useState(mockBOM);
  const [specs,setSpecs]=useState(mockSpecs);
  const [assets,setAssets]=useState(mockAssets);
  const [decisions,setDecisions]=useState(mockDecisions);
  const [rfqs,setRFQs]=useState(mockRFQs);
  const [quotes,setQuotes]=useState(mockQuotes);
  const [changes,setChanges]=useState(mockChanges);
  const [validation,setValidation]=useState(mockValidation);
  const [operations,setOperations]=useState(mockOperations);
  const [overhead,setOverhead]=useState(mockOverhead);
  const [packaging,setPackaging]=useState(mockPackaging);
  const [marker,setMarker]=useState({markerWidthCm:150,markerLengthCm:1200,garmentAreaCm2:30000,endLossCm:5});

  const pid=projectId||"STYLE-SS25-TEECREW-001";

  // --- Self tests (keep these) ---
  useEffect(()=>{
    // Icon dependency removed; test formulas only
    const tLabor=laborCost([{smv:6,ratePerHour:2,efficiency:1}]);
    console.assert(almostEqual(tLabor,0.2),`Labor test failed: ${tLabor}`);
    const tOH=overheadCost(10,{basis:"labor_pct",ratePct:0.3,perUnit:0});
    console.assert(almostEqual(tOH,3),`Overhead test failed: ${tOH}`);
    const tMat=materialCost({lines:[{consumption:2,wastePct:5,unitPrice:3}]});
    console.assert(almostEqual(tMat,6.3),`Material test failed: ${tMat}`);
    const tPkg=packagingCost([{perUnit:0.05},{perUnit:0.12}]);
    console.assert(almostEqual(tPkg,0.17),`Packaging test failed: ${tPkg}`);
    const tAll=computeCosting({lines:[{consumption:1,wastePct:0,unitPrice:2}]},[{smv:6,ratePerHour:2,efficiency:1}],{basis:"labor_pct",ratePct:0.5,perUnit:0},[{perUnit:0.1}]);
    // material=2, labor=0.2, oh=0.1, pkg=0.1, cmt=0.3, fob=2.4
    console.assert(almostEqual(tAll.fob,2.4),`Compute test failed: ${JSON.stringify(tAll)}`);
  },[]);

  // data load
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        if(apiBase){
          const p=await apiFetch(`/projects/${pid}`,{},apiBase,apiKey); if(!cancelled) setProject(p);
          const [k,b,s,a,d,r,q,c,v]=await Promise.all([
            apiFetch(`/projects/${pid}/kpis`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/bom`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/specs`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/assets`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/decisions`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/rfqs`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/quotes`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/changes`,{},apiBase,apiKey),
            apiFetch(`/projects/${pid}/validation`,{},apiBase,apiKey),
          ]);
          if(!cancelled){ setKpis(k||[]); setBom(b||mockBOM); setSpecs(s||mockSpecs); setAssets(a||mockAssets); setDecisions(d||mockDecisions); setRFQs(r||mockRFQs); setQuotes(q||mockQuotes); setChanges(c||mockChanges); setValidation(v||mockValidation); }
        }else{
          setProject(mockProject);
        }
      }catch(e){ console.warn("Using mock data:",e); setProject(mockProject); }
    })();
    return ()=>{cancelled=true};
  },[pid,apiBase,apiKey]);

  const kpiSeries=(kpis[0]?.series)||mockKPIs[0].series;
  const costing=useMemo(()=>computeCosting(bom,operations,overhead,packaging),[bom,operations,overhead,packaging]);
  const efficiencyPct=useMemo(()=> (marker.garmentAreaCm2 / (marker.markerWidthCm*marker.markerLengthCm))*100, [marker]);
  const endLossPct=useMemo(()=> (marker.endLossCm / marker.markerLengthCm)*100, [marker]);

  if(!project) return <div className="pg-wrap">Loading…</div>;

  return (
    <div className="pg-wrap">
      <CSS/>

      {/* Header */}
      <div className="sticky">
        <div className="row cols-2">
          <div>
            <div className="title" style={{fontSize:22}}>{project.title}</div>
            <div className="muted small">{project.id} • {project.season} • {project.colorway}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <StatusChip stage={project.stage}/>
            <button className="btn small" style={{marginLeft:8}} onClick={()=>location.reload()}>↻ Refresh</button>
          </div>
        </div>
        <div className="row cols-4" style={{marginTop:8}}>
          <div className="card"><div className="body"><div className="muted small">Gate Checklist</div>{project.gates.map((g,i)=> (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}>
              <div>{g.done?"✅":"⚠️"} <span className="small">{g.label}</span></div>
              <span className={g.done?"ok small":"warn small"}>{g.done?"Done":"Open"}</span>
            </div>
          ))}</div></div>
          <div className="card"><div className="body"><div className="muted small">Critical Risks</div><div>{project.risk.map((r,i)=>(<span key={i} className="badge">{r}</span>))}</div></div></div>
          <div className="card"><div className="body"><div className="muted small">ECR Cycle (days)</div><Sparkline points={kpiSeries}/></div></div>
          <div className="card"><div className="body"><div className="muted small">Textile KPIs</div>
            <div className="row" style={{gridTemplateColumns:"1fr 1fr"}}>
              <div>Marker eff.</div><div className="right">{efficiencyPct.toFixed(2)}%</div>
              <div>End loss</div><div className="right">{endLossPct.toFixed(2)}%</div>
            </div>
          </div></div>
        </div>
      </div>

      {/* Overview */}
      <Section title="Overview" defaultOpen={true}>
        <div className="row cols-3">
          <div className="card" style={{gridColumn:"span 2"}}><div className="body">
            <div className="muted small">Business Case</div>
            <textarea className="textarea" placeholder="What problem are we solving, target channel/price, expected volume…"/>
          </div></div>
          <div className="card"><div className="body">
            <div className="muted small">Owners</div>
            <div className="small">PM: {project.manager}</div>
            <div className="small">Design: —</div>
            <div className="small">Sourcing: —</div>
          </div></div>
        </div>
      </Section>

      {/* Assets */}
      <Section title="Assets (Browzwear)">
        <div className="row cols-3">
          {assets.browzwear.map((a)=>(
            <div key={a.id} className="card"><div className="body">
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div className="title">{a.name}</div>
                <button className="btn small" title="Open in VStitcher">Open <Icon name="ext"/></button>
              </div>
              <div style={{marginTop:8,aspectRatio:"16/9",background:"#f1f5f9",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>🧵</div>
              <div className="row" style={{gridTemplateColumns:"1fr 1fr",marginTop:8}}>
                <div className="small muted">Materials: {a.materials}</div>
                <div className="small muted right">Trims: {a.trims}</div>
                <div className="small muted">Last Sim: {a.lastSim}</div>
                <div className="small muted right">ID: {a.id}</div>
              </div>
            </div></div>
          ))}
          <PublishAsset onUploaded={(added)=> setAssets(s=>({ ...s, browzwear:[...s.browzwear,added]}))} projectId={pid} apiBase={apiBase} apiKey={apiKey}/>
        </div>
      </Section>

      {/* BOM & Specs */}
      <Section title="BOM & Specs" defaultOpen={true}>
        <div className="row cols-3">
          <div className="card" style={{gridColumn:"span 2"}}><div className="body">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="title">Bill of Materials</div>
              <AddBomLine onAdd={(line)=> setBom(b=> ({lines:[...b.lines,line]}))}/>
            </div>
            <div style={{overflowX:"auto",marginTop:8}}>
              <table>
                <thead><tr><th>Type</th><th>Description</th><th>Supplier</th><th>UoM</th><th>Cons.</th><th>Waste%</th><th>Unit Price</th><th>Curr</th><th>Effectivity</th></tr></thead>
                <tbody>
                  {bom.lines.map(l=> (
                    <tr key={l.id}><td>{l.type}</td><td>{l.description}</td><td>{l.supplier}</td><td>{l.uom}</td><td>{l.consumption}</td><td>{l.wastePct}%</td><td>{l.unitPrice}</td><td>{l.currency}</td><td>{l.effectivity}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div></div>

          <div className="card"><div className="body">
            <div className="title">POM & Tolerances</div>
            <div style={{marginTop:8}}>
              {specs.pom.map(p=> (
                <div key={p.code} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,alignItems:"center",padding:"6px 0",borderTop:"1px solid #e2e8f0"}}>
                  <div className="small" style={{fontWeight:600}}>{p.point}</div>
                  <div className="small">Base: {p.base}</div>
                  <div className="small">Tol: {p.tol}</div>
                  <button className="btn small">Edit</button>
                </div>
              ))}
            </div>
            <button className="btn small" style={{marginTop:8}}>+ Add POM</button>
          </div></div>
        </div>
      </Section>

      {/* Costing */}
      <Section title="Costing (CMT / FOB)" defaultOpen={true}>
        <div className="row cols-3">
          <div className="card" style={{gridColumn:"span 2"}}><div className="body">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="title">Operations (SMV)</div>
              <AddOperation onAdd={(op)=> setOperations(o=>[...o,op])}/>
            </div>
            <table style={{marginTop:8}}>
              <thead><tr><th>Op</th><th>SMV</th><th>Rate/hr</th><th>Efficiency</th><th>Cost</th></tr></thead>
              <tbody>
                {operations.map(o=>{const cost=(o.smv/60)*o.ratePerHour/clampEfficiency(o.efficiency);return (
                  <tr key={o.id}><td>{o.name}</td><td>{o.smv.toFixed(2)}</td><td>{o.ratePerHour.toFixed(2)}</td><td>{(o.efficiency*100).toFixed(0)}%</td><td>${cost.toFixed(3)}</td></tr>
                )})}
              </tbody>
              <tfoot><tr style={{borderTop:"1px solid #e2e8f0",fontWeight:600}}><td colSpan={4}>Labor total</td><td>${laborCost(operations).toFixed(3)}</td></tr></tfoot>
            </table>
          </div></div>

          <div className="card"><div className="body">
            <div className="title">Overhead & Packaging</div>
            <div className="small muted" style={{marginTop:4}}>Overhead basis</div>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <button className={"btn small "+(overhead.basis==="labor_pct"?"pill":"")} onClick={()=> setOverhead(o=>({...o,basis:"labor_pct"}))}>Labor %</button>
              <button className={"btn small "+(overhead.basis==="per_unit"?"pill":"")} onClick={()=> setOverhead(o=>({...o,basis:"per_unit"}))}>Per Unit</button>
            </div>
            {overhead.basis==="labor_pct" ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                <div className="small muted">Rate %</div>
                <input className="input" type="number" step="0.01" value={overhead.ratePct} onChange={e=> setOverhead({...overhead,ratePct:parseFloat(e.target.value||"0")})}/>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                <div className="small muted">Per Unit</div>
                <input className="input" type="number" step="0.01" value={overhead.perUnit} onChange={e=> setOverhead({...overhead,perUnit:parseFloat(e.target.value||"0")})}/>
              </div>
            )}
            <div className="small" style={{marginTop:12,fontWeight:600}}>Packaging</div>
            <div style={{marginTop:6}}>
              {packaging.map(p=> (
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",border:"1px solid #e2e8f0",borderRadius:10,padding:"4px 8px",margin:"4px 0"}}>
                  <div className="small">{p.item}</div>
                  <div className="small">${p.perUnit.toFixed(2)}</div>
                </div>
              ))}
              <AddPack onAdd={(line)=> setPackaging(s=>[...s,line])}/>
            </div>
          </div></div>
        </div>

        <div className="row cols-3" style={{marginTop:12}}>
          <div className="card" style={{gridColumn:"span 2"}}><div className="body">
            <div className="title">Totals</div>
            <div className="row" style={{gridTemplateColumns:"1fr 1fr",marginTop:6}}>
              <div>Material</div><div className="right">${costing.material.toFixed(3)}</div>
              <div>Labor</div><div className="right">${costing.labor.toFixed(3)}</div>
              <div>Overhead</div><div className="right">${costing.overhead.toFixed(3)}</div>
              <div>Packaging</div><div className="right">${costing.packaging.toFixed(3)}</div>
              <div style={{fontWeight:600}}>CMT</div><div className="right" style={{fontWeight:600}}>${costing.cmt.toFixed(3)}</div>
              <div style={{fontWeight:700}}>FOB (no freight)</div><div className="right" style={{fontWeight:700}}>${costing.fob.toFixed(3)}</div>
            </div>
          </div></div>
          <div className="card"><div className="body">
            <div className="title">Marker / Utilization</div>
            <div className="row" style={{gridTemplateColumns:"1fr 1fr",marginTop:6}}>
              <div>Marker width (cm)</div><input className="input" type="number" value={marker.markerWidthCm} onChange={e=> setMarker({...marker,markerWidthCm:parseFloat(e.target.value||"0")})}/>
              <div>Marker length (cm)</div><input className="input" type="number" value={marker.markerLengthCm} onChange={e=> setMarker({...marker,markerLengthCm:parseFloat(e.target.value||"0")})}/>
              <div>Garment area (cm²)</div><input className="input" type="number" value={marker.garmentAreaCm2} onChange={e=> setMarker({...marker,garmentAreaCm2:parseFloat(e.target.value||"0")})}/>
              <div>End loss (cm)</div><input className="input" type="number" value={marker.endLossCm} onChange={e=> setMarker({...marker,endLossCm:parseFloat(e.target.value||"0")})}/>
            </div>
            <div className="row" style={{gridTemplateColumns:"1fr 1fr",marginTop:8}}>
              <div>Efficiency</div><div className="right">{efficiencyPct.toFixed(2)}%</div>
              <div>End loss</div><div className="right">{endLossPct.toFixed(2)}%</div>
            </div>
          </div></div>
        </div>

        <div className="card" style={{marginTop:12}}><div className="body">
          <div className="muted small">Self‑tests</div>
          <ul className="small" style={{marginLeft:16}}>
            <li>Labor test (SMV 6, $2/hr, 100% eff) = <b>$0.200</b></li>
            <li>Overhead test (30% of $10 labor) = <b>$3.000</b></li>
            <li>Material test (2m, 5% waste, $3/m) = <b>$6.300</b></li>
            <li>Compute test (see console) = <b>$2.400 FOB</b></li>
          </ul>
        </div></div>
      </Section>

      {/* Knowledge & Decisions */}
      <Section title="Knowledge & Decisions">
        <div className="card"><div className="body">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div className="title">Decision Log</div>
            <AddDecision onAdd={(d)=> setDecisions(s=>[...s,d])}/>
          </div>
          <div style={{marginTop:8}}>
            {decisions.map(d=> (
              <div key={d.id} className="card" style={{margin:"8px 0"}}><div className="body">
                <div style={{display:"flex",justifyContent:"space-between"}}><div className="title">{d.title}</div><div className="small muted">{d.owner} • {d.date}</div></div>
                <div className="row cols-3 small" style={{marginTop:6}}>
                  <div><div className="muted small">Problem</div><div>{d.problem}</div></div>
                  <div><div className="muted small">Options</div><div>{d.options}</div></div>
                  <div><div className="muted small">Outcome</div><div>{d.outcome}</div></div>
                </div>
              </div></div>
            ))}
          </div>
        </div></div>
      </Section>

      {/* RFQs & Quotes */}
      <Section title="RFQs & Quotes">
        <div className="row cols-2">
          <div className="card"><div className="body">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="title">RFQs</div>
              <button className="btn small">+ New RFQ</button>
            </div>
            <table style={{marginTop:8}}>
              <thead><tr><th>RFQ</th><th>Vendors</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>{rfqs.map(r=> (<tr key={r.id}><td>{r.id}</td><td>{r.vendors}</td><td>{r.due}</td><td>{r.status}</td></tr>))}</tbody>
            </table>
          </div></div>
          <div className="card"><div className="body">
            <div className="title">Quotes (normalized)</div>
            <table style={{marginTop:8}}>
              <thead><tr><th>Quote</th><th>Vendor</th><th>FOB</th><th>CMT</th><th>Lead</th><th>Notes</th></tr></thead>
              <tbody>{quotes.map(q=> (<tr key={q.id}><td>{q.id}</td><td>{q.vendor}</td><td>${q.fob.toFixed(2)}</td><td>${q.cmt.toFixed(2)}</td><td>{q.lead}d</td><td>{q.notes}</td></tr>))}</tbody>
            </table>
          </div></div>
        </div>
      </Section>

      {/* Changes */}
      <Section title="Changes (ECR/ECO)">
        <div className="row cols-2">
          <div className="card"><div className="body"><div className="title">ECR</div>
            <table style={{marginTop:8}}><thead><tr><th>ECR</th><th>Title</th><th>State</th><th>Age</th></tr></thead>
            <tbody>{changes.ecr.map(c=> (<tr key={c.id}><td>{c.id}</td><td>{c.title}</td><td>{c.state}</td><td>{c.ageDays}d</td></tr>))}</tbody></table>
          </div></div>
          <div className="card"><div className="body"><div className="title">ECO</div>
            <table style={{marginTop:8}}><thead><tr><th>ECO</th><th>Title</th><th>State</th><th>Age</th></tr></thead>
            <tbody>{changes.eco.map(c=> (<tr key={c.id}><td>{c.id}</td><td>{c.title}</td><td>{c.state}</td><td>{c.ageDays}d</td></tr>))}</tbody></table>
          </div></div>
        </div>
      </Section>

      {/* Validation */}
      <Section title="Validation & Tests">
        <div className="row cols-2">
          <div className="card"><div className="body"><div className="title">Samples</div>
            <div style={{marginTop:6}}>{validation.samples.map(s=> (
              <div key={s.id} className="card" style={{padding:6,margin:"6px 0"}}>
                <div className="body" style={{display:"flex",justifyContent:"space-between",padding:6}}>
                  <div className="small">{s.id} • {s.type}</div>
                  <div className="small muted">{s.status} • {s.date}</div>
                </div>
              </div>
            ))}</div>
          </div></div>
          <div className="card"><div className="body"><div className="title">Lab Results</div>
            <div style={{marginTop:6}}>{validation.lab.map(l=> (
              <div key={l.id} className="card" style={{padding:6,margin:"6px 0"}}>
                <div className="body" style={{display:"flex",justifyContent:"space-between",padding:6}}>
                  <div className="small">{l.id} • {l.test}</div>
                  <div className={"small "+(l.status==="Pass"?"ok":"fail")}>{l.status} ({l.result})</div>
                </div>
              </div>
            ))}</div>
          </div></div>
        </div>
      </Section>

      {/* Timeline */}
      <Section title="Timeline & Tasks">
        <div className="card"><div className="body">
          <div className="row cols-3 small">
            <Milestone label="Definition Complete" date="2025-09-05" done/>
            <Milestone label="3D Fit Approved" date="2025-09-10" done/>
            <Milestone label="Cost Lock" date="2025-09-20" />
            <Milestone label="Industrialization Ready" date="2025-10-05" />
            <Milestone label="RTM" date="2025-10-12" />
          </div>
        </div></div>
      </Section>

      <div style={{height:24}}/>
    </div>
  );
}

function Milestone({label,date,done}){
  return (
    <div className="card"><div className="body" style={{borderColor:done?"#bbf7d0":"#e2e8f0",background:done?"#f0fdf4":"#fff"}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <div>{label}</div>
        <div>{done?"✅":"⚠️"}</div>
      </div>
      <div className="muted small" style={{marginTop:4}}>{date}</div>
    </div></div>
  );
}

function AddBomLine({onAdd}){
  const [form,setForm]=useState({type:"Fabric",description:"",supplier:"",uom:"m",consumption:0,wastePct:0,unitPrice:0,currency:"USD",effectivity:"All"});
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      <input className="input" placeholder="Type" style={{width:100}} value={form.type} onChange={e=> setForm({...form,type:e.target.value})}/>
      <input className="input" placeholder="Supplier" style={{width:120}} value={form.supplier} onChange={e=> setForm({...form,supplier:e.target.value})}/>
      <input className="input" placeholder="Description" style={{minWidth:220,flex:1}} value={form.description} onChange={e=> setForm({...form,description:e.target.value})}/>
      <input className="input" placeholder="UoM" style={{width:70}} value={form.uom} onChange={e=> setForm({...form,uom:e.target.value})}/>
      <input className="input" type="number" step="0.001" placeholder="Cons." style={{width:90}} value={form.consumption} onChange={e=> setForm({...form,consumption:parseFloat(e.target.value||"0")})}/>
      <input className="input" type="number" step="0.1" placeholder="Waste%" style={{width:90}} value={form.wastePct} onChange={e=> setForm({...form,wastePct:parseFloat(e.target.value||"0")})}/>
      <input className="input" type="number" step="0.01" placeholder="Unit Price" style={{width:110}} value={form.unitPrice} onChange={e=> setForm({...form,unitPrice:parseFloat(e.target.value||"0")})}/>
      <input className="input" placeholder="Curr" style={{width:70}} value={form.currency} onChange={e=> setForm({...form,currency:e.target.value})}/>
      <input className="input" placeholder="Effectivity" style={{width:110}} value={form.effectivity} onChange={e=> setForm({...form,effectivity:e.target.value})}/>
      <button className="btn small" onClick={()=> onAdd({id:`BOM-${Math.random().toString(36).slice(2,7)}`,level:1,...form})}>+ Add Line</button>
    </div>
  );
}

function AddDecision({onAdd}){
  const [form,setForm]=useState({title:"",problem:"",options:"",outcome:"",owner:"",date:new Date().toISOString().slice(0,10)});
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      <input className="input" placeholder="Title" style={{minWidth:200}} value={form.title} onChange={e=> setForm({...form,title:e.target.value})}/>
      <input className="input" placeholder="Owner" style={{width:140}} value={form.owner} onChange={e=> setForm({...form,owner:e.target.value})}/>
      <input className="input" type="date" style={{width:160}} value={form.date} onChange={e=> setForm({...form,date:e.target.value})}/>
      <textarea className="textarea" placeholder="Problem" value={form.problem} onChange={e=> setForm({...form,problem:e.target.value})}/>
      <textarea className="textarea" placeholder="Options" value={form.options} onChange={e=> setForm({...form,options:e.target.value})}/>
      <textarea className="textarea" placeholder="Outcome" value={form.outcome} onChange={e=> setForm({...form,outcome:e.target.value})}/>
      <button className="btn" onClick={()=> {onAdd({id:`D-${Math.random().toString(36).slice(2,6)}`,...form}); setForm({...form,title:"",problem:"",options:"",outcome:""});}}>Save</button>
    </div>
  );
}

function AddOperation({onAdd}){
  const [form,setForm]=useState({name:"",smv:0.5,ratePerHour:2.2,efficiency:0.85});
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      <input className="input" placeholder="Name" style={{minWidth:160}} value={form.name} onChange={e=> setForm({...form,name:e.target.value})}/>
      <input className="input" type="number" step="0.05" placeholder="SMV" style={{width:100}} value={form.smv} onChange={e=> setForm({...form,smv:parseFloat(e.target.value||"0")})}/>
      <input className="input" type="number" step="0.05" placeholder="Rate/hr" style={{width:110}} value={form.ratePerHour} onChange={e=> setForm({...form,ratePerHour:parseFloat(e.target.value||"0")})}/>
      <input className="input" type="number" step="0.01" placeholder="Efficiency (0.5–1.0)" style={{width:170}} value={form.efficiency} onChange={e=> setForm({...form,efficiency:parseFloat(e.target.value||"0")})}/>
      <button className="btn small" onClick={()=> onAdd({id:`OP-${Math.random().toString(36).slice(2,6)}`,...form})}>Add</button>
    </div>
  );
}

function AddPack({onAdd}){
  const [form,setForm]=useState({item:"",perUnit:0});
  return (
    <div style={{display:"flex",gap:6,marginTop:6}}>
      <input className="input" placeholder="Item" value={form.item} onChange={e=> setForm({...form,item:e.target.value})}/>
      <input className="input" type="number" step="0.01" placeholder="$ per unit" value={form.perUnit} onChange={e=> setForm({...form,perUnit:parseFloat(e.target.value||"0")})}/>
      <button className="btn small" onClick={()=> {onAdd({id:`PK-${Math.random().toString(36).slice(2,6)}`,...form}); setForm({item:"",perUnit:0});}}>Add</button>
    </div>
  );
}

function PublishAsset({projectId,apiBase,apiKey,onUploaded}){
  const [form,setForm]=useState({garmentId:"",name:"",materials:0,trims:0,lastSim:new Date().toISOString().slice(0,10)});
  const [saving,setSaving]=useState(false);
  return (
    <div className="card" style={{cursor:"pointer"}}><div className="body">
      <div className="title">Publish Browzwear Asset</div>
      <div className="muted small">Send garment/material metadata to this project</div>
      <div className="row cols-2" style={{marginTop:6}}>
        <input className="input" placeholder="Garment ID (from VStitcher)" value={form.garmentId} onChange={e=> setForm({...form,garmentId:e.target.value})}/>
        <input className="input" placeholder="Name" value={form.name} onChange={e=> setForm({...form,name:e.target.value})}/>
        <input className="input" type="number" placeholder="Materials" value={form.materials} onChange={e=> setForm({...form,materials:parseInt(e.target.value||"0")})}/>
        <input className="input" type="number" placeholder="Trims" value={form.trims} onChange={e=> setForm({...form,trims:parseInt(e.target.value||"0")})}/>
        <input className="input" type="date" value={form.lastSim} onChange={e=> setForm({...form,lastSim:e.target.value})}/>
      </div>
      <div style={{marginTop:8}}>
        <button className="btn" disabled={saving} onClick={async()=>{
          try{
            setSaving(true);
            const payload={projectId,...form};
            if(apiBase){ await apiFetch(`/assets/browzwear`,{method:"POST",body:JSON.stringify(payload)},apiBase,apiKey); }
            onUploaded({id: form.garmentId || `BW-${Math.random().toString(36).slice(2,6)}`, name: form.name || "New Garment", materials: form.materials, trims: form.trims, lastSim: form.lastSim, thumbnail: ""});
          }catch(e){ console.error(e);}finally{ setSaving(false); }
        }}>{saving?"Saving…":"Save"}</button>
      </div>
    </div></div>
  );
}
