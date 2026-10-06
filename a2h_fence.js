/* ==================================================================
   The campus perimeter fence: about seven feet of black steel pickets
   on the campus side of the sidewalk along Vermont, Jefferson,
   Figueroa and Exposition.
   - RING is the fence line, set back from the kerb of each street.
   - GATES are the pedestrian entrances from USC's own entrance map:
     the fence stops at a brick pier either side and a row of bollards
     crosses the opening.
   - Every other driveway that crosses the line gets an opening with a
     lowered barrier arm, so no road runs into railings.
   - Where a building already stands on the line, the building is the wall.
   FENCE_RUNS (the solid stretches) is read by the crowd, so students
   only come and go through the entrances, and by the minimap.
   ================================================================== */
var FENCE_RUNS=[], FENCE_GATES=[];
(function(){
  var H=2.15, BLACK=0x17181A, BRICK=0x9A4A34, BRICKD=0x86402D, CAST=0xDCD2BC, BOLL=0x77736C;
  var RING=[[-550,-523.7],[-280.7,-524.5],[-249.1,-520.7],[-223.1,-514.2],[-163.5,-482.9],[57.6,-360.9],
            [117.6,-329.8],[238.6,-264.8],[273.6,-246.8],[396.5,-180.4],[421.5,-172.4],[478.1,-141.8],   /* Jefferson */
            [274.8,239.4],                                                                               /* Figueroa */
            [218,244.5],[162,244.2],[158,243.3],[43,243.3],[3,238.7],[-93,238.7],[-133,243.3],
            [-550,243.3]];                                                                               /* Exposition, then Vermont */
  var GATES=[
    {name:'McClintock Avenue entrance', x:-163,  z:-483,   hw:8},
    {name:'Watt Way entrance (Jefferson)', x:6.8, z:-388.9, hw:7},
    {name:'Royal Street entrance',      x:182.7, z:-294.8, hw:8},
    {name:'McCarthy Way entrance',      x:397.5, z:9,      hw:9},
    {name:'Pardee Way entrance',        x:170.5, z:244.2,  hw:13},
    {name:'Trousdale Parkway entrance', x:-86,   z:238.7,  hw:22},
    {name:'Watt Way entrance (Exposition)', x:-330, z:243.3, hw:7},
    {name:'Downey Way entrance',        x:-550,  z:-155.5, hw:7}
  ];

  /* ---- the line, measured along its length ---- */
  var n=RING.length, cum=[0], i;
  for(i=0;i<n;i++){ var a=RING[i], b=RING[(i+1)%n]; cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1])); }
  var TOTAL=cum[n];
  function at(s){
    s=((s%TOTAL)+TOTAL)%TOTAL;
    for(var k=0;k<n;k++) if(s<=cum[k+1]){
      var a=RING[k], b=RING[(k+1)%n], L=cum[k+1]-cum[k], t=(s-cum[k])/L;
      return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, (b[0]-a[0])/L, (b[1]-a[1])/L];
    }
    return [RING[0][0],RING[0][1],1,0];
  }
  function project(x,z){
    var best=0, bd=1e9;
    for(var k=0;k<n;k++){ var a=RING[k], b=RING[(k+1)%n], dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz;
      var t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/L2));
      var d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
      if(d<bd){ bd=d; best=cum[k]+Math.sqrt(L2)*t; } }
    return best;
  }
  function segHit(a,b,c,d){            /* parameter along c-d where a-b crosses it, or -1 */
    var o=function(p,q,r){ return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]); };
    var d1=o(a,b,c), d2=o(a,b,d), d3=o(c,d,a), d4=o(c,d,b);
    if(d1*d2<0&&d3*d4<0) return d1/(d1-d2);
    return -1;
  }

  /* ---- openings: [from, to, kind, gate] along the line ---- */
  var OPEN=[];
  GATES.forEach(function(g){ g.s=project(g.x,g.z); OPEN.push([g.s-g.hw,g.s+g.hw,'ped',g]); });
  var veh=[];
  for(i=0;i<ROADS.length;i++){ var R=ROADS[i]; if(R.w<4||R.w>10) continue;
    for(var j=0;j<R.pts.length-1;j++) for(var k=0;k<n;k++){
      var t=segHit(R.pts[j],R.pts[j+1],RING[k],RING[(k+1)%n]); if(t<0) continue;
      var s=cum[k]+(cum[k+1]-cum[k])*t, inGate=false;
      GATES.forEach(function(g){ if(Math.abs(s-g.s)<g.hw+5) inGate=true; });
      if(!inGate) veh.push([s-R.w*0.5-1.7,s+R.w*0.5+1.7]);
    } }
  veh.sort(function(p,q){ return p[0]-q[0]; });
  for(i=0;i<veh.length;i++){
    if(i&&veh[i][0]<OPEN[OPEN.length-1][1]+3&&OPEN[OPEN.length-1][2]==='veh') OPEN[OPEN.length-1][1]=Math.max(OPEN[OPEN.length-1][1],veh[i][1]);
    else OPEN.push([veh[i][0],veh[i][1],'veh',null]);
  }

  /* ---- walk the line in half metre steps: railings, an opening, or a building in the way ---- */
  var BLD=[];
  CAMPUS.concat(BUILDINGS).forEach(function(B){ var r=B.ring, x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    r.forEach(function(p){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); });
    if(x1<-560||x0>500||z1<-540||z0>255) return;
    BLD.push([r,x0-1,x1+1,z0-1,z1+1]); });
  function inBuilding(x,z){
    for(var q=0;q<BLD.length;q++){ var B=BLD[q]; if(x<B[1]||x>B[2]||z<B[3]||z>B[4]) continue;
      if(inRing(B[0],x,z)) return true;
      for(var e=0;e<4;e++) if(inRing(B[0],x+(e<2?(e?0.8:-0.8):0),z+(e>1?(e>2?0.8:-0.8):0))) return true; }
    return false;
  }
  var STEP=0.5, NS=Math.floor(TOTAL/STEP), solid=new Uint8Array(NS);
  for(i=0;i<NS;i++){
    var s=i*STEP, ok=true;
    for(var q=0;q<OPEN.length;q++){ var O=OPEN[q];
      if((s>O[0]&&s<O[1])||(s+TOTAL>O[0]&&s+TOTAL<O[1])||(s-TOTAL>O[0]&&s-TOTAL<O[1])){ ok=false; break; } }
    if(ok){ var p=at(s); if(inBuilding(p[0],p[1])) ok=false; }
    solid[i]=ok?1:0;
  }
  /* solid stretches as polylines that keep the corners of the line */
  var start=0; while(start<NS&&solid[start]) start++;           /* begin at an opening so no run wraps round */
  if(start>=NS) start=0;
  for(i=0;i<NS;){
    var ia=(start+i)%NS;
    if(!solid[ia]){ i++; continue; }
    var len=0; while(len<NS-i&&solid[(start+i+len)%NS]) len++;
    var s0=ia*STEP, s1=s0+(len-1)*STEP;
    if(len*STEP>1.6){
      var pts=[at(s0).slice(0,2)];
      for(var k=0;k<n*2;k++){ var sc=cum[k%n]+(k>=n?TOTAL:0); if(sc>s0+0.3&&sc<s1-0.3) pts.push(RING[k%n].slice()); }
      pts.push(at(s1).slice(0,2));
      FENCE_RUNS.push(pts);
    }
    i+=len;
  }

  /* ---- build it ---- */
  var M=new Mesher(), cols=[], P=[], UV=[], TILE=1.2;
  function box(x,z,r,h){ cols.push([[[x-r,z-r],[x+r,z-r],[x+r,z+r],[x-r,z+r]],h]); }
  FENCE_RUNS.forEach(function(run){
    var u=0;
    for(var k=0;k<run.length-1;k++){
      var a=run[k], b=run[k+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<0.05) continue;
      var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      /* the panel: one quad, the pickets are in the texture */
      P.push(a[0],0,a[1], b[0],0,b[1], b[0],H,b[1],  a[0],0,a[1], b[0],H,b[1], a[0],H,a[1]);
      UV.push(u,0, u+L/TILE,0, u+L/TILE,1,  u,0, u+L/TILE,1, u,1);
      u+=L/TILE; u-=Math.floor(u);
      /* posts */
      var np=Math.max(1,Math.round(L/2.4));
      for(var q=(k?1:0);q<=np;q++){ var x=a[0]+dx*L*q/np, z=a[1]+dz*L*q/np;
        postAt(M,x,z,0,H+0.05,0.05,BLACK,0.75); postAt(M,x,z,H+0.05,H+0.12,0.07,BLACK,0.9); }
      /* something to walk into, in pieces short enough for the collision grid */
      var nc=Math.max(1,Math.ceil(L/22));
      for(q=0;q<nc;q++){
        var c0=[a[0]+dx*L*q/nc,a[1]+dz*L*q/nc], c1=[a[0]+dx*L*(q+1)/nc,a[1]+dz*L*(q+1)/nc], nx=-dz*0.14, nz=dx*0.14;
        var r=[[c0[0]+nx,c0[1]+nz],[c1[0]+nx,c1[1]+nz],[c1[0]-nx,c1[1]-nz],[c0[0]-nx,c0[1]-nz]];
        if(ringArea(r)<0) r.reverse(); cols.push([r,H]);
      }
    }
  });
  function pier(p){                                   /* brick pier with a cast stone base and cap */
    postAt(M,p[0],p[1],0,0.35,0.52,CAST,0.72); postAt(M,p[0],p[1],0.35,2.5,0.42,BRICK,0.6);
    for(var y=0.7;y<2.4;y+=0.42) postAt(M,p[0],p[1],y,y+0.03,0.425,BRICKD,0.8);
    postAt(M,p[0],p[1],2.5,2.68,0.55,CAST,0.8); postAt(M,p[0],p[1],2.68,2.82,0.34,CAST,0.9);
    box(p[0],p[1],0.5,2.7);
  }
  function bollard(x,z){
    var r1=ngon(x,z,0.21,8,0), r2=ngon(x,z,0.13,8,0), r3=ngon(x,z,0.17,8,0);
    [r1,r2,r3].forEach(function(r){ if(ringArea(r)<0) r.reverse(); });
    prism(M,r1,0,0.2,BOLL,BOLL,0.6); prism(M,r2,0.2,0.78,BOLL,BOLL,0.62); prism(M,r3,0.78,0.86,BOLL,BOLL,0.8);
    coneRoof(M,x,z,0.13,0.86,0.16,BOLL,8);
    box(x,z,0.2,0.95);
  }
  OPEN.forEach(function(O){
    var a=at(O[0]), b=at(O[1]), W=O[1]-O[0];
    if(inBuilding(a[0],a[1])&&inBuilding(b[0],b[1])) return;
    if(O[2]==='ped'){
      pier(a); pier(b);
      var nb=Math.max(2,Math.round((W-1.6)/1.8));
      for(var k=0;k<nb;k++){ var p=at(O[0]+0.8+(W-1.6)*(k+0.5)/nb); bollard(p[0],p[1]); }
      FENCE_GATES.push({name:O[3].name,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,hw:W/2});
      NO_PLANT.push(ngon((a[0]+b[0])/2,(a[1]+b[1])/2,W/2+2.5,12,0));
    } else {
      /* a driveway: steel posts and a lowered striped arm */
      postAt(M,a[0],a[1],0,H+0.1,0.09,BLACK,0.75); postAt(M,b[0],b[1],0,H+0.1,0.09,BLACK,0.75);
      box(a[0],a[1],0.15,H); box(b[0],b[1],0.15,H);
      var c=at(O[0]+0.7); postAt(M,c[0],c[1],0,1.15,0.2,0xE7E2D6,0.75); box(c[0],c[1],0.25,1.15);
      var AL=W-1.6, ns=Math.max(3,Math.round(AL/0.9));
      for(k=0;k<ns;k++){ var p0=at(O[0]+0.8+AL*k/ns), p1=at(O[0]+0.8+AL*(k+1)/ns);
        segBox(M,[p0[0],p0[1]],[p1[0],p1[1]],0.98,1.08,0.07,(k%2)?0xF2F0EA:0xB3232B,0.85); }
    }
  });

  /* ---- nothing planted on the line ---- */
  function nearFence(x,z,r){
    for(var q=0;q<FENCE_RUNS.length;q++){ var run=FENCE_RUNS[q];
      for(var k=0;k<run.length-1;k++){ var a=run[k], b=run[k+1], dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz||1;
        var t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/L2));
        if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<r) return true; } }
    return false;
  }
  for(i=TREE_POS.length-1;i>=0;i--){ var tp=TREE_POS[i];
    var gate=false; FENCE_GATES.forEach(function(g){ if(Math.hypot(tp[0]-g.x,tp[1]-g.z)<g.hw+2) gate=true; });
    if(gate||nearFence(tp[0],tp[1],1.9)) TREE_POS.splice(i,1); }

  cols.forEach(function(c){ addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);

  /* the picket texture: rails top and bottom, spear topped pickets every 15 cm */
  var cv=document.createElement('canvas'); cv.width=128; cv.height=256;
  var g=cv.getContext('2d'), py=256/H;
  g.clearRect(0,0,128,256);
  for(i=0;i<8;i++){ var cx=i*16+8;
    g.fillStyle='#141517'; g.fillRect(cx-1.9,10,3.8,256-10-0.05*py);
    g.beginPath(); g.moveTo(cx-2.6,13); g.lineTo(cx,0); g.lineTo(cx+2.6,13); g.closePath(); g.fill();
    g.fillStyle='#3d4046'; g.fillRect(cx-1.9,12,1,256-12-0.05*py); }
  g.fillStyle='#141517';
  g.fillRect(0,256-1.86*py,128,5.5); g.fillRect(0,256-0.22*py,128,5.5);
  g.fillStyle='#3d4046'; g.fillRect(0,256-1.86*py,128,1); g.fillRect(0,256-0.22*py,128,1);
  var tex=new T.CanvasTexture(cv); tex.wrapS=T.RepeatWrapping; tex.wrapT=T.ClampToEdgeWrapping;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  var geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(P,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(UV,2));
  geo.computeBoundingSphere();
  var fm=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:0.03,depthWrite:false,side:T.DoubleSide}));
  fm.frustumCulled=false; fm.renderOrder=1; fm.userData.noShadow=true; fm.raycast=function(){}; scene.add(fm);

  var solidLen=0; for(i=0;i<NS;i++) solidLen+=solid[i]*STEP;
  window.__fence={total:Math.round(TOTAL),solid:Math.round(solidLen),runs:FENCE_RUNS.length,
                  gates:FENCE_GATES.length,drives:OPEN.length-GATES.length,tris:M.count()};
})();
/* true when a step from a to b would pass through the railings */
function fenceCuts(ax,az,bx,bz){
  for(var q=0;q<FENCE_RUNS.length;q++){ var run=FENCE_RUNS[q];
    for(var k=0;k<run.length-1;k++){ var c=run[k], d=run[k+1];
      var d1=(bx-ax)*(c[1]-az)-(bz-az)*(c[0]-ax), d2=(bx-ax)*(d[1]-az)-(bz-az)*(d[0]-ax);
      if(d1*d2>=0) continue;
      var d3=(d[0]-c[0])*(az-c[1])-(d[1]-c[1])*(ax-c[0]), d4=(d[0]-c[0])*(bz-c[1])-(d[1]-c[1])*(bx-c[0]);
      if(d3*d4<0) return true; } }
  return false;
}
