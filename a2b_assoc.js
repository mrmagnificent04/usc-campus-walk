/* ==================================================================
   Associates Park.
   The quiet lawn between Bovard and the Physical Education Building:
   a straight concrete walk running up to the PE Building's three-arched
   brick entrance, black iron benches either side, amber acorn lamps, a
   great pale-trunked fig and the two Olympic oaks grown from the seedlings
   Trojan sprinters brought home from Berlin in 1936, a clump of giant
   bird of paradise by the door, and the white monument in the middle
   that has puzzled visitors for decades.
   ================================================================== */
var NO_LAWN_TREES=[];
var ACORN_LAMPS=[];      /* [x,z] - built with the campus lamps */
(function(){
  var park=null;
  for(var i=0;i<PARKS.length;i++) if(PARKS[i].name==='Associates Park') park=PARKS[i].ring;
  if(!park) return;
  NO_LAWN_TREES.push(offsetRing(park,4)||park);
  var M=new Mesher();
  var BRICK=0x9A4A34, BRICK2=0x8C4330, CAST=0xDCD2BC, CAST2=0xC7BCA4, DARK=0x2A2622, IRON=0x1E2124;

  /* ---- the PE Building's entrance pavilion ---- */
  /* the entrance sits where the walk meets the east face */
  var ex=-69.2, ez=-73.0;
  var fx=-0.447, fz=0.894;          /* along the face, north to south */
  var nx=0.894, nz=0.447;           /* out of the face, toward the park */
  var W=7.6, D=3.6, H=10.6, SPR=5.2;
  function at(u,v){ return [ex+fx*u+nx*v, ez+fz*u+nz*v]; }
  function box(u0,u1,v0,v1,y0,y1,col,sh){
    var r=[at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)]; if(ringArea(r)<0) r.reverse();
    prism(M,r,y0,y1,col,col,sh===undefined?0.7:sh);
    return r;
  }
  function q(A,B,C,Dd,col,sh,n){
    var c=rgb(col,sh===undefined?1:sh);
    var ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2], vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
    var fx2=uy*vz-uz*vy, fy2=uz*vx-ux*vz, fz2=ux*vy-uy*vx;
    if(fx2*n[0]+fy2*n[1]+fz2*n[2]>=0) M.quad(A,B,C,Dd,c,c,c,c); else M.quad(A,Dd,C,B,c,c,c,c);
  }
  /* stone plinth and steps */
  box(-W-0.6,W+0.6,-0.2,D+0.4,0,0.9,CAST2,0.75);
  for(var st=0;st<3;st++) box(-4.2,4.2,D+0.4+st*0.45,D+0.85+st*0.45,0,0.9-st*0.3,CAST,0.8);
  /* the three arches: four piers, cast stone columns on the face */
  var bayW=(2*W)/3;
  for(var p=0;p<=3;p++){
    var u=-W+p*bayW, pw=(p===0||p===3)?0.95:0.55;
    box(u-pw,u+pw,0,D,0.9,H,BRICK,0.72);
    if(p>0&&p<3){ /* engaged column */
      var c=at(u,D+0.18);
      var cyl=new T.CylinderGeometry(0.34,0.38,SPR-1.2,10);
      var cm=new T.Mesh(cyl,new T.MeshLambertMaterial({color:CAST}));
      cm.position.set(c[0],0.9+(SPR-1.2)/2,c[1]); cm.castShadow=true; scene.add(cm);
      box(u-0.48,u+0.48,D-0.2,D+0.58,SPR-0.3,SPR+0.05,CAST2,0.85);
    }
  }
  /* arches: cast stone voussoirs over brick, deep reveals */
  for(var b=0;b<3;b++){
    var u0=-W+b*bayW+(b===0?0.95:0.55), u1=-W+(b+1)*bayW-(b===2?0.95:0.55);
    var uc=(u0+u1)/2, hw=(u1-u0)/2, NS=10;
    for(var s=0;s<NS;s++){
      var a0=Math.PI*s/NS, a1=Math.PI*(s+1)/NS;
      var ua=uc-Math.cos(a0)*hw, ub=uc-Math.cos(a1)*hw, ya=SPR+Math.sin(a0)*hw, yb=SPR+Math.sin(a1)*hw;
      var A0=at(ua,D), B0=at(ub,D), A1=at(ua,0), B1=at(ub,0);
      /* spandrel face above the curve, out to the pavilion top */
      q([A0[0],ya,A0[1]],[A0[0],H,A0[1]],[B0[0],H,B0[1]],[B0[0],yb,B0[1]],BRICK,0.92,[nx,0,nz]);
      /* soffit */
      q([A0[0],ya,A0[1]],[B0[0],yb,B0[1]],[B1[0],yb,B1[1]],[A1[0],ya,A1[1]],BRICK2,0.62,[0,-1,0]);
      /* stone voussoir ring */
      var ro=hw+0.42;
      var C0=at(uc-Math.cos(a0)*ro,D+0.05), C1=at(uc-Math.cos(a1)*ro,D+0.05),
          E0=at(ua,D+0.05), E1=at(ub,D+0.05);
      q([E0[0],ya,E0[1]],[C0[0],SPR+Math.sin(a0)*ro,C0[1]],[C1[0],SPR+Math.sin(a1)*ro,C1[1]],[E1[0],yb,E1[1]],CAST,0.95,[nx,0,nz]);
    }
    /* the recessed doorway wall, dark glass doors and a lantern */
    var d0=at(u0,0.05), d1=at(u1,0.05);
    q([d0[0],0.9,d0[1]],[d0[0],SPR+hw,d0[1]],[d1[0],SPR+hw,d1[1]],[d1[0],0.9,d1[1]],BRICK2,0.7,[nx,0,nz]);
    var g0=at(uc-1.0,0.1), g1=at(uc+1.0,0.1);
    q([g0[0],0.9,g0[1]],[g0[0],3.7,g0[1]],[g1[0],3.7,g1[1]],[g1[0],0.9,g1[1]],0x2A3440,1,[nx,0,nz]);
    var w0=at(uc-0.9,0.1), w1=at(uc+0.9,0.1);
    q([w0[0],4.1,w0[1]],[w0[0],SPR+hw-0.7,w0[1]],[w1[0],SPR+hw-0.7,w1[1]],[w1[0],4.1,w1[1]],0x3A4652,1,[nx,0,nz]);
    var lp=at(uc,D*0.5);
    var lan=new T.Mesh(new T.CylinderGeometry(0.22,0.16,0.6,6),new T.MeshLambertMaterial({color:0xE9B864,emissive:0x6a4410}));
    lan.position.set(lp[0],SPR+hw-1.2,lp[1]); scene.add(lan);
    segBox(M,lp,lp,SPR+hw-0.9,SPR+hw,0.04,IRON,0.7);
  }
  /* round oculus windows and the cast stone cornice */
  for(b=0;b<3;b++){
    var uo=-W+(b+0.5)*bayW, o=at(uo,D+0.06);
    var og=new T.CircleGeometry(0.42,14), om=new T.Mesh(og,new T.MeshLambertMaterial({color:CAST}));
    om.position.set(o[0],H-1.25,o[1]); om.rotation.y=Math.atan2(nx,nz); scene.add(om);
    var og2=new T.CircleGeometry(0.28,14), om2=new T.Mesh(og2,new T.MeshLambertMaterial({color:0x2A3440}));
    om2.position.set(o[0]+nx*0.02,H-1.25,o[1]+nz*0.02); om2.rotation.y=Math.atan2(nx,nz); scene.add(om2);
  }
  box(-W-0.35,W+0.35,-0.1,D+0.35,H,H+0.45,CAST,0.85);
  box(-W-0.1,W+0.1,0,D+0.1,H-0.3,H,CAST2,0.8);
  addCollider((function(){ var r=[at(-W-0.6,-0.2),at(W+0.6,-0.2),at(W+0.6,D+0.4),at(-W-0.6,D+0.4)]; if(ringArea(r)<0) r.reverse(); return r; })(),0.9);
  /* carved "USC ASSOCIATES" on the stone base to the north of the entrance */
  var sgn=at(W+4.2,0.25);
  box(W+0.6,W+7.8,-0.3,0.25,0,2.3,CAST,0.8);
  facadeText('USC ASSOCIATES',sgn[0],sgn[1],nx,nz,1.7,5.6,0.55,'#5E5446');

  /* ---- the tower behind, with its corbelled cast stone crown ---- */
  (function(){
    var tu=-7, tv=-9.5, hw2=6.2, y0=0, y1=22.5;
    var r=[at(tu-hw2,tv-hw2),at(tu+hw2,tv-hw2),at(tu+hw2,tv+hw2),at(tu-hw2,tv+hw2)];
    if(ringArea(r)<0) r.reverse();
    prism(M,r,y0,y1,BRICK,CAST2,0.6);
    band(M,r,y1-3.4,y1,0.08,CAST,1,0.8);
    band(M,r,y1,y1+0.5,0.35,CAST2,1,0.85);
    /* corbel table: a run of little round arches under the stone band */
    for(var e=0;e<4;e++){
      var A=r[e], B=r[(e+1)%4], dx=B[0]-A[0], dz=B[1]-A[1], L=Math.hypot(dx,dz);
      dx/=L; dz/=L; var ox=dz, oz=-dx;
      var cx0=(A[0]+B[0])/2-(tu===0?0:0), mid=[(A[0]+B[0])/2,(A[1]+B[1])/2];
      var tc=[ex+fx*tu+nx*tv, ez+fz*tu+nz*tv];
      if((mid[0]-tc[0])*ox+(mid[1]-tc[1])*oz<0){ ox=-ox; oz=-oz; }
      var n2=Math.floor(L/1.05);
      for(var k=0;k<n2;k++){
        var uu=(k+0.5)*L/n2, px=A[0]+dx*uu+ox*0.1, pz=A[1]+dz*uu+oz*0.1;
        archFace(M,px,pz,dx*(ox*dz-oz*dx>0?1:-1),dz*(ox*dz-oz*dx>0?1:-1),0,0,y1-3.4,0.6,0.35,0.3,0x6E3A2A,0.8);
      }
      /* two round windows per side */
      for(var w2=-1;w2<=1;w2+=2){
        var wc=[mid[0]+dx*w2*2.4+ox*0.06, mid[1]+dz*w2*2.4+oz*0.06];
        var cw=new T.Mesh(new T.CircleGeometry(0.55,14),new T.MeshLambertMaterial({color:CAST}));
        cw.position.set(wc[0],y1-5.5,wc[1]); cw.rotation.y=Math.atan2(ox,oz); scene.add(cw);
        var cw2=new T.Mesh(new T.CircleGeometry(0.36,14),new T.MeshLambertMaterial({color:0x2A3440}));
        cw2.position.set(wc[0]+ox*0.02,y1-5.5,wc[1]+oz*0.02); cw2.rotation.y=Math.atan2(ox,oz); scene.add(cw2);
      }
    }
  })();

  /* ---- black iron benches on concrete pads either side of the walk ---- */
  var wa=[-69,-73], wb=[-37,-56];
  var wdx=wb[0]-wa[0], wdz=wb[1]-wa[1], wL=Math.hypot(wdx,wdz); wdx/=wL; wdz/=wL;
  var wnx=-wdz, wnz=wdx;
  function bench(px,pz,fx2,fz2){
    /* (fx2,fz2): the way a sitter faces */
    var tx=-fz2, tz=fx2, pad=[];
    for(var c2=0;c2<4;c2++){ var su=(c2===0||c2===3)?-1.3:1.3, sv=(c2<2)?-0.35:1.25;
      pad.push([px+tx*su-fx2*sv,pz+tz*su-fz2*sv]); }
    if(ringArea(pad)<0) pad.reverse();
    flat(M,pad,0.06,0xC9C2B3,1);
    for(var sl=0;sl<5;sl++){
      var o=0.08+sl*0.1;
      segBox(M,[px+tx*-0.95+fx2*(0.25-o),pz+tz*-0.95+fz2*(0.25-o)],[px+tx*0.95+fx2*(0.25-o),pz+tz*0.95+fz2*(0.25-o)],0.44,0.48,0.06,IRON,0.8);
    }
    for(sl=0;sl<4;sl++){
      var yb=0.58+sl*0.11;
      segBox(M,[px+tx*-0.95-fx2*0.3,pz+tz*-0.95-fz2*0.3],[px+tx*0.95-fx2*0.3,pz+tz*0.95-fz2*0.3],yb,yb+0.05,0.05,IRON,0.8);
    }
    for(var e2=-1;e2<=1;e2+=2){
      var lx=px+tx*e2*0.98, lz=pz+tz*e2*0.98;
      segBox(M,[lx+fx2*0.25,lz+fz2*0.25],[lx-fx2*0.32,lz-fz2*0.32],0.0,0.08,0.07,IRON,0.7);
      segBox(M,[lx+fx2*0.22,lz+fz2*0.22],[lx+fx2*0.22,lz+fz2*0.22],0.0,0.66,0.07,IRON,0.7);
      segBox(M,[lx-fx2*0.30,lz-fz2*0.30],[lx-fx2*0.30,lz-fz2*0.30],0.0,1.02,0.07,IRON,0.7);
      segBox(M,[lx+fx2*0.26,lz+fz2*0.26],[lx-fx2*0.26,lz-fz2*0.26],0.64,0.70,0.07,IRON,0.7);
    }
    addCollider((function(){ var r=[[px+tx*-1.05-fx2*0.4,pz+tz*-1.05-fz2*0.4],[px+tx*1.05-fx2*0.4,pz+tz*1.05-fz2*0.4],
      [px+tx*1.05+fx2*0.35,pz+tz*1.05+fz2*0.35],[px+tx*-1.05+fx2*0.35,pz+tz*-1.05+fz2*0.35]]; if(ringArea(r)<0) r.reverse(); return r; })(),0.5);
  }
  var off=3.9;
  [[0.30,1],[0.30,-1],[0.62,1],[0.62,-1]].forEach(function(bs){
    var px=wa[0]+wdx*wL*bs[0]+wnx*off*bs[1], pz=wa[1]+wdz*wL*bs[0]+wnz*off*bs[1];
    bench(px,pz,-wnx*bs[1],-wnz*bs[1]);
  });
  /* amber acorn lamps by the walk */
  ACORN_LAMPS.push([wa[0]+wdx*wL*0.16+wnx*3.2, wa[1]+wdz*wL*0.16+wnz*3.2]);
  ACORN_LAMPS.push([wa[0]+wdx*wL*0.47-wnx*3.2, wa[1]+wdz*wL*0.47-wnz*3.2]);
  ACORN_LAMPS.push([wa[0]+wdx*wL*0.80+wnx*3.2, wa[1]+wdz*wL*0.80+wnz*3.2]);

  /* ---- the white monument in the middle of the lawn ---- */
  (function(){
    var mx=-46, mz=-74, ax=fx, az=fz;
    var r=oriRect(mx,mz,ax,az,1.9,1.1);
    prism(M,oriRect(mx,mz,ax,az,2.3,1.5),0,0.35,0xD9D3C6,0xE4DFD3,0.8);
    prism(M,oriRect(mx,mz,ax,az,1.9,1.1),0.35,1.25,0xEFEBE2,0xF4F1EA,0.82);
    prism(M,oriRect(mx,mz,ax,az,2.05,1.25),1.25,1.45,0xE6E1D6,0xF1EDE4,0.85);
    /* a reclining carved figure on the lid, just the massing */
    prism(M,oriRect(mx-ax*0.3,mz-az*0.3,ax,az,1.3,0.45),1.45,1.95,0xF2EEE6,0xF7F4EE,0.85);
    prism(M,oriRect(mx+ax*1.3,mz+az*1.3,ax,az,0.35,0.35),1.45,2.2,0xF2EEE6,0xF7F4EE,0.85);
    addCollider(oriRect(mx,mz,ax,az,2.3,1.5),1.45);
    NO_PLANT.push(oriRect(mx,mz,ax,az,4.5,3.5));
    NAMED_PLACES.push({name:'Associates Park Monument',x:mx,z:mz,h:2,rad:3});
  })();

  /* ---- clipped hedges edging the lawn along the buildings ---- */
  var hedgeC=0x2E5A27;
  function hedge(a,b){ segBox(M,a,b,0.02,0.85,1.0,hedgeC,0.62); segBox(M,a,b,0.85,1.0,0.86,hedgeC,0.95);
    addCollider((function(){ var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz), nx2=-dz/L*0.5, nz2=dx/L*0.5;
      var r=[[a[0]+nx2,a[1]+nz2],[b[0]+nx2,b[1]+nz2],[b[0]-nx2,b[1]-nz2],[a[0]-nx2,a[1]-nz2]]; if(ringArea(r)<0) r.reverse(); return r; })(),1.0); }
  hedge(at(W+2.2,5.8),at(W+14,5.8));
  hedge(at(-W-5.5,5.8),at(-W-12,5.8));

  var mesh=new T.Mesh(M.geom(),matWorld); mesh.frustumCulled=false; scene.add(mesh);

  /* ---- the trees: a great fig, the Olympic oaks, and bird of paradise by the door ---- */
  TREE_POS.push([-57,-53,0,'ficus',1.75]);
  TREE_POS.push([-41,-95,0,'oak',1.45]);
  TREE_POS.push([-33,-80,0,'oak',1.3]);
  TREE_POS.push([-27,-60,0,'syc',1.25]);
  var bp=at(-W-3.2,2.6), bp2=at(W+9.5,2.4);
  TREE_POS.push([bp[0],bp[1],2]);
  TREE_POS.push([bp[0]-fx*2.2,bp[1]-fz*2.2,2]);
  TREE_POS.push([bp2[0],bp2[1],2]);
})();
