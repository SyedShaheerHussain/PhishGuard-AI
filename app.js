const $=id=>document.getElementById(id);
const sb=(window.supabase&&!CFG.SUPABASE_URL.includes("YOUR-"))?supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY):null;
let total=0,bad=0;

// Matrix rain
const cv=$("rain"),cx=cv.getContext("2d");let cols,drops;
function size(){cv.width=innerWidth;cv.height=innerHeight;cols=Math.floor(cv.width/16);drops=Array(cols).fill(1)}
size();addEventListener("resize",size);
setInterval(()=>{cx.fillStyle="rgba(5,8,12,.08)";cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle="#00ff9d";cx.font="14px monospace";
drops.forEach((y,i)=>{cx.fillText(String.fromCharCode(0x30A0+Math.random()*96),i*16,y*16);drops[i]=y*16>cv.height&&Math.random()>.975?0:y+1})},50);

// Local heuristic fallback (works even if AI is down)
function heuristic(t){let s=0,r=[];const L=t.toLowerCase();
[[/urgent|immediately|suspend|locked|verify now/,25,"Urgent / threatening language"],
 [/https?:\/\/\d+\.\d+|bit\.ly|tinyurl|\.xyz|\.top|\.click/,30,"Suspicious link or domain"],
 [/password|otp|ssn|card number|login/,20,"Asks for credentials/sensitive data"],
 [/paypa1|g00gle|amaz0n|micros0ft/,35,"Look-alike brand spelling"],
 [/winner|prize|gift card|crypto|bitcoin/,20,"Too-good-to-be-true offer"]].forEach(([re,p,m])=>{if(re.test(L)){s+=p;r.push(m)}});
s=Math.min(100,s);return{score:s,verdict:s>60?"PHISHING":s>30?"SUSPICIOUS":"SAFE",reasons:r.length?r:["No obvious red flags"],tip:"Never click unknown links; verify via the official site."}}

async function analyze(text){
 try{const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
  if(!r.ok)throw 0;return await r.json()}catch{return heuristic(text)}}

function cls(v){return v==="PHISHING"?"bad":v==="SUSPICIOUS"?"warn":"safe"}
function show(d){
 $("result").classList.remove("hidden");const c=cls(d.verdict),col={bad:"#ff3b5c",warn:"#ffd23f",safe:"#00ff9d"}[c];
 const arc=$("arc");arc.style.stroke=col;arc.style.strokeDashoffset=327;
 requestAnimationFrame(()=>requestAnimationFrame(()=>arc.style.strokeDashoffset=327-327*d.score/100));
 let n=0;const iv=setInterval(()=>{n=Math.min(d.score,n+2);$("score").textContent=n;if(n>=d.score)clearInterval(iv)},20);
 $("verdict").textContent=d.verdict;$("verdict").className=c;
 $("reasons").innerHTML="";d.reasons.forEach(x=>{const li=document.createElement("li");li.textContent=x;$("reasons").append(li)});
 $("tip").textContent="💡 "+d.tip}

function addFeed(row,top=true){
 const li=document.createElement("li");li.className=cls(row.verdict);
 li.textContent=`${row.verdict} · ${row.score}/100`;const s=document.createElement("small");
 s.textContent=row.snippet;li.append(s);top?$("feed").prepend(li):$("feed").append(li);
 total++;if(row.verdict!=="SAFE")bad++;$("sTotal").textContent=total;$("sBad").textContent=bad}

$("scan").onclick=async()=>{const t=$("input").value.trim();if(!t)return;
 $("scan").disabled=true;$("result").classList.add("hidden");$("loader").classList.remove("hidden");
 const d=await analyze(t);$("loader").classList.add("hidden");$("scan").disabled=false;show(d);
 const row={snippet:t.slice(0,60).replace(/https?:\/\/\S+/g,"[link]"),score:d.score,verdict:d.verdict};
 if(sb){const{error}=await sb.from("scans").insert(row);if(error)addFeed(row)}else addFeed(row)};
$("demo").onclick=()=>$("input").value="URGENT: Your PayPa1 account is suspended! Verify your password now at http://paypa1-secure-login.xyz/verify or lose access in 24h.";

// Load history + realtime
if(sb){
 sb.from("scans").select("*").order("created_at",{ascending:false}).limit(20).then(({data})=>(data||[]).reverse().forEach(r=>addFeed(r)));
 sb.channel("scans").on("postgres_changes",{event:"INSERT",schema:"public",table:"scans"},p=>addFeed(p.new)).subscribe()}
