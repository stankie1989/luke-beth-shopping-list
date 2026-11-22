const $ = (s) => document.querySelector(s);
const state = {
  user: localStorage.getItem("lb-user") || "Luke",
  theme: localStorage.getItem("lb-theme") || "dark",
  items: JSON.parse(localStorage.getItem("lb-items") || "null") || [
    {id:crypto.randomUUID(),name:"Milk",qty:2,done:false},
    {id:crypto.randomUUID(),name:"Bread",qty:1,done:false},
    {id:crypto.randomUUID(),name:"Eggs",qty:12,done:false},
    {id:crypto.randomUUID(),name:"Chicken",qty:1,done:false},
    {id:crypto.randomUUID(),name:"Cheese",qty:1,done:false}
  ],
  activity: JSON.parse(localStorage.getItem("lb-activity") || "null") || [
    {user:"Beth",text:"is editing the list...",time:"Now"},
    {user:"Luke",text:'added "Cheese"',time:"2m ago"},
    {user:"Beth",text:'changed "Eggs" to 12',time:"5m ago"}
  ]
};
let toastTimer;
function persist(){localStorage.setItem("lb-items",JSON.stringify(state.items));localStorage.setItem("lb-activity",JSON.stringify(state.activity));}
function applyTheme(){let t=state.theme;if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;$("#themeSelect").value=state.theme;$("#themeButton").textContent=t==="dark"?"☼":"☾";}
function other(){return state.user==="Luke"?"Beth":"Luke";}
function initials(name){return name==="Luke"?"L":"B";}
function addActivity(user,text){state.activity.unshift({user,text,time:"Now"});state.activity=state.activity.slice(0,8);persist();renderActivity();}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}
function renderItems(){
 const host=$("#items");host.innerHTML="";
 state.items.forEach(item=>{
  const row=document.createElement("div");row.className="item"+(item.done?" done":"");
  const check=document.createElement("input");check.type="checkbox";check.className="check";check.checked=item.done;check.setAttribute("aria-label","Mark "+item.name+" as bought");
  check.addEventListener("change",()=>{item.done=check.checked;addActivity(state.user,(item.done?'ticked off ':'unticked ')+`"${item.name}"`);renderItems();});
  const name=document.createElement("div");name.className="item-name";name.textContent=item.name;
  const qty=document.createElement("div");qty.className="qty";
  const minus=document.createElement("button");minus.textContent="−";minus.setAttribute("aria-label","Decrease quantity");minus.disabled=item.qty<=1;
  const count=document.createElement("strong");count.textContent=item.qty;
  const plus=document.createElement("button");plus.textContent="+";plus.setAttribute("aria-label","Increase quantity");
  minus.addEventListener("click",()=>{item.qty=Math.max(1,item.qty-1);addActivity(state.user,`changed "${item.name}" to ${item.qty}`);renderItems();});
  plus.addEventListener("click",()=>{item.qty=Math.min(99,item.qty+1);addActivity(state.user,`changed "${item.name}" to ${item.qty}`);renderItems();});
  qty.append(minus,count,plus);
  const more=document.createElement("button");more.className="more-item";more.textContent="⋯";more.title="Rename or remove item";
  more.addEventListener("click",()=>{const action=prompt(`For ${item.name}, type a new name or REMOVE to delete it:`);if(!action)return;if(action.trim().toLowerCase()==="remove"){state.items=state.items.filter(x=>x.id!==item.id);addActivity(state.user,`removed "${item.name}"`);}else{const old=item.name;item.name=action.trim().slice(0,80);addActivity(state.user,`renamed "${old}" to "${item.name}"`);}renderItems();});
  row.append(check,name,qty,more);host.append(row);
 });
 const left=state.items.filter(i=>!i.done).length;$("#remainingCount").textContent=`${left} item${left===1?"":"s"} remaining`;
}
function renderActivity(){const host=$("#activity");host.innerHTML="";state.activity.slice(0,4).forEach(a=>{const row=document.createElement("div");row.className="activity-row";const avatar=document.createElement("span");avatar.className="activity-avatar "+(a.user==="Beth"?"beth":"");avatar.textContent=initials(a.user);const copy=document.createElement("span");copy.className="activity-copy";const strong=document.createElement("strong");strong.textContent=a.user+" ";copy.append(strong,document.createTextNode(a.text));const time=document.createElement("span");time.className="activity-time";time.textContent=a.time;row.append(avatar,copy,time);host.append(row);});}
function render(){applyTheme();renderItems();renderActivity();$("#shareLabel").textContent="Share with "+other();$("#shareMessage").textContent=`This will notify ${other()} that you've shared the shopping list.`;$("#userSelect").value=state.user;$("#syncLabel").textContent="Saved on this device";}
$("#addForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#newItem");const name=input.value.trim();if(!name)return;if(state.items.some(i=>i.name.toLowerCase()===name.toLowerCase())){toast("That item is already on your list.");return;}state.items.push({id:crypto.randomUUID(),name,qty:1,done:false});input.value="";addActivity(state.user,`added "${name}"`);renderItems();toast("Item added and saved.");});
$("#clearBought").addEventListener("click",()=>{const n=state.items.filter(i=>i.done).length;if(!n){toast("No bought items to clear.");return;}state.items=state.items.filter(i=>!i.done);addActivity(state.user,`cleared ${n} bought item${n===1?"":"s"}`);renderItems();});
$("#settingsButton").addEventListener("click",()=>$("#settingsDialog").showModal());
$("#themeButton").addEventListener("click",()=>{state.theme=state.theme==="dark"?"light":"dark";localStorage.setItem("lb-theme",state.theme);render();toast("Theme changed for this device.");});
$("#userSelect").addEventListener("change",e=>{state.user=e.target.value;localStorage.setItem("lb-user",state.user);render();});
$("#themeSelect").addEventListener("change",e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);applyTheme();});
$("#shareButton").addEventListener("click",()=>$("#shareDialog").showModal());
$("#confirmShare").addEventListener("click",e=>{e.preventDefault();$("#shareDialog").close();toast("Share preview only — online sharing is not connected yet.");});
$("#settingsDialog").addEventListener("click",e=>{if(e.target===$("#settingsDialog"))$("#settingsDialog").close();});
$("#shareDialog").addEventListener("click",e=>{if(e.target===$("#shareDialog"))$("#shareDialog").close();});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));btn.classList.add("active");const tab=btn.dataset.tab;if(tab!=="list")toast(tab==="history"?"Shopping history will be added in the next build stage.":tab==="notifications"?"Share and reaction notifications are coming next.":"More settings are coming next.");}));
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();
