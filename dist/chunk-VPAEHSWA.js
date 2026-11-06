import{a as O,b as v,d as r,e as R}from"./chunk-TI3WWGOF.js";import{b as q}from"./chunk-WK27VWBU.js";import{b as E,c as w,f as M,g as C}from"./chunk-NAZ3IDPU.js";import"./chunk-7AWJ7NV3.js";import{b as x,c as N}from"./chunk-OKKH6KOX.js";import"./chunk-3LV6IZUO.js";import{c as f,e as T}from"./chunk-VT6D3BZ6.js";import{b as B}from"./chunk-KAH3RM24.js";import{d as I,f as y}from"./chunk-OLZILARS.js";import"./chunk-F5ZXCHQB.js";import{a as m,b as i,c as A,f as b}from"./chunk-4YWINVTS.js";import"./chunk-L4AJNRIM.js";import"./chunk-TLOWU7CN.js";import"./chunk-DN4FWRMN.js";import"./chunk-N36D252V.js";import"./chunk-3GV7AFFR.js";import"./chunk-BF3FLQPO.js";import{k as U,l as j}from"./chunk-63NUBG4A.js";import"./chunk-UDB7VLLD.js";import{a as D,b as g}from"./chunk-FIPRKNBT.js";import{f as P}from"./chunk-XJOHO4SS.js";import{d,i as $}from"./chunk-UEVO3H7G.js";import"./chunk-5Q2C7LES.js";import"./chunk-RF2HAFXK.js";import"./chunk-X5R6I745.js";import"./chunk-RWTK6SFS.js";import"./chunk-WOT6VMZA.js";var k=s=>s.docs.map(t=>({id:t.id,...t.data()}));async function W(){let{db:s,fs:t}=await d(),e=k(await t.getDocs(t.collection(s,"bands")));return Promise.all(e.map(async l=>({...l,members:(await t.getDocs(t.collection(s,"bands",l.id,"members"))).size})))}async function _(){let{db:s,fs:t}=await d(),e=k(await t.getDocs(t.collection(s,"groups")));return Promise.all(e.map(async l=>({...l,members:(await t.getDocs(t.collection(s,"groups",l.id,"members"))).size,songs:k(await t.getDocs(t.collection(s,"groups",l.id,"songs")))})))}async function z(){let{db:s,fs:t}=await d(),e=await t.getDoc(t.doc(s,"adminData","checklist"));return e.exists()?e.data().items||{}:{}}async function G(s,t){let{db:e,fs:l}=await d();await l.setDoc(l.doc(e,"adminData","checklist"),{items:{[s]:{ok:t,at:Date.now()}}},{merge:!0})}var S="https://console.firebase.google.com/project/band-flow-83d4b",h=s=>{m("metricsBody").innerHTML=s};async function H(s){return!!s&&await M(s.uid)}async function L(){let s=f();if(!s){h('<p>Entra con la cuenta de administrador para ver las m\xE9tricas.</p><button type="button" class="btn" id="metricsLogin">Entrar</button>'),m("metricsLogin").addEventListener("click",()=>y("account"));return}if(!await H(s)){h('<p class="warn">Esta p\xE1gina es solo para el administrador de la app.</p>');return}h('<p class="empty">Calculando\u2026</p>');try{let[t,e,l,u,n]=await Promise.all([C(),W().catch(()=>null),_().catch(()=>null),z().catch(()=>({})),U().catch(()=>null)]);K(t,e,l,u,n)}catch(t){h(`<p class="warn">${i($(t))}</p>`)}}var F={ok:["ok","Probado"],few:["warn","Poco probado"],missing:["bad","Falta por probar"]},V=["Android","iOS","Windows","Mac"];function Y(s,t){let e=E(s,t),l=[...new Set(e.map(o=>o.area))],u=e.filter(o=>o.status==="ok"||o.checked).length,n=w(D.map(o=>o.id),s,o=>o.instrumentIds||(o.instrument?[o.instrument]:[])),c=w(V,s,o=>[String(o.platform||"").split(" ")[0]]);return`<h2>Checklist de pruebas</h2>
    <p class="muted small">${u} de ${e.length} partes probadas por 2 testers o m\xE1s (o revisadas por ti). Se rellena sola con lo que usa cada tester; los que no han abierto la app desde esta versi\xF3n a\xFAn no cuentan.</p>
    ${l.map(o=>`<h3>${i(o)}</h3><div class="list">${e.filter(a=>a.area===o).map(a=>`<div class="list-row check-row">
      <span><b>${i(a.label)}</b><small>${a.count?`${a.count} ${a.count===1?"tester":"testers"}: ${i(a.names.join(", "))}${a.count>a.names.length?"\u2026":""}`:"Nadie todav\xEDa"}</small></span>
      <span class="check-side"><span class="pill ${F[a.status][0]}">${F[a.status][1]}</span>
      <label class="check-chip"><input type="checkbox" data-check="${i(a.id)}" ${a.checked?"checked":""}> Revisado</label></span></div>`).join("")}</div>`).join("")}
    <h3>Instrumentos sin probar</h3>
    <p>${n.length?n.map(o=>`<span class="pill">${i(g(o).name)}</span>`).join(" "):'<span class="pill ok">Todos probados</span>'}</p>
    <h3>Sistemas sin probar</h3>
    <p>${c.length?c.map(o=>`<span class="pill">${i(o)}</span>`).join(" "):'<span class="pill ok">Todos probados</span>'}</p>`}var Q="-08-31";function J(s){if(!s)return"";let t=`${new Date().getMonth()>=8?new Date().getFullYear()+1:new Date().getFullYear()}${Q}`;return`<h2>Escuelas</h2>${s.length?`<div class="list">${s.map(e=>`<div class="list-row check-row"><span><b>${i(e.name)}</b><small>${i(e.ownerName||"")} \xB7 ${A(e.students)} alumnos \xB7 curso ${i(e.year||"")}</small></span>
    <span class="check-side">${P(e)?`<span class="pill ok">Premium hasta ${i(e.premium.until)}</span><button type="button" class="btn ghost small" data-premium="${i(e.id)}" data-on="0">Quitar</button>`:`${e.proRequestedAt?'<span class="pill warn">Pide el Aula Pro</span>':'<span class="pill">Modo prueba</span>'}<button type="button" class="btn small" data-premium="${i(e.id)}" data-on="1" data-until="${t}">Activar premium</button>`}</span></div>`).join("")}</div>`:'<p class="muted small">Todav\xEDa no hay escuelas.</p>'}`}function K(s,t,e,l={},u=null){let n=x(s.map(a=>({...a,instrumentName:a.instrument?g(a.instrument).name:""}))),c=e?N(e):null,o=t?t.reduce((a,p)=>a+Math.max(0,p.members-1),0):0;h(`<p class="muted small">Datos de los usuarios con cuenta. Se actualizan cada vez que alguien usa la app. ${new Date().toLocaleString(B())}</p>
    <div class="tiles">
      ${r({label:"Usuarios con cuenta",value:n.total,hint:`${n.newThisWeek} nuevos esta semana`})}
      ${r({label:"Activos hoy",value:n.active1})}
      ${r({label:"Activos 7 d\xEDas",value:n.active7,hint:`${n.total?Math.round(n.active7/n.total*100):0} % del total`})}
      ${r({label:"Activos 30 d\xEDas",value:n.active30})}
      ${r({label:"Minutos de pr\xE1ctica",value:n.minutes,hint:`${n.minutesPerUser} por usuario`})}
      ${r({label:"Lecciones tocadas",value:n.lessons})}
    </div>
    ${Y(s,l)}
    <h2>Altas por semana</h2>
    ${O(n.signups,{unit:"altas",title:"Usuarios nuevos por semana",xLabels:[0,3,7]})}
    <h2>\xBFVuelven?</h2>
    ${v(n.retention.map(a=>({label:a.label,value:a.value,display:`${a.value} %`})),{max:100})}
    <h2>Instrumentos</h2>
    ${v(n.instruments.slice(0,10))}
    <h2>Dispositivos</h2>
    ${v(n.platforms.slice(0,8))}
    <h2>Bandas y grupos</h2>
    <div class="tiles">
      ${r({label:"Bandas",value:t?t.length:"\u2014",hint:t?`${o} m\xFAsicos`:"sin permiso todav\xEDa"})}
      ${r({label:"Usuarios en una banda",value:n.inBand})}
      ${r({label:"Grupos",value:c?c.groups:"\u2014",hint:c?`${c.members} m\xFAsicos`:""})}
      ${r({label:"Canciones de grupo",value:c?c.songs:"\u2014",hint:c?`${c.tracks} pistas \xB7 ${c.megabytes} MB`:""})}
    </div>
    ${t&&t.length?`<div class="table-wrap"><table class="prog-table"><thead><tr><th>Banda</th><th>Director</th><th class="num">M\xFAsicos</th></tr></thead><tbody>
      ${t.sort((a,p)=>p.members-a.members).map(a=>`<tr><td>${i(a.name)}</td><td>${i(a.directorName||"")}</td><td class="num">${Math.max(0,a.members-1)}</td></tr>`).join("")}</tbody></table></div>`:""}
    ${J(u)}
    <div class="row"><button type="button" class="btn small" id="metricsTesters">Lista de testers y CSV</button><button type="button" class="btn ghost small" id="metricsReload">Actualizar</button></div>
    <h2>M\xE1s datos en Firebase</h2>
    <div class="list">
      <a class="list-row" href="${S}/analytics" target="_blank" rel="noopener"><span><b>Google Analytics</b><small>Visitas, pantallas y pa\xEDses (cuando est\xE9 activado)</small></span><span class="chev">\u203A</span></a>
      <a class="list-row" href="${S}/firestore/databases/-default-/usage" target="_blank" rel="noopener"><span><b>Uso de la base de datos</b><small>Lecturas, escrituras y espacio frente al l\xEDmite gratuito</small></span><span class="chev">\u203A</span></a>
      <a class="list-row" href="${S}/authentication/users" target="_blank" rel="noopener"><span><b>Usuarios registrados</b><small>Cuentas de Google y correo</small></span><span class="chev">\u203A</span></a>
    </div>`),R(m("metricsBody")),m("metricsTesters").addEventListener("click",q),m("metricsBody").querySelectorAll("[data-premium]").forEach(a=>a.addEventListener("click",async()=>{try{await j(a.dataset.premium,a.dataset.on==="1"?{active:!0,until:a.dataset.until,since:Date.now()}:{active:!1}),b(a.dataset.on==="1"?"Licencia de escuela activada":"Licencia quitada"),L()}catch(p){b($(p))}})),m("metricsBody").querySelectorAll("[data-check]").forEach(a=>a.addEventListener("change",async()=>{try{await G(a.dataset.check,a.checked)}catch(p){a.checked=!a.checked,b($(p))}})),m("metricsReload").addEventListener("click",L)}I("metrics",{enter:L});if(new URLSearchParams(location.search).get("panel")==="metricas"){let s=!1,t=e=>{e&&!s&&(s=!0,setTimeout(()=>y("metrics"),400))};T(t),t(f())}export{Y as checklistHtml};
