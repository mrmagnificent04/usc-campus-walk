const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(300000);
  await p.goto('file://'+process.cwd()+'/testdev.html',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#play:not([disabled])');
  const r=await p.evaluate(()=>{
    const D=window.__dbg, out=[];
    for(const nm of ['Leavey Library','Doheny Memorial Library']){
      const B=D.CAMPUS.find(b=>b.name===nm);
      const ring=B.ring;
      function inR(x,z){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],q=ring[j];if(((a[1]>z)!==(q[1]>z))&&(x<(q[0]-a[0])*(z-a[1])/(q[1]-a[1])+a[0]))c=!c;}return c;}
      function dist(x,z){let best=1e9;for(let i=0;i<ring.length;i++){const a=ring[i],q=ring[(i+1)%ring.length];const dx=q[0]-a[0],dz=q[1]-a[1],L2=dx*dx+dz*dz;let t=((x-a[0])*dx+(z-a[1])*dz)/L2;t=Math.max(0,Math.min(1,t));best=Math.min(best,Math.hypot(a[0]+dx*t-x,a[1]+dz*t-z));}return inR(x,z)?-best:best;}
      const near=D.TREE_POS.map((t,i)=>[i,t[0].toFixed(1),t[1].toFixed(1),t[2],t[3]||'',dist(t[0],t[1]).toFixed(1)]).filter(t=>+t[5]<9);
      out.push({nm,ring:JSON.stringify(ring),near});
    }
    return out;
  });
  console.log(JSON.stringify(r,null,0));
  await b.close();
})();
