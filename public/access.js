
(function(){
  const STORAGE_KEY = "ranktagAuthV1";
  const USERS_KEY = "ranktagUsersV2";
  const ADMIN_KEY = "ranktagAdminUnlockedV1";
  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD = "RankTag-Admin-038";
  const ADMIN_PASSWORD_FALLBACKS = ["RankTag-Admin-037", "RankTag-Admin-036"];
  const CODES_KEY = "ranktagAccessCodesV1";
  const PROJECTS_KEY = "ranktagProjectsV1";
  const DAY = 24 * 60 * 60 * 1000;
  const DEFAULT_CODES = [];
  function read(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function normalizeEmail(v){ return String(v || "").trim().toLowerCase(); }
  function now(){ return Date.now(); }
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
  function ensureCodes(){
    const current = read(CODES_KEY, []);
    const byCode = new Map(current.map(c => [String(c.code || "").toUpperCase(), c]));
    DEFAULT_CODES.forEach(c => { if(!byCode.has(c.code)) current.push({...c}); });
    write(CODES_KEY, current);
    return current;
  }
  function getUsers(){
    const users = read(USERS_KEY, []);
    const legacy = read(STORAGE_KEY, null);
    if(legacy?.email && legacy?.password && !users.some(u => normalizeEmail(u.email) === normalizeEmail(legacy.email))){
      users.push({
        email:normalizeEmail(legacy.email),
        nickname:legacy.nickname || String(legacy.email).split("@")[0],
        password:String(legacy.password),
        createdAt:legacy.createdAt || now(),
        access:legacy.access || null
      });
      write(USERS_KEY, users);
    }
    return users;
  }
  function setUsers(users){ write(USERS_KEY, users); return users; }
  function getSession(){ return read(STORAGE_KEY, null); }
  function getAuth(){
    const session = getSession();
    if(!session?.email) return null;
    const users = getUsers();
    const user = users.find(u => normalizeEmail(u.email) === normalizeEmail(session.email));
    if(!user) return null;
    return {...user, email:normalizeEmail(user.email)};
  }
  function setAuth(auth){
    const clean = normalizeEmail(auth?.email);
    if(!clean) return null;
    write(STORAGE_KEY, { email:clean, loggedAt:now() });
    window.dispatchEvent(new Event("ranktag-auth-change"));
    return getAuth();
  }
  function upsertUser(user){
    const users = getUsers();
    const clean = normalizeEmail(user.email);
    const i = users.findIndex(u => normalizeEmail(u.email) === clean);
    const next = {...(i>=0?users[i]:{}), ...user, email:clean};
    if(i>=0) users[i]=next; else users.push(next);
    setUsers(users);
    return next;
  }
  function register(email, password, nickname){
    email = normalizeEmail(email);
    const nick = String(nickname || email.split("@")[0] || "player").trim();
    if(!email || !password) throw new Error("Inserisci email e password.");
    const users = getUsers();
    if(users.some(u => normalizeEmail(u.email) === email)) throw new Error("Account già esistente. Usa login oppure Recupero accesso.");
    if(nick && users.some(u => String(u.nickname||"").toLowerCase() === nick.toLowerCase())) throw new Error("Nickname già usato. Scegline un altro oppure recupera l’account.");
    const user = { email, nickname:nick, password:String(password), createdAt:now(), access:null };
    users.push(user); setUsers(users);
    return setAuth(user);
  }
  function login(identifier, password){
    const id = String(identifier || "").trim().toLowerCase();
    const users = getUsers();
    const user = users.find(u => normalizeEmail(u.email) === id || String(u.nickname||"").toLowerCase() === id);
    if(!user || String(user.password || "") !== String(password || "")) throw new Error("Login non valido. Puoi usare email oppure nickname.");
    return setAuth(user);
  }
  function logout(){ localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event("ranktag-auth-change")); }
  function resetPassword(identifier, newPassword){
    const id = String(identifier || "").trim().toLowerCase();
    if(!id || !newPassword) throw new Error("Inserisci email/nickname e nuova password.");
    const users = getUsers();
    const user = users.find(u => normalizeEmail(u.email) === id || String(u.nickname||"").toLowerCase() === id);
    if(!user) throw new Error("Account non trovato su questo dispositivo.");
    user.password = String(newPassword);
    setUsers(users);
    return user;
  }
  function updateNickname(nickname){
    const auth = getAuth();
    if(!auth?.email) throw new Error("Effettua login prima di modificare il nickname.");
    const nick = String(nickname || "").trim();
    if(!nick) throw new Error("Nickname mancante.");
    const users = getUsers();
    if(users.some(u => normalizeEmail(u.email) !== auth.email && String(u.nickname||"").toLowerCase() === nick.toLowerCase())) throw new Error("Nickname già usato.");
    const user = users.find(u => normalizeEmail(u.email) === auth.email);
    user.nickname = nick;
    setUsers(users);
    return setAuth(user);
  }
  function listKnownUsers(){ return getUsers().map(u => ({ email:normalizeEmail(u.email), nickname:u.nickname || "", hasAccess:!!u.access })); }
  function redeem(code){
    const auth = getAuth();
    if(!auth?.email) throw new Error("Effettua login o registrazione prima di riscattare un codice.");
    const clean = String(code || "").trim().toUpperCase();
    const codes = ensureCodes();
    const item = codes.find(c => String(c.code || "").toUpperCase() === clean);
    if(!item) throw new Error("Codice non trovato.");
    if(item.disabled) throw new Error("Codice disattivato.");
    if(item.usedBy && item.usedBy !== auth.email) throw new Error("Codice già utilizzato da un altro account.");
    if(item.usedBy === auth.email) throw new Error("Hai già riscattato questo codice.");
    const redeemedAt = now();
    const expiresAt = item.type === "permanent" ? null : redeemedAt + durationToMs(item.durationMs || item.days || 1);
    item.usedBy = auth.email; item.usedAt = redeemedAt; item.expiresAt = expiresAt;
    auth.access = { code:item.code, type:item.type, days:item.days, durationMs:item.durationMs || null, redeemedAt, expiresAt };
    upsertUser(auth);
    write(CODES_KEY, codes);
    setAuth(auth);
    return auth.access;
  }
  function getAccessState(){
    const auth = getAuth();
    if(!auth?.email) return { logged:false, active:false, reason:"not_logged" };
    const access = auth.access || null;
    if(!access) return { logged:true, active:false, email:auth.email, reason:"no_code" };
    if(access.type !== "permanent" && Number(access.expiresAt || 0) <= now()) return { logged:true, active:false, email:auth.email, access, reason:"expired" };
    return { logged:true, active:true, email:auth.email, access, reason:"active" };
  }
  function requireBuilderAccess(){ return getAccessState().active; }
  function formatDate(ts){ if(!ts) return "Permanente"; try { return new Date(Number(ts)).toLocaleString("it-IT"); } catch { return "Scadenza non valida"; } }
  function getAccessParams(){
    const st = getAccessState();
    if(!st.active) return null;
    if(st.access?.type === "permanent") return { rtAccess:"permanent", rtAccessUser:st.email };
    return { rtAccess:"expires", rtAccessExp:String(st.access.expiresAt), rtAccessUser:st.email };
  }
  function validateOverlayUrlParams(params){
    const mode = params.get("rtAccess");
    if(!mode) return { active:true, legacy:true };
    if(mode === "permanent") return { active:true, permanent:true };
    const exp = Number(params.get("rtAccessExp") || 0);
    if(exp && exp > now()) return { active:true, expiresAt:exp };
    return { active:false, reason:"expired" };
  }
  function saveProject(link, name){
    const st = getAccessState();
    if(!st.logged || !link) return;
    const projects = read(PROJECTS_KEY, []);
    projects.unshift({ id:"prj_"+now().toString(36), email:st.email, name:String(name || "Overlay RankTag").slice(0,80), link, createdAt:now(), accessExpiresAt:st.access?.expiresAt || null, permanent:st.access?.type === "permanent" });
    write(PROJECTS_KEY, projects.slice(0,50));
  }
  function listProjects(){
    const st = getAccessState();
    if(!st.logged) return [];
    return read(PROJECTS_KEY, []).filter(p => p.email === st.email).map(p => ({...p, active: p.permanent || !p.accessExpiresAt || Number(p.accessExpiresAt) > now()}));
  }
  function makeCode(prefix, type, days){
    const stamp = now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
    const ms = durationToMs(days);
    const totalMinutes = Math.max(1, Math.round(ms / 60000));
    const dur = type === "permanent" ? "PERM" : (totalMinutes < 1440 ? `${totalMinutes}M` : `${Math.round(totalMinutes/1440)}D`);
    return `${String(prefix || "RT").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10) || "RT"}-${dur}-${stamp}-${rnd}`;
  }
  function addCode(code, type, days, note){
    const codes = ensureCodes();
    const clean = String(code || makeCode("RT", type, days)).trim().toUpperCase();
    if(!clean) throw new Error("Codice mancante.");
    if(codes.some(c => String(c.code || "").toUpperCase() === clean)) throw new Error("Codice già esistente.");
    const normalizedType = type === "permanent" ? "permanent" : "temporary";
    const durationMs = normalizedType === "permanent" ? null : durationToMs(days);
    codes.unshift({
      code:clean,
      type:normalizedType,
      days:normalizedType === "permanent" ? null : Math.max(0, Math.floor(durationMs / DAY)),
      durationMs,
      label:normalizedType === "permanent" ? "Accesso permanente" : `Accesso ${durationLabel(durationMs)}`,
      note:String(note || "").slice(0,120),
      createdAt:now(),
      usedBy:null,
      usedAt:null,
      expiresAt:null,
      disabled:false
    });
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
  function listCodes(){ return ensureCodes().map(c => ({...c, status:getCodeStatus(c)})); }
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
  function unlockAdmin(username, password){
    const first = String(username || "").trim();
    const second = String(password || "").trim();
    const ok = first.toLowerCase() === ADMIN_USER && (second === ADMIN_PASSWORD || ADMIN_PASSWORD_FALLBACKS.includes(second));
    if(!ok) throw new Error("Credenziali admin non valide.");
    localStorage.setItem(ADMIN_KEY, "1");
    return true;
  }
  function isAdminUnlocked(){ return localStorage.getItem(ADMIN_KEY) === "1"; }
  function lockAdmin(){ localStorage.removeItem(ADMIN_KEY); }
  window.RankTagAccess = { register, login, logout, resetPassword, updateNickname, listKnownUsers, redeem, getAuth, getAccessState, requireBuilderAccess, getAccessParams, validateOverlayUrlParams, saveProject, listProjects, formatDate, formatDuration: durationLabel, ensureCodes, listCodes, addCode, generateCode, setCodeDisabled, deleteUnusedCode, exportCodes, importCodes, unlockAdmin, isAdminUnlocked, lockAdmin };
  ensureCodes();
})();
