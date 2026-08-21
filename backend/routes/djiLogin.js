import { Router } from 'express';
import config from '../config/index.js';

const router = Router();

router.get('/login', (req, res) => {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>FlyBy — DJI Cloud Login</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#0F172A;color:#F8FAFC;min-height:100vh;display:flex;align-items:center;justify-content:center}.c{max-width:360px;width:100%;padding:40px 24px}.logo{font-size:2rem;font-weight:900;letter-spacing:-0.04em;margin-bottom:8px}.logo span{color:#16A34A}.sub{font-size:0.75rem;color:#94A3B8;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:32px}.t{font-size:1.1rem;font-weight:600;margin-bottom:24px}.f{margin-bottom:16px}.f label{display:block;font-size:0.75rem;color:#94A3B8;margin-bottom:6px}.f input{width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#F8FAFC;font-size:0.9rem;outline:none}.f input:focus{border-color:#16A34A}.btn{width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(135deg,#16A34A,#22C55E);color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;margin-top:8px}.btn:disabled{opacity:0.5;cursor:not-allowed}.st{margin-top:16px;font-size:0.8rem;color:#94A3B8;text-align:center}.err{color:#EF4444}.ok{color:#16A34A}</style>
</head><body><div class="c">
<div class="logo">FLY<span>BY</span></div><div class="sub">Precision Agriculture from Above</div>
<div class="t">Connect to FlyBy Cloud</div>
<div class="f"><label>Email</label><input type="email" id="e" placeholder="pilot@example.com"/></div>
<div class="f"><label>Password</label><input type="password" id="p" placeholder="Your FlyBy password"/></div>
<button class="btn" id="b" onclick="go()">Connect</button>
<div class="st" id="s"></div>
</div><script>
async function go(){var e=document.getElementById('e').value,p=document.getElementById('p').value,s=document.getElementById('s'),b=document.getElementById('b');if(!e||!p){s.textContent='Enter credentials';s.className='st err';return}b.disabled=true;s.textContent='Authenticating...';s.className='st';try{var r=await fetch('/pilot/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});var d=await r.json();if(!r.ok||!d.access_token){s.textContent=d.message||'Failed';s.className='st err';b.disabled=false;return}s.textContent='Connected! Workspace: '+d.workspace_name;s.className='st ok';if(window.djiBridge){window.djiBridge.platformVerifyLicense('${config.dji.appId}','${config.dji.appKey}','${config.dji.appLicense}');window.djiBridge.platformSetWorkspaceId(d.workspace_id);window.djiBridge.platformSetInformation('FlyBy',d.workspace_name||'FlyBy','Precision Agriculture from Above')}}catch(err){s.textContent='Error: '+err.message;s.className='st err';b.disabled=false}}
</script></body></html>`;
  res.type('html').send(html);
});

export default router;
