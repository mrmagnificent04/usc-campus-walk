/* ==================================================================
   Two open spaces kept the way they really are:
   - McCarthy Quad, in front of Leavey, is open lawn: no trees inside it;
   - the courtyard of Fertitta Hall is paved outdoor seating, round
     tables under market umbrellas, no trees.
   (NO_PLANT already keeps new planting out; this clears what came
   from elsewhere and builds the seating.)
   ================================================================== */
(function(){
  var M=new Mesher(), MG=new Mesher(), cols=[];
  function inside(r,x,z){ return r&&inRing(r,x,z); }
  var court=FERT_COURT, courtPad=offsetRing(FERT_COURT,1.5);
  for(var i=TREE_POS.length-1;i>=0;i--){ var t=TREE_POS[i];
    if(inside(MCQ_RING,t[0],t[1])||inside(courtPad,t[0],t[1])) TREE_POS.splice(i,1); }
  if(MCQ_RING) NO_LAWN_TREES.push(MCQ_RING);
  NO_LAWN_TREES.push(courtPad);

  /* the paving: pale concrete in a brick border, scored in a square grid */
  flat(MG,offsetRing(court,0.6),0.136,0x8F4E3C,0.95);
  flat(MG,court,0.142,0xCFC9BB,0.97);
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  court.forEach(function(p){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); });
  var inner=offsetRing(court,-2.6);
  /* round tables with four chairs, each under an umbrella */
  var UMB=[0x9B1C2C,0xEFE7D2,0x9B1C2C,0x2F4F46], n=0;
  for(var gx=x0+3;gx<x1-2;gx+=5.2) for(var gz=z0+3;gz<z1-2;gz+=5.2){
    var x=gx+((Math.floor(gz/5.2))%2)*2.6, z=gz;
    if(!inRing(inner,x,z)) continue;
    postAt(M,x,z,0,0.72,0.05,0x3A3A3A,0.8);
    var top=ngon(x,z,0.55,10,0); if(ringArea(top)<0) top.reverse();
    prism(M,top,0.72,0.77,0xE3E0DA,0xEDEAE4,0.8);
    for(var c=0;c<4;c++){ var a=c/4*Math.PI*2+0.4, cx=x+Math.cos(a)*1.0, cz=z+Math.sin(a)*1.0;
      postAt(M,cx,cz,0,0.45,0.2,0x3A3A3A,0.7);
      postAt(M,cx+Math.cos(a)*0.18,cz+Math.sin(a)*0.18,0.45,0.9,0.05,0x3A3A3A,0.7); }
    postAt(M,x,z,0.77,2.55,0.035,0x6E6E6E,0.8);
    coneRoof(M,x,z,1.55,2.3,0.55,UMB[n%UMB.length],8);
    cols.push([[[x-0.6,z-0.6],[x+0.6,z-0.6],[x+0.6,z+0.6],[x-0.6,z+0.6]],0.8]);
    n++;
  }
  /* a few planters with low shrubs along the edges, no trees */
  for(var e=0;e<court.length;e++){
    var a2=court[e], b2=court[(e+1)%court.length], L=Math.hypot(b2[0]-a2[0],b2[1]-a2[1]);
    if(L<9) continue;
    var ux=(b2[0]-a2[0])/L, uz=(b2[1]-a2[1])/L, nx=uz, nz=-ux;
    for(var s=4;s<L-3;s+=8){
      var px=a2[0]+ux*s-nx*1.3, pz=a2[1]+uz*s-nz*1.3;
      var pr=oriRect(px,pz,ux,uz,1.6,0.55);
      prism(M,pr,0,0.55,0xB9B2A2,0xB9B2A2,0.7);
      prism(M,oriRect(px,pz,ux,uz,1.45,0.42),0.55,0.95,0x4E7A3A,0x5E8C45,0.75);
      cols.push([pr,0.95]);
    }
  }
  cols.forEach(function(c){ if(ringArea(c[0])<0) c[0].reverse(); addCollider(c[0],c[1]); });
  var mw=new T.Mesh(M.geom(),matWorld); mw.frustumCulled=false; scene.add(mw);
  var mg=new T.Mesh(MG.geom(),matGround); mg.frustumCulled=false; scene.add(mg);
  window.__courts={tables:n};
})();
