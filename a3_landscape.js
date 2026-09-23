/* ==================================================================
   Landscape pass.
   Every tree on campus is built here, once all the placement lists are
   final: broad shade trees made of several leaf masses (coast live oak,
   sycamore, ficus, magnolia and the spring jacarandas), Mexican fan palms
   and Canary date palms, each with a mulch ring where it stands in lawn.
   Then the lawns get their own trees, set back from the walks, and every
   USC building gets clipped foundation hedges along the planted sides.
   ================================================================== */
var LAND_STATS={};
(function(){
  var TAU=6.283185307;
  /* ------------------------------------------------ geometry helpers */
  function flatten(g){ return g.index?g.toNonIndexed():g; }
  /* merge several geometries into one, baking a colour per vertex */
  function bake(parts){
    var P=[],N=[],C=[];
    for(var i=0;i<parts.length;i++){
      var g=flatten(parts[i].g); g.computeVertexNormals();
      var pos=g.attributes.position, nor=g.attributes.normal, fn=parts[i].c;
      var y0=1e9,y1=-1e9;
      for(var k=0;k<pos.count;k++){ y0=Math.min(y0,pos.getY(k)); y1=Math.max(y1,pos.getY(k)); }
      for(k=0;k<pos.count;k++){
        P.push(pos.getX(k),pos.getY(k),pos.getZ(k));
        N.push(nor.getX(k),nor.getY(k),nor.getZ(k));
        var c=fn(pos.getX(k),pos.getY(k),pos.getZ(k),(pos.getY(k)-y0)/((y1-y0)||1));
        C.push(c[0],c[1],c[2]);
      }
    }
    var out=new T.BufferGeometry();
    out.setAttribute('position',new T.Float32BufferAttribute(P,3));
    out.setAttribute('normal',new T.Float32BufferAttribute(N,3));
    out.setAttribute('color',new T.Float32BufferAttribute(C,3));
    out.computeBoundingSphere();
    return out;
  }
  function hashf(x,y,z){ var h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return h-Math.floor(h); }
  /* leaves: lighter where the sun reaches the top, darker underneath */
  function leafShade(x,y,z,t){ var v=0.62+0.50*t+0.10*(hashf(x,y,z)-0.5); return [v,v,v]; }
  function flatWhite(){ return [1,1,1]; }

  /* a broad shade tree canopy: one rounded mass with lobes hanging round it */
  function canopyGeom(lobes,spread,flatten2){
    var parts=[], core=new T.IcosahedronGeometry(1,1);
    core.scale(1,0.82*flatten2,1); parts.push({g:core,c:leafShade});
    for(var i=0;i<lobes;i++){
      var a=i/lobes*TAU+0.4, r=0.62+0.12*((i*7)%3)/2;
      var lb=new T.IcosahedronGeometry(r,0);
      lb.scale(1,0.8*flatten2,1);
      lb.translate(Math.cos(a)*spread,-0.18-0.1*(i%2),Math.sin(a)*spread);
      parts.push({g:lb,c:leafShade});
    }
    var top=new T.IcosahedronGeometry(0.62,0); top.translate(0.12,0.52*flatten2,-0.08);
    parts.push({g:top,c:leafShade});
    return bake(parts);
  }
  /* trunk with two limbs reaching up into the crown */
  function trunkGeom(h,r0,r1,limbs){
    var parts=[];
    var t=new T.CylinderGeometry(r1,r0,h,7); t.translate(0,h/2,0); parts.push({g:t,c:flatWhite});
    for(var i=0;i<limbs;i++){
      var a=i/limbs*TAU+0.7, L=h*0.55;
      var b=new T.CylinderGeometry(r1*0.45,r1*0.8,L,5);
      b.translate(0,L/2,0); b.rotateZ(0.62); b.rotateY(a); b.translate(0,h*0.78,0);
      parts.push({g:b,c:flatWhite});
    }
    return bake(parts);
  }
  /* fan palm crown: a skirt of dead fronds under a ball of green fans */
  function fanCrown(){
    var parts=[];
    var sk=new T.CylinderGeometry(0.55,0.34,1.5,7); sk.translate(0,-0.75,0);
    parts.push({g:sk,c:function(){ return [0.55,0.44,0.30]; }});
    var P=[],n=13;
    for(var i=0;i<n;i++){
      var a=i/n*TAU, up=(i%3)*0.35-0.1, L=1.9;
      var bx=Math.cos(a), bz=Math.sin(a);
      var tip=[bx*L,up+0.25,bz*L], s1=[bx*L*0.85-bz*0.85,up-0.15,bz*L*0.85+bx*0.85],
          s2=[bx*L*0.85+bz*0.85,up-0.15,bz*L*0.85-bx*0.85];
      P.push(0,0,0, s1[0],s1[1],s1[2], tip[0],tip[1],tip[2]);
      P.push(0,0,0, tip[0],tip[1],tip[2], s2[0],s2[1],s2[2]);
    }
    var g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3));
    parts.push({g:g,c:function(x,y,z,t){ var v=0.75+0.35*t; return [0.33*v,0.52*v,0.24*v]; }});
    return bake(parts);
  }
  /* Canary date palm crown: long fronds arching out and down */
  function dateCrown(){
    var P=[], n=22;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+(i%2)*0.12, tilt=(i%3)*0.25, L=4.6;
      var bx=Math.cos(a), bz=Math.sin(a), px=-bz, pz=bx;
      var prev=null;
      for(var s=0;s<=4;s++){
        var u=s/4, r=u*L, y=Math.sin(u*2.2)*1.1-u*u*(1.8+tilt*2)+0.2;
        var w=0.55*Math.sin(Math.PI*Math.min(1,u*1.2+0.08));
        var c=[bx*r,y,bz*r], l=[c[0]+px*w,c[1]-0.05,c[2]+pz*w], rr2=[c[0]-px*w,c[1]-0.05,c[2]-pz*w];
        if(prev){
          P.push(prev[1][0],prev[1][1],prev[1][2], l[0],l[1],l[2], c[0],c[1],c[2]);
          P.push(prev[1][0],prev[1][1],prev[1][2], c[0],c[1],c[2], prev[0][0],prev[0][1],prev[0][2]);
          P.push(prev[0][0],prev[0][1],prev[0][2], c[0],c[1],c[2], rr2[0],rr2[1],rr2[2]);
          P.push(prev[0][0],prev[0][1],prev[0][2], rr2[0],rr2[1],rr2[2], prev[2][0],prev[2][1],prev[2][2]);
        }
        prev=[c,l,rr2];
      }
    }
    var g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3));
    var ball=new T.IcosahedronGeometry(0.9,0); ball.scale(1,0.8,1);
    return bake([{g:g,c:function(x,y,z,t){ var v=0.7+0.4*t; return [0.30*v,0.50*v,0.20*v]; }},
                 {g:ball,c:function(){ return [0.52,0.40,0.26]; }}]);
  }
  function palmTrunk(r0,r1,bands){
    var g=new T.CylinderGeometry(r1,r0,1,8,bands,true); g.translate(0,0.5,0);
    return bake([{g:g,c:function(x,y,z){ var k=Math.floor(y*bands); var v=(k%2)?0.86:1.0; return [v,v,v]; }}]);
  }

  var canopyA=canopyGeom(5,0.78,1.0),   /* oak / sycamore / magnolia */
      canopyF=canopyGeom(7,1.05,0.72),  /* ficus: wide and low */
      canopyJ=canopyGeom(4,0.70,0.85);  /* jacaranda: airy */
  var trunkA=trunkGeom(1,0.30,0.19,2), trunkF=trunkGeom(1,0.40,0.26,3);
  var fanC=fanCrown(), dateC=dateCrown(), fanT=palmTrunk(0.26,0.19,10), dateT=palmTrunk(0.52,0.44,14);
  /* giant bird of paradise: a clump of grey stems, paddle leaves fanned in one plane */
  var strel=(function(){
    var parts=[];
    for(var i=0;i<6;i++){
      var a=i/6*TAU+0.3, r=0.35+0.2*(i%2), h=2.6+(i%3)*0.9;
      var st=new T.CylinderGeometry(0.07,0.11,h,5); st.translate(Math.cos(a)*r,h/2,Math.sin(a)*r);
      parts.push({g:st,c:function(){ return [0.55,0.52,0.46]; }});
      var P=[];
      for(var l=0;l<5;l++){
        var ang=-1.1+l*0.55+(i%2)*0.2, len=1.6+0.4*((l+i)%2), wid=0.32;
        var bx=Math.cos(a)*r, bz=Math.sin(a)*r, by=h;
        var dx=Math.sin(ang)*Math.cos(a+1.57), dz=Math.sin(ang)*Math.sin(a+1.57), dy=Math.cos(ang);
        var tx=bx+dx*len, ty=by+dy*len*0.8, tz=bz+dz*len;
        var ox=Math.cos(a)*wid, oz=Math.sin(a)*wid;
        var mx=(bx+tx)/2, my=(by+ty)/2, mz=(bz+tz)/2;
        P.push(bx,by,bz, mx+ox,my,mz+oz, tx,ty,tz);
        P.push(bx,by,bz, tx,ty,tz, mx-ox,my,mz-oz);
      }
      var g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3));
      parts.push({g:g,c:function(x,y,z,t){ var v=0.75+0.35*t; return [0.30*v,0.52*v,0.26*v]; }});
    }
    return bake(parts);
  })();

  /* ------------------------------------------------ species */
  var SPECIES={
    oak:   {canopy:canopyA, trunk:trunkA, leaf:[0x3D6B2B,0x456F2E,0x365F26], bark:0x5A4633, h:[3.2,4.4], cw:[3.2,4.6]},
    syc:   {canopy:canopyA, trunk:trunkA, leaf:[0x5C8C3A,0x679640,0x55833A], bark:0xBDB6A2, h:[4.2,5.8], cw:[2.8,3.8]},
    ficus: {canopy:canopyF, trunk:trunkF, leaf:[0x2F5E27,0x356629,0x2B5623], bark:0xA8A396, h:[3.4,4.6], cw:[4.4,6.2]},
    mag:   {canopy:canopyA, trunk:trunkA, leaf:[0x2C5424,0x325B28], bark:0x6A6258, h:[3.0,3.8], cw:[2.4,3.1]},
    jac:   {canopy:canopyJ, trunk:trunkA, leaf:[0x8F78C7,0x9A82CF,0x846DBD], bark:0x5E4E40, h:[3.0,4.0], cw:[3.0,4.0]}
  };
  function pickSpecies(x,z){
    var h=hashf(x*0.37,0,z*0.41);
    if(h<0.38) return 'oak'; if(h<0.60) return 'syc'; if(h<0.74) return 'ficus';
    if(h<0.88) return 'mag'; return 'jac';
  }

  /* ------------------------------------------------ where things may grow */
  var RG={}, RGC=4;
  for(var i=0;i<ROADS.length;i++){
    var pts=ROADS[i].pts, pad=ROADS[i].w*0.5+2.2;
    for(var s=0;s<pts.length-1;s++){
      var a=pts[s], b=pts[s+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/2));
      for(var k=0;k<=n;k++){
        var x=a[0]+(b[0]-a[0])*k/n, z=a[1]+(b[1]-a[1])*k/n;
        for(var cx=Math.floor((x-pad)/RGC);cx<=Math.floor((x+pad)/RGC);cx++)
          for(var cz=Math.floor((z-pad)/RGC);cz<=Math.floor((z+pad)/RGC);cz++) RG[cx+'_'+cz]=1;
      }
    }
  }
  function onRoad(x,z){ return RG[Math.floor(x/RGC)+'_'+Math.floor(z/RGC)]===1; }
  /* a finer test than onWalk: distance to the nearest path's paved edge */
  var PG={}, PGC=6;
  for(i=0;i<PATHS.length;i++){
    var pp=PATHS[i].pts, hw=PATHS[i].w>6?PATHS[i].w*0.75+2.35:(PATHS[i].w>=2.5?PATHS[i].w*0.65+1.15:PATHS[i].w*0.6);
    for(s=0;s<pp.length-1;s++){
      var a2=pp[s], b2=pp[s+1];
      var x0=Math.min(a2[0],b2[0])-hw-8, x1=Math.max(a2[0],b2[0])+hw+8,
          z0=Math.min(a2[1],b2[1])-hw-8, z1=Math.max(a2[1],b2[1])+hw+8;
      for(cx=Math.floor(x0/PGC);cx<=Math.floor(x1/PGC);cx++)
        for(cz=Math.floor(z0/PGC);cz<=Math.floor(z1/PGC);cz++){
          var key=cx+'_'+cz; (PG[key]||(PG[key]=[])).push([a2[0],a2[1],b2[0],b2[1],hw]);
        }
    }
  }
  /* how far (x,z) is outside the nearest paved walk; negative means on it */
  function walkGap(x,z){
    var l=PG[Math.floor(x/PGC)+'_'+Math.floor(z/PGC)], best=99;
    if(!l) return best;
    for(var i=0;i<l.length;i++){
      var q=l[i], dx=q[2]-q[0], dz=q[3]-q[1], L2=dx*dx+dz*dz||1e-9;
      var t=((x-q[0])*dx+(z-q[1])*dz)/L2; t=t<0?0:(t>1?1:t);
      var d=Math.hypot(q[0]+dx*t-x,q[1]+dz*t-z)-q[4];
      if(d<best) best=d;
    }
    return best;
  }
  function inSolid(x,z,minH){
    var l=nearby(x,z,0.5);
    for(var i=0;i<l.length;i++){ var C=l[i];
      if(C.h<(minH||1)) continue;
      if(x<C.x0||x>C.x1||z<C.z0||z>C.z1) continue;
      if(inRing(C.ring,x,z)) return true; }
    return false;
  }
  function clearOf(x,z,r,minH){
    if(inSolid(x,z,minH)) return false;
    for(var k=0;k<8;k++){ var a=k/8*TAU; if(inSolid(x+Math.cos(a)*r,z+Math.sin(a)*r,minH)) return false; }
    return true;
  }
  function noPlant(x,z){
    for(var q=0;q<NO_PLANT.length;q++) if(inRing(NO_PLANT[q],x,z)) return true;
    return false;
  }
  var PITCHES=AREAS.filter(function(a){return a.k==='p';}).map(function(a){return a.ring;});
  function onPitch(x,z){ for(var q=0;q<PITCHES.length;q++) if(inRing(PITCHES[q],x,z)) return true; return false; }
  function nearMonument(x,z,r){
    for(var i=0;i<POINTS.length;i++){ if(POINTS[i].k==='t') continue;
      if(Math.abs(POINTS[i].x-x)<r&&Math.abs(POINTS[i].z-z)<r) return true; }
    return false;
  }
  var TGRID={}, TGC=6;
  function spaced(x,z,r){
    var c0=Math.floor(x/TGC), c1=Math.floor(z/TGC), rc=Math.ceil(r/TGC);
    for(var i=-rc;i<=rc;i++) for(var j=-rc;j<=rc;j++){
      var l=TGRID[(c0+i)+'_'+(c1+j)]; if(!l) continue;
      for(var k=0;k<l.length;k++) if(Math.hypot(l[k][0]-x,l[k][1]-z)<r) return false;
    }
    return true;
  }
  function mark(x,z){ var key=Math.floor(x/TGC)+'_'+Math.floor(z/TGC); (TGRID[key]||(TGRID[key]=[])).push([x,z]); }
  for(i=0;i<TREE_POS.length;i++) mark(TREE_POS[i][0],TREE_POS[i][1]);

  /* ------------------------------------------------ lawn trees */
  var added=0;
  for(var gx=LG.x0+4;gx<LG.x1;gx+=7.5){
    for(var gz=LG.z0+4;gz<LG.z1;gz+=7.5){
      var x=gx+(hashf(gx,1,gz)-0.5)*6, z=gz+(hashf(gz,2,gx)-0.5)*6;
      if(lawnAt(x,z)<0.9) continue;
      if(hashf(x,3,z)>0.42) continue;
      if(inColHole(x,z)||inPlaza(x,z)||onRoad(x,z)||noPlant(x,z)||onPitch(x,z)) continue;
      var skip=false; for(var nl=0;nl<NO_LAWN_TREES.length;nl++) if(inRing(NO_LAWN_TREES[nl],x,z)) skip=true;
      if(skip) continue;
      if(walkGap(x,z)<2.6) continue;
      if(!clearOf(x,z,3.6,1.5)) continue;
      if(nearMonument(x,z,9)) continue;
      if(!spaced(x,z,7.5)) continue;
      TREE_POS.push([x,z,hashf(x,5,z)<0.10?1:0]); mark(x,z); added++;
    }
  }
  LAND_STATS.lawnTrees=added;

  /* ------------------------------------------------ tree planters round the plazas */
  var PLANTERS=[];
  var KEEP_CLEAR=[[0,0,17],[18,43,13],[20,61,10]];   /* Tommy, the fountain, Traveler */
  function keepClear(x,z){ for(var q=0;q<KEEP_CLEAR.length;q++) if(Math.hypot(x-KEEP_CLEAR[q][0],z-KEEP_CLEAR[q][1])<KEEP_CLEAR[q][2]) return true; return false; }
  for(var pi=0;pi<PLAZAS.length;pi++){
    var pr=offsetRing(PLAZAS[pi],-4.5); if(!pr) continue;
    for(var pe=0;pe<pr.length;pe++){
      var pa=pr[pe], pb=pr[(pe+1)%pr.length], pL=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);
      var np=Math.floor(pL/6);
      for(var pk=0;pk<np;pk++){
        var pu=(pk+0.5)/np, px=pa[0]+(pb[0]-pa[0])*pu, pz=pa[1]+(pb[1]-pa[1])*pu;
        if(keepClear(px,pz)||walkGap(px,pz)<0.2||noPlant(px,pz)||nearMonument(px,pz,8)||!clearOf(px,pz,2.4,0.5)) continue;
        if(!spaced(px,pz,9)) continue;
        PLANTERS.push([px,pz]); mark(px,pz);
        TREE_POS.push([px,pz,0,hashf(px,8,pz)<0.5?'syc':'ficus',0.95]);
      }
    }
  }
  /* and in the open stretches inside them */
  for(pi=0;pi<PLAZAS.length;pi++){
    var inr=offsetRing(PLAZAS[pi],-2.5); if(!inr) continue;
    var bx0=1e9,bx1=-1e9,bz0=1e9,bz1=-1e9;
    inr.forEach(function(q){ bx0=Math.min(bx0,q[0]); bx1=Math.max(bx1,q[0]); bz0=Math.min(bz0,q[1]); bz1=Math.max(bz1,q[1]); });
    for(var gx2=bx0;gx2<=bx1;gx2+=4) for(var gz2=bz0;gz2<=bz1;gz2+=4){
      if(!inRing(inr,gx2,gz2)) continue;
      if(keepClear(gx2,gz2)||walkGap(gx2,gz2)<0.4||noPlant(gx2,gz2)||nearMonument(gx2,gz2,8)||!clearOf(gx2,gz2,2.4,0.5)) continue;
      if(!spaced(gx2,gz2,10)) continue;
      PLANTERS.push([gx2,gz2]); mark(gx2,gz2);
      TREE_POS.push([gx2,gz2,0,hashf(gx2,8,gz2)<0.5?'syc':'ficus',0.95]);
    }
  }
  LAND_STATS.planters=PLANTERS.length;

  /* ------------------------------------------------ build the trees */
  var groups={};
  function G(key,geom,col){
    if(!groups[key]) groups[key]={geom:geom,list:[],col:col};
    return groups[key];
  }
  var mulch=[];
  for(i=0;i<TREE_POS.length;i++){
    var tp=TREE_POS[i], x3=tp[0], z3=tp[1], kind=tp[2];
    if(inColHole(x3,z3)) continue;
    var hsh=hashf(x3,7,z3), onLawn=lawnAt(x3,z3)>0.5&&!inPlaza(x3,z3);
    if(kind===2){
      G('strel',strel,0xFFFFFF).list.push([x3,z3,0,rr(0.9,1.2),0]);
      continue;
    }
    if(kind===1){
      if(hsh<0.6){
        var ph=rr(13,21);
        G('fanT',fanT,0x8C7A5E).list.push([x3,z3,ph,0.9+hsh*0.3,1]);
        G('fanC',fanC,0xFFFFFF).list.push([x3,z3,ph,1.25,0]);
      } else {
        var dh=rr(6,9.5);
        G('dateT',dateT,0x7E6A4E).list.push([x3,z3,dh,1,1]);
        G('dateC',dateC,0xFFFFFF).list.push([x3,z3,dh,rr(0.9,1.15),0]);
      }
      if(onLawn) mulch.push([x3,z3,1.3]);
      continue;
    }
    var sp=tp[3]||pickSpecies(x3,z3), S=SPECIES[sp];
    var sc=rr(0.85,1.3)*(tp[4]||1);
    var th=rr(S.h[0],S.h[1])*sc, cw=rr(S.cw[0],S.cw[1])*sc;
    G('trunk_'+sp,S.trunk,S.bark).list.push([x3,z3,th,Math.max(0.8,sc)*(sp==='ficus'?1.3:1),2]);
    G('can_'+sp,S.canopy,S.leaf).list.push([x3,z3,th+cw*0.72,cw,3,sp]);
    if(onLawn) mulch.push([x3,z3,Math.min(2.8,cw*0.55)]);
  }
  var D=new T.Object3D(), cc=new T.Color();
  var total=0;
  Object.keys(groups).forEach(function(key){
    var gr=groups[key], n=gr.list.length; if(!n) return;
    var multi=Array.isArray(gr.col);
    var mat=new T.MeshLambertMaterial({vertexColors:true,color:multi?0xFFFFFF:gr.col,flatShading:true,
            side:(key==='fanC'||key==='dateC'||key==='strel')?T.DoubleSide:T.FrontSide});
    var im=new T.InstancedMesh(gr.geom,mat,n);
    for(var i=0;i<n;i++){
      var e=gr.list[i];
      D.position.set(e[0],0,e[1]); D.rotation.set(0,hashf(e[0],9,e[1])*TAU,0);
      if(e[4]===1){ D.scale.set(e[3],e[2],e[3]); }            /* palm trunk: y is height */
      else if(e[4]===0){ D.position.y=e[2]; D.scale.set(e[3],e[3],e[3]); }
      else if(e[4]===2){ D.scale.set(e[3],e[2],e[3]); }       /* tree trunk */
      else { D.position.y=e[2]; D.scale.set(e[3],e[3]*rr(0.85,1.05),e[3]*rr(0.9,1.1));
             D.rotation.set(rr(-0.08,0.08),hashf(e[0],9,e[1])*TAU,rr(-0.08,0.08)); }
      D.updateMatrix(); im.setMatrixAt(i,D.matrix);
      if(multi){ cc.setHex(gr.col[i%gr.col.length]).multiplyScalar(0.92+hashf(e[0],4,e[1])*0.16); im.setColorAt(i,cc); }
    }
    if(im.instanceColor) im.instanceColor.needsUpdate=true;
    im.castShadow=true; im.receiveShadow=false; im.frustumCulled=false; im.raycast=function(){};
    scene.add(im); total+=n;
  });
  /* trunks are solid */
  for(i=0;i<TREE_POS.length;i++){
    var tq=TREE_POS[i];
    if(inColHole(tq[0],tq[1])) continue;
    addCollider([[tq[0]-0.35,tq[1]-0.35],[tq[0]+0.35,tq[1]-0.35],[tq[0]+0.35,tq[1]+0.35],[tq[0]-0.35,tq[1]+0.35]],2.5);
  }
  /* mulch rings */
  if(mulch.length){
    var mg=new T.CircleGeometry(1,12); mg.rotateX(-Math.PI/2);
    var mm=new T.MeshLambertMaterial({color:0x4E3A2A,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    var imu=new T.InstancedMesh(mg,mm,mulch.length);
    for(i=0;i<mulch.length;i++){
      D.position.set(mulch[i][0],0.045,mulch[i][1]); D.rotation.set(0,0,0);
      D.scale.set(mulch[i][2],1,mulch[i][2]); D.updateMatrix(); imu.setMatrixAt(i,D.matrix);
    }
    imu.receiveShadow=true; imu.frustumCulled=false; imu.raycast=function(){}; scene.add(imu);
  }
  LAND_STATS.trees=total/2|0; LAND_STATS.mulch=mulch.length;

  /* ------------------------------------------------ amber acorn lamps */
  if(ACORN_LAMPS.length){
    var postG=bake([
      {g:(function(){ var g=new T.CylinderGeometry(0.24,0.30,0.55,8); g.translate(0,0.275,0); return g; })(),c:flatWhite},
      {g:(function(){ var g=new T.CylinderGeometry(0.13,0.17,0.9,8); g.translate(0,1.0,0); return g; })(),c:flatWhite},
      {g:(function(){ var g=new T.CylinderGeometry(0.075,0.095,2.4,8); g.translate(0,2.65,0); return g; })(),c:flatWhite},
      {g:(function(){ var g=new T.CylinderGeometry(0.2,0.11,0.22,8); g.translate(0,3.9,0); return g; })(),c:flatWhite}
    ]);
    var acornG=new T.LatheGeometry([new T.Vector2(0.05,0),new T.Vector2(0.22,0.06),new T.Vector2(0.26,0.25),
      new T.Vector2(0.22,0.45),new T.Vector2(0.12,0.6),new T.Vector2(0.03,0.68)],10);
    acornG.translate(0,4.0,0);
    var iPost=new T.InstancedMesh(postG,new T.MeshLambertMaterial({color:0x1D2023,vertexColors:true}),ACORN_LAMPS.length);
    var iAc=new T.InstancedMesh(acornG,new T.MeshLambertMaterial({color:0xF2B04A,emissive:0x8a4f10}),ACORN_LAMPS.length);
    for(i=0;i<ACORN_LAMPS.length;i++){
      D.position.set(ACORN_LAMPS[i][0],0,ACORN_LAMPS[i][1]); D.rotation.set(0,0,0); D.scale.set(1,1,1);
      D.updateMatrix(); iPost.setMatrixAt(i,D.matrix); iAc.setMatrixAt(i,D.matrix);
      addCollider([[ACORN_LAMPS[i][0]-0.3,ACORN_LAMPS[i][1]-0.3],[ACORN_LAMPS[i][0]+0.3,ACORN_LAMPS[i][1]-0.3],
                   [ACORN_LAMPS[i][0]+0.3,ACORN_LAMPS[i][1]+0.3],[ACORN_LAMPS[i][0]-0.3,ACORN_LAMPS[i][1]+0.3]],3);
    }
    [iPost,iAc].forEach(function(m){ m.frustumCulled=false; m.castShadow=true; m.raycast=function(){}; scene.add(m); });
  }

  /* ------------------------------------------------ foundation hedges */
  var M=new Mesher(), hedges=0;
  for(i=0;i<PLANTERS.length;i++){
    var pq=PLANTERS[i], pr2=oriRect(pq[0],pq[1],0.883,0.469,1.45,1.45);
    prism(M,pr2,0,0.5,0xBEB7A8,0xCFC8B9,0.75);
    flat(M,oriRect(pq[0],pq[1],0.883,0.469,1.2,1.2),0.51,0x4A3828,1);
    addCollider(pr2,0.5);
  }
  var HC=[0x2F5A28,0x355F2A,0x2A5224,0x3B6A30];
  for(var b3=0;b3<CAMPUS.length;b3++){
    var ring=CAMPUS[b3].ring;
    if(inColHole(ring[0][0],ring[0][1])) continue;
    for(var e2=0;e2<ring.length;e2++){
      var A=ring[e2], B=ring[(e2+1)%ring.length];
      var ex=B[0]-A[0], ez=B[1]-A[1], EL=Math.hypot(ex,ez);
      if(EL<4) continue;
      ex/=EL; ez/=EL;
      var nx=ez, nz=-ex;
      var mx=(A[0]+B[0])*0.5, mz=(A[1]+B[1])*0.5;
      if(inRing(ring,mx+nx*0.6,mz+nz*0.6)){ nx=-nx; nz=-nz; }
      var off=1.05, step=1.0, run=null, hcol=HC[b3%HC.length];
      var flush=function(){
        if(run && run[1]-run[0]>=2.2){
          var u0=run[0], u1=run[1];
          var p0=[A[0]+ex*u0+nx*off,A[1]+ez*u0+nz*off], p1=[A[0]+ex*u1+nx*off,A[1]+ez*u1+nz*off];
          var hh=0.95+hashf(p0[0],1,p0[1])*0.45;
          segBox(M,p0,p1,0.02,hh-0.18,1.25,hcol,0.62);
          segBox(M,p0,p1,hh-0.18,hh,1.02,hcol,0.95);
          hedges++;
        }
        run=null;
      };
      for(var u=0.8;u<=EL-0.8;u+=step){
        var hx=A[0]+ex*u+nx*off, hz=A[1]+ez*u+nz*off;
        var ok=lawnAt(hx,hz)>0.55 && walkGap(hx,hz)>0.5 && !onRoad(hx,hz) && !inPlaza(hx,hz)
               && !noPlant(hx,hz) && !inSolid(hx+nx*0.9,hz+nz*0.9,0.5) && !nearMonument(hx,hz,5);
        if(ok){ if(!run) run=[u,u]; else run[1]=u; }
        else flush();
      }
      flush();
    }
  }
  var hm=new T.Mesh(M.geom(),matWorld); hm.castShadow=true; hm.receiveShadow=true; hm.frustumCulled=false;
  scene.add(hm);
  LAND_STATS.hedges=hedges;
  window.__land=LAND_STATS;

})();
