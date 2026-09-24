/* ==================================================================
   California Science Center, Exposition Park, between the Rose Garden
   and the Coliseum. Laid on the OSM footprints (SCI, set in a_world.js):
   - the 1998 building: salmon tile walls pixelated with dark and violet
     squares, green glass along the south front, a glass prism rising
     over the roof; on the north side the brick front of the old State
     Exposition Building still faces the Rose Garden, with a jet on a
     pylon and cafe umbrellas on the lawn;
   - the round entrance pavilion, a glass drum caged in red steel,
     lifted on silver columns over wide pale steps and a plaza;
   - the IMAX block, the same tile in a diagonal lattice;
   - the Samuel Oschin Air and Space Center on the west side, the new
     stainless steel tower that stands Endeavour up in launch position;
   - the California African American Museum further east.
   ================================================================== */
(function(){
  if(!SCI.main) return;
  var M=new Mesher(), MG=new Mesher();
  var TAU=Math.PI*2;
  var PINK=0xD9907A, PINKD=0xC77E69, TDARK=0x5E302C, TVIO=0x9C74B4, TLIGHT=0xEBB19C,
      BR=0xA65A3F, TC=0xE3D3AE, TCD=0xC8B48C, TEAL=0x4FB3AC, GREEN=0x3E9E8C, GLASS=0x2C3A44,
      STEEL=0x7A1F1C, SILVER=0xC7CCD0, SST=0xCBD1D6, SSTD=0xB5BCC3, PALE=0xDCD6CC, PALED=0xC9C2B6,
      GRANITE=0x7E9096, DARK=0x2B2826, BRICK_T=0xC6A987, BRICK_TD=0xB09473;
  var cols=[];
  function ccw(r){ if(ringArea(r)<0) r.reverse(); return r; }
  function rect(x0,z0,x1,z1){ return ccw([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]); }
  function hs(a,b){ var x=Math.sin(a*12.9898+b*78.233)*43758.5453; return x-Math.floor(x); }
  function solid(r,h){ cols.push([r,h]); return r; }
  function frame(x,z,nx,nz,L){ return {x:x,z:z,nx:nx,nz:nz,dx:-nz,dz:nx,L:L||0}; }
  function kit(x,z,nx,nz){ return wallKit(M,frame(x,z,nx,nz)); }
  function eachEdge(ring,fn){
    for(var i=0;i<ring.length;i++){
      var a=ring[i], b=ring[(i+1)%ring.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(L<3) continue;
      var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      fn({x:(a[0]+b[0])/2, z:(a[1]+b[1])/2, dx:dx, dz:dz, nx:dz, nz:-dx, L:L});
    }
  }
  function face(F,u,v,y0,w,h,ha,col){
    archFace(M,F.x+F.dx*u+F.nx*v,F.z+F.dz*u+F.nz*v,F.dx,F.dz,0,0,y0,w,h,ha,col,1);
  }
  /* keep the part of a polygon where a*x+b*z >= c */
  function clip(poly,a,b,c){
    var out=[], n=poly.length;
    for(var i=0;i<n;i++){
      var A=poly[i], B=poly[(i+1)%n], da=a*A[0]+b*A[1]-c, db=a*B[0]+b*B[1]-c;
      if(da>=0) out.push(A);
      if((da>=0)!==(db>=0)){ var t=da/(da-db); out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]); }
    }
    return out.length>=3?ccw(out):null;
  }
  /* a square-section member between two 3-D points */
  function beam(A,B,w,col,sh){
    var dx=B[0]-A[0], dy=B[1]-A[1], dz=B[2]-A[2], L=Math.sqrt(dx*dx+dy*dy+dz*dz); if(L<1e-4) return;
    dx/=L; dy/=L; dz/=L;
    var ux=0,uy=1,uz=0; if(Math.abs(dy)>0.9){ ux=1; uy=0; }
    var px=dy*uz-dz*uy, py=dz*ux-dx*uz, pz=dx*uy-dy*ux, pl=Math.sqrt(px*px+py*py+pz*pz); px/=pl; py/=pl; pz/=pl;
    var qx=dy*pz-dz*py, qy=dz*px-dx*pz, qz=dx*py-dy*px, h=w*0.5;
    var K=[[1,1],[-1,1],[-1,-1],[1,-1]];
    for(var i=0;i<4;i++){
      var a=K[i], b=K[(i+1)%4], c=rgb(col,(i%2)?1:(sh||0.72));
      var oa=[(a[0]*px+a[1]*qx)*h,(a[0]*py+a[1]*qy)*h,(a[0]*pz+a[1]*qz)*h],
          ob=[(b[0]*px+b[1]*qx)*h,(b[0]*py+b[1]*qy)*h,(b[0]*pz+b[1]*qz)*h];
      M.quad([A[0]+oa[0],A[1]+oa[1],A[2]+oa[2]],[A[0]+ob[0],A[1]+ob[1],A[2]+ob[2]],
             [B[0]+ob[0],B[1]+ob[1],B[2]+ob[2]],[B[0]+oa[0],B[1]+oa[1],B[2]+oa[2]],c,c,c,c);
    }
  }
  /* upright cylinder wall, alternate facets a shade apart */
  function drum(cx,cz,r,y0,y1,n,col,colB){
    var cA=rgb(col,1), cB=rgb(colB,1);
    for(var i=0;i<n;i++){
      var a0=i/n*TAU, a1=(i+1)/n*TAU, c=(i%2)?cA:cB;
      M.quad([cx+Math.cos(a0)*r,y0,cz+Math.sin(a0)*r],[cx+Math.cos(a0)*r,y1,cz+Math.sin(a0)*r],
             [cx+Math.cos(a1)*r,y1,cz+Math.sin(a1)*r],[cx+Math.cos(a1)*r,y0,cz+Math.sin(a1)*r],c,c,c,c);
    }
  }
  function flatDown(ring,y,col){
    var f=triangulate(ring), c=rgb(col,0.8);
    for(var i=0;i<f.length;i++){ var A=ring[f[i][0]],B=ring[f[i][1]],C=ring[f[i][2]];
      M.tri([A[0],y,A[1]],[B[0],y,B[1]],[C[0],y,C[1]],c,c,c); }
  }
  /* the tile skin: a faint panel grid, clusters of dark squares and loose violet ones
     (mode 'lattice' lays the dark tiles in crossing diagonals instead) */
  function tiles(F,u0,u1,y0,y1,mode,seed){
    var ts=1.3, v=0.05, cD=TDARK, gl=rgb(PINKD,1);
    for(var y=y0+ts;y<y1-0.2;y+=ts){
      var a=[F.x+F.dx*u0+F.nx*0.03,F.z+F.dz*u0+F.nz*0.03], b=[F.x+F.dx*u1+F.nx*0.03,F.z+F.dz*u1+F.nz*0.03];
      M.quad([a[0],y,a[1]],[a[0],y+0.06,a[1]],[b[0],y+0.06,b[1]],[b[0],y,b[1]],gl,gl,gl,gl);
    }
    var ni=Math.floor((u1-u0)/ts), nj=Math.floor((y1-y0)/ts);
    for(var i=0;i<ni;i++) for(var j=0;j<nj;j++){
      var u=u0+(i+0.5)*ts, y=y0+j*ts, h=hs(i+seed,j*1.7+seed*3), col=0;
      if(mode==='lattice'){
        var k=11, d1=((i+j)%k+k)%k, d2=((i-j)%k+k)%k;
        if(d1===0||d2===0) col=(h<0.3)?TVIO:TDARK; else if(h<0.035) col=TLIGHT;
      } else {
        var ci=Math.floor(i/2), cj=Math.floor(j/2), hc=hs(ci*3.1+seed,cj*5.3+seed);
        if(hc<0.16&&((i+j)%2===0||hc<0.07)) col=TDARK;
        else if(h<0.07) col=TVIO; else if(h<0.11) col=TLIGHT;
      }
      if(!col) continue;
      face(F,u,v,y+ts*0.14,ts*0.72,ts*0.72,0,col);
    }
  }

  /* ================================================ the 1998 building */
  var TY=1.44;                                          /* terrace level at the entrance */
  var main=clip(simplifyRing(SCI.main.ring,0.6),1,0,-160);      /* the west end is the new Air and Space Center */
  var north=clip(main,0,-1,-492), south=clip(main,0,1,492);
  var HMAIN=22, NH=11.4, HN=NH;
  prism(M,south,0,HMAIN,PINK,0xA7A198,0.56);
  prism(M,north,0,HN,PINK,0xA7A198,0.56);
  band(M,south,HMAIN-0.5,HMAIN+0.35,0.25,PINKD,0.95,0.7,true);
  solid(south,HMAIN+0.4); solid(north,HN);
  var tileWalls=function(ring,y1,skip,seed){
    eachEdge(ring,function(F){
      if(F.L<5||skip(F)) return;
      tiles(F,-F.L/2+0.4,F.L/2-0.4,0.8,y1-0.7,'cluster',seed+F.x*0.1);
      face(F,0,0.02,0,F.L,0.8,0,PINKD);
    });
  };
  tileWalls(south,HMAIN,function(F){ return false; },1);
  tileWalls(north,HN,function(F){ return F.nz<-0.9&&F.x>-115&&F.x<-15; },7);

  /* the north side: the 1912 State Exposition Building front, facing the Rose Garden */
  var nx0=-114, nx1=-16, NZ=475;
  var NF=frame((nx0+nx1)/2,NZ,0,-1,nx1-nx0), K=wallKit(M,NF);     /* u runs east to west */
  solid(K.box(-NF.L/2,NF.L/2,-0.2,1.3,0,NH,BR,0.58),NH);
  K.box(-NF.L/2-0.1,NF.L/2+0.1,-0.2,1.5,0,1.2,TCD,0.7);
  K.box(-NF.L/2-0.1,NF.L/2+0.1,-0.2,1.45,7.9,8.3,TC,0.8);
  K.box(-NF.L/2-0.1,NF.L/2+0.1,-0.2,1.5,9.7,10.3,TC,0.82);
  K.box(-NF.L/2-0.2,NF.L/2+0.2,-0.2,1.75,10.3,10.75,TCD,0.8);
  K.box(-NF.L/2,NF.L/2,-0.2,1.1,10.75,NH,BR,0.6);
  K.box(-NF.L/2-0.05,NF.L/2+0.05,-0.2,1.2,NH,NH+0.25,TC,0.8);
  var PAVS=[-30,0,30];
  function inPav(u){ for(var q=0;q<PAVS.length;q++) if(Math.abs(u-PAVS[q])<4.6) return true; return false; }
  for(var u=-NF.L/2+3.2;u<NF.L/2-2;u+=4.9){
    if(inPav(u)) continue;
    K.face(u,1.33,1.8,3.3,4.3,1.65,TC,1); K.face(u,1.37,2.0,2.6,4.1,1.3,GLASS,1);
    /* roundel between the arches */
    if(!inPav(u+2.45)&&u+2.45<NF.L/2-2) K.disc(u+2.45,1.34,8.95,0.55,TC,12);
    K.face(u,1.40,7.4,0.5,0.5,0,TCD,1);
  }
  PAVS.forEach(function(pu){                            /* the three entrance pavilions */
    solid(K.box(pu-4.4,pu+4.4,1.0,2.4,0,NH+2.0,BR,0.6),NH+2);
    K.box(pu-4.6,pu+4.6,1.0,2.6,0,1.2,TCD,0.7);
    [-3.5,-2.3,2.3,3.5].forEach(function(q){ K.box(pu+q-0.3,pu+q+0.3,2.4,2.75,1.2,NH+0.4,TC,0.7); });
    K.face(pu,2.44,1.2,3.4,4.8,1.7,TC,1); K.face(pu,2.48,1.2,2.6,4.6,1.3,DARK,1);
    K.face(pu,2.44,8.4,2.4,1.6,0,TC,1);   K.disc(pu,2.5,9.2,0.75,0xE9DCBE,14);
    K.box(pu-4.7,pu+4.7,1.0,2.9,NH,NH+0.5,TC,0.8);
    K.box(pu-3.0,pu+3.0,1.2,2.6,NH+0.5,NH+2.2,TC,0.72);
    K.gable(pu-3.2,pu+3.2,2.62,NH+2.2,NH+3.1,TC);
  });
  /* set back over the old front, the green glass band of the new building */
  K.box(-NF.L/2,NF.L/2,-4.0,-1.2,NH,NH+4.6,TEAL,0.8);
  for(u=-NF.L/2;u<=NF.L/2;u+=2.4) K.box(u-0.07,u+0.07,-1.25,-1.05,NH,NH+4.6,0xDDE7E6,0.8);
  K.box(-NF.L/2,NF.L/2,-4.0,-1.0,NH+4.6,NH+4.95,0xDDE7E6,0.85);

  /* the jet on its pylon and the cafe on the lawn */
  (function(){
    var jx=-100, jz=458.5, jy=7.6, cJ=0xC9CDD2, cJd=rgb(cJ,0.8), cJl=rgb(cJ,1);
    beam([jx,0,jz],[jx,jy-0.6,jz],1.0,0x9FA4A8,0.75);
    beam([jx,jy-0.6,jz],[jx+0.6,jy,jz],0.7,0x9FA4A8,0.75);
    beam([jx+7.2,jy+0.5,jz],[jx-6.5,jy-0.3,jz],1.5,cJ,0.8);            /* fuselage, nose west */
    beam([jx-6.5,jy-0.3,jz],[jx-9.2,jy-0.6,jz],0.75,cJ,0.8);
    beam([jx-4.8,jy+0.25,jz],[jx-2.8,jy+0.55,jz],0.9,0x39424B,0.8);    /* canopy */
    function tri2(A,B,C,c1,c2){ M.tri(A,B,C,c1,c1,c1); M.tri(A,C,B,c2,c2,c2); }
    for(var s=-1;s<=1;s+=2){
      tri2([jx-2,jy,jz+s*0.7],[jx+3.6,jy+0.2,jz+s*0.7],[jx+3.2,jy+0.1,jz+s*6.0],cJl,cJd);
      tri2([jx-2,jy,jz+s*0.7],[jx+3.2,jy+0.1,jz+s*6.0],[jx+2.2,jy+0.1,jz+s*6.0],cJl,cJd);
      tri2([jx+5.2,jy+0.4,jz+s*1.0],[jx+7.4,jy+0.6,jz+s*1.2],[jx+7.3,jy+3.3,jz+s*1.9],cJl,cJd);   /* twin fins */
      tri2([jx+5.8,jy+0.3,jz+s*0.6],[jx+7.6,jy+0.4,jz+s*0.6],[jx+7.5,jy+0.35,jz+s*3.2],cJl,cJd);
    }
    cols.push([rect(jx-0.6,jz-0.6,jx+0.6,jz+0.6),jy]);
    for(var i=0;i<6;i++){
      var ux=-80+i*6.5, uz=468.5+(i%2)*1.6, uc=(i%2)?0x3FB3A6:0xEEE6D2;
      postAt(M,ux,uz,0,2.4,0.05,0x6E6E6E,0.8); coneRoof(M,ux,uz,1.5,2.2,0.7,uc,8);
      postAt(M,ux,uz,0.72,0.78,0.55,0xE8E4DC,0.85); postAt(M,ux,uz,0,0.72,0.06,0x6E6E6E,0.8);
      cols.push([rect(ux-0.6,uz-0.6,ux+0.6,uz+0.6),0.8]);
    }
    flat(MG,rect(-84,465.5,-40,474.5),0.14,PALE,0.95);
  })();

  /* the south front: green glass under the tile, the name on a canopy */
  var SF=rect(-122,543,-80,551);
  solid(SF,TY+8.2);
  prism(M,SF,0,TY+8.2,GREEN,0xA7A198,0.62);
  var G=kit(-101,551,0,1);                     /* u runs west */
  for(u=-20.5;u<=20.5;u+=2.6) G.box(u-0.06,u+0.06,0,0.12,TY,TY+8.1,0x1F3A3A,0.8);
  for(var gy=TY+2.2;gy<TY+8;gy+=1.95) G.box(-21,21,0,0.1,gy,gy+0.08,0x1F3A3A,0.8);
  G.box(-21.6,21.6,-8,3.6,TY+8.2,20.8,PINK,0.55);      /* the tile mass overhangs the glass */
  tiles(frame(-101,554.6,0,1,43.2),-21.4,21.4,TY+8.4,20.6,'cluster',21);
  G.box(-21.6,21.6,-0.4,3.6,TY+8.0,TY+8.25,0x2A2A2A,0.6);
  G.box(-19,-3,0.1,4.2,TY+3.5,TY+3.75,0xE6E6E6,0.85);             /* ticket canopy */
  var sg=G.P(-11,4.25);
  facadeText('California Science Center',sg[0],sg[1],0,1,TY+4.35,17,1.6,'#D6DD3F');
  for(u=-18;u<=-4;u+=2.8){ G.face(u,0.14,TY,1.8,2.4,0,0xC9D3D2); }

  /* the glass prism rising over the roof */
  (function(){
    var b=[[-121,514],[-96,514],[-96,540],[-121,540]], ap=[-99,37,537], y0=HMAIN+0.3;
    var cG=rgb(0x5DB6C9,1), cGd=rgb(0x3F8FA6,1), cM=0x2B4F5C;
    for(var i=0;i<4;i++){
      var A=b[i], B=b[(i+1)%4], c=(i%2)?cG:cGd;
      M.tri([A[0],y0,A[1]],[ap[0],ap[1],ap[2]],[B[0],y0,B[1]],c,c,c);
      M.tri([A[0],y0,A[1]],[B[0],y0,B[1]],[ap[0],ap[1],ap[2]],c,c,c);
      for(var t=0.2;t<0.95;t+=0.2)
        beam([A[0]+(ap[0]-A[0])*t,y0+(ap[1]-y0)*t,A[1]+(ap[2]-A[1])*t],
             [B[0]+(ap[0]-B[0])*t,y0+(ap[1]-y0)*t,B[1]+(ap[2]-B[1])*t],0.14,cM,0.8);
      for(var s2=0.25;s2<1;s2+=0.25){
        var P=[A[0]+(B[0]-A[0])*s2,A[1]+(B[1]-A[1])*s2];
        beam([P[0],y0,P[1]],ap,0.12,cM,0.8);
      }
    }
  })();

  /* ============================== the entrance rotunda and its terrace */
  var RC=SCI.rot?centroid(SCI.rot.ring):[-64.5,557], RR=15.2, RY0=TY+6.2, RY1=25.8;
  var terr=ccw([[-118,547],[-47,547],[-47,556],[-53,562],[-118,562]]);
  solid(terr,TY); prism(M,terr,0,TY,PALED,PALE,0.7);
  for(var st=0;st<7;st++){ var sh=TY-0.18*(st+1);
    var sa=rect(-118,562,-56,562+(st+1)*0.45), sb=rect(-118-(st+1)*0.45,549,-118,562+(st+1)*0.45);
    solid(sa,sh); prism(M,sa,0,sh,PALED,PALE,0.7);
    solid(sb,sh); prism(M,sb,0,sh,PALED,PALE,0.7);
  }
  var core=ccw(ngon(RC[0],RC[1],7.5,20,0));
  prism(M,core,0,RY0,0x24302F,0x24302F,0.8); solid(core,RY0);
  for(var ci=0;ci<20;ci++){ var ca=ci/20*TAU;
    beam([RC[0]+Math.cos(ca)*7.55,TY,RC[1]+Math.sin(ca)*7.55],[RC[0]+Math.cos(ca)*7.55,RY0,RC[1]+Math.sin(ca)*7.55],0.12,0x8E969C,0.8); }
  /* silver fluted columns carrying the drum */
  for(var k=0;k<8;k++){ var a=(k+0.5)/8*TAU;
    var px=RC[0]+Math.cos(a)*12.8, pz=RC[1]+Math.sin(a)*12.8;
    drum(px,pz,1.05,0,RY0,10,SILVER,0xA9AFB5);
    flat(M,ngon(px,pz,1.05,10,0),RY0,SILVER,1);
    cols.push([ccw(ngon(px,pz,1.1,8,0)),RY0]);
  }
  /* the drum: glass with vertical louvers inside, then the red steel cage */
  flatDown(ccw(ngon(RC[0],RC[1],RR,40,0)),RY0,0x5A2A26);
  drum(RC[0],RC[1],RR-1.0,RY0,RY1,64,0xC9DCE4,0x9FB9C6);
  flat(M,ccw(ngon(RC[0],RC[1],RR,40,0)),RY1+0.4,0x8C8A88,1);
  var NB=24, NS=8, TW=Math.PI/3.2;
  for(var sgn=-1;sgn<=1;sgn+=2) for(k=0;k<NB;k++){
    var a0=k/NB*TAU, prev=null;
    for(var t=0;t<=NS;t++){
      var aa=a0+sgn*TW*t/NS, yy=RY0+(RY1-RY0)*t/NS;
      var P=[RC[0]+Math.cos(aa)*RR,yy,RC[1]+Math.sin(aa)*RR];
      if(prev) beam(prev,P,0.42,STEEL,0.7);
      prev=P;
    }
  }
  for(var ry=RY0;ry<=RY1+0.01;ry+=(RY1-RY0)/6){
    for(k=0;k<48;k++){ var b0=k/48*TAU, b1=(k+1)/48*TAU;
      beam([RC[0]+Math.cos(b0)*(RR+0.05),ry,RC[1]+Math.sin(b0)*(RR+0.05)],
           [RC[0]+Math.cos(b1)*(RR+0.05),ry,RC[1]+Math.sin(b1)*(RR+0.05)],0.48,STEEL,0.7); }
  }
  for(k=0;k<8;k++){ var va=(k+0.5)/8*TAU;
    beam([RC[0]+Math.cos(va)*(RR+0.1),RY0,RC[1]+Math.sin(va)*(RR+0.1)],[RC[0]+Math.cos(va)*(RR+0.1),RY1,RC[1]+Math.sin(va)*(RR+0.1)],0.5,STEEL,0.7); }

  /* ================================================ the IMAX theater */
  if(SCI.imax){
    var IM=ccw(simplifyRing(SCI.imax.ring,0.5).slice()), IH=24;
    prism(M,IM,0,IH,PINK,0xA7A198,0.56); solid(IM,IH);
    band(M,IM,IH-0.4,IH+0.3,0.2,PINKD,0.95,0.7,true);
    eachEdge(IM,function(F){
      tiles(F,-F.L/2+0.4,F.L/2-0.4,0.8,IH-0.6,'lattice',F.z*0.3);
      band(M,[[F.x-F.dx*F.L/2,F.z-F.dz*F.L/2],[F.x+F.dx*F.L/2,F.z+F.dz*F.L/2]],0,0.8,0,PINKD,0.9,0.7,true);
      face(F,-F.L*0.3,0.08,IH*0.45,1.2,8,0,GLASS);
    });
    var FI=faceToward(IM,RC[0]-30,RC[1]+30);
    if(FI){ face(FI,0,0.07,0,5,3.2,0,GLASS);
      facadeText('IMAX',FI.x+FI.dx*6,FI.z+FI.dz*6,FI.nx,FI.nz,4.4,6,0.8,'#3A2A28'); }
  }

  /* ================================================ the plaza */
  /* the plaza runs from the building down to the edge of Exposition Park Drive */
  var plazaR=ccw([[-150,551],[-118,549],[-47,546],[-45,556],[-62,572],[-66,580],[-80,584.5],[-114,568.5],[-150,565.5]]);
  flat(MG,offsetRing(plazaR,0.8),0.136,0xB8AEA6,0.95);
  flat(MG,plazaR,0.142,0xD9D2C9,0.97);
  /* carved granite slabs and a boulder, like the ones on the steps */
  [[-97,568,2.4,0.7,5.2,0.2],[-90,570.5,1.7,0.6,3.6,-0.35],[-135,558,2.8,2.2,2.2,0.5],[-73,575,1.6,0.6,4.4,0.9]].forEach(function(g){
    var ux=Math.cos(g[5]), uz=Math.sin(g[5]);
    var r=oriRect(g[0],g[1],ux,uz,g[2]*0.5,g[3]*0.5);
    prism(M,r,0,g[4],GRANITE,0x9AAAB0,0.62); solid(r,g[4]);
    prism(M,oriRect(g[0]+ux*g[2]*0.3,g[1]+uz*g[2]*0.3,ux,uz,g[2]*0.22,g[3]*0.52),g[4],g[4]+0.7,GRANITE,0x9AAAB0,0.62);
  });

  /* ============================ the Samuel Oschin Air and Space Center */
  var AX=-187, AZ=512;
  function sEll(cx,cz,ax,az,p,n){ var o=[];
    for(var i=0;i<n;i++){ var t=i/n*TAU, c=Math.cos(t), s=Math.sin(t);
      o.push([cx+ax*Math.sign(c)*Math.pow(Math.abs(c),2/p), cz+az*Math.sign(s)*Math.pow(Math.abs(s),2/p)]); }
    return o; }
  var g0=sEll(AX,AZ,24,41,4,48);
  prism(M,g0,0,7,GLASS,0x9AA0A6,0.8); solid(g0,26);
  eachEdge(g0,function(F){ for(var q=-F.L/2;q<F.L/2;q+=2.2) face(F,q,0.05,0,0.1,7,0,0xB9C0C6); });
  [[7,15,26.5,43.5],[16.5,25.5,25.5,42.5]].forEach(function(T2){     /* two metal tiers cantilevered over the glass */
    var r=sEll(AX,AZ,T2[2],T2[3],4,56);
    var ca=rgb(SST,1), cb=rgb(SSTD,1), n=r.length;
    for(var i=0;i<n;i++){ var A=r[i], B=r[(i+1)%n];
      for(var y=T2[0];y<T2[1]-0.01;y+=1.5){
        var c=((i+Math.round(y/1.5))%2)?ca:cb, y2=Math.min(T2[1],y+1.5);
        M.quad([A[0],y,A[1]],[A[0],y2,A[1]],[B[0],y2,B[1]],[B[0],y,B[1]],c,c,c,c);
      }
    }
    flat(M,r,T2[1],0xA9AEB2,1); flatDown(r,T2[0],0x8F959A);
  });
  /* the curved shuttle tower, 61 m, a little fuller in the middle */
  (function(){
    var TX=-187, TZ=490, TH=61, n=40, rings=[], ys=[];
    for(var y=0;y<=TH+0.01;y+=3){
      var t=y/TH, s=1+0.07*Math.sin(t*Math.PI)-(t>0.86?Math.pow((t-0.86)/0.14,2)*0.55:0);
      rings.push(sEll(TX,TZ,16*s,12.5*s,3.2,n)); ys.push(y);
    }
    var ca=rgb(SST,1), cb=rgb(SSTD,1), cc=rgb(0xDCE1E5,1);
    for(var k=0;k<rings.length-1;k++) for(var i=0;i<n;i++){
      var A=rings[k][i], B=rings[k][(i+1)%n], C=rings[k+1][(i+1)%n], D=rings[k+1][i];
      var c=(i%4===0)?cc:((k+i)%2?ca:cb);
      M.quad([A[0],ys[k],A[1]],[D[0],ys[k+1],D[1]],[C[0],ys[k+1],C[1]],[B[0],ys[k],B[1]],c,c,c,c);
    }
    flat(M,ccw(rings[rings.length-1].slice()),TH,0xB9BFC5,1);
    /* a tall glazed slot on the south face, the orange tank and white boosters behind it */
    var sl=frame(TX,TZ+12.5*1.075+0.1,0,1,7);
    face(sl,0,0,26,6.4,30,0,0x33404A);
    face(sl,0,0.03,27,2.6,27,0,0xC0632B);
    face(sl,-2.2,0.04,27,0.9,25,0,0xE9E9E9); face(sl,2.2,0.04,27,0.9,25,0,0xE9E9E9);
    cols.push([sEll(TX,TZ,16.8,13.2,3.2,24),TH]);
  })();

  /* ================================== California African American Museum */
  if(SCI.caam){
    var CR=ccw(simplifyRing(SCI.caam.ring,1.2).slice()), CH=8.8;
    prism(M,CR,0,CH,BRICK_T,0xA6A098,0.58); solid(CR,CH+4.6);
    band(M,CR,0,0.7,0.12,BRICK_TD,1,0.7);
    for(var cy=1.3;cy<CH;cy+=1.3) band(M,CR,cy,cy+0.05,0.04,BRICK_TD,0.9,0.8,true);
    var inner=offsetRing(simplifyRing(CR,3),-1.4);
    if(inner&&ringArea(inner)>200){
      prism(M,ccw(inner),CH,CH+4.2,0x28323B,0x28323B,0.85);
      eachEdge(inner,function(F){ for(var q=-F.L/2;q<=F.L/2;q+=2.6) face(F,q,0.05,CH,0.12,4.2,0,0xAEB6BC); });
      prism(M,ccw(offsetRing(inner,0.7)),CH+4.2,CH+4.7,0xE2DED6,0xD0CBC2,0.75);
    }
    var FC=faceToward(CR,60,560);
    if(FC){
      facadeText('CALIFORNIA AFRICAN AMERICAN MUSEUM',FC.x+FC.nx*1.4,FC.z+FC.nz*1.4,FC.nx,FC.nz,CH+2.1,Math.min(FC.L-2,26),2.4,'#F2F2EE');
      face(FC,-FC.L*0.25,0.06,1.2,3.2,4.6,0,0xF2D23A);           /* the yellow exhibit banner */
    }
    /* the round entrance canopy on columns, and the stepped brick tower */
    var ex=140, ez=539, cr=10;
    var cano=[[ex,ez]]; for(var ai=0;ai<=12;ai++){ var an=Math.PI*0.5+ai/12*Math.PI*0.5; cano.push([ex+Math.cos(an)*cr,ez+Math.sin(an)*cr]); }
    cano=ccw(cano); prism(M,cano,5.6,6.4,0xD4CEC4,0xC9C2B7,0.7);
    for(ai=1;ai<=3;ai++){ var an2=Math.PI*0.5+ai/4*Math.PI*0.5;
      var cxp=ex+Math.cos(an2)*(cr-1.2), czp=ez+Math.sin(an2)*(cr-1.2);
      drum(cxp,czp,0.55,0,5.6,10,0xCFC8BC,0xB9B2A6); cols.push([ccw(ngon(cxp,czp,0.6,8,0)),5.6]); }
    for(var zi=0;zi<4;zi++){ var hw=4.2-zi*0.8;
      prism(M,rect(146-hw,545-hw,146+hw,545+hw),0,CH+1.2+zi*1.6,BRICK_T,BRICK_TD,0.6); }
    var cc0=centroid(SCI.caam.ring); NAMED_PLACES.push({name:SCI.caam.name,x:cc0[0],z:cc0[1],h:CH,rad:40});
  }

  /* keep trees off the buildings, the plaza and the steps */
  var keep=[offsetRing(main,4),rect(-214,466,-156,558),rect(-152,546,-40,586),rect(-104,452,-96,466),rect(-84,464,-40,475)];
  if(SCI.imax) keep.push(offsetRing(SCI.imax.ring,3));
  if(SCI.caam) keep.push(offsetRing(SCI.caam.ring,3),rect(122,528,142,552));
  for(var i=TREE_POS.length-1;i>=0;i--){ var tq=TREE_POS[i];
    for(var kk=0;kk<keep.length;kk++) if(keep[kk]&&inRing(keep[kk],tq[0],tq[1])){ TREE_POS.splice(i,1); break; } }
  keep.forEach(function(r){ if(r){ NO_PLANT.push(r); NO_LAWN_TREES.push(r); } });

  cols.forEach(function(c){ addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  NAMED_PLACES.push({name:'California Science Center',x:-95,z:515,h:HMAIN,rad:50});
  NAMED_PLACES.push({name:'California Science Center',x:RC[0],z:RC[1],h:RY1,rad:20});
  NAMED_PLACES.push({name:'Samuel Oschin Air and Space Center (Space Shuttle Endeavour)',x:-187,z:495,h:61,rad:26});
  window.__sci={tris:M.count()};
})();
