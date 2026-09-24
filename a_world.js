/* =======================================================================
   TROJAN STRIKE  -  USC University Park Campus, extruded from OpenStreetMap
   ======================================================================= */
(function(){
'use strict';
var T = window.THREE;

/* ---------------------------------------------------------------- data */
var SRC = document.getElementById('osmdata').textContent;
var SEC = {L:[],C:[],B:[],R:[],P:[],A:[],W:[],N:[],S:[],G:[]};
(function(){
  var cur=null, lines=SRC.split('\n');
  for(var i=0;i<lines.length;i++){
    var L=lines[i];
    if(L.charAt(0)==='#'&&L.charAt(1)==='#'){ cur=L.slice(2).trim(); if(!SEC[cur])SEC[cur]=[]; continue; }
    if(L.length&&cur) SEC[cur].push(L);
  }
})();
function decode(s){
  var px=0,pz=0,t=s.split(' '),o=new Array(t.length);
  for(var i=0;i<t.length;i++){ var c=t[i].indexOf(',');
    px+=+t[i].slice(0,c); pz+=+t[i].slice(c+1); o[i]=[px,pz]; }
  return o;
}
function ringArea(r){ var s=0,n=r.length;
  for(var i=0;i<n;i++){ var j=(i+1)%n; s+=r[i][0]*r[j][1]-r[j][0]*r[i][1]; } return s/2; }

var BUILDINGS=[], CAMPUS=[], LABELS=[], ROADS=[], PATHS=[], AREAS=[], WATER=[], POINTS=[], STADIA=[], PARKS=[];
var WALKG=null, WALKC=5;
for(var i=0;i<SEC.B.length;i++){
  var L=SEC.B[i], a=L.indexOf('|'), b=L.indexOf('|',a+1);
  var head=L.slice(0,a), ring=decode(L.slice(b+1));
  if(ringArea(ring)<0) ring.reverse();
  BUILDINGS.push({cls:head.charAt(0), h:parseFloat(head.slice(1))||8, name:L.slice(a+1,b), ring:ring});
}
for(i=0;i<(SEC.L||[]).length;i++){
  var lp=SEC.L[i].split('|'), lc=lp[1].split(',');
  LABELS.push({name:lp[0], x:+lc[0], z:+lc[1], y:+lc[2]});
}
for(i=0;i<(SEC.C||[]).length;i++){
  var q=SEC.C[i].split('|');
  var ring2=decode(q[3]);
  if(ringArea(ring2)<0) ring2.reverse();
  var tw=null;
  if(q[2]){ var tp=q[2].split(','); tw={dh:+tp[0], st:tp[1], w:+tp[2]}; }
  CAMPUS.push({st:q[0].charAt(0), h:parseFloat(q[0].slice(1))||10, name:q[1], tower:tw, ring:ring2});
}
for(i=0;i<SEC.R.length;i++){ var q=SEC.R[i].split('|'); ROADS.push({w:+q[0], pts:decode(q[1])}); }
for(i=0;i<SEC.P.length;i++){ q=SEC.P[i].split('|'); PATHS.push({w:+q[0], pts:decode(q[1])}); }
for(i=0;i<SEC.A.length;i++){ q=SEC.A[i].split('|'); AREAS.push({k:q[0], ring:decode(q[1])}); }
for(i=0;i<SEC.W.length;i++){ WATER.push(decode(SEC.W[i])); }
for(i=0;i<SEC.N.length;i++){ q=SEC.N[i].split('|'); var c=q[2].split(',');
  POINTS.push({k:q[0], name:q[1], x:+c[0], z:+c[1]}); }
for(i=0;i<(SEC.S||[]).length;i++){ q=SEC.S[i].split('|'); var rg=decode(q[1]);
  if(ringArea(rg)<0) rg.reverse(); STADIA.push({name:q[0], ring:rg}); }
for(i=0;i<(SEC.G||[]).length;i++){ q=SEC.G[i].split('|'); rg=decode(q[1]);
  if(ringArea(rg)<0) rg.reverse(); PARKS.push({name:q[0], ring:rg}); }

/* ------------------------------------------------ the Coliseum's shape
   An idealised stadium outline fitted to the OSM footprint: a superellipse
   bowl, squared off at the east end where the peristyle stands. The field
   is sunk below the street, the way the real one is, so the ground has a
   hole cut in it here and the walk system knows the floor is lower. */
var COL={cx:-231, cz:725, aO:160, bO:114, pO:2.6, aI:72, bI:38, pI:2.3, ixo:10,
         xp:-85, fld:-11.0, seg:168};
function _sEll(a,b,p,t){
  var c=Math.cos(t), s=Math.sin(t);
  return [a*(c<0?-1:1)*Math.pow(Math.abs(c),2/p), b*(s<0?-1:1)*Math.pow(Math.abs(s),2/p)];
}
function colOuterRaw(t){ var q=_sEll(COL.aO,COL.bO,COL.pO,t); return [COL.cx+q[0],COL.cz+q[1]]; }
function colOuter(t){ var q=colOuterRaw(t); if(q[0]>COL.xp) q[0]=COL.xp; return q; }
function colInner(t){ var q=_sEll(COL.aI,COL.bI,COL.pI,t); return [COL.cx+COL.ixo+q[0],COL.cz+q[1]]; }
var COL_HOLE=(function(){ var r=[];
  for(var i=0;i<COL.seg;i++) r.push(colOuter(i/COL.seg*6.283185307));
  return r; })();
function inColHole(x,z){
  if(x<COL.cx-COL.aO-1||x>COL.xp+0.01||z<COL.cz-COL.bO-1||z>COL.cz+COL.bO+1) return false;
  var u=Math.abs(x-COL.cx)/COL.aO, v=Math.abs(z-COL.cz)/COL.bO;
  return Math.pow(u,COL.pO)+Math.pow(v,COL.pO)<1;
}

/* nothing from the map data may sit inside the bowl - it is built by hand */
(function(){
  function cIn(r){ var x=0,z=0; for(var i=0;i<r.length;i++){x+=r[i][0];z+=r[i][1];}
    return inColHole(x/r.length,z/r.length); }
  BUILDINGS=BUILDINGS.filter(function(b){ return !cIn(b.ring); });
  CAMPUS=CAMPUS.filter(function(b){ return !cIn(b.ring); });
  AREAS=AREAS.filter(function(a){ return !cIn(a.ring); });
  POINTS=POINTS.filter(function(p){ return !inColHole(p.x,p.z); });
  function split(list){
    var out=[];
    for(var i=0;i<list.length;i++){
      var cur=[], pts=list[i].pts;
      for(var j=0;j<pts.length;j++){
        if(inColHole(pts[j][0],pts[j][1])){ if(cur.length>1) out.push({w:list[i].w,pts:cur}); cur=[]; }
        else cur.push(pts[j]);
      }
      if(cur.length>1) out.push({w:list[i].w,pts:cur});
    }
    return out;
  }
  ROADS=split(ROADS); PATHS=split(PATHS);
})();

/* the Exposition Park Rose Garden is laid out by hand in a2c_rose.js: take
   its fountain out of the water list and its inner walks out of the paths,
   and give the crowd one clean ring round the plaza instead */
var ROSE=null;
(function(){
  var g=null, i;
  for(i=0;i<PARKS.length;i++) if(PARKS[i].name==='Exposition Park Rose Garden') g=PARKS[i].ring;
  if(!g) return;
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  g.forEach(function(p){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); });
  function inG(p,pad){ return p[0]>x0+pad&&p[0]<x1-pad&&p[1]>z0+pad&&p[1]<z1-pad; }
  var fz=(z0+z1)/2, fx=(x0+x1)/2;
  for(i=WATER.length-1;i>=0;i--){
    var c=centroid(WATER[i]);
    if(inG(c,0)){ fx=c[0]; fz=c[1]; WATER.splice(i,1); }
  }
  /* line the centre up with the main walk if there is one */
  for(i=0;i<PATHS.length;i++){ var P=PATHS[i].pts;
    for(var k=0;k<P.length;k++) if(Math.abs(P[k][1]-fz)<22&&Math.abs(P[k][0]-fx)<3&&
       Math.abs(P[k][0]-P[P.length-1-k][0])<2) fx=P[k][0]; }
  PATHS=PATHS.filter(function(p){ return !p.pts.every(function(q){ return inG(q,-1.5); }); });
  var ring=[]; for(i=0;i<=28;i++){ var a=i/28*6.283185; ring.push([fx+Math.cos(a)*19.5,fz+Math.sin(a)*19.5]); }
  PATHS.push({w:2.6,pts:ring});
  ROSE={x0:x0,x1:x1,z0:z0,z1:z1,fx:fx,fz:fz};
})();

/* the Natural History Museum is built by hand in a2d_nhm.js; the city pass skips it */
var NHM=null, NHM_ANNEX=null;
(function(){ for(var i=0;i<BUILDINGS.length;i++){ var B=BUILDINGS[i];
  if(B.name==='Natural History Museum of Los Angeles County'){ NHM=B; B.hand=1; }
  var c=centroid(B.ring);
  if(!B.name&&Math.hypot(c[0]+254,c[1]-466)<14){ NHM_ANNEX=B; B.hand=1; } } })();
/* the Science Center complex is built by hand in a2e_sci.js */
var SCI={};
(function(){ var want={'California Science Center':'main','Lorsch Family Pavilion':'rot',
    'California Science Center IMAC':'imax','Space Shuttle Endeavour':'endv','California African American Museum':'caam'};
  for(var i=0;i<BUILDINGS.length;i++){ var B=BUILDINGS[i], k=want[B.name];
    if(k){ SCI[k]=B; B.hand=1; }
    var c=centroid(B.ring);
    if(!B.name&&Math.hypot(c[0]+201.5,c[1]-536.5)<5){ B.hand=1; } } })();

/* ------------------------------------------- where the paving actually is */
function buildWalkGrid(){
  WALKG={};
  for(var i=0;i<PATHS.length;i++){
    var pts=PATHS[i].pts, pad=PATHS[i].w*0.80+1.4;
    for(var s=0;s<pts.length-1;s++){
      var a=pts[s], b=pts[s+1];
      var L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/2.5));
      for(var k=0;k<=n;k++){
        var x=a[0]+(b[0]-a[0])*k/n, z=a[1]+(b[1]-a[1])*k/n;
        var c0=Math.floor((x-pad)/WALKC), c1=Math.floor((x+pad)/WALKC),
            d0=Math.floor((z-pad)/WALKC), d1=Math.floor((z+pad)/WALKC);
        for(var cx=c0;cx<=c1;cx++) for(var cz=d0;cz<=d1;cz++) WALKG[cx+'_'+cz]=1;
      }
    }
  }
}
/* true when (x,z) is on, or right beside, a walkway - nothing gets planted there */
function onWalk(x,z){
  if(!WALKG) buildWalkGrid();
  return WALKG[Math.floor(x/WALKC)+'_'+Math.floor(z/WALKC)]===1;
}

/* --------------------------------------------------------- deterministic rng */
var _s=1337;
function rnd(){ _s=(_s*1664525+1013904223)&0x7fffffff; return _s/0x7fffffff; }
function rr(a,b){ return a+(b-a)*rnd(); }

/* ------------------------------------------------------------- palette */
var PAL = {
  u:[0x9A4A34,0x6E3324],   /* USC brick        */
  r:[0xCDBE9F,0x84775F],   /* houses           */
  c:[0xA9B4C2,0x7C8794],   /* commercial       */
  p:[0x9C9E9A,0x76786F],   /* parking decks    */
  s:[0xCCC1A6,0x9A9077],   /* stadium-ish      */
  y:[0xE0D6C1,0xA79A82],   /* worship          */
  o:[0xB9AC96,0x8B7F6B]    /* other            */
};
var C_TREE=[0x4E9B3E,0x63B44C,0x3E8A34];
var C_CONC=0xBDB7A8;
var GROUND_MESHES=[];
var C_GRASS=0x548C3B, C_ROAD=0x55585F, C_PATH=0xBBB4A2, C_PLAZA=0x9B6249,
    C_BASE=0xB3AC9C, C_WATER=0x4FA6D8, C_PITCH=0x5BA94A, C_TRACK=0xA85340;

/* ------------------------------------------------- geometry accumulator */
function Mesher(){ this.p=[]; this.n=[]; this.c=[]; }
Mesher.prototype.tri=function(A,B,C,ca,cb,cc){
  var ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],
      vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2],
      nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx,
      l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
  nx/=l; ny/=l; nz/=l;
  this.p.push(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2]);
  this.n.push(nx,ny,nz,nx,ny,nz,nx,ny,nz);
  this.c.push(ca[0],ca[1],ca[2],cb[0],cb[1],cb[2],cc[0],cc[1],cc[2]);
};
Mesher.prototype.quad=function(A,B,C,D,ca,cb,cc,cd){ this.tri(A,B,C,ca,cb,cc); this.tri(A,C,D,ca,cc,cd); };
Mesher.prototype.count=function(){ return this.p.length/9; };
Mesher.prototype.geom=function(){
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',  new T.Float32BufferAttribute(this.n,3));
  g.setAttribute('color',   new T.Float32BufferAttribute(this.c,3));
  g.computeBoundingSphere();
  return g;
};
var _c=new T.Color();
function rgb(hex,mul){ _c.setHex(hex); return [_c.r*mul,_c.g*mul,_c.b*mul]; }

/* triangulate a simple 2-D ring (x,z) -> index triples */
function triangulate(ring){
  var pts=new Array(ring.length), i;
  for(i=0;i<ring.length;i++) pts[i]=new T.Vector2(ring[i][0],ring[i][1]);
  var f;
  try{ f=T.ShapeUtils.triangulateShape(pts,[]); }catch(e){ f=null; }
  if(!f||!f.length){
    /* a plain fan crosses the courtyard of a U shaped block, so keep only the
       fan triangles whose middle actually lies inside the outline */
    f=[];
    for(i=1;i<ring.length-1;i++){
      var A0=ring[0], B0=ring[i], C0=ring[i+1];
      if(!inRing(ring,(A0[0]+B0[0]+C0[0])/3,(A0[1]+B0[1]+C0[1])/3)) continue;
      f.push([0,i,i+1]);
    }
  }
  /* drop needles - they read as long dark lines hanging in the sky */
  var out=[];
  for(i=0;i<f.length;i++){
    var t=f[i], A=ring[t[0]], B=ring[t[1]], C=ring[t[2]];
    var ax=B[0]-A[0], az=B[1]-A[1], bx=C[0]-A[0], bz=C[1]-A[1];
    var ar=Math.abs(ax*bz-az*bx)*0.5;
    var cx2=C[0]-B[0], cz2=C[1]-B[1];
    var mx=Math.max(ax*ax+az*az, Math.max(bx*bx+bz*bz, cx2*cx2+cz2*cz2));
    if(mx>0 && ar/mx < 0.004) continue;
    out.push(t);
  }
  return out;
}

/* horizontal window bands: cheap, and it is what makes a box read as a building */
function windows(M,ring,h,tint){
  if(h<8) return;
  var floors=Math.min(11,Math.floor((h-3.6)/4.0));
  if(floors<1) return;
  var cW=rgb(tint,1), cD=rgb(tint,0.62), n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<5.5) continue;
    dx/=L; dz/=L;
    var nx=dz*0.07, nz=-dx*0.07;            /* nudge outward */
    var m0=1.4/L, m1=1-m0;
    var ax=a[0]+dx*L*m0+nx, az=a[1]+dz*L*m0+nz,
        bx=a[0]+dx*L*m1+nx, bz=a[1]+dz*L*m1+nz;
    for(var f=0;f<floors;f++){
      var y=3.4+f*4.0, y2=y+1.30;
      if(y2>h-1.1) break;
      M.quad([ax,y,az],[ax,y2,az],[bx,y2,bz],[bx,y,bz], cD,cW,cW,cD);
    }
  }
}

/* extrude a ring from y0 to y1 into a Mesher */
function prism(M,ring,y0,y1,side,top,ao){
  var n=ring.length,i,j;
  var cT=rgb(top,1), cS=rgb(side,1), cSd=rgb(side,ao===undefined?0.55:ao);
  for(i=0;i<n;i++){
    j=(i+1)%n;
    var a=ring[i],b=ring[j];
    /* CCW ring in (x,z) with z south => outward faces need this order */
    M.quad([a[0],y0,a[1]],[a[0],y1,a[1]],[b[0],y1,b[1]],[b[0],y0,b[1]], cSd,cS,cS,cSd);
  }
  var f=triangulate(ring);
  for(i=0;i<f.length;i++){
    var t=f[i], A=ring[t[0]], B=ring[t[1]], C=ring[t[2]];
    M.tri([A[0],y1,A[1]],[C[0],y1,C[1]],[B[0],y1,B[1]], cT,cT,cT);
  }
}

/* flat filled polygon at height y */
function flat(M,ring,y,col,shade){
  var f=triangulate(ring), c=rgb(col,shade===undefined?1:shade);
  for(var i=0;i<f.length;i++){
    var t=f[i],A=ring[t[0]],B=ring[t[1]],C=ring[t[2]];
    M.tri([A[0],y,A[1]],[C[0],y,C[1]],[B[0],y,B[1]],c,c,c);
  }
}

/* flat polygon with holes cut out of it; every triangle is forced to face up */
function flatHoled(M,ring,holes,y,col,shade){
  var c=rgb(col,shade===undefined?1:shade), all=ring.slice(), i;
  var cv=ring.map(function(p){return new T.Vector2(p[0],p[1]);}), hv=[];
  for(i=0;i<holes.length;i++){ hv.push(holes[i].map(function(p){return new T.Vector2(p[0],p[1]);}));
    all=all.concat(holes[i]); }
  var f; try{ f=T.ShapeUtils.triangulateShape(cv,hv); }catch(e){ f=[]; }
  for(i=0;i<f.length;i++){
    var A=all[f[i][0]], B=all[f[i][1]], C=all[f[i][2]];
    var cr=(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);
    if(cr>0) M.tri([A[0],y,A[1]],[C[0],y,C[1]],[B[0],y,B[1]],c,c,c);
    else     M.tri([A[0],y,A[1]],[B[0],y,B[1]],[C[0],y,C[1]],c,c,c);
  }
}
function ringHasHole(ring){
  return inRing(ring,COL.cx,COL.cz) && inRing(ring,COL.cx-COL.aO+2,COL.cz) && inRing(ring,COL.xp-2,COL.cz);
}

/* ribbon along a polyline at height y */
function ribbon(M,pts,w,y,col,shade){
  var c=rgb(col,shade===undefined?1:shade), hw=w*0.5;
  for(var i=0;i<pts.length-1;i++){
    var a=pts[i],b=pts[i+1];
    var dx=b[0]-a[0],dz=b[1]-a[1],L=Math.sqrt(dx*dx+dz*dz);
    if(L<0.01) continue;
    dx/=L; dz/=L;
    var ex=dx*hw*0.9, ez=dz*hw*0.9;          /* extend to close joints */
    var nx=-dz*hw, nz=dx*hw;
    var ax=a[0]-ex, az=a[1]-ez, bx=b[0]+ex, bz=b[1]+ez;
    M.quad([ax+nx,y,az+nz],[bx+nx,y,bz+nz],[bx-nx,y,bz-nz],[ax-nx,y,az-nz],c,c,c,c);
  }
}

/* ==================================================================== scene */
var scene=new T.Scene();
var SKY_TOP=0x4E9FE0, SKY_BOT=0xCFE7F7, FOG=0xBFDDF2;
scene.background=new T.Color(SKY_BOT);
scene.fog=new T.Fog(FOG,320,1600);

var renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=T.LinearEncoding;
document.getElementById('wrap').appendChild(renderer.domElement);

var BASE_FOV=88;
var camera=new T.PerspectiveCamera(BASE_FOV,innerWidth/innerHeight,0.12,2600);
var gunCam=new T.PerspectiveCamera(60,innerWidth/innerHeight,0.01,12);

scene.add(new T.HemisphereLight(0xdcebff,0x6a6150,0.56));
var sun=new T.DirectionalLight(0xfff0d8,0.84);
sun.position.set(260,560,380); scene.add(sun); scene.add(sun.target);
var SUN_DIR=new T.Vector3(260,560,380).normalize();
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
(function(){ var c=sun.shadow.camera; c.left=-115; c.right=115; c.top=115; c.bottom=-115; c.near=10; c.far=1400; })();
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03;
/* the shadow box follows the walker */
function placeSun(x,z){
  var q=0.9; x=Math.round(x/q)*q; z=Math.round(z/q)*q;
  sun.target.position.set(x,0,z);
  sun.position.set(x+SUN_DIR.x*700,SUN_DIR.y*700,z+SUN_DIR.z*700);
}
var fill=new T.DirectionalLight(0xb4ccf0,0.20);
fill.position.set(-300,240,-420); scene.add(fill);

/* sky dome */
(function(){
  var g=new T.SphereGeometry(2100,26,16),
      m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
        uniforms:{a:{value:new T.Color(SKY_TOP)},b:{value:new T.Color(SKY_BOT)}},
        vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:'varying float h;uniform vec3 a;uniform vec3 b;void main(){float t=clamp(h*1.5+0.12,0.0,1.0);gl_FragColor=vec4(mix(b,a,pow(t,0.75)),1.0);}'});
  var dome=new T.Mesh(g,m); dome.frustumCulled=false; scene.add(dome);
  /* chunky low-poly clouds, merged into one mesh */
  var cp=[],cn=[];
  var proto=new T.IcosahedronGeometry(1,0);
  var pa=proto.attributes.position, m4=new T.Matrix4(), v3=new T.Vector3(), nm=new T.Matrix3();
  for(var i=0;i<30;i++){
    var ang=rr(0,6.283), rad=rr(430,1500);
    var ox=Math.cos(ang)*rad, oy=rr(300,470), oz=Math.sin(ang)*rad, n=3+(rnd()*3|0);
    for(var j=0;j<n;j++){
      var s=rr(26,58);
      m4.makeScale(s,s*0.5,s);
      m4.setPosition(ox+rr(-60,60),oy+rr(-8,8),oz+rr(-45,45));
      nm.getNormalMatrix(m4);
      for(var k=0;k<pa.count;k++){
        v3.fromBufferAttribute(pa,k).applyMatrix4(m4); cp.push(v3.x,v3.y,v3.z);
        v3.fromBufferAttribute(pa,k).applyMatrix3(nm).normalize(); cn.push(v3.x,v3.y,v3.z);
      }
    }
  }
  var cg=new T.BufferGeometry();
  cg.setAttribute('position',new T.Float32BufferAttribute(cp,3));
  cg.setAttribute('normal',new T.Float32BufferAttribute(cn,3));
  var clouds=new T.Mesh(cg,new T.MeshLambertMaterial({color:0xffffff,emissive:0x8c939e,fog:false}));
  clouds.frustumCulled=false; scene.add(clouds);
})();

/* ============================================================ world build */
var COLLIDERS=[];                   /* {ring,h,x0,x1,z0,z1} */
var FOUNT_JETS=[], FOUNT_SHEETS=[];  /* filled by fountainRing, built once at the end */
var GRID={}, CELL=34;
function gkey(cx,cz){ return cx+'_'+cz; }
function addCollider(ring,h){
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(var i=0;i<ring.length;i++){ var p=ring[i];
    if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<z0)z0=p[1]; if(p[1]>z1)z1=p[1]; }
  var C={ring:ring,h:h,x0:x0,x1:x1,z0:z0,z1:z1};
  COLLIDERS.push(C);
  var cx0=Math.floor(x0/CELL),cx1=Math.floor(x1/CELL),
      cz0=Math.floor(z0/CELL),cz1=Math.floor(z1/CELL);
  for(var cx=cx0;cx<=cx1;cx++) for(var cz=cz0;cz<=cz1;cz++){
    var k=gkey(cx,cz); (GRID[k]||(GRID[k]=[])).push(C);
  }
  return C;
}

var matWorld=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});
var matGround=new T.MeshLambertMaterial({vertexColors:true,flatShading:true,
   polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});

/* ===================================================== architectural pieces */
var C_BRICK=[0x9C4C36,0x8E4433], C_STONE=0xD8CDB6, C_TILE=0xA8492E, C_TILE_D=0x8A3A24,
    C_SLATE=0x4B525E, C_SLATE_D=0x3A404A, C_MOD=0xCFC7B7, C_MOD_D=0xA69E8D,
    C_GLASS=0x3E4E5C, C_DECK=0x9E9E98;

function ringDims(ring){
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(var i=0;i<ring.length;i++){ var p=ring[i];
    if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<z0)z0=p[1]; if(p[1]>z1)z1=p[1]; }
  return {w:x1-x0,d:z1-z0,min:Math.min(x1-x0,z1-z0),cx:(x0+x1)/2,cz:(z0+z1)/2};
}

/* a horizontal band wrapping the ring, offset outward by `off` */
function band(M,ring,y0,y1,off,col,shadeTop,shadeBot,noCap){
  var r=off?offsetRing(ring,off):ring, n=r.length;
  var cT=rgb(col,shadeTop===undefined?1:shadeTop), cB=rgb(col,shadeBot===undefined?0.72:shadeBot);
  for(var i=0;i<n;i++){
    var a=r[i], b=r[(i+1)%n];
    M.quad([a[0],y0,a[1]],[a[0],y1,a[1]],[b[0],y1,b[1]],[b[0],y0,b[1]], cB,cT,cT,cB);
  }
  if(noCap) return;
  var f=triangulate(r), c=rgb(col,shadeTop===undefined?1:shadeTop);
  for(i=0;i<f.length;i++){ var t=f[i],A=r[t[0]],B=r[t[1]],C=r[t[2]];
    M.tri([A[0],y1,A[1]],[C[0],y1,C[1]],[B[0],y1,B[1]],c,c,c); }
}

/* Douglas-Peucker on a closed ring - roofs are built from a simplified outline
   so that fine facade detail cannot fold the inward offset inside-out */
function rdpLine(p,eps){
  if(p.length<3) return p;
  var dmax=0,idx=0,a=p[0],b=p[p.length-1];
  var dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  for(var i=1;i<p.length-1;i++){
    var d;
    if(len<1e-9) d=Math.hypot(p[i][0]-a[0],p[i][1]-a[1]);
    else d=Math.abs((p[i][0]-a[0])*dz-(p[i][1]-a[1])*dx)/len;
    if(d>dmax){dmax=d;idx=i;}
  }
  if(dmax>eps) return rdpLine(p.slice(0,idx+1),eps).slice(0,-1).concat(rdpLine(p.slice(idx),eps));
  return [a,b];
}
function simplifyRing(ring,eps){
  if(ring.length<6) return ring;
  var far=0,fd=-1;
  for(var i=1;i<ring.length;i++){
    var d=Math.hypot(ring[i][0]-ring[0][0],ring[i][1]-ring[0][1]);
    if(d>fd){fd=d;far=i;}
  }
  var out=rdpLine(ring.slice(0,far+1),eps).slice(0,-1)
          .concat(rdpLine(ring.slice(far).concat([ring[0]]),eps).slice(0,-1));
  return out.length>=4?out:ring;
}

/* largest inward offset that does not fold the polygon inside-out */
function safeInset(ring,want){
  var n=ring.length, A0=Math.abs(ringArea(ring));
  for(var k=0;k<7;k++){
    var d=want*Math.pow(0.68,k);
    if(d<0.45) return 0.45;
    var hi=offsetRing(ring,-d), ok=true;
    for(var i=0;i<n;i++){
      var j=(i+1)%n;
      var ax=ring[j][0]-ring[i][0], az=ring[j][1]-ring[i][1];
      var bx=hi[j][0]-hi[i][0], bz=hi[j][1]-hi[i][1];
      if(ax*bx+az*bz <= 0.02*(ax*ax+az*az)){ ok=false; break; }
    }
    if(ok){
      var A1=ringArea(hi);
      if(A1>0 && A1>A0*0.10) return d;
    }
  }
  return 0.45;
}

/* sloped hip roof: eave ring at y0 rising to an inset ring at y0+rise */
function hipRoof(M,ring,y0,rise,inset,col){
  inset=safeInset(ring,inset);
  var lo=ring, hi=offsetRing(ring,-inset), n=ring.length;
  rise=Math.min(rise, inset*1.35);
  var cT=rgb(col,1), cB=rgb(col,0.78), cU=rgb(col,0.45);
  for(var i=0;i<n;i++){
    var j=(i+1)%n, a=lo[i], b=lo[j], ai=hi[i], bi=hi[j];
    M.quad([a[0],y0,a[1]],[ai[0],y0+rise,ai[1]],[bi[0],y0+rise,bi[1]],[b[0],y0,b[1]],cB,cT,cT,cB);
  }
  var f=triangulate(hi);
  for(i=0;i<f.length;i++){ var t=f[i],A=hi[t[0]],B=hi[t[1]],C=hi[t[2]];
    M.tri([A[0],y0+rise,A[1]],[C[0],y0+rise,C[1]],[B[0],y0+rise,B[1]],cT,cT,cT); }
  /* eave underside so it never reads as paper-thin */
  var ov=offsetRing(ring,0.0);
  for(i=0;i<n;i++){ var a2=lo[i], b2=lo[(i+1)%n];
    M.quad([a2[0],y0-0.28,a2[1]],[b2[0],y0-0.28,b2[1]],[b2[0],y0,b2[1]],[a2[0],y0,a2[1]],cU,cU,cU,cU); }
}

/* punched vertical windows - reads as a historic facade rather than a ribbon */
function punched(M,ring,h,tint,y0,floorH,winH,pitch){
  var n=ring.length, cW=rgb(tint,1), cD=rgb(tint,0.5);
  var floors=Math.max(1,Math.floor((h-y0-0.9)/floorH));
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<4.2) continue;
    dx/=L; dz/=L;
    var nx=dz*0.09, nz=-dx*0.09;
    var count=Math.max(1,Math.floor((L-2.2)/pitch));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var t0=gap*k-0.55, t1=gap*k+0.55;
      if(t0<0.9||t1>L-0.9) continue;
      var ax=a[0]+dx*t0+nx, az=a[1]+dz*t0+nz, bx=a[0]+dx*t1+nx, bz=a[1]+dz*t1+nz;
      for(var f=0;f<floors;f++){
        var yy=y0+0.9+f*floorH, y2=yy+winH;
        if(y2>h-0.7) break;
        M.quad([ax,yy,az],[ax,y2,az],[bx,y2,bz],[bx,yy,bz], cD,cW,cW,cD);
      }
    }
  }
}

/* open-sided parking deck: slabs and shadow gaps, no glass */
function deck(M,ring,h){
  var n=ring.length, cS=rgb(C_DECK,1), cSd=rgb(C_DECK,0.6), cG=rgb(0x2A2C2E,1);
  var floors=Math.max(2,Math.floor(h/3.2));
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<3) continue;
    var nx=dz/L*0.10, nz=-dx/L*0.10;
    for(var f=0;f<floors;f++){
      var y=f*(h/floors), y2=y+h/floors*0.42;
      M.quad([a[0]+nx,y+0.35,a[1]+nz],[a[0]+nx,y2,a[1]+nz],
             [b[0]+nx,y2,b[1]+nz],[b[0]+nx,y+0.35,b[1]+nz], cG,cG,cG,cG);
    }
  }
}

/* towers: the pieces that make a silhouette recognisable */
function towerAt(M,cx,cz,w,y1,st,wallCol){
  var hw=w/2;
  var sq=[[cx-hw,cz-hw],[cx+hw,cz-hw],[cx+hw,cz+hw],[cx-hw,cz+hw]];
  prism(M,sq,0,y1,wallCol,wallCol,0.5);
  band(M,sq,y1-1.0,y1+0.35,0.32,C_STONE,1,0.78);
  /* belfry openings near the top */
  var cD=rgb(0x24262B,1);
  for(var i=0;i<4;i++){
    var a=sq[i], b=sq[(i+1)%4];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz); dx/=L; dz/=L;
    var nx=dz*0.10, nz=-dx*0.10;
    for(var k=1;k<=2;k++){
      var t0=L*(k/3)-0.42, t1=L*(k/3)+0.42;
      var ax=a[0]+dx*t0+nx, az=a[1]+dz*t0+nz, bx=a[0]+dx*t1+nx, bz=a[1]+dz*t1+nz;
      M.quad([ax,y1-5.4,az],[ax,y1-1.6,az],[bx,y1-1.6,bz],[bx,y1-5.4,bz],cD,cD,cD,cD);
    }
  }
  var top=y1+0.35;
  if(st==='p'){ hipRoof(M,offsetRing(sq,0.55),top,w*0.62,hw*0.92,C_TILE); }
  else if(st==='s'){ hipRoof(M,offsetRing(sq,0.45),top,w*1.55,hw*0.95,C_SLATE);
    band(M,sq,y1-6.6,y1-4.2,0.38,0xE3C24A,1,0.8); }          /* clock band */
  else if(st==='k'){
    /* clock stage, then a low tiled pyramid - Mudd's campanile */
    var cf=rgb(0xF0EAD8,1), cr=rgb(0x2A2A2E,1);
    for(var q=0;q<4;q++){
      var a2=sq[q], b2=sq[(q+1)%4];
      var ddx=b2[0]-a2[0], ddz=b2[1]-a2[1], LL=Math.hypot(ddx,ddz); ddx/=LL; ddz/=LL;
      var mx2=(a2[0]+b2[0])/2+ddz*0.10, mz2=(a2[1]+b2[1])/2-ddx*0.10;
      var cr2=Math.min(1.25,w*0.30);
      for(var t2=0;t2<8;t2++){
        var e0=t2/8*6.283, e1=(t2+1)/8*6.283;
        M.tri([mx2,y1-3.3,mz2],
              [mx2+ddx*Math.cos(e1)*cr2, y1-3.3+Math.sin(e1)*cr2, mz2+ddz*Math.cos(e1)*cr2],
              [mx2+ddx*Math.cos(e0)*cr2, y1-3.3+Math.sin(e0)*cr2, mz2+ddz*Math.cos(e0)*cr2],
              cf,cf,cf);
      }
      M.quad([mx2-ddx*0.10,y1-3.3,mz2-ddz*0.10],[mx2-ddx*0.10,y1-3.3+cr2*0.72,mz2-ddz*0.10],
             [mx2+ddx*0.10,y1-3.3+cr2*0.72,mz2+ddz*0.10],[mx2+ddx*0.10,y1-3.3,mz2+ddz*0.10],cr,cr,cr,cr);
    }
    hipRoof(M,offsetRing(sq,0.60),top,w*0.55,hw*0.90,C_TILE);
  }
  else if(st==='d'){
    var dr=hw*1.06, seg=10, cD2=rgb(0x6F8F72,1), cD3=rgb(0x6F8F72,0.7);
    for(var s=0;s<seg;s++){
      var a1=s/seg*6.283, a2=(s+1)/seg*6.283;
      for(var r2=0;r2<4;r2++){
        var p0=r2/4*Math.PI/2, p1=(r2+1)/4*Math.PI/2;
        var P0=[cx+Math.cos(a1)*dr*Math.cos(p0),top+Math.sin(p0)*dr*0.95,cz+Math.sin(a1)*dr*Math.cos(p0)];
        var P1=[cx+Math.cos(a2)*dr*Math.cos(p0),top+Math.sin(p0)*dr*0.95,cz+Math.sin(a2)*dr*Math.cos(p0)];
        var P2=[cx+Math.cos(a2)*dr*Math.cos(p1),top+Math.sin(p1)*dr*0.95,cz+Math.sin(a2)*dr*Math.cos(p1)];
        var P3=[cx+Math.cos(a1)*dr*Math.cos(p1),top+Math.sin(p1)*dr*0.95,cz+Math.sin(a1)*dr*Math.cos(p1)];
        M.quad(P0,P3,P2,P1,cD3,cD2,cD2,cD3);
      }
    }
  }
  else if(st==='G'){                                          /* globe on a plinth */
    var pl=[[cx-hw*0.5,cz-hw*0.5],[cx+hw*0.5,cz-hw*0.5],[cx+hw*0.5,cz+hw*0.5],[cx-hw*0.5,cz+hw*0.5]];
    prism(M,pl,top,top+1.4,C_STONE,C_STONE,0.7);
    var gr=hw*0.82, gy=top+1.4+gr, sg=10;
    for(var s2=0;s2<sg;s2++){
      var b1=s2/sg*6.283, b2=(s2+1)/sg*6.283;
      for(var r3=0;r3<6;r3++){
        var q0=-Math.PI/2+r3/6*Math.PI, q1=-Math.PI/2+(r3+1)/6*Math.PI;
        var col=(r3+s2)%2? rgb(0x2E62B4,1) : rgb(0xE7B32A,1);
        var G0=[cx+Math.cos(b1)*gr*Math.cos(q0),gy+Math.sin(q0)*gr,cz+Math.sin(b1)*gr*Math.cos(q0)];
        var G1=[cx+Math.cos(b2)*gr*Math.cos(q0),gy+Math.sin(q0)*gr,cz+Math.sin(b2)*gr*Math.cos(q0)];
        var G2=[cx+Math.cos(b2)*gr*Math.cos(q1),gy+Math.sin(q1)*gr,cz+Math.sin(b2)*gr*Math.cos(q1)];
        var G3=[cx+Math.cos(b1)*gr*Math.cos(q1),gy+Math.sin(q1)*gr,cz+Math.sin(b1)*gr*Math.cos(q1)];
        M.quad(G0,G3,G2,G1,col,col,col,col);
      }
    }
  }
  else { band(M,sq,top,top+1.1,0.2,C_STONE,1,0.8); }
  return y1;
}

/* ===================================================== USC facade vocabulary
   Round-arched openings in cream cast stone, a corbelled cornice, ivy up the
   lower walls: the things that make the brick core read as this campus and
   not any other red brick university.
   ========================================================================= */
var C_CAST=0xDCD2BC, C_CAST_D=0xB9AE96, C_GLASSD=0x2B333B, C_IVY=0x3E6B32;

/* one arched opening on a wall: springs from a square shaft into a semicircle */
function archFace(M,px,pz,dx,dz,nx,nz,y0,w,hs,ha,col,shade){
  var hw=w*0.5, c=rgb(col,shade===undefined?1:shade),
      cd=rgb(col,(shade===undefined?1:shade)*0.70);
  function pt(u,y){ return [px+dx*u+nx, y, pz+dz*u+nz]; }
  M.quad(pt(-hw,y0),pt(-hw,y0+hs),pt(hw,y0+hs),pt(hw,y0), cd,c,c,cd);
  if(ha<=0.01) return;
  var N=5, ys=y0+hs;
  for(var i=0;i<N;i++){
    var a0=Math.PI*(1-i/N), a1=Math.PI*(1-(i+1)/N);
    var u0=Math.cos(a0)*hw, u1=Math.cos(a1)*hw;
    var yA=ys+Math.sin(a0)*ha, yB=ys+Math.sin(a1)*ha;
    M.quad(pt(u0,ys),pt(u0,yA),pt(u1,yB),pt(u1,ys), c,c,c,c);
  }
}

/* rows of arched windows in stone surrounds, the way the brick core is fenestrated */
function archedWindows(M,ring,h,y0,floorH,winH,pitch,glassCol){
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<4.6) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var floors=Math.max(1,Math.floor((h-y0-1.3)/floorH));
    var count=Math.max(1,Math.floor((L-2.4)/pitch));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var u=gap*k;
      if(u<1.2||u>L-1.2) continue;
      var px=a[0]+dx*u, pz=a[1]+dz*u;
      for(var f=0;f<floors;f++){
        var sill=y0+f*floorH;
        var top=sill+winH+winH*0.30;
        if(top>h-1.1) break;
        /* cast stone surround, then the glass recessed inside it */
        archFace(M,px,pz,dx,dz,nx*0.07,nz*0.07,sill-0.20,2.10,winH*0.70,1.18,C_CAST,1);
        archFace(M,px,pz,dx,dz,nx*0.12,nz*0.12,sill,1.62,winH*0.64,0.90,glassCol,1);
      }
    }
  }
}

/* square openings in cast stone surrounds, for the brick-and-stone era */
function sqWindows(M,ring,h,y0,floorH,winH,winW,pitch,glassCol){
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<3.4) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var floors=Math.max(1,Math.floor((h-y0-0.8)/floorH));
    var count=Math.max(1,Math.floor((L-1.6)/pitch));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var u=gap*k; if(u<0.9||u>L-0.9) continue;
      var px=a[0]+dx*u, pz=a[1]+dz*u;
      for(var f=0;f<floors;f++){
        var sill=y0+f*floorH;
        if(sill+winH>h-0.8) break;
        archFace(M,px,pz,dx,dz,nx*0.07,nz*0.07,sill-0.24,winW+0.62,winH+0.48,0,C_CAST,1);
        archFace(M,px,pz,dx,dz,nx*0.13,nz*0.13,sill,winW,winH,0,glassCol,1);
      }
    }
  }
}

/* a ground level run of round arches - Mudd's cloister, Bovard's entrance loggia */
function arcade(M,ring,y0,hgt,col){
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<6) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var count=Math.max(2,Math.floor((L-2.0)/3.5));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var u=gap*k;
      if(u<1.6||u>L-1.6) continue;
      archFace(M,a[0]+dx*u,a[1]+dz*u,dx,dz,nx*0.09,nz*0.09,y0,Math.min(2.7,gap*0.78),
               hgt*0.52,Math.min(2.7,gap*0.78)*0.5,col,1);
    }
  }
}

/* ivy, patchy, up the bottom few metres - unmistakably this campus */
function ivy(M,ring,hmax,seed){
  var n=ring.length, base=rgb(C_IVY,0.42);
  for(var i=0;i<n;i++){
    if(((i*7+seed)%10)<3) continue;
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<2.5) continue;
    dx/=L; dz/=L;
    var nx=dz*0.16, nz=-dx*0.16;
    var segs=Math.max(2,Math.min(9,Math.round(L/2.6)));
    var prevH=hmax*(0.55+0.45*Math.abs(Math.sin(seed+i)));
    for(var s=0;s<segs;s++){
      var u0=L*s/segs, u1=L*(s+1)/segs;
      var hh=hmax*(0.5+0.5*Math.abs(Math.sin(seed*1.7+i*2.3+s*1.9)));
      var g0=rgb(C_IVY,0.62+0.46*Math.abs(Math.sin(s*2.1+i*1.3))),
          g1=rgb(C_IVY,0.62+0.46*Math.abs(Math.sin(s*2.1+i*1.3+2.1)));
      M.quad([a[0]+dx*u0+nx,0,a[1]+dz*u0+nz],[a[0]+dx*u0+nx,prevH,a[1]+dz*u0+nz],
             [a[0]+dx*u1+nx,hh,a[1]+dz*u1+nz],[a[0]+dx*u1+nx,0,a[1]+dz*u1+nz],
             base,g0,g1,base);
      prevH=hh;
    }
  }
}

/* cornice: cast stone band with a shadowed corbel course beneath it */
function cornice(M,ring,h){
  band(M,ring,h-1.45,h-1.05,0.20,C_CAST_D,0.62,0.44,true);
  band(M,ring,h-1.05,h-0.15,0.34,C_CAST,1,0.80,true);
  band(M,ring,h-0.15,h+0.95,0.22,C_CAST,0.92,0.76);
  /* the roof itself is dark built-up roofing, not stone */
  flat(M,offsetRing(ring,-0.55),h+0.99,0x53544F,1);
}

/* ===================================================================
   Buildings that people actually navigate by, built to their own shape
   rather than from the generic rules.
   =================================================================== */
function ngon(cx,cz,r,n,rot){
  var o=[];
  for(var i=0;i<n;i++){ var a=rot+i/n*6.283185; o.push([cx+Math.cos(a)*r, cz+Math.sin(a)*r]); }
  return o;
}
/* pointed (lancet) opening, for the collegiate gothic buildings */
function lancetFace(M,px,pz,dx,dz,nx,nz,y0,w,hs,ha,col,shade){
  var hw=w*0.5, c=rgb(col,shade===undefined?1:shade),
      cd=rgb(col,(shade===undefined?1:shade)*0.70);
  function pt(u,y){ return [px+dx*u+nx, y, pz+dz*u+nz]; }
  M.quad(pt(-hw,y0),pt(-hw,y0+hs),pt(hw,y0+hs),pt(hw,y0), cd,c,c,cd);
  var N=6, ys=y0+hs;
  function ly(u){ var t=Math.abs(u)/hw; return ha*Math.pow(Math.max(0,1-t),0.62); }
  for(var i=0;i<N;i++){
    var u0=-hw+w*i/N, u1=-hw+w*(i+1)/N;
    M.quad(pt(u0,ys),pt(u0,ys+ly(u0)),pt(u1,ys+ly(u1)),pt(u1,ys), c,c,c,c);
  }
}
function lancetWindows(M,ring,h,y0,floorH,winH,pitch,col){
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<5) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var floors=Math.max(1,Math.floor((h-y0-1.6)/floorH));
    var count=Math.max(1,Math.floor((L-2.6)/pitch));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var u=gap*k; if(u<1.4||u>L-1.4) continue;
      var px=a[0]+dx*u, pz=a[1]+dz*u;
      for(var f=0;f<floors;f++){
        var sill=y0+f*floorH;
        if(sill+winH+1.5>h-0.9) break;
        lancetFace(M,px,pz,dx,dz,nx*0.07,nz*0.07,sill-0.22,1.95,winH*0.74,1.75,C_CAST,1);
        lancetFace(M,px,pz,dx,dz,nx*0.12,nz*0.12,sill,1.42,winH*0.68,1.42,col,1);
      }
    }
  }
}
/* cream stone corners */
function quoins(M,ring,h,w2){
  var n=ring.length, c=rgb(C_CAST,1), cd=rgb(C_CAST,0.72);
  for(var i=0;i<n;i++){
    var p=ring[i], a=ring[(i-1+n)%n], b=ring[(i+1)%n];
    var q=[[p[0]-w2,p[1]-w2],[p[0]+w2,p[1]-w2],[p[0]+w2,p[1]+w2],[p[0]-w2,p[1]+w2]];
    if(ringArea(q)<0) q.reverse();
    prism(M,q,0,h,C_CAST,C_CAST,0.70);
  }
}
/* a cone, for Fertitta's tower */
function coneRoof(M,cx,cz,r,y0,hh,col,n){
  var c=rgb(col,1), cd=rgb(col,0.70);
  for(var i=0;i<n;i++){
    var a0=i/n*6.283185, a1=(i+1)/n*6.283185;
    M.tri([cx+Math.cos(a1)*r,y0,cz+Math.sin(a1)*r],
          [cx+Math.cos(a0)*r,y0,cz+Math.sin(a0)*r],
          [cx,y0+hh,cz], cd,cd,c);
  }
}
/* the open lattice globe on top of the Medicine Crow Center (DMC) tower */
function wireGlobe(M,cx,cy,cz,r){
  var g=rgb(0xC8C2B4,1), gd=rgb(0xC8C2B4,0.6), t=r*0.075, N=12;
  function ring3(axis){
    for(var i=0;i<N;i++){
      var a0=i/N*6.283185, a1=(i+1)/N*6.283185;
      var p0,p1;
      if(axis===0){ p0=[cx+Math.cos(a0)*r,cy+Math.sin(a0)*r,cz]; p1=[cx+Math.cos(a1)*r,cy+Math.sin(a1)*r,cz]; }
      else if(axis===1){ p0=[cx,cy+Math.sin(a0)*r,cz+Math.cos(a0)*r]; p1=[cx,cy+Math.sin(a1)*r,cz+Math.cos(a1)*r]; }
      else if(axis===2){ p0=[cx+Math.cos(a0)*r*0.71,cy+Math.sin(a0)*r,cz+Math.cos(a0)*r*0.71];
                         p1=[cx+Math.cos(a1)*r*0.71,cy+Math.sin(a1)*r,cz+Math.cos(a1)*r*0.71]; }
      else { p0=[cx+Math.cos(a0)*r,cy,cz+Math.sin(a0)*r]; p1=[cx+Math.cos(a1)*r,cy,cz+Math.sin(a1)*r]; }
      M.quad([p0[0]-t,p0[1],p0[2]-t],[p0[0]+t,p0[1],p0[2]+t],
             [p1[0]+t,p1[1],p1[2]+t],[p1[0]-t,p1[1],p1[2]-t], gd,g,g,gd);
      M.quad([p0[0]+t,p0[1],p0[2]+t],[p0[0]-t,p0[1],p0[2]-t],
             [p1[0]-t,p1[1],p1[2]-t],[p1[0]+t,p1[1],p1[2]+t], gd,g,g,gd);
    }
  }
  ring3(0); ring3(1); ring3(2); ring3(3);
}
/* horizontal banding, the way Leavey and the concrete blocks are striped */
function stripes(M,ring,h,y0,bandH,gapH,colA,colB){
  var y=y0;
  while(y+bandH<h-0.6){
    band(M,ring,y,y+bandH,0.10,colA,0.92,0.72,true);
    y+=bandH+gapH;
  }
}

var CUSTOM = {
/* ---------- Dr. Joseph Medicine Crow Center (DMC), formerly Von KleinSmid ---------- */
'Dr. Joseph Medicine Crow Center for International and Public Affairs':
function(M,B,ring,c,d){
  var h=15.5, wall=0xC4704E;
  prism(M,ring,0,h,wall,wall,0.58);
  band(M,ring,0,0.85,0.22,0xEDE7D8,1,0.78);
  /* the long run of tall slender arches in white surrounds */
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<10) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var count=Math.max(4,Math.floor((L-3)/8.2));
    var gap=L/(count+1);
    for(var k=1;k<=count;k++){
      var u=gap*k; if(u<2.4||u>L-2.4) continue;
      var px=a[0]+dx*u, pz=a[1]+dz*u;
      archFace(M,px,pz,dx,dz,nx*0.10,nz*0.10,0.9,Math.min(5.4,gap*0.80),h-6.6,Math.min(5.4,gap*0.80)*0.5,0xF2EDE0,1);
      archFace(M,px,pz,dx,dz,nx*0.22,nz*0.22,1.0,Math.min(4.3,gap*0.64),h-7.0,Math.min(4.3,gap*0.64)*0.5,0x4A3A2E,1);
    }
  }
  /* the thin roof plane that flies out past the walls, with its dentil fringe */
  var ov=offsetRing(ring,2.9);
  band(M,ov,h,h+1.05,0,0xE8E3D4,1,0.74);
  flat(M,ov,h,0xB8B2A2,0.55);
  var cD=rgb(0xD8D2C2,1);
  for(i=0;i<ov.length;i++){
    var a2=ov[i], b2=ov[(i+1)%ov.length];
    var ddx=b2[0]-a2[0], ddz=b2[1]-a2[1], LL=Math.hypot(ddx,ddz);
    if(LL<1) continue;
    ddx/=LL; ddz/=LL;
    var mx=ddz*0.16, mz=-ddx*0.16;
    for(var t=0.6;t<LL-0.6;t+=1.15){
      var qx=a2[0]+ddx*t+mx, qz=a2[1]+ddz*t+mz;
      M.quad([qx-ddx*0.30,h+0.15,qz-ddz*0.30],[qx-ddx*0.30,h+0.92,qz-ddz*0.30],
             [qx+ddx*0.30,h+0.92,qz+ddz*0.30],[qx+ddx*0.30,h+0.15,qz+ddz*0.30],cD,cD,cD,cD);
    }
  }
  /* the tower, set at the end of the colonnade, carrying the lattice globe */
  var ip=innerPoint(ring);
  var gx=-c[0], gz=-c[1], gL=Math.hypot(gx,gz)||1; gx/=gL; gz/=gL;
  var tx=ip.p[0]-gx*Math.max(0,ip.r-5), tz=ip.p[1]-gz*Math.max(0,ip.r-5);
  var tw=7.2, hw=tw/2, ty=42;
  var sq=[[tx-hw,tz-hw],[tx+hw,tz-hw],[tx+hw,tz+hw],[tx-hw,tz+hw]];
  prism(M,sq,0,ty,wall,0xE8E3D4,0.55);
  var slot=rgb(0x5A3A2A,1);
  for(i=0;i<4;i++){
    var s0=sq[i], s1=sq[(i+1)%4];
    var sx=s1[0]-s0[0], sz=s1[1]-s0[1], SL=Math.hypot(sx,sz); sx/=SL; sz/=SL;
    var qx2=sz*0.10, qz2=-sx*0.10;
    for(var v2=1;v2<=3;v2++){
      var uu=SL*v2/4;
      M.quad([s0[0]+sx*(uu-0.30)+qx2,ty-9.5,s0[1]+sz*(uu-0.30)+qz2],
             [s0[0]+sx*(uu-0.30)+qx2,ty-1.6,s0[1]+sz*(uu-0.30)+qz2],
             [s0[0]+sx*(uu+0.30)+qx2,ty-1.6,s0[1]+sz*(uu+0.30)+qz2],
             [s0[0]+sx*(uu+0.30)+qx2,ty-9.5,s0[1]+sz*(uu+0.30)+qz2],slot,slot,slot,slot);
    }
  }
  band(M,sq,ty,ty+0.7,0.35,0xE8E3D4,1,0.8);
  wireGlobe(M,tx,ty+3.9,tz,3.0);
  addCollider(sq,ty);
  addCollider(ring,h);
  return h;
},

/* ---------- Fertitta Hall ---------- */
'Fertitta Hall': function(M,B,ring,c,d){
  var h=21, brick=0xA3503A;
  prism(M,ring,0,h,brick,brick,0.52);
  band(M,ring,0,1.9,0.26,C_CAST,1,0.76);
  lancetWindows(M,ring,h,3.0,5.2,3.4,5.4,0x3A4A46);
  quoins(M,ring,h,1.15);
  band(M,ring,h-0.9,h+0.5,0.34,C_CAST,1,0.80,true);
  var e=offsetRing(simplifyRing(ring,2.2),0.9);
  band(M,e,h,h+0.45,0,0xB09A86,0.85,0.55);
  var rise=Math.max(5.0,Math.min(10.5,d.min*0.42));
  hipRoof(M,e,h+0.45,rise,Math.min(rise*0.72,d.min*0.30),0xC7A98C);
  /* the octagonal corner tower with its conical cap, on the street corner */
  var far=null,fd=-1;
  for(var i=0;i<ring.length;i++){
    var dd=Math.hypot(ring[i][0],ring[i][1]);
    if(dd>fd){ fd=dd; far=ring[i]; }
  }
  var ux=far[0]-c[0], uz=far[1]-c[1], uL=Math.hypot(ux,uz)||1;
  var tx=c[0]+ux/uL*(uL-6.5), tz=c[1]+uz/uL*(uL-6.5);
  var tr=5.6, ty=h+13;
  var oct=ngon(tx,tz,tr,8,0.39);
  if(ringArea(oct)<0) oct.reverse();
  prism(M,oct,0,ty,brick,brick,0.52);
  lancetWindows(M,oct,ty-2,6.0,6.0,3.6,3.4,0x3A4A46);
  band(M,oct,ty-1.2,ty+0.6,0.42,C_CAST,1,0.78);
  coneRoof(M,tx,tz,tr*1.06,ty+0.6,13.5,0xC7A98C,8);
  var sp=rgb(0x8A6A4A,1);
  M.quad([tx-0.18,ty+14.1,tz-0.18],[tx-0.18,ty+18.4,tz-0.18],
         [tx+0.18,ty+18.4,tz+0.18],[tx+0.18,ty+14.1,tz+0.18],sp,sp,sp,sp);
  M.quad([tx+0.18,ty+14.1,tz-0.18],[tx+0.18,ty+18.4,tz-0.18],
         [tx-0.18,ty+18.4,tz+0.18],[tx-0.18,ty+14.1,tz+0.18],sp,sp,sp,sp);
  for(i=0;i<4;i++){
    var pa=i/4*6.283+0.39, pxp=tx+Math.cos(pa)*tr*0.95, pzp=tz+Math.sin(pa)*tr*0.95;
    var pin=[[pxp-0.5,pzp-0.5],[pxp+0.5,pzp-0.5],[pxp+0.5,pzp+0.5],[pxp-0.5,pzp+0.5]];
    if(ringArea(pin)<0) pin.reverse();
    prism(M,pin,ty,ty+2.6,C_CAST,C_CAST,0.7);
    coneRoof(M,pxp,pzp,0.62,ty+2.6,2.0,0x8A6A4A,5);
  }
  addCollider(oct,ty); addCollider(ring,h);
  return h;
},

/* ---------- New North ---------- */
'North Residential College': function(M,B,ring,c,d){
  var h=18.5, brick=0xB07868;
  prism(M,ring,0,h,brick,brick,0.55);
  band(M,ring,0,4.3,0.16,0xD9CFB8,1,0.72);     /* stucco ground storey */
  punched(M,ring,4.3,0x2B3238,0.9,3.1,2.3,4.6); /* the open colonnade below */
  var n=ring.length;
  for(var f=0;f<4;f++){
    var y=5.2+f*3.3;
    if(y+1.5>h-0.8) break;
    band(M,ring,y,y+1.5,0.09,0x46525C,0.95,0.7,true);
    band(M,ring,y+1.5,y+1.82,0.13,0xEDE8DA,1,0.78,true);
  }
  band(M,ring,h,h+0.8,0.14,0xD9CFB8,0.95,0.72);
  flat(M,offsetRing(ring,-0.5),h+0.84,0x55564F,1);
  addCollider(ring,h);
  return h;
},

/* ---------- Parkside: red brick with cream cast stone bays, dark tile roof ---------- */
'Parkside Apartments': function(M,B,ring,c,d){
  var h=Math.max(15.5,Math.min(17.5,B.h)), brick=0x9E4C38, brickD=0x8A4130;
  var s=simplifyRing(ring,1.1);
  prism(M,s,0,h,brick,brick,0.55);
  /* cast stone plinth and a brick water table */
  band(M,s,0,0.95,0.18,C_CAST,1,0.68);
  band(M,s,0.95,1.25,0.10,C_CAST_D,0.86,0.60,true);
  /* arched openings at street level, square sash above in stone surrounds */
  archedWindows(M,s,5.0,1.7,4.4,2.5,4.6,0x33403C);
  sqWindows(M,s,h-1.2,5.6,3.35,1.85,1.25,3.9,0x33403C);
  /* projecting cast stone bays: every third long face gets one */
  var n=s.length, bays=[];
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<9) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var cnt=Math.max(1,Math.floor(L/17));
    for(var k=0;k<cnt;k++){
      var u=L*(k+0.5)/cnt;
      var px=a[0]+dx*u, pz=a[1]+dz*u, bw=Math.min(2.3,L/(cnt*5.5)), bd=0.80;
      var q=[[px-dx*bw+nx*bd,pz-dz*bw+nz*bd],[px+dx*bw+nx*bd,pz+dz*bw+nz*bd],
             [px+dx*bw,pz+dz*bw],[px-dx*bw,pz-dz*bw]];
      if(ringArea(q)<0) q.reverse();
      prism(M,q,0,h-1.0,C_CAST,C_CAST,0.72);
      band(M,q,h-1.4,h-1.0,0.16,C_CAST,1,0.80);
      /* windows in the bay face */
      for(var f=0;f<4;f++){
        var y=1.9+f*3.35; if(y+2.0>h-1.6) break;
        archFace(M,px+nx*(bd+0.10),pz+nz*(bd+0.10),dx,dz,0,0,y,bw*1.15,2.0,0,0x33403C,1);
      }
      bays.push(q);
    }
  }
  /* cornice, then a dark red tile roof with dormers and chimneys */
  cornice(M,s,h);
  var rr2=simplifyRing(s,2.4);
  var rise=Math.max(3.0,Math.min(6.5,d.min*0.30));
  hipRoof(M,offsetRing(rr2,0.55),h+0.95,rise,Math.min(rise*0.72,d.min*0.26),0x6E3324);
  var rn=rr2.length;
  for(i=0;i<rn;i++){
    var a2=rr2[i], b2=rr2[(i+1)%rn];
    var ex=b2[0]-a2[0], ez=b2[1]-a2[1], eL=Math.hypot(ex,ez);
    if(eL<11) continue;
    ex/=eL; ez/=eL;
    var mx=ez, mz=-ex;
    var dc=Math.max(1,Math.floor(eL/11));
    for(k=0;k<dc;k++){
      var du=eL*(k+0.5)/dc;
      var qx=a2[0]+ex*du, qz=a2[1]+ez*du;
      var dw=1.35, dd=1.25;
      var dq=[[qx-ex*dw+mx*dd,qz-ez*dw+mz*dd],[qx+ex*dw+mx*dd,qz+ez*dw+mz*dd],
              [qx+ex*dw-mx*dd,qz+ez*dw-mz*dd],[qx-ex*dw-mx*dd,qz-ez*dw-mz*dd]];
      if(ringArea(dq)<0) dq.reverse();
      prism(M,dq,h+1.0,h+1.0+rise*0.62,C_CAST,0x6E3324,0.74);
      archFace(M,qx+mx*(dd+0.06),qz+mz*(dd+0.06),ex,ez,0,0,h+1.5,1.5,1.35,0.55,0x33403C,1);
    }
  }
  /* chimneys */
  for(i=0;i<rn;i+=Math.max(2,Math.floor(rn/3))){
    var p2=rr2[i];
    var ix=(c[0]-p2[0]), iz=(c[1]-p2[1]), iL=Math.hypot(ix,iz)||1;
    var cx2=p2[0]+ix/iL*3.2, cz2=p2[1]+iz/iL*3.2;
    var ch=[[cx2-0.85,cz2-0.62],[cx2+0.85,cz2-0.62],[cx2+0.85,cz2+0.62],[cx2-0.85,cz2+0.62]];
    if(ringArea(ch)<0) ch.reverse();
    prism(M,ch,h,h+rise+2.2,brickD,0xD9CFB8,0.60);
  }
  /* the arched entry portal on the street side, with its green awning */
  var ux=-c[0], uz=-c[1], uL=Math.hypot(ux,uz)||1; ux/=uL; uz/=uL;
  var dd2=2.0; while(dd2<70&&inRing(ring,c[0]+ux*dd2,c[1]+uz*dd2)) dd2+=1;
  var fx=c[0]+ux*(dd2-0.5), fz=c[1]+uz*(dd2-0.5);
  var pvx=-uz, pvz=ux;
  archFace(M,fx+ux*0.9,fz+uz*0.9,pvx,pvz,ux*0.16,uz*0.16,0,4.6,3.6,2.3,C_CAST,1);
  archFace(M,fx+ux*1.0,fz+uz*1.0,pvx,pvz,ux*0.26,uz*0.26,0,3.5,3.0,1.75,0x2C3A36,1);
  var aw=[[fx+pvx*3.3+ux*3.0,fz+pvz*3.3+uz*3.0],[fx-pvx*3.3+ux*3.0,fz-pvz*3.3+uz*3.0],
          [fx-pvx*3.3,fz-pvz*3.3],[fx+pvx*3.3,fz+pvz*3.3]];
  if(ringArea(aw)<0) aw.reverse();
  prism(M,aw,4.15,4.45,0x2C6B3E,0x2C6B3E,0.7);
  ivy(M,s,3.1,5);
  addCollider(ring,h);
  for(i=0;i<bays.length;i++) addCollider(bays[i],h-1.0);
  return h;
}
};
CUSTOM['Jill & Frank Fertitta Hall']=CUSTOM['Fertitta Hall'];
CUSTOM['Arts and Humanities Residential College at Parkside']=CUSTOM['Parkside Apartments'];

/* ---------- Hoffman Hall ---------- */
CUSTOM['Hoffman Hall']=function(M,B,ring,c,d){
  var h=22, white=0xEEEAE0;
  prism(M,ring,0,h,white,white,0.62);
  /* the run of narrow vertical slots along the ground storey */
  punched(M,ring,5.6,0x3A4048,1.3,4.6,3.3,1.45);
  /* the deep beam that carries the school's name */
  band(M,ring,5.6,6.45,0.46,white,1,0.70,true);
  band(M,ring,5.6,5.78,0.50,0xCFC8B8,0.8,0.62,true);
  /* white spandrels standing proud of recessed glazing */
  for(var f=0;f<4;f++){
    var y=7.1+f*3.65;
    if(y+3.65>h-0.8) break;
    band(M,ring,y,y+2.25,0.01,0x35404A,0.95,0.60,true);
    band(M,ring,y+2.25,y+3.65,0.34,white,1,0.76,true);
  }
  band(M,ring,h-0.8,h+1.25,0.50,white,1,0.78);
  flat(M,offsetRing(ring,-0.6),h+1.29,0x54554F,1);
  addCollider(ring,h);
  return h;
};

/* ---------- the JEP House ---------- */
CUSTOM['Joint Educational Project House']=function(M,B,ring,c,d){
  var h=7.4, wall=0xD9D0B6;
  prism(M,ring,0,h,wall,wall,0.58);
  band(M,ring,0,0.8,0.18,0x8C6A52,1,0.70);
  sqWindows(M,ring,h,1.5,3.2,1.75,1.20,2.9,0x3C4A46);
  var e=offsetRing(simplifyRing(ring,1.3),1.20);
  band(M,e,h,h+0.40,0,0x6B5742,0.85,0.55);
  var rise=Math.max(2.6,Math.min(5.4,d.min*0.46));
  hipRoof(M,e,h+0.40,rise,Math.min(rise*0.76,d.min*0.30),0x7C6450);
  /* covered porch across the street frontage */
  var ux=-c[0], uz=-c[1], uL=Math.hypot(ux,uz)||1; ux/=uL; uz/=uL;
  var dd=1.5; while(dd<40&&inRing(ring,c[0]+ux*dd,c[1]+uz*dd)) dd+=1;
  var fx=c[0]+ux*(dd-0.4), fz=c[1]+uz*(dd-0.4);
  var pvx=-uz, pvz=ux, pw=Math.min(6.5,d.min*0.60), pd=2.9;
  var por=[[fx+pvx*pw,fz+pvz*pw],[fx-pvx*pw,fz-pvz*pw],
           [fx-pvx*pw+ux*pd,fz-pvz*pw+uz*pd],[fx+pvx*pw+ux*pd,fz+pvz*pw+uz*pd]];
  if(ringArea(por)<0) por.reverse();
  prism(M,por,3.30,3.75,wall,0x6B5742,0.72);
  for(var q=-1;q<=1;q+=2){
    var cx2=fx+pvx*pw*0.86*q+ux*(pd-0.35), cz2=fz+pvz*pw*0.86*q+uz*(pd-0.35);
    var col=[[cx2-0.20,cz2-0.20],[cx2+0.20,cz2-0.20],[cx2+0.20,cz2+0.20],[cx2-0.20,cz2+0.20]];
    if(ringArea(col)<0) col.reverse();
    prism(M,col,0,3.30,wall,wall,0.70);
  }
  /* chimney */
  var chx=c[0]-ux*(dd*0.45), chz=c[1]-uz*(dd*0.45);
  var ch=[[chx-0.55,chz-0.55],[chx+0.55,chz-0.55],[chx+0.55,chz+0.55],[chx-0.55,chz+0.55]];
  if(ringArea(ch)<0) ch.reverse();
  prism(M,ch,0,h+rise+1.6,0x8C6A52,0x6E5240,0.62);
  addCollider(ring,h);
  return h;
};


/* ---------- Ginsburg Hall: a glass box in a brass frame ---------- */
CUSTOM['Ginsburg Hall']=function(M,B,ring,c,d){
  var h=25.5, brick=0x9C4C36, gold=0xC59544, goldD=0xA0762F,
      glass=0x33505F, glassD=0x22333F, pale=0xEFEADE;
  var s=simplifyRing(ring,0.9), n=s.length;
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,0.85,0.16,0xB4AC99,1,0.68);
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<15) continue;                         /* the short ends stay brick */
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var W=L-6.4, px=a[0]+dx*L*0.5, pz=a[1]+dz*L*0.5;
    /* recessed, darker ground storey behind a slender colonnade */
    archFace(M,px,pz,dx,dz,nx*0.10,nz*0.10,0.85,W,3.9,0,glassD,1);
    archFace(M,px,pz,dx,dz,nx*0.26,nz*0.26,4.75,W+0.5,0.95,0,pale,1);
    /* the tall glazed hall above it */
    archFace(M,px,pz,dx,dz,nx*0.22,nz*0.22,5.70,W,h-7.2,0,glass,1);
    /* floor spandrels */
    for(var f=1;f<5;f++){
      var y=5.70+f*(h-7.2)/5;
      archFace(M,px,pz,dx,dz,nx*0.34,nz*0.34,y,W,0.42,0,gold,1);
    }
    /* the close-set brass fins that give the front its rhythm */
    var fins=Math.max(6,Math.round(W/1.55));
    for(var k=0;k<=fins;k++){
      var u=-W*0.5+W*k/fins;
      var qx=px+dx*u+nx*0.40, qz=pz+dz*u+nz*0.40;
      postAt(M,qx,qz,5.70,h-0.7,0.115,gold,0.74);
      postAt(M,qx,qz,0.85,4.75,0.10,goldD,0.7);
    }
    /* entrance: a wider bay of dark glass under the name band */
    archFace(M,px,pz,dx,dz,nx*0.30,nz*0.30,0.85,7.2,3.9,0,0x1B262E,1);
  }
  /* the deep brass soffit that caps the whole building */
  band(M,s,h-0.75,h-0.10,1.35,goldD,0.78,0.52,true);
  band(M,s,h-0.10,h+0.85,1.35,gold,1,0.80);
  flat(M,offsetRing(s,-0.7),h+0.89,0x53544F,1);
  addCollider(ring,h);
  return h;
};

/* ---------- Kaprielian Hall: brick with a cast stone centre pavilion ---------- */
CUSTOM['Kaprielian Hall']=function(M,B,ring,c,d){
  var h=30, brick=0x9E4B35, cream=0xE6DFCB, creamD=0xC6BCA2, teal=0x2E8C86, glass=0x33505F;
  var s=simplifyRing(ring,1.1);
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,1.05,0.18,creamD,1,0.66);
  band(M,s,1.05,1.35,0.10,cream,1,0.74,true);
  sqWindows(M,s,h-1.6,2.6,3.55,2.0,1.35,3.9,glass);
  quoins(M,s,h-1.2,0.62);
  /* the entrance pavilion, on the face that looks back toward campus */
  var ux=-c[0], uz=-c[1], uL=Math.hypot(ux,uz)||1; ux/=uL; uz/=uL;
  var dd=2; while(dd<90&&inRing(ring,c[0]+ux*dd,c[1]+uz*dd)) dd+=1;
  var fx=c[0]+ux*(dd-0.6), fz=c[1]+uz*(dd-0.6);
  var pvx=-uz, pvz=ux, pw=6.4, pd=1.35;
  var bay=[[fx+pvx*pw+ux*pd,fz+pvz*pw+uz*pd],[fx-pvx*pw+ux*pd,fz-pvz*pw+uz*pd],
           [fx-pvx*pw,fz-pvz*pw],[fx+pvx*pw,fz+pvz*pw]];
  if(ringArea(bay)<0) bay.reverse();
  prism(M,bay,0,h-3.2,cream,cream,0.70);
  /* the stepped, fanned crown over it */
  for(var t=0;t<5;t++){
    var wq=pw*(1-t*0.13), yq=h-3.2+t*0.62;
    var q=[[fx+pvx*wq+ux*(pd+0.22),fz+pvz*wq+uz*(pd+0.22)],
           [fx-pvx*wq+ux*(pd+0.22),fz-pvz*wq+uz*(pd+0.22)],
           [fx-pvx*wq,fz-pvz*wq],[fx+pvx*wq,fz+pvz*wq]];
    if(ringArea(q)<0) q.reverse();
    prism(M,q,yq,yq+0.62,t%2?creamD:cream,cream,0.74);
  }
  /* the tall glazed slot in the pavilion, arched at its head */
  archFace(M,fx+ux*(pd+0.16),fz+uz*(pd+0.16),pvx,pvz,ux*0.02,uz*0.02,4.9,8.2,h-11.0,3.4,glass,1);
  archFace(M,fx+ux*(pd+0.16),fz+uz*(pd+0.16),pvx,pvz,ux*0.06,uz*0.06,1.0,7.0,3.4,0,0x1F2A31,1);
  /* the teal canopy and railings at the door */
  var cv=[[fx+pvx*5.0+ux*(pd+4.3),fz+pvz*5.0+uz*(pd+4.3)],
          [fx-pvx*5.0+ux*(pd+4.3),fz-pvz*5.0+uz*(pd+4.3)],
          [fx-pvx*5.0+ux*pd,fz-pvz*5.0+uz*pd],[fx+pvx*5.0+ux*pd,fz+pvz*5.0+uz*pd]];
  if(ringArea(cv)<0) cv.reverse();
  prism(M,cv,4.05,4.38,teal,teal,0.72);
  for(var q2=-1;q2<=1;q2+=2){
    postAt(M,fx+pvx*4.7*q2+ux*(pd+4.0),fz+pvz*4.7*q2+uz*(pd+4.0),0,4.05,0.11,teal,0.7);
    segBox(M,[fx+pvx*5.0*q2+ux*(pd+0.4),fz+pvz*5.0*q2+uz*(pd+0.4)],
             [fx+pvx*5.0*q2+ux*(pd+4.6),fz+pvz*5.0*q2+uz*(pd+4.6)],0.95,1.08,0.09,teal,0.78);
    for(var r2=0;r2<5;r2++){
      var rt=r2/4;
      postAt(M,fx+pvx*5.0*q2+ux*(pd+0.4+4.2*rt),fz+pvz*5.0*q2+uz*(pd+0.4+4.2*rt),0,0.98,0.05,teal,0.72);
    }
  }
  /* steps up to the doors */
  for(var st=0;st<3;st++){
    var sw=5.4-st*0.25;
    var sq=[[fx+pvx*sw+ux*(pd+4.6+st*0.42),fz+pvz*sw+uz*(pd+4.6+st*0.42)],
            [fx-pvx*sw+ux*(pd+4.6+st*0.42),fz-pvz*sw+uz*(pd+4.6+st*0.42)],
            [fx-pvx*sw+ux*(pd+0.3),fz-pvz*sw+uz*(pd+0.3)],
            [fx+pvx*sw+ux*(pd+0.3),fz+pvz*sw+uz*(pd+0.3)]];
    if(ringArea(sq)<0) sq.reverse();
    prism(M,sq,0,0.72-st*0.24,0xBDB7A8,0xC8C2B3,0.68);
  }
  cornice(M,s,h);
  addCollider(ring,h);
  addCollider(bay,h-3.2);
  return h;
};

/* ---------- Bloom Football Performance Center ---------- */
CUSTOM['Bloom Football Performance Center']=function(M,B,ring,c,d){
  var h=16.5, mtl=0x5E5A52, mtlD=0x46433C, brick=0x9C4C36,
      gold=0xC9A24E, goldL=0xE7C97A, glass=0x2B3D4A, card=0x8E1B2A;
  var s=simplifyRing(ring,1.0), n=s.length;
  prism(M,s,0,h,mtl,mtl,0.58);
  band(M,s,0,1.15,0.30,0xBDB7A8,1,0.66);          /* the concrete plinth */
  /* which corner faces campus - that is where the glass atrium stands */
  var best=0,bd=1e9;
  for(var i=0;i<n;i++){ var dsq=s[i][0]*s[i][0]+s[i][1]*s[i][1]; if(dsq<bd){bd=dsq;best=i;} }
  for(i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<9) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var px=a[0]+dx*L*0.5, pz=a[1]+dz*L*0.5;
    var atrium = (i===best || i===((best-1+n)%n));
    if(atrium){
      /* the full height glazed corner, in slender gold mullions */
      var W=Math.min(L-3.0, 26);
      var ax2=(i===best)? a[0]+dx*(L-W*0.5-1.2) : a[0]+dx*(W*0.5+1.2);
      var az2=(i===best)? a[1]+dz*(L-W*0.5-1.2) : a[1]+dz*(W*0.5+1.2);
      /* whatever is left of the elevation is brick, like the far end */
      var restL=L-W-2.4;
      if(restL>4){
        var rcx=(i===best)? a[0]+dx*(restL*0.5+0.6) : a[0]+dx*(L-restL*0.5-0.6);
        var rcz=(i===best)? a[1]+dz*(restL*0.5+0.6) : a[1]+dz*(L-restL*0.5-0.6);
        archFace(M,rcx,rcz,dx,dz,nx*0.16,nz*0.16,1.15,restL,h-2.4,0,brick,1);
        archFace(M,rcx,rcz,dx,dz,nx*0.26,nz*0.26,4.2,Math.min(4.3,restL*0.5),7.0,0,card,1);
        archFace(M,rcx,rcz,dx,dz,nx*0.22,nz*0.22,h-3.4,restL-1.0,2.1,0,glass,1);
      }
      archFace(M,ax2,az2,dx,dz,nx*0.24,nz*0.24,1.15,W,h-2.4,0,glass,1);
      var mul=Math.max(8,Math.round(W/1.5));
      for(var k=0;k<=mul;k++){
        var u=-W*0.5+W*k/mul;
        postAt(M,ax2+dx*u+nx*0.36,az2+dz*u+nz*0.36,1.15,h-1.3,0.10,gold,0.78);
      }
      archFace(M,ax2,az2,dx,dz,nx*0.32,nz*0.32,h*0.52,W,0.34,0,gold,1);
      /* the lit stair and screen glow behind the glass */
      archFace(M,ax2,az2,dx,dz,nx*0.18,nz*0.18,2.0,W*0.30,h*0.42,0,card,1);
      /* steps to the door */
      for(var st=0;st<4;st++){
        var sq=[[ax2+dx*7-nx*(1.2+st*0.5),az2+dz*7-nz*(1.2+st*0.5)],
                [ax2-dx*7-nx*(1.2+st*0.5),az2-dz*7-nz*(1.2+st*0.5)],
                [ax2-dx*7,az2-dz*7],[ax2+dx*7,az2+dz*7]];
        if(ringArea(sq)<0) sq.reverse();
        prism(M,sq,0,1.05-st*0.26,0xBDB7A8,0xC8C2B3,0.66);
      }
    } else {
      /* brick flank, carrying the cardinal banners */
      archFace(M,px,pz,dx,dz,nx*0.16,nz*0.16,1.15,L-2.2,h-2.4,0,brick,1);
      var bn=Math.max(1,Math.floor((L-6)/9));
      for(var q=0;q<bn;q++){
        var u2=-((bn-1)*9)/2+q*9;
        archFace(M,px+dx*u2,pz+dz*u2,dx,dz,nx*0.26,nz*0.26,4.2,4.3,7.0,0,card,1);
        archFace(M,px+dx*u2,pz+dz*u2,dx,dz,nx*0.31,nz*0.31,4.2,4.3,0.30,0,gold,1);
        archFace(M,px+dx*u2,pz+dz*u2,dx,dz,nx*0.31,nz*0.31,10.9,4.3,0.30,0,gold,1);
      }
      /* a strip of clerestory glazing above */
      archFace(M,px,pz,dx,dz,nx*0.22,nz*0.22,h-3.4,L-4.0,2.1,0,glass,1);
    }
  }
  /* the great cantilevered roof, glowing gold underneath */
  var eave=offsetRing(simplifyRing(s,1.6),4.4);
  band(M,eave,h-0.95,h-0.30,0,goldL,1,0.92,true);   /* the lit soffit edge */
  band(M,eave,h-0.30,h+0.55,0,0xD9D3C4,1,0.72,true);
  flat(M,eave,h+0.58,0x55564F,1);
  /* the soffit, facing down, so the underside of the roof glows */
  flat(M,eave.slice().reverse(),h-0.96,goldL,0.98);
  addCollider(ring,h);
  return h;
};


/* ---------- shared bits for the Campus Center group ---------- */
/* the edge of a ring whose middle looks most directly at (tx,tz) */
function faceToward(ring,tx,tz){
  var best=null, bd=1e9, n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<6) continue;
    var mx=(a[0]+b[0])*0.5, mz=(a[1]+b[1])*0.5;
    var dd=Math.hypot(mx-tx,mz-tz);
    if(dd<bd){ bd=dd;
      var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      best={x:mx,z:mz,dx:dx,dz:dz,nx:dz,nz:-dx,L:L}; }
  }
  return best;
}
/* carved lettering across a facade */
var _txCache={};
function facadeText(str,px,pz,nx,nz,y,w,hgt,col){
  var key=str+'|'+col;
  var tex=_txCache[key];
  if(!tex){
    var cv=document.createElement('canvas'); cv.width=1024; cv.height=96;
    var g=cv.getContext('2d');
    g.clearRect(0,0,1024,96);
    g.fillStyle=col||'#4A4034';
    g.font='600 54px Georgia,"Times New Roman",serif';
    g.textAlign='center'; g.textBaseline='middle';
    var sp=str.split('').join(String.fromCharCode(8202)+' ');
    g.fillText(sp,512,52,980);
    tex=new T.CanvasTexture(cv); _txCache[key]=tex;
  }
  var m=new T.Mesh(new T.PlaneGeometry(w,hgt),
      new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,
        polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
  m.position.set(px+nx*0.06,y,pz+nz*0.06);
  m.rotation.y=Math.atan2(nx,nz);
  m.renderOrder=3; m.raycast=function(){}; m.frustumCulled=false;
  scene.add(m);
}
/* the pierced cream parapet that caps the Campus Center */
function balustrade(M,ring,y0,col,colD){
  var hgt=1.05;
  band(M,ring,y0,y0+0.22,0.16,col,1,0.78,true);
  band(M,ring,y0+hgt-0.26,y0+hgt,0.20,col,1,0.80,true);
  var n=ring.length;
  for(var i=0;i<n;i++){
    var a=ring[i], b=ring[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<1.2) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, nx=dz*0.15, nz=-dx*0.15;
    var np=Math.max(2,Math.round(L/0.85));
    for(var k=0;k<np;k++){
      var u=(k+0.5)/np*L;
      postAt(M,a[0]+dx*u+nx,a[1]+dz*u+nz,y0+0.22,y0+hgt-0.26,0.115,colD,0.62);
    }
  }
}
/* the open colonnade that crowns the roof */
function roofLoggia(M,ring,y0,col,colD){
  var base=simplifyRing(ring,1.8), dm=ringDims(base);
  if(dm.min<11) return;
  var r=offsetRing(base,-safeInset(base,2.6));
  if(!r) return;
  var n=r.length;
  for(var i=0;i<n;i++){
    var a=r[i], b=r[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<3) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
    var np=Math.max(2,Math.round(L/3.4));
    for(var k=0;k<=np;k++){
      var u=k/np*L;
      postAt(M,a[0]+dx*u,a[1]+dz*u,y0,y0+3.2,0.34,col,0.70);
    }
  }
  band(M,r,y0+3.2,y0+3.55,0.55,colD,1,0.72);
  /* the open timber pergola between the columns */
  for(i=0;i<n;i++){
    var a2=r[i], b2=r[(i+1)%n];
    var L2=Math.hypot(b2[0]-a2[0],b2[1]-a2[1]); if(L2<3) continue;
    var d2x=(b2[0]-a2[0])/L2, d2z=(b2[1]-a2[1])/L2;
    var m2=Math.max(2,Math.round(L2/1.5));
    for(var q=0;q<m2;q++){
      var u2=(q+0.5)/m2*L2;
      segBox(M,[a2[0]+d2x*u2,a2[1]+d2z*u2],
               [a2[0]+d2x*u2-d2z*2.2,a2[1]+d2z*u2+d2x*2.2],y0+3.3,y0+3.46,0.16,colD,0.72);
    }
  }
}
/* a tall campus lamp: fluted black post, glass lantern, cardinal banner */
function campusLamp(M,x,z,hgt,banner){
  postAt(M,x,z,0,0.55,0.20,0x2B2C2E,0.6);
  postAt(M,x,z,0.55,hgt,0.085,0x2B2C2E,0.66);
  postAt(M,x,z,hgt,hgt+0.75,0.26,0xF4EBC6,0.92);
  postAt(M,x,z,hgt+0.75,hgt+1.02,0.17,0x2B2C2E,0.7);
  if(banner){
    segBox(M,[x,z],[x+0.42,z],hgt-1.9,hgt-1.82,0.07,0x2B2C2E,0.7);
    segBox(M,[x+0.40,z],[x+0.42,z],hgt-2.9,hgt-1.86,0.56,0xC8A22E,0.88);
  }
  addCollider([[x-0.3,z-0.3],[x+0.3,z-0.3],[x+0.3,z+0.3],[x-0.3,z+0.3]],hgt);
}

/* ---------- Ronald Tutor Campus Center ---------- */
CUSTOM['Tutor Campus Center']=function(M,B,ring,c,d){
  var h=20.5;
  var brick=0x9E5540, brickD=0x8A4634, stone=0xD8CEB6, stoneD=0xBDB29A,
      stripe=0xA85A42, glass=0x3D4C54, teal=0x1E5F63, bronze=0xB08D4A;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,brick,brick,0.56);
  /* limestone plinth with the thin red course USC always runs through it */
  band(M,s,0,1.30,0.20,stoneD,1,0.66);
  band(M,s,1.30,1.52,0.12,stripe,0.95,0.70,true);
  band(M,s,1.52,1.95,0.16,stone,1,0.78,true);
  /* the ground storey loggia: round arches on cream piers */
  arcade(M,s,1.95,5.6,stone);
  band(M,s,6.30,6.62,0.13,stripe,0.95,0.70,true);
  band(M,s,6.62,7.20,0.17,stone,1,0.78,true);
  /* two storeys of arched sash in cast stone surrounds */
  archedWindows(M,s,h-2.6,8.0,5.1,3.1,4.2,glass);
  band(M,s,h-3.1,h-2.7,0.15,stripe,0.95,0.70,true);
  band(M,s,h-2.7,h-2.1,0.19,stone,1,0.80,true);
  /* cornice, pierced parapet and the rooftop colonnade */
  band(M,s,h-0.5,h+0.15,0.40,stone,1,0.80,true);
  balustrade(M,offsetRing(s,0.22),h+0.15,stone,stoneD);
  flat(M,offsetRing(s,-0.6),h+0.19,0x55564F,1);
  roofLoggia(M,s,h+0.20,stone,stoneD);
  /* the courtyard elevation, facing Sample Hall */
  var F=faceToward(s,-67,72);
  if(F){
    /* tall arched entry under a bronze balcony */
    archFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.22,F.nz*0.22,1.95,6.6,4.4,3.0,stone,1);
    archFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.34,F.nz*0.34,1.95,5.2,3.8,2.4,glass,1);
    archFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.40,F.nz*0.40,1.95,1.9,3.0,0,0x27343A,1);
    for(var q=-1;q<=1;q+=2)
      archFace(M,F.x+F.dx*3.3*q,F.z+F.dz*3.3*q,F.dx,F.dz,F.nx*0.30,F.nz*0.30,2.1,1.0,4.1,0,teal,1);
    facadeText('RONALD TUTOR CAMPUS CENTER',
               F.x+F.dx*0.0,F.z+F.dz*0.0,F.nx,F.nz,h-2.4,Math.min(F.L*0.82,26),1.3,'#4A4034');
    campusLamp(M,F.x+F.dx*6.2+F.nx*3.0,F.z+F.dz*6.2+F.nz*3.0,5.2,1);
    campusLamp(M,F.x-F.dx*6.2+F.nx*3.0,F.z-F.dz*6.2+F.nz*3.0,5.2,1);
  }
  addCollider(ring,h);
  return h;
};

/* ---------- Steven and Kathryn Sample Hall ---------- */
CUSTOM['Steven and Kathryn Sample Hall']=function(M,B,ring,c,d){
  var h=19.0;
  var brick=0x9E5540, stone=0xD9CFB7, stoneD=0xBEB39B, stripe=0xA85A42,
      glass=0x3D4C54, teal=0x1E5F63, lit=0xC9A85E;
  var s=simplifyRing(ring,1.0);
  /* the whole pavilion is faced in cast stone, not brick */
  prism(M,s,0,h,stone,stone,0.62);
  band(M,s,0,1.25,0.18,stoneD,1,0.66);
  band(M,s,1.25,1.48,0.10,stripe,0.95,0.70,true);
  /* the three great round arches on the courtyard front */
  var F=faceToward(s,-100,24);
  if(F){
    for(var k=-1;k<=1;k++){
      var px=F.x+F.dx*k*6.1, pz=F.z+F.dz*k*6.1;
      archFace(M,px,pz,F.dx,F.dz,F.nx*0.16,F.nz*0.16,1.48,5.4,3.5,2.6,stoneD,1);
      archFace(M,px,pz,F.dx,F.dz,F.nx*0.26,F.nz*0.26,1.48,4.5,3.1,2.1,glass,1);
      archFace(M,px,pz,F.dx,F.dz,F.nx*0.32,F.nz*0.32,1.60,3.4,1.9,0,lit,1);
      /* teal marble pilasters between the bays */
      for(var q=-1;q<=1;q+=2)
        archFace(M,px+F.dx*2.9*q,pz+F.dz*2.9*q,F.dx,F.dz,F.nx*0.24,F.nz*0.24,1.48,0.85,4.6,0,teal,1);
    }
    /* the two carved name bands */
    facadeText('STEVEN AND KATHRYN SAMPLE HALL',F.x,F.z,F.nx,F.nz,8.6,Math.min(F.L*0.86,24),1.2,'#463C31');
    facadeText('RONALD TUTOR CAMPUS CENTER',F.x,F.z,F.nx,F.nz,13.9,Math.min(F.L*0.74,20),1.1,'#463C31');
    band(M,s,7.6,8.0,0.12,stripe,0.95,0.70,true);
    band(M,s,9.3,9.7,0.12,stripe,0.95,0.70,true);
    /* upper windows with their little iron balconies */
    for(k=-1;k<=1;k++){
      var qx=F.x+F.dx*k*4.6, qz=F.z+F.dz*k*4.6;
      archFace(M,qx,qz,F.dx,F.dz,F.nx*0.14,F.nz*0.14,10.2,2.1,3.0,0,stoneD,1);
      archFace(M,qx,qz,F.dx,F.dz,F.nx*0.22,F.nz*0.22,10.4,1.5,2.6,0,glass,1);
      segBox(M,[qx-F.dx*1.2+F.nx*0.55,qz-F.dz*1.2+F.nz*0.55],
               [qx+F.dx*1.2+F.nx*0.55,qz+F.dz*1.2+F.nz*0.55],10.2,10.28,1.05,stoneD,0.76);
      for(var b2=-2;b2<=2;b2++)
        postAt(M,qx+F.dx*b2*0.5+F.nx*0.5,qz+F.dz*b2*0.5+F.nz*0.5,10.28,11.1,0.045,0x8A7038,0.8);
      segBox(M,[qx-F.dx*1.2+F.nx*0.5,qz-F.dz*1.2+F.nz*0.5],
               [qx+F.dx*1.2+F.nx*0.5,qz+F.dz*1.2+F.nz*0.5],11.05,11.15,0.09,0x8A7038,0.84);
    }
    campusLamp(M,F.x+F.dx*9.5+F.nx*2.6,F.z+F.dz*9.5+F.nz*2.6,5.2,0);
    campusLamp(M,F.x-F.dx*9.5+F.nx*2.6,F.z-F.dz*9.5+F.nz*2.6,5.2,0);
  }
  /* clerestory band, cornice, parapet and the rooftop colonnade */
  sqWindows(M,s,h-2.4,14.4,3.4,2.1,1.4,3.3,glass);
  band(M,s,h-1.9,h-1.5,0.13,stripe,0.95,0.70,true);
  band(M,s,h-0.6,h+0.10,0.42,stone,1,0.82,true);
  balustrade(M,offsetRing(s,0.22),h+0.10,stone,stoneD);
  flat(M,offsetRing(s,-0.6),h+0.14,0x55564F,1);
  roofLoggia(M,s,h+0.15,stone,stoneD);
  addCollider(ring,h);
  return h;
};

/* ---------- Wallis Annenberg Hall: collegiate gothic in brick ---------- */
CUSTOM['Wallis Annenberg Hall']=function(M,B,ring,c,d){
  var h=23.0;
  var brick=0xA5604A, brickD=0x8E5040, stone=0xE2D9C2, stoneD=0xC4B99E,
      tile=0x8E3A2A, tileD=0x742C20, glass=0x4A6468, blue=0x2E6A86;
  var s=simplifyRing(ring,1.0), n=s.length;
  prism(M,s,0,h,brick,brick,0.56);
  band(M,s,0,1.35,0.20,stoneD,1,0.64);
  band(M,s,1.35,1.70,0.12,stone,1,0.78,true);
  /* pointed windows in deep cast stone surrounds, three storeys of them */
  lancetWindows(M,s,h-3.4,2.9,5.6,3.4,4.3,glass);
  /* cast stone piers running the full height between the bays */
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<7) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, nx=dz, nz=-dx;
    var np=Math.max(1,Math.round(L/4.3));
    for(var k=0;k<=np;k++){
      var u=k/np*L; if(u<0.7||u>L-0.7) continue;
      archFace(M,a[0]+dx*u,a[1]+dz*u,dx,dz,nx*0.17,nz*0.17,1.35,0.95,h-4.4,0,stone,1);
    }
    /* a run of blue accent tiles at the spandrels */
    for(k=0;k<np;k++){
      var u2=(k+0.5)/np*L;
      archFace(M,a[0]+dx*u2,a[1]+dz*u2,dx,dz,nx*0.20,nz*0.20,8.0,0.55,0.55,0,blue,1);
      archFace(M,a[0]+dx*u2,a[1]+dz*u2,dx,dz,nx*0.20,nz*0.20,13.6,0.55,0.55,0,blue,1);
    }
  }
  /* the carved name band and the cornice above it */
  band(M,s,h-3.4,h-2.5,0.22,stone,1,0.82,true);
  band(M,s,h-2.5,h-2.2,0.14,stoneD,0.9,0.62,true);
  band(M,s,h-0.9,h+0.25,0.34,stone,1,0.80,true);
  var rf=simplifyRing(s,2.4);
  hipRoof(M,offsetRing(rf,0.30),h+0.28,Math.max(2.6,Math.min(5.0,d.min*0.22)),
          Math.min(4.2,d.min*0.20),tile);
  /* the great pointed entrance, with its tracery */
  var F=faceToward(s,0,0);
  if(F){
    lancetFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.24,F.nz*0.24,0,8.4,7.2,5.6,stone,1);
    lancetFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.36,F.nz*0.36,0,6.8,6.4,4.6,stoneD,1);
    lancetFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.44,F.nz*0.44,0,5.8,5.8,4.0,glass,1);
    for(var q=-2;q<=2;q++)
      postAt(M,F.x+F.dx*q*1.05+F.nx*0.50,F.z+F.dz*q*1.05+F.nz*0.50,0.2,8.4,0.085,stone,0.86);
    segBox(M,[F.x-F.dx*3.0+F.nx*0.5,F.z-F.dz*3.0+F.nz*0.5],
             [F.x+F.dx*3.0+F.nx*0.5,F.z+F.dz*3.0+F.nz*0.5],4.1,4.22,0.11,stone,0.86);
    archFace(M,F.x,F.z,F.dx,F.dz,F.nx*0.50,F.nz*0.50,0,4.0,3.9,0,0x2A3A34,1);
    facadeText('WALLIS ANNENBERG HALL',F.x,F.z,F.nx,F.nz,h-2.95,Math.min(F.L*0.62,17),1.1,'#4A4034');
    campusLamp(M,F.x+F.dx*8.0+F.nx*3.4,F.z+F.dz*8.0+F.nz*3.4,4.8,0);
    campusLamp(M,F.x-F.dx*8.0+F.nx*3.4,F.z-F.dz*8.0+F.nz*3.4,4.8,0);
  }
  /* steep tiled gables stepping along the long elevations */
  var rr2=simplifyRing(s,2.0), rn=rr2.length;
  for(i=0;i<rn;i++){
    var a3=rr2[i], b3=rr2[(i+1)%rn];
    var L3=Math.hypot(b3[0]-a3[0],b3[1]-a3[1]); if(L3<13) continue;
    var e3x=(b3[0]-a3[0])/L3, e3z=(b3[1]-a3[1])/L3, m3x=e3z, m3z=-e3x;
    var gc=Math.max(1,Math.floor(L3/13));
    for(var g=0;g<gc;g++){
      var gu=L3*(g+0.5)/gc;
      var gx=a3[0]+e3x*gu, gz=a3[1]+e3z*gu;
      var gw=Math.min(5.2,L3/(gc*2.4)), gd=1.05, rise=Math.min(6.4,gw*1.35);
      /* the projecting bay */
      var bay=[[gx-e3x*gw+m3x*gd,gz-e3z*gw+m3z*gd],[gx+e3x*gw+m3x*gd,gz+e3z*gw+m3z*gd],
               [gx+e3x*gw,gz+e3z*gw],[gx-e3x*gw,gz-e3z*gw]];
      if(ringArea(bay)<0) bay.reverse();
      prism(M,bay,0,h-2.2,brickD,brickD,0.58);
      band(M,bay,h-2.6,h-2.2,0.18,stone,1,0.80,true);
      /* the gable itself, tiled both sides */
      var ct=rgb(tile,1), cd=rgb(tileD,0.70), cw=rgb(stone,1), cwd=rgb(stoneD,0.78);
      var yE=h-2.2, yR=yE+rise;
      var FL=[gx-e3x*gw+m3x*gd, yE, gz-e3z*gw+m3z*gd];
      var FR=[gx+e3x*gw+m3x*gd, yE, gz+e3z*gw+m3z*gd];
      var BL=[gx-e3x*gw,        yE, gz-e3z*gw];
      var BR=[gx+e3x*gw,        yE, gz+e3z*gw];
      var AF=[gx+m3x*gd,        yR, gz+m3z*gd];
      var AB=[gx,               yR, gz];
      /* the cast stone gable face, both windings so it never culls away */
      M.tri(FL,FR,AF,cw,cw,cwd); M.tri(FR,FL,AF,cw,cw,cwd);
      /* the two tiled slopes */
      M.quad(FL,AF,AB,BL,cd,ct,ct,cd); M.quad(BL,AB,AF,FL,cd,ct,ct,cd);
      M.quad(BR,AB,AF,FR,cd,ct,ct,cd); M.quad(FR,AF,AB,BR,cd,ct,ct,cd);
      /* a stone coping running up each rake */
      segBox(M,[FL[0],FL[2]],[AF[0],AF[2]],yE,yE+0.18,0.30,stone,0.82);
      segBox(M,[FR[0],FR[2]],[AF[0],AF[2]],yE,yE+0.18,0.30,stone,0.82);
      /* tracery in the gable */
      lancetFace(M,gx+m3x*(gd+0.08),gz+m3z*(gd+0.08),e3x,e3z,0,0,h+0.4,gw*0.75,1.5,gw*0.66,glass,1);
      lancetFace(M,gx+m3x*(gd+0.10),gz+m3z*(gd+0.10),e3x,e3z,0,0,5.6,gw*0.86,6.6,gw*0.58,stone,1);
      lancetFace(M,gx+m3x*(gd+0.18),gz+m3z*(gd+0.18),e3x,e3z,0,0,5.9,gw*0.64,6.0,gw*0.44,glass,1);
      addCollider(bay,h-2.2);
    }
  }
  addCollider(ring,h);
  return h;
};


/* ---------- Mediterranean roof: deep tiled eaves carried on corbels ---------- */
function medRoof(M,ring,h,tile,tileD,stone){
  var base=simplifyRing(ring,1.6), dm=ringDims(base), n=base.length;
  for(var i=0;i<n;i++){
    var a=base[i], b=base[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<2.2) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, nx=dz, nz=-dx;
    var np=Math.max(1,Math.round(L/2.0));
    for(var k=0;k<np;k++){
      var u=(k+0.5)/np*L;
      segBox(M,[a[0]+dx*u,a[1]+dz*u],[a[0]+dx*u+nx*1.30,a[1]+dz*u+nz*1.30],
             h-0.92,h-0.34,0.32,stone,0.66);
    }
  }
  var eave=offsetRing(base,1.45);
  band(M,eave,h-0.36,h+0.20,0,tileD,1,0.60,true);
  flat(M,eave.slice().reverse(),h-0.37,stone,0.72);
  var rise=Math.max(2.4,Math.min(5.0,dm.min*0.22));
  hipRoof(M,eave,h+0.20,rise,Math.min(3.8,Math.max(1.2,dm.min*0.20)),tile);
  /* a run of ridge tiles so the roof does not read as one flat plane */
  if(dm.min>9){
    var rid=offsetRing(base,-safeInset(base,Math.min(3.0,dm.min*0.16)));
    if(rid) band(M,rid,h+0.20+rise-0.16,h+0.20+rise+0.16,0,tileD,1,0.74,true);
  }
}

/* ---------- USC School of Cinematic Arts ---------- */
CUSTOM['School of Cinematic Arts']=function(M,B,ring,c,d){
  var A=Math.abs(ringArea(ring));
  var h=Math.max(12,Math.min(21,B.h));
  var stucco=0xD9C388, stuccoD=0xBFA871, stone=0xF2EAD4, stoneD=0xD6C9A6,
      tile=0xB9552F, tileD=0x903C1F, iron=0x4A4036, glass=0x4C5B52;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,stucco,stucco,0.62);
  /* ashlar base and a string course at each floor */
  band(M,s,0,1.55,0.20,stone,1,0.70);
  band(M,s,1.55,1.80,0.12,stoneD,0.92,0.62,true);
  /* the cloister arcade at street level */
  arcade(M,s,1.80,5.4,stone);
  band(M,s,6.9,7.25,0.16,stone,1,0.78,true);
  /* arched windows above, in cast stone surrounds with iron grilles */
  archedWindows(M,s,h-2.2,8.3,4.6,2.9,4.0,glass);
  var n=s.length, i;
  for(i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<6) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, nx=dz, nz=-dx;
    var cnt=Math.max(1,Math.floor((L-2.4)/4.0)), gap=L/(cnt+1);
    for(var k=1;k<=cnt;k++){
      var u=gap*k; if(u<1.2||u>L-1.2) continue;
      var px=a[0]+dx*u, pz=a[1]+dz*u;
      for(var g=0;g<4;g++)
        segBox(M,[px-dx*0.62+nx*0.18,pz-dz*0.62+nz*0.18],
                 [px+dx*0.62+nx*0.18,pz+dz*0.62+nz*0.18],8.5+g*0.55,8.58+g*0.55,0.05,iron,0.82);
    }
  }
  /* the top loggia, an open colonnade under the eaves */
  if(h>15){
    band(M,s,h-2.2,h-1.9,0.20,stone,1,0.80,true);
    arcade(M,s,h-1.9,3.0,stone);
  }
  medRoof(M,s,h,tile,tileD,stoneD);

  /* the biggest block carries the gateway and the belvedere tower */
  if(A>3000){
    var F=faceToward(s,-140,-320);
    if(F){
      /* a three arch frontispiece with its own tiled roof */
      var pw=9.0, pd=2.3;
      var bay=[[F.x+F.dx*pw+F.nx*pd,F.z+F.dz*pw+F.nz*pd],[F.x-F.dx*pw+F.nx*pd,F.z-F.dz*pw+F.nz*pd],
               [F.x-F.dx*pw,F.z-F.dz*pw],[F.x+F.dx*pw,F.z+F.dz*pw]];
      if(ringArea(bay)<0) bay.reverse();
      prism(M,bay,0,9.6,stone,stone,0.72);
      for(var q=-1;q<=1;q++){
        var ax=F.x+F.dx*q*5.6+F.nx*(pd+0.10), az=F.z+F.dz*q*5.6+F.nz*(pd+0.10);
        archFace(M,ax,az,F.dx,F.dz,0,0,0,4.7,3.4,2.3,stoneD,1);
        archFace(M,ax,az,F.dx,F.dz,F.nx*0.10,F.nz*0.10,0,3.9,3.0,1.9,0x2A2F2C,1);
        /* a lantern hung in each arch */
        postAt(M,ax,az+0.0,5.2,6.0,0.14,0x3A3228,0.7);
        postAt(M,ax,az+0.0,4.55,5.2,0.24,0xE8C87A,0.95);
      }
      band(M,bay,7.4,8.4,0.14,stone,1,0.84,true);
      band(M,bay,8.4,8.7,0.22,stoneD,0.9,0.64,true);
      facadeText('USC SCHOOL OF CINEMATIC ARTS',F.x,F.z,F.nx,F.nz,7.9,pw*1.85,1.1,'#7A6A4C');
      medRoof(M,bay,9.6,tile,tileD,stoneD);
      addCollider(bay,9.6);
    }
    /* the belvedere tower */
    var ipr=innerPoint(s), ip=ipr&&ipr.p;
    if(ip && ipr.r>4.0 && isFinite(ip[0]) && isFinite(ip[1])){
      var tw=Math.min(4.6,Math.max(2.8,ipr.r*0.55)), ty=h+1.0;
      var tr=[[ip[0]-tw,ip[1]-tw],[ip[0]+tw,ip[1]-tw],[ip[0]+tw,ip[1]+tw],[ip[0]-tw,ip[1]+tw]];
      if(ringArea(tr)<0) tr.reverse();
      prism(M,tr,0,ty+8.5,stucco,stucco,0.62);
      band(M,tr,ty+3.0,ty+3.3,0.16,stone,1,0.78,true);
      arcade(M,tr,ty+3.6,4.3,stone);
      band(M,tr,ty+8.5,ty+8.9,0.24,stone,1,0.82,true);
      medRoof(M,tr,ty+8.9,tile,tileD,stoneD);
      addCollider(tr,ty+8.9);
    }
  }
  addCollider(ring,h);
  return h;
};

/* ---------- USC Iovine and Young Hall ---------- */
CUSTOM['USC Iovine and Young Hall']=function(M,B,ring,c,d){
  var h=16.5;
  var brick=0xA23F33, brickD=0x8C3529, cast=0xDCC4A8, castD=0xC2A98D,
      glass=0x2E3A42, seal=0x8A7038;
  var s=simplifyRing(ring,0.9), n=s.length, i;
  prism(M,s,0,h,brick,brick,0.56);
  /* cast stone plinth */
  band(M,s,0,1.55,0.18,cast,1,0.68);
  band(M,s,1.55,1.80,0.10,castD,0.9,0.60,true);
  /* the cast stone course at each floor line, so the brick reads banded */
  band(M,s,5.9,6.32,0.14,cast,1,0.80,true);
  band(M,s,9.9,10.22,0.12,cast,1,0.78,true);
  band(M,s,13.5,13.82,0.12,cast,1,0.78,true);
  /* round arched shopfront windows at the ground storey */
  archedWindows(M,s,5.7,2.2,3.6,2.6,4.4,glass);
  /* square sash above, in cast stone surrounds with heavy sills */
  sqWindows(M,s,h-2.2,6.9,3.6,2.1,1.35,3.7,glass);
  for(i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<5) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, nx=dz, nz=-dx;
    /* the stepped cast stone blocks that march along the parapet */
    var np=Math.max(2,Math.round(L/3.3));
    for(var k=0;k<=np;k++){
      var u=k/np*L; if(u<0.5||u>L-0.5) continue;
      segBox(M,[a[0]+dx*u-dx*0.62+nx*0.10,a[1]+dz*u-dz*0.62+nz*0.10],
               [a[0]+dx*u+dx*0.62+nx*0.10,a[1]+dz*u+dz*0.62+nz*0.10],h+0.30,h+0.95,0.66,cast,0.78);
    }
    /* vertical cast stone quoin strips at the corners of each bay */
    segBox(M,[a[0]+nx*0.10,a[1]+nz*0.10],[a[0]+dx*0.55+nx*0.10,a[1]+dz*0.55+nz*0.10],1.8,h,0.62,cast,0.74);
  }
  /* the parapet itself */
  band(M,s,h-0.35,h+0.35,0.22,cast,1,0.80,true);
  flat(M,offsetRing(s,-0.6),h+0.39,0x55564F,1);

  /* the projecting cast stone oriel, on the corner facing campus */
  var F=faceToward(s,0,0);
  if(F){
    var ow=3.3, od=2.1;
    var ob=[[F.x+F.dx*ow+F.nx*od,F.z+F.dz*ow+F.nz*od],[F.x-F.dx*ow+F.nx*od,F.z-F.dz*ow+F.nz*od],
            [F.x-F.dx*(ow+1.1),F.z-F.dz*(ow+1.1)],[F.x+F.dx*(ow+1.1),F.z+F.dz*(ow+1.1)]];
    if(ringArea(ob)<0) ob.reverse();
    prism(M,ob,4.6,h-0.6,cast,cast,0.78);
    band(M,ob,4.6,5.25,0.30,castD,1,0.66);
    band(M,ob,h-1.1,h-0.6,0.30,cast,1,0.84);
    for(var f=0;f<2;f++){
      var y=6.1+f*4.0;
      archFace(M,F.x+F.nx*(od+0.06),F.z+F.nz*(od+0.06),F.dx,F.dz,0,0,y,ow*1.7,2.8,0,glass,1);
      for(var q2=-1;q2<=1;q2+=2)
        archFace(M,F.x+F.dx*ow*q2*0.98,F.z+F.dz*ow*q2*0.98,F.nx,F.nz,F.dx*0.06*q2,F.dz*0.06*q2,y,od*1.5,2.8,0,glass,1);
    }
    addCollider(ob,h-0.6);
  }
  /* the single storey cast stone entrance, with its pointed arch and name */
  var E=faceToward(s,c[0]*1.6,c[1]*1.6);
  if(E){
    var ew=6.2, ed=2.6;
    var ent=[[E.x+E.dx*ew+E.nx*ed,E.z+E.dz*ew+E.nz*ed],[E.x-E.dx*ew+E.nx*ed,E.z-E.dz*ew+E.nz*ed],
             [E.x-E.dx*ew,E.z-E.dz*ew],[E.x+E.dx*ew,E.z+E.dz*ew]];
    if(ringArea(ent)<0) ent.reverse();
    prism(M,ent,0,6.4,cast,cast,0.76);
    band(M,ent,6.4,6.95,0.24,cast,1,0.84);
    lancetFace(M,E.x,E.z,E.dx,E.dz,E.nx*(ed+0.06),E.nz*(ed+0.06),0,3.9,2.9,2.0,castD,1);
    lancetFace(M,E.x,E.z,E.dx,E.dz,E.nx*(ed+0.14),E.nz*(ed+0.14),0,3.1,2.6,1.6,glass,1);
    facadeText('IOVINE AND YOUNG HALL',E.x,E.z,E.nx,E.nz,5.6,ew*1.5,0.9,'#6B5B45');
    addCollider(ent,6.4);
    /* the brick and cast stone wing that runs on from it, with gothic openings */
    var wl=13;
    var wing=[[E.x+E.dx*(ew+wl)+E.nx*ed,E.z+E.dz*(ew+wl)+E.nz*ed],
              [E.x+E.dx*ew+E.nx*ed,E.z+E.dz*ew+E.nz*ed],
              [E.x+E.dx*ew,E.z+E.dz*ew],[E.x+E.dx*(ew+wl),E.z+E.dz*(ew+wl)]];
    if(ringArea(wing)<0) wing.reverse();
    prism(M,wing,0,6.0,brick,brick,0.58);
    band(M,wing,0,1.0,0.16,cast,1,0.70);
    band(M,wing,5.5,6.3,0.22,cast,1,0.82);
    for(var w=0;w<3;w++){
      var wx=E.x+E.dx*(ew+2.6+w*4.2)+E.nx*(ed+0.08), wz=E.z+E.dz*(ew+2.6+w*4.2)+E.nz*(ed+0.08);
      lancetFace(M,wx,wz,E.dx,E.dz,0,0,0.9,3.1,2.3,1.7,cast,1);
      lancetFace(M,wx,wz,E.dx,E.dz,E.nx*0.08,E.nz*0.08,0.9,2.4,2.0,1.35,glass,1);
    }
    addCollider(wing,6.0);
    /* the University sign wall out at the kerb */
    var sx=E.x+E.nx*8.4, sz=E.z+E.nz*8.4;
    var sw=8.2;
    segBox(M,[sx-E.dx*sw,sz-E.dz*sw],[sx+E.dx*sw,sz+E.dz*sw],0,1.45,1.1,brick,0.58);
    segBox(M,[sx-E.dx*sw,sz-E.dz*sw],[sx+E.dx*sw,sz+E.dz*sw],1.45,2.25,1.24,cast,0.80);
    segBox(M,[sx-E.dx*sw,sz-E.dz*sw],[sx+E.dx*sw,sz+E.dz*sw],2.25,2.45,1.34,castD,0.70);
    facadeText('UNIVERSITY OF SOUTHERN CALIFORNIA',sx,sz,E.nx,E.nz,1.85,sw*1.85,0.72,'#6B5B45');
    addCollider([[sx-E.dx*sw-0.7,sz-E.dz*sw-0.7],[sx+E.dx*sw+0.7,sz-E.dz*sw-0.7],
                 [sx+E.dx*sw+0.7,sz+E.dz*sw+0.7],[sx-E.dx*sw-0.7,sz+E.dz*sw+0.7]],2.45);
    /* the gothic pylon carrying the seal */
    var px2=sx-E.dx*(sw+1.9), pz2=sz-E.dz*(sw+1.9);
    postAt(M,px2,pz2,0,4.4,1.05,cast,0.78);
    lancetFace(M,px2,pz2,E.dx,E.dz,E.nx*1.08,E.nz*1.08,0.5,1.5,2.0,1.6,castD,1);
    archFace(M,px2,pz2,E.dx,E.dz,E.nx*1.14,E.nz*1.14,1.9,1.05,1.25,0,seal,1);
    postAt(M,px2,pz2,4.4,5.5,0.52,cast,0.82);
    addCollider([[px2-1.2,pz2-1.2],[px2+1.2,pz2-1.2],[px2+1.2,pz2+1.2],[px2-1.2,pz2+1.2]],4.4);
    campusLamp(M,E.x+E.dx*(ew+wl+2.4)+E.nx*8.0,E.z+E.dz*(ew+wl+2.4)+E.nz*8.0,5.0,0);
  }
  addCollider(ring,h);
  return h;
};

/* ---------- Mark Taper Hall of Humanities ----------
   Late modern: red brick striped with thick white floor bands, ribbon
   windows, and a low front wing of white cantilevered slabs stepping back
   over a colonnade of square white piers. A ribbed brick lantern on top. */
CUSTOM['Taper Hall']=function(M,B,ring,c,d){
  var h=21.5, brick=0xB3573E, white=0xEEECE4, whiteD=0xCFCBBF, glass=0x28323B;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,0.55,0.10,whiteD,1,0.70);
  for(var f=0;f<5;f++){
    var y=4.2+f*3.5; if(y+1.0>h-0.8) break;
    band(M,s,y,y+0.95,0.22,white,1,0.74,true);           /* the white floor band */
  }
  punched(M,s,h-0.9,glass,4.45,3.5,1.9,2.4);            /* paired windows in the brick */
  band(M,s,1.1,3.3,0.05,glass,0.95,0.75,true);
  band(M,s,h-0.9,h+0.35,0.26,white,1,0.78);
  flat(M,offsetRing(s,-0.6),h+0.39,0x55564F,1);
  /* the stepped white front wing on the side facing Hutton Park */
  var F=faceToward(s,30,-128);
  if(F){
    function P2(u,v){ return [F.x+F.dx*u+F.nx*v, F.z+F.dz*u+F.nz*v]; }
    function bx(u0,u1,v0,v1,y0,y1,col,sh){
      var r=[P2(u0,v0),P2(u1,v0),P2(u1,v1),P2(u0,v1)]; if(ringArea(r)<0) r.reverse();
      prism(M,r,y0,y1,col,col,sh===undefined?0.7:sh); return r; }
    var W=Math.min(F.L*0.5+3, 22), Dp=9.5;
    /* recessed ground storey: brick and glass behind the piers */
    var gw=bx(-W,W,0,3.4,0,4.4,brick,0.6);
    archFace(M,F.x+F.nx*3.45,F.z+F.nz*3.45,F.dx,F.dz,0,0,0.3,W*1.6,3.6,0,glass,1);
    addCollider(gw,4.4);
    /* the square white piers of the colonnade */
    var np=Math.max(3,Math.round(2*W/5.6));
    for(var k=0;k<=np;k++){
      var u=-W+0.5+(2*W-1)*k/np, pp=P2(u,Dp-0.7);
      postAt(M,pp[0],pp[1],0,4.4,0.42,white,0.8);
      addCollider([[pp[0]-0.45,pp[1]-0.45],[pp[0]+0.45,pp[1]-0.45],[pp[0]+0.45,pp[1]+0.45],[pp[0]-0.45,pp[1]+0.45]],4.4);
    }
    /* the deep white fascia carrying the name */
    bx(-W-0.4,W+0.4,-0.2,Dp,4.4,5.7,white,0.78);
    var tp=P2(0,Dp+0.02);
    facadeText('MARK TAPER HALL OF HUMANITIES',tp[0],tp[1],F.nx,F.nz,5.05,Math.min(2*W*0.7,24),0.75,'#3E3A34');
    /* second storey: brick with a window band, under a cantilevered white slab */
    bx(-W+0.8,W-0.8,-0.2,Dp-2.4,5.7,8.7,brick,0.6);
    var w2=P2(0,Dp-2.35);
    archFace(M,w2[0],w2[1],F.dx,F.dz,0,0,6.2,2*W-3.2,1.9,0,glass,1);
    bx(-W,W,-0.2,Dp-1.0,8.7,9.8,white,0.78);
    /* third storey steps back again */
    bx(-W+2,W-2,-0.2,Dp-5.0,9.8,12.6,brick,0.6);
    var w3=P2(0,Dp-4.95);
    archFace(M,w3[0],w3[1],F.dx,F.dz,0,0,10.3,2*W-5.5,1.8,0,glass,1);
    bx(-W+1.2,W-1.2,-0.2,Dp-4.2,12.6,13.5,white,0.78);
    /* the tall white-framed glass bay over the entrance */
    bx(-4.3,4.3,-0.2,Dp-0.4,5.7,12.6,white,0.8);
    var g2=P2(0,Dp-0.35);
    archFace(M,g2[0],g2[1],F.dx,F.dz,0,0,6.1,6.8,6.0,0,0x3B4650,1);
    for(var m=-1;m<=1;m++) archFace(M,g2[0]+F.dx*m*2.27+F.nx*0.04,g2[1]+F.dz*m*2.27+F.nz*0.04,F.dx,F.dz,0,0,6.1,0.14,6.0,0,white,1);
    archFace(M,g2[0]+F.nx*0.04,g2[1]+F.nz*0.04,F.dx,F.dz,0,0,9.0,6.8,0.14,0,white,1);
    /* glass doors in the recess */
    var dr=P2(0,3.5);
    archFace(M,dr[0],dr[1],F.dx,F.dz,0,0,0.05,4.2,2.8,0,0x1C2228,1);
  }
  /* the ribbed brick lantern on the roof */
  var ip=innerPoint(s);
  if(ip&&ip.r>5){
    var lw=Math.min(6,ip.r*0.7), lx=ip.p[0], lz=ip.p[1];
    var lr=[[lx-lw,lz-lw*0.7],[lx+lw,lz-lw*0.7],[lx+lw,lz+lw*0.7],[lx-lw,lz+lw*0.7]];
    prism(M,lr,h,h+6.0,brick,0x6E3324,0.62);
    for(var e=0;e<4;e++){
      var A=lr[e], Bq=lr[(e+1)%4], L=Math.hypot(Bq[0]-A[0],Bq[1]-A[1]), ddx=(Bq[0]-A[0])/L, ddz=(Bq[1]-A[1])/L;
      for(var t=0.5;t<L;t+=0.9) postAt(M,A[0]+ddx*t+ddz*0.12,A[1]+ddz*t-ddx*0.12,h+0.4,h+6.0,0.13,0x8E4230,0.7);
    }
  }
  addCollider(ring,h);
  return h;
};

/* ---------- Zumberge Hall (the old Science Hall, 1928) ----------
   Romanesque brick wings with big arched ground floor windows under a tile
   roof, and a tall centre pavilion: a cast stone base pierced by a deep
   carved arch, brick and stone banding, a pierced stone lattice, four
   arched windows, and a brick gable edged with a corbel arcade and a
   round stone rose. */
CUSTOM['Zumberge Hall']=function(M,B,ring,c,d){
  var h=17.5, brick=0xA14E38, cast=0xDCC9A2, castD=0xBFA982, tile=0xA8492E, tileD=0x8A3A24,
      glass=0x3C4843, dark=0x221E1B;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,1.2,0.20,cast,1,0.68);
  archedWindows(M,s,5.6,1.7,4.6,2.5,5.2,glass);
  band(M,s,5.9,6.3,0.14,cast,1,0.78,true);
  sqWindows(M,s,h-1.6,6.9,3.5,2.3,1.6,4.0,glass);
  band(M,s,h-1.5,h-0.9,0.18,cast,1,0.80,true);
  var e2=offsetRing(simplifyRing(s,2.2),0.85);
  band(M,e2,h,h+0.4,0,tileD,0.85,0.55);
  var rise=Math.max(3.0,Math.min(6.0,d.min*0.24));
  hipRoof(M,e2,h+0.4,rise,Math.min(rise*1.1,d.min*0.32),tile);
  /* the centre pavilion, on the Trousdale front */
  var F=faceToward(s,-15,145);
  if(F){
    var ux=F.dx, uz=F.dz, nx=F.nx, nz=F.nz;
    function P2(u,v){ return [F.x+ux*u+nx*v, F.z+uz*u+nz*v]; }
    function bx(u0,u1,v0,v1,y0,y1,col,sh){
      var r=[P2(u0,v0),P2(u1,v0),P2(u1,v1),P2(u0,v1)]; if(ringArea(r)<0) r.reverse();
      prism(M,r,y0,y1,col,col,sh===undefined?0.66:sh); return r; }
    function qf(A,Bv,C,D,col,sh,n){
      var cc=rgb(col,sh), ax=Bv[0]-A[0],ay=Bv[1]-A[1],az=Bv[2]-A[2], bx2=C[0]-A[0],by=C[1]-A[1],bz=C[2]-A[2];
      var fx=ay*bz-az*by, fy=az*bx2-ax*bz, fz=ax*by-ay*bx2;
      if(fx*n[0]+fy*n[1]+fz*n[2]>=0) M.quad(A,Bv,C,D,cc,cc,cc,cc); else M.quad(A,D,C,Bv,cc,cc,cc,cc);
    }
    var Pw=10.5, pd=1.6, back=-12, HT=23.4, AP=29.6;
    var pav=bx(-Pw,Pw,back,pd,0,9.0,cast,0.66);
    /* brick and stone in alternating courses up the middle storeys */
    for(var y=9.0;y<17.6;y+=0.95){
      bx(-Pw,Pw,back,pd,y,y+0.62,brick,0.58);
      bx(-Pw-0.03,Pw+0.03,back,pd+0.03,y+0.62,y+0.95,cast,0.72);
    }
    /* the pierced stone lattice band */
    bx(-Pw-0.1,Pw+0.1,back,pd+0.12,17.6,18.9,cast,0.75);
    for(var k=-9;k<=9;k++){
      var lp=P2(k*1.05,pd+0.14);
      archFace(M,lp[0],lp[1],ux,uz,0,0,17.95,0.42,0.6,0,dark,1);
    }
    /* four arched windows with scalloped stone hoods */
    bx(-Pw,Pw,back,pd,18.9,HT,brick,0.58);
    for(var w=0;w<4;w++){
      var wu=-5.4+w*3.6, wp=P2(wu,pd+0.02);
      archFace(M,wp[0],wp[1],ux,uz,nx*0.02,nz*0.02,19.2,3.0,2.2,1.5,cast,1);
      archFace(M,wp[0],wp[1],ux,uz,nx*0.08,nz*0.08,19.35,2.1,2.0,1.05,glass,1);
    }
    bx(-Pw-0.3,Pw+0.3,back,pd+0.3,HT,HT+0.45,cast,0.8);
    /* the gable, brick, with its rose and corbel arcade along both rakes */
    var gl=P2(-Pw-0.3,pd+0.02), gr=P2(Pw+0.3,pd+0.02), ga=P2(0,pd+0.02);
    var cb=rgb(brick,1);
    M.tri([gl[0],HT+0.45,gl[1]],[gr[0],HT+0.45,gr[1]],[ga[0],AP,ga[1]],cb,cb,cb);
    M.tri([gr[0],HT+0.45,gr[1]],[gl[0],HT+0.45,gl[1]],[ga[0],AP,ga[1]],cb,cb,cb);
    var NS=11;
    for(var sd=-1;sd<=1;sd+=2){
      for(var q=0;q<NS;q++){
        var t=(q+0.5)/NS, uu=sd*(Pw+0.3)*(1-t), yy=HT+0.45+(AP-HT-0.45)*t;
        var cp=P2(uu,pd+0.15);
        archFace(M,cp[0],cp[1],ux,uz,0,0,yy-0.95,0.72,0.35,0.36,cast,1);
        archFace(M,cp[0],cp[1],ux,uz,nx*0.03,nz*0.03,yy-0.85,0.42,0.28,0.2,brick,0.7);
      }
      var re=P2(sd*(Pw+0.3),pd+0.02);
      segBox(M,[re[0],re[1]],[ga[0],ga[1]],HT+0.45,HT+0.8,0.1,cast,0.8);
    }
    var rose=P2(0,pd+0.05);
    var rm=new T.Mesh(new T.CircleGeometry(1.25,18),new T.MeshLambertMaterial({color:cast}));
    rm.position.set(rose[0],27.2,rose[1]); rm.rotation.y=Math.atan2(nx,nz); scene.add(rm);
    var rm2=new T.Mesh(new T.RingGeometry(0.45,0.95,12),new T.MeshLambertMaterial({color:castD}));
    rm2.position.set(rose[0]+nx*0.02,27.2,rose[1]+nz*0.02); rm2.rotation.y=Math.atan2(nx,nz); scene.add(rm2);
    /* the tiled gable roof running back into the building */
    var ct=rgb(tile,1), cd=rgb(tileD,0.8);
    for(var sd2=-1;sd2<=1;sd2+=2){
      var e0=P2(sd2*(Pw+0.6),pd+0.4), e1=P2(sd2*(Pw+0.6),back), r0=P2(0,pd+0.4), r1=P2(0,back);
      qf([e0[0],HT+0.3,e0[1]],[r0[0],AP+0.25,r0[1]],[r1[0],AP+0.25,r1[1]],[e1[0],HT+0.3,e1[1]],tile,1,[nx*0,1,0]);
      qf([e0[0],HT+0.2,e0[1]],[r0[0],AP+0.15,r0[1]],[r1[0],AP+0.15,r1[1]],[e1[0],HT+0.2,e1[1]],tileD,0.7,[0,-1,0]);
    }
    /* the deep carved arch, with lanterns either side */
    var ap=P2(0,pd+0.02);
    archFace(M,ap[0],ap[1],ux,uz,nx*0.02,nz*0.02,0,6.4,3.3,3.2,castD,1);
    archFace(M,ap[0],ap[1],ux,uz,nx*0.05,nz*0.05,0,5.4,3.3,2.7,0xC9B58E,1);
    archFace(M,ap[0],ap[1],ux,uz,nx*0.08,nz*0.08,0,4.2,3.2,2.1,dark,1);
    for(var ls=-1;ls<=1;ls+=2){
      var lnp=P2(ls*3.9,pd+0.35);
      var lan=new T.Mesh(new T.CylinderGeometry(0.2,0.14,0.6,6),new T.MeshLambertMaterial({color:0xE9C27A,emissive:0x5a3a10}));
      lan.position.set(lnp[0],3.3,lnp[1]); scene.add(lan);
    }
    /* stone windows either side of the arch, and the carved name */
    for(var sw=-1;sw<=1;sw+=2){
      var wp2=P2(sw*7.2,pd+0.02);
      archFace(M,wp2[0],wp2[1],ux,uz,nx*0.05,nz*0.05,1.6,2.6,4.6,0,glass,1);
      archFace(M,wp2[0],wp2[1],ux,uz,nx*0.05,nz*0.05,10.0,2.4,2.2,0,glass,1);
      archFace(M,wp2[0],wp2[1],ux,uz,nx*0.05,nz*0.05,14.0,2.4,2.2,0,glass,1);
      var wp3=P2(sw*3.4,pd+0.02);
      archFace(M,wp3[0],wp3[1],ux,uz,nx*0.05,nz*0.05,10.0,2.4,2.2,0,glass,1);
      archFace(M,wp3[0],wp3[1],ux,uz,nx*0.05,nz*0.05,14.0,2.4,2.2,0,glass,1);
    }
    /* carved ornament panel over the arch */
    var op=P2(0,pd+0.03);
    archFace(M,op[0],op[1],ux,uz,nx*0.02,nz*0.02,7.4,12.5,1.1,0,castD,1);
    var tp=P2(0,pd+0.04);
    facadeText('SCIENCE HALL',tp[0],tp[1],nx,nz,12.9,9.5,0.9,'#6A5A42');
    addCollider(pav,HT);
  }
  addCollider(ring,h);
  return h;
};

/* ---------- structured facades for the two libraries ----------
   Every wall is laid out in equal bays between shallow pilasters, with one
   opening per bay on each storey, sills under them and mullions in them,
   so a long wall reads as ordered architecture instead of a striped box. */
function bayFacade(M,s,o){
  var n=s.length;
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<(o.minL||3.6)) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx;
    var nb=Math.max(1,Math.round(L/o.bay)), bw=L/nb;
    var Q=function(u,v){ return [a[0]+dx*u+nx*v, a[1]+dz*u+nz*v]; };
    var box=function(u0,u1,v0,v1,y0,y1,col,sh){
      var r=[Q(u0,v0),Q(u1,v0),Q(u1,v1),Q(u0,v1)]; if(ringArea(r)<0) r.reverse();
      prism(M,r,y0,y1,col,col,sh===undefined?0.62:sh); };
    if(o.pil && L>=7){
      for(var k=0;k<=nb;k++){
        var u=k*bw, pw=o.pil*0.5;
        box(Math.max(0.02,u-pw),Math.min(L-0.02,u+pw),-0.05,o.pilD||0.26,o.pilY0,o.pilY1,o.pilCol,0.6);
      }
    }
    for(k=0;k<nb;k++){
      var uc=(k+0.5)*bw;
      for(var f=0;f<o.floors.length;f++){
        var F=o.floors[f], w=Math.min(F.w, bw-(o.pil?o.pil+0.9:1.0));
        if(w<0.8) continue;
        var cols=F.pair?[uc-w*0.27,uc+w*0.27]:[uc], ww=F.pair?w*0.42:w;
        for(var q=0;q<cols.length;q++){
          var p=Q(cols[q],0), arch=F.arch?ww*0.5:0;
          archFace(M,p[0],p[1],dx,dz,nx*0.06,nz*0.06,F.y-0.24,ww+0.56,F.h+(arch?0.24:0.48),arch?(ww+0.56)*0.5:0,o.trim,1);
          archFace(M,p[0],p[1],dx,dz,nx*0.11,nz*0.11,F.y,ww,F.h,arch,o.glass,1);
          archFace(M,p[0],p[1],dx,dz,nx*0.13,nz*0.13,F.y,0.09,F.h+arch*0.9,0,o.mull||o.trim,0.95);
          archFace(M,p[0],p[1],dx,dz,nx*0.13,nz*0.13,F.y+F.h*0.64,ww,0.09,0,o.mull||o.trim,0.95);
        }
        if(!F.noSill) box(uc-w*0.5-0.34,uc+w*0.5+0.34,-0.02,0.24,F.y-0.40,F.y-0.20,o.trim,0.8);
      }
    }
  }
}
/* the Romanesque corbel table: a row of little round arches under the eaves */
function lombardBand(M,s,y,col,wallCol,pitch){
  var n=s.length; pitch=pitch||1.25;
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
    if(L<2.2) continue;
    dx/=L; dz/=L;
    var nx=dz, nz=-dx, cnt=Math.max(1,Math.floor(L/pitch)), g=L/cnt;
    archFace(M,a[0]+dx*L*0.5,a[1]+dz*L*0.5,dx,dz,nx*0.05,nz*0.05,y+0.42,L,0.30,0,col,0.9);
    for(var k=0;k<cnt;k++){
      var u=(k+0.5)*g, px=a[0]+dx*u, pz=a[1]+dz*u;
      archFace(M,px,pz,dx,dz,nx*0.07,nz*0.07,y,g*0.86,0.02,g*0.43,col,1);
      archFace(M,px,pz,dx,dz,nx*0.10,nz*0.10,y-0.02,g*0.56,0.02,g*0.26,wallCol,0.72);
      archFace(M,a[0]+dx*k*g,a[1]+dz*k*g,dx,dz,nx*0.09,nz*0.09,y-0.34,0.20,0.36,0,col,0.85);
    }
  }
}
/* the longest wall whose outward face looks toward (tx,tz) */
function wallFacing(s,tx,tz,minL){
  var best=null, bl=0, n=s.length;
  for(var i=0;i<n;i++){
    var a=s[i], b=s[(i+1)%n], L=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(L<(minL||8)) continue;
    var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L, mx=(a[0]+b[0])*0.5, mz=(a[1]+b[1])*0.5;
    var vx=tx-mx, vz=tz-mz, vl=Math.hypot(vx,vz)||1;
    if((dz*vx-dx*vz)/vl<0.72) continue;
    if(L>bl){ bl=L; best={x:mx,z:mz,dx:dx,dz:dz,nx:dz,nz:-dx,L:L}; }
  }
  return best||faceToward(s,tx,tz);
}
/* a local frame on a wall: u runs along it, v out from it */
function wallKit(M,F){
  var K={};
  K.P=function(u,v){ return [F.x+F.dx*u+F.nx*v, F.z+F.dz*u+F.nz*v]; };
  K.box=function(u0,u1,v0,v1,y0,y1,col,sh){
    var r=[K.P(u0,v0),K.P(u1,v0),K.P(u1,v1),K.P(u0,v1)]; if(ringArea(r)<0) r.reverse();
    prism(M,r,y0,y1,col,col,sh===undefined?0.66:sh); return r; };
  K.face=function(u,v,y0,w,hs,ha,col,sh){
    var p=K.P(u,v); archFace(M,p[0],p[1],F.dx,F.dz,0,0,y0,w,hs,ha,col,sh===undefined?1:sh); };
  /* gable wall facing +v at depth v, plus its back */
  K.gable=function(u0,u1,v,y0,y1,col){
    var l=K.P(u0,v), r=K.P(u1,v), m=K.P((u0+u1)*0.5,v), c=rgb(col,1), cd=rgb(col,0.7);
    M.tri([l[0],y0,l[1]],[r[0],y0,r[1]],[m[0],y1,m[1]],c,c,c);
    M.tri([r[0],y0,r[1]],[l[0],y0,l[1]],[m[0],y1,m[1]],cd,cd,cd); };
  /* pitched roof over u0..u1 running from v0 back to v1 */
  K.roof=function(u0,u1,v0,v1,y0,y1,col,colD){
    var um=(u0+u1)*0.5, ct=rgb(col,1), cu=rgb(colD,0.7);
    for(var sd=0;sd<2;sd++){
      var ue=sd?u1:u0;
      var e0=K.P(ue,v0), e1=K.P(ue,v1), r0=K.P(um,v0), r1=K.P(um,v1);
      var A=[e0[0],y0,e0[1]], B=[r0[0],y1,r0[1]], C=[r1[0],y1,r1[1]], D=[e1[0],y0,e1[1]];
      var ax=B[0]-A[0],ay=B[1]-A[1],az=B[2]-A[2], bx=D[0]-A[0],by=D[1]-A[1],bz=D[2]-A[2];
      var up=az*bx-ax*bz;
      if(up>=0) M.quad(A,B,C,D,ct,ct,ct,ct); else M.quad(A,D,C,B,ct,ct,ct,ct);
      var A2=[A[0],A[1]-0.22,A[2]], B2=[B[0],B[1]-0.22,B[2]], C2=[C[0],C[1]-0.22,C[2]], D2=[D[0],D[1]-0.22,D[2]];
      if(up>=0) M.quad(A2,D2,C2,B2,cu,cu,cu,cu); else M.quad(A2,B2,C2,D2,cu,cu,cu,cu);
    }
  };
  K.disc=function(u,v,y,r,col,seg){
    var p=K.P(u,v), m=new T.Mesh(new T.CircleGeometry(r,seg||18),new T.MeshLambertMaterial({color:col}));
    m.position.set(p[0],y,p[1]); m.rotation.y=Math.atan2(F.nx,F.nz); scene.add(m); return m; };
  return K;
}

/* ---------- Thomas and Dorothy Leavey Library (1994) ----------
   Postmodern Romanesque in the campus brick: three storeys of regular
   pilastered bays in cast stone trim under a red tile roof, and a tall
   gabled gateway pavilion with a great arched window facing McCarthy Quad
   and the long reflecting pool. */
CUSTOM['Leavey Library']=function(M,B,ring,c,d){
  var h=15.6, brick=0xA64A32, brickD=0x8E3F2B, cast=0xE2D7BF, castD=0xC4B79B,
      tile=0xB0502F, tileD=0x8A3C24, glass=0x2E3B45;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,1.15,0.22,cast,1,0.70);
  band(M,s,5.05,5.45,0.30,cast,1,0.78,true);
  band(M,s,10.15,10.45,0.30,cast,1,0.78,true);
  bayFacade(M,s,{bay:4.4,pil:0.95,pilD:0.24,pilY0:1.15,pilY1:h-1.1,pilCol:brickD,trim:cast,glass:glass,mull:castD,
    floors:[{y:1.75,h:2.35,w:2.1,arch:1},{y:6.2,h:2.7,w:2.0},{y:11.05,h:2.5,w:2.0}]});
  band(M,s,h-1.1,h-0.55,0.30,castD,0.9,0.62,true);
  band(M,s,h-0.55,h+0.05,0.44,cast,1,0.80,true);
  var e2=offsetRing(simplifyRing(s,3.0),0.9);
  band(M,e2,h,h+0.35,0,tileD,0.85,0.55);
  var rise=Math.max(3.0,Math.min(5.2,d.min*0.20));
  hipRoof(M,e2,h+0.35,rise,Math.min(rise*1.15,d.min*0.30),tile);

  /* the gateway pavilion, on the axis of the reflecting pool */
  var pc=[237,-94];
  for(var wi=0;wi<WATER.length;wi++){ var wc=centroid(WATER[wi]);
    if(Math.hypot(wc[0]-c[0],wc[1]-c[1])<70){ pc=wc; break; } }
  var F=wallFacing(s,pc[0],pc[1],14);
  if(F){
    var K=wallKit(M,F);
    var uc=(pc[0]-F.x)*F.dx+(pc[1]-F.z)*F.dz;
    uc=Math.max(-F.L*0.5+9.5,Math.min(F.L*0.5-9.5,uc));
    var Pw=8.2, back=-8, fr=2.6, HT=21.6, AP=27.4;
    var pav=K.box(uc-Pw,uc+Pw,back,fr,0,HT,brick,0.56);
    K.box(uc-Pw-0.2,uc+Pw+0.2,back,fr+0.2,0,1.15,cast,0.70);
    K.box(uc-Pw-0.08,uc+Pw+0.08,back,fr+0.1,5.05,5.45,cast,0.78);
    K.box(uc-Pw-0.08,uc+Pw+0.08,back,fr+0.1,10.15,10.45,cast,0.78);
    /* cast stone piers at the corners, capped above the cornice */
    for(var sd=-1;sd<=1;sd+=2){
      var pu=uc+sd*(Pw-0.7);
      K.box(pu-0.95,pu+0.95,fr-1.2,fr+0.55,0,HT+1.3,cast,0.70);
      K.box(pu-1.15,pu+1.15,fr-1.4,fr+0.75,HT+1.3,HT+1.75,castD,0.8);
      for(var qy=1.6;qy<HT;qy+=1.9) K.box(pu-1.05,pu+1.05,fr-1.3,fr+0.62,qy,qy+0.45,castD,0.72);
      var tq=K.P(pu,fr-0.3);
      coneRoof(M,tq[0],tq[1],1.0,HT+1.75,1.8,tile,4);
    }
    /* the great arched window: stone archivolt, glazing in a stone grid */
    var gw=8.4, gs=10.6, ga=gw*0.5;
    K.face(uc,fr+0.02,0.0,gw+1.7,gs+0.3,ga+0.85,castD,1);
    K.face(uc,fr+0.05,0.0,gw+0.8,gs+0.15,ga+0.40,cast,1);
    K.face(uc,fr+0.08,0.0,gw,gs,ga,glass,1);
    for(var mu=-1;mu<=1;mu++) K.face(uc+mu*gw/4,fr+0.11,3.4,0.18,gs-3.4+ga*(mu?0.72:1),0,cast,0.95);
    for(var ty=3.4;ty<gs+0.1;ty+=3.6) K.face(uc,fr+0.11,ty,gw,0.18,0,cast,0.95);
    K.face(uc,fr+0.11,gs+ga*0.55,gw*0.84,0.16,0,cast,0.95);
    /* glass doors under a bronze canopy */
    K.face(uc,fr+0.12,0.0,5.4,3.3,0,0x1B2329,1);
    for(var du=-1;du<=1;du++) K.face(uc+du*1.8,fr+0.14,0,0.14,3.3,0,0x6B5A3E,1);
    K.box(uc-3.6,uc+3.6,fr,fr+2.4,3.35,3.7,0x6B5A3E,0.8);
    /* keystone, name panel, cornice */
    K.box(uc-0.55,uc+0.55,fr,fr+0.22,gs+ga+0.2,gs+ga+1.3,castD,0.8);
    K.box(uc-6.2,uc+6.2,fr,fr+0.12,HT-4.1,HT-2.9,cast,0.82);
    var tp=K.P(uc,fr+0.14);
    facadeText('LEAVEY LIBRARY',tp[0],tp[1],F.nx,F.nz,HT-3.5,10.5,0.95,'#5A4A38');
    K.box(uc-Pw-0.3,uc+Pw+0.3,back,fr+0.35,HT-1.3,HT-0.7,castD,0.62);
    K.box(uc-Pw-0.45,uc+Pw+0.45,back,fr+0.5,HT-0.7,HT,cast,0.80);
    /* the gable: brick field, stone coping on the rakes, an oculus */
    K.gable(uc-Pw-0.2,uc+Pw+0.2,fr+0.02,HT,AP,brick);
    for(var sd2=-1;sd2<=1;sd2+=2){
      var re=K.P(uc+sd2*(Pw+0.45),fr+0.4), ap=K.P(uc,fr+0.4);
      segBox(M,re,ap,HT,HT+0.1,0.2,cast,0.8);
    }
    var ri=K.P(uc+(Pw+0.45),fr+0.35), le=K.P(uc-(Pw+0.45),fr+0.35), apx=K.P(uc,fr+0.35);
    var cc=rgb(cast,1);
    for(var t2=0;t2<2;t2++){
      var E=t2?ri:le;
      var A1=[E[0],HT+0.1,E[1]], A2=[apx[0],AP+0.35,apx[1]];
      M.quad(A1,[A1[0],A1[1]+0.55,A1[2]],[A2[0],A2[1]+0.55,A2[2]],A2,cc,cc,cc,cc);
      M.quad(A2,[A2[0],A2[1]+0.55,A2[2]],[A1[0],A1[1]+0.55,A1[2]],A1,cc,cc,cc,cc);
    }
    K.disc(uc,fr+0.04,HT+2.55,1.35,cast,20);
    K.disc(uc,fr+0.07,HT+2.55,0.95,glass,20);
    K.roof(uc-Pw-0.6,uc+Pw+0.6,fr+0.6,back,HT+0.05,AP+0.3,tile,tileD);
    addCollider(pav,HT);
    /* keep the forecourt open between the doors and the pool */
    var fc=K.P(uc,fr+9);
    B.noPlant=[oriRect(fc[0],fc[1],F.dx,F.dz,Pw+14,10)];
    /* lanterns on the piers */
    for(var ls=-1;ls<=1;ls+=2){
      var lp=K.P(uc+ls*(Pw-0.7),fr+0.8);
      var lan=new T.Mesh(new T.CylinderGeometry(0.24,0.17,0.7,6),new T.MeshLambertMaterial({color:0xE9C27A,emissive:0x5a3a10}));
      lan.position.set(lp[0],3.6,lp[1]); scene.add(lan);
    }
  }
  addCollider(ring,h);
  return h;
};

/* ---------- Edward L. Doheny Jr. Memorial Library (1932) ----------
   Italian Romanesque in pale rose brick and limestone. The west front faces
   Alumni Park (it is the backdrop for commencement): a tall gabled centre
   block with three great arched windows over a limestone entrance porch,
   Shakespeare and Dante in niches either side of the bronze doors, and
   long wings of round-arched reading room windows under a corbel table
   and red tile roofs. */
CUSTOM['Doheny Memorial Library']=function(M,B,ring,c,d){
  var h=17.6, brick=0xC4876A, brickD=0xB27A5E, lime=0xE6DCC6, limeD=0xC9BCA2,
      tile=0xB4553A, tileD=0x8E4128, glass=0x2F3A40, stain=0x3C4A66;
  var s=simplifyRing(ring,1.0);
  prism(M,s,0,h,brick,brick,0.55);
  band(M,s,0,1.4,0.24,lime,1,0.70);
  band(M,s,5.3,5.8,0.26,lime,1,0.78,true);
  bayFacade(M,s,{bay:5.0,pil:0.9,pilD:0.22,pilY0:1.4,pilY1:h-2.2,pilCol:brickD,trim:lime,glass:glass,mull:limeD,
    floors:[{y:2.1,h:2.3,w:1.8},{y:6.6,h:4.0,w:2.5,arch:1},{y:13.0,h:1.35,w:2.1,pair:1,noSill:1}]});
  lombardBand(M,s,h-1.75,lime,brick,1.2);
  band(M,s,h-0.85,h,0.36,lime,1,0.78,true);
  var e2=offsetRing(simplifyRing(s,2.6),0.9);
  band(M,e2,h,h+0.4,0,tileD,0.85,0.55);
  var rise=Math.max(3.0,Math.min(5.8,d.min*0.20));
  hipRoof(M,e2,h+0.4,rise,Math.min(rise*1.15,d.min*0.30),tile);

  var F=wallFacing(s,80,5,20);
  if(F){
    var K=wallKit(M,F);
    var Cw=9.6, back=-30, fr=0.4, HT=25.0, AP=31.8;
    /* the tall centre block */
    var cb=K.box(-Cw,Cw,back,fr,0,HT,brick,0.56);
    K.box(-Cw-0.2,Cw+0.2,back,fr+0.2,0,1.4,lime,0.70);
    for(var sd=-1;sd<=1;sd+=2){           /* limestone quoins up the corners */
      for(var qy=1.4,qk=0;qy<HT-1.2;qy+=0.9,qk++){
        var qw=(qk%2)?0.9:1.5;
        K.box(sd>0?Cw-qw:-Cw-0.06,sd>0?Cw+0.06:-Cw+qw,fr-0.02,fr+0.08,qy,qy+0.62,lime,0.78);
      }
    }
    /* three great arched windows, stained glass in stone tracery */
    for(var w=-1;w<=1;w++){
      var wu=w*4.6;
      K.face(wu,fr+0.03,13.2,3.7,6.2,1.85,limeD,1);
      K.face(wu,fr+0.06,13.45,3.0,5.9,1.5,stain,1);
      K.face(wu,fr+0.09,13.45,0.12,7.2,0,lime,0.95);
      K.face(wu,fr+0.09,16.4,3.0,0.12,0,lime,0.95);
      K.face(wu,fr+0.09,19.35,3.0,0.12,0,lime,0.95);
      K.box(wu-2.0,wu+2.0,fr,fr+0.34,12.75,13.15,lime,0.8);
    }
    /* the corbel table and cornice along the front of the block */
    var lr=[K.P(-Cw,fr),K.P(Cw,fr),K.P(Cw,back),K.P(-Cw,back)]; if(ringArea(lr)<0) lr.reverse();
    lombardBand(M,lr,HT-1.9,lime,brick,1.2);
    K.box(-Cw-0.3,Cw+0.3,back,fr+0.35,HT-0.9,HT,lime,0.80);
    /* gable with its raked corbel arcade and a round window */
    K.gable(-Cw-0.3,Cw+0.3,fr+0.02,HT,AP,brick);
    K.gable(-Cw-0.3,Cw+0.3,back-0.02,HT,AP,brick);
    var NS=10;
    for(var sd2=-1;sd2<=1;sd2+=2){
      for(var q=0;q<NS;q++){
        var t=(q+0.5)/NS, uu=sd2*(Cw+0.3)*(1-t), yy=HT+(AP-HT)*t;
        var cp=K.P(uu,fr+0.12);
        archFace(M,cp[0],cp[1],F.dx,F.dz,0,0,yy-0.9,0.8,0.3,0.4,lime,1);
      }
      segBox(M,K.P(sd2*(Cw+0.4),fr+0.3),K.P(0,fr+0.3),HT,HT+0.12,0.3,lime,0.8);
    }
    for(var t3=0;t3<2;t3++){
      var E=K.P((t3?1:-1)*(Cw+0.5),fr+0.3), A=K.P(0,fr+0.3), cc=rgb(lime,1);
      var A1=[E[0],HT+0.1,E[1]], A2=[A[0],AP+0.4,A[1]];
      M.quad(A1,[A1[0],A1[1]+0.6,A1[2]],[A2[0],A2[1]+0.6,A2[2]],A2,cc,cc,cc,cc);
      M.quad(A2,[A2[0],A2[1]+0.6,A2[2]],[A1[0],A1[1]+0.6,A1[2]],A1,cc,cc,cc,cc);
    }
    K.disc(0,fr+0.04,HT+2.9,1.45,lime,22);
    K.disc(0,fr+0.07,HT+2.9,1.0,stain,22);
    K.roof(-Cw-0.7,Cw+0.7,fr+0.7,back-0.7,HT-0.05,AP+0.3,tile,tileD);
    addCollider(cb,HT);

    /* the limestone entrance porch */
    var Pw=7.0, pd=4.2, PH=12.0;
    var por=K.box(-Pw,Pw,fr-0.2,pd,0,PH,lime,0.66);
    K.box(-Pw-0.25,Pw+0.25,fr-0.2,pd+0.25,0,0.9,limeD,0.70);
    for(var bb=-1;bb<=1;bb+=2) K.box(bb*Pw-0.75,bb*Pw+0.75,pd-0.6,pd+0.35,0,PH+0.4,limeD,0.72);
    /* the deep moulded portal and the bronze doors */
    K.face(0,pd+0.02,0.9,7.4,4.9,3.7,limeD,1);
    K.face(0,pd+0.05,0.9,6.4,4.9,3.2,0xD5C9AF,1);
    K.face(0,pd+0.08,0.9,5.2,4.9,2.6,0x241E1A,1);
    K.face(0,pd+0.11,0.9,4.4,4.5,0,0x7A5A34,1);
    K.face(0,pd+0.13,0.9,0.12,4.5,0,0x4E3A22,1);
    for(var dp=0;dp<3;dp++) K.face(0,pd+0.13,1.8+dp*1.3,4.4,0.1,0,0x4E3A22,1);
    /* relief of The Learners over the arch, and the inscription */
    K.box(-3.4,3.4,pd,pd+0.14,9.9,11.6,limeD,0.78);
    K.face(-1.3,pd+0.16,10.1,0.7,1.1,0.35,0xB9AC91,1);
    K.face(1.3,pd+0.16,10.1,0.7,1.1,0.35,0xB9AC91,1);
    K.face(0,pd+0.16,10.4,1.4,0.6,0.7,0xA89A7E,1);
    var ip=K.P(0,pd+0.17);
    facadeText('WISE MEN LAY UP KNOWLEDGE',ip[0],ip[1],F.nx,F.nz,9.45,7.6,0.5,'#6A5A42');
    /* Shakespeare and Dante in their niches */
    var stoneM=new T.MeshLambertMaterial({color:0xD2C6AC,flatShading:true});
    for(var ns=-1;ns<=1;ns+=2){
      var nu=ns*5.0;
      K.face(nu,pd+0.03,2.3,1.7,2.9,0.85,0x8C7F68,1);
      K.box(nu-0.8,nu+0.8,pd,pd+0.5,1.8,2.3,limeD,0.8);
      var sp=K.P(nu,pd+0.3);
      var body=new T.Mesh(new T.CylinderGeometry(0.30,0.42,2.1,7),stoneM);
      body.position.set(sp[0],3.35,sp[1]); scene.add(body);
      var head=new T.Mesh(new T.SphereGeometry(0.2,7,5),stoneM);
      head.position.set(sp[0],4.6,sp[1]); scene.add(head);
    }
    /* cresting along the porch top */
    K.box(-Pw-0.2,Pw+0.2,fr-0.2,pd+0.2,PH,PH+0.35,limeD,0.8);
    for(var cu=-Pw+0.4;cu<=Pw-0.3;cu+=0.95) K.box(cu-0.2,cu+0.2,pd-0.1,pd+0.15,PH+0.35,PH+1.05,lime,0.8);
    addCollider(por,PH);
    /* lanterns either side of the doors */
    for(var ls=-1;ls<=1;ls+=2){
      var lp=K.P(ls*3.4,pd+0.45);
      var lan=new T.Mesh(new T.CylinderGeometry(0.22,0.15,0.65,6),new T.MeshLambertMaterial({color:0xE9C27A,emissive:0x5a3a10}));
      lan.position.set(lp[0],4.7,lp[1]); scene.add(lan);
    }
    /* keep the forecourt open so the front can be seen from the park */
    var fc=K.P(0,pd+11);
    B.noPlant=[oriRect(fc[0],fc[1],F.dx,F.dz,17,11)];
  }
  addCollider(ring,h);
  return h;
};

/* ---- ground base ----
   Far away it is one plain sheet. Across campus it is a finer grid whose
   vertex colour blends from street concrete into lawn wherever USC buildings
   are close, so the spaces between buildings read as planted grounds rather
   than a car park. The Coliseum's sunken bowl is cut out of both. */
var LAWN_MASK=null, LG={x0:-720,z0:-820,x1:800,z1:900,c:8};
var PLAZAS=[
  /* Hahn Plaza: Tommy Trojan, the fountain and Traveler */
  [[-14,-10],[22,-24],[54,20],[52,64],[30,78],[4,60],[-16,22]],
  /* the Campus Center terrace */
  (function(){ var r=[]; for(var i=0;i<18;i++){ var a=i/18*6.2832; r.push([-77+Math.cos(a)*21,50+Math.sin(a)*21]); } return r; })(),
  /* USC Village plaza */
  [[-40,-530],[24,-552],[60,-532],[92,-528],[84,-505],[62,-468],[45,-472],[0,-498]]
];
PLAZAS.forEach(function(r){ if(ringArea(r)<0) r.reverse(); });
function inPlaza(x,z){ for(var i=0;i<PLAZAS.length;i++) if(inRing(PLAZAS[i],x,z)) return true; return false; }
(function(){
  var W=4200, R=[LG.x0,LG.z0,LG.x1,LG.z1];
  /* the far sheet, with the campus rectangle left open */
  var outer=[[-W/2,-W/2],[W/2,-W/2],[W/2,W/2],[-W/2,W/2]],
      hole=[[R[0],R[1]],[R[2],R[1]],[R[2],R[3]],[R[0],R[3]]];
  var Mf=new Mesher();
  flatHoled(Mf,outer,[hole],0,C_BASE,0.96);
  var far=new T.Mesh(Mf.geom(),new T.MeshLambertMaterial({vertexColors:true,flatShading:true}));
  far.position.y=-0.07; scene.add(far);

  /* distance from each grid vertex to the nearest USC building */
  var nx=Math.round((LG.x1-LG.x0)/LG.c), nz=Math.round((LG.z1-LG.z0)/LG.c);
  var EH={}, EC=40;
  for(var b=0;b<CAMPUS.length;b++){
    var r=CAMPUS[b].ring;
    for(var e=0;e<r.length;e++){
      var a=r[e], q=r[(e+1)%r.length];
      var c0=Math.floor((Math.min(a[0],q[0])-EC)/EC), c1=Math.floor((Math.max(a[0],q[0])+EC)/EC),
          d0=Math.floor((Math.min(a[1],q[1])-EC)/EC), d1=Math.floor((Math.max(a[1],q[1])+EC)/EC);
      for(var cx=c0;cx<=c1;cx++) for(var cz=d0;cz<=d1;cz++){
        var k=cx+'_'+cz; (EH[k]||(EH[k]=[])).push([a[0],a[1],q[0],q[1]]);
      }
    }
  }
  function dist(x,z){
    var l=EH[Math.floor(x/EC)+'_'+Math.floor(z/EC)], best=1e9;
    if(!l) return best;
    for(var i=0;i<l.length;i++){
      var s2=l[i], dx=s2[2]-s2[0], dz=s2[3]-s2[1], L2=dx*dx+dz*dz||1e-9;
      var t=((x-s2[0])*dx+(z-s2[1])*dz)/L2; t=t<0?0:(t>1?1:t);
      var qx=s2[0]+dx*t-x, qz=s2[1]+dz*t-z, d=qx*qx+qz*qz;
      if(d<best) best=d;
    }
    return Math.sqrt(best);
  }
  LAWN_MASK=new Float32Array((nx+1)*(nz+1));
  var cBase=new T.Color(C_BASE), cL1=new T.Color(0x4C8534), cL2=new T.Color(0x62923D),
      cDry=new T.Color(0x9A9A6A), cc=new T.Color(), ct=new T.Color();
  var col=new Float32Array((nx+1)*(nz+1)*3);
  for(var j=0;j<=nz;j++) for(var i=0;i<=nx;i++){
    var x=LG.x0+i*LG.c, z=LG.z0+j*LG.c, d=dist(x,z);
    var m=d<20?1:(d>40?0:1-(d-20)/20); m=m*m*(3-2*m);
    LAWN_MASK[j*(nx+1)+i]=m;
    var n1=Math.sin(x*0.043+Math.cos(z*0.021)*2.1)*Math.cos(z*0.037-x*0.011);
    var n2=Math.sin(x*0.19+z*0.13)*Math.sin(z*0.23-x*0.07);
    var bv=0.90+0.08*n1+0.03*n2;
    cc.copy(cBase).multiplyScalar(bv);
    ct.copy(cL1).lerp(cL2,0.5+0.5*n1).multiplyScalar(0.94+0.06*n2);
    if(n1<-0.55) ct.lerp(cDry,(-n1-0.55)*0.6);
    cc.lerp(ct,m);
    col[(j*(nx+1)+i)*3]=cc.r; col[(j*(nx+1)+i)*3+1]=cc.g; col[(j*(nx+1)+i)*3+2]=cc.b;
  }
  var P=[],N=[],C=[];
  function V(i,j){ var k=j*(nx+1)+i; P.push(LG.x0+i*LG.c,0,LG.z0+j*LG.c); N.push(0,1,0);
    C.push(col[k*3],col[k*3+1],col[k*3+2]); }
  for(j=0;j<nz;j++) for(i=0;i<nx;i++){
    var x0=LG.x0+i*LG.c, z0=LG.z0+j*LG.c, x1=x0+LG.c, z1=z0+LG.c;
    if(inColHole(x0,z0)&&inColHole(x1,z0)&&inColHole(x0,z1)&&inColHole(x1,z1)) continue;
    V(i,j); V(i,j+1); V(i+1,j);  V(i+1,j); V(i,j+1); V(i+1,j+1);
  }
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(P,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
  g.setAttribute('color',new T.Float32BufferAttribute(C,3));
  g.computeBoundingSphere();
  var mesh=new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true}));
  mesh.position.y=-0.07; mesh.receiveShadow=true; scene.add(mesh);
  GROUND_MESHES.push(mesh,far);
})();
function lawnAt(x,z){
  if(!LAWN_MASK) return 0;
  var nx=Math.round((LG.x1-LG.x0)/LG.c);
  var i=Math.round((x-LG.x0)/LG.c), j=Math.round((z-LG.z0)/LG.c);
  if(i<0||j<0||i>nx||j>Math.round((LG.z1-LG.z0)/LG.c)) return 0;
  return LAWN_MASK[j*(nx+1)+i];
}

/* ---- green areas, water, roads, paths (one merged ground mesh) ---- */
var NAMED_PLACES=[];
(function(){
  var M=new Mesher();
  for(var i=0;i<AREAS.length;i++){
    var a=AREAS[i];
    var acol=a.k==='p'?C_PITCH:(a.k==='w'?0x3F7A32:C_GRASS), ash=a.k==='g'?rr(0.92,1.06):1;
    if(ringHasHole(a.ring)) flatHoled(M,a.ring,[COL_HOLE],0.02,acol,ash);
    else flat(M,a.ring,0.02,acol,ash);
  }
  for(i=0;i<PARKS.length;i++){
    if(ringHasHole(PARKS[i].ring)) flatHoled(M,PARKS[i].ring,[COL_HOLE],0.03,C_GRASS,rr(0.94,1.04));
    else flat(M,PARKS[i].ring,0.03,C_GRASS,rr(0.94,1.04));
    var ctr=centroid(PARKS[i].ring);
    NAMED_PLACES.push({name:PARKS[i].name,x:ctr[0],z:ctr[1],park:true});
  }
  /* paved plazas: warm concrete inside a brick band */
  for(i=0;i<PLAZAS.length;i++){
    var pl=PLAZAS[i], plo=pl.slice(); plo.push(pl[0]);
    flat(M,pl,0.036,0xB1AB9D,1);
    ribbon(M,plo,1.2,0.040,0x8F4E3C,0.95);
    /* brick bands scoring the paving on the campus grid */
    var gu=[0.883,0.469], gv=[-0.469,0.883];
    for(var ax=0;ax<2;ax++){
      var dA=ax?gv:gu, dB=ax?gu:gv;
      for(var off=-120;off<=120;off+=7.5){
        var run=null;
        for(var tt=-120;tt<=120;tt+=1){
          var bx=dB[0]*off+dA[0]*tt+15, bz=dB[1]*off+dA[1]*tt+25;
          if(pl===PLAZAS[1]){ bx+=-92; bz+=25; }
          if(pl===PLAZAS[2]){ bx+=10; bz+=-535; }
          var ins=inRing(pl,bx,bz)&&inRing(pl,bx+dB[0]*1.3,bz+dB[1]*1.3)&&inRing(pl,bx-dB[0]*1.3,bz-dB[1]*1.3);
          if(ins){ if(!run) run=[[bx,bz],[bx,bz]]; else run[1]=[bx,bz]; }
          else if(run){ if(Math.hypot(run[1][0]-run[0][0],run[1][1]-run[0][1])>2) ribbon(M,run,0.35,0.039,0xA48878,0.95); run=null; }
        }
        if(run&&Math.hypot(run[1][0]-run[0][0],run[1][1]-run[0][1])>2) ribbon(M,run,0.35,0.039,0xA48878,0.95);
      }
    }
  }
  for(i=0;i<WATER.length;i++) flat(M,WATER[i],0.08,C_WATER,1);
  for(i=0;i<ROADS.length;i++){
    ribbon(M,ROADS[i].pts,ROADS[i].w+2.6,0.045,0xB3ADA0,0.96);     /* kerb and gutter */
    ribbon(M,ROADS[i].pts,ROADS[i].w,0.07,C_ROAD,ROADS[i].w>10?1:0.94);
  }
  /* ---- the walks, built the way USC actually lays them:
     a scored concrete centre inside a running-bond brick border, with a
     darker soldier course at the outer edge ---- */
  var C_BRK=0x8F4E3C, C_WALK=0xC8C2B2;
  function walkway(M,pts,cw,bw,sh){
    ribbon(M,pts,cw+bw*2,0.100,C_BRK,sh);     /* the brick border */
    ribbon(M,pts,cw,0.132,C_WALK,sh);         /* the plain concrete centre */
  }
  for(i=0;i<PATHS.length;i++){
    var pw=PATHS[i].w, sh=0.95+((i*37)%9)*0.012;
    if(pw>6)        walkway(M,PATHS[i].pts,pw*1.5+2.3,1.2,sh);
    else if(pw>=2.5) walkway(M,PATHS[i].pts,pw*1.3+1.0,0.62,sh);
    else            ribbon(M,PATHS[i].pts,pw*1.2,0.10,C_PATH,sh);
  }
  var mesh=new T.Mesh(M.geom(),matGround);
  mesh.frustumCulled=false; scene.add(mesh);
})();

function centroid(ring){ var x=0,z=0;
  for(var i=0;i<ring.length;i++){x+=ring[i][0];z+=ring[i][1];}
  return [x/ring.length,z/ring.length]; }

/* ---- buildings, chunked so frustum culling works ---- */
var CHUNK=190, chunks={};
function chunkAt(x,z){ var k=gkey(Math.floor(x/CHUNK),Math.floor(z/CHUNK));
  return chunks[k]||(chunks[k]=new Mesher()); }

/* the point inside a footprint furthest from any wall - where a tower belongs */
function innerPoint(ring){
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,i;
  for(i=0;i<ring.length;i++){ var p=ring[i];
    if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<z0)z0=p[1]; if(p[1]>z1)z1=p[1]; }
  var best=[(x0+x1)/2,(z0+z1)/2], bd=-1;
  for(var gx=1;gx<14;gx++) for(var gz=1;gz<14;gz++){
    var x=x0+(x1-x0)*gx/14, z=z0+(z1-z0)*gz/14;
    if(!inRing(ring,x,z)) continue;
    var d=1e9;
    for(i=0;i<ring.length;i++){
      var a=ring[i], b=ring[(i+1)%ring.length];
      var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz||1e-9;
      var t=((x-a[0])*dx+(z-a[1])*dz)/L2; t=t<0?0:(t>1?1:t);
      var qx=a[0]+dx*t-x, qz=a[1]+dz*t-z;
      var dd=qx*qx+qz*qz; if(dd<d) d=dd;
    }
    if(d>bd){ bd=d; best=[x,z]; }
  }
  return {p:best, r:Math.sqrt(Math.max(bd,0))};
}

(function(){
  var i,k;
  /* ---------- USC campus buildings ---------- */
  /* how far the footprint reaches from its middle in a given direction */
  function reach(ring,cx,cz,dx,dz){
    var d=2;
    while(d<140&&inRing(ring,cx+dx*d,cz+dz*d)) d+=1.5;
    return d;
  }
  var ARCADED_NEW={'Tutor Campus Center':1,'Steven and Kathryn Sample Hall':1,'Popovich Hall':1};
  var ARCADED={'Mudd Hall':1,'Bovard Administration Building':1,
               'Dr. Joseph Medicine Crow Center for International and Public Affairs':1,
               'Physical Education Building':1};
  for(i=0;i<CAMPUS.length;i++){
    var B=CAMPUS[i], ring=B.ring, h=B.h, st=B.st, d=ringDims(ring);
    var c=centroid(ring); B.cx=c[0]; B.cz=c[1];
    var M=chunkAt(c[0],c[1]);
    var v=0.90+((i*67)%11)*0.020;
    _c.setHex(st==='v'?C_BRICK[1]:(st==='b'?0xA85A42:C_BRICK[0]));
    var brick=_c.clone().multiplyScalar(v).getHex();
    var modBase=[0xD9D1BE,0xCFC4AA,0xE0DACB][i%3];
    _c.setHex(modBase); var mod=_c.clone().multiplyScalar(v).getHex();

    if(CUSTOM[B.name]){
      h=CUSTOM[B.name](M,B,ring,c,d)||h;
      B.h=h;
    } else if(st==='d'){
      prism(M,ring,0,h,C_DECK,C_DECK,0.55);
      deck(M,ring,h);
      band(M,ring,h,h+0.9,0.18,C_DECK,0.9,0.7);
    } else if(st==='t'||st==='r'){
      /* the brick core: cast stone base, arched windows, ivy, corbelled cornice */
      prism(M,ring,0,h,brick,brick,0.50);
      band(M,ring,0,1.55,0.24,C_CAST,0.95,0.70);
      if(ARCADED[B.name]) arcade(M,ring,1.6,4.6,C_GLASSD);
      archedWindows(M,ring,h, ARCADED[B.name]?7.4:2.8, 4.9, 3.05, 5.6, C_GLASSD);
      ivy(M,ring,Math.min(4.6,h*0.26),i);
      if(st==='r'){
        band(M,ring,h-1.1,h-0.2,0.26,C_CAST,1,0.80);
        var eave=offsetRing(simplifyRing(ring,2.4),1.25);
        band(M,eave,h,h+0.55,0,C_TILE_D,0.85,0.5);
        var rise=Math.max(2.8,Math.min(6.2,d.min*0.24));
        hipRoof(M,eave,h+0.55,rise,Math.min(rise*1.2,d.min*0.34),C_TILE);
      } else {
        cornice(M,ring,h);
      }
    } else if(st==='v'||st==='g'){
      var isV=(st==='v');
      prism(M,ring,0,h,isV?brick:mod,isV?brick:mod,0.52);
      if(isV){
        band(M,ring,0,1.25,0.22,C_CAST,0.95,0.70);
        archedWindows(M,ring,h,2.4,4.2,2.6,4.8,C_GLASSD);
        ivy(M,ring,Math.min(4.2,h*0.24),i+3);
      } else {
        punched(M,ring,h,C_GLASS,1.0,3.5,2.1,3.2);
      }
      var e2=offsetRing(simplifyRing(ring,2.2),0.75);
      band(M,e2,h,h+0.4,0,isV?C_SLATE_D:C_TILE_D,0.85,0.55);
      var r2=isV?Math.max(3.0,Math.min(7.2,d.min*0.26)):Math.max(2.4,Math.min(5.6,d.min*0.36));
      hipRoof(M,e2,h+0.4,r2,Math.min(r2*0.82,d.min*0.32),isV?C_SLATE:C_TILE);
    } else if(st==='b'){
      /* brick with cast stone base, surrounds, quoins and cornice */
      prism(M,ring,0,h,brick,brick,0.52);
      band(M,ring,0,1.75,0.24,C_CAST,0.98,0.74);
      if(ARCADED_NEW[B.name]) arcade(M,ring,1.85,5.0,C_GLASSD);
      else if(h>=9) sqWindows(M,ring,Math.min(h,6.4),2.1,4.2,2.6,2.3,4.4,C_GLASSD);
      sqWindows(M,ring,h,ARCADED_NEW[B.name]?8.2:7.2,4.0,2.35,1.95,3.9,C_GLASSD);
      if(d.min>11) quoins(M,ring,h,0.95);
      cornice(M,ring,h);
    } else {
      /* warm precast concrete with real piers between the openings */
      prism(M,ring,0,h,mod,mod,0.54);
      band(M,ring,0,0.95,0.15,C_MOD_D,0.92,0.68);
      if(ARCADED[B.name]) arcade(M,ring,0.9,5.6,C_GLASSD);
      else if(h>=9){
        punched(M,ring,5.0,0x333A41,1.15,4.4,3.2,4.0);
        band(M,ring,5.0,5.75,0.32,0xEAE4D6,1,0.72,true);
      }
      sqWindows(M,ring,h,h>=9?6.6:2.2,3.9,2.25,1.85,3.5,0x46525C);
      band(M,ring,h-0.8,h+1.05,0.28,0xEAE4D6,1,0.74,true);
      band(M,ring,h+1.05,h+1.25,0.18,0xEAE4D6,0.9,0.72);
      flat(M,offsetRing(ring,-0.5),h+1.29,0x55564F,1);
    }

    /* clipped hedge along the frontage, on most of the campus buildings */
    if(st!=='d'&&d.min>9&&(i%10)<7){
      var hedge=offsetRing(simplifyRing(ring,2.6),1.9);
      band(M,hedge,0,0.66,0,0x3C6B33,1,0.62);
    }

    var colH=h;
    if(B.tower&&!CUSTOM[B.name]){
      var ip=innerPoint(ring), tw=Math.min(B.tower.w, Math.max(3.5, ip.r*1.75));
      /* push the tower toward the side of the building that faces campus */
      var tx=ip.p[0], tz=ip.p[1];
      var gx=-tx, gz=-tz, gL=Math.hypot(gx,gz)||1; gx/=gL; gz/=gL;
      var slide=Math.max(0, ip.r-tw*0.5-1.2);
      if(slide>0.5&&inRing(ring,tx+gx*slide,tz+gz*slide)){ tx+=gx*slide*0.75; tz+=gz*slide*0.75; }
      var ty=h+B.tower.dh;
      towerAt(M, tx, tz, tw, ty, B.tower.st, st==='f'?mod:brick);
      var hwt=tw/2;
      addCollider([[tx-hwt,tz-hwt],[tx+hwt,tz-hwt],[tx+hwt,tz+hwt],[tx-hwt,tz+hwt]], ty);
      B.towerTop=ty;
    }
    if(!CUSTOM[B.name]) B.col=addCollider(ring,colH);
    if(B.name) NAMED_PLACES.push({name:B.name,x:c[0],z:c[1],h:h,rad:d.min/2+Math.max(d.w,d.d)/2*0.5,campus:1});
  }

  /* ---------- surrounding city (OpenStreetMap) ---------- */
  for(i=0;i<BUILDINGS.length;i++){
    var O=BUILDINGS[i], c2=centroid(O.ring);
    O.cx=c2[0]; O.cz=c2[1];
    if(O.hand) continue;
    var M2=chunkAt(c2[0],c2[1]);
    var pal=PAL[O.cls]||PAL.o;
    var v2=0.90+((i*67)%11)*0.019;
    _c.setHex(pal[0]); var side=_c.clone().multiplyScalar(v2).getHex();
    _c.setHex(pal[1]); var top=_c.clone().multiplyScalar(v2).getHex();
    if(O.cls==='p'){
      prism(M2,O.ring,0,O.h,C_DECK,C_DECK,0.55); deck(M2,O.ring,O.h);
      band(M2,O.ring,O.h,O.h+0.8,0.16,C_DECK,0.9,0.7);
    } else if(O.cls==='r' && O.h<14){
      prism(M2,O.ring,0,O.h,side,top,0.52);
      punched(M2,O.ring,O.h,0x3F4C57,0.8,3.4,1.9,3.4);
      var dr=ringDims(O.ring);
      var e3=offsetRing(simplifyRing(O.ring,1.6),0.6);
      band(M2,e3,O.h,O.h+0.3,0,C_TILE_D,0.8,0.5);
      var r3=Math.max(1.6,Math.min(4.0,dr.min*0.30));
      hipRoof(M2,e3,O.h+0.3,r3,Math.min(r3*0.85,dr.min*0.32),(i%3)?C_TILE:0x8E7F6C);
    } else {
      prism(M2,O.ring,0,O.h,side,top,0.52);
      windows(M2,O.ring,O.h, O.cls==='u'?0x4C5A66:0x53616E);
      if(O.h>7) band(M2,O.ring,O.h,O.h+0.7,0.12,top,0.95,0.75);
    }
    O.col=addCollider(O.ring,O.h);
    if(O.name) NAMED_PLACES.push({name:O.name,x:c2[0],z:c2[1],h:O.h,rad:ringDims(O.ring).min/2+8});
  }

  for(k in chunks){
    var m=new T.Mesh(chunks[k].geom(),matWorld);
    m.userData.chunk=k; scene.add(m);
  }
})();

/* naive inward offset (used only for cosmetic lips) */
function offsetRing(ring,d){
  var n=ring.length,out=new Array(n);
  for(var i=0;i<n;i++){
    var p=ring[i],a=ring[(i-1+n)%n],b=ring[(i+1)%n];
    var d1x=p[0]-a[0],d1z=p[1]-a[1],L1=Math.hypot(d1x,d1z)||1;
    var d2x=b[0]-p[0],d2z=b[1]-p[1],L2=Math.hypot(d2x,d2z)||1;
    var nx=((d1z/L1)+(d2z/L2))*0.5, nz=(-(d1x/L1)-(d2x/L2))*0.5;
    var L=Math.hypot(nx,nz)||1;
    out[i]=[p[0]+nx/L*d,p[1]+nz/L*d];
  }
  return out;
}

/* ================================================== shared solid primitives */
/* a box running along a segment - rails, kerbs, mullions, copings */
function segBox(M,a,b,y0,y1,w,col,shade){
  var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz); if(L<0.004) return;
  dx/=L; dz/=L;
  var ex=dx*w*0.5, ez=dz*w*0.5, nx=-dz*w*0.5, nz=dx*w*0.5;
  var ax=a[0]-ex, az=a[1]-ez, bx=b[0]+ex, bz=b[1]+ez;
  var r=[[ax+nx,az+nz],[bx+nx,bz+nz],[bx-nx,bz-nz],[ax-nx,az-nz]];
  if(ringArea(r)<0) r.reverse();
  prism(M,r,y0,y1,col,col,shade===undefined?0.62:shade);
}
function postAt(M,x,z,y0,y1,w,col,shade){
  var r=[[x-w,z-w],[x+w,z-w],[x+w,z+w],[x-w,z+w]];
  if(ringArea(r)<0) r.reverse();
  prism(M,r,y0,y1,col,col,shade===undefined?0.62:shade);
}
function oriRect(cx,cz,ux,uz,hu,hv){
  var vx=-uz,vz=ux;
  var p=[[cx-ux*hu-vx*hv,cz-uz*hu-vz*hv],[cx+ux*hu-vx*hv,cz+uz*hu-vz*hv],
         [cx+ux*hu+vx*hv,cz+uz*hu+vz*hv],[cx-ux*hu+vx*hv,cz-uz*hu+vz*hv]];
  if(ringArea(p)<0) p.reverse();
  return p;
}
function oriBox(M,cx,cz,ux,uz,hu,hv,y0,y1,col,shade){
  prism(M,oriRect(cx,cz,ux,uz,hu,hv),y0,y1,col,col,shade===undefined?0.6:shade);
}
/* two sided wall of thickness t following a ring */
function wallAlong(M,ring,y0,y1,t,col,shade,open){
  var n=ring.length, lim=open?n-1:n;
  for(var i=0;i<lim;i++) segBox(M,ring[i],ring[(i+1)%n],y0,y1,t,col,shade);
}
/* longest edge of a ring, as a unit direction */
function longAxisOf(r){
  var best=0,bx=1,bz=0,n=r.length;
  for(var i=0;i<n;i++){ var j=(i+1)%n;
    var dx=r[j][0]-r[i][0], dz=r[j][1]-r[i][1], L=Math.hypot(dx,dz);
    if(L>best){ best=L; bx=dx/L; bz=dz/L; } }
  return [bx,bz,best];
}

/* ====================================================== a proper fountain
   Stone basin with a moulded coping, a pedestal carrying one or two bowls,
   a falling sheet of water off each rim and a ring of jets in the basin.
   Works from any polygon, so the OSM fountain footprints keep their shape. */
function fountainRing(M,MG,ring,tiers,lift){
  var A=Math.abs(ringArea(ring)); if(A<3) return;
  var c=centroid(ring), R=Math.sqrt(A/Math.PI), y0=lift||0;
  var outer=offsetRing(ring,0.34), inner=offsetRing(ring,-0.52);
  var wallH=y0+(R>4?0.66:0.50), waterY=wallH-0.20;
  /* paved apron so the fountain sits in something */
  flat(MG,offsetRing(ring,Math.min(3.4,R*0.55+1.2)),y0+0.10,0xC6BFAF,1);
  flat(MG,offsetRing(ring,0.9),y0+0.12,0xB4AC99,1);
  /* skirt, moulding, coping, inner face */
  band(M,outer,y0,wallH-0.16,0,C_STONE,1,0.58,true);
  band(M,offsetRing(ring,0.50),wallH-0.16,wallH,0,0xEDE6D4,1,0.80,true);
  var cop=offsetRing(ring,0.50), cin=inner;
  for(var i=0;i<cop.length;i++){
    var j=(i+1)%cop.length, cc=rgb(0xEDE6D4,1);
    M.quad([cop[i][0],wallH,cop[i][1]],[cin[i][0],wallH,cin[i][1]],
           [cin[j][0],wallH,cin[j][1]],[cop[j][0],wallH,cop[j][1]],cc,cc,cc,cc);
  }
  band(M,inner.slice().reverse(),y0+0.06,wallH,0,0x968F80,0.86,0.46,true);
  flat(MG,inner,waterY,0x2C84C6,1);
  flat(MG,offsetRing(ring,-1.9),waterY-0.012,0x1D6EAA,1);
  addCollider(outer,wallH);
  if(tiers===0){                                /* reflecting pool: a line of low jets */
    var la=longAxisOf(ring), cnt=Math.max(2,Math.floor(la[2]/2.6));
    for(i=0;i<cnt;i++){
      var tt=(i+0.5)/cnt-0.5;
      FOUNT_JETS.push([c[0]+la[0]*la[2]*0.84*tt, c[1]+la[1]*la[2]*0.84*tt, waterY+0.02, 1.0, 0.28]);
    }
    return;
  }
  /* the pedestal and its bowls */
  if(R>=1.9){
    var pw=Math.max(0.55,R*0.17), bw=Math.max(1.05,R*0.46);
    var ph=waterY+Math.max(0.85,R*0.36);
    band(M,ngon(c[0],c[1],pw*1.5,14,0),waterY,waterY+0.20,0,C_STONE,1,0.66,true);
    band(M,ngon(c[0],c[1],pw,14,0),waterY+0.20,ph,0,C_STONE,1,0.68,true);
    band(M,ngon(c[0],c[1],pw*1.35,14,0),ph,ph+0.16,0,C_STONE,1,0.72,true);
    band(M,ngon(c[0],c[1],bw,24,0),ph+0.16,ph+0.16+Math.max(0.30,R*0.11),0,C_STONE,1,0.70,true);
    var bt=ph+0.16+Math.max(0.30,R*0.11);
    band(M,ngon(c[0],c[1],bw*1.03,24,0),bt,bt+0.13,0,0xEDE6D4,1,0.84,true);
    flat(M,ngon(c[0],c[1],bw*0.96,24,0),bt+0.10,0x3F93C9,1);
    FOUNT_SHEETS.push([c[0],c[1],bw*1.04,bw*1.12,(bt+0.13)-waterY,(waterY+bt+0.13)*0.5]);
    FOUNT_JETS.push([c[0],c[1],bt+0.12,Math.max(1.0,R*0.44),Math.max(1.0,R*0.22)]);
    var topY=bt;
    if(tiers>1){
      var uw=bw*0.46, uh=bt+Math.max(0.95,R*0.34);
      band(M,ngon(c[0],c[1],pw*0.72,12,0),bt+0.13,uh,0,C_STONE,1,0.70,true);
      band(M,ngon(c[0],c[1],uw,18,0),uh,uh+0.24,0,C_STONE,1,0.72,true);
      band(M,ngon(c[0],c[1],uw*1.04,18,0),uh+0.24,uh+0.35,0,0xEDE6D4,1,0.84,true);
      flat(M,ngon(c[0],c[1],uw*0.95,18,0),uh+0.32,0x3F93C9,1);
      FOUNT_SHEETS.push([c[0],c[1],uw*1.05,uw*1.14,(uh+0.35)-(bt+0.13),(uh+0.35+bt+0.13)*0.5]);
      FOUNT_JETS.push([c[0],c[1],uh+0.34,Math.max(1.1,R*0.50),Math.max(0.9,R*0.18)]);
      topY=uh;
    }
    /* jets standing in the basin, angled in toward the bowl */
    var nj=R>5?10:(R>3?8:6);
    for(i=0;i<nj;i++){
      var a2=i/nj*6.283185+0.3;
      FOUNT_JETS.push([c[0]+Math.cos(a2)*R*0.72, c[1]+Math.sin(a2)*R*0.72, waterY+0.02,
                       Math.max(0.7,R*0.34+0.25*Math.abs(Math.sin(i*1.7))), Math.max(0.5,R*0.10)]);
    }
  } else {
    FOUNT_JETS.push([c[0],c[1],waterY+0.02,Math.max(0.8,R*1.15),Math.max(0.45,R*0.24)]);
  }
}

/* ---- stadium bowls (Coliseum, BMO, Galen ring, tennis) ---- */
(function(){
  var M=new Mesher();
  for(var s=0;s<STADIA.length;s++){
    if(STADIA[s].name==='Los Angeles Memorial Coliseum') continue;
    var ring=STADIA[s].ring;
    var ctr=centroid(ring), big=0;
    for(var i=0;i<ring.length;i++) big=Math.max(big,Math.hypot(ring[i][0]-ctr[0],ring[i][1]-ctr[1]));
    if(big<40) continue;
    var band=Math.min(26,Math.max(12,big*0.20));
    var inner=offsetRing(ring,-band);
    var hOut=big>150?31:22, hIn=hOut*0.30;
    var cOut=rgb(0xC8BCA2,1), cOutD=rgb(0xC8BCA2,0.6),
        cSt=rgb(0xB0A48B,0.95), cInn=rgb(0x8E8570,0.82);
    var n=ring.length;
    for(i=0;i<n;i++){
      var j=(i+1)%n, a=ring[i], b=ring[j], ai=inner[i], bi=inner[j];
      /* outer face */
      M.quad([a[0],0,a[1]],[a[0],hOut,a[1]],[b[0],hOut,b[1]],[b[0],0,b[1]],cOutD,cOut,cOut,cOutD);
      /* raked seating */
      M.quad([a[0],hOut,a[1]],[ai[0],hIn,ai[1]],[bi[0],hIn,bi[1]],[b[0],hOut,b[1]],cSt,cInn,cInn,cSt);
      /* inner face down to field */
      M.quad([ai[0],hIn,ai[1]],[ai[0],0.4,ai[1]],[bi[0],0.4,bi[1]],[bi[0],hIn,bi[1]],cInn,cInn,cInn,cInn);
      /* collider: one convex quad prism per band segment */
      addCollider([[a[0],a[1]],[b[0],b[1]],[bi[0],bi[1]],[ai[0],ai[1]]],hOut);
    }
    windows(M,ring,hOut,0x8C8474);
    flat(M,inner,0.35, big>150?C_TRACK:C_PITCH, 1);
    var fld=offsetRing(inner,-9);
    if(fld) flat(M,fld,0.45,C_PITCH,1.04);
    if(STADIA[s].name) NAMED_PLACES.push({name:STADIA[s].name,x:ctr[0],z:ctr[1],h:hOut,rad:big});
  }
  var mesh=new T.Mesh(M.geom(),matWorld); mesh.frustumCulled=false; scene.add(mesh);
})();

/* ==================================================================
   Athletics: the track, the playing fields and the aquatics centre.
   These come straight from the OSM ways because the campus footprint
   list drops sports facilities.
   ================================================================== */
var SPORT_PLACES=[], NO_PLANT=[
  [[COL.xp,COL.cz-52],[COL.xp+58,COL.cz-52],[COL.xp+58,COL.cz+52],[COL.xp,COL.cz+52]]
];
/* the libraries keep their walls and forecourts clear of trees */
(function(){
  for(var i=0;i<CAMPUS.length;i++){ var B=CAMPUS[i];
    if(B.name!=='Leavey Library'&&B.name!=='Doheny Memorial Library') continue;
    var o=offsetRing(simplifyRing(B.ring,2.5),B.name==='Leavey Library'?11:6.5);
    if(o) NO_PLANT.push(o);
    if(B.noPlant) for(var k=0;k<B.noPlant.length;k++) NO_PLANT.push(B.noPlant[k]);
  }
  for(i=0;i<WATER.length;i++){ var la=longAxisOf(WATER[i]), A=Math.abs(ringArea(WATER[i]));
    if(la[2]>12&&A/la[2]<la[2]/3){ var ow=offsetRing(WATER[i],6); if(ow) NO_PLANT.push(ow); } }
})();
/* the Natural History Museum (a2d_nhm.js) is not a collider yet when the props go
   down, so keep its walls, the annex and both forecourts clear by hand */
if(NHM){
  NO_PLANT.push(offsetRing(NHM.ring,2.5),
    [[-343,438],[-286,438],[-286,468],[-343,468]],[[-218,369],[-198,369],[-198,397],[-218,397]]);
  if(NHM_ANNEX) NO_PLANT.push(offsetRing(NHM_ANNEX.ring,1.5));
}
/* and the same for the Science Center complex (a2e_sci.js): walls, terrace, steps, plaza */
if(SCI.main){
  NO_PLANT.push(offsetRing(SCI.main.ring,2.5),[[-215,465],[-156,465],[-156,559],[-215,559]],
    [[-152,546],[-40,546],[-40,586],[-152,586]],[[-104,452],[-96,452],[-96,466],[-104,466]],
    [[-84,464],[-40,464],[-40,475],[-84,475]]);
  if(SCI.imax) NO_PLANT.push(offsetRing(SCI.imax.ring,2.5));
  if(SCI.caam) NO_PLANT.push(offsetRing(SCI.caam.ring,2.5),[[122,528],[142,528],[142,552],[122,552]]);
}
(function(){
  var FELIX=decode('-284,-146 -9,-6 -6,-8 -4,-10 0,-10 4,-10 6,-8 9,-6 10,-3 10,1 10,4 86,46 8,7 5,9 2,10 -1,11 -5,9 -8,7 -10,4 -10,1 -11,-3');
  var BRIT =decode('-272,-243 17,-33 78,41 -17,33');
  var JONES=decode('-370,-255 31,-59 -4,-10 -5,-2 3,-14 -3,-4 10,-29 84,42 -56,107');
  var KENN =decode('-405,-204 24,-45 11,-6 60,31 -30,55');
  var DEDX =decode('-422,-308 -3,2 -60,-39 -2,-12 2,-6 3,-9 19,-30 8,-7 12,-5 30,-11 2,0 27,10 32,14 -1,21 -18,55 -2,4 -5,15 -1,3 -4,4 -3,3 -5,2 -5,1 -5,0 -5,-2');
  var MCAL =decode('177,-656 29,-54 2,0 3,-7 68,36 1,-1 35,17 -35,63');
  var POOL =decode('-323,-407 45,24 -11,20 -45,-24');

  var C_TURF=0x4FA33E, C_LINE=0xF3F2EC, C_RUBBER=0xB0523F, C_DIRT=0xA9784A,
      C_FENCE=0x26282C, C_CARD=0x8E1B2A, C_GOLD=0xE9C04A, C_POOLW=0x1E7FC4;

  var MG=new Mesher();      /* ground decals   -> matGround */
  var MW=new Mesher();      /* upright objects -> matWorld  */

  /* ---------------- small geometry helpers ---------------- */
  function ctr(r){ var x=0,z=0; for(var i=0;i<r.length;i++){x+=r[i][0];z+=r[i][1];} return [x/r.length,z/r.length]; }
  function axisOf(r){
    var best=0,bx=1,bz=0,n=r.length;
    for(var i=0;i<n;i++){ var j=(i+1)%n;
      var dx=r[j][0]-r[i][0], dz=r[j][1]-r[i][1], L=Math.hypot(dx,dz);
      if(L>best){ best=L; bx=dx/L; bz=dz/L; } }
    return [bx,bz,best];
  }
  function ext(r,c,ux,uz){
    var hu=0,hv=0;
    for(var i=0;i<r.length;i++){
      var dx=r[i][0]-c[0], dz=r[i][1]-c[1];
      var u=Math.abs(dx*ux+dz*uz), v=Math.abs(-dx*uz+dz*ux);
      if(u>hu)hu=u; if(v>hv)hv=v;
    }
    return [hu,hv];
  }
  function rectR(c,ux,uz,hu,hv){
    var vx=-uz,vz=ux;
    var p=[[c[0]-ux*hu-vx*hv,c[1]-uz*hu-vz*hv],
           [c[0]+ux*hu-vx*hv,c[1]+uz*hu-vz*hv],
           [c[0]+ux*hu+vx*hv,c[1]+uz*hu+vz*hv],
           [c[0]-ux*hu+vx*hv,c[1]-uz*hu+vz*hv]];
    if(ringArea(p)<0) p.reverse();
    return p;
  }
  function loopOf(r){ var o=r.slice(); o.push(r[0]); return o; }
  function lineR(M,r,w,y,col){ ribbon(M,loopOf(r),w,y,col,1); }
  function seg(M,a,b,w,y,col){ ribbon(M,[a,b],w,y,col,1); }

  /* a solid box running along a segment - rails, ropes, kerbs, frames */
  function bar(M,a,b,y0,y1,w,col,shade){
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz); if(L<0.004) return;
    dx/=L; dz/=L;
    var ex=dx*w*0.5, ez=dz*w*0.5, nx=-dz*w*0.5, nz=dx*w*0.5;
    var ax=a[0]-ex, az=a[1]-ez, bx=b[0]+ex, bz=b[1]+ez;
    var r=[[ax+nx,az+nz],[bx+nx,bz+nz],[bx-nx,bz-nz],[ax-nx,az-nz]];
    if(ringArea(r)<0) r.reverse();
    prism(M,r,y0,y1,col,col,shade===undefined?0.62:shade);
  }
  function post(M,x,z,y0,y1,w,col,shade){
    var r=[[x-w,z-w],[x+w,z-w],[x+w,z+w],[x-w,z+w]];
    if(ringArea(r)<0) r.reverse();
    prism(M,r,y0,y1,col,col,shade===undefined?0.62:shade);
  }
  function boxAt(M,cx,cz,ux,uz,hu,hv,y0,y1,col,shade){
    prism(M,rectR([cx,cz],ux,uz,hu,hv),y0,y1,col,col,shade===undefined?0.6:shade);
  }
  /* two-sided wall of thickness t following a ring */
  function wallRing(M,ring,y0,y1,t,col,shade){
    for(var i=0;i<ring.length;i++) bar(M,ring[i],ring[(i+1)%ring.length],y0,y1,t,col,shade);
  }
  /* chain link: posts and rails, so you can still see the field through it */
  function railFence(M,ring,y0,h,col,closed){
    var n=ring.length, lim=closed===false?n-1:n;
    for(var i=0;i<lim;i++){
      var a=ring[i], b=ring[(i+1)%n];
      var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<0.4) continue;
      bar(M,a,b,y0+h-0.10,y0+h,0.09,col,0.8);
      bar(M,a,b,y0+h*0.52,y0+h*0.52+0.07,0.07,col,0.8);
      bar(M,a,b,y0+0.10,y0+0.17,0.07,col,0.8);
      var np=Math.max(1,Math.round(L/3.2));
      for(var k=0;k<=np;k++){
        var t=k/np;
        post(M,a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, y0, y0+h, 0.075, col,0.7);
      }
    }
  }
  function lightMast(M,x,z,h){
    post(M,x,z,0,1.3,0.46,0x9A958A,0.6);
    post(M,x,z,0,h,0.23,0xD3CFC4,0.62);
    var r=[[x-2.9,z-0.55],[x+2.9,z-0.55],[x+2.9,z+0.55],[x-2.9,z+0.55]];
    if(ringArea(r)<0) r.reverse();
    prism(M,r,h,h+0.5,0x3A3C40,0x3A3C40,0.7);
    for(var k=-2;k<=2;k++) post(M,x+k*1.15,z,h+0.5,h+1.15,0.34,0xF7F2DE,0.92);
    addCollider([[x-0.6,z-0.6],[x+0.6,z-0.6],[x+0.6,z+0.6],[x-0.6,z+0.6]],h);
  }
  /* raked seating running along a-b, stepping out along (nx,nz) */
  function stand(M,a,b,nx,nz,depth,rows,shell,seatC){
    for(var r=0;r<rows;r++){
      var o0=depth*r/rows, o1=depth*(r+1)/rows, y=0.55+r*0.44;
      var q=[[a[0]+nx*o0,a[1]+nz*o0],[b[0]+nx*o0,b[1]+nz*o0],
             [b[0]+nx*o1,b[1]+nz*o1],[a[0]+nx*o1,a[1]+nz*o1]];
      if(ringArea(q)<0) q.reverse();
      prism(M,q,0,y,shell,r%2?seatC:0x9C9488,0.58);
    }
    var foot=[[a[0],a[1]],[b[0],b[1]],[b[0]+nx*depth,b[1]+nz*depth],[a[0]+nx*depth,a[1]+nz*depth]];
    if(ringArea(foot)<0) foot.reverse();
    addCollider(foot,0.55+rows*0.44);
  }
  function goalFrame(M,cx,cz,ux,uz,halfW,h){
    var vx=-uz, vz=ux;
    for(var s=-1;s<=1;s+=2){
      post(M,cx+vx*halfW*s,cz+vz*halfW*s,0,h,0.09,0xF2F2EE,0.9);
    }
    bar(M,[cx-vx*halfW,cz-vz*halfW],[cx+vx*halfW,cz+vz*halfW],h-0.18,h,0.16,0xF2F2EE,0.9);
    /* net: a shallow box of thin rails behind the frame */
    for(var k=0;k<=5;k++){
      var t=-halfW+2*halfW*k/5;
      bar(M,[cx+vx*t,cz+vz*t],[cx+vx*t-ux*2.0,cz+vz*t-uz*2.0],0,h*0.72,0.05,0xC9CCC6,0.8);
    }
  }

  /* -------------------- the interlocking SC, on the turf ---------------- */
  var _scTex=null;
  function scTex(){
    if(_scTex) return _scTex;
    var cv=document.createElement('canvas'); cv.width=cv.height=256;
    var g=cv.getContext('2d');
    g.clearRect(0,0,256,256);
    g.font='900 208px Georgia,"Times New Roman",serif';
    g.textAlign='center'; g.textBaseline='middle';
    g.lineJoin='round'; g.miterLimit=2;
    g.fillStyle='#8E1B2A'; g.strokeStyle='#E9C04A'; g.lineWidth=13;
    g.strokeText('C',170,134); g.fillText('C',170,134);
    g.strokeText('S',100,134); g.fillText('S',100,134);
    _scTex=new T.CanvasTexture(cv);
    return _scTex;
  }
  function logoDir(c,ux,uz){
    var ax=c[0], az=c[1], L=Math.hypot(ax,az)||1; ax/=L; az/=L;
    var cand=[[-uz,ux],[uz,-ux]], best=cand[0], bd=-9;
    for(var i=0;i<2;i++){ var d=cand[i][0]*ax+cand[i][1]*az; if(d>bd){bd=d;best=cand[i];} }
    return best;
  }
  function scLogo(cx,cz,size,dx,dz){
    var m=new T.Mesh(new T.PlaneGeometry(size,size),
        new T.MeshBasicMaterial({map:scTex(),transparent:true,depthWrite:false,
          polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));
    m.rotation.set(-Math.PI/2,0,Math.atan2(-dx,-dz));
    m.position.set(cx,0.22,cz);
    m.renderOrder=2; m.raycast=function(){}; m.frustumCulled=false;
    scene.add(m);
  }

  /* -------------------- turf, striped the way a mower leaves it --------- */
  function orientQuad(r){
    var l01=Math.hypot(r[1][0]-r[0][0],r[1][1]-r[0][1]);
    var l12=Math.hypot(r[2][0]-r[1][0],r[2][1]-r[1][1]);
    return l01>=l12 ? r : [r[1],r[2],r[3],r[0]];
  }
  function turf(M,ring,y,col,N){
    if(ring.length===4){
      var q4=orientQuad(ring), A=q4[0],B=q4[1],C=q4[2],D=q4[3];
      for(var k=0;k<N;k++){
        var t0=k/N,t1=(k+1)/N;
        var p0=[A[0]+(B[0]-A[0])*t0,A[1]+(B[1]-A[1])*t0],
            p1=[A[0]+(B[0]-A[0])*t1,A[1]+(B[1]-A[1])*t1],
            q0=[D[0]+(C[0]-D[0])*t0,D[1]+(C[1]-D[1])*t0],
            q1=[D[0]+(C[0]-D[0])*t1,D[1]+(C[1]-D[1])*t1];
        var q=[p0,p1,q1,q0]; if(ringArea(q)<0) q.reverse();
        flat(M,q,y,col,k%2?0.88:1.06);
      }
    } else flat(M,ring,y,col,1);
  }
  function pitchLines(M,ring,y,inset,goals){
    var c=ctr(ring), a=axisOf(ring), ux=a[0],uz=a[1], vx=-uz,vz=ux;
    var e=ext(ring,c,ux,uz), hu=Math.max(6,e[0]-inset), hv=Math.max(4,e[1]-inset);
    lineR(M,rectR(c,ux,uz,hu,hv),0.22,y,C_LINE);
    seg(M,[c[0]-vx*hv,c[1]-vz*hv],[c[0]+vx*hv,c[1]+vz*hv],0.22,y,C_LINE);
    lineR(M,ngon(c[0],c[1],Math.min(9.15,hv*0.34),26,0),0.22,y,C_LINE);
    for(var s=-1;s<=1;s+=2){
      var bu=Math.min(16.5,hu*0.26), bv=Math.min(20.1,hv*0.62);
      lineR(M,rectR([c[0]+ux*(hu-bu*0.5)*s,c[1]+uz*(hu-bu*0.5)*s],ux,uz,bu*0.5,bv*0.5),0.20,y,C_LINE);
      var su=Math.min(5.5,hu*0.09), sv=Math.min(9.16,hv*0.30);
      lineR(M,rectR([c[0]+ux*(hu-su*0.5)*s,c[1]+uz*(hu-su*0.5)*s],ux,uz,su*0.5,sv*0.5),0.20,y,C_LINE);
      if(goals) goalFrame(MW,c[0]+ux*hu*s,c[1]+uz*hu*s,ux*s,uz*s,Math.min(3.66,hv*0.20),2.44);
    }
  }
  function gridiron(M,ring,y,inset){
    var c=ctr(ring), a=axisOf(ring), ux=a[0],uz=a[1], vx=-uz,vz=ux;
    var e=ext(ring,c,ux,uz), hu=Math.max(8,e[0]-inset), hv=Math.max(6,e[1]-inset);
    for(var s=-1;s<=1;s+=2){
      var ez=Math.min(9.14,hu*0.15);
      flat(M,rectR([c[0]+ux*(hu-ez*0.5)*s,c[1]+uz*(hu-ez*0.5)*s],ux,uz,ez*0.5,hv),y-0.004,C_CARD,1);
    }
    lineR(M,rectR(c,ux,uz,hu,hv),0.24,y,C_LINE);
    var N=Math.floor(hu/4.572);
    for(var k=-N;k<=N;k++){
      var u=k*4.572; if(Math.abs(u)>hu-0.3) continue;
      seg(M,[c[0]+ux*u-vx*hv,c[1]+uz*u-vz*hv],[c[0]+ux*u+vx*hv,c[1]+uz*u+vz*hv],
          (k%2?0.16:0.22),y,C_LINE);
    }
    /* hash marks */
    for(var hsn=-1;hsn<=1;hsn+=2){
      var hz=hv*0.28*hsn;
      for(k=-N;k<=N;k++){
        var u2=k*4.572+2.286; if(Math.abs(u2)>hu-0.3) continue;
        seg(M,[c[0]+ux*u2+vx*(hz-0.6),c[1]+uz*u2+vz*(hz-0.6)],
              [c[0]+ux*u2+vx*(hz+0.6),c[1]+uz*u2+vz*(hz+0.6)],0.14,y,C_LINE);
      }
    }
    /* goal posts */
    for(s=-1;s<=1;s+=2){
      var gx=c[0]+ux*(hu-Math.min(9.14,hu*0.15))*s, gz=c[1]+uz*(hu-Math.min(9.14,hu*0.15))*s;
      post(MW,gx,gz,0,3.05,0.10,C_GOLD,0.9);
      bar(MW,[gx-vx*2.8,gz-vz*2.8],[gx+vx*2.8,gz+vz*2.8],3.05,3.20,0.14,C_GOLD,0.9);
      for(var q2=-1;q2<=1;q2+=2)
        post(MW,gx+vx*2.8*q2,gz+vz*2.8*q2,3.05,9.1,0.10,C_GOLD,0.9);
    }
    return [c,ux,uz,hu,hv];
  }

  /* =================================================== Allyson Felix Field */
  (function(){
    var c=ctr(FELIX), a=axisOf(FELIX), ux=a[0], uz=a[1];
    var apron=offsetRing(FELIX,3.4);
    flat(MG,apron,0.09,0x8E8C82,1);
    flat(MG,FELIX,0.115,C_RUBBER,1);
    /* eight lanes, 1.22 m each, marked on both edges */
    var LW=1.22, LN=8;
    for(var k=0;k<=LN;k++) lineR(MG,offsetRing(FELIX,-0.40-k*LW),0.13,0.145,C_LINE);
    var kerbR=offsetRing(FELIX,-0.40-LN*LW-0.35);
    lineR(MG,kerbR,0.42,0.15,0xFFFFFF);
    wallRing(MW,kerbR,0.11,0.24,0.16,0xE8E6DE,0.85);
    var infield=offsetRing(FELIX,-0.40-LN*LW-0.9);
    flat(MG,infield,0.125,C_TURF,1);
    /* start / finish, across the lanes on the long straight */
    var sA=FELIX[10], sB=FELIX[11];
    var sdx=sB[0]-sA[0], sdz=sB[1]-sA[1], sL=Math.hypot(sdx,sdz); sdx/=sL; sdz/=sL;
    var snx=sdz, snz=-sdx;
    var fx=sA[0]+sdx*sL*0.80, fz=sA[1]+sdz*sL*0.80;
    seg(MG,[fx,fz],[fx-snx*(LN*LW+0.8),fz-snz*(LN*LW+0.8)],0.55,0.155,0xFFFFFF);
    /* infield pitch markings and the SC at the middle */
    pitchLines(MG,infield,0.135,7,false);
    var ld=logoDir(c,ux,uz); scLogo(c[0],c[1],22,ld[0],ld[1]);
    /* stands on the straight nearer campus, light masts at the four quarters */
    var bA=FELIX[20], bB=FELIX[0];
    var bmx=(bA[0]+bB[0])*0.5, bmz=(bA[1]+bB[1])*0.5;
    var nx=bmx-c[0], nz=bmz-c[1], nL=Math.hypot(nx,nz); nx/=nL; nz/=nL;
    stand(MW,[bA[0]+nx*4.2,bA[1]+nz*4.2],[bB[0]+nx*4.2,bB[1]+nz*4.2],nx,nz,9.5,14,0xC6BCA6,C_CARD);
    var fenceR=offsetRing(FELIX,6.0);
    railFence(MW,fenceR,0,2.6,C_FENCE,true);
    for(k=0;k<4;k++){
      var ang=k/4*6.283+0.785;
      var px=c[0]+Math.cos(ang)*72, pz=c[1]+Math.sin(ang)*48;
      lightMast(MW,px,pz,26);
    }
    SPORT_PLACES.push({name:'Allyson Felix Field',x:c[0],z:c[1],h:6,rad:70});
  })();

  /* ====================================================== Brittingham Field */
  (function(){
    turf(MG,BRIT,0.11,C_TURF,11);
    pitchLines(MG,BRIT,0.13,3.2,true);
    var c=ctr(BRIT), a=axisOf(BRIT);
    var ld2=logoDir(c,a[0],a[1]); scLogo(c[0],c[1],16,ld2[0],ld2[1]);
    var fenceR=offsetRing(BRIT,3.2);
    railFence(MW,fenceR,0,3.4,C_FENCE,true);
    for(var i=0;i<fenceR.length;i++){
      var p=offsetRing(BRIT,5.0)[i];
      lightMast(MW,p[0],p[1],21);
    }
    var mid=[[ (BRIT[0][0]+BRIT[1][0])*0.5, (BRIT[0][1]+BRIT[1][1])*0.5 ]];
    SPORT_PLACES.push({name:'Brittingham Field',x:c[0],z:c[1],h:5,rad:45});
  })();

  /* ============================ Howard Jones / Brian Kennedy practice fields */
  (function(){
    turf(MG,JONES,0.10,C_TURF,14);
    gridiron(MG,JONES,0.125,5);
    var cj=ctr(JONES), aj=axisOf(JONES);
    var ldj=logoDir(cj,aj[0],aj[1]); scLogo(cj[0],cj[1],17,ldj[0],ldj[1]);
    railFence(MW,offsetRing(JONES,2.6),0,3.0,C_FENCE,true);
    SPORT_PLACES.push({name:'Howard Jones Field',x:cj[0],z:cj[1],h:5,rad:55});

    turf(MG,KENN,0.10,C_TURF,12);
    gridiron(MG,KENN,0.125,4);
    railFence(MW,offsetRing(KENN,2.6),0,3.0,C_FENCE,true);
    var ck=ctr(KENN);
    SPORT_PLACES.push({name:'Brian Kennedy Field',x:ck[0],z:ck[1],h:5,rad:45});

    turf(MG,MCAL,0.10,C_TURF,12);
    pitchLines(MG,MCAL,0.125,4,true);
    var cm=ctr(MCAL), am=axisOf(MCAL);
    var ldm=logoDir(cm,am[0],am[1]); scLogo(cm[0],cm[1],15,ldm[0],ldm[1]);
    railFence(MW,offsetRing(MCAL,2.6),0,3.0,C_FENCE,true);
    SPORT_PLACES.push({name:'McAlister Field',x:cm[0],z:cm[1],h:5,rad:50});
  })();

  /* =============================================== Dedeaux Field (baseball) */
  (function(){
    var home=[-408.3,-346.1], R=78;
    flat(MG,DEDX,0.10,C_TURF,1);
    /* the two foul lines are 90 degrees apart; find them from the arc ends */
    var f1=[-77/77.0,1/77.0], f2=[-5/79.2,-79/79.2];
    var a1=Math.atan2(f1[1],f1[0]), a2=Math.atan2(f2[1],f2[0]);
    if(a2<a1) a2+=6.283185;
    function arcPt(t,r){ var A=a1+(a2-a1)*t; return [home[0]+Math.cos(A)*r, home[1]+Math.sin(A)*r]; }
    var NA=18;
    /* fair territory turf, brighter, mown in arcs */
    var fair=[home.slice()]; for(var i=0;i<=NA;i++) fair.push(arcPt(i/NA,R));
    if(ringArea(fair)<0) fair.reverse();
    flat(MG,fair,0.115,C_TURF,1.05);
    /* warning track */
    var wt=[]; for(i=0;i<=NA;i++) wt.push(arcPt(i/NA,R));
    for(i=NA;i>=0;i--) wt.push(arcPt(i/NA,R-4.2));
    if(ringArea(wt)<0) wt.reverse();
    flat(MG,wt,0.13,C_DIRT,1);
    /* skinned infield: the 90 degree wedge out to 40 m, then grass laid back on */
    var skin=[home.slice()]; for(i=0;i<=10;i++) skin.push(arcPt(i/10,40));
    if(ringArea(skin)<0) skin.reverse();
    flat(MG,skin,0.125,C_DIRT,1);
    var cfx=Math.cos((a1+a2)*0.5), cfz=Math.sin((a1+a2)*0.5);
    var b1=[home[0]+f1[0]*27.4, home[1]+f1[1]*27.4],
        b3=[home[0]+f2[0]*27.4, home[1]+f2[1]*27.4],
        b2=[home[0]+cfx*38.75, home[1]+cfz*38.75];
    var dia=[[home[0]+cfx*3.2,home[1]+cfz*3.2],
             [b1[0]-cfx*1.2+ (home[0]-b1[0])*0.0, b1[1]-cfz*1.2],
             [b2[0]-cfx*3.2,b2[1]-cfz*3.2],
             [b3[0]-cfx*1.2,b3[1]-cfz*1.2]];
    var inD=[[home[0]+cfx*5.0,home[1]+cfz*5.0],
             [b1[0]-(b1[0]-home[0])*0.10-cfx*0.5,b1[1]-(b1[1]-home[1])*0.10-cfz*0.5],
             [b2[0]-cfx*5.0,b2[1]-cfz*5.0],
             [b3[0]-(b3[0]-home[0])*0.10-cfx*0.5,b3[1]-(b3[1]-home[1])*0.10-cfz*0.5]];
    if(ringArea(inD)<0) inD.reverse();
    flat(MG,inD,0.135,C_TURF,1.05);
    /* base paths and the mound */
    seg(MG,home,b1,3.0,0.14,C_DIRT); seg(MG,b1,b2,3.0,0.14,C_DIRT);
    seg(MG,b2,b3,3.0,0.14,C_DIRT); seg(MG,b3,home,3.0,0.14,C_DIRT);
    flat(MG,ngon(home[0]+cfx*18.44,home[1]+cfz*18.44,2.75,16,0),0.145,C_DIRT,1.04);
    flat(MG,ngon(home[0],home[1],4.0,16,0),0.145,C_DIRT,1.04);
    /* foul lines and bases */
    seg(MG,home,arcPt(0,R),0.22,0.16,C_LINE);
    seg(MG,home,arcPt(1,R),0.22,0.16,C_LINE);
    [b1,b2,b3].forEach(function(b){ flat(MG,[[b[0]-0.5,b[1]-0.5],[b[0]-0.5,b[1]+0.5],[b[0]+0.5,b[1]+0.5],[b[0]+0.5,b[1]-0.5]],0.17,0xFFFFFF,1); });
    /* outfield wall */
    var wall=[]; for(i=0;i<=NA;i++) wall.push(arcPt(i/NA,R));
    for(i=0;i<wall.length-1;i++) bar(MW,wall[i],wall[i+1],0,2.7,0.4,0x1F4A2E,0.62);
    for(i=0;i<wall.length-1;i++) bar(MW,wall[i],wall[i+1],2.7,2.9,0.5,0xE6E2D6,0.85);
    for(i=0;i<wall.length-1;i++) addCollider([[wall[i][0],wall[i][1]],[wall[i+1][0],wall[i+1][1]],
        [wall[i+1][0]+cfx*0.4,wall[i+1][1]+cfz*0.4],[wall[i][0]+cfx*0.4,wall[i][1]+cfz*0.4]],2.7);
    /* backstop and the stand behind home */
    var bsx=-cfx, bsz=-cfz;
    var bs=[]; for(i=0;i<=8;i++){ var A=a1+(a2-a1)*(i/8)+Math.PI; bs.push([home[0]+Math.cos(A)*16,home[1]+Math.sin(A)*16]); }
    railFence(MW,bs,0,7.5,C_FENCE,false);
    stand(MW,bs[1],bs[7],bsx,bsz,11,16,0xC6BCA6,C_CARD);
    for(i=0;i<4;i++){
      var A2=a1+(a2-a1)*(0.08+i*0.28);
      lightMast(MW,home[0]+Math.cos(A2)*(R-9),home[1]+Math.sin(A2)*(R-9),27);
    }
    SPORT_PLACES.push({name:'Dedeaux Field',x:home[0]+cfx*34,z:home[1]+cfz*34,h:8,rad:70});
  })();

  /* ============================================ Uytengsu Aquatics Center */
  (function(){
    var c=ctr(POOL), a=axisOf(POOL), ux=a[0],uz=a[1], vx=-uz,vz=ux;
    var e=ext(POOL,c,ux,uz), hu=e[0], hv=e[1];          /* ~25.5 x 11.4 */
    var C_BR=0x9A4A34, C_CR=0xDCD2BC, C_TEAL=0x17807C, C_TEALD=0x0F5F5C;
    var DECK=0.30, WATER_Y=0.14;

    /* --- deck --- */
    var deck=offsetRing(POOL,9.0), rim0=offsetRing(POOL,0.5);
    for(var di=0;di<deck.length;di++){
      var dj=(di+1)%deck.length;
      var dq=[deck[di],deck[dj],rim0[dj],rim0[di]];
      if(ringArea(dq)<0) dq.reverse();
      flat(MG,dq,DECK,0xD2CCBF,di%2?1:0.97);
    }
    wallRing(MW,deck,0,DECK,0.5,0xBDB7A8,0.7);
    addCollider(deck,DECK);

    /* --- brick perimeter, broken by a gateway on the Lyon Center side --- */
    var per=offsetRing(POOL,12.4);
    var gate=[c[0]-vx*(hv+12.4), c[1]-vz*(hv+12.4)];
    (function(){
      for(var i=0;i<per.length;i++){
        var A=per[i], B=per[(i+1)%per.length];
        var L=Math.hypot(B[0]-A[0],B[1]-A[1]);
        var N=Math.max(1,Math.round(L/4));
        for(var k=0;k<N;k++){
          var p0=[A[0]+(B[0]-A[0])*k/N, A[1]+(B[1]-A[1])*k/N],
              p1=[A[0]+(B[0]-A[0])*(k+1)/N, A[1]+(B[1]-A[1])*(k+1)/N];
          var mx=(p0[0]+p1[0])*0.5, mz=(p0[1]+p1[1])*0.5;
          if(Math.hypot(mx-gate[0],mz-gate[1])<5.0) continue;
          bar(MW,p0,p1,0,1.35,0.55,C_BR,0.6);
          bar(MW,p0,p1,1.35,1.62,0.74,C_CR,0.85);
          bar(MW,p0,p1,1.62,1.72,0.09,0x2A2C30,0.8);
          bar(MW,p0,p1,2.55,2.66,0.09,0x2A2C30,0.8);
          post(MW,p1[0],p1[1],1.62,2.66,0.07,0x2A2C30,0.7);
          addCollider([[p0[0]-0.35,p0[1]-0.35],[p1[0]+0.35,p1[1]-0.35],
                       [p1[0]+0.35,p1[1]+0.35],[p0[0]-0.35,p0[1]+0.35]],1.72);
        }
      }
    })();

    /* --- the water --- */
    var rim=offsetRing(POOL,0.5);
    for(var i=0;i<POOL.length;i++){
      var j=(i+1)%POOL.length;
      var ro=rim[i], ro2=rim[j], ri=POOL[i], ri2=POOL[j];
      var cw=rgb(0xF2F0EA,1), cwd=rgb(0xF2F0EA,0.68);
      MW.quad([ro[0],DECK,ro[1]],[ri[0],WATER_Y,ri[1]],[ri2[0],WATER_Y,ri2[1]],[ro2[0],DECK,ro2[1]],cw,cwd,cwd,cw);
    }
    flat(MG,POOL,WATER_Y,C_POOLW,1);
    addCollider(offsetRing(POOL,-0.2),1.35);   /* keeps you out of the water */
    /* lane lines painted on the floor, ropes floating above */
    for(var k=-4;k<=4;k++){
      var off=k*2.3;
      var A2=[c[0]+vx*off-ux*(hu-1.6), c[1]+vz*off-uz*(hu-1.6)],
          B2=[c[0]+vx*off+ux*(hu-1.6), c[1]+vz*off+uz*(hu-1.6)];
      seg(MG,A2,B2,0.30,WATER_Y+0.012,0x0C4A78);
      var segs=16;
      for(var s=0;s<segs;s++){
        var t0=s/segs, t1=(s+1)/segs;
        bar(MW,[A2[0]+(B2[0]-A2[0])*t0,A2[1]+(B2[1]-A2[1])*t0],
               [A2[0]+(B2[0]-A2[0])*t1,A2[1]+(B2[1]-A2[1])*t1],
               WATER_Y+0.02,WATER_Y+0.20,0.28, s%2?0xC8102E:0xF3C53C, 0.85);
      }
    }
    /* starting blocks along the near end */
    for(k=0;k<10;k++){
      var bo=(k-4.5)*2.3;
      var bx=c[0]+vx*bo+ux*(hu+1.5), bz=c[1]+vz*bo+uz*(hu+1.5);
      boxAt(MW,bx,bz,ux,uz,0.42,0.40,DECK,DECK+0.70,0xF0EDE4,0.78);
      boxAt(MW,bx-ux*0.14,bz-uz*0.14,ux,uz,0.46,0.44,DECK+0.70,DECK+0.82,0x2C3238,0.8);
      post(MW,bx,bz,DECK,DECK+0.74,0.07,0x8A9096,0.8);
    }
    /* lifeguard chair */
    var lgx=c[0]+vx*(hv+5.5)+ux*5, lgz=c[1]+vz*(hv+5.5)+uz*5;
    post(MW,lgx-0.5,lgz,DECK,DECK+2.1,0.09,0xEFEAE0,0.85);
    post(MW,lgx+0.5,lgz,DECK,DECK+2.1,0.09,0xEFEAE0,0.85);
    boxAt(MW,lgx,lgz,ux,uz,0.7,0.6,DECK+2.1,DECK+2.4,0xEFEAE0,0.8);
    boxAt(MW,lgx,lgz+0.55,ux,uz,0.7,0.1,DECK+2.4,DECK+3.3,0xEFEAE0,0.8);

    /* --- the Sammy Lee dive tower, banded brick and cast stone --- */
    var tx=c[0]-ux*(hu+7.5), tz=c[1]-uz*(hu+7.5);
    var bands=[[0,3.1,C_BR],[3.1,3.7,C_CR],[3.7,6.6,C_BR],[6.6,7.2,C_CR],
               [7.2,10.1,C_BR],[10.1,10.7,C_CR],[10.7,12.6,C_BR],[12.6,13.3,C_CR]];
    for(i=0;i<bands.length;i++)
      boxAt(MW,tx,tz,ux,uz,3.0,3.4,bands[i][0],bands[i][1],bands[i][2],0.6);
    addCollider(rectR([tx,tz],ux,uz,3.0,3.4),13.3);
    /* platforms, cantilevered over the water */
    var plat=[[3.1,2.9,1.55],[5.6,2.6,1.45],[8.1,2.4,1.35],[10.7,2.2,1.30]];
    for(i=0;i<plat.length;i++){
      var py=plat[i][0], pd=plat[i][1], pw=plat[i][2];
      var px=tx+ux*(3.0+pd), pz=tz+uz*(3.0+pd);
      boxAt(MW,px,pz,ux,uz,pd,pw,py-0.30,py,0xE9E4D6,0.72);
      for(var q=-1;q<=1;q+=2){
        post(MW,px+vx*pw*q,pz+vz*pw*q,py,py+1.05,0.06,0x2A2C30,0.8);
        post(MW,px-ux*pd*0.9+vx*pw*q,pz-uz*pd*0.9+vz*pw*q,py,py+1.05,0.06,0x2A2C30,0.8);
        bar(MW,[px+vx*pw*q-ux*pd*0.9,pz+vz*pw*q-uz*pd*0.9],[px+vx*pw*q+ux*pd*0.9,pz+vz*pw*q+uz*pd*0.9],
            py+0.95,py+1.05,0.07,0x2A2C30,0.8);
      }
    }
    /* stair flights up the back */
    for(i=0;i<10;i++){
      var sy=i*1.25;
      boxAt(MW,tx-ux*3.9+vx*(i%2?1.6:-1.6), tz-uz*3.9+vz*(i%2?1.6:-1.6),
            ux,uz,0.9,1.5,sy,sy+0.12,0x33363A,0.7);
    }
    post(MW,tx-ux*4.6,tz-uz*4.6,0,13.0,0.09,0x33363A,0.7);

    /* --- Morgan Training Center along the far side --- */
    var mcx=c[0]+vx*(hv+13.5), mcz=c[1]+vz*(hv+13.5);
    var mhu=25, mhv=6.5;
    boxAt(MW,mcx,mcz,ux,uz,mhu,mhv,0,4.6,C_BR,0.6);
    boxAt(MW,mcx,mcz,ux,uz,mhu+0.4,mhv+0.4,4.6,5.5,C_TEAL,0.75);
    boxAt(MW,mcx,mcz,ux,uz,mhu+0.15,mhv+0.15,5.5,5.75,C_CR,0.85);
    flat(MW,rectR([mcx,mcz],ux,uz,mhu-0.1,mhv-0.1),5.80,0x55564F,1);
    addCollider(rectR([mcx,mcz],ux,uz,mhu+0.4,mhv+0.4),5.75);
    /* teal roll-up doors facing the pool */
    for(k=0;k<5;k++){
      var dof=(k-2)*9.0;
      var dx2=mcx+ux*dof-vx*mhv, dz2=mcz+uz*dof-vz*mhv;
      archFace(MW,dx2,dz2,ux,uz,-vx*0.12,-vz*0.12,0.05,5.6,3.9,0,C_TEALD,1);
      for(var g2=0;g2<7;g2++)
        archFace(MW,dx2,dz2,ux,uz,-vx*0.16,-vz*0.16,0.30+g2*0.52,5.3,0.34,0,C_TEAL,1);
      archFace(MW,dx2,dz2,ux,uz,-vx*0.20,-vz*0.20,3.95,6.0,0.35,0,C_CR,1);
    }

    /* --- spectator seating on the pool's long side, and the ball net --- */
    var sA=[c[0]-ux*hu+vx*(hv+3.4), c[1]-uz*hu+vz*(hv+3.4)],
        sB=[c[0]+ux*hu+vx*(hv+3.4), c[1]+uz*hu+vz*(hv+3.4)];
    stand(MW,sA,sB,vx,vz,4.4,6,0xC6BCA6,C_CARD);
    /* tall black net behind the far end */
    var nx0=c[0]+ux*(hu+10.8), nz0=c[1]+uz*(hu+10.8);
    for(k=-3;k<=3;k++) post(MW,nx0+vx*k*4.0,nz0+vz*k*4.0,0,11,0.10,0x2A2C30,0.7);
    for(var yy=3;yy<=11;yy+=4)
      bar(MW,[nx0-vx*12,nz0-vz*12],[nx0+vx*12,nz0+vz*12],yy,yy+0.09,0.08,0x2A2C30,0.7);
    /* floodlights at the corners */
    for(k=0;k<4;k++){
      var lx=c[0]+vx*(hv+10.8)*(k<2?-1:1)+ux*(k%2?16:-16),
          lz=c[1]+vz*(hv+10.8)*(k<2?-1:1)+uz*(k%2?16:-16);
      lightMast(MW,lx,lz,16);
    }
    SPORT_PLACES.push({name:'Uytengsu Aquatics Center',x:c[0],z:c[1],h:6,rad:34});
  })();

  NO_PLANT.push(offsetRing(FELIX,7),offsetRing(BRIT,5),offsetRing(JONES,4),
                offsetRing(KENN,4),offsetRing(MCAL,4),offsetRing(DEDX,3),offsetRing(POOL,16));
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  var mw=new T.Mesh(MW.geom(),matWorld);  mw.frustumCulled=false; scene.add(mw);
  for(var q3=0;q3<SPORT_PLACES.length;q3++) NAMED_PLACES.push(SPORT_PLACES[q3]);
})();

/* ==================================================================
   Traveler, the white horse, and the fountain he stands beside.
   ================================================================== */
(function(){
  /* Hahn Central Plaza: the fountain sits across the plaza from Tommy Trojan
     and Traveler stands beside it on the Tommy side, facing him. */
  var FX=18, FZ=43;                       /* the plaza fountain, from the OSM way */
  var TX=20, TZ=61;                       /* the monument spot beyond it, by Town and Gown */
  var TOMX=-3, TOMZ=4;
  var _tdx=TOMX-TX, _tdz=TOMZ-TZ, _tl=Math.hypot(_tdx,_tdz)||1; _tdx/=_tl; _tdz/=_tl;
  var M=new Mesher(), MGr=new Mesher();

  /* --- the planting bed: paved kerb, mulch, a clipped hedge, red flowers --- */
  flat(MGr,ngon(TX,TZ,7.0,26,0),0.16,0xC7C0B0,1);
  flat(MGr,ngon(TX,TZ,5.7,26,0),0.20,0x5C4130,1);
  band(M,ngon(TX,TZ,5.7,26,0),0.16,0.34,0,0xA9A294,1,0.7);
  (function(){
    var ro=ngon(TX,TZ,5.55,26,0), ri=ngon(TX,TZ,4.80,26,0);
    band(M,ro,0.20,1.02,0,0x2F6B2C,1,0.58,true);
    var rev=ri.slice().reverse();
    band(M,rev,0.20,0.96,0,0x2A6028,0.82,0.50,true);
    var ct=rgb(0x3A7C33,1);
    for(var q0=0;q0<ro.length;q0++){
      var q1=(q0+1)%ro.length;
      M.quad([ro[q0][0],1.02,ro[q0][1]],[ri[q0][0],0.96,ri[q0][1]],
             [ri[q1][0],0.96,ri[q1][1]],[ro[q1][0],1.02,ro[q1][1]],ct,ct,ct,ct);
    }
  })();
  for(var i=0;i<44;i++){
    var aa=i/44*6.283185*3.7, rr2=2.25+((i*37)%50)/50*2.05;
    var fx0=TX+Math.cos(aa)*rr2, fz0=TZ+Math.sin(aa)*rr2;
    var q=[[fx0-0.34,fz0-0.34],[fx0+0.34,fz0-0.34],[fx0+0.34,fz0+0.34],[fx0-0.34,fz0+0.34]];
    if(ringArea(q)<0) q.reverse();
    prism(M,q,0.20,0.62+((i*13)%7)*0.04, i%3?0xB3202C:0xD2452A, i%3?0xCC3038:0xE05C3A, 0.72);
  }
  /* --- the low boulder the horse stands on --- */
  var rockM=new T.MeshLambertMaterial({color:0x5E5B53,flatShading:true});
  var rock=new T.Group(); rock.position.set(TX,0,TZ);
  var rbase=new T.Mesh(new T.IcosahedronGeometry(1,0),rockM);
  rbase.scale.set(3.0,0.52,2.5); rbase.position.y=0.42; rock.add(rbase);
  for(i=0;i<4;i++){
    var b0=new T.Mesh(new T.IcosahedronGeometry(1,0),rockM);
    var aa2=i/4*6.283185+0.5;
    b0.position.set(Math.cos(aa2)*1.7,0.35,Math.sin(aa2)*1.35);
    b0.scale.set(1.25,0.44,1.05); b0.rotation.set(0.15*i,aa2,0.10*i);
    rock.add(b0);
  }
  scene.add(rock);

  /* --- Traveler: pale stone, head turned, mane and tail flying --- */
  var coat =new T.MeshLambertMaterial({color:0xEFE9DC,flatShading:true});
  var coatD=new T.MeshLambertMaterial({color:0xD5CCB8,flatShading:true});
  var dark =new T.MeshLambertMaterial({color:0x4A4740,flatShading:true});
  var horse=new T.Group();
  horse.position.set(TX,0.88,TZ);
  horse.scale.set(1.22,1.22,1.22);
  horse.rotation.y=Math.atan2(-_tdz,_tdx);
  (function(){
    /* legs first, so the barrel sits on top of them */
    function leg(x,z,lift,fwd){
      var g=new T.Group(); g.position.set(x,1.34,z); g.rotation.z=fwd;
      var up=new T.Mesh(new T.CylinderGeometry(0.21,0.15,0.66,7),coat); up.position.y=-0.33; g.add(up);
      var kn=new T.Mesh(new T.IcosahedronGeometry(0.17,0),coat); kn.position.y=-0.66; g.add(kn);
      var lo=new T.Group(); lo.position.y=-0.68; lo.rotation.z=lift;
      var sh=new T.Mesh(new T.CylinderGeometry(0.115,0.10,0.52,7),coat); sh.position.y=-0.26; lo.add(sh);
      var ho=new T.Mesh(new T.CylinderGeometry(0.135,0.16,0.18,8),coatD); ho.position.y=-0.60; lo.add(ho);
      g.add(lo); return g;
    }
    horse.add(leg( 0.98, 0.42, 0.00,-0.06));
    horse.add(leg( 0.98,-0.42, 0.95, 0.60));   /* the near foreleg, raised */
    horse.add(leg(-1.06, 0.44, 0.00, 0.12));
    horse.add(leg(-1.06,-0.44, 0.00, 0.26));
    /* barrel, chest and quarters */
    var body=new T.Mesh(new T.IcosahedronGeometry(1,1),coat);
    body.scale.set(1.52,0.78,0.70); body.position.set(-0.05,1.72,0); horse.add(body);
    var chest=new T.Mesh(new T.IcosahedronGeometry(1,1),coat);
    chest.scale.set(0.72,0.78,0.66); chest.position.set(1.06,1.74,0); horse.add(chest);
    var rump=new T.Mesh(new T.IcosahedronGeometry(1,1),coat);
    rump.scale.set(0.80,0.82,0.68); rump.position.set(-1.12,1.76,0); horse.add(rump);
    /* neck, rising and turned */
    var neck=new T.Group(); neck.position.set(1.32,2.10,0); neck.rotation.z=-0.60; neck.rotation.y=0.38;
    var nk=new T.Mesh(new T.CylinderGeometry(0.28,0.50,1.35,9),coat); nk.position.y=0.60; neck.add(nk);
    var head=new T.Group(); head.position.set(0,1.28,0); head.rotation.z=0.78;
    var sk=new T.Mesh(new T.IcosahedronGeometry(1,1),coat);
    sk.scale.set(0.42,0.30,0.27); sk.position.set(0.02,0.08,0); head.add(sk);
    var muz=new T.Mesh(new T.CylinderGeometry(0.14,0.19,0.60,8),coat);
    muz.rotation.z=Math.PI/2+0.12; muz.position.set(0.50,0.00,0); head.add(muz);
    var nose=new T.Mesh(new T.IcosahedronGeometry(0.16,0),coatD); nose.position.set(0.78,-0.02,0); head.add(nose);
    for(var s=-1;s<=1;s+=2){
      var ear=new T.Mesh(new T.ConeGeometry(0.095,0.30,6),coat);
      ear.position.set(-0.16,0.30,0.14*s); ear.rotation.z=-0.22; head.add(ear);
      var eye=new T.Mesh(new T.IcosahedronGeometry(0.07,0),dark);
      eye.position.set(0.20,0.12,0.24*s); head.add(eye);
    }
    neck.add(head);
    for(var m=0;m<8;m++){
      var mn=new T.Mesh(new T.BoxGeometry(0.24,0.44-m*0.025,0.12),coatD);
      mn.position.set(-0.13,0.18+m*0.17,0); mn.rotation.z=-0.24+m*0.05; neck.add(mn);
    }
    horse.add(neck);
    /* tail */
    var tail=new T.Group(); tail.position.set(-1.80,1.92,0); tail.rotation.z=0.80;
    for(m=0;m<5;m++){
      var tl=new T.Mesh(new T.BoxGeometry(0.22-m*0.02,0.38,0.27-m*0.03),coatD);
      tl.position.set(0,-0.19-m*0.32,0); tl.rotation.z=-0.11*m; tail.add(tl);
    }
    horse.add(tail);
  })();
  scene.add(horse);
  addCollider([[TX-2.8,TZ-2.4],[TX+2.8,TZ-2.4],[TX+2.8,TZ+2.4],[TX-2.8,TZ+2.4]],4.6);
  addCollider(ngon(TX,TZ,5.7,14,0),1.00);

  /* --- plaque on the kerb --- */
  var plq=new T.Mesh(new T.BoxGeometry(1.6,0.9,0.18),
        new T.MeshLambertMaterial({color:0x6E5A34,flatShading:true}));
  plq.position.set(TX+Math.cos(2.2)*6.3,0.82,TZ+Math.sin(2.2)*6.3);
  plq.rotation.set(-0.42,-2.2+Math.PI/2,0); scene.add(plq);

  /* --- the fountain he stands beside: two bowls, spilling into a wide basin --- */
  fountainRing(M,MGr,ngon(FX,FZ,6.8,30,0),2,0);
  /* a ring of granite kerb blocks people sit on */
  for(i=0;i<16;i++){
    var ka=i/16*6.283185+0.19, kb=(i+0.62)/16*6.283185+0.19;
    segBox(M,[FX+Math.cos(ka)*9.6,FZ+Math.sin(ka)*9.6],
             [FX+Math.cos(kb)*9.6,FZ+Math.sin(kb)*9.6],0.10,0.46,0.75,0xB6AE9C,0.66);
  }

  var mm=new T.Mesh(M.geom(),matWorld); mm.frustumCulled=false; scene.add(mm);
  var mg2=new T.Mesh(MGr.geom(),matGround); mg2.frustumCulled=false; scene.add(mg2);
  NO_PLANT.push(ngon(TX,TZ,8.5,16,0),ngon(FX,FZ,12,16,0));
  NAMED_PLACES.push({name:'Traveler Statue',x:TX,z:TZ,h:5,rad:11});
  NAMED_PLACES.push({name:'Hahn Plaza Fountain',x:FX,z:FZ,h:5,rad:12});
})();



/* ==================================================================
   The Campus Center terrace: tan umbrellas and cafe tables in the
   courtyard between Sample Hall and the Tutor Campus Center.
   ================================================================== */
(function(){
  var M=new Mesher();
  var CX=-77, CZ=50, R=19, want=13, made=0;
  function freeAt(x,z,pad){
    var l=nearby(x,z,pad+1.5);
    for(var i=0;i<l.length;i++){ var C=l[i];
      if(C.h<0.5) continue;
      if(x<C.x0-pad||x>C.x1+pad||z<C.z0-pad||z>C.z1+pad) continue;
      if(inRing(C.ring,x,z)) return false;
      /* also keep clear of the wall itself */
      for(var j=0;j<C.ring.length;j++){
        var a=C.ring[j], b=C.ring[(j+1)%C.ring.length];
        var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz||1e-9;
        var t=((x-a[0])*dx+(z-a[1])*dz)/L2; t=t<0?0:(t>1?1:t);
        var qx=a[0]+dx*t, qz=a[1]+dz*t;
        if((x-qx)*(x-qx)+(z-qz)*(z-qz) < pad*pad) return false;
      }
    }
    return true;
  }
  var TAN=0xC9A97A, TAND=0xAE8C61, DARK=0x4A3B33, STEEL=0x3A3B3D;
  for(var t=0,guard=0; t<want && guard<420; guard++){
    var a=rr(0,6.283185), rad=Math.sqrt(rnd())*R;
    var x=CX+Math.cos(a)*rad, z=CZ+Math.sin(a)*rad;
    if(!freeAt(x,z,3.2)) continue;
    var clash=false;
    for(var q=0;q<made;q++){ }
    /* umbrella: pole, octagonal tan canopy */
    postAt(M,x,z,0,0.16,0.30,STEEL,0.6);
    postAt(M,x,z,0.16,2.42,0.050,STEEL,0.7);
    coneRoof(M,x,z,2.05,2.42,0.62,TAN,8);
    band(M,ngon(x,z,2.05,8,0),2.30,2.42,0,TAND,1,0.72,true);
    postAt(M,x,z,3.04,3.22,0.045,STEEL,0.7);
    /* table under it */
    band(M,ngon(x,z,0.58,10,0),0.72,0.80,0,DARK,1,0.70,true);
    flat(M,ngon(x,z,0.58,10,0),0.80,DARK,1.05);
    /* three chairs around it */
    for(var k=0;k<3;k++){
      var ca=a*1.7+k/3*6.283185;
      var cx2=x+Math.cos(ca)*1.15, cz2=z+Math.sin(ca)*1.15;
      band(M,ngon(cx2,cz2,0.27,4,ca),0.40,0.48,0,DARK,1,0.68,true);
      flat(M,ngon(cx2,cz2,0.27,4,ca),0.48,DARK,1.04);
      for(var g=0;g<4;g++){
        var ga=ca+0.785+g*1.5708;
        postAt(M,cx2+Math.cos(ga)*0.20,cz2+Math.sin(ga)*0.20,0,0.40,0.032,DARK,0.66);
      }
      band(M,ngon(cx2+Math.cos(ca)*0.24,cz2+Math.sin(ca)*0.24,0.26,4,ca),0.48,1.02,0,DARK,1,0.66,true);
    }
    addCollider([[x-0.4,z-0.4],[x+0.4,z-0.4],[x+0.4,z+0.4],[x-0.4,z+0.4]],0.82);
    t++; made++;
  }
  var m=new T.Mesh(M.geom(),matWorld); m.frustumCulled=false; scene.add(m);
  window.__terrace=made;
})();

var TREE_POS=[];

/* ==================================================================
   The Cinematic Arts courtyard: Douglas Fairbanks on his fountain,
   a ring of red and yellow flowers, orange trees and palms.
   ================================================================== */
(function(){
  var M=new Mesher(), MG=new Mesher();
  /* find the clearest patch inside the School of Cinematic Arts cluster */
  function clearance(x,z){
    var l=nearby(x,z,26), best=1e9;
    for(var i=0;i<l.length;i++){ var C=l[i];
      if(C.h<2) continue;
      if(inRing(C.ring,x,z)) return -1;
      for(var j=0;j<C.ring.length;j++){
        var a=C.ring[j], b=C.ring[(j+1)%C.ring.length];
        var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz||1e-9;
        var t=((x-a[0])*dx+(z-a[1])*dz)/L2; t=t<0?0:(t>1?1:t);
        var qx=a[0]+dx*t-x, qz=a[1]+dz*t-z;
        var dd=Math.sqrt(qx*qx+qz*qz); if(dd<best) best=dd;
      }
    }
    return best===1e9?26:best;
  }
  var CX=-140, CZ=-320, bd=-1;
  for(var gx=-34;gx<=34;gx+=2) for(var gz=-34;gz<=34;gz+=2){
    var x=-140+gx, z=-320+gz, cl=clearance(x,z);
    if(cl>bd){ bd=cl; CX=x; CZ=z; }
  }
  if(bd<7){ window.__sca=0; return; }
  var R=Math.min(13,bd-1.2);

  var stone=0xEFE7D2, stoneD=0xCFC4A6, bronze=0x7A6438, tile=0xB05534;
  /* paved courtyard ring, in the grey and white grid of the real one */
  for(var q=0;q<3;q++)
    flat(MG,ngon(CX,CZ,R+3.4-q*1.1,28,q*0.1),0.12+q*0.006,q%2?0xC8C4BA:0xDAD5C8,1);
  /* the fountain basin */
  var fr=Math.min(6.6,R*0.54);
  fountainRing(M,MG,ngon(CX,CZ,fr,26,0),1,0);
  /* a ring bench of stone around it */
  for(var i=0;i<14;i++){
    var a1=i/14*6.283185+0.12, a2=(i+0.60)/14*6.283185+0.12;
    segBox(M,[CX+Math.cos(a1)*(fr+3.2),CZ+Math.sin(a1)*(fr+3.2)],
             [CX+Math.cos(a2)*(fr+3.2),CZ+Math.sin(a2)*(fr+3.2)],0.10,0.46,0.70,stoneD,0.66);
  }
  /* the flower ring, red and gold */
  flat(MG,ngon(CX,CZ,fr+2.6,26,0),0.16,0x4E3A2A,1);
  for(i=0;i<56;i++){
    var fa=i/56*6.283185*3.3, frd=fr+0.9+((i*29)%40)/40*1.4;
    var fx=CX+Math.cos(fa)*frd, fz=CZ+Math.sin(fa)*frd;
    var fq=[[fx-0.30,fz-0.30],[fx+0.30,fz-0.30],[fx+0.30,fz+0.30],[fx-0.30,fz+0.30]];
    if(ringArea(fq)<0) fq.reverse();
    prism(M,fq,0.16,0.56+((i*7)%5)*0.04, i%2?0xB3202C:0xE0A82A, i%2?0xC8303A:0xEFC44A,0.72);
  }
  /* the pedestal and Douglas Fairbanks himself */
  band(M,ngon(CX,CZ,1.45,14,0),0.40,1.35,0,stone,1,0.70,true);
  band(M,ngon(CX,CZ,1.15,14,0),1.35,2.55,0,stoneD,1,0.72,true);
  band(M,ngon(CX,CZ,0.95,12,0),2.78,3.45,0,stoneD,1,0.74,true);
  band(M,ngon(CX,CZ,1.35,14,0),2.55,2.78,0,stone,1,0.78,true);
  var bz=new T.MeshLambertMaterial({color:bronze,flatShading:true});
  var g=new T.Group(); g.position.set(CX,3.45,CZ); g.rotation.y=0.6; g.scale.set(1.35,1.35,1.35);
  (function(){
    for(var sgn=-1;sgn<=1;sgn+=2){
      var leg=new T.Mesh(new T.CylinderGeometry(0.14,0.11,1.05,7),bz);
      leg.position.set(sgn*0.16,0.52,sgn*0.10); leg.rotation.z=sgn*0.07; g.add(leg);
      var boot=new T.Mesh(new T.BoxGeometry(0.26,0.16,0.42),bz);
      boot.position.set(sgn*0.18,0.08,sgn*0.14); g.add(boot);
    }
    var torso=new T.Mesh(new T.CylinderGeometry(0.30,0.24,0.80,8),bz);
    torso.position.y=1.42; g.add(torso);
    var chest=new T.Mesh(new T.IcosahedronGeometry(0.34,1),bz);
    chest.scale.set(1,0.8,0.7); chest.position.y=1.70; g.add(chest);
    /* the cloak falling behind him */
    var cape=new T.Mesh(new T.ConeGeometry(0.58,1.35,7,1,true),bz);
    cape.position.set(-0.12,1.25,-0.16); cape.rotation.x=-0.16; g.add(cape);
    var head=new T.Mesh(new T.IcosahedronGeometry(0.21,1),bz);
    head.position.y=2.02; g.add(head);
    /* the raised arm with the sword, and the other on his hip */
    var arm=new T.Mesh(new T.CylinderGeometry(0.095,0.085,0.92,6),bz);
    arm.position.set(0.44,2.05,0); arm.rotation.z=-0.72; g.add(arm);
    var sw=new T.Mesh(new T.BoxGeometry(0.07,1.15,0.11),bz);
    sw.position.set(0.76,2.72,0); sw.rotation.z=-0.30; g.add(sw);
    var arm2=new T.Mesh(new T.CylinderGeometry(0.095,0.085,0.80,6),bz);
    arm2.position.set(-0.36,1.40,0.05); arm2.rotation.z=0.42; g.add(arm2);
  })();
  scene.add(g);
  addCollider(ngon(CX,CZ,fr+0.6,12,0),1.1);
  /* palms and orange trees at the corners of the cloister */
  for(i=0;i<4;i++){
    var pa=i/4*6.283185+0.78, pr=R+1.0;
    var px=CX+Math.cos(pa)*pr, pz=CZ+Math.sin(pa)*pr;
    if(clearance(px,pz)<2.0) continue;
    postAt(M,px,pz,0,0.55,0.85,0x8A6A4E,0.6);
    TREE_POS.push([px,pz,i%2]);
  }
  var m1=new T.Mesh(M.geom(),matWorld);  m1.frustumCulled=false; scene.add(m1);
  var m2=new T.Mesh(MG.geom(),matGround); m2.frustumCulled=false; scene.add(m2);
  NO_PLANT.push(ngon(CX,CZ,R+2,16,0));
  NAMED_PLACES.push({name:'Cinematic Arts Courtyard',x:CX,z:CZ,h:5,rad:R+4});
  window.__sca=[CX,CZ,Math.round(bd*10)/10];
})();

/* ---- trees: OSM points + scattered fill on grass, plus LA palms ---- */
(function(){
  function insideRing(ring,x,z){
    var c=false;
    for(var i=0,j=ring.length-1;i<ring.length;j=i++){
      var a=ring[i],b=ring[j];
      if(((a[1]>z)!==(b[1]>z)) && (x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])) c=!c;
    }
    return c;
  }
  function blocked(x,z){
    if(onWalk(x,z)||inColHole(x,z)) return true;  /* never in the middle of a walk */
    for(var q=0;q<NO_PLANT.length;q++) if(insideRing(NO_PLANT[q],x,z)) return true;
    var k=gkey(Math.floor(x/CELL),Math.floor(z/CELL)), l=GRID[k];
    if(!l) return false;
    for(var i=0;i<l.length;i++){ var C=l[i];
      if(x>C.x0-3&&x<C.x1+3&&z>C.z0-3&&z<C.z1+3&&insideRing(C.ring,x,z)) return true; }
    return false;
  }
  for(var i=0;i<POINTS.length;i++)
    if(POINTS[i].k==='t' && !onWalk(POINTS[i].x,POINTS[i].z) && !blocked(POINTS[i].x,POINTS[i].z) && !inPlaza(POINTS[i].x,POINTS[i].z)) TREE_POS.push([POINTS[i].x,POINTS[i].z,0]);
  /* fill parks and grass polygons */
  var green=PARKS.map(function(p){return p.ring;});
  for(i=0;i<AREAS.length;i++) if(AREAS[i].k==='g'||AREAS[i].k==='w') green.push(AREAS[i].ring);
  for(var g=0;g<green.length;g++){
    var ring=green[g], x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(i=0;i<ring.length;i++){ var p=ring[i];
      if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<z0)z0=p[1]; if(p[1]>z1)z1=p[1]; }
    var area=(x1-x0)*(z1-z0), want=Math.min(24,Math.max(2,area/1050|0));
    for(var t=0,guard=0;t<want&&guard<want*14;guard++){
      var x=rr(x0,x1), z=rr(z0,z1);
      if(!insideRing(ring,x,z)||blocked(x,z)) continue;
      TREE_POS.push([x,z,rnd()<0.24?1:0]); t++;
    }
  }
  /* the trees themselves are built in the landscape pass, once everything is placed */
})();

/* ---- statues & monuments (Tommy Trojan gets the real treatment) ---- */
(function(){
  var bronze=new T.MeshLambertMaterial({color:0x7A6438,flatShading:true});
  var stone =new T.MeshLambertMaterial({color:0xCFC7B4,flatShading:true});
  var gold  =new T.MeshLambertMaterial({color:0xE0AE2A,flatShading:true});
  function pedestal(g,w,h){
    var b=new T.Mesh(new T.BoxGeometry(w,h,w),stone); b.position.y=h/2; g.add(b);
    var t=new T.Mesh(new T.BoxGeometry(w*1.18,h*0.12,w*1.18),stone); t.position.y=h; g.add(t);
    return h;
  }
  for(var i=0;i<POINTS.length;i++){
    var P0=POINTS[i]; if(P0.k==='t') continue;
    if(Math.hypot(P0.x-20,P0.z-61)<4) continue;   /* Traveler stands here instead */
    var g=new T.Group(); g.position.set(P0.x,0,P0.z);
    var isTommy = /Tommy Trojan/i.test(P0.name);
    var isTire = /Tirebiter/i.test(P0.name);
    if(isTire){
      /* paved circle, granite benches, the dog, a stack of tyres and a football */
      var CM=new Mesher();
      flat(CM,ngon(P0.x,P0.z,6.2,22,0),0.16,0x9B6249,1);
      flat(CM,ngon(P0.x,P0.z,5.5,22,0),0.18,0xC6C0B2,1);
      var tm2=new T.Mesh(CM.geom(),matGround); tm2.frustumCulled=false; scene.add(tm2);
      var gran=new T.MeshLambertMaterial({color:0xA8907C,flatShading:true});
      for(var q=0;q<3;q++){
        var aa=q/3*6.283+0.5;
        var bb=new T.Mesh(new T.BoxGeometry(2.7,0.46,0.62),gran);
        bb.position.set(P0.x+Math.cos(aa)*1.45,0.40,P0.z+Math.sin(aa)*1.45);
        bb.rotation.y=-aa; g.add(bb);
        var lg2=new T.Mesh(new T.BoxGeometry(2.4,0.40,0.34),gran);
        lg2.position.set(P0.x+Math.cos(aa)*1.45,0.19,P0.z+Math.sin(aa)*1.45);
        lg2.rotation.y=-aa; g.add(lg2);
      }
      g.position.set(0,0,0);
      /* George himself: built facing -Z in his own group, then turned to face
         down the walkway the way the real statue does */
      var dog=new T.Group();
      var bronzeD=new T.MeshLambertMaterial({color:0x6A5B42,flatShading:true});
      var bronzeL=new T.MeshLambertMaterial({color:0x7E6E52,flatShading:true});
      function blob(rx,ry,rz,px,py,pz,mat,rot){
        var m=new T.Mesh(new T.IcosahedronGeometry(1,1),mat||bronzeD);
        m.scale.set(rx,ry,rz); m.position.set(px,py,pz);
        if(rot) m.rotation.set(rot[0]||0,rot[1]||0,rot[2]||0);
        dog.add(m); return m;
      }
      blob(0.285,0.300,0.310, 0, 0.27, 0.22);          /* haunches            */
      blob(0.235,0.265,0.250, 0, 0.44, 0.00);          /* barrel              */
      blob(0.205,0.235,0.200, 0, 0.58,-0.17);          /* chest and shoulders */
      blob(0.245,0.110,0.090, 0, 0.66,-0.16, bronzeL); /* ruff                */
      blob(0.100,0.190,0.100, 0, 0.80,-0.19);          /* neck                */
      blob(0.180,0.170,0.185, 0, 0.99,-0.24);          /* skull               */
      blob(0.112,0.098,0.145, 0, 0.93,-0.44);          /* muzzle              */
      blob(0.050,0.044,0.046, 0, 0.955,-0.57);         /* nose                */
      blob(0.070,0.030,0.055, 0, 0.865,-0.50, bronzeL);/* jaw                 */
      for(var sd=-1;sd<=1;sd+=2){
        blob(0.042,0.125,0.080, sd*0.165, 0.94,-0.20, bronzeD,[0.30,0,sd*0.55]);
        blob(0.062,0.215,0.068, sd*0.125, 0.25,-0.36); /* foreleg             */
        blob(0.082,0.048,0.120, sd*0.125, 0.05,-0.42); /* front paw           */
        blob(0.098,0.058,0.130, sd*0.195, 0.05, 0.30); /* hind paw            */
        blob(0.055,0.055,0.055, sd*0.115, 0.985,-0.35, bronzeL); /* brow      */
      }
      blob(0.088,0.088,0.088, 0.02, 0.30, 0.42);
      blob(0.070,0.070,0.070, 0.04, 0.42, 0.51);
      blob(0.055,0.055,0.055, 0.06, 0.54, 0.55);
      blob(0.042,0.042,0.042, 0.07, 0.64, 0.53);       /* tail curling up     */
      blob(0.115,0.085,0.110, -0.20, 0.50, 0.06, bronzeL);
      blob(0.100,0.078,0.100,  0.21, 0.46, 0.10, bronzeL);
      blob(0.092,0.070,0.092, -0.17, 0.30, 0.26, bronzeL); /* a little shag   */
      var capM=new T.Mesh(new T.CylinderGeometry(0.140,0.200,0.090,7),bronzeL);
      capM.position.set(0,1.155,-0.22); dog.add(capM);
      var brimM=new T.Mesh(new T.BoxGeometry(0.225,0.032,0.155),bronzeL);
      brimM.position.set(0,1.118,-0.40); brimM.rotation.x=-0.14; dog.add(brimM);
      var collar=new T.Mesh(new T.TorusGeometry(0.112,0.030,4,10),bronzeL);
      collar.rotation.x=1.36; collar.position.set(0,0.765,-0.19); dog.add(collar);
      dog.position.set(P0.x,0.63,P0.z);
      dog.rotation.y=Math.atan2(P0.x,P0.z);
      g.add(dog);
      var rubber=new T.MeshLambertMaterial({color:0x26262A,flatShading:true});
      for(var ti2=0;ti2<3;ti2++){
        var tyre=new T.Mesh(new T.TorusGeometry(0.33,0.115,4,10),rubber);
        tyre.rotation.x=Math.PI/2;
        tyre.position.set(P0.x-1.55,0.14+ti2*0.22,P0.z+0.30); g.add(tyre);
      }
      var ball=new T.Mesh(new T.IcosahedronGeometry(0.20,1),bronzeL);
      ball.position.set(P0.x-1.55,0.84,P0.z+0.30); ball.scale.set(0.95,0.78,1.45); g.add(ball);
      var plaque=new T.Mesh(new T.BoxGeometry(1.5,0.95,0.14),
                            new T.MeshLambertMaterial({color:0x2A2E33,flatShading:true}));
      plaque.position.set(P0.x+1.55,0.62,P0.z+0.9); plaque.rotation.y=-0.7; g.add(plaque);
      scene.add(g);
      addCollider([[P0.x-2.2,P0.z-2.2],[P0.x+2.2,P0.z-2.2],[P0.x+2.2,P0.z+2.2],[P0.x-2.2,P0.z+2.2]],0.9);
      if(P0.name) NAMED_PLACES.push({name:P0.name,x:P0.x,z:P0.z,h:3});
      continue;
    }
    var ph = pedestal(g, isTommy?3.4:1.7, isTommy?3.2:1.5);
    if(isTommy){
      var body=new T.Mesh(new T.BoxGeometry(1.0,1.9,0.62),bronze); body.position.y=ph+1.6; g.add(body);
      var head=new T.Mesh(new T.IcosahedronGeometry(0.34,0),bronze); head.position.y=ph+2.85; g.add(head);
      var crest=new T.Mesh(new T.BoxGeometry(0.16,0.55,0.9),gold); crest.position.y=ph+3.15; g.add(crest);
      var la=new T.Mesh(new T.BoxGeometry(0.26,1.5,0.26),bronze);
      la.position.set(-0.72,ph+1.9,0); la.rotation.z=0.42; g.add(la);
      var ra=new T.Mesh(new T.BoxGeometry(0.26,1.5,0.26),bronze);
      ra.position.set(0.72,ph+1.9,0); ra.rotation.z=-0.55; g.add(ra);
      var sword=new T.Mesh(new T.BoxGeometry(0.1,2.6,0.16),gold);
      sword.position.set(0.98,ph+2.9,0); sword.rotation.z=-0.55; g.add(sword);
      var shield=new T.Mesh(new T.CylinderGeometry(0.62,0.62,0.14,7),gold);
      shield.rotation.x=Math.PI/2; shield.rotation.z=0.3;
      shield.position.set(-1.0,ph+1.75,0.16); g.add(shield);
      var skirt=new T.Mesh(new T.CylinderGeometry(0.58,0.7,0.7,8),bronze);
      skirt.position.y=ph+0.5; g.add(skirt);
    } else if(P0.k==='m'){
      var ob=new T.Mesh(new T.CylinderGeometry(0.05,0.42,4.4,4),stone); ob.position.y=ph+2.2; g.add(ob);
    } else {
      var f=new T.Mesh(new T.IcosahedronGeometry(0.85,0),bronze); f.position.y=ph+0.95;
      f.rotation.set(rr(0,3),rr(0,3),rr(0,3)); g.add(f);
    }
    scene.add(g);
    addCollider([[P0.x-1.1,P0.z-1.1],[P0.x+1.1,P0.z-1.1],[P0.x+1.1,P0.z+1.1],[P0.x-1.1,P0.z+1.1]], isTommy?3.5:1.7);
    if(P0.name) NAMED_PLACES.push({name:P0.name,x:P0.x,z:P0.z,h:4});
  }
})();

/* ================================================== campus props & planting */
(function(){
  var lampPts=[], benchPts=[], rackPts=[], palmRow=[], shadeRow=[], hedgeRow=[];
  /* a coarse hash of every walk, so nothing gets planted across a crossing */
  var PG={}, PGC=5;
  (function(){
    for(var i=0;i<PATHS.length;i++){
      var pts=PATHS[i].pts, pad=PATHS[i].w*0.78+1.0;
      for(var s=0;s<pts.length-1;s++){
        var a=pts[s], b=pts[s+1];
        var L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/2.5));
        for(var k=0;k<=n;k++){
          var x=a[0]+(b[0]-a[0])*k/n, z=a[1]+(b[1]-a[1])*k/n;
          var c0=Math.floor((x-pad)/PGC), c1=Math.floor((x+pad)/PGC),
              d0=Math.floor((z-pad)/PGC), d1=Math.floor((z+pad)/PGC);
          for(var cx=c0;cx<=c1;cx++) for(var cz=d0;cz<=d1;cz++){
            var key=cx+'_'+cz, l=PG[key]||(PG[key]=[]);
            if(l.indexOf(i)<0) l.push(i);
          }
        }
      }
    }
  })();
  function onOtherPath(x,z,self){
    var l=PG[Math.floor(x/PGC)+'_'+Math.floor(z/PGC)];
    if(!l) return false;
    for(var k=0;k<l.length;k++) if(l[k]!==self) return true;
    return false;
  }
  function blocked(x,z,pad){
    if(inColHole(x,z)) return true;
    for(var q=0;q<NO_PLANT.length;q++) if(inRing(NO_PLANT[q],x,z)) return true;
    var l=nearby(x,z,pad||1.5);
    for(var i=0;i<l.length;i++){ var C=l[i];
      if(C.h<1) continue;
      if(x<C.x0-1||x>C.x1+1||z<C.z0-1||z>C.z1+1) continue;
      if(inRing(C.ring,x,z)) return true; }
    return false;
  }
  /* keep statues, fountains and monuments in the clear */
  function nearMonument(x,z){
    for(var i=0;i<POINTS.length;i++){
      if(POINTS[i].k==='t') continue;
      if(Math.hypot(POINTS[i].x-x,POINTS[i].z-z)<13) return true;
    }
    return false;
  }
  /* minimum spacing per prop type, so overlapping paths do not stack them up */
  function Spacer(cell){ this.c=cell; this.g={}; }
  Spacer.prototype.ok=function(x,z){
    var cx=Math.floor(x/this.c), cz=Math.floor(z/this.c);
    for(var i=-1;i<=1;i++) for(var j=-1;j<=1;j++){
      var l=this.g[(cx+i)+'_'+(cz+j)];
      if(!l) continue;
      for(var k=0;k<l.length;k++)
        if(Math.hypot(l[k][0]-x,l[k][1]-z)<this.c) return false;
    }
    var key=cx+'_'+cz; (this.g[key]||(this.g[key]=[])).push([x,z]);
    return true;
  };
  var sLamp=new Spacer(18), sBench=new Spacer(22), sRack=new Spacer(52), sPalm=new Spacer(15);

  for(var i=0;i<PATHS.length;i++){
    var pts=PATHS[i].pts, w=PATHS[i].w;
    if(w<2.2) continue;
    var lampGap = w>=6?24:32, benchGap = w>=6?40:56, rackGap=95;
    var run=0;
    for(var s=0;s<pts.length-1;s++){
      var a=pts[s], b=pts[s+1];
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
      if(L<1) continue;
      dx/=L; dz/=L;
      var nx=-dz, nz=dx;
      for(var t=0;t<L;t+=1){
        run+=1;
        var px=a[0]+dx*t, pz=a[1]+dz*t;
        var side=(Math.floor(run/lampGap)%2)?1:-1;
        if(run%lampGap<1){
          var lx=px+nx*side*(w*0.5+1.35), lz=pz+nz*side*(w*0.5+1.35);
          if(!blocked(lx,lz,2)&&!nearMonument(lx,lz)&&sLamp.ok(lx,lz))
            lampPts.push([lx,lz,rnd()<(w>=6?0.72:0.22)]);
        }
        if(run%benchGap<1){
          var bx=px-nx*side*(w*0.5+1.5), bz=pz-nz*side*(w*0.5+1.5);
          if(!blocked(bx,bz,2)&&!nearMonument(bx,bz)&&sBench.ok(bx,bz))
            benchPts.push([bx,bz,Math.atan2(-dx,-dz)]);
        }
        /* clipped hedge panels edging the lawn beside the main walks */
        if(w>=6 && run%9<1){
          for(q=-1;q<=1;q+=2){
            var hx=px+nx*q*(w*0.75+3.4), hz=pz+nz*q*(w*0.75+3.4);
            var ex=hx+dx*6.0, ez=hz+dz*6.0;
            if(blocked(hx,hz,1.2)||blocked(ex,ez,1.2)) continue;
            if(nearMonument(hx,hz)||onOtherPath(hx,hz,i)||onOtherPath(ex,ez,i)) continue;
            hedgeRow.push([hx,hz,ex,ez]);
          }
        }
      }
    }
  }

  /* and along the edge of every lawn panel of any size */
  (function(){
    for(var g=0;g<AREAS.length;g++){
      if(AREAS[g].k!=='g') continue;
      var ring=AREAS[g].ring;
      if(Math.abs(ringArea(ring))<260) continue;
      var inner=offsetRing(ring,-1.1);
      if(!inner) continue;
      for(var e=0;e<inner.length;e++){
        var a=inner[e], b=inner[(e+1)%inner.length];
        var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
        if(L<7) continue;
        dx/=L; dz/=L;
        var panels=Math.floor(L/9.2);
        for(var k=0;k<panels;k++){
          var u0=L*(k+0.06)/panels, u1=L*(k+0.80)/panels;
          var x0=a[0]+dx*u0, z0=a[1]+dz*u0, x1=a[0]+dx*u1, z1=a[1]+dz*u1;
          var mx=(x0+x1)*0.5, mz=(z0+z1)*0.5;
          if(blocked(mx,mz,1.2)||onOtherPath(mx,mz,-1)||nearMonument(mx,mz)) continue;
          if(Math.hypot(x1-x0,z1-z0)<2.5) continue;
          hedgeRow.push([x0,z0,x1,z1]);
        }
      }
    }
  })();
  function box(x,z,r,h){ addCollider([[x-r,z-r],[x+r,z-r],[x+r,z+r],[x-r,z+r]],h); }
  var M=new Mesher(), D=new T.Object3D();

  /* ---- the clipped hedges that edge every lawn panel ---- */
  for(i=0;i<hedgeRow.length;i++){
    var H=hedgeRow[i];
    var hc=(i%3===0)?0x2F6B2C:((i%3===1)?0x35762F:0x2B6129);
    segBox(M,[H[0],H[1]],[H[2],H[3]],0.02,0.62,0.92,hc,0.56);
    segBox(M,[H[0],H[1]],[H[2],H[3]],0.62,0.74,0.78,hc,0.80);
    addCollider([[Math.min(H[0],H[2])-0.42,Math.min(H[1],H[3])-0.42],
                 [Math.max(H[0],H[2])+0.42,Math.min(H[1],H[3])-0.42],
                 [Math.max(H[0],H[2])+0.42,Math.max(H[1],H[3])+0.42],
                 [Math.min(H[0],H[2])-0.42,Math.max(H[1],H[3])+0.42]],0.72);
  }

  /* ---- lamp posts ---- */
  var poleG=new T.CylinderGeometry(0.072,0.10,4.3,6); poleG.translate(0,2.15,0);
  var baseG=new T.CylinderGeometry(0.16,0.20,0.42,6); baseG.translate(0,0.21,0);
  var globeG=(function(){
    var parts=[];
    var core=new T.IcosahedronGeometry(0.30,0); core.translate(0,0.62,0); parts.push(core);
    var stem=new T.CylinderGeometry(0.05,0.05,0.62,4); stem.translate(0,0.31,0); parts.push(stem);
    for(var q=0;q<4;q++){
      var ang=q/4*6.283185+0.785;
      var ox=Math.cos(ang)*0.52, oz=Math.sin(ang)*0.52;
      var gb=new T.IcosahedronGeometry(0.25,0); gb.translate(ox,0.20,oz); parts.push(gb);
      var arm=new T.BoxGeometry(0.055,0.055,0.55);
      arm.rotateY(-ang); arm.translate(ox*0.5,0.06,oz*0.5); parts.push(arm);
      var st2=new T.CylinderGeometry(0.045,0.045,0.24,4); st2.translate(ox,-0.06,oz); parts.push(st2);
    }
    var p=[],n=[];
    parts.forEach(function(g){
      var pos=g.attributes.position, nor=g.attributes.normal, idx=g.index, o=[],k;
      if(idx){ for(k=0;k<idx.count;k++) o.push(idx.getX(k)); }
      else { for(k=0;k<pos.count;k++) o.push(k); }
      for(var m2=0;m2<o.length;m2++){ var j=o[m2];
        p.push(pos.getX(j),pos.getY(j),pos.getZ(j));
        n.push(nor.getX(j),nor.getY(j),nor.getZ(j)); }
    });
    var gg=new T.BufferGeometry();
    gg.setAttribute('position',new T.Float32BufferAttribute(p,3));
    gg.setAttribute('normal',new T.Float32BufferAttribute(n,3));
    gg.computeBoundingSphere(); return gg;
  })();
  var _unusedLantern=(function(){
    var g1=new T.CylinderGeometry(0.155,0.245,0.40,6); g1.translate(0,0.20,0);
    var g2=new T.ConeGeometry(0.27,0.17,6); g2.translate(0,0.485,0);
    var p=[],n=[];
    [g1,g2].forEach(function(g){
      var pos=g.attributes.position, nor=g.attributes.normal, idx=g.index, o=[],q;
      if(idx){ for(q=0;q<idx.count;q++) o.push(idx.getX(q)); }
      else { for(q=0;q<pos.count;q++) o.push(q); }
      for(var k=0;k<o.length;k++){ var j=o[k];
        p.push(pos.getX(j),pos.getY(j),pos.getZ(j));
        n.push(nor.getX(j),nor.getY(j),nor.getZ(j)); }
    });
    var gg=new T.BufferGeometry();
    gg.setAttribute('position',new T.Float32BufferAttribute(p,3));
    gg.setAttribute('normal',new T.Float32BufferAttribute(n,3));
    gg.computeBoundingSphere(); return gg;
  })();
  var armG=new T.BoxGeometry(0.07,0.07,0.5);
  var poleM=new T.MeshLambertMaterial({color:0x2E3238,flatShading:true});
  var globeM=new T.MeshLambertMaterial({color:0x3A3E44,emissive:0x2a2109,flatShading:true});
  var bannerM=new T.MeshLambertMaterial({color:0x8E1218,flatShading:true,side:T.DoubleSide});
  var bannerG=new T.PlaneGeometry(0.52,1.35);
  var nLamp=lampPts.length;
  var iPole=new T.InstancedMesh(poleG,poleM,nLamp),
      iBase=new T.InstancedMesh(baseG,poleM,nLamp),
      iGlobe=new T.InstancedMesh(globeG,globeM,nLamp);
  var banners=lampPts.filter(function(p){return p[2];});
  var iBan=new T.InstancedMesh(bannerG,bannerM,Math.max(1,banners.length)),
      iArm=new T.InstancedMesh(armG,poleM,Math.max(1,banners.length));
  var bi=0;
  for(i=0;i<nLamp;i++){
    var p=lampPts[i], sc=rr(0.95,1.06);
    D.position.set(p[0],0,p[1]); D.rotation.set(0,rr(0,6.28),0); D.scale.set(1,sc,1);
    D.updateMatrix(); iPole.setMatrixAt(i,D.matrix); iBase.setMatrixAt(i,D.matrix);
    D.position.y=4.3*sc-0.10; D.scale.set(1,1,1); D.updateMatrix(); iGlobe.setMatrixAt(i,D.matrix);
    box(p[0],p[1],0.26,3.0);
    if(p[2]){
      var ang=rr(0,6.28);
      D.position.set(p[0],3.05,p[1]); D.rotation.set(0,ang,0); D.scale.set(1,1,1);
      D.translateZ(0.30); D.updateMatrix(); iArm.setMatrixAt(bi,D.matrix);
      D.position.set(p[0],2.45,p[1]); D.rotation.set(0,ang+Math.PI/2,0);
      D.position.x+=Math.sin(ang)*0.30; D.position.z+=Math.cos(ang)*0.30;
      D.updateMatrix(); iBan.setMatrixAt(bi,D.matrix); bi++;
    }
  }
  iBan.count=Math.max(1,bi); iArm.count=Math.max(1,bi);
  [iPole,iBase,iGlobe,iBan,iArm].forEach(function(m){ m.frustumCulled=false; m.raycast=function(){}; scene.add(m); });

  /* ---- benches ---- */
  var seatG=new T.BoxGeometry(1.85,0.10,0.50); seatG.translate(0,0.46,0);
  var backG=new T.BoxGeometry(1.85,0.42,0.09); backG.translate(0,0.72,-0.21);
  var legG =new T.BoxGeometry(0.09,0.44,0.46); legG.translate(0,0.22,0);
  var woodM=new T.MeshLambertMaterial({color:0x8A6A47,flatShading:true});
  var ironM=new T.MeshLambertMaterial({color:0x33383E,flatShading:true});
  var nB=Math.max(1,benchPts.length);
  var iSeat=new T.InstancedMesh(seatG,woodM,nB), iBack=new T.InstancedMesh(backG,woodM,nB),
      iLegA=new T.InstancedMesh(legG,ironM,nB), iLegB=new T.InstancedMesh(legG,ironM,nB);
  for(i=0;i<benchPts.length;i++){
    var q2=benchPts[i];
    D.position.set(q2[0],0,q2[1]); D.rotation.set(0,q2[2],0); D.scale.set(1,1,1);
    D.updateMatrix(); iSeat.setMatrixAt(i,D.matrix); iBack.setMatrixAt(i,D.matrix);
    D.translateX(-0.78); D.updateMatrix(); iLegA.setMatrixAt(i,D.matrix);
    D.position.set(q2[0],0,q2[1]); D.rotation.set(0,q2[2],0);
    D.translateX(0.78); D.updateMatrix(); iLegB.setMatrixAt(i,D.matrix);
    box(q2[0],q2[1],0.62,0.85);
  }
  iSeat.count=iBack.count=iLegA.count=iLegB.count=Math.max(1,benchPts.length);
  [iSeat,iBack,iLegA,iLegB].forEach(function(m){ m.frustumCulled=false; m.raycast=function(){}; scene.add(m); });

  /* ---- palm rows ---- */
  var pT2=new T.CylinderGeometry(0.26,0.46,1,7); pT2.translate(0,0.5,0);
  var pM2=new T.MeshLambertMaterial({color:0x93805E,flatShading:true});
  var frondG=(function(){
    var g1=new T.ConeGeometry(4.0,1.5,8); g1.translate(0,0.10,0);
    var g2=new T.ConeGeometry(2.6,1.7,8); g2.translate(0,0.95,0);
    var p=[],n=[];
    [g1,g2].forEach(function(g){
      var pos=g.attributes.position, nor=g.attributes.normal, idx=g.index, o=[],i;
      if(idx){ for(i=0;i<idx.count;i++) o.push(idx.getX(i)); }
      else { for(i=0;i<pos.count;i++) o.push(i); }
      for(var k=0;k<o.length;k++){ var j=o[k];
        p.push(pos.getX(j),pos.getY(j),pos.getZ(j));
        n.push(nor.getX(j),nor.getY(j),nor.getZ(j)); }
    });
    var g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(n,3));
    g.computeBoundingSphere(); return g;
  })();
  var fM2=new T.MeshLambertMaterial({color:0x4C8F3C,flatShading:true});
  var nP=Math.max(1,palmRow.length);
  var iPt=new T.InstancedMesh(pT2,pM2,nP), iPf=new T.InstancedMesh(frondG,fM2,nP);
  for(i=0;i<palmRow.length;i++){
    var pp=palmRow[i], hh=rr(9.5,14.5);
    D.position.set(pp[0],0,pp[1]); D.rotation.set(rr(-0.04,0.04),rr(0,6.28),rr(-0.04,0.04));
    D.scale.set(1,hh,1); D.updateMatrix(); iPt.setMatrixAt(i,D.matrix);
    D.position.set(pp[0],hh,pp[1]); D.rotation.set(0,rr(0,6.28),0);
    D.scale.set(rr(0.85,1.15),rr(0.9,1.2),rr(0.85,1.15)); D.updateMatrix(); iPf.setMatrixAt(i,D.matrix);
    box(pp[0],pp[1],0.42,2.6);
  }
  iPt.count=palmRow.length; iPf.count=palmRow.length;
  iPt.frustumCulled=false; iPf.frustumCulled=false;
  iPt.raycast=function(){}; iPf.raycast=function(){};
  scene.add(iPt); scene.add(iPf);

  /* ---- big shade trees down the walkways ---- */
  var stTrunk=new T.CylinderGeometry(0.30,0.52,1,7); stTrunk.translate(0,0.5,0);
  var stTrunkM=new T.MeshLambertMaterial({color:0x6E5540,flatShading:true});
  var stCanopy=new T.IcosahedronGeometry(1,1);
  var stCanopyM=new T.MeshLambertMaterial({color:0x4E9440,flatShading:true,vertexColors:true});
  (function(){var n2=stCanopy.attributes.position.count,arr=new Float32Array(n2*3);
    for(var q=0;q<n2*3;q++) arr[q]=1;
    stCanopy.setAttribute('color',new T.Float32BufferAttribute(arr,3));})();
  var nS=Math.max(1,shadeRow.length);
  var iSt=new T.InstancedMesh(stTrunk,stTrunkM,nS),
      iSc=new T.InstancedMesh(stCanopy,stCanopyM,nS);
  var tc=new T.Color();
  for(i=0;i<shadeRow.length;i++){
    var sp2=shadeRow[i], th=rr(6.6,8.8);
    D.position.set(sp2[0],0,sp2[1]); D.rotation.set(0,rr(0,6.28),0);
    D.scale.set(1,th,1); D.updateMatrix(); iSt.setMatrixAt(i,D.matrix);
    var cw2=rr(4.2,6.0);
    D.position.set(sp2[0],th+cw2*0.40,sp2[1]);
    D.rotation.set(rr(-0.2,0.2),rr(0,6.28),rr(-0.2,0.2));
    D.scale.set(cw2,cw2*rr(0.62,0.82),cw2*rr(0.9,1.1));
    D.updateMatrix(); iSc.setMatrixAt(i,D.matrix);
    tc.setHex([0x4E9440,0x5CA649,0x438A38][i%3]).multiplyScalar(rr(0.88,1.1));
    iSc.setColorAt(i,tc);
    box(sp2[0],sp2[1],0.52,3.2);
  }
  iSt.count=shadeRow.length; iSc.count=shadeRow.length;
  if(iSc.instanceColor) iSc.instanceColor.needsUpdate=true;
  [iSt,iSc].forEach(function(m){ m.frustumCulled=false; m.raycast=function(){}; scene.add(m); });

  /* ---- the guard kiosks that sit at every vehicle entrance to campus ---- */
  (function(){
    var major=[], cellM=40, gM={};
    for(var r=0;r<ROADS.length;r++){
      if(ROADS[r].w<9) continue;
      var ps=ROADS[r].pts;
      for(var q=0;q<ps.length;q++){
        var k=Math.floor(ps[q][0]/cellM)+'_'+Math.floor(ps[q][1]/cellM);
        (gM[k]||(gM[k]=[])).push(ps[q]);
      }
    }
    function nearMajor(x,z,rad){
      var cx=Math.floor(x/cellM), cz=Math.floor(z/cellM);
      for(var i=-1;i<=1;i++) for(var j=-1;j<=1;j++){
        var l=gM[(cx+i)+'_'+(cz+j)]; if(!l) continue;
        for(var k=0;k<l.length;k++) if(Math.hypot(l[k][0]-x,l[k][1]-z)<rad) return true;
      }
      return false;
    }
    var sGate=new Spacer(46), gates=[];
    for(r=0;r<ROADS.length;r++){
      if(ROADS[r].w>7||ROADS[r].w<4) continue;
      var pts2=ROADS[r].pts; if(pts2.length<2) continue;
      var ends=[[pts2[0],pts2[1]],[pts2[pts2.length-1],pts2[pts2.length-2]]];
      for(var e=0;e<2;e++){
        var p0=ends[e][0], p1=ends[e][1];
        if(p0[0]<-640||p0[0]>700||p0[1]<-690||p0[1]>540) continue;
        if(!nearMajor(p0[0],p0[1],30)) continue;
        if(!sGate.ok(p0[0],p0[1])) continue;
        var ddx=p1[0]-p0[0], ddz=p1[1]-p0[1], dL=Math.hypot(ddx,ddz)||1;
        gates.push([p0[0]+ddx/dL*7, p0[1]+ddz/dL*7, Math.atan2(ddx/dL,ddz/dL)]);
        if(gates.length>18) break;
      }
      if(gates.length>18) break;
    }
    if(!gates.length) return;
    var KM=new Mesher();
    var armM=new T.MeshLambertMaterial({color:0xF2F0E8,flatShading:true});
    var armG=new T.BoxGeometry(0.16,0.16,7.0);
    var bandG=new T.BoxGeometry(0.19,0.19,0.85);
    var redM=new T.MeshLambertMaterial({color:0x9E1B1B,flatShading:true});
    var iArm2=new T.InstancedMesh(armG,armM,gates.length),
        iRed=new T.InstancedMesh(bandG,redM,gates.length*3);
    var ri2=0;
    for(var gI=0;gI<gates.length;gI++){
      var G=gates[gI], gx2=G[0], gz2=G[1], ga=G[2];
      var sx=Math.cos(ga), sz=-Math.sin(ga);             /* across the road */
      var kx=gx2+sx*5.2, kz=gz2+sz*5.2;
      var kq=[[kx-1.5,kz-1.5],[kx+1.5,kz-1.5],[kx+1.5,kz+1.5],[kx-1.5,kz+1.5]];
      if(ringArea(kq)<0) kq.reverse();
      prism(KM,kq,0,3.1,0xA3503A,0xA3503A,0.55);
      band(KM,kq,0,0.55,0.16,C_CAST,1,0.74);
      band(KM,kq,1.25,2.45,0.10,0x2C343A,0.9,0.7,true);
      band(KM,kq,2.7,3.1,0.20,C_CAST,1,0.78,true);
      var ke=offsetRing(kq,0.85);
      band(KM,ke,3.1,3.35,0,C_TILE_D,0.85,0.5);
      hipRoof(KM,ke,3.35,1.5,1.35,C_TILE);
      addCollider(kq,3.1);
      D.position.set(gx2+sx*1.3,1.05,gz2+sz*1.3);
      D.rotation.set(0,ga+Math.PI/2,0); D.scale.set(1,1,1);
      D.updateMatrix(); iArm2.setMatrixAt(gI,D.matrix);
      for(var bI=0;bI<3;bI++){
        D.position.set(gx2+sx*(1.3-2.2+bI*2.2),1.05,gz2+sz*(1.3-2.2+bI*2.2));
        D.rotation.set(0,ga+Math.PI/2,0); D.updateMatrix();
        iRed.setMatrixAt(ri2++,D.matrix);
      }
    }
    iRed.count=ri2;
    var km=new T.Mesh(KM.geom(),matWorld); km.frustumCulled=false; scene.add(km);
    [iArm2,iRed].forEach(function(m){ m.frustumCulled=false; m.raycast=function(){}; scene.add(m); });
    window.__gates=gates.length;
  })();

  /* ---- fountains: real basins, bowls, falling water and jets ---- */
  var MGf=new Mesher(), nFount=0;
  for(i=0;i<WATER.length;i++){
    var ring=WATER[i];
    if(ring.length<3) continue;
    var A=Math.abs(ringArea(ring));
    if(A<6) continue;
    var cwq=centroid(ring);
    if(Math.hypot(cwq[0]-18,cwq[1]-43)<14) continue;   /* Hahn Plaza, built with Traveler */
    var laW=longAxisOf(ring);
    if(laW[2]>12&&A/laW[2]<laW[2]/3){             /* long and thin: a reflecting pool */
      fountainRing(M,MGf,ring,0,0); nFount++; continue;
    }
    if(A<190){                                   /* a rectangle in the data, a round basin in life */
      var cw=centroid(ring);
      ring=ngon(cw[0],cw[1],Math.sqrt(A/Math.PI)*1.08,22,0);
    }
    fountainRing(M,MGf,ring,A>110?2:1,0);
    nFount++;
  }
  var mesh=new T.Mesh(M.geom(),matWorld); mesh.frustumCulled=false; scene.add(mesh);
  var mgf=new T.Mesh(MGf.geom(),matGround); mgf.frustumCulled=false; scene.add(mgf);
  /* the water itself: jets, and the sheets spilling off each bowl rim */
  var jetM=new T.MeshLambertMaterial({color:0xDCF1FB,transparent:true,opacity:0.70,flatShading:true});
  var jetG=new T.CylinderGeometry(0.075,0.20,1,6); jetG.translate(0,0.5,0);
  var iJet=new T.InstancedMesh(jetG,jetM,Math.max(1,FOUNT_JETS.length));
  for(i=0;i<FOUNT_JETS.length;i++){
    var j2=FOUNT_JETS[i];
    D.position.set(j2[0],j2[2],j2[1]); D.rotation.set(0,0,0); D.scale.set(j2[4],j2[3],j2[4]);
    D.updateMatrix(); iJet.setMatrixAt(i,D.matrix);
  }
  iJet.count=Math.max(1,FOUNT_JETS.length);
  iJet.frustumCulled=false; iJet.raycast=function(){}; scene.add(iJet);
  var shM=new T.MeshLambertMaterial({color:0xD6EBF8,transparent:true,opacity:0.46,
                                     flatShading:true,side:T.DoubleSide});
  var shG=new T.CylinderGeometry(1,1.06,1,20,1,true);
  var iSh=new T.InstancedMesh(shG,shM,Math.max(1,FOUNT_SHEETS.length));
  for(i=0;i<FOUNT_SHEETS.length;i++){
    var s2=FOUNT_SHEETS[i];
    D.position.set(s2[0],s2[5],s2[1]); D.rotation.set(0,0,0); D.scale.set(s2[2],s2[4],s2[2]);
    D.updateMatrix(); iSh.setMatrixAt(i,D.matrix);
  }
  iSh.count=Math.max(1,FOUNT_SHEETS.length);
  iSh.frustumCulled=false; iSh.raycast=function(){}; scene.add(iSh);
  window.__props={lamps:nLamp,benches:benchPts.length,racks:0,palms:palmRow.length,shade:shadeRow.length,
                  fountains:nFount,jets:FOUNT_JETS.length,hedges:hedgeRow.length};
})();

/* ======================================================= collision & ground */
function inRing(ring,x,z){
  var c=false;
  for(var i=0,j=ring.length-1;i<ring.length;j=i++){
    var a=ring[i],b=ring[j];
    if(((a[1]>z)!==(b[1]>z)) && (x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])) c=!c;
  }
  return c;
}
function nearby(x,z,pad){
  var out=[], cx0=Math.floor((x-pad)/CELL),cx1=Math.floor((x+pad)/CELL),
      cz0=Math.floor((z-pad)/CELL),cz1=Math.floor((z+pad)/CELL);
  for(var cx=cx0;cx<=cx1;cx++) for(var cz=cz0;cz<=cz1;cz++){
    var l=GRID[gkey(cx,cz)]; if(l) for(var i=0;i<l.length;i++) if(out.indexOf(l[i])<0) out.push(l[i]);
  }
  return out;
}
/* highest surface under (x,z) that is at or below `ceil` */
function groundAt(x,z,ceil){
  var best=inColHole(x,z)?COL.fld:0, l=nearby(x,z,1);
  for(var i=0;i<l.length;i++){
    var C=l[i];
    if(C.h<=best||C.h>ceil+0.001) continue;
    if(x<C.x0||x>C.x1||z<C.z0||z>C.z1) continue;
    if(inRing(C.ring,x,z)) best=C.h;
  }
  return best;
}
/* push a circle of radius r out of every prism whose top is above feetY */
function resolve(pos,r,feetY){
  var l=nearby(pos.x,pos.z,r+1.5), moved=false;
  for(var it=0;it<3;it++){
    var any=false;
    for(var i=0;i<l.length;i++){
      var C=l[i];
      if(C.h<=feetY+0.22) continue;
      if(pos.x<C.x0-r||pos.x>C.x1+r||pos.z<C.z0-r||pos.z>C.z1+r) continue;
      var ring=C.ring, n=ring.length, bestD=1e9, bx=0,bz=0;
      for(var j=0;j<n;j++){
        var a=ring[j], b=ring[(j+1)%n];
        var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz||1e-9;
        var t=((pos.x-a[0])*dx+(pos.z-a[1])*dz)/L2; t=t<0?0:(t>1?1:t);
        var qx=a[0]+dx*t, qz=a[1]+dz*t;
        var d=(pos.x-qx)*(pos.x-qx)+(pos.z-qz)*(pos.z-qz);
        if(d<bestD){ bestD=d; bx=qx; bz=qz; }
      }
      var inside=inRing(ring,pos.x,pos.z), dist=Math.sqrt(bestD);
      if(!inside && dist>=r) continue;
      var nx=pos.x-bx, nz=pos.z-bz, L=dist||1e-6;
      if(inside){ nx=-nx/L; nz=-nz/L; } else { nx=nx/L; nz=nz/L; }
      var push=inside?(r+dist):(r-dist);
      pos.x+=nx*push; pos.z+=nz*push; any=true; moved=true;
    }
    if(!any) break;
  }
  return moved;
}
