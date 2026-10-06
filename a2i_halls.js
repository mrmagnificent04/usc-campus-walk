/* ==================================================================
   Two halls built by hand (a_world.js leaves their footprints empty):

   Grace Ford Salvatori Hall (1965). A long three storey block wrapped
   in a full height arcade: slim cream edged brick piers carrying round
   arches, dark glass set back behind them, blind brick bays at the
   ends, all under a thin white roof slab that sails out past the
   arches on closely spaced ribs. It stands on a low brick podium and
   you can walk under the arcade.

   Michelson Hall (2017). Red brick collegiate gothic: a cast stone
   ground storey, a row of tall pointed windows with tracery, a top
   storey of paired round headed windows under a corbel table, and
   taller corner pavilions with tile roofs. The east front has the
   name over the doors and a raised planter of Canary date palms.
   ================================================================== */
(function(){
  var M=new Mesher(), MG=new Mesher(), cols=[];
  function ccw(r){ if(ringArea(r)<0) r.reverse(); return r; }
  function find(name){ for(var i=0;i<CAMPUS.length;i++) if(CAMPUS[i].name===name) return CAMPUS[i]; return null; }
  function edges(ring,fn){
    for(var i=0;i<ring.length;i++){
      var a=ring[i], b=ring[(i+1)%ring.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<0.5) continue;
      var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      fn({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,dx:dx,dz:dz,nx:dz,nz:-dx,L:L,a:a,b:b},i);
    }
  }
  function solid(r,h){ cols.push([ccw(r.slice()),h]); }
  function under(ring,y,col){                       /* a face looking down */
    var f=triangulate(ring), c=rgb(col,0.78);
    for(var i=0;i<f.length;i++){ var A=ring[f[i][0]],B=ring[f[i][1]],C=ring[f[i][2]];
      M.tri([A[0],y,A[1]],[B[0],y,B[1]],[C[0],y,C[1]],c,c,c); }
  }

  /* ================================================================
     Grace Ford Salvatori Hall
     ================================================================ */
  (function(){
    var B=find('Grace Ford Salvatori Hall'); if(!B) return;
    var BRICK=0xB96A4C, BRICKD=0xA35B40, CREAM=0xECE3CC, WHITE=0xF3EFE5, GLASS=0x27323A, BRONZE=0x4A4038, PAVE=0xA6583F;
    var POD=0.5, CROWN=12.7, TOP=13.35, ROOF=14.0, DEEP=2.7, PIER=1.05, THICK=0.7;
    var body=ccw([[-276,-112],[-195,-69],[-208,-44],[-289,-87]]);
    /* podium, core and roof */
    var pod=offsetRing(body,3.6);
    prism(M,pod,0,POD,BRICKD,PAVE,0.7); solid(pod,POD);
    for(var st=1;st<=2;st++){ var sr=offsetRing(body,3.0+st*0.42); prism(M,sr,0,POD-st*0.17,0xC9C2B3,0xD3CCBD,0.72); solid(sr,POD-st*0.17); }
    var core=offsetRing(body,-DEEP*1.4142);          /* offsetRing moves corners along the bisector */
    prism(M,core,POD,TOP,BRICK,BRICK,0.55); solid(core,ROOF);
    var slab=offsetRing(body,2.4);
    prism(M,slab,TOP,ROOF,WHITE,0xD9D5CB,0.82); under(slab,TOP,WHITE);
    band(M,slab,ROOF,ROOF+0.12,-0.25,0xC9C5BB,0.9,0.8);

    edges(body,function(F){
      var isLong=F.L>50, bays=isLong?17:5, bw=F.L/bays, K=wallKit(M,F), u0=-F.L/2;
      function Q(u,v,y){ var p=K.P(u,v); return [p[0],y,p[1]]; }
      /* piers, cream edged, each one something to walk round */
      for(var k=0;k<=bays;k++){
        var uc=u0+k*bw, h=PIER/2, pa=Math.max(u0,uc-h), pb=Math.min(-u0,uc+h);
        var r=K.box(pa,pb,-THICK,0,POD,TOP,BRICK,0.58); solid(r,TOP);
        if(uc-h>u0) K.box(uc-h-0.02,uc-h+0.2,-THICK-0.03,0.06,POD,CROWN-((bw-PIER)/2),CREAM,0.8);
        if(uc+h<-u0) K.box(uc+h-0.2,uc+h+0.02,-THICK-0.03,0.06,POD,CROWN-((bw-PIER)/2),CREAM,0.8);
      }
      /* the arches: brick spandrels front and back, a cream band round each curve */
      var cB=rgb(BRICK,1), cBd=rgb(BRICK,0.62), cC=rgb(CREAM,0.95), cS=rgb(CREAM,0.72), N=10;
      for(k=0;k<bays;k++){
        var a=u0+k*bw+PIER/2, b=u0+(k+1)*bw-PIER/2, r0=(b-a)/2, um=(a+b)/2, sp=CROWN-r0;
        for(var i=0;i<N;i++){
          var t0=Math.PI*(1-i/N), t1=Math.PI*(1-(i+1)/N);
          var ua=um+Math.cos(t0)*r0, ub=um+Math.cos(t1)*r0, ya=sp+Math.sin(t0)*r0, yb=sp+Math.sin(t1)*r0;
          M.quad(Q(ua,0,ya),Q(ua,0,TOP),Q(ub,0,TOP),Q(ub,0,yb),cB,cB,cB,cB);                       /* front */
          M.quad(Q(ub,-THICK,yb),Q(ub,-THICK,TOP),Q(ua,-THICK,TOP),Q(ua,-THICK,ya),cBd,cBd,cBd,cBd); /* back */
          M.quad(Q(ua,0,ya),Q(ub,0,yb),Q(ub,-THICK,yb),Q(ua,-THICK,ya),cS,cS,cS,cS);                 /* soffit */
          M.quad(Q(ua,-THICK,ya),Q(ub,-THICK,yb),Q(ub,0,yb),Q(ua,0,ya),cS,cS,cS,cS);
          var ra=r0+0.24, ua2=um+Math.cos(t0)*ra, ub2=um+Math.cos(t1)*ra, ya2=sp+Math.sin(t0)*ra, yb2=sp+Math.sin(t1)*ra;
          M.quad(Q(ua,0.05,ya),Q(ua2,0.05,ya2),Q(ub2,0.05,yb2),Q(ub,0.05,yb),cC,cC,cC,cC);         /* archivolt */
        }
      }
      /* the wall behind: glass in the middle bays of the long sides, brick at the ends */
      if(isLong){
        var g0=u0+3*bw, g1=-u0-3*bw, gv=-DEEP+0.05;
        K.face((g0+g1)/2,gv,POD+0.5,g1-g0,TOP-POD-1.2,0,GLASS,1);
        for(var mu=g0;mu<=g1+0.01;mu+=bw/4) K.box(mu-0.05,mu+0.05,gv,gv+0.1,POD+0.5,TOP-0.7,(Math.round((mu-g0)/(bw/4))%4===0)?CREAM:BRONZE,0.8);
        [POD+4.4,POD+8.5].forEach(function(y){ K.face((g0+g1)/2,gv+0.06,y,g1-g0,0.55,0,BRONZE,1); });
        K.face((g0+g1)/2,gv+0.06,POD+0.5,g1-g0,0.35,0,BRONZE,1);
        /* doors under the three middle arches */
        [-bw,0,bw].forEach(function(du){
          K.face(du,gv+0.08,POD,2.6,2.5,0,0x1B2227,1); K.face(du,gv+0.1,POD,0.08,2.5,0,CREAM,1); });
        /* ribs under the overhang */
        for(var ru=u0+0.4;ru<-u0;ru+=1.35) K.box(ru-0.06,ru+0.06,-DEEP+0.2,1.6,TOP-0.36,TOP,WHITE,0.74);
      } else {
        for(var ru2=u0+0.4;ru2<-u0;ru2+=1.35) K.box(ru2-0.06,ru2+0.06,-DEEP+0.2,1.6,TOP-0.36,TOP,WHITE,0.74);
      }
    });
    /* the stair blocks on the two short ends */
    [[[-199,-61],[-193,-57],[-197,-49],[-203,-52]],[[-285,-95],[-291,-99],[-286,-107],[-280,-104]]].forEach(function(r){
      r=ccw(r); prism(M,offsetRing(r,0.6),0,11.6,BRICK,0xB9B3A6,0.56); band(M,offsetRing(r,0.6),11.0,11.6,0.12,CREAM,0.95,0.75,true); solid(offsetRing(r,0.6),11.6); });
    /* the college banner on a blind bay of the south front */
    var FS=wallFacing(body,-200,0,50);
    if(FS){ var KS=wallKit(M,FS), bu=-FS.L/2+FS.L/17*1.5, p=KS.P(bu,-DEEP+0.12);
      KS.face(bu,-DEEP+0.08,POD+2.0,3.0,2.3,0,0x8E1B2A,1);
      facadeText('USC Dornsife',p[0],p[1],FS.nx,FS.nz,POD+3.15,2.7,0.62,'#FFFFFF'); }
    B.h=ROOF;
    NO_PLANT.push(offsetRing(body,5)); NO_LAWN_TREES.push(offsetRing(body,5));
    var keep=offsetRing(body,4.6);
    for(var i=TREE_POS.length-1;i>=0;i--) if(inRing(keep,TREE_POS[i][0],TREE_POS[i][1])) TREE_POS.splice(i,1);
  })();

  /* ================================================================
     Michelson Hall
     ================================================================ */
  (function(){
    var B=find('Michelson Hall'); if(!B) return;
    var BRICK=0xB34A37, BRICKD=0x9A3D2D, CAST=0xDED4BE, CASTD=0xC2B79F, GLASS=0x3B4C59, GLASSL=0x587084,
        TILE=0xB0502F, TILED=0x8A3C24, FASCIA=0x4A4F57;
    var HM=20.4, HP=22.0, PW=8.6;
    var ring=ccw(simplifyRing(B.ring,2.2).slice());
    prism(M,ring,0,HM,BRICK,0x8F8C86,0.55); solid(ring,HM);
    band(M,ring,0,0.85,0.2,CASTD,1,0.7);
    band(M,ring,4.5,5.3,0.26,CAST,1,0.78,true);
    band(M,ring,14.3,14.95,0.2,CAST,1,0.8,true);
    lombardBand(M,ring,18.25,CAST,BRICK,1.25);
    band(M,ring,19.0,19.8,0.34,CAST,1,0.8,true);
    band(M,ring,19.8,HM,0.52,FASCIA,0.95,0.7);
    var FE=wallFacing(ring,-320,-125,30);                         /* the east front, toward the middle of campus */

    edges(ring,function(F){
      var K=wallKit(M,F), u0=-F.L/2, big=F.L>34;
      function lancet(u,v,y0,w,hs,ha,col,sh){ var p=K.P(u,v); lancetFace(M,p[0],p[1],F.dx,F.dz,0,0,y0,w,hs,ha,col,sh===undefined?1:sh); }
      function rectWin(u,y,w,h){ K.face(u,0.07,y-0.22,w+0.5,h+0.44,0,CAST,1); K.face(u,0.11,y,w,h,0,GLASS,1);
        K.face(u,0.14,y,0.07,h,0,CAST,0.95); K.face(u,0.14,y+h*0.6,w,0.07,0,CAST,0.95); }
      function topPair(u){ [-0.62,0.62].forEach(function(o){
        K.face(u+o,0.07,15.55,1.12,1.75,0.56,CAST,1); K.face(u+o,0.11,15.7,0.8,1.6,0.4,GLASS,1); });
        K.box(u-0.09,u+0.09,0,0.2,15.55,17.3,CAST,0.78); }
      var m0=u0, m1=-u0;
      if(big){
        /* corner pavilions: a little proud of the wall, a little taller, tile roofed */
        [u0+PW/2,-u0-PW/2].forEach(function(pc){
          var pr=K.box(pc-PW/2,pc+PW/2,-3.5,0.9,0,HP,BRICK,0.56); solid(pr,HP);
          K.box(pc-PW/2-0.15,pc+PW/2+0.15,-3.5,1.1,0,0.85,CASTD,0.7);
          K.box(pc-PW/2-0.12,pc+PW/2+0.12,-3.5,1.12,4.5,5.3,CAST,0.78);
          K.box(pc-PW/2-0.1,pc+PW/2+0.1,-3.5,1.06,14.3,14.95,CAST,0.8);
          K.box(pc-PW/2-0.2,pc+PW/2+0.2,-3.5,1.25,HP-1.1,HP-0.35,CAST,0.8);
          K.box(pc-PW/2-0.34,pc+PW/2+0.34,-3.5,1.4,HP-0.35,HP,FASCIA,0.75);
          var KP=wallKit(M,{x:F.x+F.nx*0.9,z:F.z+F.nz*0.9,dx:F.dx,dz:F.dz,nx:F.nx,nz:F.nz,L:F.L});
          [-2.0,2.0].forEach(function(o){
            var u=pc+o;
            [[1.35,2.5],[6.3,2.9],[10.4,2.9]].forEach(function(w){
              KP.face(u,0.07,w[0]-0.22,2.2,w[1]+0.44,0,CAST,1); KP.face(u,0.11,w[0],1.7,w[1],0,GLASS,1);
              KP.face(u,0.14,w[0],0.07,w[1],0,CAST,0.95); KP.face(u,0.14,w[0]+w[1]*0.6,1.7,0.07,0,CAST,0.95); });
            KP.face(u,0.05,15.3,2.9,3.0,1.45,BRICKD,1); KP.face(u,0.09,15.5,2.3,2.9,1.15,CAST,1);
            KP.face(u,0.13,15.7,1.8,2.75,0.9,GLASS,1); KP.face(u,0.16,15.7,0.07,3.4,0,CAST,0.95);
          });
          for(var qy=1.4;qy<HP-1.6;qy+=1.5){ KP.box(pc-PW/2-0.02,pc-PW/2+0.55,-0.1,0.08,qy,qy+0.5,CAST,0.8);
                                             KP.box(pc+PW/2-0.55,pc+PW/2+0.02,-0.1,0.08,qy,qy+0.5,CAST,0.8); }
          var er=offsetRing(ccw(pr.slice()),0.45); band(M,er,HP,HP+0.25,0,TILED,0.85,0.55); hipRoof(M,er,HP+0.25,2.3,3.6,TILE);
        });
        m0=u0+PW+0.6; m1=-u0-PW-0.6;
      }
      var Lm=m1-m0; if(Lm<3) return;
      if(F.L>18){
        /* the tall pointed windows, with two lights and a stone label either side */
        var nb=Math.max(1,Math.floor(Lm/6.7)), bw=Lm/nb;
        for(var k=0;k<nb;k++){
          var uc=m0+(k+0.5)*bw, W=Math.min(4.1,bw-2.2);
          lancet(uc,0.05,5.75,W+1.5,5.5,3.3,BRICKD);
          lancet(uc,0.09,5.9,W+0.62,5.35,2.95,CAST);
          lancet(uc,0.13,6.1,W,5.15,2.6,GLASS);
          [-W*0.25,W*0.25].forEach(function(o){ lancet(uc+o,0.15,6.1,W*0.47,5.0,1.1,CAST,0.96); lancet(uc+o,0.17,6.25,W*0.47-0.24,4.85,0.95,GLASSL); });
          K.face(uc,0.18,8.9,W,0.12,0,CAST,0.95);
          [-(W/2+1.15),W/2+1.15].forEach(function(o){ K.face(uc+o,0.08,11.0,0.9,0.42,0,CAST,1); });
          /* ground storey: two windows a bay, or the doors under the name */
          var door=(F===FE||(FE&&Math.abs(F.x-FE.x)<1&&Math.abs(F.z-FE.z)<1))&&k===Math.floor(nb/2);
          if(door){ K.face(uc,0.07,0.0,4.4,4.1,0,CAST,1); K.face(uc,0.11,0.0,3.7,3.7,0,0x202A31,1);
                    [-1.23,0,1.23].forEach(function(o){ K.face(uc+o,0.14,0,0.08,3.7,0,CAST,0.95); }); K.face(uc,0.14,2.55,3.7,0.08,0,CAST,0.95); }
          else [-bw*0.24,bw*0.24].forEach(function(o){ rectWin(uc+o,1.35,1.7,2.5); });
          /* top storey: paired round headed windows */
          var np=Math.max(2,Math.round(bw/2.6));
          for(var q=0;q<np;q++) topPair(uc-bw/2+(q+0.5)*bw/np);
        }
      } else if(F.L>6){
        var nw=Math.max(1,Math.floor(Lm/4.4)), g=Lm/nw;
        for(var w2=0;w2<nw;w2++){ var u=m0+(w2+0.5)*g; rectWin(u,1.35,1.7,2.5); rectWin(u,6.4,1.7,2.9); rectWin(u,10.5,1.7,2.9); topPair(u); }
      }
    });

    /* the east front: the name over the doors, and the planter of Canary date palms */
    if(FE){
      var KE=wallKit(M,FE), nm=KE.P(0,0.3);
      facadeText('MICHELSON HALL',nm[0],nm[1],FE.nx,FE.nz,4.9,11,1.0,'#6B6253');
      var PLN=Math.min(34,FE.L-PW*2+6), c=KE.P(-1.5,9.5);
      var pr=oriRect(c[0],c[1],FE.dx,FE.dz,PLN/2,1.9);
      prism(M,pr,0,0.78,0xBDB8AC,0x5B4A3A,0.72); solid(pr,0.78);
      prism(M,oriRect(c[0],c[1],FE.dx,FE.dz,PLN/2-0.3,1.6),0.78,0.92,0x4E7A3A,0x57843F,0.8);
      for(var b=0;b<3;b++){ var bc=KE.P(-1.5+(b-1)*PLN/3,11.7);            /* timber benches on the front edge */
        var br=oriRect(bc[0],bc[1],FE.dx,FE.dz,3.3,0.42); prism(M,br,0.42,0.52,0x8A5A36,0x9A6840,0.75); solid(br,0.52);
        prism(M,oriRect(bc[0],bc[1],FE.dx,FE.dz,3.0,0.3),0,0.42,0xBDB8AC,0xBDB8AC,0.7); }
      var court=oriRect(KE.P(0,8)[0],KE.P(0,8)[1],FE.dx,FE.dz,FE.L/2-2,8.5);
      flat(MG,court,0.138,0xC9B8A6,0.96);
      for(var i=TREE_POS.length-1;i>=0;i--) if(inRing(court,TREE_POS[i][0],TREE_POS[i][1])) TREE_POS.splice(i,1);
      NO_PLANT.push(court); NO_LAWN_TREES.push(court);
      for(var t=0;t<4;t++){ var tp=KE.P(-1.5+(t-1.5)*PLN/4.4,9.5); TREE_POS.push([tp[0],tp[1],3]); }
    }
    B.h=HP;
  })();

  cols.forEach(function(c){ addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  window.__halls={tris:M.count()};
})();
