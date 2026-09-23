
/* ==================================================================== audio */
var AC=null, masterGain=null, murmurGain=null;
function audioInit(){
  if(AC) return;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  masterGain=AC.createGain(); masterGain.gain.value=0.5; masterGain.connect(AC.destination);
  var len=AC.sampleRate*0.5, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
  for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
  window.__noise=buf;
  /* a low murmur of a campus with people on it, gain follows the nearby crowd */
  var ll=AC.sampleRate*4, mb=AC.createBuffer(1,ll,AC.sampleRate), md=mb.getChannelData(0);
  var v=0;
  for(i=0;i<ll;i++){ v=v*0.985+(Math.random()*2-1)*0.05; md[i]=v; }
  var src=AC.createBufferSource(); src.buffer=mb; src.loop=true;
  var lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=620;
  var bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=430; bp.Q.value=0.6;
  murmurGain=AC.createGain(); murmurGain.gain.value=0;
  src.connect(lp); lp.connect(bp); bp.connect(murmurGain); murmurGain.connect(masterGain);
  src.start(0);
}
function ping(freq,vol,dur,type){
  if(!AC) return;
  var t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'triangle'; o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(masterGain); o.start(t); o.stop(t+dur+0.02);
}
function stepSound(){
  if(!AC) return;
  var t=AC.currentTime, s=AC.createBufferSource(); s.buffer=window.__noise;
  var f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520;
  var g=AC.createGain(); g.gain.setValueAtTime(0.075,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
  s.connect(f); f.connect(g); g.connect(masterGain); s.start(t); s.stop(t+0.1);
}

/* =================================================================== player */
var P={ x:-3, y:0, z:17, vx:0, vy:0, vz:0, yaw:0, pitch:-0.02,
        onGround:true, crouch:false, sprint:false, fly:false, bob:0, stepAcc:0 };
var EYE=1.70, EYE_C=1.10, RAD=0.42, STEP=0.55, GRAV=26.5, JUMP=8.0;
var keys={};
var MOUSE_SENS=0.0022, ARROW_LOOK=1.85, lookMode='free', locked=false;

/* ======================================================== building nameplates */
var SIGNS=[];
(function(){
  if(!LABELS.length) return;
  var COLW=1024, ROWH=52, COLS=2, ROWS=Math.ceil(LABELS.length/COLS);
  var H=Math.min(4096, ROWS*ROWH);
  var cv=document.createElement('canvas'); cv.width=COLW*COLS; cv.height=H;
  var g=cv.getContext('2d');
  g.clearRect(0,0,cv.width,cv.height);
  g.textBaseline='middle';
  var used=[];
  for(var i=0;i<LABELS.length;i++){
    var col=i%COLS, row=(i/COLS)|0;
    if((row+1)*ROWH>H) break;
    var ox=col*COLW, oy=row*ROWH;
    var txt=LABELS[i].name, fs=30, tw;
    for(;;){
      g.font='700 '+fs+'px "Chakra Petch","Segoe UI",Roboto,system-ui,sans-serif';
      tw=g.measureText(txt).width;
      if(tw<=COLW-46||fs<=21) break;
      fs-=1;
    }
    while(tw>COLW-46&&txt.length>6){
      txt=txt.slice(0,-2);
      tw=g.measureText(txt+'.').width;
      if(tw<=COLW-46){ txt=txt+'.'; break; }
    }
    var pw=Math.min(COLW-8, tw+34), ph=40, py=oy+(ROWH-ph)/2;
    g.fillStyle='rgba(14,17,24,0.80)';
    g.beginPath();
    if(g.roundRect) g.roundRect(ox+2,py,pw,ph,7); else g.rect(ox+2,py,pw,ph);
    g.fill();
    g.fillStyle='#FFC72C'; g.fillRect(ox+2,py,4.5,ph);
    g.fillStyle='#ffffff';
    g.fillText(txt, ox+18, py+ph/2+1);
    used.push({w:pw+6, col:col, row:row});
  }
  var atlas=new T.CanvasTexture(cv);
  atlas.minFilter=T.LinearFilter; atlas.magFilter=T.LinearFilter;
  atlas.generateMipmaps=false;
  for(i=0;i<used.length;i++){
    var u=used[i], tex=atlas.clone(); tex.needsUpdate=true;
    tex.repeat.set(u.w/cv.width, ROWH/H);
    tex.offset.set(u.col*COLW/cv.width, 1-(u.row+1)*ROWH/H);
    var m=new T.SpriteMaterial({map:tex,transparent:true,opacity:0,depthWrite:false,depthTest:false,fog:false});
    var sp=new T.Sprite(m);
    var hh=3.1, ww=hh*(u.w/ROWH);
    sp.userData.bw=ww; sp.userData.bh=hh;
    sp.scale.set(ww,hh,1);
    sp.position.set(LABELS[i].x, LABELS[i].y+10.5, LABELS[i].z);
    sp.renderOrder=20;
    scene.add(sp);
    SIGNS.push({sp:sp,m:m,x:LABELS[i].x,z:LABELS[i].z});
  }
})();

var _signSort=[], _signTick=99;
function updateSigns(dt){
  /* only the nearest handful in front of you, so the sky stays uncluttered */
  _signTick+=dt||0;
  if(_signTick>0.3){
    _signTick=0;
    var fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw);
    _signSort.length=0;
    for(var i=0;i<SIGNS.length;i++){
      var s=SIGNS[i];
      var dx=s.x-P.x, dz=s.z-P.z, d=Math.hypot(dx,dz);
      if(d>230){ s.want=0; continue; }
      var dot=d<1?1:(dx/d*fx+dz/d*fz);
      if(dot<-0.15){ s.want=0; continue; }
      s.d=d; s.want=1; _signSort.push(s);
    }
    _signSort.sort(function(a,b){ return a.d-b.d; });
    for(i=0;i<_signSort.length;i++) if(i>=15) _signSort[i].want=0;
  }
  for(var j=0;j<SIGNS.length;j++){
    var g=SIGNS[j], sp=g.sp;
    var dd=Math.hypot(g.x-P.x,g.z-P.z);
    var o=g.want?1:0;
    if(o&&dd>170) o=(230-dd)/60;
    if(o&&dd<12) o*=Math.max(0,(dd-4)/8);
    var cur=g.m.opacity;
    g.m.opacity = cur + (o-cur)*Math.min(1,(dt||0.016)*6);
    sp.visible=g.m.opacity>0.015;
    if(!sp.visible) continue;
    var k=Math.max(0.62,Math.min(2.4,dd/58));
    sp.scale.set(sp.userData.bw*k, sp.userData.bh*k, 1);
  }
}
