(function(){
  const STORAGE_KEY = "ranktagAuthV1";
  const USERS_KEY = "ranktagUsersV2";
  const ADMIN_KEY = "ranktagAdminUnlockedV1";
  const ADMIN_TOKEN_KEY = "ranktagAdminTokenV1";
  const ADMIN_EXP_KEY = "ranktagAdminExpV1";
  const CODES_KEY = "ranktagAccessCodesV1";
  const PROJECTS_KEY = "ranktagProjectsV1";
  const DAY = 24 * 60 * 60 * 1000;
  const DEFAULT_CODES = [];
  function read(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function now(){ return Date.now(); }
  function cleanNick(v){ return String(v || "").trim().replace(/\s+/g,"_").slice(0,32); }
  function normNick(v){ return cleanNick(v).toLowerCase(); }
  function legacyNickFromUser(u){
    const nick = cleanNick(u?.nickname || u?.userId || u?.username);
    if(nick) return nick;
    const old = String(u?.email || "").trim();
    if(old.includes("@")) return cleanNick(old.split("@")[0]);
    return cleanNick(old);
  }
  function durationToMs(input){
    if(input && typeof input === "object"){
      const d = Math.max(0, Number(input.days || 0));
      const h = Math.max(0, Number(input.hours || 0));
      const m = Math.max(0, Number(input.minutes || 0));
      const total = ((d * 24 * 60) + (h * 60) + m) * 60 * 1000;
      return Math.max(60 * 1000, total || DAY);
    }
    return Math.max(60 * 1000, Math.max(0, Number(input || 0)) * DAY || DAY);
  }
  function durationLabel(ms){
    if(!ms) return "Permanente";
    let mins = Math.max(1, Math.round(Number(ms) / 60000));
    const days = Math.floor(mins / 1440); mins -= days * 1440;
    const hours = Math.floor(mins / 60); mins -= hours * 60;
    const parts = [];
    if(days) parts.push(days + " giorni");
    if(hours) parts.push(hours + " ore");
    if(mins) parts.push(mins + " minuti");
    return parts.join(" ") || "1 minuto";
  }


  function safeNumber(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function parseDurationFromCode(code){
    const parsed = parsePortableCode(code);
    return parsed && parsed.type !== "permanent" ? parsed.durationMs : null;
  }
  function repairTemporaryAccess(access, fallbackCode){
    if(!access || access.type === "permanent") return access;
    const repaired = {...access, type:"temporary"};
    let redeemedAt = safeNumber(repaired.redeemedAt);
    if(!redeemedAt || redeemedAt <= 0) redeemedAt = safeNumber(repaired.usedAt);
    if(!redeemedAt || redeemedAt <= 0) redeemedAt = now();
    let durationMs = safeNumber(repaired.durationMs);
    if(!durationMs || durationMs <= 0) durationMs = parseDurationFromCode(repaired.code || fallbackCode);
    if(!durationMs || durationMs <= 0) durationMs = durationToMs({
      days: safeNumber(repaired.days) || 0,
      hours: safeNumber(repaired.hours) || 0,
      minutes: safeNumber(repaired.minutes) || 0
    });
    let expiresAt = safeNumber(repaired.expiresAt);
    if(!expiresAt || expiresAt <= 0) expiresAt = redeemedAt + durationMs;
    repaired.redeemedAt = redeemedAt;
    repaired.durationMs = durationMs;
    repaired.expiresAt = expiresAt;
    return repaired;
  }
  function repairCodeRecord(c){
    if(!c || c.type === "permanent") return c;
    const next = {...c, type:"temporary"};
    let durationMs = safeNumber(next.durationMs);
    if(!durationMs || durationMs <= 0) durationMs = parseDurationFromCode(next.code);
    if(!durationMs || durationMs <= 0) durationMs = durationToMs({
      days: safeNumber(next.days) || 0,
      hours: safeNumber(next.hours) || 0,
      minutes: safeNumber(next.minutes) || 0
    });
    next.durationMs = durationMs;
    next.days = Math.floor(durationMs / DAY);
    next.label = next.label || `Accesso ${durationLabel(durationMs)}`;
    if(next.usedBy){
      let usedAt = safeNumber(next.usedAt);
      if(!usedAt || usedAt <= 0) usedAt = now();
      let expiresAt = safeNumber(next.expiresAt);
      if(!expiresAt || expiresAt <= 0) expiresAt = usedAt + durationMs;
      next.usedAt = usedAt;
      next.expiresAt = expiresAt;
    }
    return next;
  }

  function checksumCode(raw){
    const text = String(raw || "").toUpperCase();
    let n = 0;
    for(let i=0;i<text.length;i++) n = (n * 31 + text.charCodeAt(i)) % 46656;
    return n.toString(36).toUpperCase().padStart(3,"0").slice(-3);
  }
  function encodeDurationToken(type, input){
    if(type === "permanent") return "P";
    const mins = Math.max(1, Math.round(durationToMs(input) / 60000));
    return "T" + mins.toString(36).toUpperCase();
  }
  function parsePortableCode(code){
    const clean = String(code || "").trim().toUpperCase();
    const parts = clean.split("-");
    if(parts.length < 5 || parts[0] !== "RT" || parts[1] !== "A") return null;
    const body = parts.slice(0,-1).join("-");
    const chk = parts[parts.length-1];
    if(checksumCode(body) !== chk) return null;
    const token = parts[2] || "";
    const type = token === "P" ? "permanent" : "temporary";
    const minutes = type === "permanent" ? null : parseInt(token.slice(1),36);
    if(type !== "permanent" && (!Number.isFinite(minutes) || minutes < 1)) return null;
    return { code:clean, type, days:type === "permanent" ? null : Math.floor(minutes/1440), durationMs:type === "permanent" ? null : minutes*60000, label:type === "permanent" ? "Accesso permanente" : `Accesso ${durationLabel(minutes*60000)}`, note:"codice portabile", createdAt:now(), usedBy:null, usedNickname:null, usedAt:null, expiresAt:null, disabled:false, portable:true };
  }
  function ensureCodes(){
    const current = read(CODES_KEY, []).map(repairCodeRecord);
    const byCode = new Map(current.map(c => [String(c.code || "").toUpperCase(), c]));
    DEFAULT_CODES.forEach(c => { if(!byCode.has(c.code)) current.push(repairCodeRecord({...c})); });
    write(CODES_KEY, current);
    return current;
  }
  function normalizeUsers(raw){
    const out = [];
    const seen = new Set();
    (Array.isArray(raw) ? raw : []).forEach(u => {
      const nickname = legacyNickFromUser(u);
      const key = normNick(nickname);
      if(!key || seen.has(key)) return;
      seen.add(key);
      out.push({
        userId:key,
        nickname,
        password:String(u.password || ""),
        createdAt:u.createdAt || now(),
        access:u.access || null
      });
    });
    return out;
  }
  function getUsers(){
    let users = normalizeUsers(read(USERS_KEY, []));
    const legacy = read(STORAGE_KEY, null);
    const legacyNickname = legacyNickFromUser(legacy);
    if(legacyNickname && legacy?.password && !users.some(u => normNick(u.nickname) === normNick(legacyNickname))){
      users.push({ userId:normNick(legacyNickname), nickname:legacyNickname, password:String(legacy.password), createdAt:legacy.createdAt || now(), access:legacy.access || null });
    }
    write(USERS_KEY, users);
    return users;
  }
  function setUsers(users){ write(USERS_KEY, normalizeUsers(users)); return getUsers(); }
  function getSession(){ return read(STORAGE_KEY, null); }
  function getAuth(){
    const session = getSession();
    const sessionNick = legacyNickFromUser(session);
    if(!sessionNick) return null;
    const users = getUsers();
    const user = users.find(u => normNick(u.nickname) === normNick(sessionNick) || u.userId === normNick(sessionNick));
    if(!user) return null;
    return {...user, userId:normNick(user.nickname)};
  }
  function setAuth(auth){
    const nickname = legacyNickFromUser(auth);
    if(!nickname) return null;
    write(STORAGE_KEY, { nickname, userId:normNick(nickname), loggedAt:now() });
    window.dispatchEvent(new Event("ranktag-auth-change"));
    return getAuth();
  }
  function upsertUser(user){
    const users = getUsers();
    const nickname = legacyNickFromUser(user);
    const key = normNick(nickname);
    const i = users.findIndex(u => u.userId === key || normNick(u.nickname) === key);
    const next = { ...(i>=0?users[i]:{}), ...user, userId:key, nickname };
    delete next.email;
    if(i>=0) users[i]=next; else users.push(next);
    setUsers(users);
    return next;
  }
  function register(nickname, password){
    const nick = cleanNick(nickname);
    if(!nick || !password) throw new Error("Inserisci nickname e password.");
    const users = getUsers();
    if(users.some(u => normNick(u.nickname) === normNick(nick))) throw new Error("Nickname già esistente. Usa login oppure Recupero accesso.");
    const user = { userId:normNick(nick), nickname:nick, password:String(password), createdAt:now(), access:null };
    users.push(user); setUsers(users);
    return setAuth(user);
  }
  function login(identifier, password){
    const id = normNick(identifier);
    const users = getUsers();
    const user = users.find(u => u.userId === id || normNick(u.nickname) === id);
    if(!user || String(user.password || "") !== String(password || "")) throw new Error("Login non valido. Usa nickname e password.");
    return setAuth(user);
  }
  function logout(){ localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event("ranktag-auth-change")); }
  function resetPassword(identifier, newPassword){
    const id = normNick(identifier);
    if(!id || !newPassword) throw new Error("Inserisci nickname e nuova password.");
    const users = getUsers();
    const user = users.find(u => u.userId === id || normNick(u.nickname) === id);
    if(!user) throw new Error("Nickname non trovato su questo dispositivo.");
    user.password = String(newPassword);
    setUsers(users);
    return user;
  }
  function updateNickname(nickname){
    const auth = getAuth();
    if(!auth?.userId) throw new Error("Effettua login prima di modificare il nickname.");
    const nick = cleanNick(nickname);
    if(!nick) throw new Error("Nickname mancante.");
    const users = getUsers();
    if(users.some(u => u.userId !== auth.userId && normNick(u.nickname) === normNick(nick))) throw new Error("Nickname già usato.");
    const user = users.find(u => u.userId === auth.userId);
    user.nickname = nick; user.userId = normNick(nick);
    setUsers(users);
    return setAuth(user);
  }
  function listKnownUsers(){ return getUsers().map(u => ({ nickname:u.nickname || "", hasAccess:!!u.access })); }
  function redeemLocal(code){
    const auth = getAuth();
    if(!auth?.userId) throw new Error("Effettua login o registrazione prima di riscattare un codice.");
    const clean = String(code || "").trim().toUpperCase();
    const codes = ensureCodes();
    let item = codes.find(c => String(c.code || "").toUpperCase() === clean);
    if(!item){
      item = parsePortableCode(clean);
      if(item){ codes.unshift(item); write(CODES_KEY, codes); }
    }
    if(!item) throw new Error("Codice non trovato. Se è stato generato da un altro dispositivo, crea un nuovo codice portabile dalla BETA 0.4.7.");
    if(item.disabled) throw new Error("Codice disattivato.");
    if(item.usedBy && item.usedBy !== auth.userId) throw new Error("Codice già utilizzato da un altro account.");
    if(item.usedBy === auth.userId) throw new Error("Hai già riscattato questo codice.");
    const redeemedAt = now();
    const ttlMs = item.type === "permanent" ? null : (Number.isFinite(Number(item.durationMs)) && Number(item.durationMs) > 0 ? Number(item.durationMs) : durationToMs({ days:Number(item.days || 1), hours:Number(item.hours || 0), minutes:Number(item.minutes || 0) }));
    const expiresAt = item.type === "permanent" ? null : redeemedAt + ttlMs;
    item.usedBy = auth.userId; item.usedNickname = auth.nickname; item.usedAt = redeemedAt; item.expiresAt = expiresAt;
    auth.access = { code:item.code, type:item.type, days:item.days, hours:item.hours || 0, minutes:item.minutes || 0, durationMs:ttlMs || null, redeemedAt, expiresAt };
    upsertUser(auth);
    write(CODES_KEY, codes);
    setAuth(auth);
    return auth.access;
  }
  async function redeem(code){
    const auth = getAuth();
    if(!auth?.userId) throw new Error("Effettua login o registrazione prima di riscattare un codice.");
    const clean = String(code || "").trim().toUpperCase();
    try {
      const res = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code: clean, userId: auth.userId, nickname: auth.nickname }),
        cache: "no-store"
      });
      const data = await res.json().catch(() => ({}));
      if(res.ok && data.ok && data.access){
        const a = data.access;
        const redeemedAt = a.redeemed_at ? new Date(a.redeemed_at).getTime() : now();
        const expiresAt = a.expires_at ? new Date(a.expires_at).getTime() : null;
        auth.access = {
          code: a.code || clean,
          type: a.type || "temporary",
          durationMs: a.duration_ms || null,
          redeemedAt,
          expiresAt,
          overlaySig: data.overlaySig || null
        };
        upsertUser(auth);
        setAuth(auth);
        return auth.access;
      }
      if(!data.offline && data.message && res.status !== 503){
        throw new Error(data.message);
      }
    } catch (err) {
      if(err.message && !String(err.message).includes("fetch")) throw err;
    }
    return redeemLocal(clean);
  }
  function getAccessState(){
    const auth = getAuth();
    if(!auth?.userId) return { logged:false, active:false, reason:"not_logged" };
    let access = auth.access || null;
    if(!access) return { logged:true, active:false, userId:auth.userId, nickname:auth.nickname, reason:"no_code" };
    access = repairTemporaryAccess(access, access.code);
    if(JSON.stringify(access) !== JSON.stringify(auth.access)){ auth.access = access; upsertUser(auth); }
    if(access.type !== "permanent" && Number(access.expiresAt || 0) <= now()) return { logged:true, active:false, userId:auth.userId, nickname:auth.nickname, access, reason:"expired" };
    return { logged:true, active:true, userId:auth.userId, nickname:auth.nickname, access, reason:"active" };
  }
  function requireBuilderAccess(){ return getAccessState().active; }
  function formatDate(ts){ if(!ts) return "Permanente"; const n = Number(ts); if(!Number.isFinite(n) || n <= 0) return "Da ricalcolare: riscatta di nuovo un codice temporaneo"; const d = new Date(n); if(Number.isNaN(d.getTime())) return "Da ricalcolare: riscatta di nuovo un codice temporaneo"; return d.toLocaleString("it-IT"); }
  function getAccessParams(){
    const st = getAccessState();
    if(!st.active) return null;
    const base = st.access?.type === "permanent"
      ? { rtAccess:"permanent", rtAccessUser:st.userId }
      : { rtAccess:"expires", rtAccessExp:String(st.access.expiresAt), rtAccessUser:st.userId };
    if(st.access?.overlaySig) base.rtAccessSig = st.access.overlaySig;
    return base;
  }
  function validateOverlayUrlParams(params){
    const mode = params.get("rtAccess");
    if(!mode) return { active:true, legacy:true };
    if(mode === "permanent") return { active:true, permanent:true };
    const exp = Number(params.get("rtAccessExp") || 0);
    if(exp && exp > now()) return { active:true, expiresAt:exp };
    return { active:false, reason:"expired" };
  }
  function normalizeProjects(){
    const projects = read(PROJECTS_KEY, []).map(p => p.email && !p.userId ? {...p, userId:legacyNickFromUser(p), nickname:legacyNickFromUser(p), email:undefined} : p);
    write(PROJECTS_KEY, projects);
    return projects;
  }
  function saveProject(link, name, options){
    const st = getAccessState();
    if(!st.logged || !link) throw new Error("Effettua login prima di salvare un progetto.");
    if(!st.active) throw new Error("Serve un codice accesso valido per salvare il progetto.");
    const projects = normalizeProjects();
    const id = String(options?.id || "");
    const projectName = String(name || "Overlay RankTag").trim().slice(0,80) || "Overlay RankTag";
    const payload = { userId:st.userId, nickname:st.nickname, name:projectName, link, updatedAt:now(), accessExpiresAt:st.access?.expiresAt || null, permanent:st.access?.type === "permanent" };
    const index = id ? projects.findIndex(p => p.id === id && p.userId === st.userId) : -1;
    if(index >= 0){ projects[index] = { ...projects[index], ...payload }; write(PROJECTS_KEY, projects); return projects[index]; }
    const created = { id:"prj_"+now().toString(36), ...payload, createdAt:now() };
    projects.unshift(created);
    write(PROJECTS_KEY, projects.slice(0,80));
    return created;
  }
  function listProjects(){
    const st = getAccessState();
    if(!st.logged) return [];
    return normalizeProjects().filter(p => p.userId === st.userId).map(p => ({...p, active: p.permanent || !p.accessExpiresAt || Number(p.accessExpiresAt) > now()}));
  }
  function getProject(id){
    const st = getAccessState();
    if(!st.logged || !id) return null;
    return listProjects().find(p => p.id === id) || null;
  }
  function makeCode(prefix, type, days){
    const normalizedType = type === "permanent" ? "permanent" : "temporary";
    const dur = encodeDurationToken(normalizedType, days);
    const stamp = now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
    const body = `RT-A-${dur}-${stamp}-${rnd}`;
    return `${body}-${checksumCode(body)}`;
  }
  function addCode(code, type, days, note){
    const codes = ensureCodes();
    const clean = String(code || makeCode("RT", type, days)).trim().toUpperCase();
    if(!clean) throw new Error("Codice mancante.");
    if(codes.some(c => String(c.code || "").toUpperCase() === clean)) throw new Error("Codice già esistente.");
    const normalizedType = type === "permanent" ? "permanent" : "temporary";
    const durationMs = normalizedType === "permanent" ? null : durationToMs(days);
    codes.unshift({ code:clean, type:normalizedType, days:normalizedType === "permanent" ? null : Math.max(0, Math.floor(durationMs / DAY)), hours:normalizedType === "permanent" ? null : Math.floor((durationMs % DAY) / 3600000), minutes:normalizedType === "permanent" ? null : Math.floor((durationMs % 3600000) / 60000), durationMs, label:normalizedType === "permanent" ? "Accesso permanente" : `Accesso ${durationLabel(durationMs)}`, note:String(note || "").slice(0,120), createdAt:now(), usedBy:null, usedNickname:null, usedAt:null, expiresAt:null, disabled:false });
    write(CODES_KEY, codes); return codes;
  }
  function generateCode(type, days, prefix, note){ return addCode(makeCode(prefix || "RT", type, days), type, days, note); }
  function setCodeDisabled(code, disabled){
    const clean = String(code || "").trim().toUpperCase();
    const codes = ensureCodes();
    const item = codes.find(c => String(c.code || "").toUpperCase() === clean);
    if(!item) throw new Error("Codice non trovato.");
    item.disabled = !!disabled;
    write(CODES_KEY, codes);
    return codes;
  }
  function deleteUnusedCode(code){
    const clean = String(code || "").trim().toUpperCase();
    const codes = ensureCodes();
    const item = codes.find(c => String(c.code || "").toUpperCase() === clean);
    if(!item) throw new Error("Codice non trovato.");
    if(item.usedBy) throw new Error("Non puoi eliminare un codice già riscattato: disattivalo.");
    const next = codes.filter(c => String(c.code || "").toUpperCase() !== clean);
    write(CODES_KEY, next);
    return next;
  }
  function getCodeStatus(c){
    if(c.disabled) return "disattivato";
    if(c.usedBy && c.type !== "permanent" && Number(c.expiresAt || 0) <= now()) return "scaduto";
    if(c.usedBy) return "usato";
    return "disponibile";
  }
  function listCodes(){ return ensureCodes().map(c => ({...c, status:getCodeStatus(c), usedNickname:c.usedNickname || c.usedBy || ""})); }
  function exportCodes(){ return JSON.stringify(listCodes(), null, 2); }
  function importCodes(raw){
    let incoming = JSON.parse(String(raw || "[]"));
    if(!Array.isArray(incoming)) throw new Error("Import non valido.");
    const current = ensureCodes();
    const byCode = new Map(current.map(c => [String(c.code || "").toUpperCase(), c]));
    incoming.forEach(c => {
      const clean = String(c.code || "").trim().toUpperCase();
      if(!clean) return;
      byCode.set(clean, {...c, code:clean, disabled:!!c.disabled});
    });
    const next = Array.from(byCode.values());
    write(CODES_KEY, next);
    return next;
  }
  async function unlockAdmin(username, password){
    const first = String(username || "").trim();
    const second = String(password || "");
    if(!first || !second) throw new Error("Inserisci username e password admin.");
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ username: first, password: second }),
      cache: "no-store"
    });
    let data = {};
    try { data = await res.json(); } catch { data = {}; }
    if(!res.ok || !data.ok) throw new Error(data.message || "Credenziali admin non valide.");
    sessionStorage.setItem(ADMIN_KEY, "1");
    if(data.token) sessionStorage.setItem(ADMIN_TOKEN_KEY, String(data.token));
    if(data.expiresAt) sessionStorage.setItem(ADMIN_EXP_KEY, String(data.expiresAt));
    sessionStorage.setItem("ranktagAdminApiPass", second);
    return true;
  }
  function isAdminUnlocked(){
    if(sessionStorage.getItem(ADMIN_KEY) !== "1") return false;
    const exp = Number(sessionStorage.getItem(ADMIN_EXP_KEY) || 0);
    if(exp && exp <= now()) { lockAdmin(); return false; }
    return true;
  }
  function lockAdmin(){
    sessionStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_EXP_KEY);
    sessionStorage.removeItem("ranktagAdminApiPass");
  }
  function getAdminApiKey(){ return sessionStorage.getItem("ranktagAdminApiPass") || ""; }
  window.RankTagAccess = { register, login, logout, resetPassword, updateNickname, listKnownUsers, redeem, getAuth, getAccessState, requireBuilderAccess, getAccessParams, validateOverlayUrlParams, saveProject, listProjects, getProject, formatDate, formatDuration: durationLabel, ensureCodes, listCodes, addCode, generateCode, setCodeDisabled, deleteUnusedCode, exportCodes, importCodes, unlockAdmin, isAdminUnlocked, lockAdmin, getAdminApiKey };
  ensureCodes();
})();
