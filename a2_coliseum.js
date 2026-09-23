/* ==================================================================
   The Los Angeles Memorial Coliseum.
   A sunken superellipse bowl of cardinal seats rising from a field nine
   metres below the street, squared off at the east end by the peristyle:
   the arcade of round arches, the great central arch with its stepped
   pylon, the lettering, the Olympic rings and the torch. The press tower
   rides the south rim, video boards stand at both ends, the Court of
   Honor plaza and the Olympic Gateway sit out front.
   ================================================================== */
var COL_FLAMES=[], COL_MESH=null;
(function(){
  var M=new Mesher();
  var cx=COL.cx, cz=COL.cz, N=COL.seg, FLD=COL.fld, XP=COL.xp;
  var RUN=1.45, RISE=0.60, ROW0=FLD+0.86, NR=47, NE=18, FX=cx+COL.ixo;
  var C_STONE=0xE0D5BF, C_STONE2=0xCFC3AA, C_STONE_D=0xB3A68D,
      C_SEAT=0xA8272B, C_SEAT2=0x9A2328, C_CONC=0xA9A195, C_CONC2=0x978F83,
      C_DARK=0x24211F, C_BRONZE=0x5B4632, C_GLASS=0x2F3E4A, C_WHITE=0xEDEBE4,
      C_PAD=0x1E2622, C_GOLDP=0xE5C23A;
  var TAU=6.283185307;

  /* a quad whose face is turned toward (nx,ny,nz), whatever order the corners came in */
  function qf(A,B,C,D,col,sh,nx,ny,nz){
    var c=rgb(col,sh===undefined?1:sh);
    var ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2], vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
    var fx=uy*vz-uz*vy, fy=uz*vx-ux*vz, fz=ux*vy-uy*vx;
    if(fx*nx+fy*ny+fz*nz>=0) M.quad(A,B,C,D,c,c,c,c); else M.quad(A,D,C,B,c,c,c,c);
  }
  function norm(r){ if(ringArea(r)<0) r.reverse(); return r; }
  function lerp2(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]; }

  /* ------------------------------------------------ the bowl frame */
  var T0=[], IN=[], OR=[], OC=[], U=[];
  for(var i=0;i<=N;i++){
    var t=i/N*TAU; T0.push(t);
    var a=colInner(t), o=colOuterRaw(t), oc=colOuter(t);
    IN.push(a); OR.push(o); OC.push(oc);
    var dx=o[0]-a[0], dz=o[1]-a[1], L=Math.hypot(dx,dz);
    U.push([dx/L,dz/L,L]);
  }
  function P(i,r){ return [IN[i][0]+U[i][0]*r, IN[i][1]+U[i][1]*r]; }
  /* the peristyle end rows are laid out deeper, so they run most of the way to the arcade */
  var SC=[];
  for(i=0;i<=N;i++){
    var oo=OR[i], ee=0;
    if(oo[0]>cx){ var ad=Math.abs(oo[1]-cz); ee=ad<=64?1:(ad>=100?0:1-(ad-64)/36); ee=ee*ee*(3-2*ee); }
    SC.push(1+0.55*ee);
  }
  function R(i,k){ return k*RUN*SC[i]; }
  function PK(i,k,extra){ return P(i,R(i,k)+(extra||0)); }
  /* how many rows each segment carries: the side stands step down toward the peristyle */
  var NROW=[];
  for(i=0;i<N;i++){
    var tm=(T0[i]+T0[i+1])*0.5, om=colOuterRaw(tm), n=NR;
    if(om[0]>cx){
      var adz=Math.abs(om[1]-cz);
      if(adz<=64) n=NE;
      else if(adz<100) n=Math.round(NE+(NR-NE)*(adz-64)/36);
    }
    NROW.push(n);
  }
  function rowY(k){ return ROW0+k*RISE; }
  function topY(i){ return rowY(NROW[i]-1); }
  var VOM0=18, VOM1=21;
  function isVom(i){ return NROW[i]===NR && (i%14)===6; }
  function isAisle(i){ return (i%7)===3; }

  var cSeatF=[C_SEAT,C_SEAT2];
  for(i=0;i<N;i++){
    var j=i+1, n=NROW[i], vom=isVom(i), ai=isAisle(i);
    /* outward-ish normal of the rows' risers: pointing back to the field */
    var mx=(IN[i][0]+IN[j][0])*0.5-cx, mz=(IN[i][1]+IN[j][1])*0.5-cz, mL=Math.hypot(mx,mz)||1;
    var fnx=-mx/mL, fnz=-mz/mL;
    for(var k=0;k<n;k++){
      if(vom && k>=VOM0 && k<=VOM1) continue;
      var y=rowY(k), yb=k===0?FLD:rowY(k-1);
      var a0=PK(i,k), b0=PK(j,k), a1=PK(i,k+1), b1=PK(j,k+1);
      /* riser */
      qf([a0[0],yb,a0[1]],[a0[0],y,a0[1]],[b0[0],y,b0[1]],[b0[0],yb,b0[1]],
         k===0?C_PAD:C_CONC2, 0.92, fnx,0,fnz);
      /* tread */
      qf([a0[0],y,a0[1]],[b0[0],y,b0[1]],[b1[0],y,b1[1]],[a1[0],y,a1[1]], C_CONC, (k%2?0.97:1), 0,1,0);
      /* the seats: backs toward the rim, a gap for the aisle stair */
      var sh=0.50, sc=cSeatF[(k+i)%2];
      var sA0=PK(i,k,0.30), sB0=PK(j,k,0.30), sA1=PK(i,k+1,-0.06), sB1=PK(j,k+1,-0.06);
      var spans=ai?[[0,0.42],[0.58,1]]:[[0,1]];
      for(var q=0;q<spans.length;q++){
        var s0=spans[q][0], s1=spans[q][1];
        var A0=lerp2(sA0,sB0,s0), B0=lerp2(sA0,sB0,s1),
            A1=lerp2(sA1,sB1,s0), B1=lerp2(sA1,sB1,s1);
        qf([A0[0],y,A0[1]],[A0[0],y+sh,A0[1]],[B0[0],y+sh,B0[1]],[B0[0],y,B0[1]], sc,0.86, fnx,0,fnz);
        qf([A0[0],y+sh,A0[1]],[B0[0],y+sh,B0[1]],[B1[0],y+sh,B1[1]],[A1[0],y+sh,A1[1]], sc,1, 0,1,0);
      }
      if(ai){ /* the half step up the middle of each aisle */
        var H0=lerp2(a0,b0,0.44), H1=lerp2(a0,b0,0.56),
            G0=lerp2(PK(i,k+0.5),PK(j,k+0.5),0.44), G1=lerp2(PK(i,k+0.5),PK(j,k+0.5),0.56);
        qf([H0[0],y+RISE*0.5,H0[1]],[H1[0],y+RISE*0.5,H1[1]],[G1[0],y+RISE*0.5,G1[1]],[G0[0],y+RISE*0.5,G0[1]],C_CONC,1.04,0,1,0);
        qf([H0[0],y,H0[1]],[H0[0],y+RISE*0.5,H0[1]],[H1[0],y+RISE*0.5,H1[1]],[H1[0],y,H1[1]],C_CONC2,0.9,fnx,0,fnz);
      }
    }
    if(vom){
      /* a tunnel mouth: floor, dark back wall, concrete cheeks */
      var yf=rowY(VOM0-1), yt=rowY(VOM1);
      var f0=PK(i,VOM0), f1=PK(j,VOM0), g0=PK(i,VOM1+1), g1=PK(j,VOM1+1);
      qf([f0[0],yf,f0[1]],[f1[0],yf,f1[1]],[g1[0],yf,g1[1]],[g0[0],yf,g0[1]],C_CONC2,0.85,0,1,0);
      qf([g0[0],yf,g0[1]],[g0[0],yt,g0[1]],[g1[0],yt,g1[1]],[g1[0],yf,g1[1]],C_DARK,1,fnx,0,fnz);
      for(var sd=0;sd<2;sd++){
        var si=sd?j:i;
        for(var kk=VOM0;kk<=VOM1;kk++)
          segBox(M,PK(si,kk),PK(si,kk+1),yf,rowY(kk)+0.75,0.3,0xC9C1B2,0.8);
      }
      addCollider(bandRing(i,j,VOM0,VOM1+1),yf);
    }
    /* the concourse behind the top row, out to the outer wall */
    var ht=topY(i), c0=PK(i,n), c1=PK(j,n);
    qf([c0[0],ht,c0[1]],[c1[0],ht,c1[1]],[OC[j][0],ht,OC[j][1]],[OC[i][0],ht,OC[i][1]],
       ht>1?C_CONC:0xC9C1AE, 1, 0,1,0);
    /* the outer wall and its parapet, where the bowl stands above the street */
    if(ht>0.5){
      segBox(M,OC[i],OC[j],0,ht+1.15,0.7,C_STONE,0.72);
      segBox(M,OC[i],OC[j],ht+1.15,ht+1.35,0.95,C_STONE2,0.9);
      segBox(M,OC[i],OC[j],0,1.1,1.1,C_STONE_D,0.7);
      segBox(M,OC[i],OC[j],ht-2.2,ht-1.5,0.95,C_STONE2,0.8);
      addCollider(segRing(OC[i],OC[j],0.5),ht+1.15);
    }
    /* steps down between segments that carry different numbers of rows */
    var nn=NROW[(i+1)%N];
    if(nn!==n && j<=N){
      var hi=Math.max(n,nn), lo=Math.min(n,nn);
      var ylo=rowY(lo-1), sgn=(n>nn)?1:-1;
      var tnx=-U[j][1]*sgn, tnz=U[j][0]*sgn;
      for(k=lo;k<hi;k++){
        var e0=PK(j,k), e1=PK(j,k+1);
        qf([e0[0],ylo,e0[1]],[e0[0],rowY(k),e0[1]],[e1[0],rowY(k),e1[1]],[e1[0],ylo,e1[1]],C_STONE2,0.78,tnx,0,tnz);
      }
      var e2=PK(j,hi);
      qf([e2[0],ylo,e2[1]],[e2[0],rowY(hi-1),e2[1]],[OC[j][0],rowY(hi-1),OC[j][1]],[OC[j][0],ylo,OC[j][1]],C_STONE,0.8,tnx,0,tnz);
    }
  }
  function bandRing(i,j,r0,r1){
    var r=[]; for(var q=i;q<=j;q++) r.push(PK(q%(N+1),r0));
    for(q=j;q>=i;q--) r.push(PK(q%(N+1),r1));
    if(ringArea(r)<0) r.reverse(); return r;
  }
  function segRing(a,b,w){
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1, nx=-dz/L*w, nz=dx/L*w;
    var r=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
    if(ringArea(r)<0) r.reverse(); return r;
  }
  /* colliders: each row in runs of a few segments, so you can climb the aisles */
  for(var k2=0;k2<NR;k2++){
    var s0i=-1;
    for(i=0;i<=N;i++){
      var ok=i<N && k2<NROW[i] && !(isVom(i)&&k2>=VOM0&&k2<=VOM1);
      if(ok && s0i<0) s0i=i;
      if(s0i>=0 && (!ok || i-s0i>=5)){
        addCollider(bandRing(s0i,i,k2,k2+1),rowY(k2));
        s0i=ok?i:-1;
      }
    }
  }
  for(i=0;i<N;i++){
    var cr=[PK(i,NROW[i]),PK(i+1,NROW[i]),OC[i+1],OC[i]];
    if(ringArea(cr)<0) cr.reverse();
    addCollider(cr,topY(i));
  }

  /* pilasters and tunnel portals on the outside of the bowl */
  for(i=0;i<N;i+=3){
    if(topY(i)<3) continue;
    var o=OC[i], on=OC[i+1], dx2=on[0]-o[0], dz2=on[1]-o[1], L2=Math.hypot(dx2,dz2)||1;
    dx2/=L2; dz2/=L2;
    var onx=dz2, onz=-dx2; /* outward */
    var cxm=(o[0]+on[0])*0.5-cx, czm=(o[1]+on[1])*0.5-cz;
    if(onx*cxm+onz*czm<0){ onx=-onx; onz=-onz; dx2=-dx2; dz2=-dz2; }
    oriBox(M,o[0]+onx*0.55,o[1]+onz*0.55,dx2,dz2,0.55,0.38,0,topY(i)+0.6,C_STONE2,0.74);
    if(i%9===0 && topY(i)>10){
      var pm=[(o[0]+on[0])*0.5+onx*0.36,(o[1]+on[1])*0.5+onz*0.36];
      archFace(M,pm[0],pm[1],dx2,dz2,onx*0.01,onz*0.01,0,4.4,3.3,2.2,C_DARK,1);
      archFace(M,pm[0],pm[1],dx2,dz2,onx*0.05,onz*0.05,0,5.2,3.3,2.6,C_STONE2,0.75);
      archFace(M,pm[0],pm[1],dx2,dz2,onx*0.09,onz*0.09,0,4.4,3.3,2.2,C_DARK,1);
    }
  }

  /* ------------------------------------------------ the field */
  flat(M,norm((function(){ var r=[]; for(var q=0;q<96;q++) r.push(colInner(q/96*TAU)); return r; })()),
       FLD+0.01,0x3E7F37,1);
  (function(){
    var cv=document.createElement('canvas'); cv.width=2048; cv.height=1024;
    var g=cv.getContext('2d'), S=2048/120;
    function X(m){ return m*S; }
    for(var s=0;s<24;s++){ g.fillStyle=s%2?'#3F8A39':'#4A9842'; g.fillRect(X(s*5),0,X(5)+1,1024); }
    var fx0=(120-109.73)/2, fz0=(60-48.77)/2, yd=0.9144;
    /* end zones */
    g.fillStyle='#8E1B24';
    g.fillRect(X(fx0),X(fz0),X(10*yd),X(48.77)); g.fillRect(X(fx0+110*yd),X(fz0),X(10*yd),X(48.77));
    g.save(); g.fillStyle='#F2C94C'; g.strokeStyle='#FFFFFF'; g.lineWidth=6;
    g.font='900 150px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle';
    g.translate(X(fx0+5*yd),512); g.rotate(-Math.PI/2); g.strokeText('TROJANS',0,0); g.fillText('TROJANS',0,0); g.restore();
    g.save(); g.fillStyle='#F2C94C'; g.strokeStyle='#FFFFFF'; g.lineWidth=6;
    g.font='900 150px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle';
    g.translate(X(fx0+115*yd),512); g.rotate(Math.PI/2); g.strokeText('TROJANS',0,0); g.fillText('TROJANS',0,0); g.restore();
    /* lines */
    g.strokeStyle='#F4F4EE'; g.fillStyle='#F4F4EE';
    g.lineWidth=7; g.strokeRect(X(fx0),X(fz0),X(109.73),X(48.77));
    for(var yl=10;yl<=110;yl+=5){
      var xx=X(fx0+yl*yd); g.lineWidth=yl%10===0?5:4;
      g.beginPath(); g.moveTo(xx,X(fz0)); g.lineTo(xx,X(fz0+48.77)); g.stroke();
    }
    for(yl=11;yl<110;yl++){ if(yl%5===0) continue;
      var xh=X(fx0+yl*yd);
      [fz0+0.3,fz0+20.9,fz0+27.3,fz0+48.1].forEach(function(z0){ g.fillRect(xh-1.5,X(z0),3,X(0.6)); });
    }
    g.font='700 64px Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    for(yl=20;yl<=100;yl+=10){
      var num=yl<=60?yl-10:110-yl, xn=X(fx0+yl*yd);
      g.save(); g.translate(xn,X(fz0+8)); g.rotate(Math.PI); g.fillText(String(num).split('').join(' '),0,0); g.restore();
      g.fillText(String(num).split('').join(' '),xn,X(fz0+48.77-8));
    }
    /* the interlocking SC at midfield */
    g.save(); g.translate(1024,512); g.rotate(Math.PI/2);
    g.font='900 300px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle';
    g.lineWidth=16; g.strokeStyle='#F2C94C'; g.fillStyle='#8E1B24';
    g.strokeText('C',55,10); g.fillText('C',55,10); g.strokeText('S',-55,10); g.fillText('S',-55,10);
    g.restore();
    var tex=new T.CanvasTexture(cv); tex.anisotropy=4;
    var fm=new T.Mesh(new T.PlaneGeometry(120,60),new T.MeshLambertMaterial({map:tex,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    fm.rotation.x=-Math.PI/2; fm.position.set(FX,FLD+0.06,cz); fm.receiveShadow=true;
    scene.add(fm);
  })();
  /* yellow goalposts */
  for(var gs=-1;gs<=1;gs+=2){
    var gx=FX+gs*(54.86+2.2), gy=FLD;
    var GC=0xF1CF2E;
    segBox(M,[gx,cz],[gx,cz],gy,gy+3.05,0.32,GC,0.85);
    segBox(M,[gx,cz],[gx-gs*2.2,cz],gy+2.85,gy+3.15,0.26,GC,0.85);
    segBox(M,[gx-gs*2.2,cz-2.82],[gx-gs*2.2,cz+2.82],gy+3.0,gy+3.28,0.24,GC,0.9);
    for(var up=-1;up<=1;up+=2)
      segBox(M,[gx-gs*2.2,cz+up*2.82],[gx-gs*2.2,cz+up*2.82],gy+3.0,gy+13.0,0.2,GC,0.9);
    postAt(M,gx,cz,gy,gy+2.0,0.42,0x9E1B24,0.8);
  }
  /* team benches along each sideline */
  for(var sb=-1;sb<=1;sb+=2){
    oriBox(M,FX,cz+sb*29.5,1,0,22,0.7,FLD,FLD+0.9,0x6E1A20,0.8);
  }

  /* ------------------------------------------------ the peristyle */
  var AD=7.0;                      /* depth of the arcade */
  var BAY=8.5, PIER=2.3, SPR=9.0, ATT=16.5;
  function archSpan(z0,z1,xf,xb,ys,rise,ytop,col,shade){
    /* a vault running through the wall between z0 and z1, with the solid spandrel above */
    var ns=10, zc=(z0+z1)*0.5, hw=(z1-z0)*0.5;
    function yA(z){ var u=(z-zc)/hw; return ys+rise*Math.sqrt(Math.max(0,1-u*u)); }
    for(var s=0;s<ns;s++){
      var za=z0+(z1-z0)*s/ns, zb=z0+(z1-z0)*(s+1)/ns, ya=yA(za), yb=yA(zb);
      qf([xf,ya,za],[xf,ytop,za],[xf,ytop,zb],[xf,yb,zb],col,shade,1,0,0);
      qf([xb,ya,za],[xb,ytop,za],[xb,ytop,zb],[xb,yb,zb],col,shade,-1,0,0);
      qf([xf,ya,za],[xb,ya,za],[xb,yb,zb],[xf,yb,zb],col,shade*0.62,0,-1,0);
    }
  }
  function pier(x0,x1,z0,z1,y0,y1,col,shade){
    prism(M,norm([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]),y0,y1,col,col,shade);
    addCollider(norm([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]),y1);
  }
  var XF=XP, XB=XP-AD, PY=11.0;     /* pylon half width */
  for(var side=-1;side<=1;side+=2){
    var zs=cz+side*PY, ze=cz+side*64;
    var nb=Math.round(Math.abs(ze-zs)/BAY), bw=Math.abs(ze-zs)/nb;
    function lft(b){ return b===0?0:(b===nb?1.8:1.15); }
    function rgt(b){ return b===0?1.1:(b===nb?0:1.15); }
    for(var b=0;b<=nb;b++){
      var zp=zs+side*b*bw;
      var pa=zp-side*lft(b), pb=zp+side*rgt(b);
      pier(XB,XF,Math.min(pa,pb),Math.max(pa,pb),0,ATT,C_STONE,0.74);
      if(b>0&&b<nb) qf([XF+0.04,2.2,zp-0.55],[XF+0.04,3.9,zp-0.55],[XF+0.04,3.9,zp+0.55],[XF+0.04,2.2,zp+0.55],C_BRONZE,0.9,1,0,0);
      if(b<nb){
        var o0=zp+side*rgt(b), o1=zp+side*bw-side*lft(b+1);
        var lo2=Math.min(o0,o1), hi2=Math.max(o0,o1);
        archSpan(lo2,hi2,XF,XB,SPR,(hi2-lo2)*0.5,ATT,C_STONE,0.9);
        /* keystone and impost blocks */
        oriBox(M,XF+0.12,(lo2+hi2)*0.5,0,1,0.45,0.12,SPR+(hi2-lo2)*0.5-0.2,SPR+(hi2-lo2)*0.5+0.9,C_STONE2,0.85);
        oriBox(M,XF+0.08,lo2+0.1,0,1,0.3,0.10,SPR-0.35,SPR,C_STONE2,0.85);
        oriBox(M,XF+0.08,hi2-0.1,0,1,0.3,0.10,SPR-0.35,SPR,C_STONE2,0.85);
      }
    }
    /* the attic, cornice and roof of this wing */
    var zl=Math.min(zs,ze), zh=Math.max(zs,ze);
    qf([XB,ATT,zl],[XF,ATT,zl],[XF,ATT,zh],[XB,ATT,zh],C_STONE2,1,0,1,0);
    oriBox(M,(XF+XB)*0.5,(zl+zh)*0.5,0,1,(zh-zl)*0.5,AD*0.5+0.45,ATT-0.9,ATT-0.5,C_STONE2,0.85);
    oriBox(M,(XF+XB)*0.5,(zl+zh)*0.5,0,1,(zh-zl)*0.5,AD*0.5+0.2,ATT,ATT+1.1,C_STONE,0.82);
    /* flagpoles along the top */
    for(var fp=1;fp<=3;fp++){
      var fz=zs+side*(ze-zs)*side*fp/4*side;
      fz=zs+(ze-zs)*fp/4;
      postAt(M,XF-0.8,fz,ATT+1.1,ATT+9.5,0.07,0xD9D9D2,0.9);
      var FCOL=[0x8E1B24,0xE9B72E,0x8E1B24][fp-1];
      qf([XF-0.8,ATT+7.6,fz],[XF-0.8,ATT+9.3,fz],[XF-0.8,ATT+9.3,fz+side*2.6],[XF-0.8,ATT+7.6,fz+side*2.6],FCOL,1,1,0,0);
      qf([XF-0.8,ATT+7.6,fz],[XF-0.8,ATT+9.3,fz],[XF-0.8,ATT+9.3,fz+side*2.6],[XF-0.8,ATT+7.6,fz+side*2.6],FCOL,0.8,-1,0,0);
    }
    /* ends of the arcade wrap round into the stands */
    oriBox(M,XB+AD*0.5,ze+side*2.2,1,0,AD*0.5+0.5,2.4,0,ATT+1.6,C_STONE,0.72);
  }
  /* the pylon and the great arch */
  var PX0=XP-12.5, PX1=XP+2.2, GA=5.6, GS=13.4, PT=27.6;
  for(side=-1;side<=1;side+=2){
    var zi=cz+side*GA, zo=cz+side*PY;
    pier(PX0,PX1,Math.min(zi,zo),Math.max(zi,zo),0,PT,C_STONE,0.76);
    /* the pilasters either side of the arch, running up to the shoulders */
    oriBox(M,PX1+0.35,cz+side*(GA+1.5),1,0,0.35,1.5,0,GS+GA+0.4,C_STONE2,0.86);
    oriBox(M,PX1+0.2,cz+side*(PY-0.9),1,0,0.2,0.9,0,PT-1.2,C_STONE2,0.82);
    /* bronze plaque panels on the pylon's lower face */
    qf([PX1+0.72,2.4,cz+side*(GA+0.6)],[PX1+0.72,5.0,cz+side*(GA+0.6)],[PX1+0.72,5.0,cz+side*(GA+2.4)],[PX1+0.72,2.4,cz+side*(GA+2.4)],C_BRONZE,0.9,1,0,0);
  }
  archSpan(cz-GA,cz+GA,PX1,PX0,GS,GA,PT,C_STONE,0.92);
  /* the mosaic in the soffit of the great arch */
  (function(){
    var ns=12;
    for(var s=0;s<ns;s++){
      var a0=Math.PI*s/ns, a1=Math.PI*(s+1)/ns;
      var z0=cz-Math.cos(a0)*(GA-0.02), z1=cz-Math.cos(a1)*(GA-0.02),
          y0=GS+Math.sin(a0)*(GA-0.02), y1=GS+Math.sin(a1)*(GA-0.02);
      qf([PX1-0.3,y0-0.01,z0],[PX1-3.2,y0-0.01,z0],[PX1-3.2,y1-0.01,z1],[PX1-0.3,y1-0.01,z1],(s%2?0x3C6E9A:0x4A7FAE),1,0,-1,0);
      qf([PX1-3.2,y0-0.01,z0],[PX1-3.5,y0-0.01,z0],[PX1-3.5,y1-0.01,z1],[PX1-3.2,y1-0.01,z1],0xD7B24A,1,0,-1,0);
    }
  })();
  /* stepped shoulders and the torch */
  oriBox(M,(PX0+PX1)*0.5,cz,1,0,(PX1-PX0)*0.5-0.6,PY-1.8,PT,PT+1.7,C_STONE,0.8);
  oriBox(M,(PX0+PX1)*0.5,cz,1,0,(PX1-PX0)*0.5-1.4,PY-3.4,PT+1.7,PT+3.3,C_STONE,0.84);
  oriBox(M,(PX0+PX1)*0.5-0.6,cz,1,0,2.8,2.8,PT+3.3,PT+4.5,C_STONE2,0.86);
  (function(){
    var tx=(PX0+PX1)*0.5-0.6, y0=PT+4.5, y1=y0+11.5, NF=20;
    for(var s=0;s<NF;s++){
      var a0=s/NF*TAU, a1=(s+1)/NF*TAU;
      var r0=(s%2?1.62:1.78), r1=((s+1)%2?1.62:1.78);
      var r0t=r0*0.74, r1t=r1*0.74;
      var A=[tx+Math.cos(a0)*r0,y0,cz+Math.sin(a0)*r0], B=[tx+Math.cos(a1)*r1,y0,cz+Math.sin(a1)*r1],
          C=[tx+Math.cos(a1)*r1t,y1,cz+Math.sin(a1)*r1t], D=[tx+Math.cos(a0)*r0t,y1,cz+Math.sin(a0)*r0t];
      var am=(a0+a1)*0.5;
      qf(A,B,C,D,0xF1ECE0,0.9+0.1*(s%2),Math.cos(am),0.05,Math.sin(am));
    }
    postAt(M,tx,cz,y1,y1+0.5,1.45,0x2A2A2A,0.8);
    /* the cauldron */
    var NC=16, yb2=y1+0.5, yt2=y1+2.3;
    for(s=0;s<NC;s++){
      var b0=s/NC*TAU, b1=(s+1)/NC*TAU, bm=(b0+b1)*0.5;
      qf([tx+Math.cos(b0)*1.2,yb2,cz+Math.sin(b0)*1.2],[tx+Math.cos(b1)*1.2,yb2,cz+Math.sin(b1)*1.2],
         [tx+Math.cos(b1)*2.5,yt2,cz+Math.sin(b1)*2.5],[tx+Math.cos(b0)*2.5,yt2,cz+Math.sin(b0)*2.5],
         0x2B2B2D,0.9,Math.cos(bm),-0.4,Math.sin(bm));
      qf([tx+Math.cos(b0)*2.3,yt2-0.2,cz+Math.sin(b0)*2.3],[tx+Math.cos(b1)*2.3,yt2-0.2,cz+Math.sin(b1)*2.3],
         [tx+Math.cos(b1)*2.3,yt2-0.2,cz+Math.sin(b1)*2.3],[tx,yt2-0.2,cz],0x1A1A1A,1,0,1,0);
    }
    /* flame */
    var flameM=new T.MeshBasicMaterial({color:0xFFA227,transparent:true,opacity:0.88,depthWrite:false});
    var coreM=new T.MeshBasicMaterial({color:0xFFE07A,transparent:true,opacity:0.92,depthWrite:false});
    for(var f=0;f<3;f++){
      var fg=new T.ConeGeometry(f===0?1.9:1.1,f===0?4.2:3.0,7,1,true);
      fg.translate(0,f===0?2.1:1.5,0);
      var fl=new T.Mesh(fg,f===0?flameM:coreM);
      fl.position.set(tx+(f===1?0.6:(f===2?-0.5:0)),yt2-0.3,cz+(f===2?0.5:(f===1?-0.3:0)));
      fl.userData.ph=f*1.7; fl.frustumCulled=false; scene.add(fl); COL_FLAMES.push(fl);
    }
  })();
  /* LOS ANGELES MEMORIAL COLISEUM, with the rings beneath */
  (function(){
    var cv=document.createElement('canvas'); cv.width=1024; cv.height=512;
    var g=cv.getContext('2d');
    g.clearRect(0,0,1024,512);
    g.font='700 92px Georgia,"Times New Roman",serif'; g.textAlign='center'; g.textBaseline='middle';
    var lines=['LOS ANGELES','MEMORIAL','COLISEUM'];
    for(var l=0;l<3;l++){
      var sp=lines[l].split('').join(String.fromCharCode(8202));
      g.fillStyle='rgba(60,50,40,0.35)'; g.fillText(sp,516,70+l*104+4,960);
      g.fillStyle='#5E5A55'; g.fillText(sp,512,70+l*104,960);
    }
    var RC=['#1E6FC0','#E8B81E','#1C1C1C','#239A45','#D5283A'];
    var rx=[392,512,632,452,572], ry=[400,400,400,448,448];
    g.lineWidth=13;
    for(var q=0;q<5;q++){ g.strokeStyle=RC[q]; g.beginPath(); g.arc(rx[q],ry[q],52,0,TAU); g.stroke(); }
    var tex=new T.CanvasTexture(cv); tex.anisotropy=4;
    var m=new T.Mesh(new T.PlaneGeometry(15.2,7.6),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,
          polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
    m.position.set(PX1+0.08,GS+GA+4.3,cz); m.rotation.y=Math.PI/2; m.renderOrder=3; scene.add(m);
    /* the rings again, facing the field */
    var cv2=document.createElement('canvas'); cv2.width=512; cv2.height=256;
    var g2=cv2.getContext('2d'); g2.lineWidth=15;
    var rx2=[136,256,376,196,316], ry2=[100,100,100,150,150];
    for(q=0;q<5;q++){ g2.strokeStyle=RC[q]; g2.beginPath(); g2.arc(rx2[q],ry2[q],54,0,TAU); g2.stroke(); }
    var m2=new T.Mesh(new T.PlaneGeometry(10,5),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv2),transparent:true,depthWrite:false,
          polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
    m2.position.set(PX0-0.08,GS+GA+2.8,cz); m2.rotation.y=-Math.PI/2; m2.renderOrder=3; scene.add(m2);
  })();

  /* ------------------------------------------------ the press tower on the south rim */
  (function(){
    var x0=cx-62, x1=cx+50, zf=cz+93, zb=cz+110.5, y0=rowY(NR-1);
    var lv=[[y0,y0+4.4,0],[y0+4.4,y0+8.8,0],[y0+8.8,y0+12.6,2.2]];
    for(var l=0;l<lv.length;l++){
      var a=lv[l][0], b=lv[l][1], sb=lv[l][2];
      var r=norm([[x0,zf+sb],[x1,zf+sb],[x1,zb],[x0,zb]]);
      prism(M,r,a,a+0.5,C_WHITE,C_WHITE,0.8);                 /* slab edge */
      prism(M,norm([[x0+0.4,zf+sb+0.6],[x1-0.4,zf+sb+0.6],[x1-0.4,zb-0.4],[x0+0.4,zb-0.4]]),a+0.5,b,C_GLASS,C_WHITE,0.9);
      /* mullions */
      for(var mxx=x0+3;mxx<x1;mxx+=3.2){
        segBox(M,[mxx,zf+sb+0.5],[mxx,zf+sb+0.5],a+0.5,b,0.16,0xD8D8D2,0.8);
        segBox(M,[mxx,zb-0.3],[mxx,zb-0.3],a+0.5,b,0.16,0xD8D8D2,0.8);
      }
    }
    prism(M,norm([[x0-1,zf-2.5],[x1+1,zf-2.5],[x1+1,zb+0.6],[x0-1,zb+0.6]]),y0+12.6,y0+13.5,C_WHITE,C_WHITE,0.85);
    /* end walls */
    oriBox(M,x0+0.6,(zf+zb)*0.5,1,0,0.6,(zb-zf)*0.5,y0,y0+12.6,C_WHITE,0.8);
    oriBox(M,x1-0.6,(zf+zb)*0.5,1,0,0.6,(zb-zf)*0.5,y0,y0+12.6,C_WHITE,0.8);
    /* columns carrying the front edge down onto the stands */
    for(var cxx=x0+6;cxx<x1;cxx+=12){
      var rr1=(zf-(cz+38))/RUN, ky=rowY(Math.max(0,Math.min(NR-1,Math.floor(rr1))));
      postAt(M,cxx,zf+0.4,ky,y0,0.35,C_WHITE,0.8);
    }
    /* light banks on the roof */
    for(var lx=x0+14;lx<x1;lx+=28){
      postAt(M,lx,zb-3,y0+13.5,y0+19,0.25,0xB9B9B4,0.7);
      oriBox(M,lx,zb-3.4,1,0,4.2,0.5,y0+19,y0+22,0x3A3C40,0.7);
      for(var lb=-3;lb<=3;lb++) qf([lx+lb*1.15-0.5,y0+19.3,zb-3.95],[lx+lb*1.15-0.5,y0+21.7,zb-3.95],[lx+lb*1.15+0.5,y0+21.7,zb-3.95],[lx+lb*1.15+0.5,y0+19.3,zb-3.95],0xFBF6E2,1.1,0,0,-1);
    }
  })();
  /* light standards along the north rim */
  for(var ln=-1;ln<=1;ln++){
    var lxx=cx+ln*58, lzz=cz-110+Math.abs(ln)*2.5, ly=rowY(NR-1);
    postAt(M,lxx,lzz,ly,ly+16,0.3,0xB9B9B4,0.7);
    oriBox(M,lxx,lzz+0.4,1,0,4.6,0.5,ly+16,ly+19.2,0x3A3C40,0.7);
    for(var lb2=-3;lb2<=3;lb2++) qf([lxx+lb2*1.25-0.55,ly+16.3,lzz+0.95],[lxx+lb2*1.25-0.55,ly+18.9,lzz+0.95],[lxx+lb2*1.25+0.55,ly+18.9,lzz+0.95],[lxx+lb2*1.25+0.55,ly+16.3,lzz+0.95],0xFBF6E2,1.1,0,0,1);
  }

  /* ------------------------------------------------ the video boards */
  function boardTex(wide){
    var cv=document.createElement('canvas'); cv.width=1024; cv.height=wide?320:420;
    var g=cv.getContext('2d'), W=cv.width, H=cv.height;
    var gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#7A1520'); gr.addColorStop(1,'#3E0A10');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='#F2C94C'; g.fillRect(0,H*0.80,W,H*0.20);
    g.fillStyle='#7A1520'; g.font='800 '+(H*0.13|0)+'px Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('FIGHT ON!    USC  •  TROJANS  •  FIGHT ON!',W/2,H*0.90);
    g.font='900 '+(H*0.46|0)+'px Georgia,serif'; g.fillStyle='#F2C94C';
    g.strokeStyle='#FFFFFF'; g.lineWidth=5;
    g.strokeText('TROJANS',W/2,H*0.40); g.fillText('TROJANS',W/2,H*0.40);
    g.fillStyle='#111'; g.fillRect(0,0,W,6); g.fillRect(0,H-6,W,6); g.fillRect(0,0,6,H); g.fillRect(W-6,0,6,H);
    var t=new T.CanvasTexture(cv); t.anisotropy=4; return t;
  }
  var texA=boardTex(false), texB=boardTex(true);
  function board(x,z,w,h,y0,tex){
    var dx=cx-x, dz=cz-z, L=Math.hypot(dx,dz); dx/=L; dz/=L;
    var tx=-dz, tz=dx;
    oriBox(M,x-dx*0.6,z-dz*0.6,tx,tz,w*0.5+0.5,0.6,y0-0.5,y0+h+0.5,0x1C1D20,0.7);
    for(var s=-1;s<=1;s+=2){ postAt(M,x+tx*s*w*0.3-dx*1.2,z+tz*s*w*0.3-dz*1.2,y0-6,y0,0.45,0x4A4C50,0.7); }
    var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));
    m.position.set(x+dx*0.02,y0+h*0.5,z+dz*0.02); m.rotation.y=Math.atan2(dx,dz); scene.add(m);
  }
  var ty=rowY(NR-1);
  board(cx+100,cz-82,22,9,ty+4,texA);
  board(cx+100,cz+82,22,9,ty+4,texA);
  board(cx-152,cz,36,11.5,ty+3,texB);

  /* ------------------------------------------------ the Court of Honor */
  (function(){
    var G=new Mesher();
    var px0=XP+2.2, px1=XP+36, pz0=cz-46, pz1=cz+46;
    var pc=rgb(0xC4A78C,1);
    G.quad([px0,0.05,pz0],[px0,0.05,pz1],[px1,0.05,pz1],[px1,0.05,pz0],pc,pc,pc,pc);
    /* paver joints */
    for(var jx=px0+3;jx<px1;jx+=3) ribbon(G,[[jx,pz0],[jx,pz1]],0.08,0.055,0xAE917A,1);
    for(var jz=pz0+3;jz<pz1;jz+=3) ribbon(G,[[px0,jz],[px1,jz]],0.08,0.055,0xAE917A,1);
    ribbon(G,[[px0,pz0],[px1,pz0],[px1,pz1],[px0,pz1]],1.0,0.058,0x8F7A68,1);
    var gm=new T.Mesh(G.geom(),matGround); gm.receiveShadow=true; scene.add(gm);
    /* the centennial "100" set into the paving */
    var cv=document.createElement('canvas'); cv.width=512; cv.height=256;
    var g=cv.getContext('2d'); g.fillStyle='#8E9296'; g.fillRect(0,0,512,256);
    g.fillStyle='#B9B4AA'; g.fillRect(8,8,496,240);
    g.font='900 210px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle';
    g.lineWidth=10; g.strokeStyle='#3C4044'; g.strokeText('100',256,134);
    g.fillStyle='#6E7276'; g.fillText('100',256,134);
    var m=new T.Mesh(new T.PlaneGeometry(14,7),new T.MeshLambertMaterial({map:new T.CanvasTexture(cv),
          polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
    m.rotation.x=-Math.PI/2; m.rotation.z=Math.PI/2; m.position.set(XP+22,0.07,cz+22); scene.add(m);
    /* the two lamp columns in front of the great arch */
    for(var s=-1;s<=1;s+=2){
      var lx=XP+9, lz=cz+s*9.5;
      var cyl=new T.Mesh(new T.CylinderGeometry(0.62,0.66,4.6,12),new T.MeshLambertMaterial({color:0xB5AE9F}));
      cyl.position.set(lx,2.3,lz); scene.add(cyl);
      var cap=new T.Mesh(new T.CylinderGeometry(0.72,0.62,0.3,12),new T.MeshLambertMaterial({color:0x8E877A}));
      cap.position.set(lx,4.75,lz); scene.add(cap);
      var gl=new T.Mesh(new T.SphereGeometry(0.46,14,10),new T.MeshLambertMaterial({color:0xF3EFE4,emissive:0x2a2618}));
      gl.position.set(lx,5.3,lz); scene.add(gl);
      addCollider([[lx-0.7,lz-0.7],[lx+0.7,lz-0.7],[lx+0.7,lz+0.7],[lx-0.7,lz+0.7]],5.6);
    }
    /* chain stanchions edging the lawn */
    for(var sz=-1;sz<=1;sz+=2){
      for(var q=0;q<9;q++){
        var sx=XP+8+q*3.4, szz=cz+sz*40;
        postAt(M,sx,szz,0,1.0,0.07,0x8A8C8E,0.8);
        if(q<8) segBox(M,[sx,szz],[sx+3.4,szz],0.82,0.86,0.05,0x8A8C8E,0.8);
      }
    }
  })();

  /* ------------------------------------------------ the Olympic Gateway */
  (function(){
    var gx=XP+48, gz=cz, BR=0x6A5236, BR2=0x7C6040, GRAN=0x4B4745;
    oriBox(M,gx,gz,1,0,3.2,6.4,0,0.6,GRAN,0.8);
    for(var s=-1;s<=1;s+=2){
      oriBox(M,gx,gz+s*4.2,1,0,0.55,0.55,0.6,7.2,BR,0.75);
      addCollider(oriRect(gx,gz+s*4.2,1,0,0.7,0.7),7.2);
    }
    oriBox(M,gx,gz,1,0,0.7,5.6,7.2,8.3,BR,0.78);
    /* two headless bronze athletes standing on the lintel */
    function figure(fz,h,broad){
      var y=8.3;
      for(var l=-1;l<=1;l+=2) oriBox(M,gx,fz+l*0.17*broad,1,0,0.14,0.12,y,y+h*0.47,BR2,0.8);
      oriBox(M,gx,fz,1,0,0.2,0.3*broad,y+h*0.47,y+h*0.62,BR2,0.8);
      oriBox(M,gx,fz,1,0,0.22,0.34*broad,y+h*0.62,y+h*0.86,BR2,0.82);
      for(l=-1;l<=1;l+=2) oriBox(M,gx,fz+l*0.46*broad,1,0,0.1,0.09,y+h*0.50,y+h*0.84,BR2,0.8);
      oriBox(M,gx,fz,1,0,0.09,0.09,y+h*0.86,y+h*0.90,BR2,0.8);
    }
    figure(gz-1.6,2.0,1.12); figure(gz+1.6,1.85,0.95);
  })();

  var mesh=new T.Mesh(M.geom(),matWorld); mesh.castShadow=true; mesh.receiveShadow=true;
  mesh.frustumCulled=false; scene.add(mesh);
  COL_MESH=mesh;
  NAMED_PLACES.push({name:'Los Angeles Memorial Coliseum',x:cx,z:cz,h:30,rad:120,
    spot:{x:XP+34,z:cz+6,look:[XP-6,18,cz]}});
  NAMED_PLACES.push({name:'Peristyle & Olympic Torch',x:XP-4,z:cz,h:40,rad:14});
  NAMED_PLACES.push({name:'Olympic Gateway',x:XP+48,z:cz,h:10,rad:6});
})();
