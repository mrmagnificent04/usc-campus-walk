/* ==================================================================
   Exposition Park Rose Garden, across Exposition Boulevard from USC.
   A sunken lawn laid out as a grid of rose beds edged in white concrete,
   split down the middle by a wide walk that opens into a round plaza
   around the big fountain: a shallow basin whose ring of jets arcs in
   toward a tall centre spout. Tall trees close it in along both long
   sides. The data layer has already cleared its paths and water (ROSE).
   ================================================================== */
(function(){
  if(!ROSE) return;
  var X0=ROSE.x0, X1=ROSE.x1, Z0=ROSE.z0, Z1=ROSE.z1, FX=ROSE.fx, FZ=ROSE.fz;
  var TAU=Math.PI*2;
  var MW=new Mesher(), MG=new Mesher();
  var CONC=0xDAD4C7, CONC_D=0xC3BCAD, CURB=0xDDD7CB, SOIL=0x55402F;
  var RP=24, RB=15, WALKW=9;
  function ccw(r){ if(ringArea(r)<0) r.reverse(); return r; }
  function hs(a,b,c){ var x=Math.sin(a*12.9898+b*78.233+c*37.719)*43758.5453; return x-Math.floor(x); }

  /* ---- clear the old random planting, keep the new layout free ---- */
  var inner=[[X0+2,Z0+2],[X1-2,Z0+2],[X1-2,Z1-2],[X0+2,Z1-2]];
  for(var i=TREE_POS.length-1;i>=0;i--){
    var t=TREE_POS[i];
    if(t[0]>X0-1&&t[0]<X1+1&&t[1]>Z0-1&&t[1]<Z1+1) TREE_POS.splice(i,1);
  }
  NO_PLANT.push(ccw(inner));
  NO_LAWN_TREES.push(ccw([[X0-4,Z0-4],[X1+4,Z0-4],[X1+4,Z1+4],[X0-4,Z1+4]]));

  /* ---- tall trees along both long sides and the short ends ---- */
  var SP=['ficus','oak','syc','ficus','oak'];
  for(var x=X0+6,k=0;x<X1-4;x+=10.5,k++){
    if(Math.abs(x-FX)<9) continue;
    TREE_POS.push([x,Z0+5.2,0,SP[k%5],1.15+hs(x,1,2)*0.3]);
    TREE_POS.push([x+3,Z1-5.2,0,SP[(k+2)%5],1.15+hs(x,3,4)*0.3]);
  }
  for(var z=Z0+16;z<Z1-12;z+=11){
    TREE_POS.push([X0+5,z,0,'oak',1.1+hs(z,5,6)*0.3]);
    TREE_POS.push([X1-5,z,0,'ficus',1.1+hs(z,7,8)*0.3]);
  }

  /* ---- the central walk and the round plaza ---- */
  var ww=WALKW*0.5;
  flat(MG,ccw([[FX-ww,Z0+0.5],[FX+ww,Z0+0.5],[FX+ww,Z1-0.5],[FX-ww,Z1-0.5]]),0.142,CONC,1);
  for(var sd=-1;sd<=1;sd+=2){
    flat(MG,ccw([[FX+sd*ww-0.25,Z0+0.5],[FX+sd*ww+0.25,Z0+0.5],[FX+sd*ww+0.25,Z1-0.5],[FX+sd*ww-0.25,Z1-0.5]]),0.147,CONC_D,1);
    for(var sz=Z0+3;sz<Z1-2;sz+=3)                 /* scored joints */
      if(Math.abs(sz-FZ)>RP) flat(MG,ccw([[FX-ww,sz],[FX+ww,sz],[FX+ww,sz+0.08],[FX-ww,sz+0.08]]),0.145,CONC_D,1);
  }
  flat(MG,ccw(ngon(FX,FZ,RP+0.4,64,0)),0.150,CONC_D,1);
  flat(MG,ccw(ngon(FX,FZ,RP,64,0)),0.153,CONC,1);
  flat(MG,ccw(ngon(FX,FZ,RB+2.2,56,0)),0.156,0xD1CABB,1);

  /* ---- the fountain basin ---- */
  var wallH=0.62, waterY=0.46;
  var outer=ccw(ngon(FX,FZ,RB+0.35,64,0)), rim=ccw(ngon(FX,FZ,RB-0.45,64,0));
  band(MW,outer,0.1,wallH,0,0xE4DED0,1,0.62,true);
  var cT=rgb(0xF0EBDF,1);
  for(i=0;i<outer.length;i++){
    var j=(i+1)%outer.length;
    MW.quad([outer[i][0],wallH,outer[i][1]],[rim[i][0],wallH,rim[i][1]],[rim[j][0],wallH,rim[j][1]],[outer[j][0],wallH,outer[j][1]],cT,cT,cT,cT);
  }
  band(MW,rim.slice().reverse(),0.2,wallH,0,0x9D968A,0.9,0.5,true);
  flat(MG,rim,waterY,0x4C9CCD,1);
  flat(MG,ccw(ngon(FX,FZ,RB-3.2,48,0)),waterY+0.004,0x3F8FC4,1);
  /* foam where the arcs come down, and the low centre ring */
  var fo=ccw(ngon(FX,FZ,6.3,40,0));
  flat(MG,fo,waterY+0.008,0xCFE7F3,1);
  flat(MG,ccw(ngon(FX,FZ,4.4,36,0)),waterY+0.012,0x4596CA,1);
  band(MW,ccw(ngon(FX,FZ,1.5,16,0)),0.2,waterY+0.18,0,0xDCD5C6,1,0.7);
  flat(MG,ccw(ngon(FX,FZ,1.35,16,0)),waterY+0.2,0xDCEFF8,1);
  addCollider(outer,wallH);

  /* ---- water: a ring of jets arcing in, and a tall centre spout ---- */
  var jetM=new T.MeshLambertMaterial({color:0xE2F3FB,transparent:true,opacity:0.62,flatShading:true});
  var r0=RB-2.4, r1=5.4, hA=4.3, NJ=40;
  var arc=new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(0,0,0),
            new T.Vector3(-(r0-r1)*0.42,hA*2,0),new T.Vector3(-(r0-r1),0,0)),14,0.075,4,false);
  var iArc=new T.InstancedMesh(arc,jetM,NJ), D2=new T.Object3D();
  for(i=0;i<NJ;i++){
    var a=i/NJ*TAU;
    D2.position.set(FX+Math.cos(a)*r0,waterY,FZ+Math.sin(a)*r0);
    D2.rotation.set(0,-a,0); D2.updateMatrix(); iArc.setMatrixAt(i,D2.matrix);
  }
  iArc.frustumCulled=false; iArc.raycast=function(){}; scene.add(iArc);
  var colG=new T.CylinderGeometry(0.06,0.28,1,7); colG.translate(0,0.5,0);
  var cols=[[0,0,8.2,1.0]];
  for(i=0;i<8;i++){ var a2=i/8*TAU+0.2; cols.push([Math.cos(a2)*2.6,Math.sin(a2)*2.6,4.6,0.7]); }
  for(i=0;i<20;i++){ var a3=i/20*TAU+0.1; cols.push([Math.cos(a3)*(RB-1.2),Math.sin(a3)*(RB-1.2),1.1,0.45]); }
  var iCol=new T.InstancedMesh(colG,jetM,cols.length);
  for(i=0;i<cols.length;i++){
    D2.position.set(FX+cols[i][0],waterY+(i===0?0.2:0),FZ+cols[i][1]); D2.rotation.set(0,0,0);
    D2.scale.set(cols[i][3],cols[i][2],cols[i][3]); D2.updateMatrix(); iCol.setMatrixAt(i,D2.matrix);
  }
  iCol.frustumCulled=false; iCol.raycast=function(){}; scene.add(iCol);
  var cap=new T.Mesh(new T.SphereGeometry(0.7,8,6),jetM);
  cap.position.set(FX,waterY+8.3,FZ); cap.scale.set(1,0.6,1); scene.add(cap);

  /* ---- benches round the plaza, facing the fountain ---- */
  var WOOD=0x8C6642, IRON=0x24272A;
  [30,62,118,150,210,242,298,330].forEach(function(dg){
    var a=dg*Math.PI/180, bx=FX+Math.cos(a)*(RP-2.0), bz=FZ+Math.sin(a)*(RP-2.0);
    var ux=-Math.sin(a), uz=Math.cos(a), nx=Math.cos(a), nz=Math.sin(a);
    oriBox(MW,bx,bz,ux,uz,1.0,0.26,0.44,0.52,WOOD,0.7);
    oriBox(MW,bx+nx*0.28,bz+nz*0.28,ux,uz,1.0,0.05,0.6,0.95,WOOD,0.7);
    for(var e=-1;e<=1;e+=2){
      oriBox(MW,bx+ux*0.9*e,bz+uz*0.9*e,ux,uz,0.05,0.28,0.15,0.46,IRON,0.6);
      oriBox(MW,bx+ux*0.9*e+nx*0.28,bz+uz*0.9*e+nz*0.28,ux,uz,0.05,0.05,0.15,0.98,IRON,0.6);
    }
  });
  /* lamps where the walks meet the plaza */
  for(sd=-1;sd<=1;sd+=2) for(var s2=-1;s2<=1;s2+=2) ACORN_LAMPS.push([FX+s2*(ww+0.9),FZ+sd*(RP+1.5)]);

  /* ---- the rose beds ---- */
  var ROWS=8, zA=Z0+11, zB=Z1-11, pz=(zB-zA)/ROWS, bedD=pz-3.3;
  var beds=[];
  function clipHalf(poly,ux,uz,c){   /* keep (p-F).u >= c */
    var out=[], n=poly.length;
    for(var i=0;i<n;i++){
      var A=poly[i], B=poly[(i+1)%n];
      var da=(A[0]-FX)*ux+(A[1]-FZ)*uz-c, db=(B[0]-FX)*ux+(B[1]-FZ)*uz-c;
      if(da>=0) out.push(A);
      if((da>=0)!==(db>=0)){ var t=da/(da-db); out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]); }
    }
    return out;
  }
  function side(xa,xb){
    var cols=Math.max(1,Math.round((xb-xa)/12.5)), px=(xb-xa)/cols, bedW=px-3.3;
    for(var c=0;c<cols;c++) for(var r=0;r<ROWS;r++){
      var cx=xa+(c+0.5)*px, cz=zA+(r+0.5)*pz;
      var poly=[[cx-bedW/2,cz-bedD/2],[cx+bedW/2,cz-bedD/2],[cx+bedW/2,cz+bedD/2],[cx-bedW/2,cz+bedD/2]];
      var dx=cx-FX, dz=cz-FZ, dl=Math.hypot(dx,dz);
      if(dl<RP+18){
        var ux=dx/dl, uz=dz/dl;
        poly=clipHalf(poly,ux,uz,RP+3.2);
        /* and a radial aisle on the diagonals, like the real layout */
        if(poly.length<3) continue;
      }
      if(poly.length<3) continue;
      poly=ccw(poly);
      if(Math.abs(ringArea(poly))<18) continue;
      beds.push(poly);
    }
  }
  side(X0+12,FX-ww-3.2);
  side(FX+ww+3.2,X1-12);

  var PAL=[0xC3172B,0xA3101F,0xE0507F,0xF4A3BD,0xEF6E4E,0xF3C74E,0xF3EFE3,0xD24466,0xF08B3A,0xC9A2D6,0xC3172B,0xE0507F];
  var bushes=[], flowers=[];
  for(var b=0;b<beds.length;b++){
    var poly=beds[b];
    prism(MW,poly,0,0.15,CURB,CURB,0.8);
    var soil=offsetRing(poly,-0.18);
    if(soil) flat(MW,soil,0.155,SOIL,1);
    var bx0=1e9,bx1=-1e9,bz0=1e9,bz1=-1e9;
    poly.forEach(function(q){ bx0=Math.min(bx0,q[0]); bx1=Math.max(bx1,q[0]); bz0=Math.min(bz0,q[1]); bz1=Math.max(bz1,q[1]); });
    var ins=offsetRing(poly,-0.85)||poly;
    var main=PAL[Math.floor(hs(b,1,7)*PAL.length)], alt=PAL[Math.floor(hs(b,9,3)*PAL.length)];
    for(var gx=bx0+0.9;gx<bx1-0.5;gx+=1.5) for(var gz=bz0+0.9;gz<bz1-0.5;gz+=1.45){
      var px=gx+(hs(gx,gz,1)-0.5)*0.4, pz2=gz+(hs(gz,gx,2)-0.5)*0.4;
      if(!inRing(ins,px,pz2)) continue;
      var sc=0.8+hs(px,pz2,3)*0.4;
      bushes.push([px,pz2,sc]);
      var nf=6;
      for(var f=0;f<nf;f++){
        var fa=hs(px,f,4)*TAU, el=0.3+hs(pz2,f,5)*1.0, rr2=0.5*sc;
        flowers.push([px+Math.cos(fa)*Math.cos(el)*rr2*0.9, 0.16+0.5*sc*1.05+Math.sin(el)*rr2*1.05, pz2+Math.sin(fa)*Math.cos(el)*rr2*0.9,
                      hs(px,pz2,f+6)<0.8?main:alt]);
      }
    }
  }
  var bushG=new T.DodecahedronGeometry(0.5,0);
  var iB=new T.InstancedMesh(bushG,new T.MeshLambertMaterial({color:0xFFFFFF,flatShading:true}),Math.max(1,bushes.length));
  var cc=new T.Color();
  for(i=0;i<bushes.length;i++){
    var q=bushes[i];
    D2.position.set(q[0],0.16+0.5*q[2]*1.05,q[1]); D2.rotation.set(hs(q[0],2,q[1])*0.6,hs(q[0],q[1],8)*TAU,0);
    D2.scale.set(q[2]*0.95,q[2]*1.05,q[2]*0.95); D2.updateMatrix(); iB.setMatrixAt(i,D2.matrix);
    cc.setHex(0x3D6A2C).multiplyScalar(0.8+hs(q[1],q[0],9)*0.4); iB.setColorAt(i,cc);
  }
  if(iB.instanceColor) iB.instanceColor.needsUpdate=true;
  iB.frustumCulled=false; iB.raycast=function(){}; scene.add(iB);
  var flG=new T.OctahedronGeometry(0.15,0);
  var iF=new T.InstancedMesh(flG,new T.MeshLambertMaterial({color:0xFFFFFF,emissive:0x303030,flatShading:true}),Math.max(1,flowers.length));
  for(i=0;i<flowers.length;i++){
    var fl=flowers[i];
    D2.position.set(fl[0],fl[1],fl[2]); D2.rotation.set(hs(fl[0],1,1)*3,hs(fl[2],2,2)*3,0);
    D2.scale.set(1,0.8,1); D2.updateMatrix(); iF.setMatrixAt(i,D2.matrix);
    cc.setHex(fl[3]).multiplyScalar(0.9+hs(fl[0],fl[2],3)*0.2); iF.setColorAt(i,cc);
  }
  if(iF.instanceColor) iF.instanceColor.needsUpdate=true;
  iF.userData.noShadow=true; iF.frustumCulled=false; iF.raycast=function(){}; scene.add(iF);

  var mw=new T.Mesh(MW.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  NAMED_PLACES.push({name:'Rose Garden Fountain',x:FX,z:FZ,h:5,rad:RB+4});
  window.__rose={beds:beds.length,bushes:bushes.length,flowers:flowers.length};
})();
