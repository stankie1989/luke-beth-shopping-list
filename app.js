const SUPABASE_URL="https://vzyllteamuhvbgmoyfgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_kSby2ywwkDb8qGy4gGPQbg_DcXaO3xF";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
let waitingWorker=null;
const state={recentMealIcons:JSON.parse(localStorage.getItem("lb-recent-meal-icons")||"[]"),menuEntries:[],missedMeals:[],menuFavourites:[],menuStart:null,editingMealId:null,selectedMealImage:"dinner",activeMenuSlot:"dinner",datePickerValue:null,datePickerMonth:null,datePickerAction:null,selectedShoppingListId:null,pendingMealIngredients:null,mealIconsExpanded:false,user:null,member:null,householdId:null,partner:null,household:null,members:[],items:[],lists:[],currentListId:null,activity:[],listStatus:null,latestShare:null,latestApproval:null,approvalDismissed:false,theme:localStorage.getItem("lb-theme")||"dark",channel:null,authMode:"signin"};
let toastTimer;
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
let listRefreshRunning=false;
async function refreshCurrentList(){
 if(!state.currentListId||listRefreshRunning)return;listRefreshRunning=true;
 const [{data:items,error},{data:activity}] = await Promise.all([
  db.from("shopping_items").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at"),
  db.from("activity_events").select("*").eq("household_id",state.householdId).eq("list_id",state.currentListId).order("created_at",{ascending:false}).limit(12)
 ]);
 if(error){listRefreshRunning=false;toast("Couldn't load this list: "+error.message);return;}
 state.items=items||[];state.activity=(activity||[]).map(x=>({...x,display_name:state.members.find(m=>m.user_id===x.actor_id)?.display_name||"Household member"}));renderItems();renderActivity();listRefreshRunning=false;
}
async function switchList(id){if(!state.lists.some(x=>x.id===id))return;state.currentListId=id;localStorage.setItem(`lb-current-list-${state.householdId}`,id);renderListControls();await refreshCurrentList();}
async function createList(){const name=prompt("Name your new list:");if(name===null)return;const clean=name.trim();if(!clean)return toast("Please enter a list name.");const shared=confirm("Make this list shared with your household?\n\nChoose Cancel to keep it private.");const {data,error}=await db.from("shopping_lists").insert({household_id:state.householdId,owner_id:state.user.id,name:clean.slice(0,40),icon:"🛒",is_shared:shared}).select("*").single();if(error)return toast("Couldn't create list: "+error.message);state.lists.push(data);await switchList(data.id);toast(`${data.name} created as ${shared?"a shared":"a private"} list.`);}
async function changeListVisibility(list){const next=!list.is_shared;const promptText=next?`Make “${list.name}” shared? Your partner will immediately see its existing items.`:`Make “${list.name}” private? Your partner will no longer be able to see it.`;if(!confirm(promptText))return;const {data,error}=await db.from("shopping_lists").update({is_shared:next}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't change visibility: "+error.message);Object.assign(list,data);renderListControls();if(state.currentListId===list.id)await refreshCurrentList();toast(next?"List is now shared.":"List is now private.");}
async function renameList(list){const name=prompt("Rename list:",list.name);if(name===null)return;const clean=name.trim();if(!clean)return toast("List name can't be empty.");const {data,error}=await db.from("shopping_lists").update({name:clean.slice(0,40)}).eq("id",list.id).select("*").single();if(error)return toast("Couldn't rename list: "+error.message);Object.assign(list,data);renderListControls();toast("List renamed.");}
async function deleteList(list){if(state.lists.length<2)return toast("You need to keep at least one list.");if(!confirm(`Delete “${list.name}” and all its items? This cannot be undone.`))return;const {error}=await db.from("shopping_lists").delete().eq("id",list.id);if(error)return toast("Couldn't delete list: "+error.message);state.lists=state.lists.filter(x=>x.id!==list.id);if(state.currentListId===list.id)state.currentListId=state.lists[0].id;localStorage.setItem(`lb-current-list-${state.householdId}`,state.currentListId);renderListControls();await refreshCurrentList();toast("List deleted.");}
function buildItemRow(item,shopping=false){
 const row=document.createElement("div");row.className="item"+(item.is_bought?" done":"")+(shopping?" shopping-mode-item":"");
 const c=document.createElement("input");c.type="checkbox";c.className=shopping?"shopping-mode-check":"check";c.checked=!!item.is_bought;c.setAttribute("aria-label",`Mark ${item.name} as ${item.is_bought?"not bought":"bought"}`);c.addEventListener("change",()=>update(item,{is_bought:c.checked}));
 const n=document.createElement(shopping?"span":"button");if(!shopping)n.type="button";n.className=shopping?"shopping-mode-item-name":"item-name";n.textContent=item.name;
 if(!shopping){
  const addedAt=item.created_at?new Date(item.created_at).getTime():0;const isNew=Number.isFinite(addedAt)&&addedAt>0&&(Date.now()-addedAt)<2*60*60*1000;n.classList.toggle("is-new",isNew);n.setAttribute("aria-label",isNew?`${item.name}, newly added`:item.name);n.title=isNew?"Added in the last 2 hours · Tap to edit":"Tap to edit item name";
  n.addEventListener("click",async()=>{const value=prompt("Edit item name:",item.name);if(value===null)return;const name=value.trim();if(!name)return toast("Item name can't be empty.");if(name===item.name)return;await update(item,{name:name.slice(0,80)});});
  const q=document.createElement("div");q.className="qty";const m=document.createElement("button");m.type="button";m.textContent="−";m.disabled=item.quantity<=1;const count=document.createElement("strong");count.textContent=item.quantity;const plus=document.createElement("button");plus.type="button";plus.textContent="+";m.onclick=()=>update(item,{quantity:Math.max(1,item.quantity-1)});plus.onclick=()=>update(item,{quantity:Math.min(99,item.quantity+1)});q.append(m,count,plus);
  const del=document.createElement("button");del.type="button";del.className="delete-item";del.textContent="×";del.setAttribute("aria-label",`Delete ${item.name}`);del.title=`Delete ${item.name}`;del.onclick=()=>removeItem(item);row.append(c,n,q,del);
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
async function copySingleMealSubmit(e){
 e.preventDefault();if(!pendingCopyMeal)return;
 const entry=pendingCopyMeal,target=$("#copyMealTarget").value;
 if(!target)return toast("Choose a destination date.");
 if(target===entry.entry_date)return toast("Choose a different date.");
 const collision=state.menuEntries.find(x=>x.entry_date===target&&x.meal_type===entry.meal_type);
 if(collision){
  const swap=confirm(`There is already "${collision.name}" in that slot.\\n\\nPress OK to SWAP the two meals. Press Cancel to keep both meals on the destination day.`);
  if(swap){
   const {error}=await db.from("menu_entries").update({entry_date:entry.entry_date}).eq("id",collision.id);
   if(error)return toast("Couldn't swap the existing meal: "+error.message);
   const {data,error:moveError}=await db.from("menu_entries").update({entry_date:target}).eq("id",entry.id).select("*").single();
   if(moveError)return toast("The existing meal moved, but the copied meal couldn't be moved. Please refresh.");
   state.menuEntries=state.menuEntries.filter(x=>x.id!==collision.id&&x.id!==entry.id);
   state.menuEntries.push({...collision,entry_date:entry.entry_date},data);
   $("#copyMealDialog").close();pendingCopyMeal=null;
   await refreshMenuAfterCopy(target);toast("Meals swapped.");
   return;
  }
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
  const swap=confirm(`The destination already has ${targetMeals.length} planned meal(s).\\n\\nPress OK to SWAP the two days. Press Cancel to copy the meals alongside the existing ones.`);
  if(swap){
   const idsSource=meals.map(x=>x.id),idsTarget=targetMeals.map(x=>x.id);
   const {error:moveTargetError}=await db.from("menu_entries").update({entry_date:source}).in("id",idsTarget);
   if(moveTargetError)return toast("Couldn't move the destination day's meals: "+moveTargetError.message);
   const {error:moveSourceError}=await db.from("menu_entries").update({entry_date:target}).in("id",idsSource);
   if(moveSourceError)return toast("Destination meals moved, but source meals couldn't be swapped. Please refresh.");
   $("#copyDayDialog").close();state.menuStart=localISO(mondayOf(new Date(target+"T12:00:00")));await loadMenu();toast("Days swapped.");return;
  }
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
  const payload={household_id:state.householdId,entry_date:date,meal_type:type,name:f.name,image_key:f.image_key,ingredients:f.ingredients||[],created_by:state.user.id};
  const {data,error}=await db.from("menu_entries").insert(payload).select("*").single();
  if(error)return toast("Couldn't add favourite: "+error.message);
  state.menuEntries.push(data);renderMenu();toast("Favourite added to menu.");
 }else if(action==="reschedule"){
  const id=state.reschedulingMealId;const entry=state.missedMeals.find(x=>x.id===id);if(!entry)return;
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
async function saveMeal(e){
 e.preventDefault();const name=$("#mealName").value.trim();if(!name)return;
 const date=$("#mealDialog").dataset.date,ingredients=parseIngredients($("#mealIngredients").value);
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
 state.menuEntries=current.data||[];state.missedMeals=missed.data||[];renderMenu();
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
function findMealsFromIngredients(){
 const raw=$("#mealFinderInput").value;
 const have=raw.split(/[,;\n]+/).map(x=>mealFinderNormalise(x)).filter(Boolean);
 const host=$("#mealFinderResults");host.innerHTML="";
 if(!have.length){host.textContent="Enter at least one ingredient to search.";return;}
 const results=(state.menuFavourites||[]).map(f=>{
  const ingredients=(f.ingredients||[]).map(x=>({...x,_key:mealFinderNormalise(x.name)})).filter(x=>x._key);
  const matched=ingredients.filter(ing=>have.some(h=>ing._key===h||ing._key.includes(h)||h.includes(ing._key)));
  const missing=ingredients.filter(ing=>!matched.includes(ing));
  const score=ingredients.length?matched.length/ingredients.length:0;
  return {f,matched,missing,score};
 }).filter(x=>x.matched.length>0).sort((a,b)=>b.score-a.score||b.matched.length-a.matched.length);
 if(!results.length){host.textContent="No saved favourites matched those ingredients. Try different wording or add more ingredients.";return;}
 results.forEach(result=>{
  const card=document.createElement("article");card.className="meal-finder-card";
  const head=document.createElement("div");head.className="meal-finder-card-head";
  const art=document.createElement("span");art.className="meal-finder-art";setMealArt(art,result.f.image_key);
  const title=document.createElement("strong");title.textContent=result.f.name;
  const score=document.createElement("small");score.textContent=`${result.matched.length} of ${(result.f.ingredients||[]).length} ingredients available`;
  const titleWrap=document.createElement("div");titleWrap.className="meal-finder-title";titleWrap.append(title,score);head.append(art,titleWrap);card.append(head);
  const haveLine=document.createElement("p");haveLine.className="meal-finder-have";haveLine.textContent="You have: "+result.matched.map(x=>x.name).join(", ");card.append(haveLine);
  const missingLine=document.createElement("p");missingLine.className="meal-finder-missing";missingLine.textContent=result.missing.length?"You'll need: "+result.missing.map(x=>x.name).join(", "):"You've got everything for this meal!";card.append(missingLine);
  if(result.missing.length){
   const add=document.createElement("button");add.type="button";add.className="secondary-button compact";add.textContent="Add missing ingredients to shopping list";
   add.onclick=()=>addMealIngredients({...result.f,ingredients:result.missing.map(({name,quantity})=>({name,quantity}))});
   card.append(add);
  }
  host.append(card);
 });
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
 for(const ing of entry.ingredients||[]){const numeric=Number(ing.quantity),itemName=Number.isFinite(numeric)&&numeric>0?ing.name:`${ing.name} (${ing.quantity})`,addQty=Number.isFinite(numeric)&&numeric>0?Math.max(1,Math.round(numeric)):1;const {data:existing,error:lookupError}=await db.from("shopping_items").select("*").eq("list_id",target.id).ilike("name",itemName).maybeSingle();if(lookupError){failures++;continue;}if(existing){const {error}=await db.from("shopping_items").update({quantity:existing.quantity+addQty,updated_by:state.user.id,updated_at:new Date().toISOString()}).eq("id",existing.id);if(error)failures++;}else{const {error}=await db.from("shopping_items").insert({household_id:state.householdId,list_id:target.id,name:itemName,quantity:addQty,is_bought:false,created_by:state.user.id,updated_by:state.user.id});if(error)failures++;}}
 $("#shoppingListPickerDialog").close();btn.textContent="Add ingredients";btn.disabled=false;state.pendingMealIngredients=null;if(target.id===state.currentListId)await refreshCurrentList();toast(failures?`Added with ${failures} ingredient error(s).`:`Ingredients added to ${target.name}.`);
}
function renderItems(){
 const host=$("#items");host.innerHTML="";const modeHost=$("#shoppingModeItems");if(modeHost)modeHost.innerHTML="";
 state.items.forEach(item=>{host.append(buildItemRow(item));if(modeHost)modeHost.append(buildItemRow(item,true));});
 const left=state.items.filter(x=>!x.is_bought).length;$("#remainingCount").textContent=`${left} item${left===1?"":"s"} remaining`;
 if($("#shoppingModeCount")){$("#shoppingModeCount").textContent=`${left} item${left===1?"":"s"} to buy` ;$("#shoppingModeRemaining").textContent=`${left} remaining`;}
}
function setShoppingMode(enabled){
 state.shoppingMode=enabled;$("#appShell").classList.toggle("shopping-mode-active",enabled);
 $(".topbar").classList.toggle("hidden",enabled);$(".people-strip").classList.toggle("hidden",enabled);
 $(".list-panel").classList.toggle("hidden",enabled);$("#shareButton").classList.toggle("hidden",enabled);$("#shareHint").classList.toggle("hidden",enabled);
 $("#historyPanel").classList.add("hidden");$("#notificationsPanel").classList.add("hidden");$("#menuPanel").classList.add("hidden");$("#morePanel").classList.add("hidden");
 $(".bottom-nav").classList.toggle("hidden",enabled);$("#shoppingModeScreen").classList.toggle("hidden",!enabled);
 if(enabled)renderItems();
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
 const shareButton=$("#shareButton"),shareHint=$("#shareHint");
 if(currentList()&&!currentList().is_shared){card.classList.add("hidden");if(shareButton)shareButton.classList.remove("hidden");if(shareHint)shareHint.classList.remove("hidden");return;}
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
function wire(){
 $("#applyUpdate").onclick=()=>{if(waitingWorker){waitingWorker.postMessage({type:"SKIP_WAITING"});$("#applyUpdate").disabled=true;$("#applyUpdate").textContent="Updating…";}};
 $("#dismissUpdate").onclick=()=>$("#updateBanner").hidden=true;
 $("#authForm").onsubmit=auth;updateAuthMode();
 $("#shoppingModeButton").onclick=()=>setShoppingMode(true);$("#exitShoppingMode").onclick=()=>setShoppingMode(false);$("#doneShopping").onclick=()=>setShoppingMode(false);$("#listSelector").onchange=e=>switchList(e.target.value);$("#newListButton").onclick=createList;$("#manageCreateList").onclick=()=>{createList();};$("#manageListsButton").onclick=()=>$("#manageListsDialog").showModal();$("#closeManageLists").onclick=()=>$("#manageListsDialog").close();
 $("#authModeToggle").onclick=()=>{state.authMode=state.authMode==="signin"?"signup":"signin";updateAuthMode();msg("#authMessage","");};
 $("#createHousehold").onclick=createHome;$("#joinHousehold").onclick=joinHome;$("#signOutSetup").onclick=signOut;$("#signOutButton").onclick=()=>{ $("#settingsDialog").close();signOut();};
 $("#newItem").addEventListener("focus",()=>setEditing(true));
 $("#newItem").addEventListener("blur",()=>setEditing(false));
 $("#addForm").onsubmit=async e=>{e.preventDefault();const input=$("#newItem"),name=input.value.trim();if(!name)return;if(state.items.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("That item is already on your list.");const {data,error}=await db.from("shopping_items").insert({household_id:state.householdId,list_id:state.currentListId,name,quantity:1,is_bought:false,created_by:state.user.id,updated_by:state.user.id}).select("*").single();if(error){toast("Couldn't add item: "+error.message);}else{if(!state.items.some(item=>item.id===data.id)){state.items.push(data);state.items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));renderItems();}input.value="";toast(`Added to ${currentList()?.name||"your list"}.`);}};
 $("#clearBought").onclick=async()=>{const bought=state.items.filter(x=>x.is_bought);if(!bought.length)return toast("No bought items to clear.");const button=$("#clearBought");button.disabled=true;const {error}=await db.from("shopping_items").delete().eq("household_id",state.householdId).eq("list_id",state.currentListId).eq("is_bought",true);button.disabled=false;if(error){toast("Couldn't clear bought items: "+error.message);return;}const removedIds=new Set(bought.map(x=>x.id));state.items=state.items.filter(x=>!removedIds.has(x.id));renderItems();toast(`Cleared ${bought.length} bought item${bought.length===1?"":"s"}.`);};
 $("#settingsButton").onclick=()=>$("#settingsDialog").showModal();$("#themeButton").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";localStorage.setItem("lb-theme",state.theme);theme();};$("#themeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#menuPrev").onclick=()=>{const d=new Date(`${state.menuStart}T12:00:00`);d.setDate(d.getDate()-14);state.menuStart=localISO(d);loadMenu();};
 $("#menuNext").onclick=()=>{const d=new Date(`${state.menuStart}T12:00:00`);d.setDate(d.getDate()+14);state.menuStart=localISO(d);loadMenu();};
 $("#menuToday").onclick=()=>{state.menuStart=localISO(mondayOf(new Date()));loadMenu();};$("#menuCopyDay").onclick=openCopyDayDialog;$("#closeCopyMeal").onclick=()=>$("#copyMealDialog").close();$("#cancelCopyMeal").onclick=()=>$("#copyMealDialog").close();$("#copyMealForm").onsubmit=copySingleMealSubmit;$("#closeCopyDay").onclick=()=>$("#copyDayDialog").close();$("#cancelCopyDay").onclick=()=>$("#copyDayDialog").close();$("#copyDayForm").onsubmit=copyWholeDay;$("#menuJumpDate").onchange=()=>{const value=$("#menuJumpDate").value;if(!value)return;state.menuStart=localISO(mondayOf(new Date(value+"T12:00:00")));loadMenu();};
 $("#menuFavourites").onclick=showFavourites;$("#openMealFinder").onclick=openMealFinder;$("#closeMealFinder").onclick=()=>$("#mealFinderDialog").close();$("#findMealsButton").onclick=findMealsFromIngredients;$("#manageFavouriteCategories").onclick=manageFavouriteCategories;$("#addCategorySubmit").onclick=saveManagedCategory;$("#closeManageCategories").onclick=()=>$("#manageCategoriesDialog").close();$("#favouriteSearch").addEventListener("input",renderFavouritesList);$("#favouriteCategoryFilter").addEventListener("change",renderFavouritesList);$("#closeMealSource").onclick=()=>$("#mealSourceDialog").close();$("#cancelMealSource").onclick=()=>$("#mealSourceDialog").close();$("#closeDayFavourites").onclick=()=>$("#dayFavouritesDialog").close();$("#closeFavouritePreview").onclick=()=>$("#favouritePreviewDialog").close();$("#backToDayFavourites").onclick=()=>{$("#favouritePreviewDialog").close();showFavouritePicker(state.pendingMealDate,state.pendingMealType);};$("#addPreviewedFavourite").onclick=addPreviewedFavourite;
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
 $("#moreThemeSelect").onchange=e=>{state.theme=e.target.value;localStorage.setItem("lb-theme",state.theme);theme();};
 $("#moreSignOut").onclick=signOut;
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
  const tab=b.dataset.tab;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x===b));
  $("#morePanel").classList.toggle("hidden",tab!=="more");
  $("#historyPanel").classList.toggle("hidden",tab!=="history");
  $("#notificationsPanel").classList.toggle("hidden",tab!=="notifications");
  $("#menuPanel").classList.toggle("hidden",tab!=="menu");
  $("#shareButton").classList.toggle("hidden",tab!=="list");
  $("#shareHint").classList.toggle("hidden",tab!=="list");
  $(".list-panel").classList.toggle("hidden",tab!=="list");
  $(".people-strip").classList.toggle("hidden",tab==="more");
  if(tab==="history")refreshActivity();
  if(tab==="menu"){if(!state.menuStart)state.menuStart=localISO(mondayOf(new Date()));loadMenu();loadMenuFavourites();}
 });
}
async function init(){state.menuStart=localISO(mondayOf(new Date()));theme();wire();setInterval(()=>{if(state.items.length)renderItems();},60*1000);setInterval(()=>{if(document.visibilityState==="visible"&&state.user){refreshCurrentList();refreshActivity();refreshListStatus();if(!$("#menuPanel").classList.contains("hidden"))loadMenu();}},4000);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshActivity();});const {data:{session}}=await db.auth.getSession();if(session?.user){state.user=session.user;try{await enter();}catch(e){loggedOut();msg("#authMessage",e.message,true);}}else loggedOut();db.auth.onAuthStateChange(async(_,session)=>{if(session?.user&&!state.user){state.user=session.user;try{await enter();}catch(e){msg("#authMessage",e.message,true);}}});if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload();}});
  navigator.serviceWorker.register("./sw.js?v=1.7.10.2",{updateViaCache:"none"}).then(reg=>{
   const showUpdate=worker=>{if(!worker)return;waitingWorker=worker;$("#updateBanner").hidden=false;$("#applyUpdate").disabled=false;$("#applyUpdate").textContent="Update now";};
   const inspectRegistration=()=>{if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);};
   inspectRegistration();
   reg.addEventListener("updatefound",()=>{
    const installing=reg.installing;if(!installing)return;
    installing.addEventListener("statechange",()=>{
     if(installing.state==="installed"&&navigator.serviceWorker.controller)showUpdate(installing);
    });
   });
   const checkForAppUpdate=()=>reg.update().then(inspectRegistration).catch(()=>{});
   checkForAppUpdate();
   document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkForAppUpdate();});
   window.addEventListener("pageshow",checkForAppUpdate);
   window.addEventListener("online",checkForAppUpdate);
   window.setInterval(checkForAppUpdate,5*60*1000);
  }).catch(error=>console.warn("App update check failed",error));
 }
}
init();
