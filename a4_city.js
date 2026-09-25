/* ==================================================================
   The city around the map data: South Los Angeles laid out the rough
   way it really is, so the edge of the world is streets and houses
   instead of bare ground.
   - Two street grids: the true north grid south of Exposition and west
     of Vermont, and the grid turned 28 degrees that runs north from the
     campus toward downtown (Figueroa, Jefferson, Adams).
   - Blocks cut into lots: stucco bungalows with hip roofs and palms,
     small apartment blocks, shops and billboards along the big streets,
     warehouses out east, taller buildings toward downtown.
   - Street trees, fan palms along the boulevards, parked cars.
   - The Harbor Freeway (110) carried on north and south of the data,
     and the Santa Monica Freeway (10) across the north.
   Everything inside the OSM rectangle (LG) is left to the real data.
   ================================================================== */
(function(){
  var T0=performance.now();
  var TAU=Math.PI*2, RALL=2500, RFINE=1400;
  var th=28*Math.PI/180, CS=Math.cos(th), SN=Math.sin(th);
  function hs(a,b,c){ var x=Math.sin(a*12.9898+b*78.233+(c||0)*37.719)*43758.5453; return x-Math.floor(x); }
  function pick(arr,h){ return arr[Math.floor(h*arr.length)%arr.length]; }
  var BOX={x0:LG.x0,z0:LG.z0,x1:LG.x1,z1:LG.z1};
  function inBox(x,z,pad){ return x>BOX.x0-pad&&x<BOX.x1+pad&&z>BOX.z0-pad&&z<BOX.z1+pad; }

  /* ---------------------------------------------------------- what to avoid */
  var OH={}, OC=40;
  function addOH(r,pad){
    var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(var i=0;i<r.length;i++){ x0=Math.min(x0,r[i][0]); x1=Math.max(x1,r[i][0]); z0=Math.min(z0,r[i][1]); z1=Math.max(z1,r[i][1]); }
    var b=[x0-pad,x1+pad,z0-pad,z1+pad];
    for(var cx=Math.floor(b[0]/OC);cx<=Math.floor(b[1]/OC);cx++)
      for(var cz=Math.floor(b[2]/OC);cz<=Math.floor(b[3]/OC);cz++){ var k=cx+'_'+cz; (OH[k]||(OH[k]=[])).push(b); }
  }
  BUILDINGS.forEach(function(B){ addOH(B.ring,6); });
  CAMPUS.forEach(function(B){ addOH(B.ring,6); });
  function nearOSM(x,z,r){
    var l=OH[Math.floor(x/OC)+'_'+Math.floor(z/OC)]; if(!l) return false;
    for(var i=0;i<l.length;i++){ var b=l[i]; if(x+r>b[0]&&x-r<b[1]&&z+r>b[2]&&z-r<b[3]) return true; }
    return false;
  }
  var RH={}, RC=5;
  function markSeg(a,b,rad){
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/3));
    for(var k=0;k<=n;k++){
      var x=a[0]+(b[0]-a[0])*k/n, z=a[1]+(b[1]-a[1])*k/n;
      for(var cx=Math.floor((x-rad)/RC);cx<=Math.floor((x+rad)/RC);cx++)
        for(var cz=Math.floor((z-rad)/RC);cz<=Math.floor((z+rad)/RC);cz++) RH[cx+'_'+cz]=1;
    }
  }
  ROADS.forEach(function(R){ for(var k=0;k<R.pts.length-1;k++) markSeg(R.pts[k],R.pts[k+1],R.w*0.5+3); });
  markSeg([EXPO.xw,EXPO.z],[-1100,EXPO.z],18);
  function onRoadH(x,z){ return RH[Math.floor(x/RC)+'_'+Math.floor(z/RC)]===1; }
  var BIGPARKS=PARKS.filter(function(p){ return Math.abs(ringArea(p.ring))>20000; }).map(function(p){ return p.ring; });
  function inPark(x,z){ for(var i=0;i<BIGPARKS.length;i++) if(inRing(BIGPARKS[i],x,z)) return true; return false; }

  /* freeways: the 110 carried on past the data, and the 10 across the north */
  var FWY=[
    {w:40, pts:[[1001,-1056],[1040,-1300],[1120,-1600],[1300,-1900],[1480,-2130],[1620,-2320],[1760,-2600]]},
    {w:40, pts:[[405,1035],[404,1500],[402,2000],[400,2600]]},
    {w:46, pts:[[-2700,-1860],[-1500,-1868],[-600,-1885],[300,-1915],[900,-1985],[1350,-2080],[1560,-2190],[1900,-2300],[2700,-2420]]}
  ];
  FWY.forEach(function(F){ for(var k=0;k<F.pts.length-1;k++) markSeg(F.pts[k],F.pts[k+1],F.w*0.5+9); });

  /* ---------------------------------------------------------- chunked meshes */
  var CH={}, CK=320;
  function chunk(x,z){ var k=Math.floor(x/CK)+'_'+Math.floor(z/CK);
    return CH[k]||(CH[k]={M:new Mesher(),G:new Mesher()}); }

  /* ---------------------------------------------------------- the two grids */
  var GA={o:[-568,262], d1:[1,0], d2:[0,1], Su:150, Sv:105, artU:5, artV:4};
  var fu=284*CS+262*SN, vj=-440;
  var GB={o:null, d1:[CS,SN], d2:[-SN,CS], Su:125, Sv:100, artU:6, artV:8, u0:fu, v0:vj};
  GA.u0=GA.o[0]; GA.v0=GA.o[1];
  function zoneOf(x,z){ return (z<256&&x>-700)?GB:GA; }
  function W(G,u,v){ return [G.d1[0]*u+G.d2[0]*v, G.d1[1]*u+G.d2[1]*v]; }
  function U(G,x,z){ return x*G.d1[0]+z*G.d1[1]; }
  function V(G,x,z){ return x*G.d2[0]+z*G.d2[1]; }
  function isArtU(G,i){ return ((i%G.artU)+G.artU)%G.artU===0; }
  function isArtV(G,j){ return ((j%G.artV)+G.artV)%G.artV===0; }
  function streetW(art){ return art?17:9.5; }
  function okGround(x,z){ return Math.hypot(x,z)<RALL&&!inBox(x,z,2)&&!inPark(x,z); }

  var cars=[], trees=[], palms=[];
  var C_KERB=0xB7B1A4, C_ASPH=0x55585F;

  /* streets: each grid line, drawn in short runs wherever it is outside the data */
  [GA,GB].forEach(function(G){
    var span=RALL*1.5;
    for(var pass=0;pass<2;pass++){
      var S=pass?G.Sv:G.Su, base=pass?G.v0:G.u0;
      var i0=Math.floor((-span-base)/S), i1=Math.ceil((span-base)/S);
      for(var i=i0;i<=i1;i++){
        var c=base+i*S, art=pass?isArtV(G,i):isArtU(G,i), w=streetW(art);
        var run=null;
        for(var t=-span;t<=span;t+=8){
          var P=pass?W(G,t,c):W(G,c,t);
          var ok=zoneOf(P[0],P[1])===G&&okGround(P[0],P[1])&&!onRoadH(P[0],P[1])&&!nearOSM(P[0],P[1],2);
          if(ok){ if(!run) run=[P,P]; else run[1]=P; }
          if((!ok||t+8>span)&&run){
            if(Math.hypot(run[1][0]-run[0][0],run[1][1]-run[0][1])>6){
              var m=[(run[0][0]+run[1][0])/2,(run[0][1]+run[1][1])/2], C=chunk(m[0],m[1]);
              ribbon(C.G,run,w+5,0.035,C_KERB,0.97);
              ribbon(C.G,run,w,0.05,C_ASPH,art?1:0.95);
              if(art) ribbon(C.G,run,0.35,0.055,0xD9B53A,1);
              /* parked cars along both kerbs */
              var L=Math.hypot(run[1][0]-run[0][0],run[1][1]-run[0][1]), dx=(run[1][0]-run[0][0])/L, dz=(run[1][1]-run[0][1])/L;
              var near=Math.hypot(m[0],m[1])<RFINE+200;
              for(var s2=4;s2<L-4;s2+=7.2){
                for(var sd=-1;sd<=1;sd+=2){
                  var h=hs(c+s2,sd,i);
                  if(h>(near?(art?0.22:0.4):0)) continue;
                  var off=w*0.5-1.3, cx0=run[0][0]+dx*s2, cz0=run[0][1]+dz*s2;
                  if(Math.hypot(cx0,cz0)>RFINE+150) continue;
                  cars.push([run[0][0]+dx*s2-dz*off*sd, run[0][1]+dz*s2+dx*off*sd, Math.atan2(dz,dx), h]);
                }
              }
              /* street trees in the parkways of the side streets */
              if(!art) for(var s4=6;s4<L-4;s4+=14){ for(var sd3=-1;sd3<=1;sd3+=2){
                var to=w*0.5+1.6, tx=run[0][0]+dx*s4-dz*to*sd3, tz=run[0][1]+dz*s4+dx*to*sd3, ht2=hs(tx,tz,5);
                if(ht2<(near?0.42:0.22)&&!nearOSM(tx,tz,1)) trees.push([tx,tz,2.0+ht2*4,4.5+ht2*8,hs(tz,tx,6)]); } }
              /* fan palms down the boulevards */
              if(art) for(var s3=10;s3<L-5;s3+=30){ for(var sd2=-1;sd2<=1;sd2+=2){
                var po=w*0.5+2.1, px=run[0][0]+dx*s3-dz*po*sd2, pz=run[0][1]+dz*s3+dx*po*sd2;
                if(hs(px,pz,3)<0.7&&!nearOSM(px,pz,1)) palms.push([px,pz,15+hs(px,pz,4)*9]); } }
            }
            run=null;
          }
        }
      }
    }
  });

  /* ---------------------------------------------------------- the buildings */
  var HOUSE=[0xE8DCC4,0xDCC8A8,0xE6C9B8,0xF0EAD8,0xC9D3C4,0xD8C2A0,0xE8D6A0,0xB9C6CF,0xD9B8A8,0xC8B8A8,0xEFE3CF,0xCFC0A6];
  var SHOP=[0xD8BE7A,0xB9695A,0x7A93A8,0xE8E0D0,0x9AA890,0xCF9670,0xF0E6D2,0x8C84A4,0xC9A07A,0xE7D9B8,0xD9D2C4,0xBFB6A6];
  var APT=[0xE6DDCC,0xD6C4A8,0xC7B79F,0xE9E3D6,0xBFA990,0xD8CFC0,0xA7B3B8];
  var ROOF=[0x7E7468,0x6E6258,0xA2553A,0x8A7F72,0x5F5A55,0xB06A4A];
  var FLAT=[0xB0ADA5,0xA8A49A,0xBDB8AE,0x9E9A90];
  var WARE=[0xC9C2B3,0xB9B3A6,0xD6D0C2,0xA8A396,0xC2B8A2];
  var nB=0;
  function lotOK(cx,cz,r){ return okGround(cx,cz)&&!inBox(cx,cz,r)&&!nearOSM(cx,cz,r)&&!onRoadH(cx,cz); }
  function cornersOK(ring){ for(var i=0;i<ring.length;i++){ var p=ring[i]; if(onRoadH(p[0],p[1])||inBox(p[0],p[1],1)||nearOSM(p[0],p[1],1)) return false; } return true; }
  function frontFace(M,cx,cz,ux,uz,nx,nz,hu,hv,h,door,cols){
    var fx=cx+nx*(hv+0.03), fz=cz+nz*(hv+0.03);
    if(door) archFace(M,fx,fz,ux,uz,0,0,0,1.0,2.1,0,0x5A4636,1);
    for(var k=0;k<cols.length;k++) archFace(M,fx+ux*cols[k],fz+uz*cols[k],ux,uz,0,0,1.0,1.4,1.3,0,0x39434B,1);
    if(h>6) for(k=0;k<cols.length;k++) archFace(M,fx+ux*cols[k],fz+uz*cols[k],ux,uz,0,0,4.0,1.4,1.3,0,0x39434B,1);
  }
  function build(G,cx,cz,type,w,d,h,front,fine,seed){
    /* front is +1/-1 along d2: which side of the lot faces the street */
    var ux=G.d1[0], uz=G.d1[1], nx=G.d2[0]*front, nz=G.d2[1]*front;
    var ring=oriRect(cx,cz,ux,uz,w/2,d/2);
    if(!cornersOK(ring)) return false;
    var C=chunk(cx,cz), M=C.M, hA=hs(seed,1), hB=hs(seed,2);
    if(type==='house'){
      var wall=pick(HOUSE,hA), rf=pick(ROOF,hB);
      if(hs(seed,3)<0.72){ prism(M,ring,0,h,wall,rf,0.6); hipRoof(M,offsetRing(ring,0.45),h,1.4+hs(seed,4)*1.2,Math.min(w,d)*0.42,rf); }
      else { prism(M,ring,0,h,wall,pick(FLAT,hB),0.6); band(M,ring,h,h+0.5,0.05,wall,0.9,0.7); }
      if(hs(seed,31)<0.3&&d>9){ /* a small back house or garage */
        var bk=oriRect(cx-nx*(d/2+6),cz-nz*(d/2+6),ux,uz,Math.min(3.2,w/2),2.8);
        if(cornersOK(bk)){ prism(M,bk,0,3.1,wall,pick(FLAT,hA),0.6); } }
      if(fine) frontFace(M,cx,cz,-ux*front,-uz*front,nx,nz,w/2,d/2,h,true,[-w*0.27,w*0.27]);
    } else if(type==='apt'){
      var wa=pick(APT,hA);
      prism(M,ring,0,h,wa,pick(FLAT,hB),0.58);
      band(M,ring,h,h+0.7,0.05,wa,0.92,0.7);
      if(fine) windows(M,ring,h,0x3E4A54);
      if(fine&&hs(seed,5)<0.4){ /* carport under the front */
        archFace(M,cx+nx*(d/2+0.03),cz+nz*(d/2+0.03),-ux*front,-uz*front,0,0,0,w*0.8,2.4,0,0x3A3A3A,1); }
    } else if(type==='shop'){
      var ws=pick(SHOP,hA);
      prism(M,ring,0,h,ws,pick(FLAT,hB),0.6);
      band(M,ring,h,h+1.0,0.05,ws,0.9,0.7);
      var fx=cx+nx*(d/2+0.04), fz=cz+nz*(d/2+0.04);
      if(fine){
        archFace(M,fx,fz,-ux*front,-uz*front,0,0,0.3,w*0.84,2.8,0,0x2E3A40,1);
        archFace(M,fx+nx*0.02,fz+nz*0.02,-ux*front,-uz*front,0,0,3.3,w*0.9,1.0,0,pick(SHOP,hs(seed,6)),1);
        segBox(M,[fx-ux*w*0.45+nx*1.2,fz-uz*w*0.45+nz*1.2],[fx+ux*w*0.45+nx*1.2,fz+uz*w*0.45+nz*1.2],3.05,3.2,2.4,pick(SHOP,hs(seed,7)),0.8);
      }
      if(hs(seed,8)<0.12){ /* a billboard on the roof */
        postAt(M,cx,cz,h,h+6,0.22,0x6A6A6A,0.7);
        var bw=12, bc=pick([0xD7263D,0x1B998B,0xF46036,0x2E294E,0xE2C044,0x3A86FF],hs(seed,9));
        archFace(M,cx+nx*0.3,cz+nz*0.3,-ux*front,-uz*front,0,0,h+6,bw,4,0,bc,1);
        archFace(M,cx+nx*0.32,cz+nz*0.32,-ux*front,-uz*front,0,0,h+7.2,bw*0.6,1.2,0,0xF4F1E8,1);
        archFace(M,cx+nx*0.28,cz+nz*0.28,ux*front,uz*front,0,0,h+6,bw,4,0,0x7A7A7A,1);
      }
    } else if(type==='ware'){
      var ww=pick(WARE,hA);
      prism(M,ring,0,h,ww,0xA9A69E,0.6);
      band(M,ring,h,h+0.6,0.05,ww,0.9,0.7);
      if(fine) for(var k=-1;k<=1;k+=2) archFace(M,cx+nx*(d/2+0.03)+ux*k*w*0.25,cz+nz*(d/2+0.03)+uz*k*w*0.25,-ux*front,-uz*front,0,0,0,4.2,4.4,0,0x6E6B64,1);
    } else if(type==='tower'){
      var wt=pick([0xC9CED3,0x9FB3C4,0xD8D2C4,0x7F8C99,0xB8A48A,0xE0DDD5],hA);
      prism(M,ring,0,h,wt,0x8E8C88,0.55);
      if(fine) windows(M,ring,Math.min(h,46),0x46586A);
      band(M,ring,h,h+1.2,0.05,wt,0.9,0.7);
    }
    nB++;
    return true;
  }

  function fillBlock(G,i,j){
    var hu0=streetW(isArtU(G,i))*0.5+2.5, hu1=streetW(isArtU(G,i+1))*0.5+2.5,
        hv0=streetW(isArtV(G,j))*0.5+2.5, hv1=streetW(isArtV(G,j+1))*0.5+2.5;
    var ua=G.u0+i*G.Su+hu0, ub=G.u0+(i+1)*G.Su-hu1, va=G.v0+j*G.Sv+hv0, vb=G.v0+(j+1)*G.Sv-hv1;
    var cen=W(G,(ua+ub)/2,(va+vb)/2), r=Math.hypot(cen[0],cen[1]);
    if(r>RALL+80||zoneOf(cen[0],cen[1])!==G) return;
    var fine=r<RFINE, vm=(va+vb)/2;
    var artN=isArtV(G,j), artS=isArtV(G,j+1), artW=isArtU(G,i), artE=isArtU(G,i+1);
    /* district character */
    var dt=(G===GB&&cen[1]<-1350&&cen[0]>200)?'dt':((cen[0]>1250)?'ind':'res');
    if(G===GB&&r<1150&&dt==='res') dt='near';
    var LW=fine?13:24;
    for(var row=0;row<2;row++){
      var v0=row?vm:va, v1=row?vb:vm, front=row?1:-1, art=row?artS:artN;
      var depth=v1-v0, vs=row?v1:v0;                 /* the street edge */
      var n=Math.max(1,Math.floor((ub-ua)/LW)), lw=(ub-ua)/n;
      for(var k=0;k<n;k++){
        var u=ua+(k+0.5)*lw, seed=G.Su*i+k*7.1+row*3.3+j*131.7+(G===GB?999:0);
        var endArt=(k===0&&artW)||(k===n-1&&artE);
        var h1=hs(seed,11), type, bw, bd, bh, set;
        if(dt==='dt'){
          if(k%3!==1) continue;
          type='tower'; bw=lw*2.6; bd=Math.min(depth-4,30); bh=24+Math.pow(hs(seed,12),1.6)*90; set=depth/2;
        } else if(dt==='ind'){
          if(k%3!==1) continue;
          type='ware'; bw=lw*2.7; bd=depth-6; bh=7+hs(seed,12)*6; set=depth/2;
        } else if(art||endArt){
          type=(h1<0.78)?'shop':'apt'; bw=lw-0.6; bd=Math.min(depth-6,type==='shop'?18+h1*8:22);
          bh=type==='shop'?4.2+hs(seed,12)*(h1<0.3?4.5:1.5):8+hs(seed,12)*5; set=bd/2+0.8;
        } else {
          var pa=(dt==='near')?0.38:0.16;
          if(h1<0.05) continue;                                   /* an empty lot */
          if(h1<0.05+pa){ if(k%2) continue; type='apt'; bw=Math.min(lw*1.8,24); bd=Math.min(depth-9,26); bh=7+hs(seed,12)*(dt==='near'?9:4); set=bd/2+5; u+=lw*0.5; }
          else { type='house'; bw=Math.min(lw-3.5,8+hs(seed,12)*3); bd=Math.min(depth-14,10+hs(seed,13)*5);
                 bh=hs(seed,14)<0.22?6.6:3.9+hs(seed,15)*1.0; set=bd/2+5.5+hs(seed,16)*2; }
        }
        if(bd<5) continue;
        var vc=row?(v1-set):(v0+set);                /* centre, set back from the street edge */
        var P=W(G,u,vc);
        if(!lotOK(P[0],P[1],Math.max(bw,bd)*0.5)) continue;
        var placed=build(G,P[0],P[1],type,bw,bd,bh,front,fine,seed);
        if(!placed) continue;
        /* the yard: a front lawn, a tree, sometimes a palm */
        if(type==='house'){
          var lawnV=row?(v1-set+bd/2+2.6):(v0+set-bd/2-2.6), Lp=W(G,u,lawnV);
          if(fine&&hs(seed,20)<0.65){
            var C=chunk(Lp[0],Lp[1]);
            flat(C.G,oriRect(Lp[0],Lp[1],G.d1[0],G.d1[1],lw*0.42,2.2),0.03,pick([0x5E8A3E,0x6F8F45,0x88925A,0x7C8A4E],hs(seed,21)),1);
          }
          var ht=hs(seed,22);
          if(ht<(fine?0.72:0.5)){
            var tv=row?(v0+ (depth-set-bd/2)*0.5):(v1-(depth-set-bd/2)*0.5);   /* back yard */
            if(ht<0.22) tv=lawnV;
            var tu=u+(hs(seed,23)-0.5)*lw*0.6, T=W(G,tu,tv);
            if(!onRoadH(T[0],T[1])) trees.push([T[0],T[1],2.2+hs(seed,24)*2.2,5+hs(seed,25)*5,hs(seed,26)]);
          } else if(ht>0.94){ var T2=W(G,u+lw*0.3,lawnV); palms.push([T2[0],T2[1],11+hs(seed,27)*8]); }
        } else if(type==='apt'&&hs(seed,28)<0.4){
          var T3=W(G,u,row?(v1-1.8):(v0+1.8)); trees.push([T3[0],T3[1],2.4,6,hs(seed,29)]);
        }
      }
    }
  }
  [GA,GB].forEach(function(G){
    var span=RALL*1.5;
    for(var i=Math.floor((-span-G.u0)/G.Su);i<=Math.ceil((span-G.u0)/G.Su);i++)
      for(var j=Math.floor((-span-G.v0)/G.Sv);j<=Math.ceil((span-G.v0)/G.Sv);j++) fillBlock(G,i,j);
  });

  /* ---------------------------------------------------------- freeways */
  FWY.forEach(function(F){
    for(var k=0;k<F.pts.length-1;k++){
      var a=F.pts[k], b=F.pts[k+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      for(var s=0;s<L;s+=40){
        var s1=Math.min(L,s+40), A=[a[0]+dx*s,a[1]+dz*s], B=[a[0]+dx*s1,a[1]+dz*s1];
        var mx=(A[0]+B[0])/2, mz=(A[1]+B[1])/2;
        if(inBox(mx,mz,0)||Math.hypot(mx,mz)>RALL+300) continue;
        var C=chunk(mx,mz);
        ribbon(C.G,[A,B],F.w+6,0.06,0xA9A69E,0.96);
        ribbon(C.G,[A,B],F.w,0.075,0x4E5156,1);
        var nx=-dz, nz=dx;
        segBox(C.M,A,B,0,1.0,0.6,0xC9C5BC,0.7);                                        /* median barrier */
        for(var sd=-1;sd<=1;sd+=2){
          var e=F.w*0.5+1.2;
          segBox(C.M,[A[0]+nx*e*sd,A[1]+nz*e*sd],[B[0]+nx*e*sd,B[1]+nz*e*sd],0,1.0,0.5,0xC9C5BC,0.7);
          if(hs(mx,mz,sd)<0.55) segBox(C.M,[A[0]+nx*(e+3)*sd,A[1]+nz*(e+3)*sd],[B[0]+nx*(e+3)*sd,B[1]+nz*(e+3)*sd],0,4.2,0.4,0xB5AE9E,0.65);
          for(var ln=1;ln<=3;ln++){ var lo=ln*F.w/8*sd;
            for(var q=0;q<40;q+=12){ var q1=Math.min(40,q+4);
              ribbon(C.G,[[A[0]+dx*q+nx*lo,A[1]+dz*q+nz*lo],[A[0]+dx*q1+nx*lo,A[1]+dz*q1+nz*lo]],0.2,0.08,0xE6E6E0,1); } }
        }
      }
    }
  });

  /* ---------------------------------------------------------- build the meshes */
  var tris=0;
  for(var k in CH){
    var C=CH[k];
    if(C.M.count()){ var m=new T.Mesh(C.M.geom(),matWorld); m.userData.noShadow=true; scene.add(m); tris+=C.M.count(); }
    if(C.G.count()){ var g=new T.Mesh(C.G.geom(),matGround); g.userData.noShadow=true; scene.add(g); tris+=C.G.count(); }
  }
  var D=new T.Object3D(), col=new T.Color();
  function inst(geo,list,fn,mat){
    if(!list.length) return null;
    var im=new T.InstancedMesh(geo,mat||new T.MeshLambertMaterial({color:0xFFFFFF,flatShading:true}),list.length);
    for(var i=0;i<list.length;i++){ fn(list[i],i); D.updateMatrix(); im.setMatrixAt(i,D.matrix); im.setColorAt(i,col); }
    if(im.instanceColor) im.instanceColor.needsUpdate=true;
    im.userData.noShadow=true; im.frustumCulled=false; im.raycast=function(){}; scene.add(im); return im;
  }
  /* shade trees */
  var crown=new T.IcosahedronGeometry(1,0), trunk=new T.CylinderGeometry(0.16,0.26,1,5,1,true); trunk.translate(0,0.5,0);
  var LEAF=[0x3E7A34,0x4E8A3A,0x5C9440,0x39702F,0x6A9A48,0x2F6630];
  inst(trunk,trees,function(t){ D.position.set(t[0],0,t[1]); D.rotation.set(0,0,0); D.scale.set(t[2]*0.55,t[3]*0.62,t[2]*0.55); col.setHex(0x6B5845); });
  inst(crown,trees,function(t){ D.position.set(t[0],t[3]*0.62+t[2]*0.55,t[1]); D.rotation.set(0,t[4]*6,0);
    D.scale.set(t[2],t[2]*0.82,t[2]); col.setHex(pick(LEAF,t[4])).multiplyScalar(0.9+t[4]*0.2); });
  /* fan palms: a thin trunk and a burst of fronds */
  var pt=new T.CylinderGeometry(0.17,0.26,1,5); pt.translate(0,0.5,0);
  var fr=(function(){ var P=[], n=11;
    for(var i=0;i<n;i++){ var a=i/n*TAU, bx=Math.cos(a), bz=Math.sin(a), up=(i%3)*0.3-0.35;
      P.push(0,0,0, bx*2.1-bz*0.7,up,bz*2.1+bx*0.7, bx*2.1+bz*0.7,up,bz*2.1-bx*0.7);
      P.push(0,0,0, bx*2.1+bz*0.7,up,bz*2.1-bx*0.7, bx*2.1-bz*0.7,up,bz*2.1+bx*0.7); }
    var g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.computeVertexNormals(); return g; })();
  inst(pt,palms,function(p){ D.position.set(p[0],0,p[1]); D.rotation.set(0,0,0); D.scale.set(1,p[2],1); col.setHex(0x8A7862); });
  inst(fr,palms,function(p){ D.position.set(p[0],p[2],p[1]); D.rotation.set(0,p[0],0); D.scale.set(1.3,1.3,1.3); col.setHex(0x4F7A36); },
       new T.MeshLambertMaterial({color:0xFFFFFF,side:T.DoubleSide,flatShading:true}));
  /* parked cars */
  var CARC=[0xF2F2F0,0x1E1E20,0x8A8D91,0xB7BABD,0x9C1C22,0x1F3B6B,0xE9E4D8,0x3C4A3E,0x5B5F63,0xC9A227,0x2F2F31,0x6D2E1F];
  var cb=new T.BoxGeometry(1,1,1); cb.translate(0,0.5,0);
  inst(cb,cars,function(c){ D.position.set(c[0],0.28,c[1]); D.rotation.set(0,-c[2],0); D.scale.set(4.5,0.78,1.8); col.setHex(pick(CARC,c[3]*3.7)); });
  inst(cb,cars,function(c){ D.position.set(c[0]-Math.cos(c[2])*0.2,1.06,c[1]-Math.sin(c[2])*0.2); D.rotation.set(0,-c[2],0); D.scale.set(2.4,0.58,1.62); col.setHex(0x2A3036); });

  window.__city={ms:Math.round(performance.now()-T0),buildings:nB,trees:trees.length,palms:palms.length,cars:cars.length,tris:tris,chunks:Object.keys(CH).length};
})();
