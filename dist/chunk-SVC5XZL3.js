var b={w:595.28,h:841.89},i=72/25.4;function j(o){return String(o).replace(/[^\x20-\x7e\xa0-\xff]/g,"?").replace(/[\\()]/g,s=>"\\"+s)}function R(o){let s=atob(o.split(",")[1]),c=new Uint8Array(s.length);for(let p=0;p<s.length;p++)c[p]=s.charCodeAt(p);return c}function w(){let o=[],s=[],c=null,p=null,f={page(){return c={ops:[],images:[]},o.push(c),f},text(a,h,g,{size:t=11,bold:$=!1,gray:r=0,align:x="left"}={}){let l=j(a),d=x==="center"?l.length*t*.5:0,u=h*i-d/2,m=b.h-g*i;return c.ops.push(`BT ${r/255} g /${$?"F2":"F1"} ${t} Tf ${u.toFixed(2)} ${m.toFixed(2)} Td (${l}) Tj ET`),f},rect(a,h,g,t,{gray:$=200}={}){return c.ops.push(`${($/255).toFixed(3)} g ${(a*i).toFixed(2)} ${(b.h-(h+t)*i).toFixed(2)} ${(g*i).toFixed(2)} ${(t*i).toFixed(2)} re f 0 g`),f},image(a,h,g,t,$,r,x){let l=`Im${s.length+1}`;s.push({name:l,bytes:R(a),w:r,h:x}),c.images.push(l);let d=t*i,u=$*i;return c.ops.push(`q ${d.toFixed(2)} 0 0 ${u.toFixed(2)} ${(h*i).toFixed(2)} ${(b.h-g*i-u).toFixed(2)} cm /${l} Do Q`),f},pageCount:()=>o.length,footer(a){return p=a,f},blob(){p&&o.forEach((e,n)=>{c=e,f.text(p(n+1,o.length),105,290,{size:8,gray:120,align:"center"})});let a=[],h=[],g=0,t=e=>{let n=typeof e=="string"?$(e):e;a.push(n),g+=n.length},$=e=>{let n=new Uint8Array(e.length);for(let y=0;y<e.length;y++)n[y]=e.charCodeAt(y)&255;return n},r=(e,n)=>{h[e]=g,t(`${e} 0 obj
`),n(),t(`
endobj
`)};t(`%PDF-1.4
%\xE2\xE3\xCF\xD3
`);let x=5,l=x+s.length,d=o.map((e,n)=>l+n*2);r(1,()=>t("<< /Type /Catalog /Pages 2 0 R >>")),r(2,()=>t(`<< /Type /Pages /Kids [${d.map(e=>`${e} 0 R`).join(" ")}] /Count ${o.length} >>`)),r(3,()=>t("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")),r(4,()=>t("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")),s.forEach((e,n)=>r(x+n,()=>{t(`<< /Type /XObject /Subtype /Image /Width ${e.w} /Height ${e.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${e.bytes.length} >>
stream
`),t(e.bytes),t(`
endstream`)})),o.forEach((e,n)=>{let y=e.ops.join(`
`),T=e.images.map(F=>`/${F} ${x+s.findIndex(B=>B.name===F)} 0 R`).join(" ");r(d[n],()=>t(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${b.w} ${b.h}] /Contents ${d[n]+1} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${T} >> >> >>`)),r(d[n]+1,()=>{let F=$(y);t(`<< /Length ${F.length} >>
stream
`),t(F),t(`
endstream`)})});let u=l+o.length*2,m=g;t(`xref
0 ${u}
0000000000 65535 f 
`);for(let e=1;e<u;e++)t(`${String(h[e]).padStart(10,"0")} 00000 n 
`);return t(`trailer
<< /Size ${u} /Root 1 0 R >>
startxref
${m}
%%EOF`),new Blob(a,{type:"application/pdf"})}};return f}export{i as a,w as b};
