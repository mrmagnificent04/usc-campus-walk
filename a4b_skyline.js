/* ==================================================================
   Downtown Los Angeles on the horizon, and the San Gabriel Mountains
   behind it. Downtown is about 4 km north-east of Tommy Trojan, out
   past the far clipping plane, so it is drawn as a backdrop: the whole
   skyline is scaled about the eye each frame (which leaves the picture
   exactly as a full size skyline 4 km away would look) and set down
   about 1.9 km out. The mountains ride on a ring round the eye.
   Tower positions are from their real latitude and longitude.
   ================================================================== */
(function(){
  var LAT0=34.02056, LON0=-118.28545, KX=92000, KZ=111000;
  function P(lat,lon){ return [(lon-LON0)*KX, -(lat-LAT0)*KZ]; }
  var DTC=P(34.0500,-118.2570), DDIST=1750, BOOST=1.7;   /* drawn a little larger than life, the way it reads from campus */
  var L=new T.Vector3(260,560,380).normalize(), HAZE=new T.Color(0xC4DCEE), cT=new T.Color();
  var pos=[], col=[], uv=[];
  function shade(hex,nx,ny,nz,haze){
    var l=0.60+0.42*Math.max(0,nx*L.x+ny*L.y+nz*L.z);
    cT.setHex(hex).multiplyScalar(l).lerp(HAZE,haze===undefined?0.2:haze); return cT;
  }
  function tri(A,B,C,c,ua,ub,uc){
    pos.push(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2]);
    for(var i=0;i<3;i++) col.push(c.r,c.g,c.b);
    uv.push(ua[0],ua[1],ub[0],ub[1],uc[0],uc[1]);
  }
  /* an upright prism on any ring (counter-clockwise in x,z), windows on the walls */
  function prismRing(ring,y0,y1,hex,topHex,noWin){
    var n=ring.length, run=0;
    for(var i=0;i<n;i++){
      var a=ring[i], b=ring[(i+1)%n], dx=b[0]-a[0], dz=b[1]-a[1], Ln=Math.hypot(dx,dz);
      var nx=dz/Ln, nz=-dx/Ln, c=shade(hex,nx,0,nz).clone();
      var u0=noWin?0:run/5.5, u1=noWin?0:(run+Ln)/5.5, v0=noWin?0:y0/4.2, v1=noWin?0:y1/4.2;
      var A=[a[0]-DTC[0],y0,a[1]-DTC[1]], B=[a[0]-DTC[0],y1,a[1]-DTC[1]], C=[b[0]-DTC[0],y1,b[1]-DTC[1]], D=[b[0]-DTC[0],y0,b[1]-DTC[1]];
      tri(A,B,C,c,[u0,v0],[u0,v1],[u1,v1]); tri(A,C,D,c,[u0,v0],[u1,v1],[u1,v0]);
      run+=Ln;
    }
    var ct=shade(topHex||hex,0,1,0).clone(), z0=[0,0];
    for(i=1;i<n-1;i++){
      var p0=ring[0], p1=ring[i], p2=ring[i+1];
      tri([p0[0]-DTC[0],y1,p0[1]-DTC[1]],[p2[0]-DTC[0],y1,p2[1]-DTC[1]],[p1[0]-DTC[0],y1,p1[1]-DTC[1]],ct,z0,z0,z0);
    }
  }
  function rectRing(cx,cz,w,d,rot){
    var c=Math.cos(rot||0), s=Math.sin(rot||0), h=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
    var r=h.map(function(p){ return [cx+p[0]*c-p[1]*s, cz+p[0]*s+p[1]*c]; });
    if(ringArea(r)<0) r.reverse(); return r;
  }
  function circRing(cx,cz,r,n,sx,sz){ var o=[]; for(var i=0;i<n;i++){ var a=i/n*Math.PI*2; o.push([cx+Math.cos(a)*r*(sx||1),cz+Math.sin(a)*r*(sz||1)]); } return o; }
  function chamfer(cx,cz,w,d,k,rot){
    var c=Math.cos(rot||0), s=Math.sin(rot||0), a=w/2, b=d/2;
    var h=[[-a+k,-b],[a-k,-b],[a,-b+k],[a,b-k],[a-k,b],[-a+k,b],[-a,b-k],[-a,-b+k]];
    var r=h.map(function(p){ return [cx+p[0]*c-p[1]*s, cz+p[0]*s+p[1]*c]; });
    if(ringArea(r)<0) r.reverse(); return r;
  }
  function pyramid(cx,cz,w,d,y0,y1,hex,rot){
    var r=rectRing(cx,cz,w,d,rot), ap=[cx-DTC[0],y1,cz-DTC[1]], z0=[0,0];
    for(var i=0;i<4;i++){ var a=r[i], b=r[(i+1)%4];
      var mx=(a[0]+b[0])/2-cx, mz=(a[1]+b[1])/2-cz, ml=Math.hypot(mx,mz)||1;
      var c=shade(hex,mx/ml*0.7,0.7,mz/ml*0.7).clone();
      tri([a[0]-DTC[0],y0,a[1]-DTC[1]],ap,[b[0]-DTC[0],y0,b[1]-DTC[1]],c,z0,z0,z0); }
  }
  var ROT=-0.62;      /* the downtown street grid */

  /* ------------------------------------------------ the named towers */
  var p;
  p=P(34.0501,-118.2605);  /* Wilshire Grand Center */
  prismRing(chamfer(p[0],p[1],58,34,6,ROT),0,262,0x6F9BBF);
  prismRing(chamfer(p[0],p[1],48,28,6,ROT),262,284,0x86B0CF);
  pyramid(p[0],p[1],40,20,284,300,0x9CC2DB,ROT);
  prismRing(rectRing(p[0],p[1],2,2,ROT),290,335,0xD8DDE0,0,true);
  p=P(34.0512,-118.2541);  /* U.S. Bank Tower */
  prismRing(circRing(p[0],p[1],27,18),0,236,0xBDB7AA);
  prismRing(circRing(p[0],p[1],23,18),236,276,0xC7C1B4);
  prismRing(circRing(p[0],p[1],19,18),276,296,0xC9DCE6);
  prismRing(circRing(p[0],p[1],14,14),296,310,0xE2EEF4,0,true);
  p=P(34.0493,-118.2571);  /* Aon Center */
  prismRing(rectRing(p[0],p[1],52,38,ROT),0,262,0x2D323B);
  [[-26,-19],[26,-19],[26,19],[-26,19]].forEach(function(o){
    var c=Math.cos(ROT), s=Math.sin(ROT);
    prismRing(rectRing(p[0]+o[0]*c-o[1]*s,p[1]+o[0]*s+o[1]*c,2.4,2.4,ROT),0,264,0xE6E6E2,0,true); });
  p=P(34.0526,-118.2507);  /* Two California Plaza */
  prismRing(chamfer(p[0],p[1],42,42,9,ROT),0,215,0x7F968F);
  prismRing(circRing(p[0],p[1],13,12),215,229,0x93AAA3);
  p=P(34.0534,-118.2512);  /* One California Plaza */
  prismRing(chamfer(p[0],p[1],40,40,8,ROT),0,176,0x7C918A);
  p=P(34.0497,-118.2551);  /* Gas Company Tower */
  prismRing(rectRing(p[0],p[1],50,34,ROT),0,196,0x5D7C98);
  prismRing(rectRing(p[0],p[1],40,26,ROT),196,216,0x6A89A4);
  prismRing(rectRing(p[0],p[1],26,14,ROT),216,228,0x3D7FA6,0,true);
  p=P(34.0553,-118.2525);  /* Bank of America Plaza */
  prismRing(rectRing(p[0],p[1],44,44,ROT),0,224,0x45474C);
  p=P(34.0474,-118.2609);  /* 777 Tower */
  prismRing(chamfer(p[0],p[1],46,34,9,ROT),0,221,0xC9CFD4);
  p=P(34.0521,-118.2547);  /* Wells Fargo Center, north */
  prismRing(chamfer(p[0],p[1],38,38,7,ROT),0,220,0x6A4034);
  p=P(34.0529,-118.2539);  /* Wells Fargo Center, south */
  prismRing(chamfer(p[0],p[1],34,34,6,ROT),0,191,0x6E4538);
  p=P(34.0486,-118.2593);  /* Figueroa at Wilshire */
  prismRing(chamfer(p[0],p[1],42,42,6,ROT),0,203,0x8C7A58);
  pyramid(p[0],p[1],36,36,203,219,0x9C8A66,ROT);
  p=P(34.0512,-118.2579);  /* City National Plaza, the twin towers */
  prismRing(rectRing(p[0],p[1],40,40,ROT),0,213,0x26282C);
  p=P(34.0503,-118.2585);
  prismRing(rectRing(p[0],p[1],40,40,ROT),0,213,0x26282C);
  p=P(34.0489,-118.2604);  /* Ernst & Young Plaza */
  prismRing(rectRing(p[0],p[1],40,40,ROT),0,163,0x5E4B3F);
  p=P(34.0513,-118.2560);  /* FourFortyFour South Flower */
  prismRing(rectRing(p[0],p[1],38,38,ROT),0,191,0x33373D);
  p=P(34.0540,-118.2556);  /* Wedbush Center */
  prismRing(chamfer(p[0],p[1],40,30,6,ROT),0,157,0xB9B4A6);
  p=P(34.0500,-118.2548);  /* 555 West Fifth */
  prismRing(rectRing(p[0],p[1],36,36,ROT),0,169,0x8FA0AE);
  p=P(34.0555,-118.2503);  /* The Grand */
  prismRing(chamfer(p[0],p[1],34,26,5,ROT+0.3),0,206,0xE3DED3);
  prismRing(chamfer(p[0]+40,p[1]+10,30,24,5,ROT+0.3),0,120,0xE3DED3);
  p=P(34.0523,-118.2632);  /* 1100 Wilshire */
  prismRing(chamfer(p[0],p[1],34,26,8,ROT),0,168,0x9DB0B8);
  p=P(34.0450,-118.2666);  /* JW Marriott and Ritz-Carlton, L.A. Live */
  prismRing(rectRing(p[0],p[1],52,30,ROT),0,200,0x5E88B0);
  [[34.0428,-118.2632,190],[34.0425,-118.2640,160],[34.0433,-118.2640,150]].forEach(function(o){   /* Oceanwide Plaza */
    var q=P(o[0],o[1]); prismRing(rectRing(q[0],q[1],32,26,ROT),0,o[2],0xA8A8A2); });
  [[34.0467,-118.2642,180],[34.0473,-118.2651,160],[34.0461,-118.2652,140],[34.0476,-118.2640,120]].forEach(function(o){ /* Metropolis */
    var q=P(o[0],o[1]); prismRing(chamfer(q[0],q[1],30,30,6,ROT),0,o[2],0x7FA7B4); });
  [[34.0425,-118.2658,125],[34.0421,-118.2663,125]].forEach(function(o){ var q=P(o[0],o[1]); prismRing(chamfer(q[0],q[1],28,24,5,ROT),0,o[2],0xD9D6CE); });
  p=P(34.0537,-118.2427);  /* City Hall */
  prismRing(rectRing(p[0]-36,p[1]+10,90,32,ROT),0,40,0xE8E4D8);
  prismRing(rectRing(p[0],p[1],34,34,ROT),0,112,0xEDEAE0);
  prismRing(rectRing(p[0],p[1],24,24,ROT),112,126,0xEDEAE0);
  pyramid(p[0],p[1],18,18,126,138,0xDCD6C6,ROT);

  /* ------------------------------------------------ the rest of the core */
  var TOWN=[], FILL=[0x9FB3C4,0xB9B4A6,0x7F8C99,0xC9C4B8,0x8E9DA8,0xD8D2C4,0x6E7C88,0xA9A08E,0x5E6E7E,0xCFD6DA];
  function h2(a,b){ var x=Math.sin(a*12.9898+b*78.233)*43758.5453; return x-Math.floor(x); }
  var c=Math.cos(ROT), s=Math.sin(ROT), core=P(34.0505,-118.2565);
  for(var gi=-9;gi<=9;gi++) for(var gj=-7;gj<=7;gj++){
    var hh=h2(gi+20,gj+40); if(hh<0.25) continue;
    var ox=gi*95+(h2(gi,gj)-0.5)*40, oz=gj*95+(h2(gj,gi)-0.5)*40;
    var x=core[0]+ox*c-oz*s, z=core[1]+ox*s+oz*c, rr=Math.hypot(ox,oz);
    var tall=Math.max(18, (170-rr*0.22)*Math.pow(h2(gi*3,gj*7),1.4)+20*h2(gi,gj*2));
    if(rr>900) tall*=0.5;
    prismRing(rectRing(x,z,26+h2(gi,9)*26,24+h2(9,gj)*22,ROT),0,tall,FILL[Math.floor(h2(gi*5,gj*3)*FILL.length)]);
  }

  /* ------------------------------------------------ one mesh, scaled about the eye */
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.computeBoundingSphere();
  var cv=document.createElement('canvas'); cv.width=32; cv.height=32;
  var q=cv.getContext('2d'); q.fillStyle='#ffffff'; q.fillRect(0,0,32,32);
  q.fillStyle='rgba(40,50,62,0.36)'; q.fillRect(0,20,32,9);
  q.fillStyle='rgba(40,50,62,0.10)'; for(var k=0;k<32;k+=8) q.fillRect(k,0,1,32);
  var tex=new T.CanvasTexture(cv); tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.anisotropy=4;
  var sky=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,map:tex,fog:false}));
  sky.frustumCulled=false; sky.userData.noShadow=true; sky.matrixAutoUpdate=false; sky.renderOrder=-5;
  var eye=new T.Vector3();
  sky.onBeforeRender=function(r,sc,cam){
    if(cam.far<100) return;
    eye.setFromMatrixPosition(cam.matrixWorld);
    var dx=DTC[0]-eye.x, dz=DTC[1]-eye.z, dist=Math.hypot(dx,dz), k=DDIST/dist;
    this.position.set(eye.x+dx*k, eye.y*(1-k), eye.z+dz*k);
    this.scale.setScalar(k*BOOST);
    this.updateMatrix(); this.updateMatrixWorld(true);
    this.modelViewMatrix.multiplyMatrices(cam.matrixWorldInverse,this.matrixWorld);
    this.normalMatrix.getNormalMatrix(this.modelViewMatrix);
  };
  scene.add(sky);

  /* ------------------------------------------------ the San Gabriels, on a ring round the eye */
  function ridge(R,b0,b1,elev,hexTop,hexBot,haze,skirt){
    var P2=[], C2=[], ct=new T.Color(), cb=new T.Color();
    ct.setHex(hexTop).lerp(HAZE,haze); var cf=new T.Color(FOG); cb.setHex(hexBot).lerp(cf,0.72);
    var prev=null;
    for(var b=b0;b<=b1+0.01;b+=1.2){
      var fade=skirt?1:Math.min(1,(b-b0)/14,(b1-b)/14), br=b*Math.PI/180, x=Math.sin(br)*R, z=-Math.cos(br)*R;
      var y=Math.tan((elev(b)+(skirt?0:0.12*Math.sin(b*3.1)+0.08*Math.sin(b*7.3)))*fade*Math.PI/180)*R;
      var cur=[x,y,z];
      if(prev){
        var shadeTop=skirt?1:0.9+0.1*Math.sin(b*0.9), c1=ct.clone().multiplyScalar(shadeTop);
        var yb=skirt?-300:-40;
        P2.push(prev[0],yb,prev[2], cur[0],yb,cur[2], cur[0],cur[1],cur[2]);
        P2.push(prev[0],yb,prev[2], cur[0],cur[1],cur[2], prev[0],prev[1],prev[2]);
        C2.push(cb.r,cb.g,cb.b, cb.r,cb.g,cb.b, c1.r,c1.g,c1.b, cb.r,cb.g,cb.b, c1.r,c1.g,c1.b, c1.r,c1.g,c1.b);

      }
      prev=cur;
    }
    var gg=new T.BufferGeometry();
    gg.setAttribute('position',new T.Float32BufferAttribute(P2,3));
    gg.setAttribute('color',new T.Float32BufferAttribute(C2,3));
    var m=new T.Mesh(gg,new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}));
    m.frustumCulled=false; m.userData.noShadow=true; m.renderOrder=-6;
    m.onBeforeRender=function(r,sc,cam){
      if(cam.far<100) return;
      eye.setFromMatrixPosition(cam.matrixWorld);
      this.position.copy(eye); if(skirt) this.scale.y=Math.max(1,(eye.y+80)/260);
      this.updateMatrix(); this.updateMatrixWorld(true);
      this.modelViewMatrix.multiplyMatrices(cam.matrixWorldInverse,this.matrixWorld);
    };
    scene.add(m);
  }
  /* a haze wall all the way round below the horizon, so flying high the land fades out instead of ending */
  ridge(2590,-180,180,function(){ return -0.9; },FOG,FOG,0,true);
  function hills(b,amp,f){ return amp*(0.55*Math.sin(b*0.21*f+0.7)+0.3*Math.sin(b*0.53*f+2.1)+0.18*Math.sin(b*1.37*f+0.3)); }
  /* the high range behind downtown, then the nearer foothills and the Hollywood Hills */
  ridge(2560,-75,110,function(b){ return Math.max(0.4,1.5+3.4*Math.exp(-Math.pow((b-30)/50,2))+hills(b,0.8,1)); },0x7A8EA6,0x62768C,0.32);
  ridge(2520,-80,20,function(b){ return Math.max(0.25,0.7+1.0*Math.exp(-Math.pow((b+30)/28,2))+hills(b,0.3,1.7)); },0x7D8A86,0x69756F,0.40);
  window.__skyline={tris:pos.length/9};
})();
