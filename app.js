/* Momentum — a deliberately small, private daily execution tool. */
(() => {
  "use strict";
  const SUPABASE_URL = "https://ihtcxdlcgpqajrtodpqa.supabase.co";
  const SUPABASE_KEY = "sb_publishable_safjAYnONMfTxZ5hk0gEaA_RAmxwK_A";
  const $ = id => document.getElementById(id);
  const blankState = () => ({ days: {}, weeks: {} });
  const clone = data => JSON.parse(JSON.stringify(data));
  const dateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
  const mondayKey = (date = new Date()) => { const d = new Date(date.getFullYear(),date.getMonth(),date.getDate()); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return dateKey(d); };
  let client, currentUser = null, state = blankState(), revision = 0, savedRevision = 0, saving = false, saveTimer = null, appReady = false;
  let timerLength = 1500, remaining = 1500, endAt = 0, timerHandle = null, isRunning = false;

  function setSync(message, isError = false) {
    $("syncStatus").textContent = message;
    $("syncStatus").classList.toggle("error", isError);
  }
  function setView(view) {
    $("todayView").hidden = view !== "today";
    $("weekView").hidden = view !== "week";
    document.querySelectorAll("[data-view]").forEach(button => {
      const selected = button.dataset.view === view;
      button.classList.toggle("active", selected);
      if(selected) button.setAttribute("aria-current","page");
      else button.removeAttribute("aria-current");
    });
    if(view === "week") renderWeek();
  }
  function todayData() {
    const key = dateKey();
    if(!state.days[key] || typeof state.days[key] !== "object") state.days[key] = {};
    return state.days[key];
  }
  function markEdited() {
    if(!appReady) return;
    revision++;
    setSync("Saving…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 650);
  }
  async function flush() {
    if(!appReady || !currentUser || saving || revision === savedRevision) return;
    clearTimeout(saveTimer);
    saving = true;
    const savingRevision = revision;
    const payload = clone(state);
    setSync("Saving…");
    try {
      const { error } = await client.from("momentum_data").upsert({
        user_id: currentUser.id,
        payload,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if(error) throw error;
      savedRevision = savingRevision;
      setSync(revision === savedRevision ? "Saved" : "Saving…");
    } catch(error) {
      console.error("Momentum sync failed", error);
      setSync("Not saved — retrying", true);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 10000);
    } finally {
      saving = false;
      if(revision !== savedRevision && !$("syncStatus").classList.contains("error")) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flush, 350);
      }
    }
  }

  function buildTask(task, index) {
    const row = document.createElement("div");
    row.className = "task-row" + (task.done ? " done" : "");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = !!task.done;
    check.setAttribute("aria-label", "Complete additional task " + (index+1));
    check.onchange = () => { task.done = check.checked; row.classList.toggle("done",check.checked); markEdited(); };
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 400;
    input.placeholder = "An optional task";
    input.value = task.text || "";
    input.setAttribute("aria-label", "Additional task " + (index+1));
    input.oninput = () => { task.text = input.value; markEdited(); };
    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove task " + (index+1));
    remove.onclick = () => {
      const d = todayData();
      const i = d.extras.indexOf(task);
      if(i >= 0) d.extras.splice(i,1);
      markEdited();
      renderTasks();
    };
    row.append(check,input,remove);
    return row;
  }
  function ensureExtras(d) {
    if(!Array.isArray(d.extras)) {
      // Preserve earlier Momentum entries when migrating from the original dashboard.
      const legacy = [d.deliver,d.understand,d.advance].filter(s => typeof s === "string" && s.trim());
      d.extras = legacy.map(s => ({text:s,done:false}));
    }
  }
  function renderTasks() {
    const d = todayData();
    ensureExtras(d);
    const container = $("extraTasks");
    container.replaceChildren(...d.extras.map(buildTask));
    $("addTask").hidden = d.extras.length >= 3;
  }
  function refreshToday() {
    const d = todayData();
    $("dateLabel").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
    $("outcome").value = d.outcome || "";
    $("nextStep").value = d.nextStep || "";
    $("definition").value = d.definition || "";
    $("priorityDone").checked = !!d.priorityDone;
    $("priorityDone").disabled = !(d.outcome || "").trim();
    $("evidence").value = d.evidence || "";
    $("next").value = d.next || "";
    $("closedMessage").textContent = d.closed ? "Day closed ✓" : "";
    if(d.definition && d.definition.trim()) $("definitionDisclosure").open = true;
    renderTasks();
  }
  function renderWeek() {
    const sevenDays = [];
    for(let offset=6;offset>=0;offset--) {
      const date = new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-offset);
      sevenDays.push({date,day:state.days[dateKey(date)] || {}});
    }
    $("completedCount").textContent = sevenDays.filter(item => item.day.priorityDone).length;
    $("focusTotal").textContent = sevenDays.reduce((sum,item) => sum+(Number(item.day.focus)||0),0);
    $("reviewCount").textContent = sevenDays.filter(item => item.day.closed).length;
    const rows = sevenDays.map(item => {
      const row=document.createElement("div");row.className="history-row";
      const date=document.createElement("span");date.className="history-date";
      date.textContent=item.date.toLocaleDateString(undefined,{weekday:"short",day:"numeric"});
      const title=document.createElement("span");title.className="history-title";
      title.textContent=item.day.outcome || "Nothing planned";
      if(!item.day.outcome)title.classList.add("empty");
      const status=document.createElement("span");status.className="history-status";
      if(item.day.priorityDone){status.textContent="Done";status.classList.add("complete")}
      else if(item.day.outcome){status.textContent="Not marked"}
      else status.textContent="—";
      row.append(date,title,status);return row;
    });
    $("history").replaceChildren(...rows);
    const note = (state.weeks[mondayKey()] || {}).adjustment || "";
    $("weeklyNote").value = note;
  }
  async function openWorkspace(session) {
    currentUser = session.user;
    $("accountEmail").textContent = currentUser.email || "";
    setSync("Loading…");
    const { data,error } = await client.from("momentum_data").select("payload").eq("user_id",currentUser.id).maybeSingle();
    if(error) throw new Error("Your data couldn't load. Check the Supabase SQL setup and connection.");
    state = data?.payload && typeof data.payload === "object" && !Array.isArray(data.payload) ? data.payload : blankState();
    if(!state.days || typeof state.days !== "object") state.days = {};
    if(!state.weeks || typeof state.weeks !== "object") state.weeks = {};
    revision = 0;savedRevision = 0;appReady = true;
    $("loginView").hidden = true;
    $("boot").hidden = true;
    $("workspace").hidden = false;
    refreshToday();setView("today");setSync("Saved");
  }
  function showLogin(message = "") {
    $("boot").hidden = true;
    $("workspace").hidden = true;
    $("loginView").hidden = false;
    if(message) $("loginError").textContent = message;
    try { const remembered = localStorage.getItem("momentum-last-email");if(remembered) $("email").value = remembered; } catch {}
  }
  async function boot() {
    if(!window.supabase?.createClient) { showLogin("Couldn't load the sign-in service. Check your internet connection.");$("loginSubmit").disabled=true;return; }
    client = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    try {
      const { data,error } = await client.auth.getSession();
      if(error) throw error;
      if(data.session) await openWorkspace(data.session);
      else showLogin();
    } catch(error) {
      console.error("Momentum startup error",error);
      showLogin(error.message || "Couldn't open your workspace.");
    }
  }

  $("loginForm").addEventListener("submit",async event => {
    event.preventDefault();
    if(!client) return;
    const email=$("email").value.trim();
    const password=$("password").value;
    if(!email || !password) return;
    const button=$("loginSubmit");
    button.disabled = true;
    button.textContent = "Signing in…";
    $("loginError").textContent = "";
    try {
      const {data,error} = await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(!data.session)throw new Error("Couldn't establish a session.");
      $("password").value = "";
      try { localStorage.setItem("momentum-last-email",email); } catch {}
      await openWorkspace(data.session);
    } catch(error) {
      const msg = String(error.message || "");
      $("loginError").textContent =
        /email not confirmed/i.test(msg) ? "Account not confirmed yet. Finish account setup in Supabase Authentication → Users." :
        /invalid login credentials/i.test(msg) ? "Email or password doesn't match. Check your Supabase user account." :
        "Sign in failed: " + (msg || "Try again.");
    } finally {
      button.disabled=false;button.textContent="Sign in";
    }
  });
  $("togglePassword").onclick = () => {
    const field=$("password");
    const reveal=field.type === "password";
    field.type=reveal?"text":"password";
    $("togglePassword").textContent=reveal?"Hide":"Show";
    $("togglePassword").setAttribute("aria-label",reveal?"Hide password":"Show password");
  };

  for(const id of ["outcome","nextStep","definition","evidence","next"]) {
    $(id).addEventListener("input", event => {
      const d=todayData();
      d[id]=event.target.value;
      if(id==="outcome") {
        $("priorityDone").disabled=!d.outcome.trim();
        if(!d.outcome.trim()) {d.priorityDone=false;$("priorityDone").checked=false;}
      }
      markEdited();
    });
  }
  $("priorityDone").onchange = () => {todayData().priorityDone=$("priorityDone").checked;markEdited();};
  $("addTask").onclick = () => {
    const d=todayData();ensureExtras(d);
    if(d.extras.length>=3)return;
    d.extras.push({text:"",done:false});
    markEdited();renderTasks();
    $("extraTasks").lastElementChild?.querySelector('input[type="text"]')?.focus();
  };
  $("closeDay").onclick = () => {
    todayData().closed=true;
    $("closedMessage").textContent="Day closed ✓";
    markEdited();
    $("wrapDisclosure").open=false;
  };
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click",()=>setView(button.dataset.view)));
  $("weeklyNote").oninput = event => {
    const w=state.weeks[mondayKey()] ||= {};
    w.adjustment=event.target.value;
    markEdited();
  };

  function drawTimer() {
    $("clock").textContent=String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");
    $("timerAction").textContent=isRunning?"Pause":(remaining!==timerLength?"Resume":"Start");
    $("timerReset").hidden=remaining===timerLength&&!isRunning;
    $("duration").disabled=isRunning;
  }
  function stopTimer(){isRunning=false;clearInterval(timerHandle);timerHandle=null;}
  function tick() {
    if(!isRunning)return;
    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    if(remaining===0) {
      stopTimer();
      todayData().focus=(Number(todayData().focus)||0)+Math.round(timerLength/60);
      $("timerMessage").textContent="Focus session complete.";
      markEdited();remaining=timerLength;
    }
    drawTimer();
  }
  $("timerAction").onclick = () => {
    if(isRunning){tick();if(isRunning){stopTimer();$("timerMessage").textContent="Paused.";}drawTimer();return;}
    if(remaining===0)remaining=timerLength;
    isRunning=true;endAt=Date.now()+remaining*1000;
    $("timerMessage").textContent="";
    timerHandle=setInterval(tick,500);
    drawTimer();
  };
  $("duration").onchange = () => {stopTimer();timerLength=Number($("duration").value)*60;remaining=timerLength;$("timerMessage").textContent="";drawTimer();};
  $("timerReset").onclick = () => {stopTimer();remaining=timerLength;$("timerMessage").textContent="";drawTimer();};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();else if(appReady && revision!==savedRevision)flush()});
  window.addEventListener("online",()=>{if(appReady)flush()});
  drawTimer();

  $("settingsButton").onclick=()=>$("settingsDialog").showModal();
  $("closeSettings").onclick=()=>$("settingsDialog").close();
  $("settingsDialog").addEventListener("click",event=>{if(event.target===$("settingsDialog"))$("settingsDialog").close()});
  $("exportData").onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const link=document.createElement("a");const url=URL.createObjectURL(blob);
    link.href=url;link.download="momentum-backup-"+dateKey()+".json";link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $("restoreData").onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try {
      const obj=JSON.parse(await file.text());
      if(!obj || !obj.days || !obj.weeks || typeof obj.days!=="object" || typeof obj.weeks!=="object" ||
         Array.isArray(obj.days) || Array.isArray(obj.weeks))throw Error("Not a valid Momentum backup.");
      if(!confirm("Replace ALL your current Momentum records with this backup?"))return;
      state=obj;markEdited();refreshToday();renderWeek();setView("today");$("settingsDialog").close();
    } catch(error){alert(error.message||"Couldn't restore this backup.");}
    finally{event.target.value="";}
  };
  $("signOut").onclick=async()=>{
    if(revision!==savedRevision)await flush();
    if(revision!==savedRevision && !confirm("Recent changes aren't saved. Sign out anyway?"))return;
    $("signOut").disabled=true;
    try{const {error}=await client.auth.signOut();if(error)throw error;location.reload();}
    catch(error){$("signOut").disabled=false;alert("Couldn't sign out: "+error.message);}
  };
  window.addEventListener("beforeunload",event=>{
    if(appReady && revision!==savedRevision){event.preventDefault();event.returnValue="";}
  });
  boot();
})();