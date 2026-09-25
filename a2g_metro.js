/* ==================================================================
   Metro E Line down the middle of Exposition Boulevard, and the
   Expo Park/USC station at Trousdale Parkway: two side platforms under
   wavy perforated metal canopies, a three car train for Santa Monica
   standing at the westbound platform, overhead wires on poles, and the
   trench that takes the line down and under Figueroa Street.
   EXPO (a_world.js) holds the median line, station and trench.
   ================================================================== */
(function(){
  var M=new Mesher(), MG=new Mesher(), cols=[];
  var ZC=EXPO.z, TN=ZC-2.0, TS=ZC+2.0, XW=EXPO.xw, XP=EXPO.portal, XT0=EXPO.trench[0], XR=190;
  var ST=EXPO.st, SH=EXPO.stHalf, PH=0.95, DEPTH=7.0;
  var STEEL=0x8A8D90, RAILTOP=0xB9BCC0, SLAB=0x77736B, BAL=0x8E887E, CONC=0xC9C6BE, CONCT=0xD6D3CB,
      YEL=0xE3C62A, POLE=0x6F767C, CAN=0xB4B8BB, DARK=0x1E2327, WHITE=0xE4E5E3;
  function rect(x0,z0,x1,z1){ var r=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]; if(ringArea(r)<0) r.reverse(); return r; }
  function solid(r,h){ cols.push([r,h]); return r; }
  function box(x0,x1,z0,z1,y0,y1,col,sh){ prism(M,rect(x0,z0,x1,z1),y0,y1,col,col,sh===undefined?0.66:sh); }
  function beam(A,B,w,col,sh){
    var dx=B[0]-A[0], dy=B[1]-A[1], dz=B[2]-A[2], L=Math.sqrt(dx*dx+dy*dy+dz*dz); if(L<1e-4) return;
    dx/=L; dy/=L; dz/=L;
    var ux=0,uy=1,uz=0; if(Math.abs(dy)>0.9){ ux=1; uy=0; }
    var px=dy*uz-dz*uy, py=dz*ux-dx*uz, pz=dx*uy-dy*ux, pl=Math.sqrt(px*px+py*py+pz*pz); px/=pl; py/=pl; pz/=pl;
    var qx=dy*pz-dz*py, qy=dz*px-dx*pz, qz=dx*py-dy*px, h=w*0.5, K=[[1,1],[-1,1],[-1,-1],[1,-1]];
    for(var i=0;i<4;i++){
      var a=K[i], b=K[(i+1)%4], c=rgb(col,(i%2)?1:(sh||0.72));
      var oa=[(a[0]*px+a[1]*qx)*h,(a[0]*py+a[1]*qy)*h,(a[0]*pz+a[1]*qz)*h],
          ob=[(b[0]*px+b[1]*qx)*h,(b[0]*py+b[1]*qy)*h,(b[0]*pz+b[1]*qz)*h];
      M.quad([A[0]+oa[0],A[1]+oa[1],A[2]+oa[2]],[A[0]+ob[0],A[1]+ob[1],A[2]+ob[2]],
             [B[0]+ob[0],B[1]+ob[1],B[2]+ob[2]],[B[0]+oa[0],B[1]+oa[1],B[2]+oa[2]],c,c,c,c);
    }
  }
  /* a face across the tracks (normal +x or -x) or along them (normal +z or -z) */
  function faceX(x,zc,s,y0,w,h,col){ archFace(M,x,zc,0,s,0,0,y0,w,h,0,col,1); }      /* s=+1 faces +x */
  function faceZ(xc,z,s,y0,w,h,col){ archFace(M,xc,z,-s,0,0,0,y0,w,h,0,col,1); }       /* s=+1 faces +z */
  function trackY(x){ return x<=XR?0:-DEPTH*Math.min(1,(x-XR)/(XP-XR)); }

  /* streets that cross the median at grade: the gravel stops for them */
  var cross=[];
  for(var i=0;i<ROADS.length;i++){ var p=ROADS[i].pts;
    for(var k=0;k<p.length-1;k++){ var a=p[k], b=p[k+1];
      if((a[1]-ZC)*(b[1]-ZC)<=0&&a[1]!==b[1]){ var t=(ZC-a[1])/(b[1]-a[1]); cross.push([a[0]+(b[0]-a[0])*t,ROADS[i].w*0.5+2.5]); } } }
  function atCrossing(x){ for(var q=0;q<cross.length;q++) if(Math.abs(x-cross[q][0])<cross[q][1]) return true; return false; }

  /* ---- the Exposition carriageways west of the map data ---- */
  var EW=-1137;
  [[251.6,0],[272,0]].forEach(function(r){
    ribbon(MG,[[XW,r[0]],[EW,r[0]]],11.6,0.045,0xB3ADA0,0.96);
    ribbon(MG,[[XW,r[0]],[EW,r[0]]],9,0.07,C_ROAD,1);
  });

  /* ---- median: gravel between concrete curbs, rails on a concrete slab ---- */
  for(var x=XW;x<XT0;x+=6){
    var x2=Math.min(x+6,XT0), xm=(x+x2)/2;
    if(atCrossing(xm)) continue;
    if(xm>ST-SH-2&&xm<ST+SH+2) continue;                     /* the platforms fill it there */
    flat(MG,rect(x,256.9,x2,266.7),0.05,BAL,0.94+((x/6|0)%3)*0.02);
    box(x,x2,256.7,257.1,0,0.2,0xBDB9B0,0.7); box(x,x2,266.5,266.9,0,0.2,0xBDB9B0,0.7);
  }
  [TN,TS].forEach(function(tz){
    /* at grade: the slab and the two rails, then down the ramp into the trench */
    flat(MG,rect(XW,tz-1.5,XR,tz+1.5),0.06,SLAB,1);
    for(var s=-1;s<=1;s+=2){
      segBox(M,[XW,tz+s*0.72],[XR,tz+s*0.72],0.07,0.2,0.08,STEEL,0.8);
      segBox(M,[XW,tz+s*0.72],[XR,tz+s*0.72],0.2,0.23,0.07,RAILTOP,0.9);
      beam([XR,0.2,tz+s*0.72],[XP+2,-DEPTH+0.2,tz+s*0.72],0.1,STEEL,0.8);
    }
    /* sleepers near the station, where you can see them */
    for(var sx=ST-SH-60;sx<ST+SH+60;sx+=0.9) box(sx-0.12,sx+0.12,tz-1.25,tz+1.25,0.06,0.1,0x6A655D,0.7);
  });

  /* ---- the trench and the portal under Figueroa ---- */
  var TZ0=257.8, TZ1=265.8;
  (function(){
    var cF=rgb(SLAB,0.9), cW=rgb(0xA9A59C,1), cWd=rgb(0x8E8A82,1);
    /* floor: level to the ramp head, then down */
    M.quad([XT0,0,TZ0],[XT0,0,TZ1],[XR,0,TZ1],[XR,0,TZ0],cF,cF,cF,cF);
    M.quad([XR,0,TZ0],[XR,0,TZ1],[XP,-DEPTH,TZ1],[XP,-DEPTH,TZ0],cF,cF,cF,cF);
    /* retaining walls, faces looking into the trench */
    M.quad([XT0,-0.2,TZ0],[XP,-DEPTH,TZ0],[XP,0,TZ0],[XT0,0,TZ0],cW,cW,cW,cW);
    M.quad([XP,-DEPTH,TZ1],[XT0,-0.2,TZ1],[XT0,0,TZ1],[XP,0,TZ1],cWd,cWd,cWd,cWd);
    /* parapets with a fence on top */
    [[TZ0-0.5,TZ0],[TZ1,TZ1+0.5]].forEach(function(z){
      box(XT0,XP,z[0],z[1],0,1.05,0xBDB9B0,0.7); solid(rect(XT0,z[0],XP,z[1]),1.05);
      for(var fx=XT0;fx<=XP;fx+=3) postAt(M,fx,(z[0]+z[1])/2,1.05,2.4,0.04,0x55595C,0.8);
      segBox(M,[XT0,(z[0]+z[1])/2],[XP,(z[0]+z[1])/2],2.3,2.4,0.05,0x55595C,0.8);
    });
    solid(rect(XT0+10,TZ0,XT0+10.4,TZ1),1.2); box(XT0+10,XT0+10.4,TZ0,TZ1,0,1.2,0xE0B03A,0.8);
    /* the portal: a concrete headwall with two dark mouths, the street carried over it */
    box(XP,XP+2.0,TZ0-0.5,TZ1+0.5,-DEPTH,0.9,0xB3AFA6,0.66);
    [TN,TS].forEach(function(tz){ faceX(XP-0.02,tz,-1,-DEPTH,3.9,6.1,0x121416); });
    faceX(XP-0.03,ZC,-1,-1.0,TZ1-TZ0,0.9,0xC4C0B6);
    facadeText('METRO E LINE',XP-0.05,ZC,-1,0,-0.45,6,0.56,'#3A3A3A');
  })();

  /* ---- overhead contact system: poles in the median, a wire over each track ---- */
  for(x=XW+20;x<XR;x+=58){
    if(atCrossing(x)||(x>ST-SH-4&&x<ST+SH+4)) continue;
    postAt(M,x,ZC,0,7.3,0.16,POLE,0.7);
    segBox(M,[x,TN-0.6],[x,TS+0.6],6.55,6.7,0.12,POLE,0.75);
    cols.push([rect(x-0.3,ZC-0.3,x+0.3,ZC+0.3),7.3]);
  }
  [ST-SH-1.5,ST+SH+1.5].forEach(function(x){
    postAt(M,x,ZC,0,7.3,0.16,POLE,0.7); segBox(M,[x,TN-0.6],[x,TS+0.6],6.55,6.7,0.12,POLE,0.75); });
  [TN,TS].forEach(function(tz){
    segBox(M,[XW,tz],[XR,tz],5.72,5.77,0.03,0x2B2B2B,0.8);
    segBox(M,[XW,tz],[XR,tz],6.72,6.76,0.025,0x2B2B2B,0.8);
    beam([XR,5.75,tz],[XP,-DEPTH+5.75,tz],0.03,0x2B2B2B,0.8);
  });

  /* ================================= Expo Park/USC station ================= */
  var X0=ST-SH, X1=ST+SH;
  flat(MG,rect(X0-8,258.2,X1+8,265.4),0.05,BAL,0.95);
  var PLAT=[[TN-5.6,TN-1.55,-1],[TS+1.55,TS+5.6,1]];            /* [z0,z1,side away from the tracks] */
  PLAT.forEach(function(P){
    var z0=P[0], z1=P[1], out=P[2], edge=out<0?z1:z0, back=out<0?z0:z1;
    prism(M,rect(X0,z0,X1,z1),0,PH,CONC,CONCT,0.7); solid(rect(X0,z0,X1,z1),PH);
    /* yellow tactile strip and a white line at the edge */
    var e0=out<0?edge-0.62:edge, e1=out<0?edge:edge+0.62;
    flat(M,rect(X0,e0,X1,e1),PH+0.006,YEL,1);
    /* ramps down to the crosswalks at both ends */
    [[X0,-1],[X1,1]].forEach(function(r){
      for(var s2=0;s2<5;s2++){ var hh=PH-0.19*(s2+1);
        var ra=r[1]<0?rect(r[0]-(s2+1)*1.6,z0,r[0],z1):rect(r[0],z0,r[0]+(s2+1)*1.6,z1);
        if(hh>0.02){ prism(M,ra,0,hh,CONC,CONCT,0.7); solid(ra,hh); } }
    });
    /* railing along the back */
    var bz=back+(out<0?0.12:-0.12);
    segBox(M,[X0,bz],[X1,bz],PH+1.0,PH+1.07,0.06,0x9EA3A7,0.8);
    for(var rx=X0;rx<=X1;rx+=2.5) postAt(M,rx,bz,PH,PH+1.05,0.03,0x9EA3A7,0.8);
    /* canopies: steel posts at the back carrying wavy perforated panels */
    var cz0=z0+0.2, cz1=z1-0.2, pz=back+(out<0?0.9:-0.9);
    for(var cx=X0+6;cx<X1-4;cx+=10.5){
      postAt(M,cx-3,pz,PH,PH+4.0,0.13,POLE,0.72); postAt(M,cx+3,pz,PH,PH+4.0,0.13,POLE,0.72);
      segBox(M,[cx-3,cz0],[cx-3,cz1],PH+3.85,PH+4.0,0.12,POLE,0.8);
      segBox(M,[cx+3,cz0],[cx+3,cz1],PH+3.85,PH+4.0,0.12,POLE,0.8);
      var cA=rgb(CAN,1), cB=rgb(CAN,0.78);
      for(var k2=0;k2<14;k2++){
        var u0=cx-4.7+k2*0.67, u1=u0+0.67, y0=PH+4.05+0.32*Math.sin(k2*1.25), y1=PH+4.05+0.32*Math.sin((k2+1)*1.25);
        var c=(k2%2)?cA:cB;
        M.quad([u0,y0,cz0],[u0,y0,cz1],[u1,y1,cz1],[u1,y1,cz0],c,c,c,c);
        M.quad([u0,y0,cz0],[u1,y1,cz0],[u1,y1,cz1],[u0,y0,cz1],cB,cB,cB,cB);
      }
      cols.push([rect(cx-3.2,pz-0.2,cx-2.8,pz+0.2),PH+4]); cols.push([rect(cx+2.8,pz-0.2,cx+3.2,pz+0.2),PH+4]);
    }
    /* benches, ticket machines, a trash can, arrival displays */
    [X0+14,ST,X1-14].forEach(function(bx){
      var bz2=back+(out<0?1.5:-1.5);
      box(bx-1.1,bx+1.1,bz2-0.25,bz2+0.25,PH+0.42,PH+0.5,0x9EA3A7,0.8);
      box(bx-1.0,bx-0.9,bz2-0.2,bz2+0.2,PH,PH+0.42,0x55595C,0.7); box(bx+0.9,bx+1.0,bz2-0.2,bz2+0.2,PH,PH+0.42,0x55595C,0.7);
    });
    [X0+4,X1-4].forEach(function(tx){
      var tz=back+(out<0?1.0:-1.0);
      box(tx-0.45,tx+0.45,tz-0.3,tz+0.3,PH,PH+1.85,0x2A2F36,0.7);
      box(tx-0.45,tx+0.45,tz-0.3,tz+0.3,PH+1.85,PH+2.0,0x1E73BE,0.8);
      faceZ(tx,tz-out*0.31,-out,PH+0.9,0.55,0.45,0x7FB6E0);
      cols.push([rect(tx-0.5,tz-0.35,tx+0.5,tz+0.35),PH+2]);
    });
    postAt(M,ST+7,back+(out<0?1.2:-1.2),PH,PH+0.95,0.28,0x3A3D40,0.7);
    [ST-16,ST+16].forEach(function(dx){
      var dz=(edge+back)/2;
      postAt(M,dx,dz,PH+3.4,PH+3.85,0.04,POLE,0.8);
      box(dx-1.2,dx+1.2,dz-0.18,dz+0.18,PH+2.85,PH+3.4,0x111315,0.7);
      facadeText(out<0?'Santa Monica  2 min':'Downtown LA  4 min',dx,dz-out*0.19,0,-out,PH+3.12,2.2,0.3,'#FF9A2E');
    });
    /* station name boards at each end, facing the tracks */
    [X0+2.5,X1-2.5].forEach(function(nx){
      var nz=back+(out<0?0.6:-0.6);
      postAt(M,nx-1.0,nz,PH,PH+2.8,0.05,0x3A3D40,0.8); postAt(M,nx+1.0,nz,PH,PH+2.8,0.05,0x3A3D40,0.8);
      box(nx-1.3,nx+1.3,nz-0.08,nz+0.08,PH+2.0,PH+2.75,0x141618,0.7);
      facadeText('Expo Park/USC',nx,nz-out*0.09,0,-out,PH+2.38,2.4,0.5,'#FFFFFF');
    });
  });
  /* the Metro pylon at the Trousdale end */
  (function(){
    var px=X0-9, pz=254.3;
    box(px-0.35,px+0.35,pz-0.35,pz+0.35,0,4.6,0x1A1C1E,0.7);
    box(px-0.6,px+0.6,pz-0.1,pz+0.1,3.6,4.8,0x1A1C1E,0.7);
    var d1=new T.Mesh(new T.CircleGeometry(0.46,20),new T.MeshBasicMaterial({color:0xFFFFFF}));
    d1.position.set(px,4.2,pz+0.12); scene.add(d1);
    var d2=d1.clone(); d2.position.z=pz-0.12; d2.rotation.y=Math.PI; scene.add(d2);
    [1,-1].forEach(function(s){ facadeText('M',px,pz+s*0.13,0,s,4.2,1.0,0.6,'#111111'); });
    cols.push([rect(px-0.6,pz-0.4,px+0.6,pz+0.4),4.8]);
  })();

  /* ============================ the train: three cars for Santa Monica ===== */
  (function(){
    var tz=TN, hw=1.33, y0=0.55, y1=3.75, CARL=27.0, GAP=0.55, xf=X0+0.8;
    var cS=rgb(WHITE,1), cY=YEL;
    for(var c=0;c<3;c++){
      var a=xf+c*(CARL+GAP), b=a+CARL;
      box(a,b,tz-hw,tz+hw,y0,y1,WHITE,0.82);
      box(a+0.1,b-0.1,tz-hw+0.05,tz+hw-0.05,y1,y1+0.12,0xB9BCBE,0.85);            /* roof */
      box(a+0.3,b-0.3,tz-hw+0.08,tz+hw-0.08,0.1,y0,0x2D3034,0.7);                /* underframe */
      [a+3.4,a+CARL/2,b-3.4].forEach(function(bx){ box(bx-1.3,bx+1.3,tz-1.1,tz+1.1,0.0,0.55,0x222427,0.6); });
      [-1,1].forEach(function(s){
        var zf=tz+s*(hw+0.01);
        faceZ((a+b)/2,zf,s,y0,CARL,0.35,0x5F6366);                                 /* skirt */
        faceZ((a+b)/2,zf+s*0.005,s,0.95,CARL,0.26,YEL);                            /* yellow line */
        faceZ((a+b)/2,zf+s*0.005,s,1.95,CARL-1.2,1.05,DARK);                       /* window band */
        for(var wx=a+1.2;wx<b-1;wx+=1.9) faceZ(wx,zf+s*0.01,s,1.95,0.12,1.05,WHITE);
        [a+4.0,a+10.6,b-10.6,b-4.0].forEach(function(dx){                         /* doors */
          faceZ(dx,zf+s*0.015,s,0.9,1.5,2.2,0xC9CDCF);
          faceZ(dx-0.37,zf+s*0.02,s,1.9,0.55,0.95,0x2A3036); faceZ(dx+0.37,zf+s*0.02,s,1.9,0.55,0.95,0x2A3036);
          faceZ(dx,zf+s*0.02,s,0.9,0.04,2.2,0x55595C);
        });
      });
      /* roof boxes and a pantograph up to the wire */
      box(a+4,a+7,tz-0.8,tz+0.8,y1+0.12,y1+0.5,0x9FA3A6,0.75);
      box(b-7,b-4,tz-0.8,tz+0.8,y1+0.12,y1+0.5,0x9FA3A6,0.75);
      if(c!==1){ var pm=(a+b)/2;
        box(pm-0.9,pm+0.9,tz-0.6,tz+0.6,y1+0.12,y1+0.35,0x55595C,0.7);
        beam([pm-0.7,y1+0.35,tz],[pm+0.5,4.85,tz],0.08,0x3A3D40,0.8);
        beam([pm+0.5,4.85,tz],[pm-0.1,5.66,tz],0.07,0x3A3D40,0.8);
        segBox(M,[pm-0.1,tz-0.8],[pm-0.1,tz+0.8],5.62,5.7,0.08,0x3A3D40,0.8); }
      if(c<2) box(b,b+GAP,tz-1.05,tz+1.05,0.8,3.4,0x1A1A1A,0.7);                 /* gangway */
    }
    /* the two cab ends: Metro gold, a big black windshield, headlights, the sign */
    [[xf,-1],[xf+3*CARL+2*GAP,1]].forEach(function(e){
      var ex=e[0], s=e[1], fx=ex+s*0.01, zc=tz;
      box(Math.min(ex,ex-s*1.6),Math.max(ex,ex-s*1.6),tz-hw-0.012,tz+hw+0.012,y0,y1,YEL,0.85);
      faceX(fx,zc,s,y0,2.66,3.2,YEL);
      faceX(fx+s*0.01,zc,s,1.95,2.3,1.4,0x16191C);
      faceX(fx+s*0.01,zc,s,3.38,2.0,0.3,0x0B0B0B);
      faceX(fx+s*0.02,zc-0.85,s,1.05,0.34,0.22,0xF5F2E4); faceX(fx+s*0.02,zc+0.85,s,1.05,0.34,0.22,0xF5F2E4);
      faceX(fx+s*0.02,zc-0.85,s,0.8,0.3,0.14,0xB0231E);  faceX(fx+s*0.02,zc+0.85,s,0.8,0.3,0.14,0xB0231E);
      faceX(fx+s*0.02,zc,s,1.35,0.5,0.5,0x111111);
      box(Math.min(ex,ex+s*0.3),Math.max(ex,ex+s*0.3),tz-1.2,tz+1.2,0.35,0.75,0x2B2E31,0.7);  /* coupler bumper */
      facadeText(s<0?'SANTA MONICA':'DOWNTOWN LA',fx+s*0.03,zc,s,0,3.53,1.9,0.26,'#FF9433');
      facadeText('M',fx+s*0.03,zc,s,0,1.6,0.8,0.45,'#FFFFFF');
    });
    cols.push([rect(xf-0.4,tz-hw,xf+3*CARL+2*GAP+0.4,tz+hw),y1]);
  })();

  cols.forEach(function(c){ addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  NAMED_PLACES.push({name:'Expo Park/USC Station (Metro E Line)',x:ST,z:ZC,h:5,rad:30});
  window.__metro={cross:cross.length};
})();
