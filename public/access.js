
(function(){
  const STORAGE_KEY = "ranktagAuthV1";
  const ADMIN_KEY = "ranktagAdminUnlockedV1";
  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD = "RankTag-Admin-037";
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
  function getAuth(){ return read(STORAGE_KEY, null); }
  function setAuth(auth){ write(STORAGE_KEY, auth); window.dispatchEvent(new Event("ranktag-auth-change")); return auth; }
  function register(email, password){
    email = normalizeEmail(email);
    if(!email || !password) throw new Error("Inserisci email e password.");
    return setAuth({ email, password:String(password), createdAt:now(), access:null });
  }
  function login(email, password){
    email = normalizeEmail(email);
    const auth = getAuth();
    if(!auth || auth.email !== email || String(auth.password || "") !== String(password || "")) throw new Error("Login non valido su questo browser. Registrati o controlla i dati.");
    return setAuth(auth);
  }
  function logout(){ localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event("ranktag-auth-change")); }
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
    const ok = first.toLowerCase() === ADMIN_USER && second === ADMIN_PASSWORD;
    if(!ok) throw new Error("Credenziali admin non valide.");
    localStorage.setItem(ADMIN_KEY, "1");
    return true;
  }
  function isAdminUnlocked(){ return localStorage.getItem(ADMIN_KEY) === "1"; }
  function lockAdmin(){ localStorage.removeItem(ADMIN_KEY); }
  window.RankTagAccess = { register, login, logout, redeem, getAuth, getAccessState, requireBuilderAccess, getAccessParams, validateOverlayUrlParams, saveProject, listProjects, formatDate, formatDuration: durationLabel, ensureCodes, listCodes, addCode, generateCode, setCodeDisabled, deleteUnusedCode, exportCodes, importCodes, unlockAdmin, isAdminUnlocked, lockAdmin };
  ensureCodes();
})();
