
/* ================================================================= minimap */
var MAPR=1100, MAPPX=2200, mapCan=document.createElement('canvas');
mapCan.width=mapCan.height=MAPPX;
(function(){
  var g=mapCan.getContext('2d'), k=MAPPX/(MAPR*2);
  function X(x){ return (x+MAPR)*k; } function Z(z){ return (z+MAPR)*k; }
  g.fillStyle='#2b2f38'; g.fillRect(0,0,MAPPX,MAPPX);
  function poly(ring,fill,stroke,lw){
    g.beginPath(); g.moveTo(X(ring[0][0]),Z(ring[0][1]));
    for(var i=1;i<ring.length;i++) g.lineTo(X(ring[i][0]),Z(ring[i][1]));
    g.closePath();
    if(fill){ g.fillStyle=fill; g.fill(); }
    if(stroke){ g.strokeStyle=stroke; g.lineWidth=lw||1; g.stroke(); }
  }
  for(var i=0;i<AREAS.length;i++) poly(AREAS[i].ring,'#33502f');
  for(i=0;i<PARKS.length;i++) poly(PARKS[i].ring,'#3a5c34');
  for(i=0;i<WATER.length;i++) poly(WATER[i],'#1f4f6e');
  function line(pts,col,w){
    g.beginPath(); g.moveTo(X(pts[0][0]),Z(pts[0][1]));
    for(var j=1;j<pts.length;j++) g.lineTo(X(pts[j][0]),Z(pts[j][1]));
    g.strokeStyle=col; g.lineWidth=Math.max(1,w*k); g.lineCap='round'; g.stroke();
  }
  for(i=0;i<ROADS.length;i++) line(ROADS[i].pts,'#4a4f5a',ROADS[i].w);
  for(i=0;i<PATHS.length;i++) line(PATHS[i].pts,'#6b7180',PATHS[i].w);
  for(i=0;i<STADIA.length;i++) poly(STADIA[i].ring,'#6b6152','#8a8070',2);
  for(i=0;i<BUILDINGS.length;i++) poly(BUILDINGS[i].ring,'#7f7a70','rgba(0,0,0,.4)',1);
  for(i=0;i<CAMPUS.length;i++) poly(CAMPUS[i].ring,'#b4604a','rgba(0,0,0,.45)',1);
})();
var mapEl=document.getElementById('map'), mapCtx=mapEl.getContext('2d');
var MAPVIEW=150, MAPSIZES=[95,150,240,380], mapIdx=1;

function drawMap(){
  var W=mapEl.width, k=MAPPX/(MAPR*2);
  var sx=(P.x+MAPR-MAPVIEW)*k, sy=(P.z+MAPR-MAPVIEW)*k, sw=MAPVIEW*2*k;
  mapCtx.fillStyle='#22262e'; mapCtx.fillRect(0,0,W,W);
  try{ mapCtx.drawImage(mapCan,sx,sy,sw,sw,0,0,W,W); }catch(e){}
  var s=W/(MAPVIEW*2);
  /* the landmark you would reach next */
  if(SPOTS.length){
    var t=SPOTS[spotIdx];
    var mx=(t.x-P.x)*s+W/2, my=(t.z-P.z)*s+W/2;
    if(mx>4&&my>4&&mx<W-4&&my<W-4){
      mapCtx.fillStyle='#FFC72C'; mapCtx.strokeStyle='#5a3f00'; mapCtx.lineWidth=2;
      mapCtx.beginPath(); mapCtx.arc(mx,my,6,0,6.283); mapCtx.fill(); mapCtx.stroke();
    }
  }
  mapCtx.save(); mapCtx.translate(W/2,W/2); mapCtx.rotate(-P.yaw);
  mapCtx.fillStyle='#fff'; mapCtx.strokeStyle='#8d0000'; mapCtx.lineWidth=3;
  mapCtx.beginPath(); mapCtx.moveTo(0,-13); mapCtx.lineTo(9,10); mapCtx.lineTo(0,5); mapCtx.lineTo(-9,10);
  mapCtx.closePath(); mapCtx.stroke(); mapCtx.fill(); mapCtx.restore();
}

/* ================================================================== input */
var el=renderer.domElement;
function onKey(e,down){
  var k=e.code;
  keys[k]=down;
  if(!down) return;
  if(k==='KeyF'&&started){ P.fly=!P.fly; P.vy=0; feed(P.fly?'FLYING &#183; press F to land':'BACK ON THE GROUND'); }
  if(k==='KeyM'&&started){ mapIdx=(mapIdx+1)%MAPSIZES.length; MAPVIEW=MAPSIZES[mapIdx]; }
  if(k==='KeyT'&&started) teleport();
  if(k==='KeyH'&&started){ hudEl.classList.toggle('bare'); }
  if(k==='Space'&&started) e.preventDefault();
  if((k.indexOf('Arrow')===0)&&started) e.preventDefault();
}
addEventListener('keydown',function(e){ onKey(e,true); },{passive:false});
addEventListener('keyup',function(e){ onKey(e,false); });
addEventListener('blur',function(){ keys={}; });

var pendingYaw=0, pendingPitch=0;
function look(dx,dy){
  if(!isFinite(dx)||!isFinite(dy)) return;
  if(dx>170)dx=170; if(dx<-170)dx=-170; if(dy>170)dy=170; if(dy<-170)dy=-170;
  pendingYaw-=dx*MOUSE_SENS; pendingPitch-=dy*MOUSE_SENS;
}
document.addEventListener('mousemove',function(e){
  if(!started||paused) return;
  if(lookMode==='pointer'){ if(locked) look(e.movementX||0,e.movementY||0); }
  else look(e.movementX||0,e.movementY||0);
});
el.addEventListener('contextmenu',function(e){ e.preventDefault(); });
document.addEventListener('pointerlockchange',function(){
  locked=(document.pointerLockElement===el);
  if(started&&!locked&&lookMode==='pointer') pause();
});
document.addEventListener('pointerlockerror',function(){ lookMode='free'; });

function feed(html){
  var f=document.getElementById('feed'), d=document.createElement('div');
  d.innerHTML=html; f.appendChild(d);
  while(f.children.length>3) f.removeChild(f.firstChild);
  setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); },4200);
}
