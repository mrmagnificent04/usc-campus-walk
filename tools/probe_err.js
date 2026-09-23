const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(200000);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/testdev.html',{waitUntil:'domcontentloaded'});
  const t0=Date.now();
  try{ await p.waitForSelector('#play:not([disabled])',{timeout:150000}); }catch(e){ console.log('no play'); }
  console.log('ready ms',Date.now()-t0, await p.evaluate(()=>JSON.stringify(window.__rose)));
  console.log(errs.slice(0,5).join('\n'));
  await b.close();
})();
