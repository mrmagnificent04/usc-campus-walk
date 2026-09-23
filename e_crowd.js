
/* =====================================================================
   Students. Stumble Guys proportions, but a real mix of people: skin
   tones, shirts, trousers, hair and caps, and backpacks. Built as a set
   of baked variants so every combination is one instanced draw call.
   ===================================================================== */
var CROWD_N=1000, VARIANTS=24;
var STU=[], VAR=[], GNODE=[], GADJ=[];

function GeoBag(){ this.p=[]; this.n=[]; this.c=[]; }
GeoBag.prototype.add=function(geo,mat,hex){
  var pos=geo.attributes.position, nor=geo.attributes.normal, idx=geo.index;
  var nm=new T.Matrix3().getNormalMatrix(mat), v=new T.Vector3(), col=new T.Color(hex);
  var order=[],i;
  if(idx){ for(i=0;i<idx.count;i++) order.push(idx.getX(i)); }
  else { for(i=0;i<pos.count;i++) order.push(i); }
  for(var k=0;k<order.length;k++){
    var j=order[k];
    v.fromBufferAttribute(pos,j).applyMatrix4(mat); this.p.push(v.x,v.y,v.z);
    v.fromBufferAttribute(nor,j).applyMatrix3(nm).normalize(); this.n.push(v.x,v.y,v.z);
    this.c.push(col.r,col.g,col.b);
  }
};
GeoBag.prototype.geom=function(){
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));
  g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));
  g.computeBoundingSphere();
  return g;
};

(function initCrowd(){
  /* ---------- walkway graph from the real footway network ---------- */
  var map={}, X0=-660, X1=720, Z0=-720, Z1=580;
  function nodeId(x,z){
    if(x<X0||x>X1||z<Z0||z>Z1) return -1;
    var k=Math.round(x/2)+'_'+Math.round(z/2);
    if(map[k]!==undefined) return map[k];
    var id=GNODE.length; GNODE.push([x,z]); GADJ.push([]); map[k]=id; return id;
  }
  for(var i=0;i<PATHS.length;i++){
    var pts=PATHS[i].pts;
    if(PATHS[i].w<1.8) continue;
    for(var j=0;j<pts.length-1;j++){
      var a=nodeId(pts[j][0],pts[j][1]), b=nodeId(pts[j+1][0],pts[j+1][1]);
      if(a<0||b<0||a===b) continue;
      var L=Math.hypot(GNODE[b][0]-GNODE[a][0],GNODE[b][1]-GNODE[a][1]);
      if(L<0.6||L>90) continue;
      if(GADJ[a].indexOf(b)<0) GADJ[a].push(b);
      if(GADJ[b].indexOf(a)<0) GADJ[b].push(a);
    }
  }
  var walkable=[];
  for(i=0;i<GNODE.length;i++) if(GADJ[i].length) walkable.push(i);
  if(!walkable.length) return;

  /* ---------- palettes ---------- */
  var SKIN=[0xF7DCC2,0xF0C6A0,0xE3AC82,0xCE9163,0xB27548,0x915934,0x714128,0x54301D];
  var SHIRT=[0x9E1B1B,0xFFC72C,0xF2F2F0,0x2C3E63,0x5A6069,0x2E8B87,0x6B7A3A,0xD98CA6,
             0x6A4C93,0x24262B,0xE07A3A,0x8FB8DE,0x3F7D45,0x7A2E3A,0xE8D9B5,0x4A4E8C];
  var PANT=[0x3D5A80,0x24262B,0xBFAE8C,0x6E7378,0x4A5240,0x2C3145,0xEFEFEA,0x5C3B33];
  var HAIR=[0x1B1512,0x2E1F14,0x4A2F1B,0x6E4A22,0xB08A48,0x8A3D22,0x9A9A96];
  var CAPC=[0x9E1B1B,0xFFC72C,0x2C3E63,0x24262B,0xF2F2F0,0x3F7D45];
  var PACK=[0x24262B,0x2C3E63,0x8E1D1D,0x555A61,0x4A5240,0x5B4173,0x2E7268,0xA8562B];
  var SHOE=[0xEFEFEA,0x24262B,0xC9C6BE,0x8E1D1D,0x2C3E63];
  var EYE=0x1B1B20;

  var m4=new T.Matrix4(), qq=new T.Quaternion(), sv=new T.Vector3(), pv=new T.Vector3();
  function MT(x,y,z,rx,sx,sy,sz){
    qq.setFromEuler(new T.Euler(rx||0,0,0));
    return m4.compose(pv.set(x,y,z), qq,
      sv.set(sx===undefined?1:sx, sy===undefined?1:sy, sz===undefined?1:sz)).clone();
  }
  var mat=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});

  function buildVariant(v){
    var skin=SKIN[v.s], shirt=SHIRT[v.t], pant=PANT[v.p], shoe=SHOE[v.sh];
    /* head: skin ball, two eyes, and hair or a cap on top */
    var head=new GeoBag();
    head.add(new T.IcosahedronGeometry(0.37,0), MT(0,0.37,0,0,1.0,1.03,0.95), skin);
    head.add(new T.BoxGeometry(0.085,0.125,0.06), MT(-0.145,0.365,-0.315), EYE);
    head.add(new T.BoxGeometry(0.085,0.125,0.06), MT( 0.145,0.365,-0.315), EYE);
    if(v.hat===0){                                   /* hair */
      head.add(new T.IcosahedronGeometry(0.385,0), MT(0,0.415,0.045,0,1.0,0.86,0.98), HAIR[v.hc]);
    } else if(v.hat===1){                            /* baseball cap */
      head.add(new T.CylinderGeometry(0.255,0.400,0.24,7), MT(0,0.615,0.01), CAPC[v.hc]);
      head.add(new T.BoxGeometry(0.33,0.06,0.24), MT(0,0.512,-0.30), CAPC[v.hc]);
    } else {                                         /* beanie */
      head.add(new T.CylinderGeometry(0.30,0.40,0.30,7), MT(0,0.60,0.01), CAPC[v.hc]);
      head.add(new T.IcosahedronGeometry(0.075,0), MT(0,0.78,0.01), CAPC[v.hc]);
    }
    /* torso: shirt, a strip of neck, and usually a backpack */
    var body=new GeoBag();
    body.add(new T.CylinderGeometry(0.300,0.360,0.42,8), MT(0,0.21,0), shirt);
    if(v.pk>=0){
      var pc=PACK[v.pk];
      body.add(new T.BoxGeometry(0.40,0.46,0.24), MT(0,0.27,0.335), pc);
      body.add(new T.BoxGeometry(0.44,0.09,0.62), MT(0,0.40,0.06), pc);
    }
    var arm=new GeoBag();
    arm.add(new T.CylinderGeometry(0.082,0.072,0.29,5), MT(0,-0.145,0), v.sleeve?shirt:skin);
    var leg=new GeoBag();
    leg.add(new T.CylinderGeometry(0.105,0.098,0.26,5), MT(0,-0.13,0), pant);
    leg.add(new T.BoxGeometry(0.195,0.115,0.25), MT(0,-0.305,-0.03), shoe);
    return {head:head.geom(), body:body.geom(), arm:arm.geom(), leg:leg.geom()};
  }

  /* spread skin tones evenly across the variants, randomise everything else */
  var defs=[];
  for(var v=0;v<VARIANTS;v++){
    defs.push({ s:v%SKIN.length,
                t:(rnd()*SHIRT.length)|0,
                p:(rnd()*PANT.length)|0,
                sh:(rnd()*SHOE.length)|0,
                hat:(rnd()<0.55?0:(rnd()<0.78?1:2)),
                hc:0, pk:(rnd()<0.74?((rnd()*PACK.length)|0):-1),
                sleeve:rnd()<0.42 });
    defs[v].hc = defs[v].hat===0 ? (rnd()*HAIR.length)|0 : (rnd()*CAPC.length)|0;
  }

  /* how many students land in each variant */
  var core=[], outer=[];
  for(i=0;i<walkable.length;i++){
    var n=GNODE[walkable[i]];
    (Math.hypot(n[0],n[1])<430 ? core : outer).push(walkable[i]);
  }
  if(!core.length) core=walkable;
  if(!outer.length) outer=walkable;
  function neighbour(n,avoid){
    var l=GADJ[n];
    if(l.length===1) return l[0];
    for(var t=0;t<8;t++){ var c=l[(rnd()*l.length)|0]; if(c!==avoid) return c; }
    return l[0];
  }
  var counts=new Array(VARIANTS); for(i=0;i<VARIANTS;i++) counts[i]=0;
  var groupLeft=0, ga=0, gb=0, gsp=1.5;
  for(i=0;i<CROWD_N;i++){
    var a0,b0,sp;
    if(groupLeft>0){ groupLeft--; a0=ga; b0=gb; sp=gsp*rr(0.97,1.03); }
    else {
      var pool=(rnd()<0.85)?core:outer;
      a0=pool[(rnd()*pool.length)|0]; b0=neighbour(a0,-1); sp=rr(1.05,1.85);
      if(rnd()<0.34){ groupLeft=1+((rnd()*2)|0); ga=a0; gb=b0; gsp=sp; }
    }
    var vi=(rnd()*VARIANTS)|0;
    STU.push({a:a0,b:b0,t:rnd(),sp:sp,ph:rr(0,6.28),v:vi,slot:counts[vi]++,
              x:GNODE[a0][0],z:GNODE[a0][1],yaw:0,side:0,
              idle:rnd()<0.16?rr(1,9):0, scale:rr(1.00,1.18)});
  }

  /* build one instanced set per variant */
  var tint=new T.Color();
  for(v=0;v<VARIANTS;v++){
    var g=buildVariant(defs[v]), c=Math.max(1,counts[v]);
    function mk(geo){ var m=new T.InstancedMesh(geo,mat,c);
      m.frustumCulled=false; m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.raycast=function(){}; scene.add(m); return m; }
    VAR.push({head:mk(g.head), body:mk(g.body),
              armL:mk(g.arm), armR:mk(g.arm), legL:mk(g.leg), legR:mk(g.leg)});
  }
  for(i=0;i<STU.length;i++){
    var s=STU[i], V=VAR[s.v], b=rr(0.94,1.06);
    tint.setRGB(b,b*rr(0.995,1.005),b*rr(0.99,1.01));
    V.head.setColorAt(s.slot,tint); V.body.setColorAt(s.slot,tint);
    V.armL.setColorAt(s.slot,tint); V.armR.setColorAt(s.slot,tint);
    V.legL.setColorAt(s.slot,tint); V.legR.setColorAt(s.slot,tint);
  }
  for(v=0;v<VARIANTS;v++){
    var V2=VAR[v];
    ['head','body','armL','armR','legL','legR'].forEach(function(k){
      if(V2[k].instanceColor) V2[k].instanceColor.needsUpdate=true; });
  }
})();

var _rootM=new T.Matrix4(), _partM=new T.Matrix4(), _outM=new T.Matrix4(),
    _qq=new T.Quaternion(), _pp=new T.Vector3(), _ss=new T.Vector3(1,1,1), _ee=new T.Euler();
function part(root,x,y,z,rx){
  _ee.set(rx||0,0,0); _qq.setFromEuler(_ee); _ss.set(1,1,1);
  _partM.compose(_pp.set(x,y,z),_qq,_ss);
  return _outM.multiplyMatrices(root,_partM);
}

/* shove anyone standing where you just arrived, so they never block the view */
function nudgeCrowd(x,z,r){
  for(var i=0;i<STU.length;i++){
    var s=STU[i], dx=s.x-x, dz=s.z-z, d=Math.hypot(dx,dz);
    if(d>r) continue;
    s.t=Math.min(0.97,s.t+0.22);
    s.idle=0;
    var A=GNODE[s.a], B=GNODE[s.b];
    s.x=A[0]+(B[0]-A[0])*s.t; s.z=A[1]+(B[1]-A[1])*s.t;
  }
}
function updateCrowd(dt){
  if(!STU.length) return;
  var i,s;
  for(i=0;i<STU.length;i++){
    s=STU[i];
    var A=GNODE[s.a], B=GNODE[s.b];
    var dx=B[0]-A[0], dz=B[1]-A[1], L=Math.hypot(dx,dz)||1;
    if(s.idle>0){
      s.idle-=dt;
      s.x=A[0]+dx*s.t; s.z=A[1]+dz*s.t;
      s.yaw+=Math.sin(s.ph*0.5)*dt*0.35;
      s.ph+=dt*0.9;
      continue;
    }
    s.t+=s.sp*dt/L;
    while(s.t>=1){
      s.t-=1;
      var prev=s.a; s.a=s.b;
      var l=GADJ[s.a];
      if(!l.length){ s.b=s.a; }
      else if(l.length===1){ s.b=l[0]; }
      else { s.b=l[0];
        for(var k=0;k<8;k++){ var c=l[(rnd()*l.length)|0]; if(c!==prev){ s.b=c; break; } } }
      A=GNODE[s.a]; B=GNODE[s.b];
      dx=B[0]-A[0]; dz=B[1]-A[1]; L=Math.hypot(dx,dz)||1;
      if(rnd()<0.11){ s.idle=rr(3,11); break; }
    }
    s.x=A[0]+dx*s.t; s.z=A[1]+dz*s.t;
    s.yaw=Math.atan2(-dx/L,-dz/L);
    var px=s.x-P.x, pz=s.z-P.z, pd=Math.hypot(px,pz);
    s.side+=(((pd<2.2)?(pd<0.01?1:1.15*(1-pd/2.2)):0)-s.side)*Math.min(1,7*dt);
    if(s.side>0.01){
      var nx=-dz/L, nz=dx/L, sgn=(px*nx+pz*nz)>=0?1:-1;
      s.x+=nx*sgn*s.side; s.z+=nz*sgn*s.side;
    }
    s.ph+=dt*s.sp*3.6;
  }

  for(i=0;i<STU.length;i++){
    s=STU[i];
    var V=VAR[s.v], amp=(s.idle>0)?0.16:1;
    var swing=Math.sin(s.ph)*amp, bob=Math.abs(Math.cos(s.ph))*0.035*amp;
    _ee.set(0,s.yaw,0); _qq.setFromEuler(_ee); _ss.set(s.scale,s.scale,s.scale);
    _rootM.compose(_pp.set(s.x,0.02+bob*s.scale,s.z),_qq,_ss);
    V.body.setMatrixAt(s.slot, part(_rootM,0,0.34,0,swing*0.045));
    V.head.setMatrixAt(s.slot, part(_rootM,0,0.735,0,swing*0.035));
    V.armL.setMatrixAt(s.slot, part(_rootM,-0.295,0.74,0,-swing*0.62));
    V.armR.setMatrixAt(s.slot, part(_rootM, 0.295,0.74,0, swing*0.62));
    V.legL.setMatrixAt(s.slot, part(_rootM,-0.125,0.36,0, swing*0.80));
    V.legR.setMatrixAt(s.slot, part(_rootM, 0.125,0.36,0,-swing*0.80));
  }
  for(i=0;i<VAR.length;i++){
    var W=VAR[i];
    W.head.instanceMatrix.needsUpdate=true; W.body.instanceMatrix.needsUpdate=true;
    W.armL.instanceMatrix.needsUpdate=true; W.armR.instanceMatrix.needsUpdate=true;
    W.legL.instanceMatrix.needsUpdate=true; W.legR.instanceMatrix.needsUpdate=true;
  }
  /* the murmur of a populated campus */
  if(murmurGain){
    var near=0;
    for(i=0;i<STU.length;i+=3){
      var d2=(STU[i].x-P.x)*(STU[i].x-P.x)+(STU[i].z-P.z)*(STU[i].z-P.z);
      if(d2<3600) near++;
    }
    var want=Math.min(0.10, near*0.0042);
    murmurGain.gain.value += (want-murmurGain.gain.value)*Math.min(1,dt*1.5);
  }
}
