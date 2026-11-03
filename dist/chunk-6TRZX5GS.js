import{b as l}from"./chunk-Y37MHN2P.js";var o={skin:"#F1DCC6",skinLine:"#C9A985",gum:"#F4E3D3",lip:"#D9827A",tooth:"#FFFFFF",toothLine:"#9AA3B2",mp:"#1E2430",reed:"#D9B26A",brass:"#D7A63A",brassDark:"#A87A1F",green:"#2B7A4B",red:"#C2372F",accent:"#B4461F",ink:"#141B26",muted:"#5A6678",wood:"#A0632B",woodLight:"#D9A066",shirt:"#B4461F",pants:"#2F55A4",silver:"#B8C0CC",floor:"#E2D7CB",paper:"#F7F3EE"},d=(e,t,i=0,h=1)=>`<linearGradient id="${e}" x1="0" y1="0" x2="${i}" y2="${h}">${t.map(([c,k])=>`<stop offset="${c}" stop-color="${k}"/>`).join("")}</linearGradient>`,Q=[d("gSkin",[[0,"#F8E6D3"],[.55,"#EFD3B8"],[1,"#DDB894"]],1,1),d("gLip",[[0,"#E79A90"],[1,"#C46A61"]]),d("gBrass",[[0,"#F7DD8E"],[.35,"#E0B24A"],[.7,"#B8862A"],[1,"#8E6418"]],1,.4),d("gSilver",[[0,"#F5F7FA"],[.4,"#D2D8E0"],[.75,"#A9B2BE"],[1,"#8A93A3"]]),d("gBlack",[[0,"#545C6A"],[.35,"#262C37"],[1,"#0E1218"]]),d("gReed",[[0,"#EDCB86"],[1,"#C0954A"]]),d("gViolin",[[0,"#D98A42"],[.5,"#B9662A"],[1,"#8C4718"]],1,1),d("gSpruce",[[0,"#F0CB8A"],[1,"#D19E58"]],1,1),d("gWood",[[0,"#E6B47A"],[1,"#B07338"]],1,1),d("gBox",[[0,"#F0D8A8"],[1,"#CDA868"]],1,0),d("gShirt",[[0,"#C9592E"],[1,"#952F12"]],.4,1),d("gPants",[[0,"#3F69BD"],[1,"#22427F"]],.4,1),d("gPlate",[[0,"#F2D49F"],[1,"#D7AE6C"]],1,1)].join(""),q='<filter id="tipShadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#3A2A1A" flood-opacity=".22"/></filter>',J=`<defs><marker id="tipArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${o.green}"/></marker>
<marker id="tipArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${o.red}"/></marker>${Q}${q}</defs>`,N={"#F1DCC6":"gSkin","#D9827A":"gLip","#D7A63A":"gBrass","#C9D0DA":"gSilver","#C3CAD4":"gSilver","#B8C0CC":"gSilver","#1E2430":"gBlack","#D9B26A":"gReed","#C2742F":"gViolin","#E2B26E":"gSpruce","#D9A066":"gWood","#E3C58E":"gBox","#B4461F":"gShirt","#2F55A4":"gPants","#E8C38A":"gPlate"},t1=e=>e.replace(/fill="(#[0-9A-Fa-f]{6})"/g,(t,i)=>N[i.toUpperCase()]?`fill="url(#${N[i.toUpperCase()]})"`:t),g=e=>`<svg viewBox="0 0 270 230" class="tip-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${J}<g filter="url(#tipShadow)">${t1(e)}</g></svg>`,u=(e,t=o.green,i=3)=>`<path d="${e}" fill="none" stroke="${t}" stroke-width="${i}" stroke-linecap="round" marker-end="url(#${t===o.red?"tipArrowRed":"tipArrow"})"/>`,n=(e,t,i,{color:h=o.green,anchor:c="start",size:k=14,weight:s=800}={})=>`<text x="${e}" y="${t}" font-size="${k}" font-weight="${s}" fill="${h}" text-anchor="${c}" font-family="Figtree, Segoe UI, Roboto, sans-serif">${i}</text>`,A=(e,t)=>`<circle cx="${e}" cy="${t}" r="13" fill="${o.green}"/><path d="M${e-6} ${t} l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,v=(e,t)=>`<circle cx="${e}" cy="${t}" r="13" fill="${o.red}"/><path d="M${e-5} ${t-5} l10 10 M${e+5} ${t-5} l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,B=(e,t=o.green)=>`<path d="${e}" fill="none" stroke="${t}" stroke-width="2" stroke-dasharray="6 6"/>`;var r={body:"#C2742F",edge:"#6E3B12",board:"#1C1C1C",bridge:"#F1E2C6",hair:"#EFE7D6",stick:"#5B3414",chin:"#2A2A2A",rest:"#3A3F48"},$=o.skin,a=o.skinLine;function Z(){let e="M0 -72 C20 -72 34 -62 34 -44 C34 -28 22 -22 20 -12 C18 -2 20 6 24 12 C38 22 40 40 38 52 C36 66 22 74 0 74 C-22 74 -36 66 -38 52 C-40 40 -38 22 -24 12 C-20 6 -18 -2 -20 -12 C-22 -22 -34 -28 -34 -44 C-34 -62 -20 -72 0 -72 Z",t=i=>`<path d="M${i*15} 6 c${i*-5} 4 ${i*5} 10 0 14 c${i*-5} 4 ${i*5} 10 0 14" fill="none" stroke="${r.edge}" stroke-width="2.4" stroke-linecap="round"/>`;return`<path d="${e}" fill="${r.body}" stroke="${r.edge}" stroke-width="2.5"/>
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
    ${[-4.5,-1.5,1.5,4.5].map(i=>`<line x1="${i}" y1="-150" x2="${i*.9}" y2="44" stroke="#E8E8E8" stroke-width=".9"/>`).join("")}`}var O=(e,t,i,h)=>`<g transform="translate(${e} ${t}) rotate(${i}) scale(${h})">${Z()}</g>`;function G(e,t){return`<path d="M${e-92} 232 C${e-92} ${t+70} ${e-70} ${t+52} ${e-30} ${t+46} L${e+30} ${t+46} C${e+70} ${t+52} ${e+92} ${t+70} ${e+92} 232 Z" fill="${o.shirt}"/>
    <path d="M${e-30} ${t+46} L${e} ${t+76} L${e+30} ${t+46} Z" fill="${$}"/>
    <rect x="${e-11}" y="${t+22}" width="22" height="30" fill="${$}"/>
    <path d="M${e-6} ${t+52} C${e-18} ${t+50} ${e-34} ${t+52} ${e-44} ${t+56}" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${e+6} ${t+52} C${e+18} ${t+50} ${e+34} ${t+52} ${e+44} ${t+56}" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="${e}" cy="${t}" rx="27" ry="31" fill="${$}" stroke="${a}" stroke-width="2.5"/>
    <path d="M${e-26} ${t-8} C${e-26} ${t-34} ${e+26} ${t-34} ${e+26} ${t-8} C${e+18} ${t-22} ${e-18} ${t-22} ${e-26} ${t-8} Z" fill="#6B4A2E"/>
    <circle cx="${e-10}" cy="${t-2}" r="2.6" fill="${o.ink}"/><circle cx="${e+10}" cy="${t-2}" r="2.6" fill="${o.ink}"/>
    <path d="M${e} ${t+1} L${e-3} ${t+12} L${e+3} ${t+12}" fill="none" stroke="${a}" stroke-width="2"/>
    <path d="M${e-7} ${t+19} Q${e} ${t+23} ${e+7} ${t+19}" fill="none" stroke="${o.lip}" stroke-width="2.4" stroke-linecap="round"/>`}function e1(){let e=(t,i)=>`<path d="M${t-9} 92 C${t-11} 108 ${t-8} ${118+i} ${t} ${124+i} C${t+8} ${118+i} ${t+11} 108 ${t+9} 92 Z" fill="${$}" stroke="${a}" stroke-width="2.2"/>
    <path d="M${t-7} 112 Q${t} 116 ${t+7} 112" fill="none" stroke="${a}" stroke-width="1.4"/>`;return`<line x1="6" y1="116" x2="266" y2="110" stroke="${r.stick}" stroke-width="6" stroke-linecap="round"/>
    <line x1="96" y1="140" x2="266" y2="126" stroke="${r.hair}" stroke-width="4"/>
    <path d="M40 118 L98 117 L98 138 C80 144 58 144 44 138 Z" fill="${r.board}"/>
    <rect x="94" y="116" width="8" height="25" fill="${o.silver}"/>
    <circle cx="60" cy="129" r="4" fill="#E7D9B5"/>
    <path d="M96 96 C100 70 130 58 168 60 C196 62 210 78 206 96 Z" fill="${$}" stroke="${a}" stroke-width="2.2"/>
    ${e(196,6)}${e(172,14)}${e(148,12)}
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${$}" stroke-width="14" stroke-linecap="round"/>
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${a}" stroke-width="1.6"/>
    <circle cx="100" cy="112" r="2" fill="${o.green}"/>
    <path d="M150 176 C136 176 128 162 134 150 L146 132 C150 126 158 128 156 136 L152 150 C150 160 156 170 150 176 Z" fill="${$}" stroke="${a}" stroke-width="2.2"/>
    <path d="M150 176 C150 196 160 214 172 232" fill="none" stroke="${$}" stroke-width="24" stroke-linecap="round"/>`}function o1(e=0,t=0){return`<g transform="translate(${e} ${t})">
    <path d="M70 34 C100 18 136 26 146 52 L154 70 L146 74 C149 84 146 90 140 92 C140 100 134 106 124 108 C112 112 96 112 84 104 C66 94 58 76 58 60 C58 48 62 40 70 34 Z" fill="${$}" stroke="${a}" stroke-width="2.5"/>
    <path d="M60 46 C66 28 98 18 126 26 C108 26 90 34 80 50 Z" fill="#6B4A2E"/>
    <ellipse cx="86" cy="66" rx="7" ry="10" fill="${$}" stroke="${a}" stroke-width="2"/>
    <circle cx="132" cy="54" r="2.6" fill="${o.ink}"/>
    <path d="M136 86 L144 86" stroke="${o.lip}" stroke-width="2.4" stroke-linecap="round"/></g>`}function r1(e){let t=[-114,-100,-80,-66],i=e.map((h,c)=>[h,t[c]]);return i.map(([h,c],k)=>{let s=8+k%2*132,p=30+Math.floor(k/2)*100,M=s+58,E=p+128,L=70,C=D=>{let y=D*Math.PI/180;return[M+L*Math.cos(y),E+L*Math.sin(y)]},[w,b]=C(-124),[m,x]=C(-56),f=`<path d="M${w.toFixed(1)} ${p+94} L${w.toFixed(1)} ${b.toFixed(1)} A${L} ${L} 0 0 1 ${m.toFixed(1)} ${x.toFixed(1)} L${m.toFixed(1)} ${p+94} Z" fill="${r.bridge}" stroke="#A9926A" stroke-width="1.5"/>`,U=i.map(([,D],y)=>{let[X,K]=C(D);return`<circle cx="${X.toFixed(1)}" cy="${K.toFixed(1)}" r="${y===k?5:3.2}" fill="${y===k?o.green:"#777"}"/>`}).join(""),z=c*Math.PI/180,[H,Y]=C(c),R=Math.cos(z),I=Math.sin(z),T=-I,_=R,P=H+R*5,j=Y+I*5,W=`<line x1="${(P-T*54).toFixed(1)}" y1="${(j-_*54).toFixed(1)}" x2="${(P+T*54).toFixed(1)}" y2="${(j+_*54).toFixed(1)}" stroke="${r.stick}" stroke-width="4" stroke-linecap="round"/>`,V=`<rect x="${s+112}" y="${p+10}" width="6" height="74" rx="3" fill="#E9E2D8"/><rect x="${s+109}" y="${p+12+k*18}" width="12" height="10" rx="3" fill="${o.green}"/>`;return`<rect x="${s}" y="${p}" width="126" height="94" rx="10" fill="#FBF8F4" stroke="#E2D7CB"/>${f}${U}${W}${V}${n(s+8,p+18,h,{color:o.ink,size:14})}`}).join("")}var w1={"violin-hold":[g(`${G(92,62)}
      <path d="M128 112 C140 104 160 102 172 108 L170 116 C158 112 142 114 130 120 Z" fill="${r.rest}"/>
      ${O(152,80,65,.55)}
      <circle cx="140" cy="113" r="9" fill="none" stroke="${o.green}" stroke-width="3"/>
      ${u("M222 182 L150 120")}${n(222,204,l("clav\xEDcula","collarbone"),{anchor:"middle"})}`),g(`<path d="M20 232 C26 176 60 158 96 152 L190 152 C230 158 256 184 260 232 Z" fill="${o.shirt}"/>
      <rect x="92" y="100" width="26" height="56" fill="${$}"/>
      ${o1(0,2)}
      <path d="M102 132 C102 124 108 122 116 122 L200 122 C208 122 212 126 212 132 L212 144 C212 150 208 152 200 152 L116 152 C108 152 102 150 102 144 Z" fill="${r.body}" stroke="${r.edge}" stroke-width="2"/>
      <line x1="104" y1="137" x2="210" y2="137" stroke="${r.edge}" stroke-width="1" opacity=".6"/>
      <path d="M212 126 L252 124 L252 130 L212 134 Z" fill="${r.board}"/>
      <circle cx="258" cy="126" r="7" fill="${r.body}" stroke="${r.edge}" stroke-width="1.8"/>
      <path d="M100 116 C104 108 132 106 144 112 L146 124 L104 126 Z" fill="${r.chin}"/>
      <path d="M118 154 C130 150 150 150 164 154 L162 160 L120 162 Z" fill="${r.rest}"/>
      ${u("M112 0 L112 28")}${n(124,18,l("peso de la cabeza","head weight"))}
      ${A(238,196)}${n(206,222,l("hombro bajo","shoulder down"),{color:"#fff",anchor:"middle",size:13})}`),g(`${G(96,64)}
      ${O(147,96,81,.57)}
      ${B("M100 78 L262 78")}
      <circle cx="96" cy="76" r="4" fill="${o.green}"/><circle cx="251" cy="78" r="5" fill="none" stroke="${o.green}" stroke-width="2.5"/>
      ${n(258,64,l("voluta = nariz","scroll = nose"),{anchor:"end",size:13})}`)],"violin-bow":[g(`${e1()}
      ${u("M84 196 L132 160")}${n(30,214,l("pulgar doblado","bent thumb"),{size:13})}
      ${u("M60 58 L92 84")}${n(40,46,l("me\xF1ique de pie","pinky standing"),{size:13})}
      ${A(240,28)}`),g(`<g transform="translate(130 92) scale(1.15)">${Z()}</g>
      <line x1="4" y1="108" x2="266" y2="108" stroke="${r.stick}" stroke-width="5" stroke-linecap="round"/>
      <line x1="4" y1="113" x2="266" y2="113" stroke="${r.hair}" stroke-width="3"/>
      <path d="M140 108 L140 98 L130 98" fill="none" stroke="${o.green}" stroke-width="2"/>
      <path d="M178 96 L200 82" stroke="${o.ink}" stroke-width="1.2"/>${n(202,82,l("diapas\xF3n","fingerboard"),{color:o.ink,size:12})}
      <path d="M150 120 L200 140" stroke="${o.ink}" stroke-width="1.2"/>${n(202,146,l("puente","bridge"),{color:o.ink,size:12})}
      ${A(238,196)}`),g(`${r1([l("Sol","G"),l("Re","D"),l("La","A"),l("Mi","E")])}
      ${n(262,20,l("verde = altura del codo","green = elbow height"),{size:11,anchor:"end"})}`)],"violin-left":[g(`<rect x="10" y="44" width="110" height="14" rx="4" fill="${r.board}"/><rect x="10" y="58" width="110" height="10" rx="4" fill="${r.body}"/>
      <path d="M44 232 L72 120" stroke="${$}" stroke-width="26" stroke-linecap="round"/>
      <path d="M72 120 L80 80" stroke="${$}" stroke-width="22" stroke-linecap="round"/>
      <path d="M78 82 C80 58 96 40 108 44" fill="none" stroke="${$}" stroke-width="10" stroke-linecap="round"/>
      <path d="M78 82 C78 62 88 46 96 44" fill="none" stroke="${a}" stroke-width="1.5"/>
      ${B("M40 238 L84 66")}${A(110,200)}
      <rect x="150" y="44" width="110" height="14" rx="4" fill="${r.board}"/><rect x="150" y="58" width="110" height="10" rx="4" fill="${r.body}"/>
      <path d="M216 232 L232 150" stroke="${$}" stroke-width="26" stroke-linecap="round"/>
      <path d="M232 150 C224 116 206 84 190 70" stroke="${$}" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M190 70 C196 54 222 46 236 46" fill="none" stroke="${$}" stroke-width="10" stroke-linecap="round"/>
      ${v(250,200)}${n(214,102,l("palma pegada","palm on neck"),{color:o.red,size:12,anchor:"end"})}`),g(`<path d="M95 92 L175 92 L175 104 C175 136 158 150 135 150 C112 150 95 136 95 104 Z" fill="${r.body}" stroke="${r.edge}" stroke-width="2"/>
      <rect x="92" y="84" width="86" height="10" rx="3" fill="${r.board}"/>
      ${[108,126,144,162].map(e=>`<circle cx="${e}" cy="82" r="2.6" fill="#BBB"/>`).join("")}
      <path d="M92 180 C110 200 160 200 186 176" fill="none" stroke="${$}" stroke-width="22" stroke-linecap="round"/>
      <path d="M70 200 C68 168 76 136 92 118" fill="none" stroke="${$}" stroke-width="18" stroke-linecap="round"/>
      <path d="M186 176 C204 140 200 96 184 72 C174 60 158 60 152 70 L148 80" fill="none" stroke="${$}" stroke-width="15" stroke-linecap="round"/>
      <path d="M112 158 C122 168 150 170 166 160" fill="${o.green}" opacity=".18" stroke="${o.green}" stroke-dasharray="4 4"/>
      ${n(135,222,l("hueco","gap"),{anchor:"middle"})}${u("M135 208 L135 172")}
      ${n(26,108,l("pulgar","thumb"),{size:13})}${u("M48 114 L82 120")}`),g(`<rect x="8" y="168" width="254" height="16" rx="4" fill="${r.board}"/><line x1="8" y1="164" x2="262" y2="164" stroke="#BBB" stroke-width="2"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${$}" stroke-width="20" stroke-linecap="round"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${a}" stroke-width="1.5" opacity=".7"/>
      ${u("M150 60 L132 140")}${n(160,56,l("cae desde arriba","drops from above"),{size:12})}${A(78,200)}
      <path d="M176 140 C200 150 230 156 256 160" fill="none" stroke="${$}" stroke-width="18" stroke-linecap="round" opacity=".9"/>
      ${v(222,120)}${n(222,96,l("plano","flat"),{color:o.red,size:12,anchor:"middle"})}`)]},S=["#D2552B","#3B7BD8","#2E9A5E","#9B5FD0"],i1={eu:["Sol","Re","La","Mi"],us:["G","D","A","E"]},$1=[-4.5,-1.5,1.5,4.5],l1=[-12,-4,4,12],n1=-150,s1=23,d1=44,a1=-95,h1={x:118,y:26,w:142,h:180},k1=[146,174,202,230],F=[140,170,206,236];function c1(e="eu"){let t=i1[e==="us"?"us":"eu"],i=$1.map((x,f)=>`<path d="M${x} ${n1} L${l1[f]} ${s1} L${x*1.1} ${d1}" fill="none" stroke="${S[f]}" stroke-width="${1.9-f*.3}" stroke-linecap="round"/>`).join(""),[h,c,k]=[62,152,.8],s=[h,c+a1*k],{x:p,y:M,w:E,h:L}=h1,C=M+40,w=M+L-30,b=`<rect x="${p}" y="${M}" width="${E}" height="${L}" rx="14" fill="#FBF8F4" stroke="#E2D7CB" stroke-width="1.5"/>
    <path d="M132 ${C} L244 ${C} L250 ${w} L126 ${w} Z" fill="${r.board}"/>
    ${k1.map((x,f)=>`<line x1="${x}" y1="${C}" x2="${F[f]}" y2="${w}" stroke="${S[f]}" stroke-width="${4.4-f*.8}" stroke-linecap="round"/>
      ${n(x,C-12,t[f],{color:S[f],anchor:"middle",size:15})}`).join("")}
    ${n(F[0],w+18,l("grave","low"),{color:o.muted,size:11,weight:700,anchor:"middle"})}
    ${n(F[3],w+18,l("aguda","high"),{color:o.muted,size:11,weight:700,anchor:"middle"})}
    <path d="M${F[0]+20} ${w+14} L${F[3]-22} ${w+14} m-6 -4 l6 4 l-6 4" fill="none" stroke="${o.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,m=`${B(`M${s[0]+8} ${s[1]-5} L${p} ${M+10}`,o.muted)}${B(`M${s[0]+8} ${s[1]+5} L${p} ${M+L-10}`,o.muted)}
    <circle cx="${s[0]}" cy="${s[1]}" r="10" fill="none" stroke="${o.muted}" stroke-width="2"/>`;return g(`<g transform="translate(${h} ${c}) scale(${k})">${Z()}${i}</g>${m}${b}`)}var C1={"violin-strings":c1};export{o as a,g as b,u as c,n as d,A as e,v as f,B as g,Z as h,r1 as i,w1 as j,C1 as k};
