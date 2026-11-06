import{a as b,b as n,c as h,d as v,e as $,f}from"./chunk-SVTYFCMW.js";import"./chunk-PDBVDUOL.js";import{a as u}from"./chunk-RTLD5G7O.js";import{d,f as m}from"./chunk-AJPXFMDT.js";import{a as i,b as s,g as l}from"./chunk-T5THFYRA.js";import"./chunk-6Y7WX3ES.js";import"./chunk-S4JANXCS.js";import"./chunk-TLOWU7CN.js";import"./chunk-6WIKIBXO.js";import{n as c}from"./chunk-R33UIG4G.js";import{b as r}from"./chunk-FIPRKNBT.js";import"./chunk-WOT6VMZA.js";var j={tuner:"Abrir el afinador",longtone:"Hacer notas tenidas",metro:"Abrir el metr\xF3nomo"};function y(t,e){if(!t.ready){let a=Math.round(Math.min(1,t.progress||0)*100);return a?`<div class="panel tip-box tip-coach"><h2>Consejos para ti</h2>
      <p class="muted">Toca unas cuantas lecciones m\xE1s y aqu\xED te dir\xE9 qu\xE9 detalle de t\xE9cnica puede estar haciendo que se te vayan las notas.</p>
      <div class="bar-track" role="progressbar" aria-label="Datos para tus consejos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a}"><i style="width:${a}%"></i></div></div>`:`<div class="panel tip-box tip-coach tip-empty"><span class="tip-empty-art" aria-hidden="true">${l("tips")}</span>
        <div><h2>Consejos para ti</h2><p class="muted">Toca tus primeras lecciones y aqu\xED aparecer\xE1n consejos de t\xE9cnica hechos a tu medida.</p></div></div>`}return t.items.length?`<div class="panel tip-box tip-coach"><h2>Consejos para ti</h2><p class="muted small">A partir de lo que has tocado con este instrumento.</p>
    ${t.items.map(a=>{let o=f(e,a.tip);return`<div class="tip-advice">
        <h3>${s(a.title)}</h3>
        <p class="tip-evidence">${a.evidence.map(p=>`<span class="pill">${s(p.label)}: <b>${s(p.value)}</b></span>`).join(" ")}</p>
        <p>${s(a.why)}</p>
        <p><b>Prueba esto:</b> <span>${s(a.action)}</span></p>
        <div class="row">${o?`<button type="button" class="btn small" data-tip-jump="${s(o.kind)}"><span>Ver c\xF3mo se hace:</span> <span>${s(o.title)}</span></button>`:""}
        ${a.goto?`<button type="button" class="btn ghost small" data-tip-go="${s(a.goto)}">${s(j[a.goto])}</button>`:""}</div>
      </div>`}).join("")}</div>`:'<div class="panel tip-box tip-coach ok"><h2>Consejos para ti</h2><p>No veo ning\xFAn fallo que se repita: sigue as\xED. Revisa de vez en cuando los b\xE1sicos de abajo.</p></div>'}function k(t){let e=b(t.art);return`<article class="panel tip-box tip-card" id="tip-${s(t.kind)}">
    <h2>${s(t.title)}</h2>
    <p>${s(t.intro)}</p>
    <ol class="tip-steps">${t.steps.map((a,o)=>`<li class="tip-step">
      <div class="tip-figure">${n(t.art,o)?h(n(t.art,o),a.t):e[o]||""}<span class="tip-num">${o+1}</span></div>
      <p><b>${s(a.t)}</b><br>${s(a.d)}</p></li>`).join("")}</ol>
    <p class="tip-check"><b>Comprueba:</b> <span>${s(t.check)}</span></p>
    ${t.avoid&&t.avoid.length?`<p class="tip-avoid"><b>Evita:</b></p><ul class="tip-avoid-list">${t.avoid.map(a=>`<li>${s(a)}</li>`).join("")}</ul>`:""}
    <details class="tip-sources"><summary>Fuentes</summary><ul>${t.sources.map(a=>`<li>${s(v[a])}</li>`).join("")}</ul></details>
  </article>`}function q({kind:t}={}){let e=c(),a=r(e.instrument),o=$(e.instrument);i("tipsTitle").innerHTML=`<span>Consejos</span> \xB7 <span>${s(a.name)}</span>`,i("tipsBody").innerHTML=y(u(),e.instrument)+(o.length?o.map(k).join(""):'<p class="muted">Pronto habr\xE1 consejos para este instrumento.</p>'),t&&requestAnimationFrame(()=>g(t))}function g(t){let e=document.getElementById("tip-"+t);e&&e.scrollIntoView({behavior:"smooth",block:"start"})}d("tips",{enter:q});i("tipsBody").addEventListener("click",t=>{let e=t.target.closest("[data-tip-jump]");if(e){g(e.dataset.tipJump);return}let a=t.target.closest("[data-tip-go]");a&&m(a.dataset.tipGo)});
