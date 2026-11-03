import{Ba as N,Da as O,Ha as F,Ia as U,za as n}from"./chunk-EDKYZXAT.js";[["Consejos","Tips"],["Consejos para ti","Tips for you"],["Comprueba:","Check:"],["Evita:","Avoid:"],["Fuentes","Sources"],["Prueba esto:","Try this:"],["Ver c\xF3mo se hace:","See how it is done:"],["Consejos de t\xE9cnica","Technique tips"],["Embocadura, postura y respiraci\xF3n, y qu\xE9 corregir seg\xFAn c\xF3mo tocas","Embouchure, posture and breathing, and what to fix based on how you play"],["Postura, arco y mano izquierda, y qu\xE9 corregir seg\xFAn c\xF3mo tocas","Posture, bow and left hand, and what to fix based on how you play"],["Postura y las dos manos, y qu\xE9 corregir seg\xFAn c\xF3mo tocas","Posture and both hands, and what to fix based on how you play"],["Postura y posici\xF3n de la mano, y qu\xE9 corregir seg\xFAn c\xF3mo tocas","Posture and hand position, and what to fix based on how you play"],["Postura y golpe, y qu\xE9 corregir seg\xFAn c\xF3mo tocas","Posture and stroke, and what to fix based on how you play"],["Consejo para ti","A tip for you"],["Ver por qu\xE9 y c\xF3mo se hace","See why and how to do it"],["A partir de lo que has tocado con este instrumento.","Based on what you have played on this instrument."],["Toca unas cuantas lecciones m\xE1s y aqu\xED te dir\xE9 qu\xE9 detalle de t\xE9cnica puede estar haciendo que se te vayan las notas.","Play a few more lessons and I will tell you here which technique detail may be pulling your notes off."],["No veo ning\xFAn fallo que se repita: sigue as\xED. Revisa de vez en cuando los b\xE1sicos de abajo.","I do not see any repeated mistake: keep it up. Review the basics below from time to time."],["Pronto habr\xE1 consejos para este instrumento.","Tips for this instrument are coming soon."],["Abrir el afinador","Open the tuner"],["Hacer notas tenidas","Do long notes"],["Abrir el metr\xF3nomo","Open the metronome"]].forEach(([e,t])=>n(e,t));var te=3,oe=864e5;function re(){let e=F(),t=O(e.instrument);return N(t,(e.tuning||{})[e.instrument]||{},(e.coach||{})[e.instrument],{recentAcc:e.recentAcc||[]})}function Me(e=Date.now()){let t=F(),i=t.tipsSeen||{};return re().items.find($=>!i[`${t.instrument}:${$.id}`]||e-i[`${t.instrument}:${$.id}`]>te*oe)||null}function be(e,t=Date.now()){let i=F();U({tipsSeen:{...i.tipsSeen||{},[`${i.instrument}:${e.id}`]:t}})}var o={skin:"#F1DCC6",skinLine:"#C9A985",gum:"#F4E3D3",lip:"#D9827A",tooth:"#FFFFFF",toothLine:"#9AA3B2",mp:"#1E2430",reed:"#D9B26A",brass:"#D7A63A",brassDark:"#A87A1F",green:"#2B7A4B",red:"#C2372F",accent:"#B4461F",ink:"#141B26",muted:"#5A6678",wood:"#A0632B",woodLight:"#D9A066",shirt:"#B4461F",pants:"#2F55A4",silver:"#B8C0CC",floor:"#E2D7CB",paper:"#F7F3EE"},h=(e,t,i=0,d=1)=>`<linearGradient id="${e}" x1="0" y1="0" x2="${i}" y2="${d}">${t.map(([$,p])=>`<stop offset="${$}" stop-color="${p}"/>`).join("")}</linearGradient>`,ie=[h("gSkin",[[0,"#F8E6D3"],[.55,"#EFD3B8"],[1,"#DDB894"]],1,1),h("gLip",[[0,"#E79A90"],[1,"#C46A61"]]),h("gBrass",[[0,"#F7DD8E"],[.35,"#E0B24A"],[.7,"#B8862A"],[1,"#8E6418"]],1,.4),h("gSilver",[[0,"#F5F7FA"],[.4,"#D2D8E0"],[.75,"#A9B2BE"],[1,"#8A93A3"]]),h("gBlack",[[0,"#545C6A"],[.35,"#262C37"],[1,"#0E1218"]]),h("gReed",[[0,"#EDCB86"],[1,"#C0954A"]]),h("gViolin",[[0,"#D98A42"],[.5,"#B9662A"],[1,"#8C4718"]],1,1),h("gSpruce",[[0,"#F0CB8A"],[1,"#D19E58"]],1,1),h("gWood",[[0,"#E6B47A"],[1,"#B07338"]],1,1),h("gBox",[[0,"#F0D8A8"],[1,"#CDA868"]],1,0),h("gShirt",[[0,"#C9592E"],[1,"#952F12"]],.4,1),h("gPants",[[0,"#3F69BD"],[1,"#22427F"]],.4,1),h("gPlate",[[0,"#F2D49F"],[1,"#D7AE6C"]],1,1)].join(""),ne='<filter id="tipShadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#3A2A1A" flood-opacity=".22"/></filter>',se=`<defs><marker id="tipArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${o.green}"/></marker>
<marker id="tipArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${o.red}"/></marker>${ie}${ne}</defs>`,G={"#F1DCC6":"gSkin","#D9827A":"gLip","#D7A63A":"gBrass","#C9D0DA":"gSilver","#C3CAD4":"gSilver","#B8C0CC":"gSilver","#1E2430":"gBlack","#D9B26A":"gReed","#C2742F":"gViolin","#E2B26E":"gSpruce","#D9A066":"gWood","#E3C58E":"gBox","#B4461F":"gShirt","#2F55A4":"gPants","#E8C38A":"gPlate"},le=e=>e.replace(/fill="(#[0-9A-Fa-f]{6})"/g,(t,i)=>G[i.toUpperCase()]?`fill="url(#${G[i.toUpperCase()]})"`:t),u=e=>`<svg viewBox="0 0 270 230" class="tip-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${se}<g filter="url(#tipShadow)">${le(e)}</g></svg>`,m=(e,t=o.green,i=3)=>`<path d="${e}" fill="none" stroke="${t}" stroke-width="${i}" stroke-linecap="round" marker-end="url(#${t===o.red?"tipArrowRed":"tipArrow"})"/>`,l=(e,t,i,{color:d=o.green,anchor:$="start",size:p=14,weight:a=800}={})=>`<text x="${e}" y="${t}" font-size="${p}" font-weight="${a}" fill="${d}" text-anchor="${$}" font-family="Figtree, Segoe UI, Roboto, sans-serif">${i}</text>`,x=(e,t)=>`<circle cx="${e}" cy="${t}" r="13" fill="${o.green}"/><path d="M${e-6} ${t} l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,S=(e,t)=>`<circle cx="${e}" cy="${t}" r="13" fill="${o.red}"/><path d="M${e-5} ${t-5} l10 10 M${e+5} ${t-5} l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,M=(e,t=o.green)=>`<path d="${e}" fill="none" stroke="${t}" stroke-width="2" stroke-dasharray="6 6"/>`;var r={body:"#C2742F",edge:"#6E3B12",board:"#1C1C1C",bridge:"#F1E2C6",hair:"#EFE7D6",stick:"#5B3414",chin:"#2A2A2A",rest:"#3A3F48"},s=o.skin,c=o.skinLine;function P(){let e="M0 -72 C20 -72 34 -62 34 -44 C34 -28 22 -22 20 -12 C18 -2 20 6 24 12 C38 22 40 40 38 52 C36 66 22 74 0 74 C-22 74 -36 66 -38 52 C-40 40 -38 22 -24 12 C-20 6 -18 -2 -20 -12 C-22 -22 -34 -28 -34 -44 C-34 -62 -20 -72 0 -72 Z",t=i=>`<path d="M${i*15} 6 c${i*-5} 4 ${i*5} 10 0 14 c${i*-5} 4 ${i*5} 10 0 14" fill="none" stroke="${r.edge}" stroke-width="2.4" stroke-linecap="round"/>`;return`<path d="${e}" fill="${r.body}" stroke="${r.edge}" stroke-width="2.5"/>
    <path d="${e}" fill="none" stroke="#E9B07A" stroke-width="1" transform="scale(.9)" opacity=".8"/>
    ${t(1)}${t(-1)}
    <path d="M-5 -150 L5 -150 L4 -174 L-4 -174 Z" fill="${r.body}" stroke="${r.edge}" stroke-width="1.5"/>
    <rect x="-11" y="-170" width="6" height="4" rx="1" fill="${r.chin}"/><rect x="5" y="-162" width="6" height="4" rx="1" fill="${r.chin}"/>
    <rect x="-11" y="-160" width="6" height="4" rx="1" fill="${r.chin}"/><rect x="5" y="-170" width="6" height="4" rx="1" fill="${r.chin}"/>
    <circle cx="0" cy="-181" r="8" fill="${r.body}" stroke="${r.edge}" stroke-width="1.8"/><path d="M0 -181 m-4 0 a4 4 0 1 1 4 4" fill="none" stroke="${r.edge}" stroke-width="1.4"/>
    <rect x="-7" y="-150" width="14" height="160" rx="3" fill="${r.board}"/>
    <rect x="-16" y="22" width="32" height="5" rx="1.5" fill="${r.bridge}" stroke="#A9926A" stroke-width="1"/>
    <path d="M-8 42 L8 42 L5 68 L-5 68 Z" fill="${r.board}"/>
    <ellipse cx="-21" cy="62" rx="15" ry="9" fill="${r.chin}"/>
    ${[-4.5,-1.5,1.5,4.5].map(i=>`<line x1="${i}" y1="-150" x2="${i*.9}" y2="44" stroke="#E8E8E8" stroke-width=".9"/>`).join("")}`}var Y=(e,t,i,d)=>`<g transform="translate(${e} ${t}) rotate(${i}) scale(${d})">${P()}</g>`;function H(e,t){return`<path d="M${e-92} 232 C${e-92} ${t+70} ${e-70} ${t+52} ${e-30} ${t+46} L${e+30} ${t+46} C${e+70} ${t+52} ${e+92} ${t+70} ${e+92} 232 Z" fill="${o.shirt}"/>
    <path d="M${e-30} ${t+46} L${e} ${t+76} L${e+30} ${t+46} Z" fill="${s}"/>
    <rect x="${e-11}" y="${t+22}" width="22" height="30" fill="${s}"/>
    <path d="M${e-6} ${t+52} C${e-18} ${t+50} ${e-34} ${t+52} ${e-44} ${t+56}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${e+6} ${t+52} C${e+18} ${t+50} ${e+34} ${t+52} ${e+44} ${t+56}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="${e}" cy="${t}" rx="27" ry="31" fill="${s}" stroke="${c}" stroke-width="2.5"/>
    <path d="M${e-26} ${t-8} C${e-26} ${t-34} ${e+26} ${t-34} ${e+26} ${t-8} C${e+18} ${t-22} ${e-18} ${t-22} ${e-26} ${t-8} Z" fill="#6B4A2E"/>
    <circle cx="${e-10}" cy="${t-2}" r="2.6" fill="${o.ink}"/><circle cx="${e+10}" cy="${t-2}" r="2.6" fill="${o.ink}"/>
    <path d="M${e} ${t+1} L${e-3} ${t+12} L${e+3} ${t+12}" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M${e-7} ${t+19} Q${e} ${t+23} ${e+7} ${t+19}" fill="none" stroke="${o.lip}" stroke-width="2.4" stroke-linecap="round"/>`}function $e(){let e=(t,i)=>`<path d="M${t-9} 92 C${t-11} 108 ${t-8} ${118+i} ${t} ${124+i} C${t+8} ${118+i} ${t+11} 108 ${t+9} 92 Z" fill="${s}" stroke="${c}" stroke-width="2.2"/>
    <path d="M${t-7} 112 Q${t} 116 ${t+7} 112" fill="none" stroke="${c}" stroke-width="1.4"/>`;return`<line x1="6" y1="116" x2="266" y2="110" stroke="${r.stick}" stroke-width="6" stroke-linecap="round"/>
    <line x1="96" y1="140" x2="266" y2="126" stroke="${r.hair}" stroke-width="4"/>
    <path d="M40 118 L98 117 L98 138 C80 144 58 144 44 138 Z" fill="${r.board}"/>
    <rect x="94" y="116" width="8" height="25" fill="${o.silver}"/>
    <circle cx="60" cy="129" r="4" fill="#E7D9B5"/>
    <path d="M96 96 C100 70 130 58 168 60 C196 62 210 78 206 96 Z" fill="${s}" stroke="${c}" stroke-width="2.2"/>
    ${e(196,6)}${e(172,14)}${e(148,12)}
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${s}" stroke-width="14" stroke-linecap="round"/>
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${c}" stroke-width="1.6"/>
    <circle cx="100" cy="112" r="2" fill="${o.green}"/>
    <path d="M150 176 C136 176 128 162 134 150 L146 132 C150 126 158 128 156 136 L152 150 C150 160 156 170 150 176 Z" fill="${s}" stroke="${c}" stroke-width="2.2"/>
    <path d="M150 176 C150 196 160 214 172 232" fill="none" stroke="${s}" stroke-width="24" stroke-linecap="round"/>`}function ae(e=0,t=0){return`<g transform="translate(${e} ${t})">
    <path d="M70 34 C100 18 136 26 146 52 L154 70 L146 74 C149 84 146 90 140 92 C140 100 134 106 124 108 C112 112 96 112 84 104 C66 94 58 76 58 60 C58 48 62 40 70 34 Z" fill="${s}" stroke="${c}" stroke-width="2.5"/>
    <path d="M60 46 C66 28 98 18 126 26 C108 26 90 34 80 50 Z" fill="#6B4A2E"/>
    <ellipse cx="86" cy="66" rx="7" ry="10" fill="${s}" stroke="${c}" stroke-width="2"/>
    <circle cx="132" cy="54" r="2.6" fill="${o.ink}"/>
    <path d="M136 86 L144 86" stroke="${o.lip}" stroke-width="2.4" stroke-linecap="round"/></g>`}function de(e){let t=[-114,-100,-80,-66],i=e.map((d,$)=>[d,t[$]]);return i.map(([d,$],p)=>{let a=8+p%2*132,k=30+Math.floor(p/2)*100,y=a+58,E=k+128,C=70,w=v=>{let L=v*Math.PI/180;return[y+C*Math.cos(L),E+C*Math.sin(L)]},[g,D]=w(-124),[B,A]=w(-56),f=`<path d="M${g.toFixed(1)} ${k+94} L${g.toFixed(1)} ${D.toFixed(1)} A${C} ${C} 0 0 1 ${B.toFixed(1)} ${A.toFixed(1)} L${B.toFixed(1)} ${k+94} Z" fill="${r.bridge}" stroke="#A9926A" stroke-width="1.5"/>`,V=i.map(([,v],L)=>{let[J,ee]=w(v);return`<circle cx="${J.toFixed(1)}" cy="${ee.toFixed(1)}" r="${L===p?5:3.2}" fill="${L===p?o.green:"#777"}"/>`}).join(""),R=$*Math.PI/180,[W,X]=w($),T=Math.cos(R),z=Math.sin(R),I=-z,j=T,_=W+T*5,q=X+z*5,K=`<line x1="${(_-I*54).toFixed(1)}" y1="${(q-j*54).toFixed(1)}" x2="${(_+I*54).toFixed(1)}" y2="${(q+j*54).toFixed(1)}" stroke="${r.stick}" stroke-width="4" stroke-linecap="round"/>`,Q=`<rect x="${a+112}" y="${k+10}" width="6" height="74" rx="3" fill="#E9E2D8"/><rect x="${a+109}" y="${k+12+p*18}" width="12" height="10" rx="3" fill="${o.green}"/>`;return`<rect x="${a}" y="${k}" width="126" height="94" rx="10" fill="#FBF8F4" stroke="#E2D7CB"/>${f}${V}${K}${Q}${l(a+8,k+18,d,{color:o.ink,size:14})}`}).join("")}var ve={"violin-hold":[u(`${H(92,62)}
      <path d="M128 112 C140 104 160 102 172 108 L170 116 C158 112 142 114 130 120 Z" fill="${r.rest}"/>
      ${Y(152,80,65,.55)}
      <circle cx="140" cy="113" r="9" fill="none" stroke="${o.green}" stroke-width="3"/>
      ${m("M222 182 L150 120")}${l(222,204,n("clav\xEDcula","collarbone"),{anchor:"middle"})}`),u(`<path d="M20 232 C26 176 60 158 96 152 L190 152 C230 158 256 184 260 232 Z" fill="${o.shirt}"/>
      <rect x="92" y="100" width="26" height="56" fill="${s}"/>
      ${ae(0,2)}
      <path d="M102 132 C102 124 108 122 116 122 L200 122 C208 122 212 126 212 132 L212 144 C212 150 208 152 200 152 L116 152 C108 152 102 150 102 144 Z" fill="${r.body}" stroke="${r.edge}" stroke-width="2"/>
      <line x1="104" y1="137" x2="210" y2="137" stroke="${r.edge}" stroke-width="1" opacity=".6"/>
      <path d="M212 126 L252 124 L252 130 L212 134 Z" fill="${r.board}"/>
      <circle cx="258" cy="126" r="7" fill="${r.body}" stroke="${r.edge}" stroke-width="1.8"/>
      <path d="M100 116 C104 108 132 106 144 112 L146 124 L104 126 Z" fill="${r.chin}"/>
      <path d="M118 154 C130 150 150 150 164 154 L162 160 L120 162 Z" fill="${r.rest}"/>
      ${m("M112 0 L112 28")}${l(124,18,n("peso de la cabeza","head weight"))}
      ${x(238,196)}${l(206,222,n("hombro bajo","shoulder down"),{color:"#fff",anchor:"middle",size:13})}`),u(`${H(96,64)}
      ${Y(147,96,81,.57)}
      ${M("M100 78 L262 78")}
      <circle cx="96" cy="76" r="4" fill="${o.green}"/><circle cx="251" cy="78" r="5" fill="none" stroke="${o.green}" stroke-width="2.5"/>
      ${l(258,64,n("voluta = nariz","scroll = nose"),{anchor:"end",size:13})}`)],"violin-bow":[u(`${$e()}
      ${m("M84 196 L132 160")}${l(30,214,n("pulgar doblado","bent thumb"),{size:13})}
      ${m("M60 58 L92 84")}${l(40,46,n("me\xF1ique de pie","pinky standing"),{size:13})}
      ${x(240,28)}`),u(`<g transform="translate(130 92) scale(1.15)">${P()}</g>
      <line x1="4" y1="108" x2="266" y2="108" stroke="${r.stick}" stroke-width="5" stroke-linecap="round"/>
      <line x1="4" y1="113" x2="266" y2="113" stroke="${r.hair}" stroke-width="3"/>
      <path d="M140 108 L140 98 L130 98" fill="none" stroke="${o.green}" stroke-width="2"/>
      <path d="M178 96 L200 82" stroke="${o.ink}" stroke-width="1.2"/>${l(202,82,n("diapas\xF3n","fingerboard"),{color:o.ink,size:12})}
      <path d="M150 120 L200 140" stroke="${o.ink}" stroke-width="1.2"/>${l(202,146,n("puente","bridge"),{color:o.ink,size:12})}
      ${x(238,196)}`),u(`${de([n("Sol","G"),n("Re","D"),n("La","A"),n("Mi","E")])}
      ${l(262,20,n("verde = altura del codo","green = elbow height"),{size:11,anchor:"end"})}`)],"violin-left":[u(`<rect x="10" y="44" width="110" height="14" rx="4" fill="${r.board}"/><rect x="10" y="58" width="110" height="10" rx="4" fill="${r.body}"/>
      <path d="M44 232 L72 120" stroke="${s}" stroke-width="26" stroke-linecap="round"/>
      <path d="M72 120 L80 80" stroke="${s}" stroke-width="22" stroke-linecap="round"/>
      <path d="M78 82 C80 58 96 40 108 44" fill="none" stroke="${s}" stroke-width="10" stroke-linecap="round"/>
      <path d="M78 82 C78 62 88 46 96 44" fill="none" stroke="${c}" stroke-width="1.5"/>
      ${M("M40 238 L84 66")}${x(110,200)}
      <rect x="150" y="44" width="110" height="14" rx="4" fill="${r.board}"/><rect x="150" y="58" width="110" height="10" rx="4" fill="${r.body}"/>
      <path d="M216 232 L232 150" stroke="${s}" stroke-width="26" stroke-linecap="round"/>
      <path d="M232 150 C224 116 206 84 190 70" stroke="${s}" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M190 70 C196 54 222 46 236 46" fill="none" stroke="${s}" stroke-width="10" stroke-linecap="round"/>
      ${S(250,200)}${l(214,102,n("palma pegada","palm on neck"),{color:o.red,size:12,anchor:"end"})}`),u(`<path d="M95 92 L175 92 L175 104 C175 136 158 150 135 150 C112 150 95 136 95 104 Z" fill="${r.body}" stroke="${r.edge}" stroke-width="2"/>
      <rect x="92" y="84" width="86" height="10" rx="3" fill="${r.board}"/>
      ${[108,126,144,162].map(e=>`<circle cx="${e}" cy="82" r="2.6" fill="#BBB"/>`).join("")}
      <path d="M92 180 C110 200 160 200 186 176" fill="none" stroke="${s}" stroke-width="22" stroke-linecap="round"/>
      <path d="M70 200 C68 168 76 136 92 118" fill="none" stroke="${s}" stroke-width="18" stroke-linecap="round"/>
      <path d="M186 176 C204 140 200 96 184 72 C174 60 158 60 152 70 L148 80" fill="none" stroke="${s}" stroke-width="15" stroke-linecap="round"/>
      <path d="M112 158 C122 168 150 170 166 160" fill="${o.green}" opacity=".18" stroke="${o.green}" stroke-dasharray="4 4"/>
      ${l(135,222,n("hueco","gap"),{anchor:"middle"})}${m("M135 208 L135 172")}
      ${l(26,108,n("pulgar","thumb"),{size:13})}${m("M48 114 L82 120")}`),u(`<rect x="8" y="168" width="254" height="16" rx="4" fill="${r.board}"/><line x1="8" y1="164" x2="262" y2="164" stroke="#BBB" stroke-width="2"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${s}" stroke-width="20" stroke-linecap="round"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${c}" stroke-width="1.5" opacity=".7"/>
      ${m("M150 60 L132 140")}${l(160,56,n("cae desde arriba","drops from above"),{size:12})}${x(78,200)}
      <path d="M176 140 C200 150 230 156 256 160" fill="none" stroke="${s}" stroke-width="18" stroke-linecap="round" opacity=".9"/>
      ${S(222,120)}${l(222,96,n("plano","flat"),{color:o.red,size:12,anchor:"middle"})}`)]},Z=["#D2552B","#3B7BD8","#2E9A5E","#9B5FD0"],he={eu:["Sol","Re","La","Mi"],us:["G","D","A","E"]},ce=[-4.5,-1.5,1.5,4.5],pe=[-12,-4,4,12],ke=-150,fe=23,ue=44,ge=-95,we={x:118,y:26,w:142,h:180},Ce=[146,174,202,230],b=[140,170,206,236];function me(e="eu"){let t=he[e==="us"?"us":"eu"],i=ce.map((A,f)=>`<path d="M${A} ${ke} L${pe[f]} ${fe} L${A*1.1} ${ue}" fill="none" stroke="${Z[f]}" stroke-width="${1.9-f*.3}" stroke-linecap="round"/>`).join(""),[d,$,p]=[62,152,.8],a=[d,$+ge*p],{x:k,y,w:E,h:C}=we,w=y+40,g=y+C-30,D=`<rect x="${k}" y="${y}" width="${E}" height="${C}" rx="14" fill="#FBF8F4" stroke="#E2D7CB" stroke-width="1.5"/>
    <path d="M132 ${w} L244 ${w} L250 ${g} L126 ${g} Z" fill="${r.board}"/>
    ${Ce.map((A,f)=>`<line x1="${A}" y1="${w}" x2="${b[f]}" y2="${g}" stroke="${Z[f]}" stroke-width="${4.4-f*.8}" stroke-linecap="round"/>
      ${l(A,w-12,t[f],{color:Z[f],anchor:"middle",size:15})}`).join("")}
    ${l(b[0],g+18,n("grave","low"),{color:o.muted,size:11,weight:700,anchor:"middle"})}
    ${l(b[3],g+18,n("aguda","high"),{color:o.muted,size:11,weight:700,anchor:"middle"})}
    <path d="M${b[0]+20} ${g+14} L${b[3]-22} ${g+14} m-6 -4 l6 4 l-6 4" fill="none" stroke="${o.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,B=`${M(`M${a[0]+8} ${a[1]-5} L${k} ${y+10}`,o.muted)}${M(`M${a[0]+8} ${a[1]+5} L${k} ${y+C-10}`,o.muted)}
    <circle cx="${a[0]}" cy="${a[1]}" r="10" fill="none" stroke="${o.muted}" stroke-width="2"/>`;return u(`<g transform="translate(${d} ${$}) scale(${p})">${P()}${i}</g>${B}${D}`)}var Se={"violin-strings":me};export{re as a,Me as b,be as c,o as d,u as e,m as f,l as g,x as h,S as i,M as j,P as k,de as l,ve as m,Se as n};
