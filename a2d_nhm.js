/* ==================================================================
   Natural History Museum of Los Angeles County, Exposition Park.
   Laid on the OSM footprint (NHM, set in a_world.js), in four parts:
   - the 1913 building at the east end, red brick and cream terra cotta,
     its arched entrance, two little corner domes and the broad pale
     rotunda dome looking east down the Rose Garden;
   - the Otis Booth Pavilion, the glass box on its north side with the
     fin whale hanging inside;
   - the later wings behind it, cream walls under red tile;
   - along the south, the white front with the carved name over three
     doors, a loggia above and wide steps, facing down the lawn walk to
     the Coliseum; NHM Commons in glass at the south-west corner.
   ================================================================== */
(function(){
  if(!NHM) return;
  var M=new Mesher(), MG=new Mesher(), MGL=new Mesher();
  var TAU=Math.PI*2;
  var BR=0xA9573A, BRD=0x8F4830, TC=0xE6D6B2, TCD=0xC9B68E, DOME=0xEBE1C2, DOMED=0xD6C9A2,
      WH=0xEEE9DC, WHD=0xD2CBBA, CRM=0xE0D3B8, TILE=0xB0502F, TILED=0x8A3C24,
      DARK=0x2F2A26, GLASS=0x2E3B45, CONC=0xC8C2B2, BRK=0x8F4E3C, BRONZE=0x6E5B3C,
      BONE=0xE9E1CB, POLE=0x3A3D40;
  var cols=[];
  function ccw(r){ if(ringArea(r)<0) r.reverse(); return r; }
  function rect(x0,z0,x1,z1){ return ccw([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]); }
  function hs(a,b){ var x=Math.sin(a*12.9898+b*78.233)*43758.5453; return x-Math.floor(x); }
  /* a wall frame at (x,z) whose face looks along (nx,nz); u runs along the wall */
  function frame(x,z,nx,nz,L){ return {x:x,z:z,nx:nx,nz:nz,dx:-nz,dz:nx,L:L||0}; }
  function kit(x,z,nx,nz){ return wallKit(M,frame(x,z,nx,nz)); }
  function solid(r,h){ cols.push([r,h]); return r; }
  function eachEdge(ring,fn){
    for(var i=0;i<ring.length;i++){
      var a=ring[i], b=ring[(i+1)%ring.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(L<4) continue;
      var dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
      fn({x:(a[0]+b[0])/2, z:(a[1]+b[1])/2, dx:dx, dz:dz, nx:dz, nz:-dx, L:L});
    }
  }
  function rowOf(F,pitch,margin,fn){
    var n=Math.floor((F.L-2*margin)/pitch); if(n<1) return;
    var g=(F.L-2*margin)/n; for(var k=0;k<n;k++) fn(-F.L/2+margin+(k+0.5)*g);
  }
  function win(F,u,v,y0,w,h,ha,col){
    archFace(M,F.x+F.dx*u+F.nx*v,F.z+F.dz*u+F.nz*v,F.dx,F.dz,0,0,y0,w,h,ha,col,1);
  }
  /* a dome of `rings` courses, alternate gores a shade apart so it reads ribbed */
  function dome(cx,cy,cz,r,h,n,rings,col,colB){
    var cA=rgb(col,1), cB=rgb(colB,1);
    for(var k=0;k<rings;k++){
      var p0=k/rings*Math.PI/2, p1=(k+1)/rings*Math.PI/2;
      var r0=Math.cos(p0)*r, r1=Math.cos(p1)*r, y0=cy+Math.sin(p0)*h, y1=cy+Math.sin(p1)*h;
      for(var i=0;i<n;i++){
        var a0=i/n*TAU, a1=(i+1)/n*TAU, c=(i%2)?cA:cB;
        M.quad([cx+Math.cos(a0)*r0,y0,cz+Math.sin(a0)*r0],[cx+Math.cos(a0)*r1,y1,cz+Math.sin(a0)*r1],
               [cx+Math.cos(a1)*r1,y1,cz+Math.sin(a1)*r1],[cx+Math.cos(a1)*r0,y0,cz+Math.sin(a1)*r0],c,c,c,c);
      }
    }
  }
  /* the flag, drawn on both faces; hangs from the pole along +u */
  function flag(px,pz,nx,nz,y,w,h){
    var ux=-nz, uz=nx, cx=px+ux*w*0.5, cz=pz+uz*w*0.5, kx=px+ux*w*0.21, kz=pz+uz*w*0.21;
    for(var s=-1;s<=1;s+=2){
      var dx=ux*s, dz=uz*s, ox=nx*s*0.02, oz=nz*s*0.02;
      for(var k=0;k<7;k++)
        archFace(M,cx,cz,dx,dz,ox,oz,y+h-(k+1)*h/7,w,h/7,0,k%2?0xF2F0EA:0xB0263A,1);
      archFace(M,kx,kz,dx,dz,ox*2,oz*2,y+h*0.45,w*0.42,h*0.55,0,0x2A3A70,1);
    }
  }

  /* =============================================== the 1913 building */
  var H13=15.2, EX=-217.5, EZ=383;
  var P13=ccw([[-278,374],[-249,374],[-249,367],[EX,367],[EX,399],[-224,399],[-224,428],[-278,428]]);
  prism(M,P13,0,H13,BR,0xB3A48A,0.55);
  band(M,P13,0,2.1,0.22,TCD,1,0.7);                 /* stone basement */
  band(M,P13,2.1,2.4,0.30,TC,1,0.8,true);
  band(M,P13,7.3,7.75,0.20,TC,1,0.8,true);          /* string course */
  band(M,P13,H13-1.0,H13-0.4,0.28,TCD,0.95,0.7,true);
  band(M,P13,H13-0.4,H13+0.15,0.50,TC,1,0.8,true);  /* cornice */
  wallAlong(M,P13,H13+0.15,H13+1.25,0.5,BR,0.62);   /* parapet */
  wallAlong(M,P13,H13+1.25,H13+1.5,0.72,TC,0.8);
  solid(P13,H13+1.5);
  eachEdge(P13,function(F){
    if(Math.abs(F.x-EX)<0.3) return;                /* the entrance front is dressed below */
    rowOf(F,4.8,2.2,function(u){
      win(F,u,0.06,2.9,2.3,3.3,0,TC);   win(F,u,0.10,3.1,1.7,2.9,0,GLASS);
      win(F,u,0.06,8.3,2.9,3.6,1.45,TC); win(F,u,0.10,8.5,2.1,3.4,1.05,GLASS);
      win(F,u,0.13,12.55,0.5,0.75,0,TCD);            /* keystone */
    });
  });

  /* ---- the entrance front, looking east down the Rose Garden ---- */
  var K=kit(EX,EZ,1,0), FW=8.4;
  /* corner towers carrying the two small domes */
  [-13.1,13.1].forEach(function(u){
    solid(K.box(u-2.7,u+2.7,-5.2,0.7,0,H13+2.4,BR,0.58),H13+2.4);
    K.box(u-2.9,u+2.9,-5.4,0.92,0,2.1,TCD,0.7);
    K.box(u-2.9,u+2.9,-5.4,0.95,7.3,7.75,TC,0.8);
    K.box(u-3.0,u+3.0,-5.5,1.05,H13-0.4,H13+0.2,TC,0.8);
    K.box(u-3.0,u+3.0,-5.5,1.05,H13+2.4,H13+2.9,TC,0.8);
    for(var y=2.5;y<H13-0.8;y+=1.15){               /* stone quoins */
      K.box(u-2.85,u-2.05,0.6,0.82,y,y+0.55,TC,0.75);
      K.box(u+2.05,u+2.85,0.6,0.82,y,y+0.55,TC,0.75);
    }
    K.face(u,0.74,8.7,2.2,3.2,1.1,TC); K.face(u,0.78,8.9,1.5,3.0,0.75,GLASS);
    K.face(u,0.74,3.2,1.8,2.6,0,TC);   K.face(u,0.78,3.4,1.2,2.2,0,GLASS);
    var p=K.P(u,-2.25), oct=ccw(ngon(p[0],p[1],2.3,8,Math.PI/8));
    prism(M,oct,H13+2.9,H13+5.0,TC,TC,0.66);
    for(var q=0;q<8;q+=2){ var a=q/8*TAU;
      archFace(M,p[0]+Math.cos(a)*2.15,p[1]+Math.sin(a)*2.15,-Math.sin(a),Math.cos(a),0,0,H13+3.3,0.8,0.9,0.4,DARK,1); }
    band(M,oct,H13+5.0,H13+5.4,0.25,TCD,0.9,0.7);
    dome(p[0],H13+5.4,p[1],2.45,2.7,16,5,DOME,DOMED);
    postAt(M,p[0],p[1],H13+8.0,H13+8.9,0.09,BRONZE,0.8);
  });
  /* the centre bay: three tall arches between paired cream pilasters */
  solid(K.box(-FW,FW,0,1.0,0,H13,BR,0.58),H13);
  K.box(-FW-0.2,FW+0.2,0,1.2,0,0.95,TCD,0.7);
  [-4.7,0,4.7].forEach(function(u){
    K.face(u,1.03,0.95,3.8,4.4,1.9,TC,1);
    K.face(u,1.07,0.95,3.0,4.4,1.5,DARK,1);
    K.face(u,1.10,6.75,0.6,0.65,0,TCD,1);
    K.face(u,1.03,9.1,2.6,3.2,1.3,TC,1);
    K.face(u,1.07,9.3,1.9,3.0,0.95,GLASS,1);
  });
  [-7.3,-2.35,2.35,7.3].forEach(function(u){ K.box(u-0.35,u+0.35,1.0,1.38,0.95,8.3,TC,0.7); });
  K.box(-FW-0.1,FW+0.1,0.9,1.5,7.6,8.4,TC,0.8);                  /* frieze */
  K.box(-FW-0.4,FW+0.4,0.5,1.8,H13-0.5,H13+0.25,TC,0.8);        /* cornice */
  /* the ornate crest over the entrance: medallion, pediment and eagle */
  K.box(-6.2,6.2,0.2,1.3,H13+0.25,H13+3.8,TC,0.72);
  K.box(-7.5,-6.2,0.3,1.2,H13+0.25,H13+1.7,TC,0.72);
  K.box(6.2,7.5,0.3,1.2,H13+0.25,H13+1.7,TC,0.72);
  K.box(-4.3,4.3,0.2,1.35,H13+3.8,H13+4.6,TCD,0.78);
  K.gable(-4.7,4.7,1.36,H13+4.6,H13+5.6,TC);
  K.gable(-4.7,4.7,0.18,H13+4.6,H13+5.6,TC);
  K.disc(0,1.34,H13+2.05,1.5,TCD,22); K.disc(0,1.37,H13+2.05,1.05,0x9A6446,22);
  K.face(-4.2,1.33,H13+0.8,1.2,2.2,0.6,TCD); K.face(4.2,1.33,H13+0.8,1.2,2.2,0.6,TCD);
  var e=K.P(0,0.8), ey=H13+5.5, cw=rgb(BRONZE,0.9);
  postAt(M,e[0],e[1],ey,ey+1.1,0.30,BRONZE,0.8);
  postAt(M,e[0],e[1],ey+1.1,ey+1.45,0.17,BRONZE,0.9);
  [-1,1].forEach(function(s){ var t=K.P(s*1.9,0.8), sh=K.P(s*0.3,0.8);
    M.tri([sh[0],ey+0.55,sh[1]],[sh[0],ey+1.05,sh[1]],[t[0],ey+1.9,t[1]],cw,cw,cw);
    M.tri([sh[0],ey+1.05,sh[1]],[sh[0],ey+0.55,sh[1]],[t[0],ey+1.9,t[1]],cw,cw,cw); });
  var fp=K.P(0,-3.2);
  postAt(M,fp[0],fp[1],H13,H13+11.5,0.07,0xE4E4E4,0.9);
  flag(fp[0],fp[1],1,0,H13+9.5,2.9,1.7);
  /* steps up into the loggia, and the stone cheeks either side */
  for(var st=0;st<6;st++){ var hh=0.95-st*0.16;
    solid(K.box(-FW-0.6,FW+0.6,1.0,3.3+st*0.42,0,hh,CONC,0.7),hh); }
  [-1,1].forEach(function(s){ solid(K.box(s*(FW+0.6),s*(FW+1.3),1.0,5.5,0,1.25,TCD,0.7),1.25); });

  /* the rotunda: drum ringed with small arched lights, the broad ribbed dome, a lantern */
  var dc=K.P(0,-16.5), DR=9.3, DY=H13+6.6, drum=ccw(ngon(dc[0],dc[1],DR,28,0));
  prism(M,drum,H13,DY-0.6,TC,TC,0.62);
  band(M,drum,H13+1.6,H13+1.9,0.2,TCD,0.9,0.7,true);
  for(var i=0;i<14;i++){ var a=i/14*TAU;
    archFace(M,dc[0]+Math.cos(a)*(DR+0.04),dc[1]+Math.sin(a)*(DR+0.04),-Math.sin(a),Math.cos(a),0,0,H13+2.3,1.4,2.2,0.7,GLASS,1); }
  band(M,drum,DY-0.6,DY,0.5,TCD,0.95,0.7);
  dome(dc[0],DY,dc[1],DR+0.2,9.6,28,7,DOME,DOMED);
  var lan=ccw(ngon(dc[0],dc[1],1.6,10,0));
  prism(M,lan,DY+9.2,DY+11.0,TC,TC,0.66);
  band(M,lan,DY+11.0,DY+11.25,0.18,TCD,0.9,0.7);
  dome(dc[0],DY+11.25,dc[1],1.7,1.4,10,3,DOME,DOMED);
  postAt(M,dc[0],dc[1],DY+12.6,DY+13.8,0.08,BRONZE,0.8);

  /* =============================================== the Otis Booth Pavilion */
  var OH=16.5;
  prism(M,rect(-243.3,336.7,-224.7,367),0,0.45,0xB9B2A2,0xCFC8B8,0.7);
  flat(M,rect(-242.9,337.1,-225.1,366.9),0.47,0x8E877B,1);
  prism(M,rect(-243.4,336.6,-224.6,367),OH-0.9,OH,WH,WH,0.7);
  solid(rect(-243.4,336.6,-224.6,367),OH);
  var gF=[frame(-234,336.8,0,-1,18),frame(-243.1,352,-1,0,30),frame(-224.9,352,1,0,30)];
  gF.forEach(function(F){
    archFace(MGL,F.x,F.z,F.dx,F.dz,0,0,0.45,F.L,OH-1.35,0,0xFFFFFF,1);
    var n=Math.round(F.L/3);
    for(var k=0;k<=n;k++){ var u=-F.L/2+F.L*k/n;
      postAt(M,F.x+F.dx*u,F.z+F.dz*u,0.45,OH-0.9,0.09,WH,0.75); }
    [5.6,11.0].forEach(function(y){ win(F,0,0.02,y,F.L,0.18,0,WH); win(F,0,-0.02,y,F.L,0.18,0,WH); });
  });
  /* the fin whale, 63 feet of it, hung head north */
  (function(){
    var wx=-234, cB=rgb(BONE,1), cD=rgb(BONE,0.75);
    function strip(A,B,w){       /* a thin double-sided bone between two points */
      M.quad([A[0],A[1],A[2]-w],[A[0],A[1],A[2]+w],[B[0],B[1],B[2]+w],[B[0],B[1],B[2]-w],cB,cB,cB,cB);
      M.quad([A[0],A[1],A[2]+w],[A[0],A[1],A[2]-w],[B[0],B[1],B[2]-w],[B[0],B[1],B[2]+w],cD,cD,cD,cD);
    }
    var NV=30;
    for(var v=0;v<NV;v++){
      var t=v/(NV-1), z=344.2+t*18.2, y=10.2+Math.sin(t*Math.PI)*0.7-t*0.6, s=0.62*(1-t*0.78);
      prism(M,rect(wx-s,z-0.26,wx+s,z+0.26),y-s,y+s,BONE,BONE,0.72);
      if(v>1&&v<15){          /* ribs */
        var rl=2.2*Math.sin((v-1)/14*Math.PI)+0.6;
        for(var sd=-1;sd<=1;sd+=2){
          var A=[wx+sd*0.4,y,z], B=[wx+sd*(0.9+rl*0.55),y-rl*0.55,z-0.1], C=[wx+sd*(0.6+rl*0.35),y-rl*1.25,z-0.2];
          strip(A,B,0.08); strip(B,C,0.07);
        }
      }
    }
    prism(M,ccw([[wx-1.35,344.3],[wx+1.35,344.3],[wx+0.45,339.6],[wx-0.45,339.6]]),9.6,10.35,BONE,BONE,0.7);
    for(var sd2=-1;sd2<=1;sd2+=2){
      strip([wx+sd2*1.25,9.3,344.2],[wx+sd2*0.45,9.25,339.8],0.12);
      strip([wx+sd2*0.6,9.8,346.6],[wx+sd2*2.4,8.2,348.4],0.22);   /* flippers */
    }
    [345,352,359].forEach(function(z){ postAt(M,wx,z,10.6,OH-0.9,0.02,0x777777,0.8); });
  })();

  /* =============================================== the wings behind */
  var HM=12.4;
  var PM=ccw([[-390,377],[-376,377],[-376,364],[-347,364],[-347,377],[-324,377],[-324,364],
              [-304,364],[-304,376],[-294,376],[-294,374],[-278,374],[-278,418],[-390,418]]);
  prism(M,PM,0,HM,CRM,CRM,0.55);
  band(M,PM,0,1.0,0.18,TCD,1,0.7);
  eachEdge(PM,function(F){
    rowOf(F,4.4,1.8,function(u){
      win(F,u,0.06,2.4,2.0,2.6,1.0,TCD); win(F,u,0.10,2.6,1.5,2.4,0.75,GLASS);
      win(F,u,0.06,7.2,2.0,2.8,0,TCD);   win(F,u,0.10,7.4,1.5,2.4,0,GLASS);
    });
  });
  band(M,PM,HM-0.5,HM,0.3,TC,1,0.75,true);
  solid(PM,HM+2);
  [rect(-390,377,-278,418),rect(-376,364,-347,377),rect(-324,364,-304,377)].forEach(function(r){
    var er=offsetRing(r,0.7); band(M,er,HM,HM+0.3,0,TILED,0.85,0.55); hipRoof(M,er,HM+0.3,3.2,8,TILE); });

  /* =============================================== the white south front */
  var HS=14.6;
  var PS=ccw([[-372,418],[-278,418],[-278,428],[-241,428],[-241,435],[-372,435]]);
  prism(M,PS,0,HS,WH,WH,0.58);
  band(M,PS,0,0.8,0.15,WHD,1,0.7);
  band(M,PS,HS-0.7,HS-0.2,0.25,WHD,0.95,0.7,true);
  band(M,PS,HS-0.2,HS+0.3,0.40,WH,1,0.8,true);
  wallAlong(M,PS,HS+0.3,HS+0.9,0.3,WH,0.75);
  wallAlong(M,PS,HS+0.9,HS+1.1,0.5,TILE,0.8);
  solid(PS,HS+1.1);
  eachEdge(PS,function(F){
    if(F.L<12) return;
    rowOf(F,3.6,2.0,function(u){
      var wx=F.x+F.dx*u;
      if(F.nz>0.9&&wx>-337&&wx<-292) return;
      win(F,u,0.08,11.0,2.2,1.5,0,GLASS);
      if(F.nz<0.9) win(F,u,0.08,4.2,1.8,2.2,0,GLASS);
    });
  });
  /* the exhibition banners hung either side of the entrance */
  var BAN=[[0x1E2433,0xD6336C],[0x2B2233,0xE9A03B],[0x173A5E,0x7FC6E4],[0x3E2150,0xF2C94C]];
  [-352.5,-343.5,-285.5,-276.5].forEach(function(x,i){
    var B=kit(x,435,0,1);
    B.face(0,0.14,3.4,3.4,8.2,0,BAN[i][0]); B.face(0,0.18,6.2,2.8,4.2,0,BAN[i][1]);
    B.face(0,0.18,4.2,2.8,0.55,0,0xF2F0EA);  B.face(0,0.18,10.7,2.8,0.45,0,0xF2F0EA);
    B.box(-1.9,1.9,0.08,0.3,11.6,11.75,DARK,0.7);
  });
  /* the centre block with its red tile roof, and the entrance front ahead of it */
  var PC=rect(-335,410,-294,438), HC=15.8;
  prism(M,PC,0,HC,WH,WH,0.58);
  band(M,PC,0,0.72,0.15,WHD,1,0.7);
  band(M,PC,HC-0.5,HC,0.35,WHD,0.95,0.72,true);
  var ec=offsetRing(PC,0.5); band(M,ec,HC,HC+0.3,0,TILED,0.85,0.55); hipRoof(M,ec,HC+0.3,2.8,4.2,TILE);
  solid(PC,HC+3);
  var PP=rect(-329,430,-299,440), HP=14.8;
  prism(M,PP,0,HP,WH,WH,0.6);
  band(M,PP,0,0.72,0.15,WHD,1,0.7);
  solid(PP,HP+1);
  var S=kit(-314,440,0,1);
  [-6,0,6].forEach(function(u){                    /* three doors, each under a blue sign */
    S.face(u,0.06,0.72,3.8,3.35,0,WHD); S.face(u,0.10,0.72,3.2,3.15,0,0x2A3440);
    S.face(u,0.13,0.72,0.10,3.15,0,0x8E949A);   S.face(u,0.12,4.0,3.4,0.5,0,0x2F7DB5);
  });
  var tp=S.P(0,0.02);
  facadeText('LOS ANGELES COUNTY MUSEUM',tp[0],tp[1],0,1,6.45,19,1.78,'#5B5347');
  facadeText('OF NATURAL HISTORY',tp[0],tp[1],0,1,5.3,19,1.78,'#5B5347');
  /* the loggia over the name: pilasters, dark windows, a balcony rail */
  S.face(0,0.03,7.4,26,6.2,0,0xBDB6A6);
  [-10,-6,-2,2,6,10].forEach(function(u){ S.face(u,0.07,8.6,2.4,4.3,0,0x3B4550); });
  [-12,-8,-4,0,4,8,12].forEach(function(u){ S.box(u-0.5,u+0.5,0,0.7,7.4,13.6,WH,0.66); });
  S.box(-13,13,0,0.9,7.3,7.6,WH,0.7);
  S.box(-13,13,0.62,0.9,7.6,8.5,WH,0.74);
  S.box(-15.2,15.2,0,0.5,13.6,14.3,WH,0.72);
  S.box(-15.5,15.5,0,0.9,14.3,14.8,WHD,0.8);
  balustrade(M,PP,HP,WH,WHD);
  /* the wide steps down to the lawn */
  for(st=0;st<4;st++){ var sh2=0.72-st*0.18;
    solid(S.box(-17,17,0,2.2+st*0.45,0,sh2,CONC,0.7),sh2); }
  /* NHM.ORG painted on the roof, the way it reads from the air */
  (function(){
    var cv=document.createElement('canvas'); cv.width=512; cv.height=128;
    var g=cv.getContext('2d'); g.fillStyle='#4A4A4A'; g.font='900 104px Arial,Helvetica,sans-serif';
    g.textAlign='center'; g.textBaseline='middle'; g.fillText('NHM.ORG',256,68,500);
    var m=new T.Mesh(new T.PlaneGeometry(22,5.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),
      transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
    m.rotation.x=-Math.PI/2; m.position.set(-314,HP+0.03,435.2);
    m.renderOrder=3; m.raycast=function(){}; m.frustumCulled=false; m.userData.noShadow=true; scene.add(m);
  })();

  /* =============================================== NHM Commons, in glass */
  var PW=ccw([[-415,396],[-390,396],[-390,418],[-372,418],[-372,435],[-415,435]]), HW=13;
  prism(M,PW,0,HW,0x86A4B3,0xDAD6CC,0.78);
  band(M,PW,4.3,4.55,0.10,WH,1,0.8,true);
  band(M,PW,8.7,8.95,0.10,WH,1,0.8,true);
  band(M,PW,HW-0.7,HW+0.2,0.35,WH,1,0.8);
  eachEdge(PW,function(F){ rowOf(F,2.5,0,function(u){
    postAt(M,F.x+F.dx*u+F.nx*0.08,F.z+F.dz*u+F.nz*0.08,0,HW-0.7,0.08,WH,0.75); }); });
  var Cm=kit(-397,435,0,1);
  Cm.box(-13,13,0,4.2,4.6,4.95,WH,0.75);
  [-12.4,12.4].forEach(function(u){ Cm.box(u-0.14,u+0.14,3.8,4.1,0,4.6,WHD,0.7); });
  Cm.face(0,0.12,0,6,3.6,0,0x2A3440);
  solid(PW,HW+0.2);

  /* =============================================== the grounds */
  function plaza(r){ flat(MG,offsetRing(r,0.9),0.136,BRK,0.95); flat(MG,r,0.140,CONC,0.97); }
  plaza(rect(-340,440,-289,459));                   /* south forecourt, at the head of the lawn walk */
  plaza(rect(-216.5,372,-199.5,394));               /* east forecourt, on the Rose Garden axis */
  for(var jx=-337;jx<-290;jx+=3) flat(MG,rect(jx,444.5,jx+0.08,459),0.142,0xB3AD9E,1);
  var fl=[-292,450];
  postAt(M,fl[0],fl[1],0,0.5,0.35,0xB9B2A2,0.7);
  postAt(M,fl[0],fl[1],0.5,13,0.08,0xE4E4E4,0.9);
  flag(fl[0],fl[1],0,1,10.8,3.2,1.9);
  cols.push([rect(fl[0]-0.4,fl[1]-0.4,fl[0]+0.4,fl[1]+0.4),13]);
  /* tall poles with paired banners down the lawn walk */
  var PB=[[0xD6336C,0x1E2433],[0xF2C94C,0x3E2150],[0x7FC6E4,0x173A5E],[0xE9A03B,0x2B2233]];
  [[-321.2,468],[-308.8,468],[-321.2,494],[-308.8,494]].forEach(function(p,i){
    postAt(M,p[0],p[1],0,0.6,0.22,POLE,0.6); postAt(M,p[0],p[1],0.6,9.2,0.1,POLE,0.66);
    postAt(M,p[0],p[1],9.2,9.8,0.22,0xF1E9C8,0.92);
    for(var sd=-1;sd<=1;sd+=2){
      var bx=p[0]+sd*0.75;
      segBox(M,[p[0],p[1]],[bx+sd*0.55,p[1]],8.3,8.4,0.06,POLE,0.7);
      for(var f=-1;f<=1;f+=2){
        var Bn=kit(bx,p[1]+f*0.04,0,f);
        Bn.face(0,0,4.6,1.1,3.7,0,PB[(i+(sd>0?1:0))%4][0]);
        Bn.face(0,0.01,5.4,0.9,1.4,0,PB[(i+(sd>0?1:0))%4][1]);
      }
    }
    cols.push([rect(p[0]-0.3,p[1]-0.3,p[0]+0.3,p[1]+0.3),9.8]);
  });

  /* the low stucco building south-east of the front, under red tile */
  if(NHM_ANNEX){
    var AX=simplifyRing(NHM_ANNEX.ring,0.8), AH=4.6;
    prism(M,AX,0,AH,CRM,CRM,0.58);
    band(M,AX,0,0.6,0.12,TCD,1,0.7);
    eachEdge(AX,function(F){ rowOf(F,3.4,1.6,function(u){
      win(F,u,0.06,1.2,1.6,2.2,0,TCD); win(F,u,0.1,1.35,1.2,1.9,0,GLASS); }); });
    var ea=offsetRing(AX,0.6); band(M,ea,AH,AH+0.25,0,TILED,0.85,0.55); hipRoof(M,ea,AH+0.25,2.4,4,TILE);
    solid(AX,AH+1);
  }

  /* keep trees off the building and out of the two approaches */
  var keep=[rect(-421,331,-211,446), rect(-343,440,-286,605), rect(-218,369,-189,397)];
  for(i=TREE_POS.length-1;i>=0;i--){ var tq=TREE_POS[i];
    for(var kk=0;kk<keep.length;kk++) if(inRing(keep[kk],tq[0],tq[1])){ TREE_POS.splice(i,1); break; } }
  keep.forEach(function(r){ NO_PLANT.push(r); NO_LAWN_TREES.push(r); });
  /* a few big shade trees framing the lawn, the way the photos show it */
  [[-352,468,'ficus',1.3],[-278,470,'oak',1.25],[-360,500,'syc',1.2],[-268,505,'ficus',1.2]].forEach(function(t){
    TREE_POS.push([t[0],t[1],0,t[2],t[3]]); });

  cols.forEach(function(c){ addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  var gl=new T.Mesh(MGL.geom(),new T.MeshLambertMaterial({color:0xB4CFD9,transparent:true,opacity:0.30,
            side:T.DoubleSide,depthWrite:false}));
  gl.userData.noShadow=true; gl.frustumCulled=false; gl.renderOrder=2; scene.add(gl);
  NAMED_PLACES.push({name:NHM.name,x:-316,z:388,h:HS,rad:59});
  NAMED_PLACES.push({name:NHM.name,x:-236,z:383,h:H13,rad:24});      /* the 1913 front */
  NAMED_PLACES.push({name:NHM.name,x:-314,z:428,h:HS,rad:24});      /* the south front */
  window.__nhm={tris:M.count(),cols:cols.length};
})();
