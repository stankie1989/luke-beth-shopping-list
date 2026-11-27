const SUPABASE_URL="https://vzyllteamuhvbgmoyfgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_kSby2ywwkDb8qGy4gGPQbg_DcXaO3xF";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
let waitingWorker=null;
const PICKUP_COLOUR_KEY="lb-pickup-colour-times";
const pickupColourDefaults={greenUntil:"16:00",amberUntil:"18:00"};
function getPickupColourTimes(){try{return {...pickupColourDefaults,...JSON.parse(localStorage.getItem(PICKUP_COLOUR_KEY)||"{}")};}catch{return {...pickupColourDefaults};}}
let pickupColourTimes=getPickupColourTimes();
const state={loungeMessages:[],loungeDirectMessages:[],loungeChannel:null,loungeLoaded:false,loungeAIThinking:false,loungeRemoteAIThinking:false,loungeAICharactersTyping:new Map(),loungeRemoteAICharactersTyping:new Map(),loungePreferredCharacter:null,calendar:{connected:false,loading:false,loaded:false,shifts:[],email:null,error:null},weather:{loading:false,loaded:false,data:null,error:null,shiftId:null},recentMealIcons:JSON.parse(localStorage.getItem("lb-recent-meal-icons")||"[]"),menuEntries:[],missedMeals:[],menuFavourites:[],menuStart:null,editingMealId:null,selectedMealImage:"dinner",activeMenuSlot:"dinner",datePickerValue:null,datePickerMonth:null,datePickerAction:null,selectedShoppingListId:null,pendingMealIngredients:null,mealIconsExpanded:false,user:null,member:null,householdId:null,partner:null,household:null,members:[],items:[],lists:[],currentListId:null,activity:[],listStatus:null,latestShare:null,latestApproval:null,approvalDismissed:false,theme:localStorage.getItem("lb-theme")||"dark",channel:null,authMode:"signin"};
let toastTimer;
let loungeTypingTimer=null;
let loungeTypingClearTimer=null;
const loungeRemoteTyping=new Map();
function toast(s){const e=$("#toast");if(!e){console.info(s);return;}e.textContent=s;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2500);}
function appNotice(title,body){
 toast(body);
 if(!("Notification" in window)||Notification.permission!=="granted"||document.visibilityState!=="visible")return;
 const options={body,icon:"./icon-192.png",badge:"./icon-192.png",tag:"luke-beth-share"};
 if("serviceWorker" in navigator){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,options)).catch(e=>console.warn("Browser notification unavailable",e));}
 else{try{new Notification(title,options);}catch(e){console.warn("Browser notification unavailable",e);}}
}
function msg(id,s,error=false){const e=$(id);if(!e){console.warn("Missing message element:",id);return;}e.textContent=s;e.classList.toggle("error",error);}
function busy(b,v,label){if(!b)return;if(v){b.dataset.old=b.textContent;b.textContent=label;b.disabled=true;}else{b.textContent=b.dataset.old||b.textContent;b.disabled=false;delete b.dataset.old;}}
function applyListStatusTheme(){
 const card=$("#listStatusCard");if(!card)return;
 const title=$("#statusTitle"),text=$("#statusText"),symbol=$("#statusSymbol");
 const light=document.documentElement.dataset.theme==="light";
 const kind=["liked","awaiting","changed","neutral"].find(k=>card.classList.contains("status-"+k))||"neutral";
 const palettes={
  light:{neutral:["linear-gradient(120deg,#eef2ff,#e7edff)","#cbd5f0","#172044","#596684","#d5def7","#26365f"],liked:["linear-gradient(110deg,#e6f8ed,#d9f3e3)","#a9dfbd","#17452b","#416b50","#c7ecd3","#176238"],awaiting:["linear-gradient(110deg,#f0eaff,#e8defb)","#cbb9ef","#30204d","#65557f","#ddcff8","#5737a1"],changed:["linear-gradient(110deg,#fff2df,#ffe8c7)","#edc98f","#493017","#80603b","#f7d9a8","#704516"]},
  dark:{neutral:["linear-gradient(120deg,#18284a,#1b2041)","#354c83","#f7f8ff","#a7b2d0","#26334f","#dce6ff"],liked:["linear-gradient(110deg,#103d2b,#12452d)","#168d4e","#f4fff7","#a9d8b8","#1eaa5e","#ffffff"],awaiting:["linear-gradient(110deg,#29204c,#211b43)","#8054d8","#faf7ff","#c9bce8","#7448d4","#ffffff"],changed:["linear-gradient(110deg,#49321b,#332719)","#a66b2d","#fff8ed","#d9bd99","#d99131","#211608"]}
 };
 const p=palettes[light?"light":"dark"][kind];
 card.style.background=p[0];card.style.borderColor=p[1];card.style.color=p[2];
 if(title)title.style.color=p[2];if(text)text.style.color=p[3];
 if(symbol){symbol.style.background=p[4];symbol.style.color=p[5];}
}
function theme(){let t=state.theme;if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;$("#themeSelect").value=state.theme;$("#themeButton").textContent=t==="dark"?"☼":"☾";applyListStatusTheme();}
function loggedOut(){ $("#appShell").classList.add("logged-out");$("#authPanel").classList.remove("hidden");$("#householdPanel").classList.add("hidden");}
function setup(){ $("#appShell").classList.add("logged-out");$("#authPanel").classList.add("hidden");$("#householdPanel").classList.remove("hidden");}
function showApp(){
 $("#appShell").classList.remove("logged-out");$("#appShell").classList.add("shopping-tab-active");$("#authPanel").classList.add("hidden");$("#householdPanel").classList.add("hidden");
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
 const current=currentList();if(!$("#listSwitcherButton"))return;
 if(current){$("#activeListName").textContent=current.name;$("#listSwitcherButton").setAttribute("aria-label",`Switch shopping list. Current list: ${current.name}`);$("#activeListVisibility").textContent=current.is_shared?"Shared":"Private";$("#activeListVisibility").className=current.is_shared?"shared-pill":"private-pill";$("#listHeadingTitle").textContent=current.name;$("#shareButton").classList.toggle("hidden",!current.is_shared);$("#shareHint").classList.toggle("hidden",!current.is_shared);$("#listStatusCard").classList.toggle("hidden",!current.is_shared);$("#approvalCard").classList.toggle("hidden",!current.is_shared||state.approvalDismissed);$("#listHeadingDescription").textContent=current.is_shared?"Shared with your household":"Only visible to you";}
 const switchHost=$("#switchListsOptions");if(switchHost){switchHost.innerHTML="";state.lists.forEach(list=>{const option=document.createElement("button");option.type="button";option.className="switch-list-option"+(list.id===state.currentListId?" selected":"");option.setAttribute("aria-current",list.id===state.currentListId?"true":"false");const copy=document.createElement("span");copy.className="switch-list-copy";const name=document.createElement("strong");name.textContent=list.name;const visibility=document.createElement("small");visibility.textContent=list.is_shared?"Shared with household":"Private to you";copy.append(name,visibility);const mark=document.createElement("span");mark.className="switch-list-check";mark.textContent=list.id===state.currentListId?"✓":"";option.append(copy,mark);option.onclick=async()=>{$("#switchListsDialog").close();await switchList(list.id);};switchHost.append(option);});}
 const host=$("#manageLists");if(host){host.innerHTML="";state.lists.forEach(list=>{const row=document.createElement("div");row.className="manage-list-row";const info=document.createElement("div");info.className="manage-list-info";const title=document.createElement("strong");title.textContent=`${list.icon||"🛒"} ${list.name}`;const sub=document.createElement("span");sub.textContent=list.is_shared?"Shared with household":"Private to you";info.append(title,sub);const actions=document.createElement("div");actions.className="manage-list-actions";if(list.owner_id===state.user.id){const toggle=document.createElement("button");toggle.className="secondary-button compact";toggle.textContent=list.is_shared?"Make private":"Make shared";toggle.onclick=()=>changeListVisibility(list);const rename=document.createElement("button");rename.className="secondary-button compact";rename.textContent="Rename";rename.onclick=()=>renameList(list);const del=document.createElement("button");del.className="delete-item";del.textContent="×";del.title="Delete list";del.onclick=()=>deleteList(list);actions.append(toggle,rename,del);}row.append(info,actions);host.append(row);});}
}
let listRefreshRunning=false;
async function refreshCurrentList(){
 if(!state.currentListId||listRefreshRunning)return;listRefreshRunning=true;
 await loadHouseholdCategories();
 const [{data:items,error},{data:activity}] = await Promise.all([
  db.from("shopping_items").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at"),
  db.from("activity_events").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at",{ascending:false}).limit(12)
 ]);
 if(error){listRefreshRunning=false;toast("Couldn't load this list: "+error.message);return;}
 state.items=items||[];backfillItemCategories();state.activity=(activity||[]).map(x=>({...x,display_name:state.members.find(m=>m.user_id===x.actor_id)?.display_name||"Household member"}));renderItems();renderActivity();listRefreshRunning=false;
}
async function switchList(id){if(!state.lists.some(x=>x.id===id))return;state.currentListId=id;localStorage.setItem(`lb-current-list-${state.householdId}`,id);renderListControls();await refreshCurrentList();}
function createList(){const form=$("#createListForm");form.reset();$("#newListVisibility").value="shared";$("#createListDialog").showModal();setTimeout(()=>$("#newListName").focus(),80);}
async function submitCreateList(e){e.preventDefault();const clean=$("#newListName").value.trim();if(!clean)return toast("Please enter a list name.");const shared=$("#newListVisibility").value==="shared";const button=$("#confirmCreateList");busy(button,true,"Creating…");const {data,error}=await db.from("shopping_lists").insert({household_id:state.householdId,owner_id:state.user.id,name:clean.slice(0,40),icon:"🛒",is_shared:shared}).select("*").single();busy(button,false);if(error)return toast("Couldn't create list: "+error.message);$("#createListDialog").close();state.lists.push(data);await switchList(data.id);toast(`${data.name} created as ${shared?"a shared":"a private"} list.`);}
async function changeListVisibility(list){const next=!list.is_shared;const promptText=next?`Make “${list.name}” shared? Your partner will immediately see its existing items.`:`Make “${list.name}” private? Your partner will no longer be able to see it.`;if(!confirm(promptText))return;const {data,error}=await db.from("shopping_lists").update({is_shared:next}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't change visibility: "+error.message);Object.assign(list,data);renderListControls();if(state.currentListId===list.id)await refreshCurrentList();toast(next?"List is now shared.":"List is now private.");}
async function renameList(list){const name=prompt("Rename list:",list.name);if(name===null)return;const clean=name.trim();if(!clean)return toast("List name can't be empty.");const {data,error}=await db.from("shopping_lists").update({name:clean.slice(0,40)}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't rename list: "+error.message);Object.assign(list,data);renderListControls();toast("List renamed.");}
async function deleteList(list){if(state.lists.length<2)return toast("You need to keep at least one list.");if(!confirm(`Delete “${list.name}” and all its items? This cannot be undone.`))return;const {error}=await db.from("shopping_lists").delete().eq("id",list.id);if(error)return toast("Couldn't delete list: "+error.message);state.lists=state.lists.filter(x=>x.id!==list.id);if(state.currentListId===list.id)state.currentListId=state.lists[0].id;localStorage.setItem(`lb-current-list-${state.householdId}`,state.currentListId);renderListControls();await refreshCurrentList();toast("List deleted.");}
let editingShoppingItem=null,deletingShoppingItem=null;
function openEditItem(item){
 editingShoppingItem=item;$("#editItemName").value=item.name;$("#editItemDialog").showModal();$("#editItemName").focus();
}
function closeEditItem(){editingShoppingItem=null;$("#editItemDialog").close();}
async function saveEditedItem(e){
 e.preventDefault();const item=editingShoppingItem;if(!item)return;
 const name=$("#editItemName").value.trim();if(!name)return toast("Item name can't be empty.");
 if(name===item.name){closeEditItem();return;}
 if(state.items.some(x=>x.id!==item.id&&x.name.toLowerCase()===name.toLowerCase()))return toast("That item is already on your list.");
 const ok=await update(item,{name:name.slice(0,80)});if(ok)closeEditItem();
}
function openDeleteItem(item){deletingShoppingItem=item;$("#deleteItemMessage").textContent=`Are you sure you want to delete “${item.name}” from this shopping list?`;$("#deleteItemDialog").showModal();}
function closeDeleteItem(){deletingShoppingItem=null;$("#deleteItemDialog").close();}
async function confirmDeleteShoppingItem(){
 const item=deletingShoppingItem;if(!item)return;
 const previous=[...state.items];state.items=state.items.filter(x=>x.id!==item.id);renderItems();closeDeleteItem();
 const {error}=await db.from("shopping_items").delete().eq("id",item.id);
 if(error){state.items=previous;renderItems();toast("Couldn't delete: "+error.message);}else{toast("Item deleted.");await refreshListStatus();}
}
let categoryEditingItem=null;
function openItemCategoryPicker(item){
 categoryEditingItem=item;
 $("#itemCategoryDescription").textContent=`Choose a category for ${item.name}.`;
 const host=$("#itemCategoryChoices");host.innerHTML="";
 SHOP_CATEGORIES.forEach(cat=>{
  const button=document.createElement("button");button.type="button";button.className="item-category-choice";button.style.setProperty("--category-accent",categoryAccentColor(cat));
  if((item.category||guessShoppingCategory(item.name))===cat)button.classList.add("selected");
  const label=document.createElement("span");label.textContent=cat;
  const tick=document.createElement("span");tick.className="category-choice-tick";tick.textContent=(item.category||guessShoppingCategory(item.name))===cat?"✓":"";
  button.append(label,tick);button.onclick=async()=>{await setItemCategory(item,cat);closeItemCategoryPicker();};host.append(button);
 });
 $("#itemCategoryDialog").showModal();
}
function closeItemCategoryPicker(){categoryEditingItem=null;$("#itemCategoryDialog").close();}
function buildItemRow(item,shopping=false){
 const row=document.createElement("div");row.className="item"+(item.is_bought?" done":"")+(shopping?" shopping-mode-item":"");
 const c=document.createElement("input");c.type="checkbox";c.className=shopping?"shopping-mode-check":"check";c.checked=!!item.is_bought;c.setAttribute("aria-label",`Mark ${item.name} as ${item.is_bought?"not bought":"bought"}`);c.addEventListener("change",()=>update(item,{is_bought:c.checked}));
 const n=document.createElement(shopping?"span":"button");if(!shopping)n.type="button";n.className=shopping?"shopping-mode-item-name":"item-name";n.textContent=item.name;
 if(!shopping){
  const addedAt=item.created_at?new Date(item.created_at).getTime():0;const isNew=Number.isFinite(addedAt)&&addedAt>0&&(Date.now()-addedAt)<2*60*60*1000;n.classList.toggle("is-new",isNew);n.setAttribute("aria-label",isNew?`${item.name}, newly added`:item.name);n.title=isNew?"Added in the last 2 hours · Tap to edit":"Tap to edit item name";
  n.addEventListener("click",()=>openEditItem(item));
  const q=document.createElement("div");q.className="qty";const m=document.createElement("button");m.type="button";m.textContent="−";m.disabled=item.quantity<=1;const count=document.createElement("strong");count.textContent=item.quantity;const plus=document.createElement("button");plus.type="button";plus.textContent="+";m.onclick=()=>update(item,{quantity:Math.max(1,item.quantity-1)});plus.onclick=()=>update(item,{quantity:Math.min(99,item.quantity+1)});q.append(m,count,plus);
  const category=document.createElement("button");category.type="button";category.className="item-category-trigger";category.textContent="C";const currentCategory=item.category||guessShoppingCategory(item.name);category.style.setProperty("--category-accent",categoryAccentColor(currentCategory));category.setAttribute("aria-label",`Change category for ${item.name}`);category.title=`Category: ${currentCategory} · Tap to change`;category.onclick=()=>openItemCategoryPicker(item);
  const del=document.createElement("button");del.type="button";del.className="delete-item";del.textContent="×";del.setAttribute("aria-label",`Delete ${item.name}`);del.title=`Delete ${item.name}`;del.onclick=()=>openDeleteItem(item);row.append(c,n,q,category,del);
 }else{const q=document.createElement("span");q.className="shopping-mode-quantity";q.textContent=item.quantity>1?`×${item.quantity}`:"";row.append(c,n,q);}
 return row;
}

const MEAL_IMAGES=[["dinner", "🍽️", "Dinner plate"], ["pasta", "🍝", "Pasta"], ["pizza", "🍕", "Pizza"], ["burger", "🍔", "Burger"], ["curry", "🍛", "Curry"], ["roast", "🍗", "Roast chicken"], ["salad", "🥗", "Salad"], ["fish", "🐟", "Fish"], ["soup", "🍲", "Soup"], ["tacos", "🌮", "Tacos"], ["sandwich", "🥪", "Sandwich"], ["breakfast", "🍳", "Breakfast"], ["pancakes", "🥞", "Pancakes"], ["rice", "🍚", "Rice"], ["vegetables", "🥦", "Vegetables"], ["noodles", "🍜", "Noodles"], ["steak", "🥩", "Steak"], ["sausage", "🌭", "Hot dog"], ["bacon", "🥓", "Bacon"], ["egg", "🥚", "Eggs"], ["cheese", "🧀", "Cheese"], ["bread", "🍞", "Bread"], ["croissant", "🥐", "Croissant"], ["bagel", "🥯", "Bagel"], ["waffle", "🧇", "Waffles"], ["porridge", "🥣", "Porridge"], ["potato", "🥔", "Potatoes"], ["chips", "🍟", "Chips"], ["chicken", "🍗", "Chicken"], ["shrimp", "🍤", "Prawns"], ["crab", "🦀", "Crab"], ["sushi", "🍣", "Sushi"], ["bento", "🍱", "Bento"], ["dumplings", "🥟", "Dumplings"], ["springroll", "🥠", "Spring rolls"], ["burrito", "🌯", "Burrito"], ["flatbread", "🫓", "Flatbread"], ["pepper", "🫑", "Peppers"], ["carrot", "🥕", "Carrots"], ["corn", "🌽", "Sweetcorn"], ["tomato", "🍅", "Tomatoes"], ["mushroom", "🍄", "Mushrooms"], ["onion", "🧅", "Onions"], ["peas", "🫛", "Peas"], ["beans", "🫘", "Beans"], ["avocado", "🥑", "Avocado"], ["cucumber", "🥒", "Cucumber"], ["apple", "🍎", "Apple"], ["banana", "🍌", "Banana"], ["strawberry", "🍓", "Strawberries"], ["grapes", "🍇", "Grapes"], ["watermelon", "🍉", "Watermelon"], ["orange", "🍊", "Orange"], ["lemon", "🍋", "Lemon"], ["cherries", "🍒", "Cherries"], ["peach", "🍑", "Peach"], ["pineapple", "🍍", "Pineapple"], ["mango", "🥭", "Mango"], ["blueberries", "🫐", "Blueberries"], ["cake", "🍰", "Cake"], ["donut", "🍩", "Doughnut"], ["cookie", "🍪", "Cookie"], ["chocolate", "🍫", "Chocolate"], ["icecream", "🍨", "Ice cream"], ["cupcake", "🧁", "Cupcake"], ["pie", "🥧", "Pie"], ["honey", "🍯", "Honey"], ["milk", "🥛", "Milk"], ["coffee", "☕", "Coffee"], ["tea", "🍵", "Tea"], ["juice", "🧃", "Juice"], ["casserole", "🥘", "Casserole"], ["ramen", "🍜", "Ramen"], ["toast", "🍞", "Toast"], ["turkey", "🦃", "Turkey"], ["duck", "🦆", "Duck"], ["pork", "🥓", "Pork"], ["lamb", "🍖", "Lamb"], ["ribs", "🍖", "Ribs"], ["ham", "🍖", "Ham"], ["meat", "🥩", "Red meat"], ["mince", "🥩", "Minced beef"], ["meatloaf", "🍖", "Meatloaf"], ["kebab", "🍢", "Kebab"], ["skewer", "🍢", "Food skewers"], ["hotpot", "🥘", "Hot pot"], ["paella", "🥘", "Paella"], ["stew", "🍲", "Stew"], ["chilli", "🥘", "Chilli"], ["lasagne", "🍝", "Lasagne"], ["maccheese", "🧀", "Macaroni cheese"], ["gnocchi", "🍝", "Gnocchi"], ["ravioli", "🍝", "Ravioli"], ["carbonara", "🍝", "Carbonara"], ["spaghetti", "🍝", "Spaghetti"], ["tagliatelle", "🍝", "Tagliatelle"], ["pesto", "🌿", "Pesto pasta"], ["risotto", "🍚", "Risotto"], ["friedrice", "🍛", "Fried rice"], ["pilau", "🍚", "Pilau rice"], ["couscous", "🥣", "Couscous"], ["quinoa", "🥣", "Quinoa"], ["noodlebowl", "🍜", "Noodle bowl"], ["udon", "🍜", "Udon"], ["pho", "🍜", "Pho"], ["soba", "🍜", "Soba noodles"], ["dumplingbowl", "🥟", "Dumpling bowl"], ["fishchips", "🐟", "Fish and chips"], ["fishcake", "🐟", "Fishcake"], ["salmon", "🐟", "Salmon"], ["tuna", "🐟", "Tuna"], ["cod", "🐟", "Cod"], ["prawns", "🍤", "Prawns"], ["mussels", "🦪", "Mussels"], ["oysters", "🦪", "Oysters"], ["lobster", "🦞", "Lobster"], ["squid", "🦑", "Squid"], ["octopus", "🐙", "Octopus"], ["crablegs", "🦀", "Crab legs"], ["sardines", "🐟", "Sardines"], ["anchovy", "🐟", "Anchovies"], ["fishfingers", "🐟", "Fish fingers"], ["chickenwings", "🍗", "Chicken wings"], ["drumsticks", "🍗", "Chicken drumsticks"], ["nuggets", "🍗", "Chicken nuggets"], ["roastbeef", "🍖", "Roast beef"], ["gammon", "🍖", "Gammon"], ["sausages", "🌭", "Sausages"], ["meatballs2", "🧆", "Meatballs"], ["sushiroll", "🍣", "Sushi rolls"], ["sashimi", "🍣", "Sashimi"], ["tempura", "🍤", "Tempura"], ["onigiri", "🍙", "Onigiri"], ["takoyaki", "🐙", "Takoyaki"], ["bibimbap", "🍚", "Bibimbap"], ["kimchi", "🥬", "Kimchi"], ["koreanbbq", "🥩", "Korean BBQ"], ["ramencup", "🍜", "Ramen bowl"], ["gyoza", "🥟", "Gyoza"], ["springrolls", "🥠", "Spring rolls"], ["wonton", "🥟", "Wontons"], ["padthai", "🍜", "Pad Thai"], ["thaicurry", "🍛", "Thai curry"], ["satay", "🍢", "Satay"], ["naan", "🫓", "Naan bread"], ["samosa", "🥟", "Samosa"], ["pakora", "🥦", "Pakora"], ["dahl", "🍲", "Dahl"], ["tikka", "🍛", "Chicken tikka"], ["korma", "🍛", "Korma"], ["biryani", "🍚", "Biryani"], ["tandoori", "🍗", "Tandoori chicken"], ["falafel", "🧆", "Falafel"], ["hummus", "🫘", "Hummus"], ["pita", "🫓", "Pitta bread"], ["shakshuka", "🍳", "Shakshuka"], ["gyro", "🥙", "Gyros"], ["shawarma", "🥙", "Shawarma"], ["doner", "🥙", "Doner kebab"], ["quesadilla2", "🫓", "Quesadilla"], ["nachos", "🧀", "Nachos"], ["enchilada", "🌮", "Enchiladas"], ["fajitas", "🌮", "Fajitas"], ["tamale", "🌽", "Tamale"], ["empanada", "🥟", "Empanada"], ["arepa", "🫓", "Arepa"], ["hotdog", "🌭", "Hot dog"], ["corn_dog", "🌭", "Corn dog"], ["sub", "🥖", "Sub sandwich"], ["panini", "🥪", "Panini"], ["baguette", "🥖", "Baguette"], ["toastie", "🥪", "Toasted sandwich"], ["club_sandwich", "🥪", "Club sandwich"], ["wrapchicken", "🌯", "Chicken wrap"], ["burgermeal", "🍔", "Burger meal"], ["sliders", "🍔", "Mini burgers"], ["pizza_slice", "🍕", "Pizza slice"], ["flatbreadpizza", "🍕", "Flatbread pizza"], ["calzone", "🥟", "Calzone"], ["broccoli", "🥦", "Broccoli"], ["cauliflower", "🥦", "Cauliflower"], ["lettuce", "🥬", "Lettuce"], ["cabbage", "🥬", "Cabbage"], ["spinach", "🥬", "Spinach"], ["kale", "🥬", "Kale"], ["aubergine", "🍆", "Aubergine"], ["courgette", "🥒", "Courgette"], ["pumpkin", "🎃", "Pumpkin"], ["sweetpotato", "🍠", "Sweet potato"], ["yam", "🍠", "Yam"], ["radish", "🌶️", "Radish"], ["chillipepper", "🌶️", "Chilli pepper"], ["garlic", "🧄", "Garlic"], ["ginger", "🫚", "Ginger"], ["celery", "🥬", "Celery"], ["asparagus", "🥦", "Asparagus"], ["artichoke", "🥬", "Artichoke"], ["olives", "🫒", "Olives"], ["pickle", "🥒", "Pickles"], ["beetroot", "🫜", "Beetroot"], ["parsnip", "🥕", "Parsnip"], ["turnip", "🥔", "Turnip"], ["leek", "🥬", "Leek"], ["springonion", "🧅", "Spring onion"], ["greenbeans", "🫛", "Green beans"], ["lentils", "🫘", "Lentils"], ["chickpeas", "🫘", "Chickpeas"], ["kidneybeans", "🫘", "Kidney beans"], ["edamame", "🫛", "Edamame"], ["coleslaw", "🥗", "Coleslaw"], ["caesarsalad", "🥗", "Caesar salad"], ["greeksalad", "🥗", "Greek salad"], ["potatosalad", "🥔", "Potato salad"], ["pasta_salad", "🥗", "Pasta salad"], ["fruit_salad", "🍓", "Fruit salad"], ["guacamole", "🥑", "Guacamole"], ["salsa", "🍅", "Salsa"], ["soupbowl", "🍲", "Vegetable soup"], ["tomatosoup", "🍅", "Tomato soup"], ["miso", "🍲", "Miso soup"], ["broth", "🍲", "Broth"], ["bakedbeans", "🫘", "Baked beans"], ["mash", "🥔", "Mashed potato"], ["wedges", "🥔", "Potato wedges"], ["roastpotatoes", "🥔", "Roast potatoes"], ["jacketpotato", "🥔", "Jacket potato"], ["hashbrown", "🥔", "Hash browns"], ["onionrings", "🧅", "Onion rings"], ["garlicbread", "🥖", "Garlic bread"], ["breadsticks", "🥖", "Breadsticks"], ["crackers", "🍘", "Crackers"], ["pear", "🍐", "Pear"], ["kiwi", "🥝", "Kiwi"], ["coconut", "🥥", "Coconut"], ["melon", "🍈", "Melon"], ["plum", "🍑", "Plum"], ["raspberry", "🍓", "Raspberries"], ["blackberry", "🫐", "Blackberries"], ["apricot", "🍑", "Apricot"], ["fig", "🍇", "Fig"], ["pomegranate", "🍎", "Pomegranate"], ["lime", "🍋", "Lime"], ["papaya", "🥭", "Papaya"], ["passionfruit", "🥭", "Passion fruit"], ["dates", "🌴", "Dates"], ["fruitbowl", "🍉", "Fruit bowl"], ["nuts", "🥜", "Nuts"], ["peanuts", "🥜", "Peanuts"], ["popcorn", "🍿", "Popcorn"], ["crisps", "🥔", "Crisps"], ["pretzel", "🥨", "Pretzel"], ["nachos2", "🧀", "Cheese nachos"], ["ricecakes", "🍘", "Rice cakes"], ["granola", "🥣", "Granola"], ["cereal", "🥣", "Cereal"], ["muesli", "🥣", "Muesli"], ["yoghurt", "🥛", "Yoghurt"], ["cheeseboard", "🧀", "Cheese board"], ["butter", "🧈", "Butter"], ["cream", "🥛", "Cream"], ["icecreamcone", "🍦", "Ice cream cone"], ["sundae", "🍨", "Ice cream sundae"], ["lollipop", "🍭", "Lollipop"], ["sweets", "🍬", "Sweets"], ["marshmallow", "🍡", "Marshmallow"], ["brownie", "🍫", "Brownie"], ["muffin", "🧁", "Muffin"], ["biscuit", "🍪", "Biscuit"], ["gingerbread", "🍪", "Gingerbread"], ["pudding", "🍮", "Pudding"], ["custard", "🍮", "Custard"], ["jelly", "🍮", "Jelly"], ["trifle", "🍰", "Trifle"], ["cheesecake", "🍰", "Cheesecake"], ["pavlova", "🍰", "Pavlova"], ["tart", "🥧", "Tart"], ["croissant2", "🥐", "Pain au chocolat"], ["doughnut", "🍩", "Doughnut"], ["bagelcream", "🥯", "Bagel with cream cheese"], ["milkshake", "🥤", "Milkshake"], ["smoothie", "🥤", "Smoothie"], ["soda", "🥤", "Soft drink"], ["water", "💧", "Water"], ["lemonade", "🍋", "Lemonade"], ["hotchocolate", "☕", "Hot chocolate"], ["latte", "☕", "Latte"], ["cappuccino", "☕", "Cappuccino"], ["tea_cup", "🍵", "Green tea"], ["cocktail", "🍹", "Mocktail"], ["boba", "🧋", "Bubble tea"], ["omelette", "🍳", "Omelette"], ["scrambledegg", "🍳", "Scrambled eggs"], ["boiledegg", "🥚", "Boiled eggs"], ["poachedegg", "🍳", "Poached eggs"], ["breakfastroll", "🥪", "Breakfast roll"], ["breakfastbap", "🥯", "Breakfast bap"], ["eggsbenedict", "🍳", "Eggs Benedict"], ["frenchtoast", "🍞", "French toast"], ["overnightoats", "🥣", "Overnight oats"], ["smoothiebowl", "🥣", "Smoothie bowl"], ["proteinshake", "🥤", "Protein shake"], ["scone", "🥐", "Scone"], ["crumpet", "🍞", "Crumpet"], ["muffin_english", "🍞", "English muffin"], ["pancake_stack", "🥞", "Pancake stack"], ["waffle_stack", "🧇", "Waffle stack"], ["bakedegg", "🍳", "Baked eggs"], ["omeletteroll", "🌯", "Egg wrap"], ["pie_meat", "🥧", "Meat pie"], ["shepherdspie", "🥧", "Shepherd's pie"], ["cottagepie", "🥧", "Cottage pie"], ["quiche", "🥧", "Quiche"], ["sausage_roll", "🥐", "Sausage roll"], ["scotch_egg", "🥚", "Scotch egg"], ["pasties", "🥟", "Pasties"], ["cornish_pasty", "🥟", "Cornish pasty"], ["fish_pie", "🐟", "Fish pie"], ["toad_hole", "🌭", "Toad in the hole"], ["bangers_mash", "🌭", "Bangers and mash"], ["roast_dinner", "🍗", "Sunday roast"], ["christmas_dinner", "🦃", "Christmas dinner"], ["bbq", "🍖", "Barbecue"], ["grill", "🥩", "Grilled food"], ["sunday_lunch", "🍽️", "Sunday lunch"], ["tapas", "🥘", "Tapas"], ["mezze", "🥙", "Mezze platter"], ["sharing_platter", "🧀", "Sharing platter"], ["veggie_burger", "🍔", "Veggie burger"], ["vegan_bowl", "🥗", "Vegan bowl"], ["tofu", "🧈", "Tofu"], ["tempeh", "🫘", "Tempeh"], ["veggie_curry", "🍛", "Vegetable curry"], ["bean_chilli", "🥘", "Bean chilli"], ["stuffed_pepper", "🫑", "Stuffed pepper"], ["stuffed_mushroom", "🍄", "Stuffed mushrooms"], ["risotto_mushroom", "🍚", "Mushroom risotto"]];
function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
function dateLabel(s){return new Date(`${s}T12:00:00`).toLocaleDateString("en-GB",{day:"numeric",month:"short"});}
function mealImage(key){return MEAL_IMAGES.find(x=>x[0]===key)||MEAL_IMAGES[0];}
const DEFAULT_FAVOURITE_CATEGORIES=["Breakfast","Chicken","Meat","Fish","Pasta & rice","Vegetarian","Quick meals","Desserts","Other"];
let favouriteCategories=[...DEFAULT_FAVOURITE_CATEGORIES];
function autoFavouriteCategory(f){const text=normaliseMealText([f.name,...(f.ingredients||[]).map(x=>x.name)].join(" "));
 if(/cake|pudding|dessert|ice cream|brownie|cookie|pancake|waffle|sweet|trifle/.test(text))return "Desserts";
 if(/breakfast|bacon|egg|porridge|cereal|toast|sausage bap/.test(text))return "Breakfast";
 if(/fish|salmon|tuna|cod|prawn|shrimp|seafood|fish finger/.test(text))return "Fish";
 if(/chicken|nugget|fajita|kiev|drumstick/.test(text))return "Chicken";
 if(/pasta|spaghetti|lasagne|macaroni|noodle|rice|risotto|carbonara|bolognese/.test(text))return "Pasta & rice";
 if(/sausage|beef|pork|lamb|steak|mince|ham|bacon|meat|burger|meatball|gammon/.test(text))return "Meat";
 if(/vegetarian|veggie|bean|lentil|tofu|salad|vegetable|cheese|mushroom|potato|tomato soup/.test(text))return "Vegetarian";
 if(/quick|toastie|sandwich|wrap|omelette|jacket potato/.test(text))return "Quick meals";
 return "Other";
}
function favouriteCategory(f){return f.category||autoFavouriteCategory(f);}
async function loadFavouriteCategories(){
 const {data,error}=await db.from("household_meal_categories").select("*").eq("household_id",state.householdId).order("name");
 if(error){console.warn(error);toast("Couldn't load shared meal categories. Run the 1.7.8 SQL update.");return;}
 favouriteCategories=[...new Set([...DEFAULT_FAVOURITE_CATEGORIES,...(data||[]).map(x=>x.name)])];
}
async function saveFavouriteCategory(f,category){
 const {error}=await db.from("menu_favourites").update({category}).eq("id",f.id);
 if(error)return toast("Couldn't update category: "+error.message);
 f.category=category;toast(`${f.name} categorised as ${category}.`);
}
async function manageFavouriteCategories(){
 await loadFavouriteCategories();
 renderCategoryManager();
 $("#manageCategoriesDialog").showModal();
}
function renderCategoryManager(){
 const list=$("#manageCategoriesList");list.innerHTML="";
 favouriteCategories.forEach(name=>{
  const isDefault=DEFAULT_FAVOURITE_CATEGORIES.includes(name);
  const row=document.createElement("div");row.className="category-manage-row";
  const label=document.createElement("span");label.className="category-manage-name";label.textContent=name;row.append(label);
  if(!isDefault){
   const rename=document.createElement("button");rename.type="button";rename.className="category-action-button";rename.textContent="Rename";
   rename.onclick=async()=>{
    const input=$("#newCategoryName");input.value=name;input.dataset.rename=name;input.focus();$("#addCategorySubmit").textContent="Save name";
   };
   const del=document.createElement("button");del.type="button";del.className="category-action-button danger";del.textContent="Delete";
   del.onclick=async()=>{
    if(!confirm(`Delete “${name}”? Meals using it will return to their automatic category.`))return;
    const {error}=await db.from("menu_favourites").update({category:null}).eq("household_id",state.householdId).eq("category",name);
    if(error)return toast("Couldn't reset meal categories: "+error.message);
    const {error:deleteError}=await db.from("household_meal_categories").delete().eq("household_id",state.householdId).eq("name",name);
    if(deleteError)return toast("Couldn't delete category: "+deleteError.message);
    await loadFavouriteCategories();renderCategoryManager();renderFavouritesList();toast("Category deleted.");
   };
   row.append(rename,del);
  }else{
   const fixed=document.createElement("span");fixed.className="category-built-in";fixed.textContent="Default";row.append(fixed);
  }
  list.append(row);
 });
}
async function saveManagedCategory(){
 const input=$("#newCategoryName"),name=input.value.trim().slice(0,40),oldName=input.dataset.rename||"";
 if(!name)return toast("Enter a category name first.");
 if(oldName){
  const {error}=await db.from("household_meal_categories").update({name}).eq("household_id",state.householdId).eq("name",oldName);
  if(error)return toast("Couldn't rename category: "+error.message);
  const {error:updateError}=await db.from("menu_favourites").update({category:name}).eq("household_id",state.householdId).eq("category",oldName);
  if(updateError)return toast("Category renamed, but meal assignments could not be updated: "+updateError.message);
  toast("Category renamed.");
 }else{
  const {error}=await db.from("household_meal_categories").upsert({household_id:state.householdId,name,created_by:state.user.id},{onConflict:"household_id,name"});
  if(error)return toast("Couldn't add category: "+error.message);
  toast("Shared category added.");
 }
 input.value="";delete input.dataset.rename;$("#addCategorySubmit").textContent="Add category";
 await loadFavouriteCategories();renderCategoryManager();renderFavouritesList();
}
const CUSTOM_MEAL_ART={
 sausages:{file:"sausages.png",aliases:["sausage","sausages","banger","bangers","pork sausage","grilled sausage"]},
 bangers_mash:{file:"bangers-mash.png",aliases:["sausage and mash","sausages and mash","bangers and mash","sausage mash","bangers mash"]},
 nuggets:{file:"chicken-nuggets.png",aliases:["chicken nuggets","nuggets","nugget","breaded chicken bites"]},
 fishfingers:{file:"fish-fingers.png",aliases:["fish fingers","fish finger","fish sticks"]},
 shepherdspie:{file:"shepherds-pie.png",aliases:["shepherds pie","shepherd's pie","shepherd pie"]},
 spaghetti:{file:"spaghetti-bolognese.png",aliases:["spaghetti bolognese","spag bol","spaghetti meat sauce"]},
 wrapchicken:{file:"chicken-fajitas.png",aliases:["chicken fajitas","fajitas","chicken wrap"]},
 roast_dinner:{file:"roast-dinner.png",aliases:["roast dinner","sunday roast","roast chicken dinner"]},
 maccheese:{file:"macaroni-cheese.png",aliases:["macaroni cheese","mac and cheese","mac n cheese"]},
 curry:{file:"chicken-curry.png",aliases:["chicken curry","curry and rice","chicken tikka masala"]},
 bakedbeans:{file:"beans-toast.png",aliases:["beans on toast","beans toast"]},
 chips:{file:"chips.png",aliases:["chips","fries","chunky chips"]},
 pancakes:{file:"pancakes.png",aliases:["pancakes","pancake stack"]},
 pizza:{file:"pizza.png",aliases:["pizza","pepperoni pizza"]},
 tomatosoup:{file:"tomato-soup.png",aliases:["tomato soup","tomato soup bowl"]},
 fishchips:{file:"fish-chips.png",aliases:["fish and chips","fish n chips","fish chips"]}
};
function setMealArt(node,key){
 if(!node)return;const item=mealImage(key),art=CUSTOM_MEAL_ART[key];node.replaceChildren();
 if(art){const img=document.createElement("img");img.src=`./images/${art.file}`;img.alt=item[2];img.className="meal-custom-art";img.loading="lazy";node.append(img);}
 else node.textContent=item[1];
}
function normaliseMealText(value){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function suggestedMealKeys(value){
 const q=normaliseMealText(value);if(!q)return [];
 const ranked=[];
 Object.entries(CUSTOM_MEAL_ART).forEach(([key,art])=>{let score=0;for(const alias of art.aliases){const a=normaliseMealText(alias);if(q===a)score=Math.max(score,120);else if(q.includes(a))score=Math.max(score,95+a.length/10);else if(a.includes(q)&&q.length>3)score=Math.max(score,55+a.length/20);}
  const tokens=q.split(" ").filter(Boolean);const label=normaliseMealText(mealImage(key)[2]);const overlap=tokens.filter(t=>label.includes(t)).length;if(overlap)score=Math.max(score,overlap*12);
  if(score)ranked.push({key,score});});
 return ranked.sort((a,b)=>b.score-a.score).map(x=>x.key).filter((k,i,a)=>a.indexOf(k)===i).slice(0,6);
}
function rememberMealIcon(key){state.recentMealIcons=[key,...state.recentMealIcons.filter(x=>x!==key)].slice(0,8);localStorage.setItem("lb-recent-meal-icons",JSON.stringify(state.recentMealIcons));}


function promptTargetDate(message){
 const value=prompt(message+" Enter destination date (YYYY-MM-DD):");
 if(value===null)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(new Date(value+"T12:00:00").getTime())){toast("Please enter a valid date in YYYY-MM-DD format.");return null;}
 return value;
}
let pendingCopyMeal=null;
function openCopyMealDialog(entry){
 pendingCopyMeal=entry;
 $("#copyMealDescription").textContent=`Choose where to copy "${entry.name}".`;
 $("#copyMealTarget").value="";
 $("#copyMealDialog").showModal();
}
let swapChoiceResolver=null;
function askSwapChoice(title,message){
 $("#swapChoiceTitle").textContent=title;
 $("#swapChoiceMessage").textContent=message;
 $("#swapChoiceDialog").showModal();
 return new Promise(resolve=>{swapChoiceResolver=resolve;});
}
function finishSwapChoice(choice){
 if(!swapChoiceResolver)return;
 const resolve=swapChoiceResolver;swapChoiceResolver=null;
 $("#swapChoiceDialog").close();resolve(choice);
}
async function copySingleMealSubmit(e){
 e.preventDefault();if(!pendingCopyMeal)return;
 const entry=pendingCopyMeal,target=$("#copyMealTarget").value;
 if(!target)return toast("Choose a destination date.");
 if(target===entry.entry_date)return toast("Choose a different date.");
 const collisions=state.menuEntries.filter(x=>x.entry_date===target&&x.meal_type===entry.meal_type);
 if(collisions.length>1)return toast("That destination already has multiple meals in the same slot. Remove the extras before swapping.");
 const collision=collisions[0];
 if(collision){
  const choice=await askSwapChoice("Meal already planned",`"${collision.name}" is already planned in this slot. Swap it with "${entry.name}"?`);
  if(choice!=="swap")return;
   const tempDate="9999-12-31";
   const {data:tempRows,error:tempCheck}=await db.from("menu_entries").select("id").eq("household_id",state.householdId).eq("entry_date",tempDate);
   if(tempCheck)return toast("Couldn't prepare the swap: "+tempCheck.message);
   const stagingDate=tempRows?.length?"9999-12-30":tempDate;
   const {error:stageError}=await db.from("menu_entries").update({entry_date:stagingDate}).eq("id",entry.id);
   if(stageError)return toast("Couldn't start the swap: "+stageError.message);
   const {error:moveError}=await db.from("menu_entries").update({entry_date:entry.entry_date}).eq("id",collision.id);
   if(moveError){await db.from("menu_entries").update({entry_date:entry.entry_date}).eq("id",entry.id);return toast("Couldn't move the existing meal. The original was restored where possible.");}
   const {data,error:finishError}=await db.from("menu_entries").update({entry_date:target}).eq("id",entry.id).select("*").single();
   if(finishError)return toast("The swap is partly complete. Please refresh and check both days.");
   state.menuEntries=state.menuEntries.filter(x=>x.id!==collision.id&&x.id!==entry.id);
   state.menuEntries.push({...collision,entry_date:entry.entry_date},data);
   $("#copyMealDialog").close();pendingCopyMeal=null;
   await refreshMenuAfterCopy(target);toast("Meals swapped.");
   return;
 }
 const payload={household_id:state.householdId,entry_date:target,meal_type:entry.meal_type,name:entry.name,image_key:entry.image_key,ingredients:entry.ingredients||[],created_by:state.user.id};
 const {data,error}=await db.from("menu_entries").insert(payload).select("*").single();
 if(error)return toast("Couldn't copy meal: "+error.message);
 $("#copyMealDialog").close();pendingCopyMeal=null;state.menuEntries.push(data);
 await refreshMenuAfterCopy(target);toast("Meal copied to "+dateLabel(target)+".");
}
async function refreshMenuAfterCopy(target){
 const start=new Date(`${state.menuStart}T12:00:00`),end=new Date(start);end.setDate(end.getDate()+13);
 if(target<localISO(start)||target>localISO(end)){state.menuStart=localISO(mondayOf(new Date(target+"T12:00:00")));await loadMenu();}
 else renderMenu();
}

function openCopyDayDialog(){
 const select=$("#copyDaySource");select.innerHTML="";
 const byDate={};
 state.menuEntries.forEach(entry=>{(byDate[entry.entry_date]??=[]).push(entry);});
 const dates=Object.keys(byDate).sort();
 if(!dates.length)return toast("There are no planned meals to copy in the currently loaded fortnight.");
 dates.forEach(date=>{
  const option=document.createElement("option");option.value=date;
  const d=new Date(date+"T12:00:00");
  option.textContent=`${d.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})} · ${byDate[date].length} meal${byDate[date].length===1?"":"s"}`;
  select.append(option);
 });
 $("#copyDayTarget").value="";
 $("#copyDayDialog").showModal();
}
async function copyWholeDay(e){
 e.preventDefault();
 const source=$("#copyDaySource").value,target=$("#copyDayTarget").value;
 if(!target)return toast("Choose a destination date.");
 if(source===target)return toast("Choose a different destination date.");
 const meals=state.menuEntries.filter(x=>x.entry_date===source);
 if(!meals.length)return toast("There are no meals on the selected day.");
 const targetMeals=state.menuEntries.filter(x=>x.entry_date===target);
 if(targetMeals.length){
  const choice=await askSwapChoice("Destination day isn't empty",`The destination already has ${targetMeals.length} planned meal(s). Swap the two days?`);
  if(choice!=="swap")return;
   const sourceTypes=meals.map(x=>x.meal_type),targetTypes=targetMeals.map(x=>x.meal_type);
   if(new Set(sourceTypes).size!==sourceTypes.length||new Set(targetTypes).size!==targetTypes.length){
    return toast("One of these days already has duplicate meals in the same slot. Please remove the extra meal before swapping.");
   }
   let tempDate="9999-12-31";
   const {data:tempRows,error:tempCheck}=await db.from("menu_entries").select("id").eq("household_id",state.householdId).eq("entry_date",tempDate);
   if(tempCheck)return toast("Couldn't prepare the swap: "+tempCheck.message);
   if(tempRows?.length)tempDate="9999-12-30";
   const idsSource=meals.map(x=>x.id),idsTarget=targetMeals.map(x=>x.id);
   const {error:stageError}=await db.from("menu_entries").update({entry_date:tempDate}).in("id",idsSource);
   if(stageError)return toast("Couldn't start the day swap: "+stageError.message);
   const {error:targetError}=await db.from("menu_entries").update({entry_date:source}).in("id",idsTarget);
   if(targetError){
    await db.from("menu_entries").update({entry_date:source}).in("id",idsSource);
    return toast("Couldn't move the destination meals. The original day has been restored where possible.");
   }
   const {error:finishError}=await db.from("menu_entries").update({entry_date:target}).in("id",idsSource);
   if(finishError)return toast("The swap is partly complete. Please refresh and check both days before trying again.");
   $("#copyDayDialog").close();state.menuStart=localISO(mondayOf(new Date(target+"T12:00:00")));await loadMenu();toast("Days swapped successfully.");return;
 }
 const payload=meals.map(x=>({household_id:state.householdId,entry_date:target,meal_type:x.meal_type,name:x.name,image_key:x.image_key,ingredients:x.ingredients||[],created_by:state.user.id}));
 const {data,error}=await db.from("menu_entries").insert(payload).select("*");
 if(error)return toast("Couldn't copy day: "+error.message);
 $("#copyDayDialog").close();state.menuStart=localISO(mondayOf(new Date(target+"T12:00:00")));await loadMenu();toast(`${data.length} meals copied to ${dateLabel(target)}.`);
}

function renderMenu(){
 const host=$("#menuWeeks");if(!host)return;host.innerHTML="";
 if(!state.menuStart)state.menuStart=localISO(mondayOf(new Date()));
 const start=new Date(`${state.menuStart}T12:00:00`),end=new Date(start);end.setDate(end.getDate()+13);
 $("#menuRange").textContent=`${dateLabel(localISO(start))} – ${dateLabel(localISO(end))}`;
 for(let w=0;w<2;w++){
  const week=document.createElement("section");week.className="menu-week";
  const heading=document.createElement("h3");const ws=new Date(start);ws.setDate(ws.getDate()+w*7);const we=new Date(ws);we.setDate(we.getDate()+6);heading.textContent=`Week ${w+1} · ${dateLabel(localISO(ws))} – ${dateLabel(localISO(we))}`;week.append(heading);
  for(let d=0;d<7;d++){
   const date=new Date(ws);date.setDate(date.getDate()+d);const iso=localISO(date);
   const isToday=iso===localISO(new Date());const day=document.createElement("div");day.className="menu-day"+(isToday?" menu-day-today":"");
   const dayhead=document.createElement("div");dayhead.className="menu-day-heading";dayhead.innerHTML=`<strong>${date.toLocaleDateString("en-GB",{weekday:"short"})}</strong><span class="menu-day-number">${date.getDate()}</span>${isToday?'<em class="today-label">TODAY</em>':""}`;day.append(dayhead);
   const meals=state.menuEntries.filter(x=>x.entry_date===iso).sort((a,b)=>["dinner","breakfast","lunch"].indexOf(a.meal_type)-["dinner","breakfast","lunch"].indexOf(b.meal_type));
   const dinner=meals.find(x=>x.meal_type==="dinner");
   const slots=[{type:"dinner",label:"Dinner",primary:true},...meals.filter(x=>x.meal_type!=="dinner").map(x=>({type:x.meal_type,label:x.meal_type==="breakfast"?"Breakfast":"Lunch",entry:x}))];
   if(!dinner)slots[0].entry=null;else slots[0].entry=dinner;
   slots.forEach(slot=>{
    const row=document.createElement("div");row.className="menu-meal-row";
    if(slot.entry){
     const completed=!!slot.entry.is_completed;row.classList.toggle("meal-completed",completed);
     const tick=document.createElement("button");tick.type="button";tick.className="meal-complete-toggle"+(completed?" checked":"");tick.textContent=completed?"✓":"";tick.setAttribute("role","checkbox");tick.setAttribute("aria-checked",String(completed));tick.setAttribute("aria-label",completed?"Mark meal as not eaten":"Mark meal as eaten");tick.onclick=()=>setMealCompleted(slot.entry,!completed);
     const im=mealImage(slot.entry.image_key);const thumb=document.createElement("button");thumb.type="button";thumb.className="meal-thumb";setMealArt(thumb,slot.entry.image_key);thumb.title="Edit meal";thumb.onclick=()=>openMealDialog(iso,slot.type,slot.entry);
     const info=document.createElement("button");info.type="button";info.className="meal-info";info.innerHTML=`<small>${slot.label}</small><strong></strong>`;info.querySelector("strong").textContent=slot.entry.name;info.onclick=()=>openMealDialog(iso,slot.type,slot.entry);
     const add=document.createElement("button");add.type="button";add.className="meal-add-ingredients";add.textContent="＋ List";add.title="Add ingredients to shopping list";add.onclick=()=>addMealIngredients(slot.entry);
     const copy=document.createElement("button");copy.type="button";copy.className="meal-copy-button";copy.textContent="Copy";copy.title="Copy this meal to another day";copy.onclick=()=>openCopyMealDialog(slot.entry);row.append(tick,thumb,info,add,copy);
    }else{
     const add=document.createElement("button");add.type="button";add.className="menu-add-slot";add.textContent=`＋ Add ${slot.label.toLowerCase()}`;add.onclick=()=>openMealSourcePicker(iso,slot.type);row.append(add);
    }
    day.append(row);
   });
   const optional=document.createElement("button");optional.type="button";optional.className="menu-optional-add";optional.textContent="＋ Breakfast / lunch";optional.onclick=()=>openMealSourcePicker(iso,"breakfast");day.append(optional);
   week.append(day);
  }
  host.append(week);
 }
 renderMissedMeals();
}
function renderMissedMeals(){
 const host=$("#missedMeals");if(!host)return;host.innerHTML="";
 const heading=document.createElement("div");heading.className="missed-meals-heading";
 const title=document.createElement("h3");title.textContent="Missed meals";
 const count=document.createElement("span");count.className="missed-meals-count";count.textContent=String(state.missedMeals.length);
 heading.append(title,count);host.append(heading);
 const intro=document.createElement("p");intro.className="missed-meals-intro";intro.textContent="Past meals you haven't marked as eaten. Reschedule them or tick them off.";host.append(intro);
 if(!state.missedMeals.length){const empty=document.createElement("div");empty.className="missed-meals-empty";empty.textContent="You're all caught up — no missed meals.";host.append(empty);return;}
 state.missedMeals.forEach(entry=>{
  const row=document.createElement("div");row.className="missed-meal-row";
  const icon=document.createElement("span");icon.className="missed-meal-icon";setMealArt(icon,entry.image_key);
  const info=document.createElement("div");info.className="missed-meal-info";
  const name=document.createElement("strong");name.textContent=entry.name;
  const meta=document.createElement("small");meta.textContent=`${entry.meal_type[0].toUpperCase()+entry.meal_type.slice(1)} · ${dateLabel(entry.entry_date)}`;
  info.append(name,meta);
  const actions=document.createElement("div");actions.className="missed-meal-actions";
  const reschedule=document.createElement("button");reschedule.type="button";reschedule.className="secondary-button compact";reschedule.textContent="↗ Reschedule";reschedule.onclick=()=>{state.reschedulingMealId=entry.id;openDatePicker(localISO(new Date()),entry.meal_type,"reschedule");};
  const eaten=document.createElement("button");eaten.type="button";eaten.className="primary-button compact";eaten.textContent="✓ Had it";eaten.onclick=()=>setMealCompleted(entry,true);
  actions.append(reschedule,eaten);row.append(icon,info,actions);host.append(row);
 });
}

async function setMealCompleted(entry,completed){
 const {data,error}=await db.from("menu_entries").update({is_completed:completed}).eq("id",entry.id).select("*").single();
 if(error)return toast("Couldn't update meal: "+error.message);
 state.menuEntries=state.menuEntries.map(x=>x.id===entry.id?data:x);
 state.missedMeals=state.missedMeals.filter(x=>x.id!==entry.id);
 if(!completed&&data.entry_date<localISO(new Date()))state.missedMeals.push(data);
 state.missedMeals.sort((a,b)=>a.entry_date.localeCompare(b.entry_date));
 renderMenu();toast(completed?"Meal marked as eaten.":"Meal marked as not eaten.");
}
function formatDMY(iso){const [y,m,d]=iso.split("-");return `${d}-${m}-${y}`;}
function openDatePicker(defaultDate,mealType,action){
 state.datePickerValue=defaultDate||localISO(new Date());
 const dt=new Date(`${state.datePickerValue}T12:00:00`);
 state.datePickerMonth=new Date(dt.getFullYear(),dt.getMonth(),1);
 state.datePickerAction=action||"new";
 $("#datePickerMealType").value=mealType||"dinner";
 renderDatePicker();
 $("#datePickerDialog").showModal();
}
function renderDatePicker(){
 const month=state.datePickerMonth;$("#datePickerMonth").textContent=month.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
 $("#datePickerSelectedLabel").textContent=formatDMY(state.datePickerValue);
 const grid=$("#datePickerGrid");grid.innerHTML="";
 ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(x=>{const el=document.createElement("span");el.className="calendar-weekday";el.textContent=x;grid.append(el);});
 const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7;
 const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 for(let i=0;i<offset;i++){const blank=document.createElement("span");blank.className="calendar-blank";grid.append(blank);}
 for(let day=1;day<=days;day++){
  const d=new Date(month.getFullYear(),month.getMonth(),day),iso=localISO(d),b=document.createElement("button");b.type="button";b.className="calendar-day"+(iso===state.datePickerValue?" selected":"")+(iso===localISO(new Date())?" today":"");b.textContent=day;b.onclick=()=>{state.datePickerValue=iso;renderDatePicker();};grid.append(b);
 }
}
async function confirmDatePicker(){
 const date=state.datePickerValue,type=$("#datePickerMealType").value,action=state.datePickerAction;
 $("#datePickerDialog").close();
 if(action==="favourite"){
  const f=state.pendingFavourite;if(!f)return;
  if(await hasMealInSlot(date,type))return;
  const payload={household_id:state.householdId,entry_date:date,meal_type:type,name:f.name,image_key:f.image_key,ingredients:f.ingredients||[],created_by:state.user.id};
  const {data,error}=await db.from("menu_entries").insert(payload).select("*").single();
  if(error)return toast("Couldn't add favourite: "+error.message);
  state.menuEntries.push(data);renderMenu();toast("Favourite added to menu.");
 }else if(action==="reschedule"){
  const id=state.reschedulingMealId;const entry=state.missedMeals.find(x=>x.id===id);if(!entry)return;
  if(await hasMealInSlot(date,type,id))return;
  const {data,error}=await db.from("menu_entries").update({entry_date:date,meal_type:type}).eq("id",id).select("*").single();
  if(error)return toast("Couldn't reschedule meal: "+error.message);
  state.missedMeals=state.missedMeals.filter(x=>x.id!==id);
  const windowStart=state.menuStart,windowEnd=new Date(`${windowStart}T12:00:00`);windowEnd.setDate(windowEnd.getDate()+13);
  if(date<windowStart||date>localISO(windowEnd)){state.menuStart=localISO(mondayOf(new Date(`${date}T12:00:00`)));}
  await loadMenu();toast(`“${entry.name}” rescheduled to ${formatDMY(date)}.`);
 }else openMealDialog(date,type,null);
}

function updateSelectedMealArt(){
 const selected=mealImage(state.selectedMealImage);
 setMealArt($("#selectedMealEmoji"),state.selectedMealImage);
 $("#selectedMealLabel").textContent=selected[2];
}
function renderMealIconPicker(){
 const host=$("#mealIconGrid"),search=$("#mealIconSearch"),more=$("#mealIconMore"),suggestionHost=$("#mealIconSuggestions");
 const q=search.value.trim().toLowerCase(),mealName=$("#mealName").value.trim();
 const matches=MEAL_IMAGES.filter(x=>{const art=CUSTOM_MEAL_ART[x[0]];const terms=[x[2],x[0],...(art?.aliases||[])].join(" ").toLowerCase();return terms.includes(q)||!q;});
 const suggestions=suggestedMealKeys(q||mealName);
 suggestionHost.innerHTML="";
 if(suggestions.length){const heading=document.createElement("div");heading.className="meal-icon-suggestion-heading";heading.textContent="Best matches for this meal";suggestionHost.append(heading);const grid=document.createElement("div");grid.className="meal-icon-suggestion-grid";suggestions.forEach(key=>{const item=mealImage(key),b=document.createElement("button");b.type="button";b.className="meal-image-choice meal-suggestion-choice"+(key===state.selectedMealImage?" selected":"");setMealArt(b,key);const label=document.createElement("span");label.textContent=item[2];b.append(label);b.title=item[2];b.onclick=()=>{state.selectedMealImage=key;rememberMealIcon(key);renderMealIconPicker();};grid.append(b);});suggestionHost.append(grid);}
 const recent=(!q&&!suggestions.length)?state.recentMealIcons:[];
 const recentKeys=recent.filter(key=>MEAL_IMAGES.some(x=>x[0]===key));
 if(recentKeys.length){const heading=document.createElement("div");heading.className="meal-icon-suggestion-heading";heading.textContent="Recently used";suggestionHost.append(heading);const grid=document.createElement("div");grid.className="meal-icon-suggestion-grid";recentKeys.forEach(key=>{const item=mealImage(key),b=document.createElement("button");b.type="button";b.className="meal-image-choice meal-suggestion-choice"+(key===state.selectedMealImage?" selected":"");setMealArt(b,key);const label=document.createElement("span");label.textContent=item[2];b.append(label);b.onclick=()=>{state.selectedMealImage=key;rememberMealIcon(key);renderMealIconPicker();};grid.append(b);});suggestionHost.append(grid);}
 const shown=(state.mealIconsExpanded||q)?matches:matches.slice(0,18);host.innerHTML="";
 if(!matches.length){const empty=document.createElement("p");empty.className="meal-icon-empty";empty.textContent=suggestions.length?"No other matches in the full icon collection. Choose one of the suggested illustrations above.":"No matching illustrations. Try a different food name or browse the full collection.";host.append(empty);}
 shown.forEach(([key,emoji,label])=>{const b=document.createElement("button");b.type="button";b.className="meal-image-choice"+(key===state.selectedMealImage?" selected":"");setMealArt(b,key);b.title=label;b.setAttribute("aria-label",label);b.setAttribute("aria-pressed",String(key===state.selectedMealImage));b.onclick=()=>{state.selectedMealImage=key;rememberMealIcon(key);renderMealIconPicker();};host.append(b);});
 more.hidden=!!q||matches.length<=18;more.textContent=state.mealIconsExpanded?"Show fewer illustrations":`Show all ${matches.length} illustrations`;
}
function openMealIconPicker(){
 state.mealIconsExpanded=false;const mealName=$("#mealName").value.trim();const suggestions=suggestedMealKeys(mealName);if(suggestions.length&&["dinner","breakfast"].includes(state.selectedMealImage))state.selectedMealImage=suggestions[0];$("#mealIconSearch").value=mealName;renderMealIconPicker();$("#mealIconPickerDialog").showModal();
}
function openMealSourcePicker(date,type){
 state.pendingMealDate=date;state.pendingMealType=type;
 $("#mealSourceTitle").textContent=`Add ${type}`;
 $("#mealSourceNew").onclick=()=>{$("#mealSourceDialog").close();openMealDialog(date,type,null);};
 $("#mealSourceFavourite").onclick=async()=>{$("#mealSourceDialog").close();await showFavouritePicker(date,type);};
 $("#mealSourceDialog").showModal();
}
async function showFavouritePicker(date,type){
 await loadMenuFavourites();
 state.pendingMealDate=date;state.pendingMealType=type;
 const host=$("#dayFavouriteList");host.innerHTML="";
 if(!state.menuFavourites.length){const empty=document.createElement("p");empty.className="list-picker-intro";empty.textContent="No favourite meals saved yet. Save a meal as a favourite when adding a meal.";host.append(empty);}
 state.menuFavourites.forEach(f=>{
  const row=document.createElement("button");row.type="button";row.className="day-favourite-row";
  const icon=document.createElement("span");icon.className="day-favourite-icon";setMealArt(icon,f.image_key);
  const info=document.createElement("span");info.className="day-favourite-info";
  const name=document.createElement("strong");name.textContent=f.name;
  const detail=document.createElement("small");detail.textContent=`${(f.ingredients||[]).length} ingredient${(f.ingredients||[]).length===1?"":"s"} · Tap to preview`;
  info.append(name,detail);const arrow=document.createElement("span");arrow.textContent="›";arrow.className="day-favourite-arrow";
  row.append(icon,info,arrow);row.onclick=()=>showFavouritePreview(f);host.append(row);
 });
 $("#dayFavouritesDialog").showModal();
}
function showFavouritePreview(f){
 state.previewingFavourite=f;
 const icon=$("#favouritePreviewIcon");setMealArt(icon,f.image_key);
 $("#favouritePreviewName").textContent=f.name;
 const host=$("#favouritePreviewIngredients");host.innerHTML="";
 const ingredients=f.ingredients||[];
 if(!ingredients.length){const empty=document.createElement("p");empty.className="list-picker-intro";empty.textContent="No ingredients saved for this favourite.";host.append(empty);}
 ingredients.forEach(ing=>{const row=document.createElement("div");row.className="favourite-ingredient-row";const name=document.createElement("span");name.textContent=ing.name;const qty=document.createElement("strong");qty.textContent=ing.quantity||"1";row.append(name,qty);host.append(row);});
 $("#dayFavouritesDialog").close();$("#favouritePreviewDialog").showModal();
}
async function addPreviewedFavourite(){
 const f=state.previewingFavourite;if(!f)return;
 if(await hasMealInSlot(state.pendingMealDate,state.pendingMealType))return;
 const payload={household_id:state.householdId,entry_date:state.pendingMealDate,meal_type:state.pendingMealType,name:f.name,image_key:f.image_key,ingredients:f.ingredients||[],created_by:state.user.id};
 const {data,error}=await db.from("menu_entries").insert(payload).select("*").single();
 if(error)return toast("Couldn't add favourite: "+error.message);
 state.menuEntries.push(data);state.previewingFavourite=null;$("#favouritePreviewDialog").close();renderMenu();toast("Favourite added to menu.");
}
function openMealDialog(date,type,entry){
 state.editingMealId=entry?.id||null;state.activeMenuSlot=type;state.selectedMealImage=entry?.image_key|| (type==="breakfast"?"breakfast":"dinner");
 $("#mealDialogTitle").textContent=entry?"Edit meal":`Add ${type}`;
 $("#mealName").value=entry?.name||"";
 $("#mealType").value=type;
 $("#mealIngredients").value=(entry?.ingredients||[]).map(x=>`${x.name}${x.quantity&&x.quantity!=="1"?" x "+x.quantity:""}`).join("\n");
 $("#mealSaveFavourite").checked=false;$("#mealDialog").dataset.date=date;
 updateSelectedMealArt();
 $("#mealForm .meal-delete")?.remove();
 if(entry){const del=document.createElement("button");del.type="button";del.className="text-button meal-delete";del.textContent="Delete meal";del.onclick=async()=>{if(!confirm("Delete this meal from the menu?"))return;const {error}=await db.from("menu_entries").delete().eq("id",entry.id);if(error)return toast("Couldn't delete meal: "+error.message);state.menuEntries=state.menuEntries.filter(x=>x.id!==entry.id);$("#mealDialog").close();renderMenu();};$("#mealForm").append(del);}
 $("#mealDialog").showModal();
}
function parseIngredients(raw){return raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const m=line.match(/^(.*?)\s+x\s+(.+)$/i);return {name:(m?m[1]:line).trim(),quantity:m?m[2].trim():"1"};}).filter(x=>x.name);}
async function hasMealInSlot(date,type,excludeId=null){
 let query=db.from("menu_entries").select("id,name").eq("household_id",state.householdId).eq("entry_date",date).eq("meal_type",type);
 if(excludeId)query=query.neq("id",excludeId);
 const {data,error}=await query;
 if(error){toast("Couldn't check this meal slot: "+error.message);return true;}
 if(data?.length){toast(`There is already a ${type} planned for this day (${data[0].name}). Edit or swap it instead of adding another.`);return true;}
 return false;
}
async function saveMeal(e){
 e.preventDefault();const name=$("#mealName").value.trim();if(!name)return;
 const date=$("#mealDialog").dataset.date,ingredients=parseIngredients($("#mealIngredients").value);
 if(await hasMealInSlot(date,$("#mealType").value,state.editingMealId))return;
 const payload={household_id:state.householdId,entry_date:date,meal_type:$("#mealType").value,name:name.slice(0,90),image_key:state.selectedMealImage,ingredients,created_by:state.user.id};
 let result;
 if(state.editingMealId)result=await db.from("menu_entries").update(payload).eq("id",state.editingMealId).select("*").single();
 else result=await db.from("menu_entries").insert(payload).select("*").single();
 if(result.error)return toast("Couldn't save meal: "+result.error.message);
 if(state.editingMealId)state.menuEntries=state.menuEntries.map(x=>x.id===result.data.id?result.data:x);else state.menuEntries.push(result.data);
 if($("#mealSaveFavourite").checked)await saveFavouriteFrom(result.data);
 $("#mealDialog").close();renderMenu();toast("Meal saved.");
}
async function saveFavouriteFrom(entry){
 const {error}=await db.from("menu_favourites").upsert({household_id:state.householdId,name:entry.name,image_key:entry.image_key,ingredients:entry.ingredients,created_by:state.user.id},{onConflict:"household_id,name"});
 if(error)toast("Meal saved, but favourite couldn't be saved: "+error.message);
 else await loadMenuFavourites();
}
async function loadMenu(){
 if(!state.householdId)return;
 const start=new Date(`${state.menuStart||localISO(mondayOf(new Date()))}T12:00:00`),end=new Date(start);end.setDate(end.getDate()+13);
 const today=localISO(new Date());
 const [current,missed]=await Promise.all([
  db.from("menu_entries").select("*").eq("household_id",state.householdId).gte("entry_date",localISO(start)).lte("entry_date",localISO(end)).order("entry_date"),
  db.from("menu_entries").select("*").eq("household_id",state.householdId).lt("entry_date",today).eq("is_completed",false).order("entry_date")
 ]);
 if(current.error||missed.error){console.warn(current.error||missed.error);toast("Couldn't load menu tracking. Check the 1.7.0 database update.");return;}
 state.menuEntries=current.data||[];state.missedMeals=missed.data||[];renderMenu();if($("#dashboardPanel")&&!$("#dashboardPanel").classList.contains("hidden"))renderDashboard();
}
async function loadMenuFavourites(){
 const {data,error}=await db.from("menu_favourites").select("*").eq("household_id",state.householdId).order("name");
 if(error){console.warn(error);return;}state.menuFavourites=data||[];
}
function renderFavouritesList(){
 const host=$("#favouritesList");if(!host)return;host.innerHTML="";
 const q=normaliseMealText($("#favouriteSearch")?.value||"");const category=$("#favouriteCategoryFilter")?.value||"all";
 const filtered=state.menuFavourites.filter(f=>{const cat=favouriteCategory(f);const text=normaliseMealText([f.name,...(f.ingredients||[]).map(x=>x.name)].join(" "));return (!q||text.includes(q))&&(category==="all"||cat===category);});
 if(!state.menuFavourites.length){host.textContent="No favourite meals saved yet. Save a meal as a favourite when adding a meal.";return;}
 if(!filtered.length){host.textContent="No favourites match that search. Try another meal name, ingredient or category.";return;}
 filtered.forEach(f=>{const row=document.createElement("div");row.className="favourite-row";const icon=document.createElement("span");setMealArt(icon,f.image_key);const content=document.createElement("div");content.className="favourite-row-content";const name=document.createElement("strong");name.textContent=f.name;const detail=document.createElement("small");detail.textContent=`${(f.ingredients||[]).length} ingredients`;content.append(name,detail);
 const categorySelect=document.createElement("select");categorySelect.className="favourite-category-select";categorySelect.setAttribute("aria-label",`Category for ${f.name}`);favouriteCategories.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;o.selected=c===favouriteCategory(f);categorySelect.append(o);});categorySelect.onchange=()=>saveFavouriteCategory(f,categorySelect.value===autoFavouriteCategory(f)?null:categorySelect.value);
 const actions=document.createElement("div");actions.className="favourite-actions";const use=document.createElement("button");use.type="button";use.className="secondary-button compact";use.textContent="Add to menu";use.onclick=()=>{state.pendingFavourite=f;$("#favouritesDialog").close();openDatePicker(localISO(new Date()),"dinner","favourite");};const remove=document.createElement("button");remove.type="button";remove.className="favourite-remove";remove.textContent="×";remove.title="Remove favourite";remove.setAttribute("aria-label",`Remove ${f.name} from favourites`);remove.onclick=async()=>{if(!confirm(`Remove “${f.name}” from favourite meals? This won't delete meals already planned.`))return;const {error}=await db.from("menu_favourites").delete().eq("id",f.id);if(error)return toast("Couldn't remove favourite: "+error.message);state.menuFavourites=state.menuFavourites.filter(x=>x.id!==f.id);renderFavouritesList();toast("Favourite removed.");};actions.append(use,remove);row.append(icon,content,categorySelect,actions);host.append(row);});
}
async function showFavourites(){await loadFavouriteCategories();await loadMenuFavourites();$("#favouriteSearch").value="";$("#favouriteCategoryFilter").innerHTML='<option value="all">All categories</option>';favouriteCategories.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;$("#favouriteCategoryFilter").append(o);});renderFavouritesList();$("#favouritesDialog").showModal();}


function mealFinderNormalise(value){return normaliseMealText(String(value||"")).replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}
function mealFinderIngredients(){return $('#mealFinderInput').value.split(/[,;\n]+/).map(x=>mealFinderNormalise(x)).filter(Boolean);}
function mealIngredientMatch(recipeIngredient,have){const key=mealFinderNormalise(recipeIngredient);return have.some(h=>key===h||key.includes(h)||h.includes(key)||key.split(' ').some(w=>w.length>3&&h.split(' ').includes(w)));}
function mealFinderCard({name,image,source,matched,missing,onView,onAdd,onSave}){
 const card=document.createElement('article');card.className='meal-finder-card';
 const head=document.createElement('div');head.className='meal-finder-card-head';
 const art=document.createElement('img');art.className='meal-finder-photo';art.alt='';art.loading='lazy';art.src=image||'./icon-192.png';
 const titleWrap=document.createElement('div');titleWrap.className='meal-finder-title';const title=document.createElement('strong');title.textContent=name;const score=document.createElement('small');score.textContent=`${matched.length} of ${matched.length+missing.length} ingredients available · ${source}`;titleWrap.append(title,score);head.append(art,titleWrap);card.append(head);
 const haveLine=document.createElement('p');haveLine.className='meal-finder-have';haveLine.textContent='You have: '+(matched.length?matched.join(', '):'None of the listed ingredients');card.append(haveLine);
 const missingLine=document.createElement('p');missingLine.className='meal-finder-missing';missingLine.textContent=missing.length?"You'll need: "+missing.join(', '):"You've got everything for this meal!";card.append(missingLine);
 const actions=document.createElement('div');actions.className='meal-finder-actions';const view=document.createElement('button');view.type='button';view.className='secondary-button compact';view.textContent='View recipe';view.onclick=onView;actions.append(view);
 if(missing.length){const add=document.createElement('button');add.type='button';add.className='secondary-button compact';add.textContent='Add missing to list';add.onclick=onAdd;actions.append(add);}
 if(onSave){const save=document.createElement('button');save.type='button';save.className='secondary-button compact';save.textContent='Save as favourite';save.onclick=onSave;actions.append(save);}card.append(actions);return card;
}
function showMealRecipe(recipe,source){
 const host=$('#mealRecipeContent');host.innerHTML='';const title=document.createElement('h3');title.textContent=recipe.name;host.append(title);
 if(recipe.image){const img=document.createElement('img');img.className='meal-recipe-image';img.src=recipe.image;img.alt=recipe.name;host.append(img);}
 const ingredients=document.createElement('h4');ingredients.textContent='Ingredients';host.append(ingredients);const ul=document.createElement('ul');(recipe.ingredients||[]).forEach(x=>{const li=document.createElement('li');li.textContent=[x.quantity,x.name].filter(Boolean).join(' ');ul.append(li);});host.append(ul);
 const instructions=document.createElement('h4');instructions.textContent='Method';host.append(instructions);
 const method=document.createElement('div');method.className='meal-recipe-method';
 const rawMethod=String(recipe.instructions||'No cooking instructions were supplied for this recipe.').replace(/\r\n?/g,'\n').trim();
 const stepMatches=[...rawMethod.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+/g)];
 if(stepMatches.length>=2){
  const list=document.createElement('ol');list.className='meal-recipe-steps';
  for(let i=0;i<stepMatches.length;i++){
   const start=stepMatches[i].index+stepMatches[i][0].length;
   const end=i+1<stepMatches.length?stepMatches[i+1].index:rawMethod.length;
   const stepText=rawMethod.slice(start,end).trim();
   if(stepText){const li=document.createElement('li');li.textContent=stepText;list.append(li);}
  }
  method.append(list);
 }else{
  rawMethod.split(/\n\s*\n/).filter(Boolean).forEach(part=>{const p=document.createElement('p');p.textContent=part.trim();method.append(p);});
 }
 host.append(method);
 const sourceLine=document.createElement('p');sourceLine.className='meal-recipe-source';sourceLine.textContent='Recipe source: '+source+' · Recipe data provided by TheMealDB';host.append(sourceLine);const credit=document.createElement('a');credit.href='https://www.themealdb.com/';credit.target='_blank';credit.rel='noopener';credit.textContent='TheMealDB';credit.className='meal-recipe-link';host.append(credit);
 if(recipe.url){const link=document.createElement('a');link.href=recipe.url;link.target='_blank';link.rel='noopener';link.textContent='Open original recipe';link.className='meal-recipe-link';host.append(link);}
 $('#mealRecipeDialog').showModal();
}
async function saveFinderFavourite(recipe){const {error}=await db.from('menu_favourites').upsert({household_id:state.householdId,name:recipe.name,image_key:'dinner',ingredients:recipe.ingredients,created_by:state.user.id},{onConflict:'household_id,name'});if(error)return toast("Couldn't save favourite: "+error.message);await loadMenuFavourites();toast('Saved to favourite meals.');}
async function findMealsFromIngredients(){
 const have=mealFinderIngredients();const host=$('#mealFinderResults');host.innerHTML='';if(!have.length){host.textContent='Enter ingredients you have at home, separated by commas.';return;}
 const heading=document.createElement('h3');heading.className='meal-finder-section-title';heading.textContent='Your favourite meals';host.append(heading);
 const favResults=(state.menuFavourites||[]).map(f=>{const ingredients=(f.ingredients||[]).map(x=>({...x,_key:mealFinderNormalise(x.name)})).filter(x=>x._key);const matched=ingredients.filter(x=>mealIngredientMatch(x.name,have));const missing=ingredients.filter(x=>!matched.includes(x));return {f,ingredients,matched,missing,score:ingredients.length?matched.length/ingredients.length:0};}).filter(x=>x.matched.length>0).sort((a,b)=>b.score-a.score||b.matched.length-a.matched.length);
 if(!favResults.length){const empty=document.createElement('p');empty.className='list-picker-intro';empty.textContent='No saved favourites match those ingredients yet.';host.append(empty);}else favResults.forEach(r=>{const recipe={name:r.f.name,image:null,ingredients:r.ingredients.map(x=>({name:x.name,quantity:x.quantity||''})),instructions:''};host.append(mealFinderCard({name:r.f.name,image:'',source:'Your favourites',matched:r.matched.map(x=>x.name),missing:r.missing.map(x=>x.name),onView:()=>showMealRecipe(recipe,'Your saved favourite'),onAdd:()=>addMealIngredients({...recipe,ingredients:r.missing.map(x=>({name:x.name,quantity:x.quantity||'1'}))})}));});
 const onlineHeading=document.createElement('h3');onlineHeading.className='meal-finder-section-title';onlineHeading.textContent='More meal ideas';host.append(onlineHeading);const loading=document.createElement('p');loading.textContent='Searching recipe ideas…';host.append(loading);
 try{
  const api='https://www.themealdb.com/api/json/v1/1';const searchTerms=have.slice(0,3);const lists=await Promise.all(searchTerms.map(async term=>{const res=await fetch(`${api}/filter.php?i=${encodeURIComponent(term.replace(/\s+/g,'_'))}`);if(!res.ok)throw new Error('Recipe search unavailable');const data=await res.json();return data.meals||[];}));
  const ids=[...new Set(lists.flat().map(x=>x.idMeal))].slice(0,10);const details=await Promise.all(ids.map(async id=>{const res=await fetch(`${api}/lookup.php?i=${encodeURIComponent(id)}`);if(!res.ok)return null;const data=await res.json();return data.meals?.[0]||null;}));
  const recipes=details.filter(Boolean).map(m=>{const ingredients=[];for(let i=1;i<=20;i++){const name=(m[`strIngredient${i}`]||'').trim();if(name)ingredients.push({name,quantity:(m[`strMeasure${i}`]||'').trim()});}const matched=ingredients.filter(x=>mealIngredientMatch(x.name,have));const missing=ingredients.filter(x=>!matched.includes(x));return {id:m.idMeal,name:m.strMeal,image:m.strMealThumb,ingredients,matched,missing,instructions:m.strInstructions||'',url:m.strSource||m.strYoutube||''};}).filter(x=>x.matched.length>0).sort((a,b)=>(b.matched.length/Math.max(1,b.ingredients.length))-(a.matched.length/Math.max(1,a.ingredients.length))||b.matched.length-a.matched.length);
  loading.remove();if(!recipes.length){const none=document.createElement('p');none.className='list-picker-intro';none.textContent='No online recipes matched those ingredients. Try adding a main ingredient such as chicken, potato or pasta.';host.append(none);}
  recipes.slice(0,8).forEach(r=>host.append(mealFinderCard({name:r.name,image:r.image,source:'TheMealDB',matched:r.matched.map(x=>x.name),missing:r.missing.map(x=>x.name),onView:()=>showMealRecipe(r,'TheMealDB'),onAdd:()=>addMealIngredients({...r,ingredients:r.missing.map(x=>({name:x.name,quantity:x.quantity||'1'}))}),onSave:()=>saveFinderFavourite(r)})));
 }catch(error){loading.textContent='Online recipe search is temporarily unavailable. Your saved favourite matches are still shown.';console.warn('Meal finder online search failed',error);}
 const bbc=document.createElement('a');bbc.className='meal-finder-bbc-link';bbc.href=`https://www.bbcgoodfood.com/search?q=${encodeURIComponent(have.join(' '))}`;bbc.target='_blank';bbc.rel='noopener';bbc.textContent='Find more ideas on BBC Good Food ↗';host.append(bbc);
 const sw=document.createElement('a');sw.className='meal-finder-bbc-link';sw.href=`https://www.google.com/search?q=${encodeURIComponent('Slimming World recipes '+have.join(' '))}`;sw.target='_blank';sw.rel='noopener';sw.textContent='Search for Slimming World-style recipes ↗';host.append(sw);
}
async function openMealFinder(){
 await loadMenuFavourites();
 $("#mealFinderInput").value="";$("#mealFinderResults").innerHTML="";
 $("#mealFinderDialog").showModal();
}

async function addMealIngredients(entry){
 const ingredients=entry.ingredients||[];if(!ingredients.length)return toast("No ingredients saved for this meal yet.");
 const {data:lists,error}=await db.from("shopping_lists").select("*").eq("household_id",state.householdId).order("created_at");
 if(error||!lists?.length)return toast("Couldn't load your shopping lists.");
 state.pendingMealIngredients=entry;state.selectedShoppingListId=state.currentListId||lists[0].id;
 const host=$("#shoppingListChoices");host.innerHTML="";
 lists.forEach(list=>{const b=document.createElement("button");b.type="button";b.className="shopping-list-choice"+(list.id===state.selectedShoppingListId?" selected":"");const icon=document.createElement("span");icon.className="shopping-list-choice-icon";icon.textContent=list.is_shared?"👥":"🔒";const info=document.createElement("span");info.className="shopping-list-choice-info";const name=document.createElement("strong");name.textContent=list.name;const desc=document.createElement("small");desc.textContent=list.is_shared?"Shared with your household":"Private list";info.append(name,desc);const tick=document.createElement("span");tick.className="shopping-list-choice-check";tick.textContent=list.id===state.selectedShoppingListId?"✓":"";b.append(icon,info,tick);b.onclick=()=>{state.selectedShoppingListId=list.id;host.querySelectorAll(".shopping-list-choice").forEach(x=>{const yes=x===b;x.classList.toggle("selected",yes);x.querySelector(".shopping-list-choice-check").textContent=yes?"✓":"";});$("#confirmListPicker").disabled=false;};host.append(b);});
 $("#confirmListPicker").disabled=!state.selectedShoppingListId;$("#shoppingListPickerDialog").showModal();
}
async function confirmMealIngredients(){
 const entry=state.pendingMealIngredients;if(!entry)return;const targetId=state.selectedShoppingListId;
 const {data:target,error:targetError}=await db.from("shopping_lists").select("*").eq("id",targetId).single();if(targetError||!target)return toast("Couldn't find that shopping list.");
 const btn=$("#confirmListPicker");btn.disabled=true;btn.textContent="Adding…";let failures=0;
 for(const ing of entry.ingredients||[]){const numeric=Number(ing.quantity),itemName=Number.isFinite(numeric)&&numeric>0?ing.name:`${ing.name} (${ing.quantity})`,addQty=Number.isFinite(numeric)&&numeric>0?Math.max(1,Math.round(numeric)):1;const {data:existing,error:lookupError}=await db.from("shopping_items").select("*").eq("list_id",target.id).ilike("name",itemName).maybeSingle();if(lookupError){failures++;continue;}if(existing){const {error}=await db.from("shopping_items").update({quantity:existing.quantity+addQty,updated_by:state.user.id,updated_at:new Date().toISOString()}).eq("id",existing.id);if(error)failures++;}else{const {error}=await db.from("shopping_items").insert({household_id:state.householdId,list_id:target.id,name:itemName,quantity:addQty,is_bought:false,category:await categoryForNewItem(itemName),created_by:state.user.id,updated_by:state.user.id});if(error)failures++;}}
 $("#shoppingListPickerDialog").close();btn.textContent="Add ingredients";btn.disabled=false;state.pendingMealIngredients=null;if(target.id===state.currentListId)await refreshCurrentList();toast(failures?`Added with ${failures} ingredient error(s).`:`Ingredients added to ${target.name}.`);
}

const DEFAULT_SHOP_CATEGORIES=["Fruit & Veg","Meat & Fish","Dairy & Eggs","Bakery","Frozen","Tins & Dry Goods","Drinks","Snacks","Household","Other"];
let SHOP_CATEGORIES=[...DEFAULT_SHOP_CATEGORIES],learnedCategoryRules=[];
const CATEGORY_KEY="lb-show-shopping-categories";
state.showShoppingCategories=localStorage.getItem(CATEGORY_KEY)==="true";
function normalizeItemName(name){return String(name||"").trim().toLowerCase().replace(/\s+/g," ");}
async function loadHouseholdCategories(){
 const [cats,rules]=await Promise.all([
  db.from("household_categories").select("*").eq("household_id",state.householdId).order("sort_order").order("name"),
  db.from("household_item_category_rules").select("*").eq("household_id",state.householdId)
 ]);
 if(cats.error||rules.error){console.warn("Category tables unavailable. Run the 1.7.13 SQL migration.",cats.error||rules.error);SHOP_CATEGORIES=[...DEFAULT_SHOP_CATEGORIES];learnedCategoryRules=[];return;}
 const custom=(cats.data||[]).map(x=>x.name);
 SHOP_CATEGORIES=[...new Set([...DEFAULT_SHOP_CATEGORIES,...custom])];
 learnedCategoryRules=rules.data||[];
}
const CATEGORY_CONCEPTS={
 "Fruit & Veg":["fruit","vegetable","produce","salad","fresh produce","greengrocery"],
 "Meat & Fish":["meat","fish","seafood","poultry","butcher","protein"],
 "Dairy & Eggs":["dairy","milk","cheese","yoghurt","yogurt","eggs"],
 "Bakery":["bakery","bread","baked goods","pastry"],
 "Frozen":["frozen","freezer","ice cream","frozen food"],
 "Tins & Dry Goods":["tinned","canned","cupboard","pantry","dry goods","pasta","rice"],
 "Drinks":["drink","drinks","beverage","beverages","liquid","soft drink"],
 "Snacks":["snack","snacks","treat","treats","confectionery","sweets"],
 "Household":["cleaning","household","laundry","home care","toiletries","personal care"],
 "Pet Food":["pet","pets","animal","dog","dogs","cat","cats","puppy","kitten","kibble","pet food"],
 "Baby Products":["baby","babies","infant","nappy","nappies","diaper","diapers","wipes","formula"],
 "Toiletries":["toiletry","toiletries","personal care","shampoo","conditioner","body wash","deodorant","toothpaste"],
 "Cleaning Products":["cleaning","cleaner","detergent","washing up","dishwasher","bleach","disinfectant"],
 "Alcohol":["alcohol","beer","ale","wine","cider","lager","spirits"],
 "Tea & Coffee":["tea","coffee","hot drinks","hot beverages"],
 "Health & Beauty":["health","beauty","cosmetics","skincare","makeup","vitamins"]
};
const PRODUCT_TERMS={
 "Fruit & Veg":["apple","banana","orange","grape","strawberry","blueberry","raspberry","lettuce","tomato","potato","carrot","onion","broccoli","cucumber","pepper","spinach","mushroom","avocado","salad","fruit","veg","leek","pear","cabbage","courgette","celery","garlic"],
 "Meat & Fish":["chicken","beef","pork","lamb","sausage","bacon","ham","mince","steak","turkey","fish","salmon","tuna","prawn","cod","haddock","chops","meatballs"],
 "Dairy & Eggs":["milk","cheese","yoghurt","yogurt","butter","cream","egg","custard"," fromage","mozzarella","cheddar"],
 "Bakery":["bread","roll","bun","bagel","croissant","wrap","pitta","pita","cake","muffin","pastry","crumpet","toast"],
 "Frozen":["frozen","ice cream","pizza","chips","fries","nugget","waffle","fish fingers","frozen peas","frozen vegetables"],
 "Tins & Dry Goods":["pasta","rice","noodle","flour","sugar","cereal","oat","bean","lentil","tinned","tin","sauce","stock","coffee","tea","spaghetti"],
 "Drinks":["water","juice","cola","lemonade","drink","squash","fizzy","pop","ale","beer","wine","cider","lager","soda","cordial","energy drink","tonic","prosecco"],
 "Snacks":["crisp","crisps","chocolate","biscuit","sweet","snack","nut","popcorn","cracker","sharing bag"],
 "Household":["washing powder","detergent","toilet roll","tissue","kitchen roll","cleaner","bleach","shampoo","soap","toothpaste","bin bag","foil","cling film","washing up liquid","dishwasher tablets"],
 "Pet Food":["dog food","cat food","puppy food","kitten food","pet food","kibble","dog biscuits","cat biscuits","bird seed","rabbit food","hamster food","pet treats","chew sticks"],
 "Baby Products":["nappy","nappies","diaper","diapers","baby wipes","baby food","baby formula","infant formula","teething"],
 "Toiletries":["shampoo","conditioner","body wash","deodorant","toothpaste","toothbrush","shower gel","sanitary","razor","moisturiser"],
 "Cleaning Products":["washing up liquid","dishwasher tablets","laundry detergent","fabric softener","surface cleaner","toilet cleaner","disinfectant","bleach","sponges"],
 "Alcohol":["beer","ale","wine","cider","lager","prosecco","vodka","gin","whisky","rum"],
 "Tea & Coffee":["tea bags","coffee","ground coffee","instant coffee","coffee beans","hot chocolate"],
 "Health & Beauty":["vitamins","skincare","makeup","moisturiser","sun cream","sunscreen","face wash"]
};
function termMatches(text,term){
 const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 return new RegExp("(^|[^a-z0-9])"+escaped.replace(/\s+/g,"\\s+")+"([^a-z0-9]|$)","i").test(text);
}
function inferCustomCategory(name){
 const text=normalizeItemName(name);
 let best=null,bestScore=0;
 for(const cat of SHOP_CATEGORIES){
  if(DEFAULT_SHOP_CATEGORIES.includes(cat))continue;
  const label=normalizeItemName(cat);
  const words=label.split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const concepts=CATEGORY_CONCEPTS[cat]||[];
  const terms=PRODUCT_TERMS[cat]||[];
  let score=0;
  if(termMatches(text,label))score+=12;
  for(const word of words)if(termMatches(text,word))score+=5;
  for(const alias of concepts)if(termMatches(text,alias))score+=4;
  for(const term of terms)if(termMatches(text,term))score+=3;
  if(score>bestScore){bestScore=score;best=cat;}
 }
 return bestScore>=3?best:null;
}
function guessShoppingCategory(name){
 const normalized=normalizeItemName(name);
 const learned=learnedCategoryRules.find(x=>x.normalized_item_name===normalized);
 if(learned&&SHOP_CATEGORIES.includes(learned.category))return learned.category;
 const custom=inferCustomCategory(name);
 if(custom)return custom;
 const text=normalized;
 const scores=new Map(SHOP_CATEGORIES.map(cat=>[cat,0]));
 const add=(cat,terms,weight=2)=>{if(!SHOP_CATEGORIES.includes(cat))return;for(const term of terms)if(termMatches(text,term))scores.set(cat,scores.get(cat)+weight);};
 add("Fruit & Veg",PRODUCT_TERMS["Fruit & Veg"],3);
 add("Meat & Fish",PRODUCT_TERMS["Meat & Fish"],3);
 add("Dairy & Eggs",PRODUCT_TERMS["Dairy & Eggs"],3);
 add("Bakery",PRODUCT_TERMS["Bakery"],3);
 add("Frozen",PRODUCT_TERMS["Frozen"],3);
 add("Tins & Dry Goods",PRODUCT_TERMS["Tins & Dry Goods"],3);
 add("Drinks",PRODUCT_TERMS["Drinks"],3);
 add("Snacks",PRODUCT_TERMS["Snacks"],3);
 add("Household",PRODUCT_TERMS["Household"],3);
 // Product-specific phrases outrank broad ingredient words, e.g. chicken nuggets -> Frozen.
 if(termMatches(text,"chicken nuggets")||termMatches(text,"fish fingers")||termMatches(text,"frozen chips"))scores.set("Frozen",(scores.get("Frozen")||0)+8);
 if(termMatches(text,"dog biscuits")||termMatches(text,"cat biscuits"))scores.set("Pet Food",(scores.get("Pet Food")||0)+10);
 const ranked=[...scores.entries()].filter(([cat,score])=>cat!=="Other"&&score>0).sort((a,b)=>b[1]-a[1]);
 return ranked.length?ranked[0][0]:"Other";
}
async function categoryForNewItem(name){
 const normalized=normalizeItemName(name);
 const rule=learnedCategoryRules.find(x=>x.normalized_item_name===normalized);
 if(rule&&SHOP_CATEGORIES.includes(rule.category))return rule.category;
 return guessShoppingCategory(name);
}
async function backfillItemCategories(){
 const uncategorised=state.items.filter(x=>!x.category);
 for(const item of uncategorised){
  const category=await categoryForNewItem(item.name);item.category=category;
  db.from("shopping_items").update({category}).eq("id",item.id).then(({error})=>{if(error)console.warn("Category save failed",error);});
 }
}
async function setItemCategory(item,category){
 if(!SHOP_CATEGORIES.includes(category))return;
 if(!await update(item,{category}))return;
 const normalized=normalizeItemName(item.name);
 const {data,error}=await db.from("household_item_category_rules").upsert({household_id:state.householdId,normalized_item_name:normalized,category,updated_by:state.user.id},{onConflict:"household_id,normalized_item_name"}).select("*").single();
 if(error){toast("Category changed, but couldn't save the learning rule. Check the SQL migration.");return;}
 learnedCategoryRules=learnedCategoryRules.filter(x=>x.normalized_item_name!==normalized);learnedCategoryRules.push(data);
 toast(`I'll remember ${item.name} as ${category}.`);
}
let renamingCategory=null;
function renderManageCategories(){
 const host=$("#manageCategoryList");host.innerHTML="";
 SHOP_CATEGORIES.forEach(cat=>{
  const row=document.createElement("div");row.className="manage-category-row";
  const name=document.createElement("strong");name.textContent=cat;row.append(name);
  if(!DEFAULT_SHOP_CATEGORIES.includes(cat)){
   const edit=document.createElement("button");edit.type="button";edit.className="secondary-button";edit.textContent="Rename";edit.onclick=()=>openRenameCategory(cat);
   const del=document.createElement("button");del.type="button";del.className="danger-button";del.textContent="Delete";del.onclick=()=>deleteCategory(cat);
   row.append(edit,del);
  }else{const tag=document.createElement("small");tag.textContent="Default";row.append(tag);}
  host.append(row);
 });
}
async function addCategory(e){
 e.preventDefault();const name=$("#newCategoryName").value.trim();
 if(!name)return;if(SHOP_CATEGORIES.some(x=>x.toLowerCase()===name.toLowerCase()))return toast("That category already exists.");
 const {data,error}=await db.from("household_categories").insert({household_id:state.householdId,name,sort_order:SHOP_CATEGORIES.length,created_by:state.user.id}).select("*").single();
 if(error)return toast("Couldn't add category: "+error.message);
 SHOP_CATEGORIES.push(data.name);$("#newCategoryName").value="";renderManageCategories();renderItems();toast(`${name} added.`);
}
function openRenameCategory(name){renamingCategory=name;$("#renameCategoryName").value=name;$("#renameCategoryDialog").showModal();}
async function renameCategory(e){
 e.preventDefault();if(!renamingCategory)return;const next=$("#renameCategoryName").value.trim();
 if(!next)return;if(SHOP_CATEGORIES.some(x=>x.toLowerCase()===next.toLowerCase()&&x!==renamingCategory))return toast("That category already exists.");
 const old=renamingCategory;
 const {error}=await db.from("household_categories").update({name:next}).eq("household_id",state.householdId).eq("name",old);
 if(error)return toast("Couldn't rename category: "+error.message);
 const {error:ruleError}=await db.from("household_item_category_rules").update({category:next}).eq("household_id",state.householdId).eq("category",old);
 if(ruleError)return toast("Category renamed, but some learning rules may need checking.");
 const {error:itemError}=await db.from("shopping_items").update({category:next}).eq("household_id",state.householdId).eq("category",old);
 if(itemError)return toast("Category renamed, but some existing items may not have updated.");
 SHOP_CATEGORIES=SHOP_CATEGORIES.map(x=>x===old?next:x);learnedCategoryRules=learnedCategoryRules.map(x=>x.category===old?{...x,category:next}:x);
 $("#renameCategoryDialog").close();renamingCategory=null;renderManageCategories();renderItems();toast("Category renamed.");
}
async function deleteCategory(name){
 if(!confirm(`Delete the custom category "${name}"? Items using it will be moved to Other.`))return;
 const {error}=await db.from("household_categories").delete().eq("household_id",state.householdId).eq("name",name);
 if(error)return toast("Couldn't delete category: "+error.message);
 await db.from("shopping_items").update({category:"Other"}).eq("household_id",state.householdId).eq("category",name);
 await db.from("household_item_category_rules").delete().eq("household_id",state.householdId).eq("category",name);
 SHOP_CATEGORIES=SHOP_CATEGORIES.filter(x=>x!==name);learnedCategoryRules=learnedCategoryRules.filter(x=>x.category!==name);
 renderManageCategories();renderItems();toast(`${name} deleted. Its items moved to Other.`);
}
const CATEGORY_ACCENT_COLORS=["#55b6e8","#e58b55","#69b987","#bd91ed","#e17b9b","#c5a65b","#4ebbb2","#df9c55","#8c9ee8","#98a2b3"];
function categoryAccentColor(category){const i=Math.max(0,SHOP_CATEGORIES.indexOf(category));return CATEGORY_ACCENT_COLORS[i%CATEGORY_ACCENT_COLORS.length];}
const CALENDAR_FUNCTION_URL=`${SUPABASE_URL}/functions/v1/google-calendar-oauth`;
function renderCalendarShifts(){
 const status=$("#calendarStatus"),host=$("#calendarShifts"),button=$("#connectCalendarButton"),refresh=$("#refreshCalendarButton");
 if(!status||!host||!button||!refresh)return;
 host.innerHTML="";
 if(state.calendar.loading){status.textContent="Checking Beth's calendar…";button.classList.add("hidden");refresh.classList.add("hidden");return;}
 if(!state.calendar.connected){status.textContent=state.calendar.error||"Connect your Google Calendar to show Beth's upcoming shifts here.";button.classList.remove("hidden");refresh.classList.add("hidden");button.textContent="Connect Google Calendar";return;}
 status.textContent=state.calendar.email?`Connected · ${state.calendar.email}`:"Google Calendar connected";
 button.classList.add("hidden");refresh.classList.remove("hidden");
 if(!state.calendar.shifts.length){const empty=document.createElement("p");empty.className="dashboard-muted";empty.textContent="No matching shifts found in the next 30 days.";host.append(empty);return;}
 state.calendar.shifts.slice(0,5).forEach(shift=>{
  const row=document.createElement("div");row.className="calendar-shift-row";
  const date=document.createElement("strong");
  const start=new Date(shift.start),end=new Date(shift.end);
  date.textContent=shift.start?.includes("T")?start.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}):start.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  const finishBlock=document.createElement("div");finishBlock.className="calendar-shift-finish";
  if(shift.end?.includes("T")&&!Number.isNaN(end.getTime())){
   const finishMinutes=end.getHours()*60+end.getMinutes();
   const greenUntil=pickupColourTimes.greenUntil.split(":").map(Number);const amberUntil=pickupColourTimes.amberUntil.split(":").map(Number);const greenLimit=greenUntil[0]*60+greenUntil[1];const amberLimit=amberUntil[0]*60+amberUntil[1];const finishTone=finishMinutes<greenLimit?"green":finishMinutes<=amberLimit?"amber":"red";
   finishBlock.classList.add(`calendar-shift-finish-${finishTone}`);
  }
  const finishLabel=document.createElement("small");finishLabel.textContent="FINISHES";
  const finish=document.createElement("strong");finish.className="calendar-shift-finish-time";finish.textContent=shift.end?.includes("T")?end.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"All day";
  finishBlock.append(finishLabel,finish);
  const times=document.createElement("small");times.className="calendar-shift-hours";
  times.textContent=shift.start?.includes("T")&&shift.end?.includes("T")?`Shift ${start.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})} – ${end.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`:"All-day shift";
  row.append(date,finishBlock,times);host.append(row);
 });
}
async function requestCalendar(action){
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw new Error("Please sign in again to connect your calendar.");
 const response=await fetch(`${CALENDAR_FUNCTION_URL}?action=${encodeURIComponent(action)}`,{method:"GET",headers:{"Authorization":`Bearer ${session.access_token}`,"apikey":SUPABASE_PUBLISHABLE_KEY}});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(result.error||result.message||`Calendar request failed (${response.status}).`);
 return result;
}
async function connectGoogleCalendar(){
 const button=$("#connectCalendarButton");busy(button,true,"Opening Google…");
 try{const result=await requestCalendar("connect");if(!result.authorizationUrl)throw new Error("Google authorisation link wasn't returned.");window.location.href=result.authorizationUrl;}
 catch(error){busy(button,false);toast(error.message||"Couldn't start Google Calendar connection.");}
}
async function loadCalendarShifts(force=false){
 if(state.calendar.loading||(!force&&state.calendar.loaded))return;
 state.calendar.loading=true;state.calendar.error=null;renderCalendarShifts();
 try{
  const result=await requestCalendar("events");
  state.calendar.connected=!!result.connected;state.calendar.shifts=result.shifts||[];state.calendar.email=result.calendarEmail||null;state.calendar.loaded=true;
 }catch(error){
  state.calendar.connected=false;state.calendar.shifts=[];state.calendar.loaded=true;
  if(String(error.message).includes("404"))state.calendar.error="Google Calendar hasn't been connected yet.";
  else state.calendar.error=error.message;
 }
 finally{state.calendar.loading=false;renderCalendarShifts();state.weather.loaded=false;loadWeather(true);}
}
const PLYMOUTH_WEATHER={latitude:50.3755,longitude:-4.1427,name:"Plymouth city centre"};
function weatherDescription(code){
 const map={0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Depositing rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Heavy freezing drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Light showers",81:"Showers",82:"Heavy showers",85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with heavy hail"};
 return map[code]||"Forecast unavailable";
}
function weatherEmoji(code){if(code===0)return "☀️";if([1,2].includes(code))return "🌤️";if(code===3)return "☁️";if([45,48].includes(code))return "🌫️";if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return "🌧️";if([71,73,75,77,85,86].includes(code))return "🌨️";if([95,96,99].includes(code))return "⛈️";return "🌦️";}
function nextShiftForWeather(){
 const now=Date.now();
 return state.calendar.shifts.filter(x=>x.end&&x.end.includes("T")&&new Date(x.end).getTime()>=now).sort((a,b)=>new Date(a.end)-new Date(b.end))[0]||null;
}
function renderWeather(){
 const status=$("#weatherStatus"),host=$("#weatherForecast"),button=$("#refreshWeatherButton");if(!status||!host||!button)return;
 host.innerHTML="";button.disabled=state.weather.loading;
 if(state.weather.loading){status.textContent="Checking the forecast for Beth's finish time…";return;}
 if(!state.calendar.connected){status.textContent="Connect Google Calendar to see the forecast at Beth's next finish time.";return;}
 if(state.weather.error){status.textContent=state.weather.error;return;}
 if(!state.weather.data){status.textContent="Weather will appear for Beth's next upcoming shift.";return;}
 const w=state.weather.data;
 status.textContent=`${w.shiftLabel} · ${w.finishLabel} · ${PLYMOUTH_WEATHER.name}`;
 const main=document.createElement("div");main.className="weather-main";
 const icon=document.createElement("span");icon.className="weather-icon";icon.textContent=weatherEmoji(w.code);
 const summary=document.createElement("div");summary.className="weather-summary";
 const temp=document.createElement("strong");temp.className="weather-temperature";temp.textContent=`${Math.round(w.temperature)}°C`;
 const desc=document.createElement("span");desc.textContent=weatherDescription(w.code);
 summary.append(temp,desc);main.append(icon,summary);host.append(main);
 const details=document.createElement("div");details.className="weather-details";
 [["Feels like",`${Math.round(w.apparent)}°C`],["Chance of rain",w.rain===null?"—":`${Math.round(w.rain)}%`],["Wind",`${Math.round(w.wind)} mph`]].forEach(([label,value])=>{const item=document.createElement("div");item.className="weather-detail";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=value;item.append(l,v);details.append(item);});
 host.append(details);
}
async function loadWeather(force=false){
 if(state.weather.loading||(!force&&state.weather.loaded))return;
 if(!state.calendar.connected){state.weather.loaded=true;renderWeather();return;}
 const shift=nextShiftForWeather();
 if(!shift){state.weather.loaded=true;state.weather.error="No upcoming timed shift found to forecast yet.";renderWeather();return;}
 const finish=new Date(shift.end);if(Number.isNaN(finish.getTime()))return;
 state.weather.loading=true;state.weather.error=null;renderWeather();
 try{
  const params=new URLSearchParams({latitude:String(PLYMOUTH_WEATHER.latitude),longitude:String(PLYMOUTH_WEATHER.longitude),hourly:"temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m",wind_speed_unit:"mph",temperature_unit:"celsius",timezone:"Europe/London",forecast_days:"16"});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if(!response.ok)throw new Error(`Weather service returned ${response.status}.`);
  const result=await response.json();const times=result.hourly?.time||[];
  if(!times.length)throw new Error("The weather forecast is temporarily unavailable.");
  let best=-1,bestDiff=Infinity;
  times.forEach((t,i)=>{const diff=Math.abs(new Date(t).getTime()-finish.getTime());if(diff<bestDiff){bestDiff=diff;best=i;}});
  if(best<0||bestDiff>90*60*1000)throw new Error("The forecast for this shift is not available yet. Try again nearer the date.");
  const get=(key)=>result.hourly?.[key]?.[best];
  const start=new Date(shift.start);
  state.weather.data={temperature:get("temperature_2m"),apparent:get("apparent_temperature"),rain:get("precipitation_probability"),code:get("weather_code"),wind:get("wind_speed_10m"),shiftLabel:start.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"}),finishLabel:finish.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})};
  state.weather.shiftId=shift.id;state.weather.loaded=true;
 }catch(error){state.weather.error=error.message||"Couldn't load the weather forecast.";state.weather.loaded=true;}
 finally{state.weather.loading=false;renderWeather();}
}
function handleCalendarReturn(){
 const params=new URLSearchParams(location.search),result=params.get("calendar");
 if(!result)return;
 if(result==="connected"){toast("Google Calendar connected successfully.");state.calendar.loaded=false;}
 else toast(`Google Calendar connection failed${params.get("reason")?`: ${params.get("reason")}`:"."}`);
 params.delete("calendar");params.delete("reason");const query=params.toString();history.replaceState({},"",location.pathname+(query?`?${query}`:"")+location.hash);
}

function updateDashboardDateTime(){
 const now=new Date(),dateEl=$("#dashboardDate"),clockEl=$("#dashboardClock");
 if(dateEl)dateEl.textContent=now.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
 if(clockEl)clockEl.textContent=now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false});
}

function renderDashboard(){
 const today=new Date(),tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
 const todayISO=localISO(today),tomorrowISO=localISO(tomorrow);
 const remaining=state.items.filter(x=>!x.is_bought).length;
 updateDashboardDateTime();
 $("#dashRemaining").textContent=String(remaining);

 // Count consecutive dinner entries from today, stopping at the first missing dinner.
 // Menu data covers the currently loaded fortnight; never imply dates beyond that range are planned.
 const plannedDinnerDates=new Set(state.menuEntries.filter(x=>x.meal_type==="dinner").map(x=>x.entry_date));
 const menuStart=new Date(`${state.menuStart||localISO(mondayOf(today))}T12:00:00`);
 const menuEnd=new Date(menuStart);menuEnd.setDate(menuEnd.getDate()+13);
 const daysAvailable=Math.max(0,Math.floor((new Date(localISO(menuEnd)+"T12:00:00")-new Date(todayISO+"T12:00:00"))/86400000)+1);
 let consecutive=0,firstMissing=null;
 for(let offset=0;offset<daysAvailable;offset++){
  const date=new Date(today);date.setDate(date.getDate()+offset);const key=localISO(date);
  if(plannedDinnerDates.has(key))consecutive++;
  else{firstMissing=date;break;}
 }
 const daysEl=$("#dashDinnerDays"),runsOutEl=$("#dashDinnerRunsOut");
 if(daysEl&&runsOutEl){
  if(firstMissing){
   daysEl.textContent=`${consecutive} day${consecutive===1?"":"s"} left`;
   const gap=new Date(firstMissing);const diff=Math.round((new Date(localISO(gap)+"T12:00:00")-new Date(todayISO+"T12:00:00"))/86400000);
   const weekday=gap.toLocaleDateString("en-GB",{weekday:"long"});
   const dayPhrase=diff>=7?`next ${weekday}`:weekday;
   runsOutEl.textContent=diff===0?"Runs out today":`Runs out ${dayPhrase}`;
  }else if(daysAvailable>0){
   daysEl.textContent=`${consecutive} days planned`;
   runsOutEl.textContent=`Planned through ${menuEnd.toLocaleDateString("en-GB",{weekday:"long"})}`;
  }else{
   daysEl.textContent="0 days left";runsOutEl.textContent="No dinner planned today";
  }
 }
 const host=$("#dashboardCategories");host.innerHTML="";
 const cats=new Map();
 state.items.filter(x=>!x.is_bought).forEach(item=>{const cat=item.category||guessShoppingCategory(item.name)||"Other";cats.set(cat,(cats.get(cat)||0)+1);});
 if(!cats.size){const empty=document.createElement("p");empty.className="dashboard-muted";empty.textContent="Nothing left to buy — your list is all caught up.";host.append(empty);}
 else [...cats.entries()].sort((a,b)=>b[1]-a[1]).forEach(([cat,count])=>{
  const row=document.createElement("div");row.className="dashboard-category-row";
  const name=document.createElement("span");name.textContent=cat;
  const track=document.createElement("span");track.className="dashboard-category-track";
  const fill=document.createElement("span");fill.className="dashboard-category-fill";fill.style.width=`${Math.max(8,Math.round(count/remaining*100))}%`;fill.style.background=categoryAccentColor(cat);track.append(fill);
  const value=document.createElement("strong");value.textContent=String(count);row.append(name,track,value);host.append(row);
 });
 const setMeal=(id,artId,date)=>{const meal=state.menuEntries.find(x=>x.entry_date===date&&x.meal_type==="dinner");const target=$(id),art=$(artId);target.textContent=meal?(meal.name||meal.meal_name||meal.title||"Dinner planned"):"No dinner planned yet";if(art){art.replaceChildren();if(meal&&meal.image_key)setMealArt(art,meal.image_key);else art.textContent="";}};
 setMeal("#dashboardTodayMeal","#dashboardTodayArt",todayISO);setMeal("#dashboardTomorrowMeal","#dashboardTomorrowArt",tomorrowISO);
}
function renderItems(){
 const host=$("#items");host.innerHTML="";const modeHost=$("#shoppingModeItems");if(modeHost)modeHost.innerHTML="";
 const ordered=state.showShoppingCategories?SHOP_CATEGORIES.flatMap(cat=>state.items.filter(x=>(x.category||guessShoppingCategory(x.name))===cat)):state.items;
 if(state.showShoppingCategories){
  SHOP_CATEGORIES.forEach(cat=>{
   const items=ordered.filter(x=>(x.category||guessShoppingCategory(x.name))===cat);
   if(!items.length)return;
   const section=document.createElement("section");section.className="shopping-category-section";
   const heading=document.createElement("h3");heading.className="shopping-category-heading";heading.textContent=cat;heading.style.setProperty("--category-accent",categoryAccentColor(cat));
   const rows=document.createElement("div");rows.className="shopping-category-items";
   items.forEach(item=>rows.append(buildItemRow(item)));
   section.append(heading,rows);host.append(section);
  });
 }else ordered.forEach(item=>host.append(buildItemRow(item)));
 if(modeHost){
  if(state.showShoppingCategories){
   SHOP_CATEGORIES.forEach(cat=>{
    const items=ordered.filter(x=>(x.category||guessShoppingCategory(x.name))===cat);
    if(!items.length)return;
    const section=document.createElement("section");section.className="shopping-category-section";
    const heading=document.createElement("h3");heading.className="shopping-category-heading";heading.textContent=cat;heading.style.setProperty("--category-accent",categoryAccentColor(cat));
    const rows=document.createElement("div");rows.className="shopping-category-items";
    items.forEach(item=>rows.append(buildItemRow(item,true)));
    section.append(heading,rows);modeHost.append(section);
   });
  }else ordered.forEach(item=>modeHost.append(buildItemRow(item,true)));
 }
 const left=state.items.filter(x=>!x.is_bought).length;if($("#dashboardPanel")&&!$("#dashboardPanel").classList.contains("hidden"))renderDashboard();$("#remainingCount").textContent=`${left} item${left===1?"":"s"} remaining`;
 if($("#shoppingModeCount")){$("#shoppingModeCount").textContent=`${left} item${left===1?"":"s"} to buy` ;$("#shoppingModeRemaining").textContent=`${left} remaining`;}
}

function setShoppingMode(enabled){
 state.shoppingMode=enabled;$("#appShell").classList.toggle("shopping-mode-active",enabled);
 $(".topbar").classList.toggle("hidden",enabled);$(".people-strip").classList.toggle("hidden",enabled);
 $(".list-panel").classList.toggle("hidden",enabled);$("#shareButton").classList.toggle("hidden",enabled);$("#shareHint").classList.toggle("hidden",enabled);
 $("#historyPanel").classList.add("hidden");$("#dashboardPanel").classList.add("hidden");$("#notificationsPanel").classList.add("hidden");$("#menuPanel").classList.add("hidden");$("#morePanel").classList.add("hidden");
 $(".bottom-nav").classList.toggle("hidden",enabled);$("#shoppingModeScreen").classList.toggle("hidden",!enabled);
 if(enabled)renderItems();
}
async function update(item,patch){
 const previous={...item};Object.assign(item,patch);renderItems();
 const {data,error}=await db.from("shopping_items").update({...patch,updated_by:state.user.id,updated_at:new Date().toISOString()}).eq("id",item.id).select("*").single();
 if(error){Object.assign(item,previous);renderItems();toast("Couldn't save: "+error.message);return false;}
 Object.assign(item,data);renderItems();await refreshListStatus();return true;
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
function renderActivity(){const host=$("#activity");host.innerHTML="";state.activity.slice(0,12).forEach(a=>{const row=document.createElement("div");row.className="activity-row";const av=document.createElement("span");av.className="activity-avatar";av.textContent=(a.display_name||"?")[0];const cp=document.createElement("span");cp.className="activity-copy";const b=document.createElement("strong");b.textContent=(a.display_name||"Someone")+" ";cp.append(b,document.createTextNode(activityDescription(a)));const tm=document.createElement("span");tm.className="activity-time";tm.textContent=new Date(a.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});row.append(av,cp,tm);host.append(row);});if(!state.activity.length)host.textContent="Your list activity will appear here.";const dash=$("#dashboardActivity");if(dash)dash.innerHTML=host.innerHTML;}
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
function updateCompactListStatus(kind,symbol,title){
 const indicator=$("#compactListStatus"),icon=$("#compactStatusIcon"),label=$("#compactStatusText");
 if(!indicator||!icon||!label)return;
 indicator.className="compact-list-status status-"+kind;
 icon.textContent=symbol;label.textContent=title;
 const shared=!!currentList()?.is_shared;indicator.classList.toggle("hidden",!shared);
}
function renderListStatus(){
 const card=$("#listStatusCard"),approval=$("#approvalCard");if(!card||!approval)return;
 const version=state.listStatus?.list_version??1,share=state.latestShare,partner=state.partner;
 card.className="list-status-card";approval.classList.add("hidden");
 const shareButton=$("#shareButton"),shareHint=$("#shareHint");
 if(currentList()&&!currentList().is_shared){card.classList.add("hidden");updateCompactListStatus("neutral","•","Private list");if(shareButton)shareButton.classList.remove("hidden");if(shareHint)shareHint.classList.remove("hidden");return;}
 const allItemsBought=state.items.every(item=>item.is_bought);
 if(shareButton)shareButton.classList.toggle("hidden",allItemsBought);
 if(shareHint)shareHint.classList.toggle("hidden",allItemsBought);
 let symbol="↗",title="Ready to share",text=partner?`Share the latest list with ${partner.display_name} for approval.`:"Invite your partner to join your household first.",kind="status-neutral";
 if(allItemsBought){kind="status-liked";symbol="✓";title="All done!";text="You're up to date. Nothing left to buy.";} 
 else if(share&&Number(share.list_version)<Number(version)){
  kind="status-changed";symbol="◷";title="Changes made";text=`Share with ${partner?.display_name||"your partner"} for a new like.`;
 }else if(share&&Number(share.list_version)===Number(version)){
  if(state.latestApproval){kind="status-liked";symbol="👍";title=share.recipient_id===state.user?.id?"You have liked the list ✓":`${state.partner?.display_name||"Your partner"} has liked the list ✓`;text=share.recipient_id===state.user?.id?`You're up to date with ${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"your partner"}.`:"You're both up to date.";}
  else if(share.recipient_id===state.user?.id){
   kind="status-awaiting";symbol="➤";title=`${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"Your partner"} shared the list`;text="Review the latest list and like to confirm.";
   if(!state.approvalDismissed){approval.classList.remove("hidden");$("#approvalTitle").textContent=`${state.members.find(m=>m.user_id===share.sender_id)?.display_name||"Your partner"} shared the list`;$("#approvalText").textContent="Review the changes and like to confirm.";}
  }else{kind="status-awaiting";symbol="◷";title=`Shared with ${state.partner?.display_name||"your partner"}`;text=`Waiting for ${state.partner?.display_name||"them"} to review and like the list.`;}
 }
 const compactKind=kind==="liked"?"liked":kind==="changed"?"changed":kind==="awaiting"?"awaiting":"neutral";
 const compactSymbol=kind==="liked"?"✓":kind==="changed"?"↻":kind==="awaiting"?"!":"↗";
 const compactTitle=kind==="liked"?(allItemsBought?"All done":"All up to date"):kind==="changed"?"Changes made":kind==="awaiting"?(share?.recipient_id===state.user?.id?"Review shared list":"Waiting for review"):"Ready to share";
 updateCompactListStatus(compactKind,compactSymbol,compactTitle);
 card.classList.add(kind);$("#statusSymbol").textContent=symbol;$("#statusTitle").textContent=title;$("#statusText").textContent=text;applyListStatusTheme();
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
 $("#moreThemeSelect").value=state.theme;$("#showShoppingCategories").checked=!!state.showShoppingCategories;$("#pickupGreenUntil").value=pickupColourTimes.greenUntil;$("#pickupAmberUntil").value=pickupColourTimes.amberUntil;
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
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"share_events",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new.recipient_id===state.user.id)appNotice("Luke & Beth Shopping List","Your partner shared the shopping list.");})
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_list_state",filter:`household_id=eq.${state.householdId}`},()=>refreshListStatus())
 .on("postgres_changes",{event:"*",schema:"public",table:"shopping_list_shares",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new?.recipient_id===state.user.id)state.approvalDismissed=false;refreshListStatus();})
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
async function loadLoungeMessages(){
 if(!state.householdId)return;
 const host=$("#loungeMessages");
 const {data,error}=await db.from("household_lounge_messages").select("id,household_id,sender_id,sender_type,sender_name,message,created_at").eq("household_id",state.householdId).order("created_at",{ascending:true}).limit(150);
 if(error){
  host.innerHTML="";const note=document.createElement("div");note.className="lounge-empty";note.innerHTML="<span>🛠️</span><strong>One small setup step remains</strong><p>The Lounge database hasn't been installed yet. Run the 1.7.21.0 SQL setup supplied with this update, then reopen the Lounge.</p>";host.append(note);$("#loungeStatus").textContent="Waiting for the Lounge database setup.";state.loungeLoaded=false;return;
 }
 state.loungeMessages=data||[];
 const {data:directData,error:directError}=await db.from("household_lounge_direct_messages").select("id,household_id,sender_id,recipient_id,message,created_at").eq("household_id",state.householdId).order("created_at",{ascending:true}).limit(150);
 if(directError){console.warn("Direct Lounge messages unavailable:",directError.message);state.loungeDirectMessages=[];}else{state.loungeDirectMessages=(directData||[]).filter(m=>m.sender_id===state.user.id||m.recipient_id===state.user.id);}
 renderLoungeMessages();state.loungeLoaded=true;if(!state.loungeChannel)setLoungeStatus("Connecting…","connecting");
}
function renderLoungeMessages(){
 const host=$("#loungeMessages");if(!host)return;host.innerHTML="";
 const names=Object.fromEntries((state.members||[]).map(m=>[m.user_id,m.display_name||"Household member"]));
 if(!state.loungeMessages.length){const empty=document.createElement("div");empty.className="lounge-empty";empty.innerHTML="<span>💬</span><strong>It's lovely and quiet in here.</strong><p>Send the first message to get the conversation started.</p>";host.append(empty);}
 [...state.loungeMessages,...state.loungeDirectMessages].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).forEach(item=>{const direct=!!item.recipient_id;const character=item.sender_type==="character";const mine=!character&&item.sender_id===state.user?.id;const characterName=character?(item.sender_name==="Alfred"?"Wallace":item.sender_name):"";const row=document.createElement("article");row.className="lounge-message-row"+(mine?" mine":"")+(direct?" lounge-direct-message":"")+(character?" lounge-character-message lounge-"+(characterName||"character").toLowerCase():"");const avatar=character?document.createElement("img"):document.createElement("span");avatar.className="lounge-message-avatar"+(character?" lounge-avatar-image":"");if(character){avatar.src=characterName==="Gromit"?"./images/gromit-avatar.png":"./images/wallace-avatar.png";avatar.alt=characterName;}else avatar.textContent=(names[item.sender_id]||"?").slice(0,1).toUpperCase();const bubble=document.createElement("div");bubble.className="lounge-message-bubble";const meta=document.createElement("div");meta.className="lounge-message-meta";const who=document.createElement("strong");who.textContent=direct?(mine?`You → ${names[item.recipient_id]||"household member"}`:`${names[item.sender_id]||"Household member"} → You`):(mine?"You":(character?characterName:(names[item.sender_id]||"Household member")));const time=document.createElement("time");time.dateTime=item.created_at;time.textContent=new Date(item.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});meta.append(who,time);const body=document.createElement("p");body.textContent=item.message;bubble.append(meta,body);row.append(avatar,bubble);host.append(row);});
 
 // Character-specific typing rows sit inside the conversation, beside the correct avatar.
 const activeTyping=new Map([...state.loungeAICharactersTyping,...state.loungeRemoteAICharactersTyping]);
 for(const [character,info] of activeTyping){
  if(!info||Date.now()-info.at>18000)continue;
  const row=document.createElement("article");row.className="lounge-message-row lounge-character-message lounge-"+character.toLowerCase()+" lounge-typing-row";
  const avatar=document.createElement("img");avatar.className="lounge-message-avatar lounge-typing-avatar lounge-avatar-image";avatar.src=character==="Gromit"?"./images/gromit-avatar.png":"./images/wallace-avatar.png";avatar.alt=character;
  const bubble=document.createElement("div");bubble.className="lounge-message-bubble lounge-typing-bubble";
  const meta=document.createElement("div");meta.className="lounge-message-meta";const who=document.createElement("strong");who.textContent=character;const status=document.createElement("time");status.textContent="typing";meta.append(who,status);
  const dots=document.createElement("div");dots.className="lounge-typing-dots";dots.setAttribute("aria-label",character+" is typing");dots.innerHTML="<i></i><i></i><i></i>";bubble.append(meta,dots);row.append(avatar,bubble);host.append(row);
 }
 const count=$("#loungeMessageCount");if(count)count.textContent=`${state.loungeMessages.length} message${state.loungeMessages.length===1?"":"s"}`;host.scrollTop=host.scrollHeight;
}
async function sendLoungeMessage(e){
 e.preventDefault();const input=$("#loungeMessageInput"),message=input.value.trim();if(!message||!state.householdId||!state.user)return;
 const button=$("#loungeSendButton");button.disabled=true;
 try{
  const mention=message.match(/^@([\\w-]+)\\s+([\\s\\S]+)$/);
  if(mention){
   const requested=mention[1].toLowerCase();
   const recipient=(state.members||[]).find(m=>m.user_id!==state.user.id&&(m.display_name||"").toLowerCase()===requested);
   if(!recipient){toast("I couldn't find that household member. Choose their name from the @ suggestions.");return;}
   const {data,error}=await db.from("household_lounge_direct_messages").insert({household_id:state.householdId,sender_id:state.user.id,recipient_id:recipient.user_id,message:mention[2].trim().slice(0,1200)}).select("id,household_id,sender_id,recipient_id,message,created_at").single();
   if(error)throw error;
   state.loungeDirectMessages.push(data);renderLoungeMessages();input.value="";
   toast(`Sent directly to ${recipient.display_name}. Wallace will stay out of it.`);
   return;
  }
  const {data,error}=await db.from("household_lounge_messages").insert({household_id:state.householdId,sender_id:state.user.id,message:message.slice(0,1200)}).select("id,household_id,sender_id,sender_type,sender_name,message,created_at").single();
  if(error)throw error;
  input.value="";const displayName=state.member?.display_name||state.user?.user_metadata?.name||"Household member";broadcastLoungeTyping(displayName,false);
  if(data&&!state.loungeMessages.some(x=>x.id===data.id)){state.loungeMessages.push(data);renderLoungeMessages();}
  const simple=message.toLowerCase().trim().replace(/[!.?]+$/,"");
  const localReplies={
   "hi":["Oh, hello! Just having a little fiddle with something in the workshop.","Alright! Kettle's nearly on. Well, it would be if I'd remembered to fill it."],
   "hey":["Ey up! What's happening? I've just put the kettle on.","Oh, hello! You caught me halfway through a biscuit-related experiment."],
   "hello":["Alright! Good to see you. Mind the bits on the floor, I'm fixing a toaster.","Hello there! Fancy a cuppa?"],
   "thanks":["No worries! Happy to help.","You're welcome! Now, where did I put that screwdriver?"],
   "thank you":["No worries at all!","Any time. That's what I'm here for!"],
   "haha":["Heh! Gromit's not impressed. Can't think why.","Glad you liked that. Nearly made me spill me tea!"],
   "lol":["Heh! Gromit's giving me that look again.","Glad that raised a smile!"]
  };
  const canned=localReplies[simple];
  if(canned){
   const {error:localError}=await db.rpc("post_lounge_canned_reply",{p_household_id:state.householdId,p_reply_type:simple});
   if(localError){console.warn("Local Lounge reply unavailable:",localError);toast("Couldn't send Wallace's quick reply. Please try again.");}
  }else{
   const {error:aiError}=await db.functions.invoke("lounge-ai",{body:{household_id:state.householdId,message_id:data?.id}});
   if(aiError){console.warn("Lounge AI reply unavailable:",aiError);toast(aiError.message?.includes("not found")||aiError.message?.includes("404")?"Wallace needs his server function installed.":"Wallace is temporarily unavailable. Your chat connection is still active.");}
  }
 }catch(error){console.error(error);toast("Couldn't send that Lounge message: "+(error?.message||"Please try again."));}
 finally{button.disabled=false;renderLoungeTyping();renderLoungeMessages();}
}
function updateLoungeMentionSuggestions(){
 const input=$("#loungeMessageInput"),panel=$("#loungeMentionSuggestions");if(!input||!panel)return;
 const before=input.value.slice(0,input.selectionStart),match=before.match(/(?:^|\\s)@([\\w-]*)$/);
 if(!match){panel.hidden=true;panel.innerHTML="";return;}
 const query=(match[1]||"").toLowerCase();
 const options=(state.members||[]).filter(m=>m.user_id!==state.user?.id&&(m.display_name||"").toLowerCase().includes(query));
 panel.innerHTML="";
 options.forEach(member=>{const b=document.createElement("button");b.type="button";b.className="lounge-mention-option";const avatar=document.createElement("span");avatar.className="lounge-mention-avatar";avatar.textContent=(member.display_name||"?").slice(0,1).toUpperCase();const name=document.createElement("strong");name.textContent=member.display_name||"Household member";const hint=document.createElement("small");hint.textContent="Send privately · no Wallace reply";b.append(avatar,name,hint);b.onclick=()=>{const start=input.selectionStart;const prefix=input.value.slice(0,start).replace(/(?:^|\\s)@[\\w-]*$/,(m)=>m.startsWith(" ")?" ":"");const suffix=input.value.slice(input.selectionEnd);input.value=prefix+"@"+member.display_name+" "+suffix;input.focus();const pos=(prefix+"@"+member.display_name+" ").length;input.setSelectionRange(pos,pos);panel.hidden=true;};panel.append(b);});
 panel.hidden=!options.length;
}

function renderLoungeTyping(){
 const host=$("#loungeTyping");if(!host)return;
 const names=[...loungeRemoteTyping.values()].filter(x=>Date.now()-x.at<4500).map(x=>x.name);
 host.hidden=!names.length;host.classList.remove("ai-thinking");
 host.textContent=names.length?`${names.join(" and ")} ${names.length===1?"is":"are"} typing ···`:"";
}
function broadcastLoungeTyping(name,typing=true){
 if(!state.loungeChannel)return;
 state.loungeChannel.send({type:"broadcast",event:"typing",payload:{name,typing,at:Date.now()}});
}
function broadcastLoungeAICharacterTyping(character,typing=true){
 if(!state.loungeChannel)return;
 state.loungeChannel.send({type:"broadcast",event:"ai-character-typing",payload:{character,typing,at:Date.now()}});
}
function setLoungeStatus(label,mode="connected"){const el=$("#loungeStatus");if(!el)return;el.textContent=label;el.classList.remove("status-connected","status-disconnected","status-connecting");el.classList.add(mode==="connected"?"status-connected":mode==="disconnected"?"status-disconnected":"status-connecting");}
function subscribeLounge(){
 if(!state.householdId||state.loungeChannel)return;
 setLoungeStatus("Connecting…","connecting");
 state.loungeChannel=db.channel("lounge-"+state.householdId)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"household_lounge_messages",filter:`household_id=eq.${state.householdId}`},payload=>{if(payload.new&&!state.loungeMessages.some(x=>x.id===payload.new.id)){state.loungeMessages.push(payload.new);if(payload.new.sender_type==="character"){state.loungeAICharactersTyping.delete(payload.new.sender_name);state.loungeRemoteAICharactersTyping.delete(payload.new.sender_name);}renderLoungeMessages();}})
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"household_lounge_direct_messages",filter:`household_id=eq.${state.householdId}`},payload=>{
   const m=payload.new;if(!m||state.loungeDirectMessages.some(x=>x.id===m.id))return;
   if(m.sender_id===state.user.id||m.recipient_id===state.user.id){state.loungeDirectMessages.push(m);renderLoungeMessages();}
   if(m.recipient_id===state.user.id){const sender=(state.members||[]).find(x=>x.user_id===m.sender_id)?.display_name||"Your household";appNotice("Message from "+sender,m.message);}
 })
 .on("broadcast",{event:"typing"},({payload})=>{
   if(!payload||!payload.name)return;
   if(payload.typing)loungeRemoteTyping.set(payload.name,{name:payload.name,at:Date.now()});
   else loungeRemoteTyping.delete(payload.name);
   renderLoungeTyping();
   clearTimeout(loungeTypingClearTimer);
   loungeTypingClearTimer=setTimeout(()=>{for(const [k,v] of loungeRemoteTyping){if(Date.now()-v.at>4500)loungeRemoteTyping.delete(k);}renderLoungeTyping();},4600);
 })
 .on("broadcast",{event:"ai-character-typing"},({payload})=>{
   const character=payload?.character;if(!["Wallace","Alfred","Gromit"].includes(character))return;
   if(payload.typing)state.loungeRemoteAICharactersTyping.set(character,{at:Date.now()});
   else state.loungeRemoteAICharactersTyping.delete(character);
   renderLoungeMessages();
 }).subscribe((status)=>{if(status==="SUBSCRIBED")setLoungeStatus("Connected","connected");else if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(status))setLoungeStatus("Not connected","disconnected");else if(status==="SUBSCRIBING")setLoungeStatus("Connecting…","connecting");});
}
function openLounge(){loadLoungeMessages();subscribeLounge();}

function wire(){
 $("#loungeMessageForm").onsubmit=sendLoungeMessage;
 $("#loungeMessageInput").addEventListener("input",()=>{
   updateLoungeMentionSuggestions();
   if(!state.loungeChannel)return;
   const displayName=state.member?.display_name||state.user?.user_metadata?.name||"Household member";
   broadcastLoungeTyping(displayName,true);
   clearTimeout(loungeTypingTimer);
   loungeTypingTimer=setTimeout(()=>broadcastLoungeTyping(displayName,false),1400);
 });
 $("#connectCalendarButton").onclick=connectGoogleCalendar;$("#refreshCalendarButton").onclick=()=>loadCalendarShifts(true);$("#refreshWeatherButton").onclick=()=>loadWeather(true);
 $("#applyUpdate").onclick=()=>{if(waitingWorker){waitingWorker.postMessage({type:"SKIP_WAITING"});$("#applyUpdate").disabled=true;$("#applyUpdate").textContent="Updating…";}};
 $("#dismissUpdate").onclick=()=>$("#updateBanner").hidden=true;
 $("#authForm").onsubmit=auth;updateAuthMode();
 $("#shoppingModeButton").onclick=()=>setShoppingMode(true);$("#exitShoppingMode").onclick=()=>setShoppingMode(false);$("#doneShopping").onclick=()=>setShoppingMode(false);$("#listSwitcherButton").onclick=()=>{$("#switchListsDialog").showModal();};$("#closeSwitchLists").onclick=()=>$("#switchListsDialog").close();$("#switcherCreateList").onclick=()=>{$("#switchListsDialog").close();createList();};$("#newListButton").onclick=createList;$("#manageCreateList").onclick=()=>{$("#manageListsDialog").close();createList();};$("#closeCreateList").onclick=()=>$("#createListDialog").close();$("#cancelCreateList").onclick=()=>$("#createListDialog").close();$("#createListForm").onsubmit=submitCreateList;$("#manageListsButton").onclick=()=>$("#manageListsDialog").showModal();$("#closeManageLists").onclick=()=>$("#manageListsDialog").close();
 $("#authModeToggle").onclick=()=>{state.authMode=state.authMode==="signin"?"signup":"signin";updateAuthMode();msg("#authMessage","");};
 $("#createHousehold").onclick=createHome;$("#joinHousehold").onclick=joinHome;$("#signOutSetup").onclick=signOut;$("#signOutButton").onclick=()=>{ $("#settingsDialog").close();signOut();};
 $("#newItem").addEventListener("focus",()=>setEditing(true));
 $("#newItem").addEventListener("blur",()=>setEditing(false));
 $("#addForm").onsubmit=async e=>{e.preventDefault();const input=$("#newItem"),name=input.value.trim();if(!name)return;if(state.items.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("That item is already on your list.");const category=await categoryForNewItem(name);const {data,error}=await db.from("shopping_items").insert({household_id:state.householdId,list_id:state.currentListId,name,quantity:1,is_bought:false,category,created_by:state.user.id,updated_by:state.user.id}).select("*").single();if(error){toast("Couldn't add item: "+error.message);}else{if(!state.items.some(item=>item.id===data.id)){state.items.push(data);state.items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));renderItems();}input.value="";toast(`Added to ${currentList()?.name||"your list"}.`);}};
 $("#clearBought").onclick=async()=>{const bought=state.items.filter(x=>x.is_bought);if(!bought.length)return toast("No bought items to clear.");const button=$("#clearBought");button.disabled=true;const {error}=await db.from("shopping_items").delete().eq("household_id",state.householdId).eq("list_id",state.currentListId).eq("is_bought",true);button.disabled=false;if(error){toast("Couldn't clear bought items: "+error.message);return;}const removedIds=new Set(bought.map(x=>x.id));state.items=state.items.filter(x=>!removedIds.has(x.id));renderItems();toast(`Cleared ${bought.length} bought item${bought.length===1?"":"s"}.`);};
 $("#settingsButton").onclick=()=>$("#settingsDialog").showModal();$("#clearLoungeButton").onclick=async()=>{if(!confirm("Clear the shared Lounge conversation for both Luke and Beth? This cannot be undone."))return;const b=$("#clearLoungeButton");b.disabled=true;const [a,d]=await Promise.all([db.from("household_lounge_messages").delete().eq("household_id",state.householdId),db.from("household_lounge_direct_messages").delete().eq("household_id",state.householdId)]);b.disabled=false;if(a.error||d.error){toast("Couldn't clear the Lounge: "+(a.error||d.error).message);return;}state.loungeMessages=[];state.loungeDirectMessages=[];renderLoungeMessages();$("#settingsDialog").close();toast("The shared Lounge conversation has been cleared.");};$("#themeButton").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";localStorage.setItem("lb-theme",state.theme);theme();};$("#themeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#menuPrev").onclick=()=>{const d=new Date(`${state.menuStart}T12:00:00`);d.setDate(d.getDate()-14);state.menuStart=localISO(d);loadMenu();};
 $("#menuNext").onclick=()=>{const d=new Date(`${state.menuStart}T12:00:00`);d.setDate(d.getDate()+14);state.menuStart=localISO(d);loadMenu();};
 $("#menuToday").onclick=()=>{state.menuStart=localISO(mondayOf(new Date()));loadMenu();};$("#menuCopyDay").onclick=openCopyDayDialog;$("#closeCopyMeal").onclick=()=>$("#copyMealDialog").close();$("#cancelCopyMeal").onclick=()=>$("#copyMealDialog").close();$("#copyMealForm").onsubmit=copySingleMealSubmit;$("#swapNowButton").onclick=()=>finishSwapChoice("swap");$("#cancelSwapChoice").onclick=()=>finishSwapChoice("cancel");$("#closeSwapChoice").onclick=()=>finishSwapChoice("cancel");$("#swapChoiceDialog").addEventListener("cancel",()=>finishSwapChoice("cancel"));$("#swapNowButton").onclick=()=>finishSwapChoice("swap");$("#cancelSwapChoice").onclick=()=>finishSwapChoice("cancel");$("#closeSwapChoice").onclick=()=>finishSwapChoice("cancel");$("#swapChoiceDialog").addEventListener("cancel",()=>finishSwapChoice("cancel"));$("#closeCopyDay").onclick=()=>$("#copyDayDialog").close();$("#cancelCopyDay").onclick=()=>$("#copyDayDialog").close();$("#copyDayForm").onsubmit=copyWholeDay;$("#menuJumpDate").onchange=()=>{const value=$("#menuJumpDate").value;if(!value)return;state.menuStart=localISO(mondayOf(new Date(value+"T12:00:00")));loadMenu();};
 $("#closeMealRecipe").onclick=()=>$("#mealRecipeDialog").close();$("#menuFavourites").onclick=showFavourites;$("#openMealFinder").onclick=openMealFinder;$("#closeMealFinder").onclick=()=>$("#mealFinderDialog").close();$("#findMealsButton").onclick=findMealsFromIngredients;$("#manageFavouriteCategories").onclick=manageFavouriteCategories;$("#addCategorySubmit").onclick=saveManagedCategory;$("#closeManageCategories").onclick=()=>$("#manageCategoriesDialog").close();$("#favouriteSearch").addEventListener("input",renderFavouritesList);$("#favouriteCategoryFilter").addEventListener("change",renderFavouritesList);$("#closeMealSource").onclick=()=>$("#mealSourceDialog").close();$("#cancelMealSource").onclick=()=>$("#mealSourceDialog").close();$("#closeDayFavourites").onclick=()=>$("#dayFavouritesDialog").close();$("#closeFavouritePreview").onclick=()=>$("#favouritePreviewDialog").close();$("#backToDayFavourites").onclick=()=>{$("#favouritePreviewDialog").close();showFavouritePicker(state.pendingMealDate,state.pendingMealType);};$("#addPreviewedFavourite").onclick=addPreviewedFavourite;
 $("#mealForm").onsubmit=saveMeal;
 $("#openMealIconPicker").onclick=openMealIconPicker;
 $("#closeMealIconPicker").onclick=()=>$("#mealIconPickerDialog").close();
 $("#cancelMealIconPicker").onclick=()=>$("#mealIconPickerDialog").close();
 $("#useMealIcon").onclick=()=>{rememberMealIcon(state.selectedMealImage);updateSelectedMealArt();$("#mealIconPickerDialog").close();};
 $("#mealIconSearch").addEventListener("input",renderMealIconPicker);
 $("#mealIconMore").onclick=()=>{state.mealIconsExpanded=!state.mealIconsExpanded;renderMealIconPicker();};$("#closeMealDialog").onclick=()=>$("#mealDialog").close();$("#cancelMeal").onclick=()=>$("#mealDialog").close();$("#closeFavourites").onclick=()=>$("#favouritesDialog").close();
 $("#closeListPicker").onclick=()=>$("#shoppingListPickerDialog").close();$("#cancelListPicker").onclick=()=>$("#shoppingListPickerDialog").close();$("#confirmListPicker").onclick=confirmMealIngredients;$("#closeDatePicker").onclick=()=>$("#datePickerDialog").close();$("#cancelDatePicker").onclick=()=>$("#datePickerDialog").close();$("#confirmDatePicker").onclick=confirmDatePicker;
 $("#datePrevMonth").onclick=()=>{state.datePickerMonth.setMonth(state.datePickerMonth.getMonth()-1);renderDatePicker();};
 $("#dateNextMonth").onclick=()=>{state.datePickerMonth.setMonth(state.datePickerMonth.getMonth()+1);renderDatePicker();};
 $("#likeListButton").onclick=approveList;$("#dismissApproval").onclick=()=>{state.approvalDismissed=true;$("#approvalCard").classList.add("hidden");};
 $("#shareButton").onclick=()=>$("#shareDialog").showModal();$("#confirmShare").onclick=async e=>{e.preventDefault();$("#shareDialog").close();if(!state.partner)return toast("Your partner hasn't joined yet.");const version=state.listStatus?.list_version??1;const {error}=await db.from("shopping_list_shares").insert({household_id:state.householdId,list_version:version,sender_id:state.user.id,recipient_id:state.partner.user_id});if(error){toast("Couldn\'t share: "+error.message);return;}const notify=await db.from("share_events").insert({household_id:state.householdId,sender_id:state.user.id,recipient_id:state.partner.user_id});if(notify.error)console.warn(notify.error);state.approvalDismissed=false;await refreshListStatus();toast(`Shared ${currentList()?.name||"list"} with ${state.partner.display_name}.`);};
 $("#settingsDialog").addEventListener("click",e=>{if(e.target===$("#settingsDialog"))$("#settingsDialog").close();});$("#shareDialog").addEventListener("click",e=>{if(e.target===$("#shareDialog"))$("#shareDialog").close();});
 $("#copyInviteCode").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");try{await navigator.clipboard.writeText(code);$("#inviteStatus").textContent="Invitation code copied.";toast("Invite code copied.");}catch(e){$("#inviteStatus").textContent="Please copy the code manually."; }};
 $("#shareInvite").onclick=async()=>{const code=state.household?.invite_code;if(!code)return toast("Invite code isn't available yet.");const text=`Join my Luke & Beth shopping list! Open https://stankie1989.github.io/luke-beth-shopping-list/ and enter this invitation code: ${code}`;if(navigator.share){try{await navigator.share({title:"Luke & Beth’s Shopping List",text});}catch(e){if(e.name!=="AbortError")toast("Couldn't open sharing.");}}else{try{await navigator.clipboard.writeText(text);toast("Invitation copied — paste it into a message to Beth.");}catch(e){$("#inviteStatus").textContent=text;}}};
 $("#closeItemCategory").onclick=closeItemCategoryPicker;$("#cancelItemCategory").onclick=closeItemCategoryPicker;
 $("#openManageCategories").onclick=()=>{renderManageCategories();$("#manageCategoriesDialog").showModal();};
 $("#launchManageCategories").onclick=()=>{renderManageCategories();$("#manageCategoriesDialog").showModal();};
 $("#closeManageCategories").onclick=()=>$("#manageCategoriesDialog").close();$("#doneManageCategories").onclick=()=>$("#manageCategoriesDialog").close();
 $("#addCategoryForm").onsubmit=addCategory;$("#renameCategoryForm").onsubmit=renameCategory;
 $("#closeRenameCategory").onclick=()=>{$("#renameCategoryDialog").close();renamingCategory=null;};
 $("#cancelRenameCategory").onclick=()=>{$("#renameCategoryDialog").close();renamingCategory=null;};$("#itemCategoryDialog").addEventListener("cancel",()=>{categoryEditingItem=null;});$("#editItemForm").onsubmit=saveEditedItem;$("#closeEditItem").onclick=closeEditItem;$("#cancelEditItem").onclick=closeEditItem;
 $("#closeDeleteItem").onclick=closeDeleteItem;$("#cancelDeleteItem").onclick=closeDeleteItem;$("#confirmDeleteItem").onclick=confirmDeleteShoppingItem;$("#moreThemeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};$("#showShoppingCategories").onchange=e=>{state.showShoppingCategories=e.target.checked;localStorage.setItem(CATEGORY_KEY,String(state.showShoppingCategories));renderItems();};
 $("#moreSignOut").onclick=signOut;
 function savePickupColourTimes(){const green=$("#pickupGreenUntil").value,amber=$("#pickupAmberUntil").value;if(!green||!amber)return;const toMin=v=>{const [h,m]=v.split(":").map(Number);return h*60+m;};if(toMin(green)>=toMin(amber)){msg("#pickupColourStatus","Green cutoff must be earlier than amber cutoff.",true);return;}pickupColourTimes={greenUntil:green,amberUntil:amber};localStorage.setItem(PICKUP_COLOUR_KEY,JSON.stringify(pickupColourTimes));$("#pickupColourStatus").textContent=`Saved on this device · Green until ${green}, amber until ${amber}.`;renderCalendarShifts();}
 $("#pickupGreenUntil").onchange=savePickupColourTimes;$("#pickupAmberUntil").onchange=savePickupColourTimes;$("#resetPickupColours").onclick=()=>{pickupColourTimes={...pickupColourDefaults};localStorage.setItem(PICKUP_COLOUR_KEY,JSON.stringify(pickupColourTimes));$("#pickupGreenUntil").value=pickupColourTimes.greenUntil;$("#pickupAmberUntil").value=pickupColourTimes.amberUntil;$("#pickupColourStatus").textContent="Default times restored: 16:00 and 18:00.";renderCalendarShifts();};
 document.querySelectorAll("[data-dashboard-tab]").forEach(b=>b.onclick=()=>document.querySelector('.nav-item[data-tab="list"]').click());
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
  const tab=b.dataset.tab;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x===b));
  $("#morePanel").classList.toggle("hidden",tab!=="more");
  $("#dashboardPanel").classList.toggle("hidden",tab!=="dashboard");
  $("#historyPanel").classList.toggle("hidden",tab!=="history");
  $("#notificationsPanel").classList.toggle("hidden",tab!=="notifications");
  $("#menuPanel").classList.toggle("hidden",tab!=="menu");
  $("#loungePanel").classList.toggle("hidden",tab!=="lounge");
  const menuTabActive=tab==="menu";
  $("#appShell").classList.toggle("menu-tab-active",menuTabActive);
  $("#appShell").classList.toggle("shopping-tab-active",tab==="list");
  $("#appShell").classList.toggle("dashboard-tab-active",tab==="dashboard");
  $("#appShell").classList.toggle("lounge-tab-active",tab==="lounge");
  const statusCard=$("#listStatusCard"),topFinder=$("#topMealFinderSlot"),finderButton=$("#openMealFinder"),menuActions=$(".menu-actions");
  if(statusCard)statusCard.classList.toggle("hidden",menuTabActive);
  if(topFinder)topFinder.classList.toggle("hidden",!menuTabActive);
  if(menuTabActive&&topFinder&&finderButton)topFinder.append(finderButton);
  else if(menuActions&&finderButton)menuActions.append(finderButton);
  $("#shareButton").classList.toggle("hidden",tab!=="list");
  $("#shareHint").classList.toggle("hidden",tab!=="list");
  $(".list-panel").classList.toggle("hidden",tab!=="list");
  $(".people-strip").classList.toggle("hidden",tab==="more");
  if(tab==="lounge")openLounge();
  if(tab==="history")refreshActivity();
  if(tab==="dashboard"){renderDashboard();if(state.menuEntries.length===0)loadMenu();loadCalendarShifts();renderWeather();}
  if(tab==="menu"){if(!state.menuStart)state.menuStart=localISO(mondayOf(new Date()));loadMenu();loadMenuFavourites();}
 });
}
async function init(){state.menuStart=localISO(mondayOf(new Date()));theme();wire();handleCalendarReturn();setInterval(()=>{if(state.items.length)renderItems();updateDashboardDateTime();},60*1000);setInterval(()=>{if(document.visibilityState==="visible"&&state.user){refreshCurrentList();refreshActivity();refreshListStatus();if(!$("#menuPanel").classList.contains("hidden"))loadMenu();}},4000);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshActivity();});const {data:{session}}=await db.auth.getSession();if(session?.user){state.user=session.user;try{await enter();}catch(e){loggedOut();msg("#authMessage",e.message,true);}}else loggedOut();db.auth.onAuthStateChange(async(_,session)=>{if(session?.user&&!state.user){state.user=session.user;try{await enter();}catch(e){msg("#authMessage",e.message,true);}}});if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload();}});
  navigator.serviceWorker.register("./sw.js?v=1.8.0",{updateViaCache:"none"}).then(reg=>{
   const showUpdate=worker=>{if(!worker)return;waitingWorker=worker;$("#updateBanner").hidden=false;$("#applyUpdate").disabled=false;$("#applyUpdate").textContent="Update now";};
   const inspectRegistration=()=>{if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);};
   inspectRegistration();
   reg.addEventListener("updatefound",()=>{
    const installing=reg.installing;if(!installing)return;
    installing.addEventListener("statechange",()=>{
     if(installing.state==="installed"&&navigator.serviceWorker.controller)showUpdate(installing);
    });
   });
   const checkForAppUpdate=()=>reg.update().then(()=>{inspectRegistration();}).catch(error=>console.warn("App update check failed",error));
   inspectRegistration();
   checkForAppUpdate();
   document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkForAppUpdate();});
   window.addEventListener("focus",checkForAppUpdate);
   window.addEventListener("pageshow",checkForAppUpdate);
   window.addEventListener("online",checkForAppUpdate);
   window.setInterval(checkForAppUpdate,60*1000);
  }).catch(error=>console.warn("App update check failed",error));
 }
}
init();
