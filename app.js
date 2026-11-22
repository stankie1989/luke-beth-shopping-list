const SUPABASE_URL="https://vzyllteamuhvbgmoyfgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_kSby2ywwkDb8qGy4gGPQbg_DcXaO3xF";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
const state={user:null,member:null,householdId:null,partner:null,household:null,members:[],items:[],activity:[],theme:localStorage.getItem("lb-theme")||"dark",channel:null,authMode:"signin"};
let toastTimer;
function toast(s){const e=$("#toast");e.textContent=s;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2500);}
function msg(id,s,error=false){const e=$(id);e.textContent=s;e.classList.toggle("error",error);}
function busy(b,v,label){if(!b)return;if(v){b.dataset.old=b.textContent;b.textContent=label;b.disabled=true;}else{b.textContent=b.dataset.old||b.textContent;b.disabled=false;delete b.dataset.old;}}
function theme(){let t=state.theme;if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;$("#themeSelect").value=state.theme;$("#themeButton").textContent=t==="dark"?"☼":"☾";}
function loggedOut(){ $("#appShell").classList.add("logged-out");$("#authPanel").classList.remove("hidden");$("#householdPanel").classList.add("hidden");}
function setup(){ $("#appShell").classList.add("logged-out");$("#authPanel").classList.add("hidden");$("#householdPanel").classList.remove("hidden");}
function showApp(){
 $("#appShell").classList.remove("logged-out");$("#authPanel").classList.add("hidden");$("#householdPanel").classList.add("hidden");
 $("#accountLabel").textContent="Signed in as "+state.member.display_name;
 $("#shareLabel").textContent="Share with "+(state.partner?.display_name||"your partner");
 $("#shareMessage").textContent="This will notify "+(state.partner?.display_name||"your partner")+" that you've shared the shopping list.";
 $("#selfInitial").textContent=(state.member.display_name||"L").charAt(0).toUpperCase();
 $("#selfName").textContent=state.member.display_name||"You";
 $("#partnerInitial").textContent=(state.partner?.display_name||"?").charAt(0).toUpperCase();
 $("#partnerName").textContent=state.partner?.display_name||"Not joined";
 $("#partnerPerson").classList.toggle("not-joined",!state.partner);
 theme();renderHousehold();
}
function renderItems(){
 const host=$("#items");host.innerHTML="";
 state.items.forEach(item=>{
  const row=document.createElement("div");row.className="item"+(item.is_bought?" done":"");
  const c=document.createElement("input");c.type="checkbox";c.className="check";c.checked=!!item.is_bought;c.setAttribute("aria-label",`Mark ${item.name} as ${item.is_bought?"not bought":"bought"}`);c.addEventListener("change",()=>update(item,{is_bought:c.checked}));
  const n=document.createElement("button");n.type="button";n.className="item-name";n.textContent=item.name;n.title="Tap to edit item name";n.addEventListener("click",async()=>{const value=prompt("Edit item name:",item.name);if(value===null)return;const name=value.trim();if(!name)return toast("Item name can't be empty.");if(name===item.name)return;await update(item,{name:name.slice(0,80)});});
  const q=document.createElement("div");q.className="qty";const m=document.createElement("button");m.type="button";m.textContent="−";m.disabled=item.quantity<=1;const count=document.createElement("strong");count.textContent=item.quantity;const plus=document.createElement("button");plus.type="button";plus.textContent="+";m.onclick=()=>update(item,{quantity:Math.max(1,item.quantity-1)});plus.onclick=()=>update(item,{quantity:Math.min(99,item.quantity+1)});q.append(m,count,plus);
  const del=document.createElement("button");del.type="button";del.className="delete-item";del.textContent="×";del.setAttribute("aria-label",`Delete ${item.name}`);del.title=`Delete ${item.name}`;del.onclick=()=>removeItem(item);
  row.append(c,n,q,del);host.append(row);
 });
 const left=state.items.filter(x=>!x.is_bought).length;$("#remainingCount").textContent=`${left} item${left===1?"":"s"} remaining`;
}
async function update(item,patch){
 const previous={...item};Object.assign(item,patch);renderItems();
 const {data,error}=await db.from("shopping_items").update({...patch,updated_by:state.user.id,updated_at:new Date().toISOString()}).eq("id",item.id).select("*").single();
 if(error){Object.assign(item,previous);renderItems();toast("Couldn't save: "+error.message);return false;}
 Object.assign(item,data);renderItems();return true;
}
async function removeItem(item){
 if(!confirm(`Delete “${item.name}” from the list?`))return;
 const previous=[...state.items];state.items=state.items.filter(x=>x.id!==item.id);renderItems();
 const {error}=await db.from("shopping_items").delete().eq("id",item.id);
 if(error){state.items=previous;renderItems();toast("Couldn't delete: "+error.message);}else toast("Item deleted.");
}
function renderActivity(){const host=$("#activity");host.innerHTML="";state.activity.slice(0,5).forEach(a=>{const row=document.createElement("div");row.className="activity-row";const av=document.createElement("span");av.className="activity-avatar";av.textContent=(a.display_name||"?")[0];const cp=document.createElement("span");cp.className="activity-copy";const b=document.createElement("strong");b.textContent=(a.display_name||"Someone")+" ";const verb={added:"added",updated:"updated",bought:"ticked off",unbought:"unticked",removed:"removed"}[a.event_type]||"changed";cp.append(b,document.createTextNode(`${verb} "${a.item_name}"`));const tm=document.createElement("span");tm.className="activity-time";tm.textContent=new Date(a.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});row.append(av,cp,tm);host.append(row);});if(!state.activity.length)host.textContent="Your list activity will appear here.";}
async function load(){
 const [ir,mr,ar,hr]=await Promise.all([
  db.from("shopping_items").select("*").eq("household_id",state.householdId).order("created_at"),
  db.from("household_members").select("user_id,display_name,joined_at").eq("household_id",state.householdId),
  db.from("activity_events").select("*").eq("household_id",state.householdId).order("created_at",{ascending:false}).limit(12),
  db.from("households").select("id,name,invite_code,created_by").eq("id",state.householdId).single()
 ]);
 for(const r of [ir,mr,ar,hr])if(r.error)throw r.error;
 state.members=mr.data||[];state.member=state.members.find(x=>x.user_id===state.user.id)||state.member;
 state.partner=state.members.find(x=>x.user_id!==state.user.id)||null;state.household=hr.data;
 const names=Object.fromEntries(state.members.map(x=>[x.user_id,x.display_name]));
 state.items=ir.data||[];state.activity=(ar.data||[]).map(x=>({...x,display_name:names[x.actor_id]||"Household member"}));
 showApp();renderItems();renderActivity();$("#syncLabel").textContent="Live sync connected";
}
function renderHousehold(){
 $("#inviteCodeDisplay").textContent=state.household?.invite_code||"Not available";
 const host=$("#householdMembers");host.innerHTML="";
 state.members.forEach(m=>{
  const row=document.createElement("div");row.className="household-member-row";
  const avatar=document.createElement("span");avatar.className="activity-avatar";avatar.textContent=(m.display_name||"?").charAt(0).toUpperCase();
  const name=document.createElement("strong");name.textContent=m.display_name;
  const role=document.createElement("span");role.className="member-role";role.textContent=m.user_id===state.household?.created_by?"Owner":"Member";
  row.append(avatar,name,role);host.append(row);
 });
 if(state.members.length<2){const pending=document.createElement("p");pending.className="more-description";pending.textContent="Your partner hasn't joined yet.";host.append(pending);}
 $("#moreThemeSelect").value=state.theme;
}
function updatePresence(){
 const presence=state.channel?.presenceState?.()||{};
 const editingUsers=Object.values(presence).flat().filter(p=>p.user_id!==state.user?.id && p.editing);
 const partnerEditing=editingUsers.length>0;
 $("#partnerPerson").classList.toggle("editing",partnerEditing);
 $("#partnerPerson").title=partnerEditing?`${state.partner?.display_name||"Your partner"} is editing`:"";
 $("#selfPerson").classList.toggle("editing",!!state.isEditing);
}
async function setEditing(editing){
 state.isEditing=editing;
 if(state.channel && state.user){
  try{await state.channel.track({user_id:state.user.id,display_name:state.member?.display_name||"Member",editing:!!editing});}catch(e){}
 }
 $("#selfPerson").classList.toggle("editing",!!editing);
}
function subscribe(){
 if(state.channel)db.removeChannel(state.channel);
 state.channel=db.channel("home-"+state.householdId,{config:{presence:{key:state.user.id}}})
 .on("presence",{event:"sync"},updatePresence)
 .on("postgres_changes",{event:"*",schema:"public",table:"household_members",filter:`household_id=eq.${state.householdId}`},async()=>{const {data}=await db.from("household_members").select("user_id,display_name,joined_at").eq("household_id",state.householdId);if(data){state.members=data;state.partner=data.find(m=>m.user_id!==state.user.id)||null;showApp();}})
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_items",filter:`household_id=eq.${state.householdId}`},async()=>{const {data}=await db.from("shopping_items").select("*").eq("household_id",state.householdId).order("created_at");if(data){state.items=data;renderItems();}})
 .on("postgres_changes",{event:"*",schema:"public",table:"activity_events",filter:`household_id=eq.${state.householdId}`},async()=>{const {data}=await db.from("activity_events").select("*").eq("household_id",state.householdId).order("created_at",{ascending:false}).limit(12);const {data:ms}=await db.from("household_members").select("user_id,display_name").eq("household_id",state.householdId);const names=Object.fromEntries((ms||[]).map(x=>[x.user_id,x.display_name]));state.activity=(data||[]).map(x=>({...x,display_name:names[x.actor_id]||"Household member"}));renderActivity();})
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"share_events",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new.recipient_id===state.user.id)toast("Your partner shared the shopping list.");})
 .subscribe(async status=>{if(status==="SUBSCRIBED"){await setEditing(false);$("#syncLabel").textContent="Live sync connected";}});
}
async function enter(){const {data,error}=await db.from("household_members").select("*").eq("user_id",state.user.id).limit(1);if(error)throw error;if(!data?.length){state.member={display_name:$("#authName").value.trim()||state.user.user_metadata?.display_name||state.user.email.split("@")[0]};setup();return;}state.member=data[0];state.householdId=data[0].household_id;await load();subscribe();}
async function auth(e){e.preventDefault();const btn=$("#authSubmit");busy(btn,true,"Connecting…");msg("#authMessage","");try{const email=$("#authEmail").value.trim(),password=$("#authPassword").value,name=$("#authName").value.trim();if(state.authMode==="signup"){const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)throw error;if(!data.session){msg("#authMessage","Account created. Check your email to confirm it, then come back and sign in.");return;}state.user=data.user;state.member={display_name:name};setup();}else{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;state.user=data.user;await enter();}}catch(e){msg("#authMessage",e.message,true);}finally{busy(btn,false);}}
async function createHome(){const b=$("#createHousehold");busy(b,true,"Creating…");msg("#setupMessage","");try{const {data,error}=await db.rpc("create_household",{p_display_name:state.member.display_name});if(error)throw error;const r=Array.isArray(data)?data[0]:data;state.householdId=r.household_id;msg("#setupMessage","Household created! Your private invite code is "+r.invite_code+". Send it to Beth.");const cp=document.createElement("button");cp.className="secondary-button";cp.textContent="Copy invite code";cp.onclick=()=>navigator.clipboard.writeText(r.invite_code).then(()=>toast("Invite code copied."));$("#setupMessage").append(document.createElement("br"),cp);await load();subscribe();}catch(e){msg("#setupMessage",e.message,true);}finally{busy(b,false);}}
async function joinHome(){const code=$("#inviteCode").value.trim().toUpperCase();if(!code)return msg("#setupMessage","Enter the invite code first.",true);const b=$("#joinHousehold");busy(b,true,"Joining…");try{const {data,error}=await db.rpc("join_household",{p_invite_code:code,p_display_name:state.member.display_name});if(error)throw error;state.householdId=data;await load();subscribe();toast("You've joined the shared list!");}catch(e){msg("#setupMessage",e.message,true);}finally{busy(b,false);}}
async function signOut(){if(state.channel)await db.removeChannel(state.channel);await db.auth.signOut();state.user=null;state.member=null;state.householdId=null;state.items=[];loggedOut();}
function updateAuthMode(){
 const signingUp=state.authMode==="signup";
 $("#authNameField").classList.toggle("hidden",!signingUp);
 $("#authName").required=signingUp;
 $("#authSubmit").textContent=signingUp?"Create account":"Sign in";
 $("#authModeToggle").textContent=signingUp?"Already registered? Sign in":"New here? Create an account";
 $("#authPassword").autocomplete=signingUp?"new-password":"current-password";
}
function wire(){
 $("#authForm").onsubmit=auth;updateAuthMode();
 $("#authModeToggle").onclick=()=>{state.authMode=state.authMode==="signin"?"signup":"signin";updateAuthMode();msg("#authMessage","");};
 $("#createHousehold").onclick=createHome;$("#joinHousehold").onclick=joinHome;$("#signOutSetup").onclick=signOut;$("#signOutButton").onclick=()=>{ $("#settingsDialog").close();signOut();};
 $("#newItem").addEventListener("focus",()=>setEditing(true));
 $("#newItem").addEventListener("blur",()=>setEditing(false));
 $("#addForm").onsubmit=async e=>{e.preventDefault();const input=$("#newItem"),name=input.value.trim();if(!name)return;if(state.items.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("That item is already on your list.");const {error}=await db.from("shopping_items").insert({household_id:state.householdId,name,quantity:1,is_bought:false,created_by:state.user.id,updated_by:state.user.id});if(error)toast(error.message);else{input.value="";toast("Added to your shared list.");}};
 $("#clearBought").onclick=async()=>{if(!state.items.some(x=>x.is_bought))return toast("No bought items to clear.");const {error}=await db.from("shopping_items").delete().eq("household_id",state.householdId).eq("is_bought",true);if(error)toast(error.message);};
 $("#settingsButton").onclick=()=>$("#settingsDialog").showModal();$("#themeButton").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";localStorage.setItem("lb-theme",state.theme);theme();};$("#themeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#shareButton").onclick=()=>$("#shareDialog").showModal();$("#confirmShare").onclick=async e=>{e.preventDefault();$("#shareDialog").close();if(!state.partner)return toast("Your partner hasn't joined yet.");const {error}=await db.from("share_events").insert({household_id:state.householdId,sender_id:state.user.id,recipient_id:state.partner.user_id});toast(error?error.message:"Shared with "+state.partner.display_name+".");};
 $("#settingsDialog").addEventListener("click",e=>{if(e.target===$("#settingsDialog"))$("#settingsDialog").close();});$("#shareDialog").addEventListener("click",e=>{if(e.target===$("#shareDialog"))$("#shareDialog").close();});
 $("#copyInviteCode").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");try{await navigator.clipboard.writeText(code);$("#inviteStatus").textContent="Invitation code copied.";toast("Invite code copied.");}catch(e){$("#inviteStatus").textContent="Please copy the code manually."; }};
 $("#shareInvite").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");const text=`Join my Luke & Beth shopping list! Open https://stankie1989.github.io/luke-beth-shopping-list/ and enter this invitation code: ${code}`;if(navigator.share){try{await navigator.share({title:"Luke & Beth’s Shopping List",text});}catch(e){if(e.name!=="AbortError")toast("Couldn't open sharing.");}}else{try{await navigator.clipboard.writeText(text);toast("Invitation copied — paste it into a message to Beth.");}catch(e){$("#inviteStatus").textContent=text;}}};
 $("#moreThemeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#moreSignOut").onclick=signOut;
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");const more=b.dataset.tab==="more";$("#morePanel").classList.toggle("hidden",!more);$("#shareButton").classList.toggle("hidden",more);$("#shareHint").classList.toggle("hidden",more);if(b.dataset.tab!=="list"&&!more)toast("That section is planned for a later update.");});
}
async function init(){theme();wire();const {data:{session}}=await db.auth.getSession();if(session?.user){state.user=session.user;try{await enter();}catch(e){loggedOut();msg("#authMessage",e.message,true);}}else loggedOut();db.auth.onAuthStateChange(async(_,session)=>{if(session?.user&&!state.user){state.user=session.user;try{await enter();}catch(e){msg("#authMessage",e.message,true);}}});if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  const hadController=!!navigator.serviceWorker.controller;
  if(hadController)navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload(),{once:true});
  navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(reg=>reg.update()).catch(()=>{});
 }}
init();
