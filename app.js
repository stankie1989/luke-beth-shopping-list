const SUPABASE_URL="https://vzyllteamuhvbgmoyfgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_kSby2ywwkDb8qGy4gGPQbg_DcXaO3xF";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
const state={user:null,member:null,householdId:null,partner:null,household:null,members:[],items:[],lists:[],currentListId:null,activity:[],listStatus:null,latestShare:null,latestApproval:null,approvalDismissed:false,theme:localStorage.getItem("lb-theme")||"dark",channel:null,authMode:"signin"};
let toastTimer;
function toast(s){const e=$("#toast");if(!e){console.info(s);return;}e.textContent=s;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2500);}
function msg(id,s,error=false){const e=$(id);if(!e){console.warn("Missing message element:",id);return;}e.textContent=s;e.classList.toggle("error",error);}
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
 theme();renderHousehold();renderListStatus();
}
function currentList(){return state.lists.find(x=>x.id===state.currentListId)||state.lists[0]||null;}
function renderListControls(){
 const current=currentList();const selector=$("#listSelector");if(!selector)return;
 selector.innerHTML="";
 state.lists.forEach(list=>{const opt=document.createElement("option");opt.value=list.id;opt.textContent=`${list.icon||"🛒"} ${list.name}${list.is_shared?" · Shared":" · Private"}`;selector.append(opt);});
 if(current){selector.value=current.id;$("#activeListName").textContent=current.name;$("#activeListVisibility").textContent=current.is_shared?"Shared":"Private";$("#activeListVisibility").className=current.is_shared?"shared-pill":"private-pill";$("#listHeadingTitle").textContent=current.name;$("#shareButton").classList.toggle("hidden",!current.is_shared);$("#shareHint").classList.toggle("hidden",!current.is_shared);$("#listStatusCard").classList.toggle("hidden",!current.is_shared);$("#approvalCard").classList.toggle("hidden",!current.is_shared||state.approvalDismissed);$("#listHeadingDescription").textContent=current.is_shared?"Shared with your household":"Only visible to you";}
 const host=$("#manageLists");if(host){host.innerHTML="";state.lists.forEach(list=>{const row=document.createElement("div");row.className="manage-list-row";const info=document.createElement("div");info.className="manage-list-info";const title=document.createElement("strong");title.textContent=`${list.icon||"🛒"} ${list.name}`;const sub=document.createElement("span");sub.textContent=list.is_shared?"Shared with household":"Private to you";info.append(title,sub);const actions=document.createElement("div");actions.className="manage-list-actions";if(list.owner_id===state.user.id){const toggle=document.createElement("button");toggle.className="secondary-button compact";toggle.textContent=list.is_shared?"Make private":"Make shared";toggle.onclick=()=>changeListVisibility(list);const rename=document.createElement("button");rename.className="secondary-button compact";rename.textContent="Rename";rename.onclick=()=>renameList(list);const del=document.createElement("button");del.className="delete-item";del.textContent="×";del.title="Delete list";del.onclick=()=>deleteList(list);actions.append(toggle,rename,del);}row.append(info,actions);host.append(row);});}
}
async function refreshCurrentList(){
 if(!state.currentListId)return;
 const [{data:items,error},{data:activity}] = await Promise.all([
  db.from("shopping_items").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at"),
  db.from("activity_events").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at",{ascending:false}).limit(12)
 ]);
 if(error){toast("Couldn't load this list: "+error.message);return;}
 state.items=items||[];state.activity=(activity||[]).map(x=>({...x,display_name:state.members.find(m=>m.user_id===x.actor_id)?.display_name||"Household member"}));renderItems();renderActivity();
}
async function switchList(id){if(!state.lists.some(x=>x.id===id))return;state.currentListId=id;localStorage.setItem(`lb-current-list-${state.householdId}`,id);renderListControls();await refreshCurrentList();}
async function createList(){const name=prompt("Name your new list:");if(name===null)return;const clean=name.trim();if(!clean)return toast("Please enter a list name.");const shared=confirm("Make this list shared with your household?\n\nChoose Cancel to keep it private.");const {data,error}=await db.from("shopping_lists").insert({household_id:state.householdId,owner_id:state.user.id,name:clean.slice(0,40),icon:"🛒",is_shared:shared}).select("*").single();if(error)return toast("Couldn't create list: "+error.message);state.lists.push(data);await switchList(data.id);toast(`${data.name} created as ${shared?"a shared":"a private"} list.`);}
async function changeListVisibility(list){const next=!list.is_shared;const promptText=next?`Make “${list.name}” shared? Your partner will immediately see its existing items.`:`Make “${list.name}” private? Your partner will no longer be able to see it.`;if(!confirm(promptText))return;const {data,error}=await db.from("shopping_lists").update({is_shared:next}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't change visibility: "+error.message);Object.assign(list,data);renderListControls();if(state.currentListId===list.id)await refreshCurrentList();toast(next?"List is now shared.":"List is now private.");}
async function renameList(list){const name=prompt("Rename list:",list.name);if(name===null)return;const clean=name.trim();if(!clean)return toast("List name can't be empty.");const {data,error}=await db.from("shopping_lists").update({name:clean.slice(0,40)}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't rename list: "+error.message);Object.assign(list,data);renderListControls();toast("List renamed.");}
async function deleteList(list){if(state.lists.length<2)return toast("You need to keep at least one list.");if(!confirm(`Delete “${list.name}” and all its items? This cannot be undone.`))return;const {error}=await db.from("shopping_lists").delete().eq("id",list.id);if(error)return toast("Couldn't delete list: "+error.message);state.lists=state.lists.filter(x=>x.id!==list.id);if(state.currentListId===list.id)state.currentListId=state.lists[0].id;localStorage.setItem(`lb-current-list-${state.householdId}`,state.currentListId);renderListControls();await refreshCurrentList();toast("List deleted.");}
function renderItems(){
 const host=$("#items");host.innerHTML="";
 state.items.forEach(item=>{
  const row=document.createElement("div");row.className="item"+(item.is_bought?" done":"");
  const c=document.createElement("input");c.type="checkbox";c.className="check";c.checked=!!item.is_bought;c.setAttribute("aria-label",`Mark ${item.name} as ${item.is_bought?"not bought":"bought"}`);c.addEventListener("change",()=>update(item,{is_bought:c.checked}));
  const n=document.createElement("button");n.type="button";n.className="item-name";n.textContent=item.name;
  const addedAt=item.created_at?new Date(item.created_at).getTime():0;
  const isNew=Number.isFinite(addedAt)&&addedAt>0&&(Date.now()-addedAt)<2*60*60*1000;
  n.classList.toggle("is-new",isNew);
  n.setAttribute("aria-label",isNew?`${item.name}, newly added`:item.name);
  n.title=isNew?"Added in the last 2 hours · Tap to edit":"Tap to edit item name";
  n.addEventListener("click",async()=>{const value=prompt("Edit item name:",item.name);if(value===null)return;const name=value.trim();if(!name)return toast("Item name can't be empty.");if(name===item.name)return;await update(item,{name:name.slice(0,80)});});
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
 Object.assign(item,data);renderItems();await refreshListStatus();return true;
}
async function removeItem(item){
 if(!confirm(`Delete “${item.name}” from the list?`))return;
 const previous=[...state.items];state.items=state.items.filter(x=>x.id!==item.id);renderItems();
 const {error}=await db.from("shopping_items").delete().eq("id",item.id);
 if(error){state.items=previous;renderItems();toast("Couldn't delete: "+error.message);}else{toast("Item deleted.");await refreshListStatus();}
}
function activityDescription(a){
 const d=a.details&&typeof a.details==="object"?a.details:{};
 const item=`"${a.item_name||d.new_name||d.old_name||"an item"}"`;
 const changes=[];
 if(d.old_name!=null&&d.new_name!=null&&d.old_name!==d.new_name)changes.push(`renamed "${d.old_name}" to "${d.new_name}"`);
 if(d.old_quantity!=null&&d.new_quantity!=null&&d.old_quantity!==d.new_quantity)changes.push(`changed quantity for ${item} from ${d.old_quantity} to ${d.new_quantity}`);
 const verb={added:`added ${item}`,bought:`ticked off ${item}`,unbought:`unticked ${item}`,removed:`removed ${item}`};
 if(a.event_type==="added"&&d.new_quantity!=null&&d.new_quantity!==1)return `added ${item} (quantity ${d.new_quantity})`;
 if(a.event_type==="bought"||a.event_type==="unbought"){
  const action=verb[a.event_type];
  return changes.length?`${action}; ${changes.join(" and ")}`:action;
 }
 if(changes.length)return changes.join(" and ");
 return verb[a.event_type]||`updated ${item}`;
}
function renderActivity(){const host=$("#activity");host.innerHTML="";state.activity.slice(0,12).forEach(a=>{const row=document.createElement("div");row.className="activity-row";const av=document.createElement("span");av.className="activity-avatar";av.textContent=(a.display_name||"?")[0];const cp=document.createElement("span");cp.className="activity-copy";const b=document.createElement("strong");b.textContent=(a.display_name||"Someone")+" ";cp.append(b,document.createTextNode(activityDescription(a)));const tm=document.createElement("span");tm.className="activity-time";tm.textContent=new Date(a.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});row.append(av,cp,tm);host.append(row);});if(!state.activity.length)host.textContent="Your list activity will appear here.";}
async function refreshActivity(){
 if(!state.user||!state.householdId)return;
 const [{data,error},{data:members}] = await Promise.all([
  db.from("activity_events").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at",{ascending:false}).limit(12),
  db.from("household_members").select("user_id,display_name").eq("household_id",state.householdId)
 ]);
 if(error||!data)return;
 const names=Object.fromEntries((members||[]).map(x=>[x.user_id,x.display_name]));
 state.activity=data.map(x=>({...x,display_name:names[x.actor_id]||"Household member"}));
 renderActivity();
}
async function load(){
 const [lr,mr,hr]=await Promise.all([
  db.from("shopping_lists").select("*").eq("household_id",state.householdId).order("created_at"),
  db.from("household_members").select("user_id,display_name,joined_at").eq("household_id",state.householdId),
  db.from("households").select("id,name,invite_code,created_by").eq("id",state.householdId).single()
 ]);
 for(const r of [lr,mr,hr])if(r.error)throw r.error;
 state.lists=lr.data||[];if(!state.lists.length)throw new Error("No shopping lists were found. Please run the 1.5.0 database setup SQL in Supabase.");
 state.members=mr.data||[];state.member=state.members.find(x=>x.user_id===state.user.id)||state.member;
 state.partner=state.members.find(x=>x.user_id!==state.user.id)||null;state.household=hr.data;
 const saved=localStorage.getItem(`lb-current-list-${state.householdId}`);state.currentListId=state.lists.some(x=>x.id===saved)?saved:(state.lists.find(x=>x.is_shared)?.id||state.lists[0].id);
 showApp();renderListControls();await refreshCurrentList();await refreshListStatus();$("#syncLabel").textContent="Live sync connected";
}
async function refreshListStatus(){
 if(!state.user||!state.householdId)return;
 const [sr,shr]=await Promise.all([
  db.from("shopping_list_state").select("household_id,list_version,updated_at").eq("household_id",state.householdId).maybeSingle(),
  db.from("shopping_list_shares").select("id,household_id,list_version,sender_id,recipient_id,created_at").eq("household_id",state.householdId).order("created_at",{ascending:false}).limit(1).maybeSingle()
 ]);
 if(sr.error||shr.error)return;
 state.listStatus=sr.data||null;state.latestShare=shr.data||null;state.latestApproval=null;
 if(state.latestShare){
  const {data,error}=await db.from("shopping_list_approvals").select("household_id,list_version,user_id,approved_at").eq("household_id",state.householdId).eq("list_version",state.latestShare.list_version).eq("user_id",state.latestShare.recipient_id).maybeSingle();
  if(!error)state.latestApproval=data||null;
 }
 renderListStatus();
}
function renderListStatus(){
 const card=$("#listStatusCard"),approval=$("#approvalCard");if(!card||!approval)return;
 const version=state.listStatus?.list_version??1,share=state.latestShare,partner=state.partner;
 card.className="list-status-card";approval.classList.add("hidden");
 if(currentList()&&!currentList().is_shared){card.classList.add("hidden");return;}
 let symbol="↗",title="Ready to share",text=partner?`Share the latest list with ${partner.display_name} for approval.`:"Invite your partner to join your household first.",kind="status-neutral";
 if(share&&Number(share.list_version)<Number(version)){
  kind="status-changed";symbol="◷";title="Changes made";text=`Share with ${partner?.display_name||"your partner"} for a new like.`;
 }else if(share&&Number(share.list_version)===Number(version)){
  if(state.latestApproval){kind="status-liked";symbol="👍";title=share.recipient_id===state.user?.id?"You have liked the list ✓":`${state.partner?.display_name||"Your partner"} has liked the list ✓`;text=share.recipient_id===state.user?.id?`You're up to date with ${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"your partner"}.`:"You're both up to date.";}
  else if(share.recipient_id===state.user?.id){
   kind="status-awaiting";symbol="➤";title=`${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"Your partner"} shared the list`;text="Review the latest list and like to confirm.";
   if(!state.approvalDismissed){approval.classList.remove("hidden");$("#approvalTitle").textContent=`${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"Your partner"} shared the list`;$("#approvalText").textContent="Review the changes and like to confirm.";}
  }else{kind="status-awaiting";symbol="◷";title=`Shared with ${state.partner?.display_name||"your partner"}`;text=`Waiting for ${state.partner?.display_name||"them"} to review and like the list.`;}
 }
 card.classList.add(kind);$("#statusSymbol").textContent=symbol;$("#statusTitle").textContent=title;$("#statusText").textContent=text;
 $("#shareLabel").textContent="Share with "+(partner?.display_name||"your partner");
 $("#shareHint").textContent=kind==="status-liked"?"The latest list has been approved by both of you.":kind==="status-awaiting"?"Your partner will see a prompt to review and like the list.":"Changes sync automatically. Share when you're ready for approval.";
 $("#shareButton").disabled=!partner;
}
async function approveList(){
 const share=state.latestShare;if(!share||share.recipient_id!==state.user.id)return;
 const b=$("#likeListButton");busy(b,true,"Saving…");
 const {error}=await db.from("shopping_list_approvals").upsert({household_id:state.householdId,list_version:share.list_version,user_id:state.user.id},{onConflict:"household_id,list_version,user_id"});
 busy(b,false);if(error){toast("Couldn't save your like: "+error.message);return;}
 state.latestApproval={user_id:state.user.id,list_version:share.list_version};state.approvalDismissed=false;renderListStatus();toast("You've liked the latest shopping list.");
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
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_lists",filter:`household_id=eq.${state.householdId}`},async()=>{const {data}=await db.from("shopping_lists").select("*").eq("household_id",state.householdId).order("created_at");if(data){state.lists=data;if(!state.lists.some(x=>x.id===state.currentListId))state.currentListId=state.lists.find(x=>x.is_shared)?.id||state.lists[0]?.id;renderListControls();await refreshCurrentList();}})
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_items",filter:`household_id=eq.${state.householdId}`},async()=>{await refreshCurrentList();await refreshListStatus();})
 .on("postgres_changes",{event:"*",schema:"public",table:"activity_events",filter:`household_id=eq.${state.householdId}`},async()=>{const {data}=await db.from("activity_events").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at",{ascending:false}).limit(12);const {data:ms}=await db.from("household_members").select("user_id,display_name").eq("household_id",state.householdId);const names=Object.fromEntries((ms||[]).map(x=>[x.user_id,x.display_name]));state.activity=(data||[]).map(x=>({...x,display_name:names[x.actor_id]||"Household member"}));renderActivity();})
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"share_events",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new.recipient_id===state.user.id)toast("Your partner shared the shopping list.");})
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_list_state",filter:`household_id=eq.${state.householdId}`},()=>refreshListStatus())
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_list_shares",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new?.recipient_id===state.user.id){state.approvalDismissed=false;toast(`${state.members.find(m=>m.user_id===payload.new.sender_id)?.display_name||"Your partner"} shared the shopping list.`);}refreshListStatus();})
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_list_approvals",filter:`household_id=eq.${state.householdId}`},()=>refreshListStatus())
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
 $("#listSelector").onchange=e=>switchList(e.target.value);$("#newListButton").onclick=createList;$("#manageCreateList").onclick=()=>{createList();};$("#manageListsButton").onclick=()=>$("#manageListsDialog").showModal();$("#closeManageLists").onclick=()=>$("#manageListsDialog").close();
 $("#authModeToggle").onclick=()=>{state.authMode=state.authMode==="signin"?"signup":"signin";updateAuthMode();msg("#authMessage","");};
 $("#createHousehold").onclick=createHome;$("#joinHousehold").onclick=joinHome;$("#signOutSetup").onclick=signOut;$("#signOutButton").onclick=()=>{ $("#settingsDialog").close();signOut();};
 $("#newItem").addEventListener("focus",()=>setEditing(true));
 $("#newItem").addEventListener("blur",()=>setEditing(false));
 $("#addForm").onsubmit=async e=>{e.preventDefault();const input=$("#newItem"),name=input.value.trim();if(!name)return;if(state.items.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("That item is already on your list.");const {data,error}=await db.from("shopping_items").insert({household_id:state.householdId,list_id:state.currentListId,name,quantity:1,is_bought:false,created_by:state.user.id,updated_by:state.user.id}).select("*").single();if(error){toast("Couldn't add item: "+error.message);}else{if(!state.items.some(item=>item.id===data.id)){state.items.push(data);state.items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));renderItems();}input.value="";toast(`Added to ${currentList()?.name||"your list"}.`);}};
 $("#clearBought").onclick=async()=>{const bought=state.items.filter(x=>x.is_bought);if(!bought.length)return toast("No bought items to clear.");const button=$("#clearBought");button.disabled=true;const {error}=await db.from("shopping_items").delete().eq("household_id",state.householdId).eq("list_id",state.currentListId).eq("is_bought",true);button.disabled=false;if(error){toast("Couldn't clear bought items: "+error.message);return;}const removedIds=new Set(bought.map(x=>x.id));state.items=state.items.filter(x=>!removedIds.has(x.id));renderItems();toast(`Cleared ${bought.length} bought item${bought.length===1?"":"s"}.`);};
 $("#settingsButton").onclick=()=>$("#settingsDialog").showModal();$("#themeButton").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";localStorage.setItem("lb-theme",state.theme);theme();};$("#themeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#likeListButton").onclick=approveList;$("#dismissApproval").onclick=()=>{state.approvalDismissed=true;$("#approvalCard").classList.add("hidden");};
 $("#shareButton").onclick=()=>$("#shareDialog").showModal();$("#confirmShare").onclick=async e=>{e.preventDefault();$("#shareDialog").close();if(!state.partner)return toast("Your partner hasn't joined yet.");const version=state.listStatus?.list_version??1;const {error}=await db.from("shopping_list_shares").insert({household_id:state.householdId,list_version:version,sender_id:state.user.id,recipient_id:state.partner.user_id});if(error){toast("Couldn\'t share: "+error.message);return;}const notify=await db.from("share_events").insert({household_id:state.householdId,sender_id:state.user.id,recipient_id:state.partner.user_id});if(notify.error)console.warn(notify.error);state.approvalDismissed=false;await refreshListStatus();toast(`Shared ${currentList()?.name||"list"} with ${state.partner.display_name}.`);};
 $("#settingsDialog").addEventListener("click",e=>{if(e.target===$("#settingsDialog"))$("#settingsDialog").close();});$("#shareDialog").addEventListener("click",e=>{if(e.target===$("#shareDialog"))$("#shareDialog").close();});
 $("#copyInviteCode").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");try{await navigator.clipboard.writeText(code);$("#inviteStatus").textContent="Invitation code copied.";toast("Invite code copied.");}catch(e){$("#inviteStatus").textContent="Please copy the code manually."; }};
 $("#shareInvite").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");const text=`Join my Luke & Beth shopping list! Open https://stankie1989.github.io/luke-beth-shopping-list/ and enter this invitation code: ${code}`;if(navigator.share){try{await navigator.share({title:"Luke & Beth’s Shopping List",text});}catch(e){if(e.name!=="AbortError")toast("Couldn't open sharing.");}}else{try{await navigator.clipboard.writeText(text);toast("Invitation copied — paste it into a message to Beth.");}catch(e){$("#inviteStatus").textContent=text;}}};
 $("#moreThemeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#moreSignOut").onclick=signOut;
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
  const tab=b.dataset.tab;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x===b));
  $("#morePanel").classList.toggle("hidden",tab!=="more");
  $("#historyPanel").classList.toggle("hidden",tab!=="history");
  $("#notificationsPanel").classList.toggle("hidden",tab!=="notifications");
  $("#shareButton").classList.toggle("hidden",tab!=="list");
  $("#shareHint").classList.toggle("hidden",tab!=="list");
  $(".list-panel").classList.toggle("hidden",tab!=="list");
  $(".people-strip").classList.toggle("hidden",tab==="more");
  if(tab==="history")refreshActivity();
 });
}
async function init(){theme();wire();setInterval(()=>{if(state.items.length)renderItems();},60*1000);setInterval(()=>{if(document.visibilityState==="visible"){refreshActivity();refreshListStatus();}},5000);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshActivity();});const {data:{session}}=await db.auth.getSession();if(session?.user){state.user=session.user;try{await enter();}catch(e){loggedOut();msg("#authMessage",e.message,true);}}else loggedOut();db.auth.onAuthStateChange(async(_,session)=>{if(session?.user&&!state.user){state.user=session.user;try{await enter();}catch(e){msg("#authMessage",e.message,true);}}});if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  const hadController=!!navigator.serviceWorker.controller;
  if(hadController)navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload(),{once:true});
  navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(reg=>reg.update()).catch(()=>{});
 }}
init();
