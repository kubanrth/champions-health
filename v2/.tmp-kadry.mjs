import puppeteer from 'puppeteer';
const b = await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const p = await b.newPage();
await p.setViewport({width:1440,height:900,deviceScaleFactor:2});
await p.goto('http://localhost:3000/champions-health/v2/zespol.html',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,900));
await p.screenshot({path:'temporary screenshots/zespol-header.png'});
await b.close(); console.log('shot ok');
