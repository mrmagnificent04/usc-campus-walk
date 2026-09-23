const {chromium}=require('playwright');
require('fs').mkdirSync('snap',{recursive:true});
// usage: node snap.js prefix  (reads shots from shots.json)
(async()=>{
  const pre=process.argv[2]||'x', file=process.argv[3]||'test.html';
  const shots=JSON.parse(require('fs').readFileSync('shots.json','utf8'));
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:560}}); p.setDefaultTimeout(300000);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'||m.text().startsWith('[dbg]'))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/'+file,{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#play:not([disabled])');
  await p.click('#play'); await p.waitForTimeout(3000);
  for(const s of shots){
    await p.evaluate(s=>window.__cam(s[1],s[2],s[3],s[4],s[5],s[6]),s);
    await p.waitForTimeout(1800);
    await p.screenshot({path:'snap/'+pre+'_'+s[0]+'.png'});
  }
  console.log('ERRORS:',errs.length?errs.slice(0,8).join(' | '):'none');
  await b.close();
})();
