
/* ============================================================ landmark list */
var SPOTS=[];
(function(){
  var want=['Tommy Trojan','Bovard Administration','Doheny Memorial Library','Alumni Park',
            'Mudd Hall','McCarthy Quad','Student Union','Tutor Campus Center',
            'Dr. Joseph Medicine Crow Center','Leavey Library','Physical Education Building',
            'Heritage Hall','Widney Alumni House','Town and Gown','Hancock Foundation',
            'Annenberg School','School of Cinematic Arts','Galen Center',
            'Los Angeles Memorial Coliseum','McCarthy Honors Residential College',
            'Fertitta Hall','Popovich Hall','Watt Hall','Harris Hall','Zumberge Hall',
            'Taper Hall','Waite Phillips Hall','Seeley G. Mudd','Tutor Hall',
            'Exposition Park Rose Garden','Natural History Museum','California Science Center'];
  for(var i=0;i<want.length;i++){
    for(var j=0;j<NAMED_PLACES.length;j++){
      var p=NAMED_PLACES[j];
      if(p.name.indexOf(want[i])>-1){
        var dup=false;
        for(var k=0;k<SPOTS.length;k++) if(SPOTS[k].name===p.name) dup=true;
        if(!dup) SPOTS.push(p);
        break;
      }
    }
  }
  if(!SPOTS.length) SPOTS.push({name:'Campus',x:0,z:14});
})();
var spotIdx=0;

function clearSpot(x,z,clearance){
  var l=nearby(x,z,clearance+2);
  for(var i=0;i<l.length;i++){
    var C=l[i]; if(C.h<=1.2) continue;
    for(var oa=0;oa<8;oa++){
      var ox=x+Math.cos(oa*0.785)*clearance, oz=z+Math.sin(oa*0.785)*clearance;
      if(inRing(C.ring,ox,oz)) return false;
    }
    if(inRing(C.ring,x,z)) return false;
  }
  return true;
}
function losClear(x,z,s){
  var dx=s.x-x, dz=s.z-z, D=Math.hypot(dx,dz);
  var stop=Math.max(0,D-(s.rad||8)-3);
  if(stop<4) return true;
  dx/=D; dz/=D;
  for(var t=5;t<stop;t+=4.5){
    var px=x+dx*t, pz=z+dz*t, l=nearby(px,pz,1);
    for(var i=0;i<l.length;i++){
      var C=l[i]; if(C.h<4) continue;
      if(px<C.x0||px>C.x1||pz<C.z0||pz>C.z1) continue;
      if(inRing(C.ring,px,pz)) return false;
    }
  }
  return true;
}
function teleport(){
  spotIdx=(spotIdx+1)%SPOTS.length;
  var s=SPOTS[spotIdx];
  if(s.spot){
    P.x=s.spot.x; P.z=s.spot.z; P.y=groundAt(P.x,P.z,3)+0.02; P.vx=P.vy=P.vz=0; P.onGround=true; P.fly=false;
    var lk=s.spot.look, ldx=lk[0]-P.x, ldz=lk[2]-P.z;
    P.yaw=Math.atan2(-ldx,-ldz); P.pitch=Math.atan2(lk[1]-1.7,Math.hypot(ldx,ldz))*0.8;
    pendingPitch=0; pendingYaw=0; feed('&#9873; '+s.name.toUpperCase()); return;
  }
  var standoff=Math.max(26,Math.min(82,Math.max((s.h||10)*1.75,(s.rad||10)*1.35)));
  var a0=Math.atan2(P.z-s.z,P.x-s.x), cands=[];
  for(var k=0;k<24;k++){
    var a=a0+(k===0?0:(k%2?1:-1)*Math.ceil(k/2)*0.28);
    var hit=-1;
    for(var d=(s.rad||6)*0.5;d<420;d+=5){
      var x=s.x+Math.cos(a)*d, z=s.z+Math.sin(a)*d;
      if(clearSpot(x,z,2.6)){ hit=d; break; }
    }
    if(hit<0) continue;
    for(var d2=hit+6;d2<hit+standoff+34;d2+=6){
      var x2=s.x+Math.cos(a)*d2, z2=s.z+Math.sin(a)*d2;
      if(!clearSpot(x2,z2,3.2)) continue;
      if(!losClear(x2,z2,s)) continue;
      var sc=Math.min(d2,standoff+18)*0.5;
      if(clearSpot(x2,z2,7)) sc+=14;
      if(clearSpot(x2,z2,13)) sc+=12;
      sc-=Math.abs(d2-standoff)*0.30;
      cands.push({x:x2,z:z2,s:sc});
    }
  }
  var best=null;
  for(var i=0;i<cands.length;i++) if(!best||cands[i].s>best.s) best=cands[i];
  if(!best) best={x:s.x+Math.cos(a0)*((s.rad||10)+36), z:s.z+Math.sin(a0)*((s.rad||10)+36)};
  P.x=best.x; P.z=best.z;
  P.y=groundAt(P.x,P.z,3)+0.02; P.vx=P.vy=P.vz=0; P.onGround=true; P.fly=false;
  P.yaw=Math.atan2(-(s.x-P.x),-(s.z-P.z));
  var dh=Math.hypot(s.x-P.x,s.z-P.z);
  P.pitch=Math.max(-0.04,Math.min(0.26,Math.atan2((s.h||10)*0.5-1.7,dh)));
  pendingPitch=0; pendingYaw=0;
  feed('&#9873; '+s.name.toUpperCase());
}

/* ==================================================================== HUD */
var elPlace=document.getElementById('place'), elPlaceN=document.getElementById('placeName'),
    elNext=document.getElementById('nextName'), hudEl=document.getElementById('hud');
var curPlace='';
function updatePlace(){
  var best=null, bs=-1;
  var fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw);
  for(var i=0;i<NAMED_PLACES.length;i++){
    var p=NAMED_PLACES[i];
    var dx=p.x-P.x, dz=p.z-P.z, d=Math.hypot(dx,dz);
    if(d>115) continue;
    var dot=d<1?1:(dx/d*fx+dz/d*fz);
    if(dot<0.15&&d>26) continue;
    var s=(dot*0.7+0.3)*(1-d/130)*(p.campus?1.12:1);
    if(s>bs){ bs=s; best=p; }
  }
  var nm=best?best.name:'';
  if(nm!==curPlace){
    curPlace=nm;
    if(nm){ elPlaceN.textContent=nm; elPlace.classList.add('on'); }
    else elPlace.classList.remove('on');
  }
  if(SPOTS.length) elNext.textContent=SPOTS[(spotIdx+1)%SPOTS.length].name;
}

/* =================================================================== loop */
var clock=new T.Clock();
var started=false, paused=false;
var eyeCur=EYE, rollCur=0, fovCur=BASE_FOV;
var hudTick=0, mapTick=0;

function update(dt){
  /* ---- looking: mouse if they want it, arrow keys if they do not ---- */
  P.yaw+=pendingYaw; P.pitch+=pendingPitch; pendingYaw=pendingPitch=0;
  var lk=(keys.ShiftLeft||keys.ShiftRight)?ARROW_LOOK*1.7:ARROW_LOOK;
  if(keys.ArrowLeft)  P.yaw+=lk*dt;
  if(keys.ArrowRight) P.yaw-=lk*dt;
  if(keys.ArrowUp)    P.pitch+=lk*0.62*dt;
  if(keys.ArrowDown)  P.pitch-=lk*0.62*dt;
  P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch));

  var f=(keys.KeyW?1:0)-(keys.KeyS?1:0), st=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  var fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw), rx=Math.cos(P.yaw), rz=-Math.sin(P.yaw);
  var wx=fx*f+rx*st, wz=fz*f+rz*st, wl=Math.hypot(wx,wz);
  if(wl>0){ wx/=wl; wz/=wl; }
  P.crouch=!!(keys.ControlLeft||keys.ControlRight||keys.KeyC);
  P.sprint=!!(keys.ShiftLeft||keys.ShiftRight)&&f>0&&!P.crouch;
  var spd=P.crouch?3.0:(P.sprint?9.6:5.4);
  if(P.fly) spd=P.sprint?52:20;

  if(P.fly){
    var pf=Math.cos(P.pitch), py=Math.sin(P.pitch);
    var dx=(fx*pf)*f+rx*st, dz=(fz*pf)*f+rz*st, dy=py*f;
    P.x+=dx*spd*dt; P.z+=dz*spd*dt;
    P.y+=(dy*spd+((keys.Space?1:0)-(P.crouch?1:0))*spd*0.8)*dt;
    if(P.y<0.4) P.y=0.4;
    P.vx=P.vz=P.vy=0; P.onGround=false;
  } else {
    var tx=wx*spd, tz=wz*spd, acc=Math.min(1,(P.onGround?16:3.2)*dt);
    P.vx+=(tx-P.vx)*acc; P.vz+=(tz-P.vz)*acc;
    if(keys.Space&&P.onGround){ P.vy=JUMP; P.onGround=false; }
    P.vy-=GRAV*dt; if(P.vy<-70) P.vy=-70;
    P.x+=P.vx*dt; P.z+=P.vz*dt;
    var bx=P.x, bz=P.z;
    resolve(P, RAD, P.y+(P.onGround?STEP:0.06));
    if(Math.abs(P.x-bx)>0.0001||Math.abs(P.z-bz)>0.0001){ P.vx*=0.72; P.vz*=0.72; }
    P.y+=P.vy*dt;
    var g=groundAt(P.x,P.z,P.y+(P.onGround?STEP:0.08));
    if(P.y<=g+0.02&&P.vy<=0.01){ P.y=g; P.vy=0; P.onGround=true; }
    else P.onGround=false;
    if(P.y<-60){ P.x=-3;P.z=17;P.y=0;P.vy=0; }
  }
  var lim=1180;
  P.x=Math.max(-lim,Math.min(lim,P.x)); P.z=Math.max(-lim,Math.min(lim,P.z));

  var hs=Math.hypot(P.vx,P.vz);
  if(P.onGround&&hs>0.6){
    P.bob+=dt*hs*1.5; P.stepAcc+=hs*dt;
    if(P.stepAcc>2.2){ P.stepAcc=0; stepSound(); }
  } else P.bob+=dt*0.6;
  var bobAmt=P.onGround?Math.min(1,hs/9)*0.8:0;
  eyeCur+=((P.crouch?EYE_C:EYE)-eyeCur)*Math.min(1,12*dt);
  rollCur+=((Math.sin(P.bob*0.5)*0.009*bobAmt)-rollCur)*Math.min(1,10*dt);

  camera.position.set(P.x, P.y+eyeCur+Math.sin(P.bob)*0.045*bobAmt, P.z);
  camera.rotation.set(P.pitch,P.yaw,rollCur,'YXZ');
  var fovT=BASE_FOV+(P.sprint&&hs>7?4:0);
  fovCur+=(fovT-fovCur)*Math.min(1,9*dt);
  if(Math.abs(camera.fov-fovCur)>0.01){ camera.fov=fovCur; camera.updateProjectionMatrix(); }

  updateCrowd(dt);
  updateSigns(dt);
  placeSun(P.x-SUN_DIR.x*0+(-Math.sin(P.yaw))*45, P.z+(-Math.cos(P.yaw))*45);
  if(COL_FLAMES.length){ var ft=clock.elapsedTime;
    for(var fi=0;fi<COL_FLAMES.length;fi++){ var fl=COL_FLAMES[fi], ph=fl.userData.ph;
      fl.scale.set(1+0.08*Math.sin(ft*7.3+ph),1+0.22*Math.sin(ft*9.1+ph*2.3)+0.1*Math.sin(ft*23+ph),1+0.08*Math.cos(ft*6.1+ph));
      fl.rotation.y=ft*0.6+ph; } }

  mapTick+=dt; if(mapTick>0.05){ mapTick=0; drawMap(); updatePlace(); }
}

/* keep it smooth on a modest laptop: drop resolution before dropping the campus */
var qPR=Math.min(devicePixelRatio||1,2), qAcc=0, qFrames=0, qStep=0;
function quality(dt){
  if(!started||paused||qStep>=2) return;
  qAcc+=dt; qFrames++;
  if(qAcc<3) return;
  var fps=qFrames/qAcc; qAcc=0; qFrames=0;
  if(fps<30){
    qStep++; qPR=qStep===1?1:0.75;
    if(qStep===1){ sun.shadow.mapSize.set(1024,1024); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
    if(qStep===2){ sun.castShadow=false; }
    renderer.setPixelRatio(qPR); renderer.setSize(innerWidth,innerHeight);
  } else qStep=2;
}
function frame(){
  requestAnimationFrame(frame);
  var dt=Math.min(0.06,clock.getDelta());
  if(started&&!paused) update(dt);
  renderer.render(scene,camera);
  quality(dt);
}

/* ============================================================= start/pause */
var startEl=document.getElementById('start'), pauseEl=document.getElementById('pausewrap');
function begin(){
  audioInit(); if(AC&&AC.state==='suspended') AC.resume();
  started=true; paused=false;
  startEl.classList.add('off'); pauseEl.classList.add('off'); hudEl.classList.remove('hide');
  if(el.requestPointerLock){
    lookMode='pointer';
    try{ el.requestPointerLock(); }catch(e){ lookMode='free'; }
    setTimeout(function(){ if(document.pointerLockElement!==el) lookMode='free'; },420);
  } else lookMode='free';
  clock.getDelta();
}
function pause(){
  if(!started||paused) return;
  paused=true; keys={};
  pauseEl.classList.remove('off');
  if(document.exitPointerLock&&document.pointerLockElement) document.exitPointerLock();
}
function unpause(){
  paused=false; pauseEl.classList.add('off'); clock.getDelta();
  if(lookMode==='pointer'&&el.requestPointerLock){ try{ el.requestPointerLock(); }catch(e){} }
}
document.getElementById('play').addEventListener('click',begin);
document.getElementById('resume').addEventListener('click',unpause);
addEventListener('keydown',function(e){
  if(e.code!=='Escape'||!started) return;
  if(paused) unpause(); else pause();
});
addEventListener('resize',function(){
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(qPR); renderer.setSize(innerWidth,innerHeight);
});

/* who casts and who catches shadows */
scene.traverse(function(o){
  if(!o.isMesh) return;
  var m=o.material; if(Array.isArray(m)) return;
  if(m===matWorld){ o.castShadow=true; o.receiveShadow=true; }
  else if(m===matGround){ o.receiveShadow=true; }
  else if(o.isInstancedMesh && !m.transparent && !o.userData.noShadow){ o.castShadow=true; }
  else if(GROUND_MESHES.indexOf(o)>=0){ o.receiveShadow=true; }
});
/* --------------------------------------------------------------- boot ---- */
document.getElementById('bcount').textContent=CAMPUS.length.toLocaleString();
document.getElementById('ccount').textContent=BUILDINGS.length.toLocaleString();
document.getElementById('scount').textContent=CROWD_N.toLocaleString();
(function(){
  var bar=document.querySelector('#loadbar i'), txt=document.getElementById('loadtxt'),
      btn=document.getElementById('play'), n=0;
  var steps=['EXTRUDING '+(CAMPUS.length+BUILDINGS.length)+' BUILDINGS',
             'PLANTING PALMS AND LIGHTING WALKWAYS',
             'BRINGING '+CROWD_N+' STUDENTS TO CLASS','READY'];
  var iv=setInterval(function(){
    n++; bar.style.width=Math.min(100,n*25)+'%'; txt.textContent=steps[Math.min(3,n-1)];
    if(n>=4){ clearInterval(iv); btn.disabled=false; btn.textContent='START WALKING'; }
  },170);
})();
P.y=groundAt(P.x,P.z,2);
camera.position.set(P.x,P.y+EYE,P.z);
frame();

})();
