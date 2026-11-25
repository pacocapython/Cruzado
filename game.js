'use strict';
/* ====== CONFIGURAÇÃO BASE ====== */
const W=480,H=270,T=16,COLS=30,ROWS=17;
const cv=document.getElementById('c'),g=cv.getContext('2d');
cv.width=W;cv.height=H;
const keys={},pr={};
addEventListener('keydown',e=>{if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab'||e.code==='Backspace')e.preventDefault();if(!keys[e.code])pr[e.code]=1;keys[e.code]=1;if(!MU.ctx)musicStart();if(e.code==='KeyN'&&!e.repeat)musicToggle();if(e.code==='Minus'||e.code==='NumpadSubtract')setVol(-.1);if(e.code==='Equal'||e.code==='NumpadAdd')setVol(.1)});
addEventListener('keyup',e=>{keys[e.code]=0});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0});
const dn=(...c)=>c.some(k=>keys[k]),ht=(...c)=>c.some(k=>pr[k]);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

/* ====== MÚSICA: metal medieval sinfônico (gerada em tempo real com Web Audio) ======
 Ré menor, ~166 BPM: duas guitarras distorcidas, baixo, bumbo duplo, cordas, coral e solo.
 N liga/desliga. Para usar um arquivo de áudio seu depois, troque musicStart() por new Audio(...). */
const MU={on:true,vol:.5,ctx:null};
const mtof=m=>440*Math.pow(2,(m-69)/12);
const LD=[[[0,74,3],[4,77,3],[8,81,3],[12,79,2],[14,77,2]],[[0,82,3],[4,79,3],[8,77,3],[12,74,4]],[[0,79,3],[4,76,3],[8,72,3],[12,76,2],[14,79,2]],[[0,81,3],[4,76,3],[8,73,3],[12,76,2],[14,81,2]]];
function musicStart(){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const c=MU.ctx=new AC(),out=c.createGain(),comp=c.createDynamicsCompressor();
  out.gain.value=MU.on?MU.vol*1.1:0;out.connect(comp);comp.connect(c.destination);MU.out=out;
  const len=c.sampleRate*2.2|0,ib=c.createBuffer(2,len,c.sampleRate);
  for(let k=0;k<2;k++){const d=ib.getChannelData(k);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5)}
  const rv=c.createConvolver(),rg=c.createGain();rv.buffer=ib;rg.gain.value=.3;rv.connect(rg);rg.connect(out);
  const cu=new Float32Array(512);for(let i=0;i<512;i++)cu[i]=Math.tanh((i/256-1)*16);
  MU.gt=[-.7,.7].map(pan=>{const sh=c.createWaveShaper(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),gg=c.createGain(),pn=c.createStereoPanner?c.createStereoPanner():c.createGain();
    sh.curve=cu;hp.type='highpass';hp.frequency.value=70;lp.type='lowpass';lp.frequency.value=3800;gg.gain.value=.3;if(pn.pan)pn.pan.value=pan;
    sh.connect(hp);hp.connect(lp);lp.connect(gg);gg.connect(pn);pn.connect(out);return sh});
  const bs=c.createGain(),bf=c.createBiquadFilter();bf.type='lowpass';bf.frequency.value=700;bs.connect(bf);bf.connect(out);MU.bs=bs;
  const sb=c.createGain(),sf=c.createBiquadFilter();sf.type='lowpass';sf.frequency.value=1600;sb.connect(sf);sf.connect(out);sf.connect(rv);MU.sb=sb;
  const lb=c.createGain();lb.connect(out);lb.connect(rv);MU.lb=lb;
  const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;MU.nb=nb;
  MU.step=0;MU.t=c.currentTime+.15;setInterval(musicTick,25);
  document.addEventListener('visibilitychange',()=>{document.hidden?c.suspend():c.resume()})
}
function applyVol(){if(MU.out)MU.out.gain.setTargetAtTime(MU.on?MU.vol*1.1:0,MU.ctx.currentTime,.05);
  document.getElementById('vl').textContent=MU.on?Math.round(MU.vol*100)+'%':'mudo';document.getElementById('vm').textContent=MU.on?'Som: ligado':'Som: desligado'}
function musicToggle(){MU.on=!MU.on;applyVol()}
function setVol(d){if(!MU.ctx)musicStart();MU.vol=Math.max(0,Math.min(1,Math.round((MU.vol+d)*10)/10));if(d>0)MU.on=true;applyVol()}
for(const [id,f] of [['vd',()=>setVol(-.1)],['vu',()=>setVol(.1)],['vm',()=>{if(!MU.ctx)musicStart();musicToggle()}]]){const b=document.getElementById(id);b.onclick=()=>{f();b.blur()}}
function musicTick(){const c=MU.ctx;if(c.state!=='running'){MU.t=c.currentTime+.1;return}
  while(MU.t<c.currentTime+.15){mstep(MU.step,MU.t);MU.t+=.09;MU.step++}}
function mosc(type,f,t,d,v,dest,a,det){const c=MU.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+(a||.01));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.05)}
function mnoise(t,d,v,f,type){const c=MU.ctx,n=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();n.buffer=MU.nb;fl.type=type;fl.frequency.value=f;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(fl);fl.connect(g);g.connect(MU.out);n.start(t);n.stop(t+d+.02)}
function mkick(t,v){const c=MU.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.07);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.12);o.connect(g);g.connect(MU.out);o.start(t);o.stop(t+.14);mnoise(t,.02,.35*v,3500,'bandpass')}
function mtom(t,f){const c=MU.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.5,t+.18);
  g.gain.setValueAtTime(.8,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.connect(g);g.connect(MU.out);o.start(t);o.stop(t+.24)}
const GAL=[0,2,3,4,6,7,8,10,11,12,14,15];
function mstep(n,t){
  const b=(n>>4)&7,s=n&15,ch=b&3,R=[50,46,48,45][ch],PAD=[[62,65,69],[58,62,65],[60,64,67],[57,61,64]][ch],gal=GAL.includes(s),ring=s===0||s===8,fill=ch===3&&b%2===1&&s>=12;
  /* bateria: bumbo duplo em galope, caixa seca, pratos e viradas de tom */
  if(gal)mkick(t,s%4===0?1:.7);
  if((s===4||s===12)&&!fill){mnoise(t,.18,.65,1700,'highpass');mosc('triangle',200,t,.12,.4,MU.out)}
  if(fill){mtom(t,[240,200,160,120][s-12]);if(s%2===0)mnoise(t,.1,.35,1700,'highpass')}
  if(s%2===0)mnoise(t,.04,.12,7500,'highpass');
  if(s===0&&b%2===0)mnoise(t,1.5,.26,5500,'highpass');
  /* duas guitarras distorcidas (esq/dir): chugs graves em galope e acordes de força nos tempos fortes */
  if(gal){const notes=ring?[R,R+7,R+12]:[R-12,R-5,R],d=ring?.3:.08;
    MU.gt.forEach((gt,k)=>{for(const m of notes)mosc('sawtooth',mtof(m),t,d,s%4===0?.55:.42,gt,.004,k?7:-7)})}
  /* baixo: raiz seguindo o riff, com sub */
  if(gal){const d=ring?.3:.09;mosc('sawtooth',mtof(R-12),t,d,.5,MU.bs);mosc('sine',mtof(R-12),t,d,.55,MU.out)}
  /* orquestra por baixo */
  if(s===0){for(const m of PAD){mosc('sawtooth',mtof(m),t,1.5,.035,MU.sb,.5,-8);mosc('sawtooth',mtof(m),t,1.5,.035,MU.sb,.5,8)}
    mosc('sine',mtof(PAD[2]+12),t,1.5,.06,MU.sb,.6);mosc('sine',mtof(PAD[0]+12),t,1.5,.04,MU.sb,.6)}
  /* melodia: guitarra solo distorcida + flauta */
  if(b>=4)for(const q of LD[ch])if(q[0]===s){const d=q[2]*.09;MU.gt.forEach(gt=>mosc('sawtooth',mtof(q[1]),t,d,.22,gt,.02));mosc('triangle',mtof(q[1]),t,d,.1,MU.lb,.02)}
}

/* ====== SPRITES ======
 Quando tiver seus sprites, é só carregar aqui. A imagem é ancorada no
 centro-inferior da caixa de colisão e deve olhar para a DIREITA (o jogo espelha sozinho).
 Nomes: player, ira, preguica, luxuria, soberba.
 Exemplo: loadSprite('player','sprites/cruzado.png');            */
const SPRITES={};
function loadSprite(n,src){const i=new Image();i.src=src;SPRITES[n]=i}
function spr(n,x,y,w,h,flip){const i=SPRITES[n];if(!i||!i.complete||!i.naturalWidth)return false;
  g.save();g.translate(x+w/2,y);g.scale(flip?-1:1,1);g.drawImage(i,-i.naturalWidth/2,h-i.naturalHeight);g.restore();return true}

/* ====== PECADOS (inimigos) ======  */
const DEF={
 I:{id:'ira',n:'Ira',w:12,h:20,hp:3,col:'#a3231f',t:15},
 P:{id:'preguica',n:'Preguiça',w:16,h:22,hp:6,col:'#5f6e55',t:25},
 L:{id:'luxuria',n:'Luxúria',w:12,h:12,hp:2,col:'#a03c80',t:20,fly:1},
 B:{id:'soberba',n:'Soberba',w:24,h:34,hp:18,col:'#9a6ad0',t:250,boss:1},
 X:{id:'ira2',n:'Ira Deformada',w:16,h:24,hp:6,col:'#8a1812',t:40,sp:.6,wu:40,dmg:2},
 Y:{id:'luxuria2',n:'Luxúria Cindida',w:12,h:12,hp:2,col:'#6a5acd',t:25,fly:1,split:1},
 Z:{id:'preguica2',n:'Preguiça Tóxica',w:16,h:22,hp:5,col:'#58b02a',t:35},
 T:{id:'inveja',n:'Inveja',w:12,h:18,hp:3,col:'#b5b23a',t:30},
 H:{id:'gula2',n:'Glutão',w:14,h:13,hp:4,col:'#a8582a',t:30},
 G:{id:'avareza',n:'Avareza',w:24,h:34,hp:28,col:'#3f9a52',t:400,boss:1,bs:1.15,shield:1},
 U:{id:'gula',n:'Gula',w:24,h:34,hp:20,col:'#a8582a',t:400,boss:1,bs:.9,heal:2}
};

/* ====== MAPA ======
 Cada sala: 30x17 tiles. Paredes e chão são automáticos; 'rows' desenha as linhas 2..14
 (o texto começa na coluna 1). Legenda: # pedra, ^ espinhos, C altar (checkpoint),
 R relíquia (dash), I/P/L/B pecados. l/r = salas vizinhas. gap = buraco no chão (colunas). */
const S2=['#060b08','#0a140e','#0e1d13','#122819','#163420'],S3=['#0b0806','#140e0a','#1d130e','#281a12','#342216'],SKY4=['#140404','#220808','#340e0a','#4a150c','#601c0e'];
const TMAP=[0,0,0,1,1,1,2,2,2,3];
const STG=[
 {n:'Capela em Ruínas',tag:'Travessia',lay:['flat','stairs','pit'],pool:'IPL',c:2,hid:{k:1,kind:'well',id:'guarda'}},
 {n:'Claustro Profanado',tag:'Travessia',lay:['stairs','spikes','flat'],pool:'IPL',c:3,hid:{k:2,kind:'tower',id:'rafael'}},
 {n:'Cripta da Provação',tag:'Provação: sobreviva às ondas',lay:['spikes','gaunt','flat','arena'],pool:'IPL',c:3,waves:['II','LLP','IPL']},
 {n:'Nave Saqueada',tag:'Travessia',lay:['flat','stairs','pit'],pool:'XYZ',c:3,hid:{k:1,kind:'door',id:'gabriel'}},
 {n:'Salão do Trono',tag:'Chefe: Soberba',lay:['stairs','spikes','boss'],pool:'XYZT',c:3,boss:'B',sin:'Soberba',deco:'throne'},
 {n:'Tesouraria Armadilhada',tag:'Provação: tesouraria armadilhada',lay:['pit','towers','flat','arena'],pool:'XYZT',c:3,waves:['TT','ZZY','XTY']},
 {n:'Refeitório Profano',tag:'Travessia',lay:['flat','stairs','pit'],pool:'HTY',c:3,hid:{k:1,kind:'well',id:'bento'}},
 {n:'Galeria dos Excessos',tag:'Travessia',lay:['pit','spikes','stairs'],pool:'HZTY',c:3,hid:{k:2,kind:'door',id:'barbara'}},
 {n:'Banquete dos Pecados',tag:'Provação: banquete dos pecados',lay:['spikes','towers','flat','arena'],pool:'HTZXY',c:3,waves:['HHH','TTZ','XHYT']},
 {n:'Cofre da Avareza',tag:'Chefe final: Avareza',lay:['stairs','pit','boss'],pool:'XYZTH',c:4,boss:'G',sin:'Avareza',deco:'hoard'}
];
const ROOMS={};
(function genRooms(){
  const RN=['I','II','III','IV'];
  STG.forEach((st,sx)=>{
    const n=st.lay.length,th=TMAP[sx];
    st.lay.forEach((ly,k)=>{
      let sd=(sx+1)*7919+k*104729;const rr=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
      const G=Array.from({length:13},()=>Array(28).fill('.')),put=(y,x,c)=>{if(x>=0&&x<28)G[y-2][x]=c},plats=[],cover=Array(28).fill(0),bad=Array(28).fill(0);
      const plat=(y,a,b)=>{for(let i=a;i<=b;i++){put(y,i,'#');cover[i]=1}plats.push([y,a,b])};
      let gap=null,waves=null;const aN=k===n-2&&(st.boss||st.waves);
      if(ly==='flat'){const a=6+(rr()*6|0);plat(13,a,a+3);plat(11,a+4,a+7)}
      else if(ly==='stairs'){plat(13,4,8);plat(11,9,13);plat(9,14,17);plat(11,18,21)}
      else if(ly==='pit'){const w=sx<3?4:5,a=10+(sx%3);gap=[a+1,a+w];for(let i=a-1;i<=a+w;i++)bad[i]=1;if(sx<3)plat(13,a+1,a+2)}
      else if(ly==='spikes'){const a=11+(rr()*3|0);for(let i=a;i<a+3;i++){put(14,i,'^');bad[i]=1}}
      else if(ly==='gaunt'){for(const a of[5,12,19])for(let i=a;i<a+3;i++){put(14,i,'^');bad[i]=1}}
      else if(ly==='towers'){for(let i=5;i<=24;i++){put(14,i,'^');bad[i]=1}plat(13,6,8);plat(11,11,13);plat(9,16,18);plat(11,21,23)}
      else if(ly==='arena'){plat(13,5,8);plat(13,19,22);plat(11,11,16)}
      else if(ly==='boss'){plat(13,2,4);plat(13,24,26);put(14,20,st.boss)}
      let well=null,tot=null;
      if(st.hid&&st.hid.k===k){const h=st.hid,hp=(y,a,b)=>{for(let i=a;i<=b;i++){put(y,i,'#');cover[i]=1}};
        if(h.kind==='well'){well=[24,26];for(let i=22;i<=27;i++)bad[i]=1;tot={id:h.id,x:408,y:256}}
        else if(h.kind==='tower'){hp(13,21,23);hp(11,24,26);hp(9,21,23);hp(7,24,26);hp(5,21,23);tot={id:h.id,x:376,y:80}}
        else{hp(11,22,27);hp(8,22,27);put(9,22,'S');put(10,22,'S');put(9,27,'#');put(10,27,'#');tot={id:h.id,x:408,y:176,door:1}}}
      if(k===0)put(14,2,'C');
      if(aN)put(14,24,'C');
      const used=new Set(),foe=ch=>{
        if(ch==='L'||ch==='Y'){put(5+(rr()*3|0),6+(rr()*18|0),ch);return}
        const lo=k===0?8:5,c=[];
        for(let i=lo;i<=(aN?21:24);i++)if(!cover[i]&&!bad[i])c.push([14,i]);
        for(const[y,a,b]of plats)if(b-a>=2)for(let i=a+1;i<b;i++)c.push([y-1,i]);
        for(let t=0;t<14&&c.length;t++){const[y,i]=c[rr()*c.length|0],q=y*100+i;if(!used.has(q)&&!used.has(q-1)&&!used.has(q+1)){used.add(q);put(y,i,ch);return}}
      };
      if(ly!=='boss'&&ly!=='arena'){const cnt=Math.max(1,st.c-(k===0?1:0));for(let i=0;i<cnt;i++)foe(st.pool[rr()*st.pool.length|0])}
      if(ly==='arena'){const fl=[10,12,14,16,17,11,13,15,18,9];waves=st.waves.map(w=>[...w].map((ch,j)=>{const fy=ch==='L'||ch==='Y';return[ch,(fy?7+j*4:fl[(j*3)%fl.length])+1,fy?6:14]}))}
      const rows={};G.forEach((rw,i)=>{const t=rw.join('');if(/[^.]/.test(t))rows[i+2]=t});
      const id=sx*10+k,last=k===n-1;
      ROOMS[id]={n:st.n+(ly==='boss'?'':' '+RN[k]),l:k>0?id-1:undefined,r:last?(st.boss?undefined:'end'):id+1,sky:[null,S2,S3,SKY4][th],moon:[null,'#1c5a34','#5a3a1a','#8a6a1c'][th],rows,gap,waves,deco:ly==='boss'?st.deco:undefined,well,tot};
    })
  })
})();

const START_WITH_DASH=true; // false = o dash só libera depois de pegar a relíquia no Relicário
let state='title',paused=false,cur=0,M=[],E=[],SP=[],CP=null,RL=null,BG=null,VG=null;
let flags={},save,lastSafe={x:0,y:0},hs=0,shake=0,deadT=0,toast=null,rn=null,parts=[],tick=0,nearCP=false;
const P={x:0,y:0,w:10,h:26,vx:0,vy:0,face:1,hp:5,max:5,fl:2,tears:0,inv:0,coy:0,buf:0,atk:0,swing:0,dash:0,dcd:0,onG:false,hitX:false,kneel:0,stn:0};

const tile=(tx,ty)=>ty<0?true:(ty>=ROWS||tx<0||tx>=COLS)?false:(M[ty][tx]==='#'||M[ty][tx]==='S');
function boxHit(x,y,w,h){for(let ty=Math.floor(y/T);ty<=Math.floor((y+h-.01)/T);ty++)for(let tx=Math.floor(x/T);tx<=Math.floor((x+w-.01)/T);tx++)if(tile(tx,ty))return true;return false}
function moveBody(b){
  const sx=b.vx;b.x+=b.vx;b.hitX=false;
  if(boxHit(b.x,b.y,b.w,b.h)){b.x=sx>0?Math.floor((b.x+b.w)/T)*T-b.w-.01:(Math.floor(b.x/T)+1)*T+.01;b.hitX=true;b.vx=0}
  const sy=b.vy;b.y+=b.vy;b.onG=false;
  if(boxHit(b.x,b.y,b.w,b.h)){if(sy>0){b.y=Math.floor((b.y+b.h)/T)*T-b.h-.01;b.onG=true}else{b.y=(Math.floor(b.y/T)+1)*T+.01}b.vy=0}
}

function mkEnemy(k,x,y){const d=DEF[k];
  return{k,x:x*T+8-d.w/2,y:d.fly?y*T+8-d.h/2:(y+1)*T-d.h-.01,w:d.w,h:d.h,vx:0,vy:0,hp:eh(d),mhp:eh(d),dir:-1,s:0,c:DEF[k].boss?60:0,t:0,fl:0,stun:0,sw:-1,onG:false,hitX:false}}
function spawnAll(){E=SP.filter(s=>!(s.k==='B'&&flags.boss)).map(s=>mkEnemy(s.k,s.x,s.y))}

function build(id){
  const d=ROOMS[id];M=[];spears=[];bolts=[];TT=(d.tot&&!meta.int.owned[d.tot.id])?Object.assign({},d.tot):null;
  for(let y=0;y<ROWS;y++){M[y]=[];for(let x=0;x<COLS;x++)M[y][x]=(y<2||y>14||x===0||x===COLS-1)?'#':'.'}
  for(const y in d.rows){const s=d.rows[y];for(let i=0;i<s.length&&i<28;i++)M[y][i+1]=s[i]}
  if(d.l!=null&&!d.waves)for(let y=11;y<15;y++)M[y][0]='.';
  if(d.r!=null&&!d.waves)for(let y=11;y<15;y++)M[y][COLS-1]='.';
  if(d.gap)for(let x=d.gap[0];x<=d.gap[1];x++){M[15][x]='.';M[16][x]='.'}
  if(d.well)for(let x=d.well[0];x<=d.well[1];x++)M[15][x]='.';
  SP=[];CP=null;RL=null;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=M[y][x];
    if(DEF[c]){SP.push({k:c,x,y});M[y][x]='.'}
    else if(c==='C'){CP={x:x*T+8,y:(y+1)*T};M[y][x]='.'}
    else if(c==='R'){RL={x:x*T+8,y:y*T+8};M[y][x]='.'}}
  if(flags.dash)RL=null;
  spawnAll();if(d.waves){lockOpen=false;waveI=0;spawnWave(0)}prerender();
}

/* ====== PIXEL ART (sprites desenhados em texto; cada letra é um pixel) ====== */
function mkS(rows,pal,sym){const w=rows.reduce((m,r)=>Math.max(m,r.length),0),c=document.createElement('canvas');c.width=sym?w*2:w;c.height=rows.length;const x=c.getContext('2d');
  rows.forEach((r,y)=>{r=r.padEnd(w,'.');const t=sym?r+[...r].reverse().join(''):r;for(let i=0;i<t.length;i++){const q=pal[t[i]];if(q){x.fillStyle=q;x.fillRect(i,y,1,1)}}});return c}
function flashOf(c){const f=document.createElement('canvas');f.width=c.width;f.height=c.height;const x=f.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='#fff';x.fillRect(0,0,f.width,f.height);return f}
const K='#120a0d',A={};
const PL={k:K,g:'#9a9aa8',G:'#5a5a66',w:'#e2dac6',W:'#b0a690',r:'#b5261f',y:'#d2a63a',b:'#3a2a26'};
A.body=mkS(["..rrkkkk....",".rrkgggggk..","..kggggggGk.","..kgggkkkGk.","..kggggggGk.","..kGGgggGGk.","...kkkkkkk..",".kGGGGGGGGk.",".kwwwwwwwWk.",".kwwwrrwwWk.",".kwwwrrwwWk.",".kwrrrrrrWk.",".kwwwrrwwWk.",".kwwwrrwwWk.",".kwwwrrwwWk.",".kyyyyyyyyk.",".kwwwwwwwWk.",".kwwwwwwWWk.","..kwwwwwWk..","..kwwwwWWk.."],PL);
A.bodyF=flashOf(A.body);
A.stand=mkS(["..kGGkkGGk..","..kGGkkGGk..","..kGGkkGGk..","..kGGkkGGk..",".kbbbkkbbbk.",".kkkkk.kkkk."],PL);
A.run1=mkS(["..kGGkkGGk..",".kGGk..kGGk.","kGGk....kGGk","kGGk....kGGk","kbbbk..kbbbk","kkkkk..kkkkk"],PL);
A.run2=mkS(["..kGGkkGGk..","..kGGkkGGk..","...kGGGGk...","...kGGGGk...","...kbbbbk...","...kkkkkk..."],PL);
const mk2=(r,p)=>{const c=mkS(r,p,1);return{c,f:flashOf(c)}};
A.I=mk2([".o....",".oo...","..kkkk",".krrrr",".kryrr",".krrkk","..krrr",".kRrrr","kRrrrr","krrsrr","krrrrr","kRrrrR",".krrrr",".kRrrr",".krrk.",".krrk.",".krrk.",".krrk.","kkrrk.","kkkk.."],{k:K,r:'#a3231f',R:'#5e1210',o:'#e8d9b0',y:'#ffd35a',s:'#d98a78'});
A.P=mk2(["......kk",".....kPP","....kPPP","....kPPP","....kPeP","....kPPP",".....kPP","...kkccc","..kcccpp",".kcccppp",".kccpppP","kcccpppP","kccppppp","kccppppp","kcccpppp",".kcccppp",".kccpppp","..kccppp","..kDDppp","..kDDpkk","..kDDDk.",".kkkkkk."],{k:K,p:'#5f6e55',P:'#7d8d70',D:'#3d4838',c:'#6b5a48',e:'#1a1a1a'});
A.L=mk2(["..kkkk",".kmmmm","kmmmmm","kmwkmm","kmmmmm",".kmmmm",".kmMmm","..kmMm","...kmM","..kmk.",".kmk..",".kk..."],{k:K,m:'#b0449a',M:'#6a2255',w:'#fff'});
A.B=mk2(['......Y...YY', '...Y.kYk.kYk', '..kYkkYYkkYY', '..kyyyyyyyyy', '..kyrryyyyrr', '..kkkkkkkkkk', '..ksssssssss', '..kssssswsss', '..ksssssssss', '..kssssddsss', '...kssssssss', '..kkkPPPPPPP', '.kYYYyPPPPww', 'kYYyyyPpppww', 'kYyyyPpppwww', 'kyyyPpppwwrr', 'kyyPppppwwrr', 'kyyPpppppwwr', '.kyPpppppppp', '.kdpppppppyy', '.kyyyyyyyyyy', '.kdpppppppdd', '.kpPpppppppp', '.kppPppppppp', '.kpppppppppp', 'kppppdpppppp', 'kpppddpppppp', 'kppddppppppp', 'kpddppppppdd', 'kddpppppdddd', 'kpppddppppdd', 'kppddppppddd', 'kddddddddddd', '.kkkkkkkkkkk'],{k:K,Y:'#fff1a8',y:'#e8c35a',r:'#e0302a',s:'#2a1e30',w:'#f0e8ff',d:'#3a1a5a',p:'#6a3a9a',P:'#9a6ad0'});
A.altar=mkS([".......y",".......y","....yyyy","....yyyy",".......y",".......y",".......y","....kkkk","...kwwww","..kwwwww","..kwWwwW","..kwwwww",".kkkkkkk",".kbbbbbb",".kbBbbBb",".kbbbbbb",".kkkkkkk"],{k:K,y:'#e8c35a',w:'#6a5a58',W:'#4a3c3c',b:'#5a3a2a',B:'#3a2418'},1);
const HR=[".kk.kk.","krhrrrk","krrrrrk",".krrrk.","..krk..","...k..."];
A.hf=mkS(HR,{k:K,r:'#c0261f',h:'#ff7a68'});A.he=mkS(HR,{k:'#2a1519',r:'#2a1214',h:'#2a1214'});
const FL=["..k..",".kwk.",".kwk.","kyyyk","kyYyk","kyyyk",".kkk."];
A.ff=mkS(FL,{k:K,w:'#8a8a94',y:'#e8c35a',Y:'#fff1a8'});A.fe=mkS(FL,{k:'#2a2418',w:'#2a2418',y:'#2a2418',Y:'#2a2418'});
if(document.fonts)document.fonts.load('8px "Press Start 2P"');

const STAGES=STG.map((d,i)=>({n:d.n,sin:d.sin,tag:d.tag,boss:d.boss?1:0,first:i*10,x:Math.round(36+i*47.5),y:[170,120,170,120,170,120,170,120,170,100][i]}));
const SKIN='#e8c4a0';
const SAINTS={
 guarda:{n:'Santo Anjo da Guarda',t:'Protetor de cada alma',desc:'Anjo enviado por Deus para velar por quem peregrina. Jamais abandona o cruzado em perigo.',eff:'Proteção Angélica',ed:'Cria uma barreira que absorve os próximos 2 golpes (dura 20s).',cd:45,col:'#cfe8ff',robe:'#e8eef8',hair:'#c9a35a',kind:'angel',attr:'shield',h:'Há uma luz no fundo de um poço antigo.',loc:'Poço - Capela em Ruínas'},
 rafael:{n:'São Rafael Arcanjo',t:'Medicina de Deus',desc:'Arcanjo que cura os feridos e guia os viajantes. Seu nome significa "Deus cura".',eff:'Bênção Curativa',ed:'Cura 3 de vida e regenera 1 de vida a cada 3s por 9s.',cd:50,col:'#7dff9a',robe:'#3f9a52',hair:'#8a5a2a',kind:'angel',attr:'staff',h:'Uma torre improvável esconde um santuário.',loc:'Torre - Claustro Profanado'},
 francisco:{n:'São Francisco de Assis',t:'O santo da paz',desc:'Pobre e manso, falava aos animais e aos lobos. Sua paz desarma até os corações mais ferozes.',eff:'Paz de São Francisco',ed:'Pacifica os demônios num raio de 130px por 5s: eles param de atacar.',cd:35,col:'#d8b070',robe:'#6a4a2a',hair:'#3a2a1a',kind:'saint',attr:'dove',h:'A paz vem a quem sobrevive à provação.',loc:'Recompensa - Cripta da Provação'},
 gabriel:{n:'São Gabriel Arcanjo',t:'Mensageiro de Deus',desc:'Anunciou a Maria o nascimento do Salvador. Sua trombeta ecoa a vontade do Altíssimo.',eff:'Trombeta Celeste',ed:'Onda sonora que atordoa e empurra os inimigos num raio de 160px por 3s.',cd:30,col:'#ffe27a',robe:'#e8c35a',hair:'#d8c070',kind:'angel',attr:'trumpet',h:'Atrás de uma porta que ninguém vê.',loc:'Porta secreta - Nave Saqueada'},
 miguel:{n:'São Miguel Arcanjo',t:'Príncipe das milícias celestes',desc:'Líder dos exércitos de Deus, expulsou o orgulho do céu. Defende a Igreja contra o mal.',eff:'Espada Flamejante',ed:'Dano em dobro por 12s e uma explosão de fogo (dano 3) ao redor.',cd:40,col:'#ff6a3a',robe:'#a3231f',hair:'#c9a35a',kind:'angel',attr:'sword',h:'Quem vence o orgulho o encontra.',loc:'Recompensa - Salão do Trono'},
 jorge:{n:'São Jorge',t:'O cavaleiro que venceu o dragão',desc:'Soldado mártir que enfrentou o dragão para salvar o povo. Patrono dos guerreiros.',eff:'Lança de São Jorge',ed:'Lança perfurante que atravessa todos os inimigos em linha (dano 4).',cd:20,col:'#c0c0d0',robe:'#8a8a98',hair:'#5a3a1a',kind:'saint',attr:'spear',h:'O dragão da cobiça guarda esta lança.',loc:'Recompensa - Tesouraria'},
 bento:{n:'São Bento',t:'Pai do monacato',desc:'Sua medalha afasta o mal e os venenos. "A cruz sagrada seja minha luz."',eff:'Medalha de São Bento',ed:'Imunidade a gás e projéteis por 8s e cura 1 de vida.',cd:40,col:'#e8e8e8',robe:'#2a2a30',hair:'#7a7a7a',kind:'saint',attr:'medal',h:'Um poço profano guarda uma medalha.',loc:'Poço - Refeitório Profano'},
 barbara:{n:'Santa Bárbara',t:'Protetora contra tempestades',desc:'Virgem mártir, invocada contra raios e perigos repentinos. Sua fé foi guardada numa torre.',eff:'Tempestade Sagrada',ed:'Raios caem sobre até 4 demônios próximos (dano 3 cada).',cd:35,col:'#9ad0ff',robe:'#4a6aaa',hair:'#4a2a1a',kind:'saint',attr:'bolt',h:'Há uma porta secreta onde o excesso reina.',loc:'Porta secreta - Galeria'},
 teresinha:{n:'Santa Teresinha',t:'A pequena flor',desc:'Prometeu passar o céu fazendo o bem na terra e fazer chover rosas sobre o mundo.',eff:'Chuva de Rosas',ed:'Cura 2 de vida e cria uma área de rosas que fere os demônios por 3s.',cd:35,col:'#ff7aa8',robe:'#7a4a3a',hair:'#5a3a2a',kind:'saint',attr:'rose',h:'Rosas florescem após o banquete.',loc:'Recompensa - Banquete'}
};
const SAINT_ORDER=['guarda','rafael','francisco','gabriel','miguel','jorge','bento','barbara','teresinha'];
const DK=['easy','normal','hard','mod'];
const DIFFS={
 easy:{n:'Fácil',hp:8,fl:3,mul:.7,add:0,d:'Vida 8 · inimigos 30% mais fracos · 3 frascos'},
 normal:{n:'Normal',hp:5,fl:2,mul:1,add:0,d:'Experiência equilibrada · vida 5 · 2 frascos'},
 hard:{n:'Difícil',hp:4,fl:2,mul:1.5,add:1,d:'Vida 4 · inimigos 50% mais fortes · chefes batem mais'},
 mod:{n:'Moderador',hp:10,fl:5,mul:1,add:0,d:'Todas as fases e itens liberados · vida 10 · 5 frascos'}
};
let diff='normal';
const freshMeta=d=>Object.assign({done:Array(10).fill(0),slots:['sword',null,null,null],tears:0,dash:0,xp:0,ach:{},kills:0,kc:{},int:{owned:{},hud:[],act:0}},d==='mod'?{done:Array(10).fill(1),slots:['sword','pot','shd','cal'],dash:1,int:{owned:Object.fromEntries(SAINT_ORDER.map(k=>[k,1])),hud:['miguel','gabriel','rafael'],act:0}}:{});
let meta=freshMeta(diff);
function loadMeta(d){meta=freshMeta(d);try{const m=JSON.parse(localStorage.getItem('cruzado.save.'+d)||(d==='normal'?localStorage.getItem('cruzado.save'):null));if(m&&m.done&&m.done.length===10)meta=Object.assign(freshMeta(d),m)}catch(e){}}
function persist(){try{localStorage.setItem('cruzado.save.'+diff,JSON.stringify(meta))}catch(e){}}
const eh=d=>Math.max(1,Math.round(d.hp*DIFFS[diff].mul));
const potMax=()=>meta.slots.includes('pot')?3:0;
const shdMax=()=>meta.slots.includes('shd')?3:0;
let TT=null,fnd=null,spears=[],bolts=[],ICD={},isel=0,lockOpen=false,waveI=0,dsel=1,zones=[],mtab=0,asel=0,bsel=0,spg=0,asc=0,achQ=[],achCur=null,bossHit=0,eshots=[],invTab=0,gas=[],stg=0,msel=0,sel=0,ui=0,shots=[],prayed={},clearT=0,clearGot=false;
g.imageSmoothingEnabled=false;
A.pot=mkS(["..kyk..","..kwk..","..kwk..",".kpppk.","kpPpppk","kppPppk","kpppppk",".kpppk.","..kkk.."],{k:K,y:'#b58a4a',w:'#cfd0dc',p:'#7a4cff',P:'#c9b4ff'});
A.swd=mkS(["..k..","..w..","..w..","..w..","..w..","kyyyk","..y..","..y..","..k.."],{k:K,w:'#d8d8e4',y:'#d2a63a'});
A.shd=mkS(["kkkk","kyyy","kyyr","kyrr","kyyr","kyyr",".kyy","..ky","...k"],{k:K,y:'#d2a63a',r:'#b5261f'},1);
A.cal=mkS(["kkkk","kYrr","kyyy",".kyy","..ky","..ky",".kyy","kyyy","kkkk"],{k:K,y:'#d2a63a',Y:'#fff1a8',r:'#b5261f'},1);
const ITEMS={sword:{n:'Espada do Cruzado',d:'Golpe corpo a corpo (J)',ic:A.swd},pot:{n:'Poção de Magia',d:'Lance com L: explosão e área mágica',ic:A.pot},
 shd:{n:'Escudo Sagrado',d:'Bloqueia todo dano por 2s (L). 3 usos',ic:A.shd},
 cal:{n:'Cálice Ardente',d:'Gasta 1 frasco: explosão e golpes em dobro',ic:A.cal}};
function recol(c,m){const d0=c.getContext('2d').getImageData(0,0,c.width,c.height),d=d0.data,o=document.createElement('canvas');o.width=c.width;o.height=c.height;
  for(let i=0;i<d.length;i+=4){const n=m[(d[i]<<16)|(d[i+1]<<8)|d[i+2]];if(n!=null){d[i]=n>>16;d[i+1]=(n>>8)&255;d[i+2]=n&255}}
  o.getContext('2d').putImageData(d0,0,0);return{c:o,f:flashOf(o)}}
A.G=mk2(['....kkkkkkkk', '..kkGGGGGGGG', '.kGGGGGGGGGG', '.kGGkkkkkkkk', 'kGGkddeedddd', 'kGGkddeedddd', 'kGGkdddddddd', 'kGGkdyyyyyyy', 'kGGkddkkkkkk', '.kGGkddddddd', '..kGGkkkkkkk', '.kyyGGGGGGGG', 'kyYyGGGGGGGG', 'kyyyGGgggggg', 'kGGGGggggLLL', 'kGGGGgggggLg', 'kGGGgggggggg', 'kGGgggyyyygg', 'kGGggyYYYyyg', 'kGGgggyyyygg', 'kGGggggggggg', 'kyyyyyyyyyyy', 'kYyYyYyYyYyY', 'kyyyyyyyyyyy', '.kGGGggggggg', '.kGGGggggggg', '.kGGGGgggggg', '.kGGGGGggggg', '..kGGGGkkkkk', '..kGGGGk....', '..kGGGGk....', '..kddddk....', '.kkyyyykk...', '.kkkkkkkk...'],{k:K,G:'#2a6a3a',g:'#3f9a52',L:'#9affb0',d:'#14301c',e:'#ffe27a',y:'#e8c35a',Y:'#fff1a8'});
A.U=recol(A.B.c,{0xc9a227:0xa8582a,0xffe27a:0xe8a070,0x6e5a14:0x5a2a14});

A.X=mk2(["..o..o..","..oo.oo.","..kkkkkk",".krrrrrr",".kryrrrr",".krrkkkk",".kktktkt","..krrrrr",".kkrrrrr","kRrrrrrr","kRrffrrr","krrfoorr","krrfoorr","krrrfrrr","kRrrrrrr","kRrrrrrr",".kRrrrrr",".krrRrrr",".krrkkkk",".krrk...",".krrk...",".krrk...","kkrrk...","kkkkk..."],{k:K,r:'#8a1812',R:'#4a0c0a',f:'#c46a58',o:'#e8d9b0',y:'#ffd35a',t:'#e8e0c0'});
A.Y=recol(A.L.c,{0xb0449a:0x6a5acd,0x6a2255:0x2e2a6a});
A.Z=recol(A.P.c,{0x5f6e55:0x58b02a,0x7d8d70:0xa0e050,0x3d4838:0x24521a});
function updGas(){
  for(let i=gas.length-1;i>=0;i--){const q=gas[i];q.t++;if(q.t>q.life){gas.splice(i,1);continue}
    if(q.t%8===0)burst(q.x+rnd(0,q.w),q.y+rnd(0,q.h),1,'#7fdc4a',.3);
    if(P.inv<=0&&q.t>10&&!(P.imm>0)&&ov(P,q)){hurt(1,0);ach('gas')}}
}
const ACH={
 first:{n:'Primeiro Sangue',d:'Derrote seu primeiro demônio',xp:10},
 k25:{n:'Caçador de Pecados',d:'Derrote 25 demônios',xp:50},
 k100:{n:'Flagelo dos Demônios',d:'Derrote 100 demônios',xp:120},
 b1:{n:'Orgulho Quebrado',d:'Derrote a Soberba',xp:100},
 b2:{n:'Ganância Expurgada',d:'Derrote a Avareza, o chefe final',xp:300},
 flaw:{n:'Intocável',d:'Vença um chefe sem levar dano',xp:150},
 pocao:{n:'Alquimista',d:'Obtenha a Poção de Magia',xp:30},
 pot1:{n:'Fogo Místico',d:'Lance a poção pela primeira vez',xp:15},
 devoto:{n:'Devoto',d:'Reze em um altar',xp:10},
 fe:{n:'Fé Crescente',d:'Tenha 4 frascos de bile',xp:40},
 dash1:{n:'Passo Sagrado',d:'Use o dash pela primeira vez',xp:10},
 split:{n:'Dividir e Conquistar',d:'Derrote um fragmento da Luxúria Cindida',xp:30},
 gas:{n:'Ar Irrespirável',d:'Seja atingido pelo gás tóxico',xp:5},
 morte:{n:'A Carne é Fraca',d:'Sucumba ao pecado',xp:5},
 cleared:{n:'Peregrino',d:'Conclua uma fase',xp:50},
 all:{n:'Cruzado Purificador',d:'Conclua as 10 fases',xp:300},
 prova:{n:'Provado na Fé',d:'Conclua uma fase de provação',xp:60},
 inter1:{n:'Primeira Intercessão',d:'Encontre um Intercessor',xp:30},
 inter5:{n:'Coro Celeste',d:'Reúna 5 Intercessores',xp:100},
 inter9:{n:'Comunhão dos Santos',d:'Reúna os 9 Intercessores',xp:200},
 uso1:{n:'Fé em Ação',d:'Use a habilidade de um Intercessor',xp:15},
 porta:{n:'Passagem Secreta',d:'Abra uma porta secreta',xp:25},
 carga:{n:'Golpe Divino',d:'Acerte um golpe de espada carregado',xp:15},
 escudo:{n:'Sob a Proteção',d:'Obtenha o Escudo Sagrado',xp:40},
 calice:{n:'Sede Redentora',d:'Obtenha o Cálice Ardente',xp:60},
 shd1:{n:'Muralha Viva',d:'Bloqueie um ataque com o escudo',xp:20},
 cal1:{n:'Comunhão',d:'Use o Cálice Ardente',xp:20}
};
const BEST=['I','P','L','B','X','Y','Z','G','T','H'];
const DESC={
 I:['Ira','Um homem consumido pela fúria. Patrulha, se prepara e então investe contra você. Esquive durante a preparação.'],
 P:['Preguiça','Alma que desistiu de tudo. Lento e resistente, cochila de tempos em tempos. Ataque enquanto ele dorme.'],
 L:['Luxúria','Espírito flamejante que flutua e persegue a presa pelo ar. Frágil, mas difícil de acertar.'],
 B:['Soberba','O rei vaidoso. Alterna investidas e saltos com pancada no chão. Seu orgulho cai a cada golpe certeiro.'],
 X:['Ira','A fúria que apodreceu o corpo. Mais lento que o comum, mas tem 6 de vida e golpes que arrancam 2 de vida.'],
 Y:['Luxúria','Divide-se em dois no primeiro golpe de espada. Depois disso, cada fragmento morre com um único golpe.'],
 Z:['Preguiça','Rápido e peçonhento. A cada 5 segundos solta uma nuvem de gás tóxico. Afaste-se quando a fumaça subir.'],
 G:['Avareza','Guardião do cofre. Usa dash veloz, saltos e ergue um escudo dourado que bloqueia golpes e poções.'],
 T:['Inveja','Mantém distância e cospe bile em arco. Aproxime-se com o dash ou acerte-a de longe com a poção.'],
 H:['Gula','Glutão que salta sobre você de boca aberta. Observe o salto e golpeie quando ele pousar.'],
 U:['Gula','O devorador. Lento e muito resistente, investe e esmaga o chão. Cada golpe que acerta em você o cura. Não deixe ele te tocar.']
};
const STORY=[
 'Nos anos sombrios da Cruzada, a fé de um povo apodreceu. Os sete pecados capitais, cansados de sussurrar, tomaram corpo e caminharam entre os vivos.',
 'Eles entram em quem peca em excesso. O orgulhoso, o avarento, o guloso, o invejoso... são consumidos aos poucos, até restar apenas o demônio.',
 'Um cavaleiro da cruz vermelha recebeu a missão sagrada: percorrer as terras corrompidas, enfrentar os pecados feitos carne e purificar as almas perdidas.',
 'São sete os pecados: Soberba, Avareza, Luxúria, Inveja, Gula, Ira e Preguiça. Dez fases levam à fonte do mal: a Soberba guarda a quinta, e a Avareza, a última.'
];
const ITEMS2=[
 {n:'Espada do Cruzado',d:'Golpe (J). Segure para carregar um golpe forte.',ic:'swd',own:()=>1},
 {n:'Frasco de Bile',d:'Cura 2 de vida (F). Cresce nos altares.',ic:'ff',own:()=>1},
 {n:'Hábito do Peregrino',d:'Dash (K) com breve invulnerabilidade.',own:()=>START_WITH_DASH||meta.dash},
 {n:'Poção de Magia',d:'Lance com L: explosão e área mágica.',ic:'pot',own:()=>meta.slots.includes('pot')},
 {n:'Escudo Sagrado',d:'Bloqueia todo dano por 2s (L). 3 usos.',ic:'shd',own:()=>meta.slots.includes('shd')},
 {n:'Cálice Ardente',d:'Gasta 1 frasco: explosão sagrada e Fervor.',ic:'cal',own:()=>meta.slots.includes('cal')},
 {n:'Lágrimas de Expiação',d:'Moeda dos pecadores. Vêm dos demônios.',own:()=>1}
];
A.T=mk2(["..kkkk",".kyyyy","kyyyyy","kyywwp","kyyyww",".kyyyy","..kkyy",".kyyyy","kyYyyy","kyYyyY","kyyyyY","kyykyY","kyykyy","kyykyy",".kkkyy","..kyy.","..kyy.","..kkk."],{k:K,y:'#b5b23a',Y:'#8a8728',w:'#f4f4e8',p:'#c0261f'});
A.H=mk2(["....kkk","..kkooo",".koooOO",".kooeoo","koooooo","kookkkk","kooktrr","kookkkk","koooooo","kdooooo","kddoooo",".kddooo","..kkkkk"],{k:K,o:'#a8582a',O:'#e8a070',e:'#ffd35a',t:'#e8e0c0',r:'#c0261f',d:'#5a2a14'});
const lvl=()=>1+Math.floor(meta.xp/100);
function toMap(){state='map';mtab=0}
function ach(id){if(meta.ach[id])return;meta.ach[id]=1;meta.xp+=ACH[id].xp;achQ.push(id);persist()}
function onKill(e){meta.kills++;meta.kc[e.k]=(meta.kc[e.k]||0)+1;ach('first');if(meta.kills>=25)ach('k25');if(meta.kills>=100)ach('k100');if(e.sp)ach('split');persist()}
function wrapTxt(t,n){const L=[];let c='';for(const w of t.split(' ')){if((c+' '+w).trim().length>n){L.push(c);c=w}else c=(c+' '+w).trim()}if(c)L.push(c);return L}
function updEs(){
  for(let i=eshots.length-1;i>=0;i--){const q=eshots[i];q.t++;q.vy+=.1;q.x+=q.vx;q.y+=q.vy;
    if(tile(Math.floor(q.x/T),Math.floor(q.y/T))||q.t>200||q.y>H){eshots.splice(i,1);continue}
    if(P.inv<=0&&!(P.imm>0)&&ov(P,{x:q.x-3,y:q.y-3,w:6,h:6})){hurt(1,q.vx>0?1:-1);eshots.splice(i,1)}}
}
function drawAch(){
  if(!achCur)return;const a=ACH[achCur.id],t=achCur.t,y=Math.round(-36+Math.min(1,t/15)*44-(t>225?(t-225)/15*44:0));
  g.fillStyle='#e8c35a';g.fillRect(100,y-1,280,32);g.fillStyle='#120a0d';g.fillRect(102,y+1,276,28);
  g.fillStyle='#e8c35a';g.fillRect(112,y+6,10,8);g.fillRect(114,y+14,6,4);g.fillRect(111,y+19,12,3);g.fillStyle='#fff1a8';g.fillRect(113,y+7,2,6);
  txt('CONQUISTA DESBLOQUEADA',130,y+12,8,'#e8c35a');txt('+'+a.xp+' XP',372,y+12,8,'#9affb0','right');txt(a.n,130,y+25,8,'#e6d8b0')
}
function mapStep(){
  const OR=paused?[1,2,3,5,4,6]:[0,1,2,3,5,4],sh=d=>{mtab=OR[(Math.max(0,OR.indexOf(mtab))+d+OR.length)%OR.length]};
  if(ht('KeyE','Tab'))sh(1);if(ht('KeyQ'))sh(-1);
  for(let i=0;i<OR.length;i++)if(ht('Digit'+(i+1)))mtab=OR[i];
  if(!paused&&ht('Backspace'))state='diff';
  if(paused&&mtab===6&&ht('Enter','Space')){paused=false;ui=0;shots=[];gas=[];eshots=[];zones=[];toMap();return}
  const R=ht('KeyD','ArrowRight')?1:ht('KeyA','ArrowLeft')?-1:0,U=ht('KeyS','ArrowDown')?1:ht('KeyW','ArrowUp')?-1:0;
  if(mtab===0){msel=Math.max(0,Math.min(STAGES.length-1,msel+R));if(!paused&&ht('Enter','Space')&&(msel===0||meta.done[msel-1]))start(msel)}
  else if(mtab===1)asc=Math.max(0,Math.min(Object.keys(ACH).length-8,asc+U));
  else if(mtab===2)bsel=Math.max(0,Math.min(BEST.length-1,bsel+R+U*6));
  else if(mtab===4)spg=Math.max(0,Math.min(STORY.length-1,spg+R));
  else if(mtab===5){isel=Math.max(0,Math.min(SAINT_ORDER.length-1,isel+R+U*3));const id=SAINT_ORDER[isel];if(meta.int.owned[id]){if(ht('Enter','Space'))equipInt(id);if(ht('KeyF'))unpinInt(id)}}
  if(!paused&&ht('Delete')){meta=freshMeta(diff);persist()}
}
function tabAch(){
  const ks=Object.keys(ACH),n=ks.filter(k=>meta.ach[k]).length;
  txt('CONQUISTAS '+n+'/'+ks.length,28,40,8,'#e8c35a');
  for(let i=0;i<8;i++){const k=ks[asc+i];if(!k)break;const a=ACH[k],on=meta.ach[k],y=50+i*25;
    g.fillStyle=on?'#2a2210':'#1f1517';g.fillRect(24,y,432,23);
    txt((on?'[x] ':'[ ] ')+a.n,32,y+10,8,on?'#e8c35a':'#6a5a5a');txt('+'+a.xp+' XP',448,y+10,8,on?'#9affb0':'#4a3a3a','right');txt(a.d,32,y+20,8,on?'#cdbb97':'#5a4a4a')}
  txt('W/S rolar · Q/E abas',W/2,256,8,'#8a7448','center')
}
function tabBest(){
  BEST.forEach((k,i)=>{const cx=66+(i%6)*72,top=46+((i/6)|0)*56,on=i===bsel;
    g.fillStyle=on?'#e8c35a':'#2a1a1c';g.fillRect(cx-32,top,64,52);g.fillStyle='#120a0d';g.fillRect(cx-30,top+2,60,48);
    const c=A[k].c,sc=c.height<=16?2:1;g.drawImage(c,Math.round(cx-c.width*sc/2),Math.round(top+48-c.height*sc),c.width*sc,c.height*sc)});
  const k=BEST[bsel],d=DEF[k],ds=DESC[k];
  txt(d.n.toUpperCase()+(d.boss?' (CHEFE)':''),28,172,8,'#e8c35a');txt('Derrotados: '+(meta.kc[k]||0),452,172,8,'#9affb0','right');
  txt('Pecado: '+ds[0]+' · Vida '+d.hp+' · Dano '+(d.dmg||(d.boss?2:1)),28,186,8,'#e6d8b0');
  wrapTxt(ds[1],52).forEach((l,i)=>txt(l,28,204+i*12,8,'#cdbb97'));
  txt('A/D/W/S escolher · Q/E abas',W/2,256,8,'#8a7448','center')
}
function tabItems(){
  txt('ITENS',28,40,8,'#e8c35a');
  ITEMS2.forEach((it,i)=>{const y=48+i*29,own=it.own();
    g.fillStyle='#2a1a1c';g.fillRect(24,y,432,27);g.fillStyle='#120a0d';g.fillRect(26,y+2,23,23);
    if(own){if(it.ic){const c=A[it.ic];g.drawImage(c,Math.round(37-c.width),Math.round(y+13-c.height),c.width*2,c.height*2)}else{g.fillStyle='#e8c35a';g.fillRect(36,y+6,2,13);g.fillRect(32,y+10,10,2)}}
    else txt('?',37,y+18,8,'#4a3a3a','center');
    txt(own?it.n:'???',58,y+12,8,own?'#e8c35a':'#6a5a5a');txt(own?it.d:'Ainda não obtido.',58,y+23,8,own?'#cdbb97':'#5a4a4a')});
  txt('Q/E abas',W/2,256,8,'#8a7448','center')
}
function tabStory(){
  txt('A CRUZADA DOS SETE PECADOS',W/2,64,8,'#e8c35a','center');
  wrapTxt(STORY[spg],48).forEach((l,i)=>txt(l,36,98+i*18,8,'#cdbb97'));
  txt('Página '+(spg+1)+'/'+STORY.length+' · A/D virar · Q/E abas',W/2,256,8,'#8a7448','center')
}
function tabBack(){
  txt('VOLTAR AO MAPA DO MUNDO',W/2,100,16,'#e8c35a','center');
  txt('Você sai da fase atual e volta à escolha de fases.',W/2,134,8,'#cdbb97','center');
  txt('Fases concluídas, conquistas e XP ficam salvos.',W/2,150,8,'#cdbb97','center');
  txt('O progresso desta fase (até o chefe) será perdido.',W/2,166,8,'#cdbb97','center');
  txt('ENTER: voltar ao mapa · Q/E: outras abas',W/2,210,8,'#e8c35a','center')
}
function drawDiff(){
  ['#0b0608','#140a0d','#1d0e11','#281214','#34181a'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*54,W,54)});
  txt('ESCOLHA A DIFICULDADE',W/2,52,16,'#e8c35a','center');
  DK.forEach((k,i)=>{const on=i===dsel,y=98+i*40,D=DIFFS[k];
    g.fillStyle=on?'#2a2210':'#1a1013';g.fillRect(40,y-18,400,34);if(on){g.fillStyle='#e8c35a';g.fillRect(40,y-18,400,1);g.fillRect(40,y+15,400,1)}
    txt((on?'> ':'  ')+D.n.toUpperCase(),58,y,16,on?'#e8c35a':'#8a7448');txt(D.d,58,y+12,8,on?'#cdbb97':'#5a4a4a')});
  txt('W/S escolher · ENTER confirmar · Esc voltar',W/2,H-10,8,'#8a7448','center')
}
function drawMap(){
  if(paused&&mtab===0)mtab=1;
  if(mtab===0&&!paused)drawWorldMap();
  else{g.fillStyle=paused?'rgba(0,0,0,.72)':'#0b0608';g.fillRect(0,0,W,H);g.fillStyle='#4a3a3a';g.fillRect(14,26,452,238);g.fillStyle='#160d10';g.fillRect(16,28,448,234);
    [0,tabAch,tabBest,tabItems,tabStory,tabInter,tabBack][mtab]()}
  const NM={0:'MAPA',1:'CONQUISTAS',2:'BESTIÁRIO',3:'ITENS',4:'HISTÓRIA',5:'INTERCESSORES'};let tx=paused?6:10;
  (paused?[1,2,3,5,4]:[0,1,2,3,5,4]).forEach(t=>{const w=NM[t].length*8+8;g.fillStyle=t===mtab?'#e8c35a':'#2a1a1c';g.fillRect(tx,4,w,16);txt(NM[t],tx+w/2,16,8,t===mtab?'#120a0d':'#8a7448','center');tx+=w+4});
  if(paused){const on=mtab===6;g.fillStyle=on?'#c0392b':'#2a1a1c';g.fillRect(428,8,46,12);txt('<MAPA',451,18,8,on?'#fff1a8':'#a3231f','center')}
  txt('NÍVEL '+lvl()+' · XP '+meta.xp,W-8,40,8,'#9affb0','right');
  if(paused)txt('PAUSADO · Esc continua · M mapa',W/2,268,8,'#c0392b','center')
}
function updZones(){
  for(let i=zones.length-1;i>=0;i--){const z=zones[i];z.t++;if(z.t>z.life){zones.splice(i,1);continue}
    if(z.dmg&&z.t%20===0)for(let j=E.length-1;j>=0;j--){const e=E[j];if(Math.hypot(e.x+e.w/2-z.x,e.y+e.h/2-z.y)<z.r+e.w/2)hitEnemy(e,j,z.dmg,true)}}
}
function calBlast(){
  const cx=P.x+5,cy=P.y+13;burst(cx,cy,50,'#ffb347',4);burst(cx,cy,24,'#fff1a8',3);shake=8;hs=4;P.hp=Math.min(P.max,P.hp+1);
  zones.push({x:cx,y:cy,r:80,t:0,life:24,dmg:0,col:'#ffb347',sun:1});
  for(let i=E.length-1;i>=0;i--){const e=E[i];if(Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy)<80)hitEnemy(e,i,4)}
}
function drawShield(col){
  g.globalAlpha=.55+.2*Math.sin(tick/3);g.fillStyle=col||'#e8c35a';const x=Math.round(P.x-4),y=Math.round(P.y-4);
  g.fillRect(x+3,y,12,2);g.fillRect(x+3,y+33,12,2);g.fillRect(x,y+3,2,28);g.fillRect(x+16,y+3,2,28);g.fillRect(x+2,y+2,2,2);g.fillRect(x+14,y+2,2,2);g.fillRect(x+2,y+31,2,2);g.fillRect(x+14,y+31,2,2);
  g.globalAlpha=.14;g.fillRect(x+2,y+2,14,31);g.globalAlpha=1
}
function spawnWave(i){E=ROOMS[cur].waves[i].map(([k,x,y])=>mkEnemy(k,x,y));for(const e of E)burst(e.x+e.w/2,e.y+e.h/2,10,DEF[e.k].col,2)}
function lockStep(){
  const d=ROOMS[cur];if(!d.waves||lockOpen||E.length)return;
  if(waveI<d.waves.length-1){waveI++;spawnWave(waveI);say('Onda '+(waveI+1)+' de '+d.waves.length,120)}
  else{lockOpen=true;for(let y=11;y<15;y++){if(d.l!=null)M[y][0]='.';if(d.r!=null)M[y][COLS-1]='.'}prerender();say('As portas se abriram!',150);shake=4}
}
function hasS(){return M.some(r=>r.includes('S'))}
function curInt(){return meta.int.hud[meta.int.act]}
function equipInt(id){const h=meta.int.hud;let i=h.indexOf(id);if(i<0){if(h.length<3){h.push(id);i=h.length-1}else{i=meta.int.act;h[i]=id}}meta.int.act=i;persist()}
function unpinInt(id){const h=meta.int.hud,i=h.indexOf(id);if(i>=0){h.splice(i,1);meta.int.act=Math.min(meta.int.act,Math.max(0,h.length-1));persist()}}
function grantInt(id){
  if(meta.int.owned[id])return;meta.int.owned[id]=1;if(meta.int.hud.length<3){meta.int.hud.push(id);if(meta.int.hud.length===1)meta.int.act=0}
  persist();fnd=id;TT=null;ach('inter1');const n=Object.keys(meta.int.owned).length;if(n>=5)ach('inter5');if(n>=9)ach('inter9')
}
function breakRect(q){let any=false;
  for(let ty=Math.floor(q.y/T);ty<=Math.floor((q.y+q.h)/T);ty++)for(let tx=Math.floor(q.x/T);tx<=Math.floor((q.x+q.w)/T);tx++)if(M[ty]&&M[ty][tx]==='S'){M[ty][tx]='.';any=true;burst(tx*T+8,ty*T+8,10,'#8a5a2a',2)}
  if(any){prerender();say('Uma passagem secreta se abriu!',150);shake=4;ach('porta')}
}
function radial(cx,cy,r,dmg){for(let i=E.length-1;i>=0;i--){const e=E[i];if(Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy)<r)hitEnemy(e,i,dmg)}}
function useInt(){
  const id=curInt();if(!id||ICD[id]>0||state!=='play')return;
  const S=SAINTS[id],cx=P.x+5,cy=P.y+13;ICD[id]=S.cd*60;ach('uso1');burst(cx,cy,18,S.col,2.5);
  if(id==='guarda'){P.abs=2;P.absT=1200}
  else if(id==='rafael'){P.hp=Math.min(P.max,P.hp+3);P.regen=540}
  else if(id==='francisco'){for(const e of E)if(!DEF[e.k].boss&&Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy)<130){e.calm=300;burst(e.x+e.w/2,e.y,6,S.col,1.5)}}
  else if(id==='gabriel'){shake=6;zones.push({x:cx,y:cy,r:160,t:0,life:20,dmg:0,col:'#ffe27a',sun:1});
    for(const e of E)if(Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy)<160){if(DEF[e.k].boss)e.stun=45;else{e.stun=180;e.vx=(e.x>P.x?1:-1)*3}}}
  else if(id==='miguel'){P.fv=720;zones.push({x:cx,y:cy,r:70,t:0,life:24,dmg:0,col:'#ff6a3a',sun:1});radial(cx,cy,70,3)}
  else if(id==='jorge'){spears.push({x:cx+P.face*8,y:cy-2,vx:P.face*6,hit:[],t:0})}
  else if(id==='bento'){P.imm=480;P.hp=Math.min(P.max,P.hp+1)}
  else if(id==='barbara'){const t=E.slice().sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy)).slice(0,4);
    for(const e of t){bolts.push({x:e.x+e.w/2,y:e.y+e.h/2,t:0});const i=E.indexOf(e);if(i>=0)hitEnemy(e,i,3)}}
  else if(id==='teresinha'){P.hp=Math.min(P.max,P.hp+2);zones.push({x:cx,y:cy,r:90,t:0,life:180,dmg:1,col:'#ff7aa8'})}
}
function updInt(){
  for(let i=spears.length-1;i>=0;i--){const q=spears[i];q.t++;q.x+=q.vx;
    if(tile(Math.floor(q.x/T),Math.floor(q.y/T))||q.x<-20||q.x>W+20||q.t>90){spears.splice(i,1);continue}
    for(let j=E.length-1;j>=0;j--){const e=E[j];if(!q.hit.includes(e)&&q.x>e.x-4&&q.x<e.x+e.w+4&&q.y>e.y-4&&q.y<e.y+e.h+4){q.hit.push(e);hitEnemy(e,j,4)}}}
  for(let i=bolts.length-1;i>=0;i--)if(++bolts[i].t>12)bolts.splice(i,1)
}
function drawTotem(t){
  if(t.door&&hasS())return;const S=SAINTS[t.id],b=Math.round(Math.sin(tick/12)*2),x=Math.round(t.x),y=Math.round(t.y);
  g.fillStyle=S.col;g.globalAlpha=.1;g.fillRect(x-18,y-38,36,38);g.globalAlpha=.16;g.fillRect(x-11,y-30,22,30);g.globalAlpha=1;
  g.fillStyle='#2a2430';g.fillRect(x-7,y-4,14,4);g.fillStyle='#3a3340';g.fillRect(x-4,y-14,8,10);g.fillStyle='#4a4352';g.fillRect(x-4,y-14,2,10);
  g.fillStyle=S.col;g.fillRect(x-2,y-20+b,4,5);g.fillStyle='#ffe27a';g.fillRect(x-5,y-26+b,10,1);g.fillRect(x-6,y-25+b,1,4);g.fillRect(x+5,y-25+b,1,4);g.fillRect(x-5,y-22+b,10,1)
}
function portrait(id,x,y,sc){
  const S=SAINTS[id],R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a*sc,y+b*sc,w*sc,h*sc)};
  R(0,0,32,40,'#e8c35a');R(1,1,30,38,'#120a0d');g.globalAlpha=.28;R(3,3,26,30,S.col);g.globalAlpha=1;
  if(S.kind==='angel')for(let i=0;i<5;i++){const c=i&1?'#c0cce0':'#e8eef8';R(1+i,10+i*3,8-i,3,c);R(23,10+i*3,8-i,3,c)}
  R(9,24,14,14,S.robe);R(8,30,16,8,S.robe);R(9,24,2,14,'#00000040'.length?'#1a1a22':'#000');R(15,26,2,9,'#e8c35a');R(13,28,6,2,'#e8c35a');
  R(10,17,12,7,S.robe);R(14,15,4,2,SKIN);
  R(11,2,10,1,'#ffe27a');R(10,3,1,1,'#ffe27a');R(21,3,1,1,'#ffe27a');R(9,4,1,4,'#ffe27a');R(22,4,1,4,'#ffe27a');R(10,8,1,1,'#ffe27a');R(21,8,1,1,'#ffe27a');
  R(12,5,8,10,SKIN);R(11,4,10,3,S.hair);R(11,5,1,6,S.hair);R(20,5,1,6,S.hair);R(14,9,1,1,'#2a1a1a');R(17,9,1,1,'#2a1a1a');R(15,12,2,1,'#a05050');
  const a=S.attr;
  if(a==='sword'){R(25,8,2,20,'#e8e8f0');R(23,26,6,2,'#e8c35a');R(25,28,2,4,'#6a3a1a');R(24,5,4,3,'#ff6a3a')}
  else if(a==='trumpet'){R(22,22,8,2,'#e8c35a');R(28,19,3,8,'#e8c35a');R(29,20,1,6,'#fff1a8')}
  else if(a==='staff'){R(26,8,2,28,'#8a6a3a');R(24,8,6,2,'#7dff9a');R(26,6,2,2,'#7dff9a')}
  else if(a==='shield'){R(23,22,8,9,'#cfe8ff');R(26,24,2,5,'#e8c35a');R(24,31,6,1,'#cfe8ff')}
  else if(a==='dove'){R(23,20,7,3,'#f0f0f0');R(25,18,3,2,'#f0f0f0');R(29,21,2,1,'#e8c35a');R(22,21,2,1,'#c0c0c8')}
  else if(a==='spear'){R(27,4,1,32,'#c0c0d0');R(26,2,3,4,'#e8e8f0')}
  else if(a==='medal'){R(24,24,6,6,'#e8e8e8');R(26,25,2,4,'#2a2a30');R(25,26,4,2,'#2a2a30')}
  else if(a==='bolt'){R(25,6,3,6,'#9ad0ff');R(23,12,4,3,'#9ad0ff');R(25,15,3,6,'#9ad0ff');R(3,26,5,10,'#8a8a98');R(3,24,5,2,'#6a6a78')}
  else if(a==='rose'){R(25,24,2,10,'#3f9a52');R(23,20,6,5,'#ff7aa8');R(25,21,2,2,'#c0305a')}
}
function miniSaint(id,cx,cy,sc){
  const S=SAINTS[id],R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(cx+a*sc),Math.round(cy+b*sc),w*sc,h*sc)};
  if(S.kind==='angel'){R(-12,-6,6,4,'#e8eef8');R(6,-6,6,4,'#e8eef8');R(-10,-2,4,3,'#c0cce0');R(6,-2,4,3,'#c0cce0')}
  R(-6,-14,12,1,'#ffe27a');R(-7,-13,1,4,'#ffe27a');R(6,-13,1,4,'#ffe27a');
  R(-4,-11,8,9,SKIN);R(-5,-12,10,3,S.hair);R(-5,-11,1,5,S.hair);R(4,-11,1,5,S.hair);R(-2,-6,1,1,'#2a1a1a');R(1,-6,1,1,'#2a1a1a');R(-6,-1,12,6,S.robe)
}
function drawIntHud(){
  const h=meta.int.hud;if(!h.length)return;
  h.forEach((id,i)=>{const x=W-82+i*26,y=H-32,on=i===meta.int.act,cd=ICD[id]||0,S=SAINTS[id];
    g.fillStyle=on?'#e8c35a':'#55423f';g.fillRect(x,y,24,24);g.fillStyle='#120a0d';g.fillRect(x+1,y+1,22,22);miniSaint(id,x+12,y+18,1);
    if(cd>0){g.fillStyle='rgba(0,0,0,.65)';g.fillRect(x+1,y+1,22,Math.round(22*cd/(S.cd*60)));txt(String(Math.ceil(cd/60)),x+12,y+16,8,'#fff','center')}
    txt(String(i+1),x+3,y+9,8,on?'#e8c35a':'#8a7448')});
  txt('U usar',W-6,H-3,8,'#8a7448','right')
}
function drawFound(){
  const S=SAINTS[fnd];g.fillStyle='rgba(0,0,0,.84)';g.fillRect(0,0,W,H);
  g.fillStyle='#e8c35a';g.fillRect(24,18,432,234);g.fillStyle='#120a0d';g.fillRect(26,20,428,230);
  txt('INTERCESSOR ENCONTRADO',W/2,46,16,'#e8c35a','center');
  portrait(fnd,40,64,4);
  wrapTxt(S.n,17).forEach((l,j)=>txt(l,184,86+j*18,16,'#e6d8b0'));
  txt(S.t,184,128,8,S.col);
  wrapTxt(S.desc,34).forEach((l,j)=>txt(l,184,146+j*11,8,'#cdbb97'));
  txt('Concede: '+S.eff,184,190,8,'#e8c35a');
  wrapTxt(S.ed,34).forEach((l,j)=>txt(l,184,202+j*11,8,'#cdbb97'));
  txt('Recarga: '+S.cd+'s',184,238,8,'#9affb0');
  if((tick>>4)%2===0||true)txt('ENTER continuar',40,244,8,'#e8c35a')
}
function tabInter(){
  const o=SAINT_ORDER,n=Object.keys(meta.int.owned).length;
  txt('INTERCESSORES '+n+'/'+o.length,28,40,8,'#e8c35a');
  o.forEach((id,i)=>{const cx=24+(i%3)*62,cy=50+((i/3)|0)*62,on=i===isel,has=meta.int.owned[id],hi=meta.int.hud.indexOf(id);
    g.fillStyle=on?'#e8c35a':'#2a1a1c';g.fillRect(cx,cy,58,58);g.fillStyle='#120a0d';g.fillRect(cx+2,cy+2,54,54);
    if(has)miniSaint(id,cx+29,cy+36,2);else txt('?',cx+29,cy+36,16,'#3a2a2a','center');
    if(hi>=0)txt(String(hi+1),cx+6,cy+12,8,'#9affb0');
    if(curInt()===id)txt('*',cx+52,cy+12,8,'#e8c35a','right')});
  const id=o[isel],S=SAINTS[id],has=meta.int.owned[id],X=222;
  if(has){
    portrait(id,X,48,2);
    wrapTxt(S.n,19).forEach((l,j)=>txt(l,X+72,58+j*11,8,'#e8c35a'));
    wrapTxt(S.t,19).forEach((l,j)=>txt(l,X+72,92+j*11,8,'#cdbb97'));
    const hi=meta.int.hud.indexOf(id);txt(hi<0?'[fora do HUD]':(curInt()===id?'[EQUIPADO]':'[NO HUD '+(hi+1)+']'),X+72,126,8,'#9affb0');
    wrapTxt(S.desc,29).forEach((l,j)=>txt(l,X,148+j*11,8,'#cdbb97'));
    txt(S.eff+' ('+S.cd+'s)',X,198,8,'#e8c35a');
    wrapTxt(S.ed,29).forEach((l,j)=>txt(l,X,209+j*11,8,'#cdbb97'));
    txt(S.loc,X,248,8,'#8a7448');
    txt('ENTER equipar',24,248,8,'#8a7448');txt('F tirar do HUD',24,259,8,'#8a7448')
  }else{
    txt('???',X+8,70,16,'#3a2a2a');txt('Ainda não encontrado.',X,120,8,'#6a5a5a');
    wrapTxt('Dica: '+S.h,29).forEach((l,j)=>txt(l,X,140+j*11,8,'#8a7448'));
    txt('A/D/W/S escolher',24,259,8,'#8a7448')
  }
}
function winStage(){
  meta.done[stg]=1;clearGot=false;
  const rw={4:'pot',5:'shd',8:'cal'}[stg],i=meta.slots.indexOf(null);if(rw&&!meta.slots.includes(rw)&&i>=0){meta.slots[i]=rw;clearGot=rw}
  meta.tears=P.tears;if(stg===4)ach('b1');if(stg===9)ach('b2');ach('cleared');if([2,5,8].includes(stg))ach('prova');{const ir={2:'francisco',4:'miguel',5:'jorge',8:'teresinha'}[stg];if(ir)grantInt(ir)}if(STAGES[stg].boss&&!bossHit)ach('flaw');if(clearGot)ach({pot:'pocao',shd:'escudo',cal:'calice'}[clearGot]);if(meta.done.every(Boolean))ach('all');persist();state='clear';clearT=0;shots=[];ui=0
}
function updShots(){
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.t++;s.vy+=.12;s.x+=s.vx;s.y+=s.vy;
    let hit=tile(Math.floor(s.x/T),Math.floor(s.y/T))||s.t>120||s.x<0||s.x>W||s.y>H;
    if(!hit)for(const e of E)if(s.x>e.x-2&&s.x<e.x+e.w+2&&s.y>e.y-2&&s.y<e.y+e.h+2){hit=true;break}
    if(s.t%3===0)burst(s.x,s.y,1,'#9a7bff',.4);
    if(hit){shots.splice(i,1);boom(s.x,s.y)}}
}
function boom(x,y){breakRect({x:x-30,y:y-30,w:60,h:60});zones.push({x,y,r:46,t:0,life:150,dmg:1,col:'#8f6bff'});burst(x,y,30,'#8f6bff',3);burst(x,y,14,'#d8c8ff',2);shake=5;
  for(let i=E.length-1;i>=0;i--){const e=E[i];if(Math.hypot(e.x+e.w/2-x,e.y+e.h/2-y)<52)hitEnemy(e,i,3)}}
function uiStep(){
  if(ui===2){if(ht('KeyD','ArrowRight','Digit2'))invTab=1;if(ht('KeyA','ArrowLeft','Digit1'))invTab=0}
  if(ui!==1)return;
  const m={KeyW:0,ArrowUp:0,Digit1:0,KeyD:1,ArrowRight:1,Digit2:1,KeyS:2,ArrowDown:2,Digit3:2,KeyA:3,ArrowLeft:3,Digit4:3};
  for(const k in m)if(pr[k]&&meta.slots[m[k]])sel=m[k];
  if(ht('Enter','Space'))ui=0
}
function discG(x,y,r,c){g.fillStyle=c;for(let dy=-r;dy<=r;dy++){const hw=Math.floor(Math.sqrt(r*r-dy*dy));g.fillRect(x-hw,y+dy,hw*2,1)}}
function drawWorldMap(){
  ['#0b0608','#140a0d','#1d0e11','#281214','#34181a'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*54,W,54)});
  for(let x=0;x<W;x+=8){const h=26+((x*37)%19)+Math.round(Math.sin(x/40)*10);g.fillStyle='#10090b';g.fillRect(x,H-h,8,h)}
  g.fillStyle='#55423f';
  for(let i=0;i<STAGES.length-1;i++){const a=STAGES[i],b=STAGES[i+1];for(let t=0;t<=1;t+=.025)g.fillRect(Math.round(a.x+(b.x-a.x)*t),Math.round(a.y+(b.y-a.y)*t),2,2)}
  STAGES.forEach((s,i)=>{const open=i===0||meta.done[i-1],x=s.x,y=s.y;
    discG(x,y,15,i===msel?'#e8c35a':'#3a2d30');discG(x,y,13,open?(meta.done[i]?'#4a3c14':'#4a1a18'):'#1c1618');
    if(!open){g.fillStyle='#6a6a74';g.fillRect(x-4,y-1,8,6);g.fillRect(x-3,y-5,6,1);g.fillRect(x-3,y-5,1,4);g.fillRect(x+2,y-5,1,4)}
    else{g.fillStyle=meta.done[i]?'#e8c35a':'#c0261f';g.fillRect(x-1,y-6,2,12);g.fillRect(x-4,y-3,8,2)}
    txt(String(i+1),x,y+28,8,open?'#cdbb97':'#4a3a3a','center')});
  const s=STAGES[msel],open=msel===0||meta.done[msel-1];
  g.drawImage(A.body,s.x-6,s.y-42+Math.round(Math.sin(tick/10)*2));
  txt('MAPA DO MUNDO',W/2,34,16,'#e8c35a','center');txt('Dificuldade: '+DIFFS[diff].n,W-8,54,8,'#cdbb97','right');
  txt(s.n,W/2,H-44,16,open?'#e6d8b0':'#6a5a5a','center');
  txt(open?(meta.done[msel]?'Concluída · '+s.tag:s.tag):'BLOQUEADA - vença a fase anterior',W/2,H-26,8,open?'#cdbb97':'#c0392b','center');
  txt((paused?'Esc continuar · M mapa · Q/E abas':'A/D escolher · ENTER entrar · Q/E abas'),W/2,H-10,8,'#8a7448','center')
}
const SLP=[[0,-52],[58,0],[0,52],[-58,0]];
function drawWheel(){
  g.fillStyle='rgba(0,0,0,.65)';g.fillRect(0,0,W,H);const cx=W/2,cy=H/2;
  discG(cx,cy,96,'#2a1a1c');discG(cx,cy,92,'#120a0d');discG(cx,cy,20,'#2a1a1c');discG(cx,cy,17,'#1c1114');
  for(let i=0;i<4;i++){const x=cx+SLP[i][0],y=cy+SLP[i][1],it=ITEMS[meta.slots[i]];
    g.fillStyle=i===sel?'#e8c35a':'#4a3a3a';g.fillRect(x-19,y-19,38,38);g.fillStyle='#1c1114';g.fillRect(x-17,y-17,34,34);
    if(it)g.drawImage(it.ic,x-it.ic.width,y-it.ic.height,it.ic.width*2,it.ic.height*2);else txt('-',x,y+4,8,'#4a3a3a','center');
    txt(String(i+1),x-16,y-9,8,'#8a7448')}
  txt('RODA DE ARMAS',cx,24,8,'#e8c35a','center');
  const it=ITEMS[meta.slots[sel]]||ITEMS.sword;txt(it.n,cx,H-34,8,'#e6d8b0','center');txt(it.d,cx,H-22,8,'#cdbb97','center');
  txt('WASD/SETAS ou 1-4 · Q fechar',cx,H-8,8,'#8a7448','center')
}
function drawInv(){
  g.fillStyle='rgba(0,0,0,.78)';g.fillRect(0,0,W,H);g.fillStyle='#4a3a3a';g.fillRect(40,12,400,244);g.fillStyle='#120a0d';g.fillRect(42,14,396,240);
  ['ITENS','COMANDOS'].forEach((t,i)=>{const x=60+i*130;g.fillStyle=i===invTab?'#e8c35a':'#2a1a1c';g.fillRect(x,22,120,16);txt(t,x+60,34,8,i===invTab?'#120a0d':'#8a7448','center')});
  if(invTab===0){
    const rows=[['Lágrimas de Expiação',P.tears],['Frascos de bile',P.fl+'/'+P.flMax],['Vida',P.hp+'/'+P.max]];
    if(meta.slots.includes('pot'))rows.push(['Poção de Magia',P.pot+'/'+potMax()]);
    if(flags.dash)rows.push(['Hábito do Peregrino','Dash (K)']);if(meta.slots.includes('shd'))rows.push(['Escudo Sagrado',P.shd+'/'+shdMax()]);if(meta.slots.includes('cal'))rows.push(['Cálice Ardente','1 frasco']);
    rows.forEach((q,i)=>{txt(q[0],60,74+i*16,8,'#cdbb97');txt(String(q[1]),420,74+i*16,8,'#e8c35a','right')});
    txt('FASES CONCLUÍDAS '+meta.done.filter(Boolean).length+'/10',60,190,8,'#e8c35a');
    [[4,'Soberba'],[9,'Avareza']].forEach(([i,nm],j)=>txt((meta.done[i]?'[x] ':'[ ] ')+nm,60+j*140,208,8,meta.done[i]?'#e8c35a':'#6a5a5a'));
  }else{
    [['A / D, setas','Mover'],['Espaço / W','Pular'],['J / Z','Golpe (segure: carrega)'],['K / X / Shift','Dash'],['F','Frasco de cura'],['L','Usar item da roda'],['Q / Tab','Roda de armas'],['E / Seta baixo','Rezar no altar'],['I','Inventário e comandos'],['Esc / P','Pausa e menu'],['M','Voltar ao mapa'],['N  - / +','Música e volume'],['U / R / 1-3','Intercessor: usar/trocar']]
    .forEach((q,i)=>{txt(q[0],60,68+i*13,8,'#e8c35a');txt(q[1],420,68+i*13,8,'#cdbb97','right')})
  }
  txt('A/D trocar aba · I fechar',W/2,246,8,'#8a7448','center')
}
function drawClear(){
  g.fillStyle='rgba(0,0,0,'+Math.min(.88,clearT/40)+')';g.fillRect(0,0,W,H);if(clearT<30)return;
  txt('FASE CONCLUÍDA',W/2,96,16,'#e8c35a','center');
  txt(STAGES[stg].boss?(stg===9?'A Avareza caiu. Os sete pecados foram purificados!':'O pecado da '+STAGES[stg].sin+' foi purificado.'):STAGES[stg].n+' atravessada.',W/2,122,8,'#cdbb97','center');
  if(clearGot){const it=ITEMS[clearGot];g.drawImage(it.ic,W/2-it.ic.width,158-it.ic.height,it.ic.width*2,it.ic.height*2);txt('Item obtido: '+it.n,W/2,176,8,'#e8c35a','center');txt('Na roda de armas (Q) · usar com L',W/2,190,8,'#cdbb97','center')}
  txt('Progresso salvo',W/2,214,8,'#8a7448','center');
  if(clearT>90&&((tick>>4)&1)===0)txt('ENTER: mapa do mundo',W/2,234,8,'#e8c35a','center')
}
function drawSel(){
  const it=ITEMS[meta.slots[sel]]||ITEMS.sword;g.fillStyle='#55423f';g.fillRect(6,H-32,24,24);g.fillStyle='#120a0d';g.fillRect(7,H-31,22,22);
  g.drawImage(it.ic,18-(it.ic.width>>1),H-20-(it.ic.height>>1));
  {const q=meta.slots[sel];if(q==='pot')txt('x'+P.pot,34,H-14,8,'#c9b4ff');if(q==='shd')txt('x'+P.shd,34,H-14,8,'#e8c35a');if(q==='cal')txt(P.fl>0?'1 frasco':'sem frasco',34,H-14,8,'#ffb347')}
}

let TH=0;
const SKL=["..bbbb..",".bbbbbb.","bbkbbkbb","bbkbbkbb",".bbbbbb.","..bkkb..","..b..b.."];
function stone(b,x,y,top){
  const px=x*T,py=y*T,h=((x*73856093)^(y*19349663))>>>0,th=TH;
  b.fillStyle=[['#3b2e31','#35292c','#3f3134'],['#2c3a30','#27342b','#2f3e33'],['#4a3c34','#44362f','#4e4038'],['#3a1c1c','#341818','#401f1f']][th][h%3];b.fillRect(px,py,T,T);
  b.fillStyle=['#1b1215','#0e1812','#1c1410','#1c0c0c'][th];b.fillRect(px,py+7,T,1);b.fillRect(px,py+15,T,1);b.fillRect(px+7,py,1,7);b.fillRect(px+3,py+8,1,7);b.fillRect(px+11,py+8,1,7);
  b.fillStyle=['#55423f','#4b6a4a','#6a574a','#7a4a30'][th];b.fillRect(px,py,7,1);b.fillRect(px+8,py,7,1);b.fillRect(px,py+8,3,1);b.fillRect(px+4,py+8,7,1);b.fillRect(px+12,py+8,4,1);
  for(let i=0;i<5;i++){b.fillStyle=i&1?['#4a3a3a','#3a5238','#5a4a3e','#5a3030'][th]:['#261b1e','#16231b','#2a1f19','#2a1212'][th];b.fillRect(px+((h>>(i*3))&15),py+((h>>(i*3+1))&15),1,1)}
  if((th===1||th===3)&&h%5===0){b.fillStyle='#8a6a1a';b.fillRect(px+2,py+3,3,1);b.fillRect(px+4,py+4,2,1);b.fillRect(px+9,py+11,3,1)}
  if(th===2&&!top&&h%11===0)SKL.forEach((rw,j)=>{for(let i=0;i<8;i++){const c=rw[i];if(c!=='.'){b.fillStyle=c==='b'?'#cfc4aa':'#1b1410';b.fillRect(px+4+i,py+8+j,1,1)}}});
  if(top){
    if(th===0){b.fillStyle='#6f5e3c';b.fillRect(px,py,T,2);b.fillStyle='#8f7a4a';b.fillRect(px,py,T,1);for(let i=0;i<4;i++){b.fillStyle='#6f5e3c';b.fillRect(px+((h>>(i*4))&15),py+2,1,1+(i&1))}}
    else if(th===1||th===3){b.fillStyle='#b58a2a';b.fillRect(px,py,T,2);b.fillStyle='#f0d070';b.fillRect(px,py,T,1);
      if(h%6===0){b.fillStyle='#b58a2a';b.fillRect(px+4,py-2,8,2);b.fillStyle='#f0d070';b.fillRect(px+6,py-4,4,2);b.fillRect(px+5,py-2,2,1)}}
    else{b.fillStyle='#7a4a20';b.fillRect(px,py,T,2);b.fillStyle='#a8703a';b.fillRect(px,py,T,1);for(let i=0;i<4;i++){b.fillStyle='#7a4a20';b.fillRect(px+((h>>(i*4))&15),py+2,1,2+(i&1))}
      if(h%7===0){b.fillStyle='#cfc4aa';b.fillRect(px+3,py-2,7,2);b.fillRect(px+2,py-3,2,2);b.fillRect(px+9,py-3,2,2)}}
  }
}
function prerender(){
  if(!BG){BG=document.createElement('canvas');BG.width=W;BG.height=H}
  const b=BG.getContext('2d'),d=ROOMS[cur],th=TMAP[Math.floor(cur/10)];TH=th;
  const sky=d.sky||['#0b0608','#140a0d','#1d0e11','#281214','#34181a'],bh=Math.ceil(H/sky.length);
  sky.forEach((c,i)=>{b.fillStyle=c;b.fillRect(0,i*bh,W,bh)});
  for(let i=1;i<sky.length;i++){b.fillStyle=sky[i];for(let x=0;x<W;x+=2){b.fillRect(x,i*bh-2,1,1);b.fillRect(x+1,i*bh-1,1,1)}}
  const MX=370,MY=80,disc=(r,c)=>{b.fillStyle=c;for(let dy=-r;dy<=r;dy++){const hw=Math.floor(Math.sqrt(r*r-dy*dy));b.fillRect(MX-hw,MY+dy,hw*2,1)}};
  const arch=(cx,w,sy,col)=>{const top=sy-w*.8;b.fillStyle=col;for(let y=Math.round(top);y<sy;y++){const hw=Math.round(w/2*Math.pow((y-top)/(sy-top),.55));b.fillRect(cx-hw-2,y,4,1);b.fillRect(cx+hw-2,y,4,1)}b.fillRect(cx-w/2-2,sy,4,H-sy);b.fillRect(cx+w/2-2,sy,4,H-sy)};
  if(th===0){
    disc(42,'rgba(200,60,40,.07)');disc(34,'rgba(200,60,40,.1)');disc(26,d.moon||'#5a1c1a');
    b.fillStyle=sky[2];b.fillRect(MX-1,MY-34,3,68);b.fillRect(MX-16,MY-8,32,3);
    for(let i=-1;i<6;i++)arch(i*96+48,84,150,'#1a1013');
    for(let i=0;i<4;i++){const x=i*150+20;b.fillStyle='#0f090b';b.fillRect(x,0,16,H);b.fillRect(x-2,0,20,6);b.fillRect(x-2,120,20,4);b.fillStyle='#1c1215';b.fillRect(x,0,2,H)}
  }else if(th===1){
    /* Catedral da Avareza: moeda gigante, vitrais verdes e dourados, colunas com faixas de ouro */
    disc(42,'rgba(200,170,40,.07)');disc(34,'rgba(200,170,40,.1)');disc(26,'#7a6a1c');disc(21,'#5a4a14');disc(19,'#7a6a1c');
    b.fillStyle='#e8c35a';b.fillRect(MX-2,MY-11,4,22);b.fillRect(MX-6,MY-7,12,3);b.fillRect(MX-6,MY+4,12,3);
    for(let i=0;i<5;i++){const cx=i*100+50,w=46,sy=150,top=Math.round(sy-w*.8);
      for(let y=top;y<sy+34;y++){const hw=y<sy?Math.round(w/2*Math.pow((y-top)/(sy-top),.55)):w/2;b.fillStyle=['#0f2a1c','#15402a','#2a4a1c','#3a3a14'][((y>>3)+i)%4];b.fillRect(cx-hw,y,hw*2,1)}
      b.fillStyle='#08140c';b.fillRect(cx-1,top,2,sy+34-top);for(let y=top+10;y<sy+34;y+=16)b.fillRect(cx-w/2,y,w,1)}
    for(let i=0;i<4;i++){const x=i*150+20;b.fillStyle='#0b1510';b.fillRect(x,0,16,H);b.fillStyle='#16241b';b.fillRect(x,0,2,H);
      for(const y of[16,100,184]){b.fillStyle='#6a5418';b.fillRect(x-2,y,20,4);b.fillStyle='#b58a2a';b.fillRect(x-2,y,20,1)}}
  }else if(th===2){
    /* Ossuário da Gula: prato gigante com talheres, costelas, correntes com carne e pilares de vértebras */
    disc(42,'rgba(220,150,80,.07)');disc(34,'rgba(220,150,80,.1)');disc(28,'#6a5a48');disc(21,'#3a2c22');disc(13,'#5a4a3a');
    b.fillStyle='#8a7a66';b.fillRect(MX-50,MY-24,3,48);for(let i=0;i<3;i++)b.fillRect(MX-54+i*4,MY-28,1,8);b.fillRect(MX-54,MY-22,9,2);b.fillRect(MX+46,MY-26,4,52);b.fillRect(MX+44,MY-26,2,24);
    for(let i=-1;i<6;i++)arch(i*96+48,84,150,'#241a14');
    for(let i=0;i<4;i++){const x=i*150+20;b.fillStyle='#1f1813';b.fillRect(x,0,16,H);for(let y=8;y<H;y+=8){b.fillStyle='#2c231c';b.fillRect(x,y,16,2)}}
    for(const x of[60,150,262,338,430]){const len=60+((x*7)%70);for(let y=0;y<len;y+=4){b.fillStyle='#3a2f2a';b.fillRect(x-1,y,3,2);b.fillStyle='#2a211c';b.fillRect(x,y+2,1,2)}
      b.fillStyle='#6a5a52';b.fillRect(x-3,len,7,2);b.fillRect(x+2,len+2,2,4);b.fillStyle='#5a2a1c';b.fillRect(x-6,len+6,13,10);b.fillStyle='#7a3a28';b.fillRect(x-5,len+7,5,3)}
  }else{
    /* Tesouro Maldito (fase final): sol de ouro, pilares dourados, arcos rubros e lustres */
    disc(48,'rgba(220,170,40,.08)');disc(40,'rgba(220,170,40,.12)');disc(30,'#8a6a1c');disc(24,'#b58a2a');disc(18,'#e8c35a');
    for(let i=-1;i<6;i++)arch(i*96+48,84,150,'#3a1a10');
    for(let i=0;i<4;i++){const x=i*150+20;b.fillStyle='#2a1208';b.fillRect(x,0,16,H);b.fillStyle='#8a6a1a';b.fillRect(x,0,3,H);b.fillStyle='#e8c35a';b.fillRect(x,0,1,H);for(const y of[12,60,132,200]){b.fillStyle='#b58a2a';b.fillRect(x-3,y,22,5);b.fillStyle='#fff1a8';b.fillRect(x-3,y,22,1)}}
    for(const x of[110,250,390]){b.fillStyle='#6a5418';b.fillRect(x,0,2,40);b.fillStyle='#b58a2a';b.fillRect(x-12,40,26,3);for(let q=-2;q<=2;q++){b.fillStyle='#e8c35a';b.fillRect(x+q*6,34,2,6);b.fillStyle='#fff1a8';b.fillRect(x+q*6,31,2,3)}}
  }
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const c=M[y][x];
    if(c==='#')stone(b,x,y,y>0&&M[y-1][x]!=='#');
    else if(c==='S'){const px=x*T,py=y*T;b.fillStyle='#3a2616';b.fillRect(px,py,T,T);b.fillStyle='#5a3a20';for(let i=0;i<4;i++)b.fillRect(px+i*4,py,1,T);b.fillStyle='#2a1a0e';b.fillRect(px,py+4,T,1);b.fillRect(px,py+11,T,1);b.fillStyle='#6a6a74';b.fillRect(px,py+2,T,2);b.fillRect(px,py+12,T,2);b.fillStyle='#b58a2a';b.fillRect(px+6,py+7,3,3)}
    else if(c==='^')for(let i=0;i<4;i++){const x0=x*T+i*4,py=y*T;b.fillStyle='#e0dade';b.fillRect(x0+1,py+6,2,2);b.fillStyle='#aaa4a8';b.fillRect(x0,py+8,4,3);b.fillStyle='#6f6a6e';b.fillRect(x0,py+11,4,5);b.fillStyle='#4a4548';b.fillRect(x0+3,py+8,1,8)}}
  deco(b,d.deco);decoHid(b,d);
}
function decoHid(b,d){
  if(d.well){const x0=d.well[0]*T,w=(d.well[1]-d.well[0]+1)*T;b.fillStyle='#050203';b.fillRect(x0,240,w,16);
    b.fillStyle='#4a3c34';b.fillRect(x0-2,232,4,8);b.fillRect(x0+w-2,232,4,8);b.fillStyle='#6a574a';b.fillRect(x0-2,232,4,1);b.fillRect(x0+w-2,232,4,1);
    b.fillStyle='#3a2f2a';b.fillRect(x0,224,w,2);b.fillRect(x0+w/2-1,226,2,14)}
  if(d.tot&&d.tot.door&&M.some(r=>r.includes('S'))){b.fillStyle='#08040a';b.fillRect(24*T,9*T,4*T,2*T)}
}
function deco(b,k){
  if(k==='throne'){
    /* sala da Soberba: carpete real, estandartes com coroa e trono */
    b.fillStyle='#5a1218';b.fillRect(40,236,400,4);b.fillStyle='#b58a2a';b.fillRect(40,236,400,1);b.fillRect(40,239,400,1);
    for(const x of[96,176,304,384]){b.fillStyle='#b58a2a';b.fillRect(x-14,30,28,3);b.fillStyle='#4a1a6a';b.fillRect(x-12,33,24,52);b.fillStyle='#6a2a9a';b.fillRect(x-12,33,4,52);
      b.fillStyle='#4a1a6a';b.fillRect(x-12,85,8,6);b.fillRect(x-4,85,8,10);b.fillRect(x+4,85,8,6);
      b.fillStyle='#e8c35a';b.fillRect(x-5,52,10,4);b.fillRect(x-5,48,2,4);b.fillRect(x-1,46,2,6);b.fillRect(x+3,48,2,4)}
    b.fillStyle='#2a1208';b.fillRect(214,196,10,40);b.fillRect(256,196,10,40);b.fillStyle='#b58a2a';b.fillRect(212,194,14,3);b.fillRect(254,194,14,3);
    b.fillStyle='#5a1a1a';b.fillRect(222,112,36,90);b.fillRect(228,102,24,10);b.fillRect(234,94,12,8);b.fillRect(238,86,4,8);
    b.fillStyle='#b58a2a';b.fillRect(222,112,2,90);b.fillRect(256,112,2,90);b.fillRect(228,102,2,10);b.fillRect(250,102,2,10);b.fillRect(238,84,4,2);
    b.fillStyle='#a3231f';b.fillRect(224,196,32,8);b.fillStyle='#fff1a8';b.fillRect(236,130,8,2);b.fillRect(239,126,2,10);
  }else if(k==='hoard'){
    /* sala da Avareza: montanhas de ouro, baús abertos e moedas */
    for(const[bx,dir]of[[96,1],[384,-1]])for(let q=0;q<10;q++){const w=(10-q)*8+10,y=238-q*5,x0=dir>0?bx:bx-w;
      b.fillStyle=q%2?'#b58a2a':'#8a6a1a';b.fillRect(x0,y,w,5);b.fillStyle='#e8c35a';for(let i=0;i<w;i+=7)b.fillRect(x0+i+((q*3)%5),y,3,2)}
    for(const x of[200,252]){b.fillStyle='#4a2a14';b.fillRect(x,222,28,16);b.fillStyle='#b58a2a';b.fillRect(x,222,28,2);b.fillRect(x,228,28,2);b.fillRect(x+12,226,4,6);
      b.fillStyle='#e8c35a';b.fillRect(x+2,218,24,4);b.fillRect(x+6,215,16,3);b.fillStyle='#fff1a8';b.fillRect(x+8,216,3,1)}
  }
}
function mkVignette(){VG=document.createElement('canvas');VG.width=W;VG.height=H;const v=VG.getContext('2d');
  const r=v.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.62);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.7)');v.fillStyle=r;v.fillRect(0,0,W,H)}

/* ====== EFEITOS ====== */
function burst(x,y,n,col,sp){for(let i=0;i<n;i++){const a=rnd(0,6.283),s=rnd(.3,sp);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.5,l:rnd(20,45),c:col})}}
function say(t,l){toast={t,l}}

/* ====== JOGADOR ====== */
function updPlayer(){
  if(P.kneel>0){P.kneel--;P.vx=0;P.vy=Math.min(P.vy+.22,5);moveBody(P);return}
  if(P.stn>0){P.stn--;P.vx*=.9;P.vy=Math.min(P.vy+.22,5.5);P.inv--;moveBody(P);return}
  const dir=(dn('KeyD','ArrowRight')?1:0)-(dn('KeyA','ArrowLeft')?1:0),jk=['Space','KeyW','ArrowUp'];
  P.coy=P.onG?6:P.coy-1;P.buf=ht(...jk)?6:P.buf-1;
  const jd=dn('KeyJ','KeyZ');
  if(jd&&P.atk<=0&&P.dash<=0)P.ch=(P.ch||0)+1;
  else if(!jd&&P.ch>0){if(P.atk<=0&&P.dash<=0){P.heavy=P.ch>=45;P.atk=P.heavy?26:20;P.swing++;if(P.heavy){shake=3;burst(P.x+5+P.face*10,P.y+12,10,'#ffe27a',2.5)}}P.ch=0}
  P.thr=(P.thr||0)-1;for(const k in ICD)if(ICD[k]>0)ICD[k]--;if(P.regen>0){P.regen--;if(P.regen%180===0)P.hp=Math.min(P.max,P.hp+1)}if(P.imm>0){P.imm--;if(tick%8===0)burst(P.x+5,P.y+4,1,'#e8e8e8',.6)}if(P.abs>0&&--P.absT<=0)P.abs=0;P.shT=Math.max(0,(P.shT||0)-1);P.fv=Math.max(0,(P.fv||0)-1);if(P.fv>0&&tick%6===0)burst(P.x+5,P.y+6,1,'#ff9a3a',.8);
  if(ht('KeyL')&&meta.slots[sel]==='pot'&&P.pot>0&&P.thr<=0&&P.dash<=0&&P.atk<=0){P.pot--;P.thr=20;ach('pot1');shots.push({x:P.x+5+P.face*6,y:P.y+8,vx:P.face*2.6+P.vx*.3,vy:-2.4,t:0})}
  if(ht('KeyL')&&meta.slots[sel]==='shd'&&P.shd>0&&P.shT<=0){P.shd--;P.shT=120;burst(P.x+5,P.y+13,16,'#e8c35a',1.8)}
  if(ht('KeyL')&&meta.slots[sel]==='cal'&&P.fl>0&&P.dash<=0&&P.atk<=0){P.fl--;P.fv=480;calBlast();ach('cal1')}
  if(ht('KeyU'))useInt();if(ht('KeyR')){const h=meta.int.hud;if(h.length)meta.int.act=(meta.int.act+1)%h.length}
  for(let i=0;i<3;i++)if(ht('Digit'+(i+1))&&meta.int.hud[i])meta.int.act=i;
  if(flags.dash&&ht('KeyK','KeyX','ShiftLeft')&&P.dcd<=0&&P.dash<=0){P.dash=13;P.dcd=45;P.ch=0;ach('dash1');P.inv=Math.max(P.inv,16);P.atk=0;burst(P.x+5,P.y+14,8,'#8d8d97',1.2)}
  if(ht('KeyF')&&P.fl>0&&P.hp<P.max&&P.onG){P.fl--;P.hp=Math.min(P.max,P.hp+2);burst(P.x+5,P.y+10,14,'#e8c35a',1.5)}
  if(P.dash>0){P.dash--;P.vx=P.face*4.6;P.vy=0}
  else{
    const sp=P.atk>0?.4:(P.ch>5?.8:1.6);
    P.vx+=(dir*sp-P.vx)*(P.onG?.45:.25);
    if(dir&&P.atk<=0)P.face=dir;
    P.vy=Math.min(P.vy+.22,5.5);
    if(P.buf>0&&P.coy>0){P.vy=-4.5;P.buf=0;P.coy=0}
    if(!dn(...jk)&&P.vy<-1.5)P.vy*=.6;
  }
  P.atk--;P.dcd--;P.inv--;
  moveBody(P);
  if(P.dash>0&&P.hitX)P.dash=0;
}
function hurt(n,dir){
  if(P.shT>0){burst(P.x+5,P.y+13,8,'#fff1a8',2);ach('shd1');return false}
  if(P.abs>0){P.abs--;P.inv=40;burst(P.x+5,P.y+13,12,'#cfe8ff',2.5);return false}
  if(n>=2)n+=DIFFS[diff].add;
  if(E.some(e=>DEF[e.k].boss))bossHit=1;
  P.hp-=n;P.inv=70;P.vx=dir*2.6;P.vy=-2.6;P.atk=0;P.dash=0;P.ch=0;P.stn=10;shake=7;hs=6;
  burst(P.x+5,P.y+12,14,'#b3201c',2.2);
  if(P.hp<=0){state='dead';deadT=170;ach('morte')}
}
function tele(){P.x=lastSafe.x;P.y=lastSafe.y;P.vx=0;P.vy=0;P.stn=0}
function hazards(){
  for(let ty=Math.floor(P.y/T);ty<=Math.floor((P.y+P.h-.01)/T);ty++)for(let tx=Math.floor(P.x/T);tx<=Math.floor((P.x+P.w-.01)/T);tx++)
    if(M[ty]&&M[ty][tx]==='^'&&P.y+P.h>ty*T+7&&P.inv<=0){hurt(1,0);if(state==='play'){tele();P.inv=90}return}
  if(P.y>H+8){hurt(1,0);if(state==='play'){tele();P.inv=90}}
}

/* ====== INIMIGOS ====== */
function ai(e,dx,dy){
  if(e.k==='L'||e.k==='Y'){
    if(Math.abs(dx)<190){const a=Math.atan2(dy+Math.sin(e.t/18)*20-4,dx);e.vx=Math.cos(a)*.75;e.vy=Math.sin(a)*.75}
    else{e.vx=0;e.vy=Math.sin(e.t/25)*.3}
    return}
  if(DEF[e.k].boss){
    if(e.s===0){e.vx=0;e.dir=dx>0?1:-1;
      if(--e.c<=0){const rr=Math.random();if(DEF[e.k].shield&&rr<.34){e.s=3;e.c=110}else if(rr<(DEF[e.k].shield?.67:.5)){e.s=1;e.c=DEF[e.k].shield?22:50}else{e.s=2;e.c=0;e.vy=-5.4;e.vx=Math.max(-3,Math.min(3,dx/50))}}}
    else if(e.s===1){e.vx=e.dir*(DEF[e.k].shield?5.2:3.2)*(DEF[e.k].bs||1);if(--e.c<=0||e.hitX){e.s=0;e.c=50}}
    else if(e.s===3){e.vx=0;e.dir=dx>0?1:-1;if(--e.c<=0){e.s=1;e.c=22}}
    else{e.c++;if(e.onG&&e.c>8){e.s=0;e.c=60;e.vx=0;shake=8}}
    return}
  if(e.k==='T'){
    const ad=Math.abs(dx);e.dir=dx>0?1:-1;
    let mv=ad<90?-e.dir*.6:(ad>170?e.dir*.5:0);
    if(mv&&!tile(Math.floor((e.x+(mv>0?e.w+2:-2))/T),Math.floor((e.y+e.h+2)/T)))mv=0;
    e.vx=mv;
    if(e.t%140===0&&ad<230&&Math.abs(dy)<90){eshots.push({x:e.x+e.w/2,y:e.y+4,vx:e.dir*Math.min(3,ad/50+.3),vy:-2.6,t:0});burst(e.x+6,e.y+4,6,'#e8e86a',1.2)}
    return}
  if(e.k==='H'){
    if(e.onG){e.vx=0;if(--e.c<=0&&Math.abs(dx)<220){e.vy=-4.2;e.vx=Math.max(-2.2,Math.min(2.2,dx/35));e.c=70}}
    return}
  const ahead=!tile(Math.floor((e.x+(e.dir>0?e.w+2:-2))/T),Math.floor((e.y+e.h+2)/T));
  if(e.k==='I'||e.k==='X'){
    const sp=DEF[e.k].sp||1;
    if(e.s===0){e.vx=e.dir*.5*sp;if(Math.abs(dx)<140&&Math.abs(dy)<32){e.s=1;e.c=DEF[e.k].wu||25;e.dir=dx>0?1:-1;e.vx=0}}
    else if(e.s===1){e.vx=0;if(--e.c<=0){e.s=2;e.c=40}}
    else if(e.s===2){e.vx=e.dir*2.4*sp;if(--e.c<=0||e.hitX||(e.onG&&ahead)){e.s=3;e.c=50}}
    else{e.vx=0;if(--e.c<=0)e.s=0}
  }else{e.vx=e.k==='Z'?e.dir*.95:((e.t%260<100)?0:e.dir*.35)}
  if(e.s<1||e.s>2){if(e.hitX||(e.onG&&ahead))e.dir*=-1}
}
function hitEnemy(e,i,n=1,soft){
  const d=DEF[e.k];e.sw=P.swing;
  if(d.shield&&e.s===3){hs=3;shake=3;burst(e.x+e.w/2+e.dir*14,e.y+16,6,'#fff1a8',2);return false}
  if(d.split&&!e.sp){e.sp=1;e.hp=1;e.fl=6;hs=3;E.push(Object.assign({},e,{x:e.x+(P.face>0?14:-14),vx:P.face*2.6,vy:-1,sw:P.swing,stun:12}));e.vx=-P.face*2.6;e.vy=-1;e.stun=12;burst(e.x+6,e.y+6,12,d.col,2.4);return false}
  e.hp-=n;e.fl=6;if(!soft){hs=(P.atk>0&&P.heavy)?7:3;if(P.atk>0&&P.heavy){shake=5;ach('carga')}}burst(e.x+e.w/2,e.y+e.h/2,8,d.col,2);
  if(!d.boss&&!soft){e.vx=P.face*((P.atk>0&&P.heavy)?4.5:2.4);e.vy=d.fly?-.5:-1.6;e.stun=14}
  if(e.hp<=0){burst(e.x+e.w/2,e.y+e.h/2,26,d.col,3);P.tears+=d.t;onKill(e);E.splice(i,1);
    if(d.boss){winStage()}
    return true}
  return false
}
function updEnemies(){
  const hv=P.heavy,hb=(P.atk>=(hv?9:7)&&P.atk<=(hv?20:14))?{x:P.face>0?P.x+P.w:P.x-(hv?44:26),y:P.y+(hv?-4:2),w:hv?44:26,h:hv?32:22}:null;if(hb)breakRect(hb);
  for(let i=E.length-1;i>=0;i--){
    const e=E[i],d=DEF[e.k];e.t++;e.fl--;if(e.calm>0){e.calm--;e.vx*=.7;if(d.fly)e.vy*=.7}
    if(e.k==='Z'&&!(e.calm>0)){if(e.t%300===0)gas.push({x:e.x+e.w/2-16,y:e.y-8,w:32,h:30,t:0,life:180});if(e.t%300>250&&e.t%5===0)burst(e.x+e.w/2,e.y+4,1,'#9affb0',.6)}
    const dx=P.x+5-(e.x+e.w/2),dy=P.y-e.y;
    if(e.stun>0){e.stun--;e.vx*=.88;e.vy*=d.fly?.88:1}else if(!(e.calm>0))ai(e,dx,dy);
    if(d.fly){e.x=Math.max(20,Math.min(W-20-e.w,e.x+e.vx));e.y=Math.max(36,Math.min(H-40,e.y+e.vy))}
    else{e.vy=Math.min(e.vy+.22,5);moveBody(e)}
    if(hb&&e.sw!==P.swing&&ov(hb,e)&&hitEnemy(e,i,(P.fv>0?2:1)*(hv?3:1)))continue;
    if(P.inv<=0&&state==='play'&&!(e.calm>0)&&ov(P,e)){if(hurt(DEF[e.k].dmg||(DEF[e.k].boss?2:1),dx>0?-1:1)!==false&&d.heal){e.hp=Math.min(e.mhp,e.hp+d.heal);burst(e.x+e.w/2,e.y+8,14,'#7fdc4a',2)}}
  }
}

/* ====== SALAS ====== */
function go(id,side){cur=id;build(id);const ar=ROOMS[id].waves;P.x=side==='l'?W-P.w-(ar?26:3):(ar?26:3);lastSafe={x:P.x,y:P.y};rn={t:ROOMS[id].n,l:200};parts=[];shots=[];gas=[];eshots=[];zones=[]}
function start(n){
  stg=n;flags={dash:START_WITH_DASH||!!meta.dash};prayed={};shots=[];gas=[];eshots=[];zones=[];ICD={};bossHit=0;ui=0;sel=0;
  Object.assign(P,{hp:DIFFS[diff].hp,max:DIFFS[diff].hp,fl:DIFFS[diff].fl,flMax:DIFFS[diff].fl,pot:potMax(),shd:shdMax(),fv:0,shT:0,abs:0,regen:0,imm:0,tears:meta.tears||0,inv:0,vx:0,vy:0,atk:0,dash:0,dcd:0,kneel:0,stn:0,face:1,swing:0,coy:0,buf:0});
  cur=STAGES[n].first;save={room:cur,x:60,y:240-26.01};build(cur);P.x=save.x;P.y=save.y;lastSafe={x:P.x,y:P.y};
  state='play';rn={t:ROOMS[cur].n,l:200}
}
function respawn(){
  state='play';cur=save.room;build(cur);gas=[];shots=[];eshots=[];zones=[];
  Object.assign(P,{hp:P.max,fl:P.flMax,pot:potMax(),shd:shdMax(),fv:0,shT:0,x:save.x,y:save.y,vx:0,vy:0,inv:90,atk:0,dash:0,stn:0,kneel:0});
  lastSafe={x:P.x,y:P.y};rn={t:ROOMS[cur].n,l:160}
}

/* ====== LOOP ====== */
function step(){
  if(achCur){achCur.t++;if(achCur.t>240)achCur=null}
  if(!achCur&&achQ.length)achCur={id:achQ.shift(),t:0};
  if(fnd&&state!=='title'&&state!=='diff'&&state!=='map'){if(ht('Enter','Space','Escape'))fnd=null;return}
  if(state==='title'){if(ht('Enter','Space'))state='diff';return}
  if(state==='diff'){if(ht('KeyS','ArrowDown'))dsel=Math.min(3,dsel+1);if(ht('KeyW','ArrowUp'))dsel=Math.max(0,dsel-1);
    if(ht('Enter','Space')){diff=DK[dsel];loadMeta(diff);msel=0;toMap()}if(ht('Escape'))state='title';return}
  if(state==='map'){mapStep();return}
  if(state==='clear'){clearT++;updParts();if(clearT>90&&ht('Enter','Space'))toMap();return}
  if(state==='play'&&ht('KeyM')){toMap();ui=0;paused=false;shots=[];gas=[];return}
  if(ht('Escape','KeyP')&&state==='play'){if(ui)ui=0;else{paused=!paused;if(paused)mtab=1}}
  if(paused){mapStep();return}
  if(state==='play'){if(ht('KeyQ','Tab'))ui=ui===1?0:1;if(ht('KeyI'))ui=ui===2?0:2}
  if(ui){uiStep();return}
  tick++;
  if(state==='dead'){if(--deadT<=0)respawn();updParts();return}
  if(hs>0){hs--;return}
  updPlayer();updEnemies();updShots();updGas();updEs();updZones();updInt();if(state!=='play')return;lockStep();hazards();
  const cx=P.x+P.w/2,d=ROOMS[cur];
  if(state==='play'){
    if(cx<0&&d.l!=null)go(d.l,'l');else if(cx>W&&d.r==='end'){if(!d.waves||lockOpen)winStage()}else if(cx>W&&d.r!=null)go(d.r,'r');
  }
  if(TT&&!(TT.door&&hasS())&&ov(P,{x:TT.x-8,y:TT.y-26,w:16,h:26}))grantInt(TT.id);
  nearCP=!!CP&&P.onG&&P.kneel<=0&&Math.abs(P.x+5-CP.x)<22;
  if(nearCP&&ht('KeyE','ArrowDown')){
    P.kneel=70;P.hp=P.max;const gf=!prayed[cur]&&P.flMax<5;if(gf){prayed[cur]=1;P.flMax++}ach('devoto');if(P.flMax>=4)ach('fe');P.fl=P.flMax;P.pot=potMax();P.shd=shdMax();save={room:cur,x:CP.x-5,y:CP.y-P.h-.01};spawnAll();
    say(gf?'Progresso salvo. +1 frasco!':'Progresso salvo.',150);burst(CP.x,CP.y-12,18,'#e8c35a',1.6)}
  if(RL&&ov(P,{x:RL.x-8,y:RL.y-8,w:16,h:16})){flags.dash=meta.dash=true;persist();burst(RL.x,RL.y,24,'#e8c35a',2.4);RL=null;hs=8;say('Relíquia: Hábito do Peregrino — DASH (K)',300)}
  if(P.onG&&P.stn<=0&&tick%8===0&&tile(Math.floor((P.x+1)/T),Math.floor((P.y+P.h+2)/T))&&tile(Math.floor((P.x+P.w-1)/T),Math.floor((P.y+P.h+2)/T)))lastSafe={x:P.x,y:P.y};
  if(toast&&--toast.l<=0)toast=null;
  if(rn&&--rn.l<=0)rn=null;
  updParts();
}
function updParts(){for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.l--}parts=parts.filter(p=>p.l>0)}

/* ====== DESENHO ====== */
function txt(s,x,y,sz,c,a){g.font=(sz>=30?40:sz>=13?16:8)+'px "Press Start 2P",monospace';g.textAlign=a||'left';g.fillStyle='#000';g.fillText(s,x+1,y+1);g.fillStyle=c;g.fillText(s,x,y)}
function blit(c,cx,by,flip){const y=Math.round(by-c.height);
  if(flip){g.save();g.translate(Math.round(cx),0);g.scale(-1,1);g.drawImage(c,-Math.round(c.width/2),y);g.restore()}else g.drawImage(c,Math.round(cx-c.width/2),y)}
function drawPlayer(){
  if(P.shT>0)drawShield();else if(P.abs>0)drawShield('#cfe8ff');
  if(P.ch>6){const f=Math.min(1,P.ch/45),bx=Math.round(P.x+5-11),by=Math.round(P.y-9);g.fillStyle=K;g.fillRect(bx-1,by-1,24,6);g.fillStyle='#3a2a20';g.fillRect(bx,by,22,4);
    g.fillStyle=f>=1?(((tick>>2)&1)?'#fff1a8':'#e8c35a'):'#c0761f';g.fillRect(bx,by,Math.round(22*f),4);if(f>=1&&tick%5===0)burst(P.x+5,P.y+10,1,'#ffe27a',1)}
  if(P.inv>0&&(P.inv>>2)%2&&state==='play'&&P.dash<=0)return;
  if(spr('player',P.x,P.y,P.w,P.h,P.face<0))return;
  const f=P.face,fl=f<0,cx=P.x+5,by=P.y+P.h,k=P.kneel>0;
  if(P.dash>0)for(let i=1;i<4;i++){g.globalAlpha=.18;blit(A.body,cx-f*i*7,by-6,fl);blit(A.run1,cx-f*i*7,by,fl)}
  g.globalAlpha=1;
  const run=Math.abs(P.vx)>.5&&P.onG,legs=!P.onG?A.run1:run?((tick>>3)&1?A.run1:A.run2):A.stand;
  if(!k)blit(legs,cx,by,fl);
  blit(P.inv>64?A.bodyF:A.body,cx,by-(k?0:6),fl);
  const hy=P.y+(k?18:12);
  if(P.atk>0){
    const hv=P.heavy,a=-1.3+(((hv?26:20)-P.atk)/(hv?26:20))*2.4;
    for(let i=1;i<10;i++){g.fillStyle=i<2?'#d2a63a':'#e4e4ee';g.fillRect(Math.round(cx+f*(3+Math.cos(a)*i*2)),Math.round(hy+Math.sin(a)*i*2),2,2)}
    if(P.atk<=(hv?20:14)&&P.atk>=(hv?9:7))for(let r=hv?26:18;r<=(hv?38:24);r+=hv?4:3){g.fillStyle=r===(hv?30:21)?'rgba(255,240,200,.9)':'rgba(255,220,150,.45)';for(let t=-1.1;t<=1;t+=.1)g.fillRect(Math.round(cx+f*(2+Math.cos(t)*r)),Math.round(hy+1+Math.sin(t)*r),2,2)}
  }else{const sx=Math.round(cx-f*5)-1;g.fillStyle='#d2a63a';g.fillRect(sx,hy,2,2);g.fillStyle='#b9b9c6';g.fillRect(sx,hy+2,2,7)}
}
function drawEnemy(e){
  const d=DEF[e.k];
  if(spr(d.id,e.x,e.y,e.w,e.h,(e.k==='L'?(P.x<e.x?-1:1):e.dir)<0))return;
  const a=A[e.k],c=(e.fl>0||((e.k==='I'||e.k==='X')&&e.s===1&&((e.t>>2)&1)))?a.f:a.c;
  let ox=0,oy=0;
  if((e.k==='I'||e.k==='X'||DEF[e.k].boss)&&e.s===1)ox=Math.round(Math.sin(e.t*2));
  if(e.k==='L'||e.k==='Y')oy=Math.round(Math.sin(e.t/10)*2);
  blit(c,e.x+e.w/2+ox,e.y+e.h+oy,false);
  if(d.shield){
    if(e.s===1)for(let i=1;i<4;i++){g.globalAlpha=.2;blit(a.c,e.x+e.w/2-e.dir*i*8,e.y+e.h,false)}
    g.globalAlpha=1;
    if(e.s===3){const sx=Math.round(e.x+e.w/2+e.dir*17),sy=Math.round(e.y+4);g.fillStyle=K;g.fillRect(sx-5,sy-1,10,30);g.fillStyle='#e8c35a';g.fillRect(sx-4,sy,8,28);g.fillStyle='#fff1a8';g.fillRect(sx-4,sy,2,28);g.fillStyle='#8a6a1a';g.fillRect(sx+2,sy,2,28);g.fillStyle='#3f9a52';g.fillRect(sx-1,sy+6,2,14);g.fillRect(sx-3,sy+10,6,2)}
  }
  if(e.k==='P'&&e.t%260<100)txt('z',e.x+e.w,e.y-2-Math.round(Math.sin(e.t/10)*2),8,'#cdbb97');
}
function drawWorld(){
  g.drawImage(BG,0,0);
  if(CP){const x=Math.round(CP.x),y=CP.y,on=nearCP||P.kneel>0;blit(A.altar,x,y,false);
    for(const s of[-1,1]){g.fillStyle='#d8c9a0';g.fillRect(x+s*10-1,y-9,2,7);g.fillStyle=on?'#ffcf5a':'#c0761f';g.fillRect(x+s*10-1,y-12-(((tick>>3)+s)&1),2,3)}
    if(on){g.fillStyle='rgba(255,200,90,.1)';g.fillRect(x-14,y-30,28,30)}
    if(nearCP)txt('[E] Rezar',x,y-34,8,'#e8c35a','center')}
  if(RL){const x=RL.x,y=RL.y+Math.round(Math.sin(tick/14)*2);g.fillStyle='rgba(255,214,110,.1)';g.fillRect(x-14,y-14,28,28);g.fillStyle='rgba(255,214,110,.15)';g.fillRect(x-9,y-9,18,18);
    g.fillStyle='#e8c35a';g.fillRect(x-1,y-6,2,12);g.fillRect(x-4,y-3,8,2);g.fillStyle='#fff1a8';g.fillRect(x-1,y-6,1,12);g.fillRect(x-4,y-3,8,1)}
  {const d2=ROOMS[cur];if(d2.r==='end'&&(!d2.waves||lockOpen)){const a2=(tick>>4)&1;g.fillStyle='#e8c35a';g.fillRect(W-26-a2*2,203,14,2);g.fillRect(W-12-a2*2,199,2,10);g.fillRect(W-10-a2*2,201,2,6);g.fillRect(W-8-a2*2,203,2,2)}}
  if(TT)drawTotem(TT);
  for(const e of E)drawEnemy(e);
  drawPlayer();
  for(const q of gas){const al=Math.min(1,(q.life-q.t)/40,q.t/15);g.globalAlpha=.38*al;g.fillStyle='#6fbf3a';for(let i=0;i<7;i++){const ox=(i*37)%q.w,oy=(i*13+q.t*.3)%q.h;g.fillRect(Math.round(q.x+ox),Math.round(q.y+q.h-oy-8),10,8)}g.globalAlpha=1}
  for(const z of zones){const al=Math.min(1,(z.life-z.t)/30),R=z.sun?Math.round(z.r*Math.min(1,z.t/6)):z.r;g.globalAlpha=.16*al;g.fillStyle=z.col;
    for(let dy=-R;dy<=R;dy++){const hw=Math.floor(Math.sqrt(R*R-dy*dy));g.fillRect(Math.round(z.x-hw),Math.round(z.y+dy),hw*2,1)}
    g.globalAlpha=.7*al;for(let a=0;a<24;a++){const th=a/24*6.283+z.t*.05;g.fillRect(Math.round(z.x+Math.cos(th)*R),Math.round(z.y+Math.sin(th)*R),2,2)}g.globalAlpha=1}
  for(const q of spears){const x=Math.round(q.x),y=Math.round(q.y),d=q.vx>0?1:-1;g.fillStyle='#8a6a3a';g.fillRect(d>0?x-16:x,y,16,2);g.fillStyle='#e8e8f0';g.fillRect(d>0?x:x-6,y-1,6,4);g.fillStyle='#fff';g.fillRect(d>0?x+4:x-6,y,2,2)}
  for(const q of bolts){for(let yy=0;yy<q.y;yy+=6){g.fillStyle=(yy/6)%2?'#fff':'#9ad0ff';g.fillRect(Math.round(q.x)+((yy*7)%5)-2,yy,3,6)}}
  for(const q of eshots){g.fillStyle='#1a1d08';g.fillRect(Math.round(q.x)-3,Math.round(q.y)-3,6,6);g.fillStyle='#b5b23a';g.fillRect(Math.round(q.x)-2,Math.round(q.y)-2,4,4);g.fillStyle='#e8e86a';g.fillRect(Math.round(q.x)-1,Math.round(q.y)-2,2,2)}
  for(const q of shots){g.fillStyle='#7a4cff';g.fillRect(Math.round(q.x)-2,Math.round(q.y)-2,4,4);g.fillStyle='#d8c8ff';g.fillRect(Math.round(q.x)-1,Math.round(q.y)-1,2,2)}
  for(const p of parts){g.globalAlpha=Math.min(1,p.l/20);g.fillStyle=p.c;g.fillRect(Math.round(p.x),Math.round(p.y),2,2)}
  g.globalAlpha=1;
  g.fillStyle='rgba(190,150,150,.045)';
  for(let i=0;i<4;i++){const x=Math.round(((tick*.15+i*150)%(W+240))-120);for(let j=0;j<3;j++)g.fillRect(x+j*12,H-52-i*6+j*3,200-j*24,4)}
  g.drawImage(VG,0,0);
}
function hud(){
  drawSel();drawIntHud();
  {const dd=ROOMS[cur];if(dd.waves&&!lockOpen)txt('Onda '+(waveI+1)+'/'+dd.waves.length+' · inimigos '+E.length,W/2,16,8,'#e8c35a','center')}
  for(let i=0;i<P.max;i++)g.drawImage(i<P.hp?A.hf:A.he,6+i*10,6);
  for(let i=0;i<P.flMax;i++)g.drawImage(i<P.fl?A.ff:A.fe,6+i*8,18);
  txt('Lágrimas '+P.tears,W-10,16,10,'#d8c58a','right');
  if(flags.dash)txt('Dash',W-10,30,8,'#8d8d97','right');
  const bs=E.find(e=>DEF[e.k].boss);
  if(bs){g.fillStyle='#000';g.fillRect(140,244,200,7);g.fillStyle='#a3231f';g.fillRect(141,245,198*bs.hp/bs.mhp,5);txt(DEF[bs.k].n.toUpperCase(),W/2,240,9,'#e8c35a','center')}
  if(rn){g.globalAlpha=Math.min(1,rn.l/40);txt(rn.t,W/2,H-22,14,'#e6d8b0','center');g.globalAlpha=1}
  if(toast){g.globalAlpha=Math.min(1,toast.l/30);txt(toast.t,W/2,60,10,'#e8c35a','center');g.globalAlpha=1}
}
function draw0(){
  g.fillStyle='#000';g.fillRect(0,0,W,H);
  if(state==='title'){
    txt('CRUZADO',W/2,120,44,'#b5261f','center');
    txt('Os pecados tomaram forma.',W/2,148,12,'#cdbb97','center');
    if((tick>>5)%2===0||true)txt('Pressione ENTER',W/2,200,11,'#e8c35a','center');
    return}
  if(state==='diff'){drawDiff();return}
  if(state==='map'){drawMap();return}
  g.save();
  if(shake>0){g.translate((rnd(-shake,shake)/2)|0,(rnd(-shake,shake)/2)|0);shake*=.88;if(shake<.5)shake=0}
  drawWorld();g.restore();hud();if(ui===1)drawWheel();if(ui===2)drawInv();if(state==='clear')drawClear();
  if(state==='dead'){g.fillStyle='rgba(60,0,0,'+Math.min(.85,(170-deadT)/60)+')';g.fillRect(0,0,W,H);
    if(deadT<130)txt('VOCÊ SUCUMBIU AO PECADO',W/2,H/2,18,'#d8c58a','center')}
  if(paused)drawMap();
}
function draw(){draw0();if(fnd)drawFound();drawAch()}
mkVignette();
let last=performance.now(),acc=0;
function frame(t){
  acc+=Math.min(100,t-last);last=t;
  while(acc>=1000/60){step();for(const k in pr)delete pr[k];acc-=1000/60;if(state==='title'||state==='diff'||state==='map'||state==='clear')tick++}
  draw();requestAnimationFrame(frame)
}
requestAnimationFrame(frame);