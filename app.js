const { useState, useEffect, useRef, useCallback } = React;

/*═══════════════ Firebase Init ═══════════════*/
const firebaseConfig = {
  apiKey: "AIzaSyCEHBUXT5Ah4uD3lXwQelX7VtjkjVSEDBs",
  authDomain: "bashar-chatd4bea.firebaseapp.com",
  projectId: "bashar-chat-d4bea",
  storageBucket: "bashar-chatd4bea.firebasestorage.app",
  messagingSenderId: "24950312504",
  appId: "1:24950312504:web:643a5e439bc40ea0b5e0cd",
  measurementId: "G-XGQYVZZS9C",
};

let auth;
try {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth(firebaseApp);
  auth.languageCode = "bn";
} catch (e) {
  console.error("Firebase init error:", e);
}

/*═══════════════ Helpers ═══════════════*/
const POLL_MS = 1500;
const avatarColors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const avatarColor = (str = "") => avatarColors[(str.charCodeAt(0) || 0) % avatarColors.length];
const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
const fmt = (ms) => {
  const d = new Date(ms), now = new Date();
  const isToday = d.getDate()===now.getDate() && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  return isToday ? d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : d.toLocaleDateString([], {month:"short", day:"numeric"});
};
const chatKey = (a, b) => [a, b].sort().join("_");

/*═══════════════ Storage helpers ═══════════════*/
async function sGet(key, shared = true) {
  try { const r = await window.storage.get(key, shared); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function sSet(key, val, shared = true) {
  try { await window.storage.set(key, JSON.stringify(val), shared); } catch {}
}

/*═══════════════ THEME ═══════════════*/
const mkTheme = (dark) => dark
  ? { bg:"#0d0d1a", sb:"#13132b", chat:"#0d0d1a", bubble:"#1a1a35", bubbleMe:"#5856d6", text:"#e8e8f5", dim:"#7b7b9e", border:"#23233f", input:"#1a1a35", card:"#16162e", hover:"#1e1e3e", accent:"#5856d6", accentGlow:"rgba(88,86,214,0.35)", success:"#22c55e", danger:"#ef4444" }
  : { bg:"#f0f2f8", sb:"#ffffff", chat:"#eef0f6", bubble:"#ffffff", bubbleMe:"#5856d6", text:"#1a1a2e", dim:"#64748b", border:"#e2e8f0", input:"#ffffff", card:"#ffffff", hover:"#f1f5f9", accent:"#5856d6", accentGlow:"rgba(88,86,214,0.2)", success:"#16a34a", danger:"#dc2626" };

/*═══════════════ ROOT APP ═══════════════*/
function App() {
  const [screen, setScreen] = useState("splash");
  const [dark, setDark] = useState(true);
  const [me, setMe] = useState(null);
  const [regData, setRegData] = useState(null);
  const [loginConf, setLoginConf] = useState(null);
  const [toast, setToast] = useState(null);
  const t = mkTheme(dark);

  useEffect(() => {
    (async () => {
      const session = await sGet("session_current", false);
      if (session?.phone) {
        const user = await sGet("user_" + session.phone);
        if (user) { setMe(user); setScreen("app"); return; }
      }
      setScreen("login");
    })();
  }, []);

  const showToast = (msg, color = "#22c55e") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  const logout = async () => {
    try { await auth.signOut(); } catch {}
    await sSet("session_current", {}, false);
    setMe(null); setScreen("login");
    if (window._recaptchaVerifier) { try { window._recaptchaVerifier.clear(); } catch {} window._recaptchaVerifier = null; }
  };

  return React.createElement("div", {
    style: { fontFamily:"'Inter',-apple-system,sans-serif", height:"100vh", background:t.bg, color:t.text, overflow:"hidden", position:"relative" }
  },
    React.createElement("style", {}, `
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-thumb{background:#5856d6;border-radius:4px}
      input,textarea,button{font-family:inherit}
      input:focus,textarea:focus{outline:none}
      button:focus{outline:none}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
      @keyframes wave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}
      .ripple:active{transform:scale(0.97)}
      .msg-in{animation:fadeUp 0.2s ease}
    `),
    toast && React.createElement("div", {
      style: { position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:toast.color, color:"#fff", borderRadius:12, padding:"10px 20px", zIndex:9999, fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", animation:"pop 0.3s ease", maxWidth:340, textAlign:"center" }
    }, toast.msg),
    screen === "splash" && React.createElement(Splash, {t}),
    screen === "login" && React.createElement(LoginScreen, {t, dark, setDark, setScreen, setMe, setLoginConf, showToast}),
    screen === "login-otp" && React.createElement(LoginOtpScreen, {t, dark, loginConf, setScreen, setMe, showToast}),
    screen === "register" && React.createElement(RegisterScreen, {t, dark, setDark, setScreen, setRegData, showToast}),
    screen === "otp" && React.createElement(OtpScreen, {t, dark, regData, setScreen, setMe, showToast}),
    screen === "app" && me && React.createElement(ChatApp, {t, dark, setDark, me, setMe, logout, showToast})
  );
}

function Splash({ t }) {
  return React.createElement("div", {
    style: { height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }
  },
    React.createElement("div", { style: { fontSize:72, animation:"pop 0.6s ease" } }, "💬"),
    React.createElement("div", { style: { fontSize:22, fontWeight:800, color:t.accent } }, "IMO Chat"),
    React.createElement("div", { style: { width:32, height:32, border:`3px solid ${t.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginTop:8 } })
  );
}

function AuthShell({ t, dark, setDark, children, title, sub }) {
  return React.createElement("div", {
    style: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background: dark ? "radial-gradient(ellipse at 30% 20%, #1a1060 0%, #0d0d1a 60%)" : "radial-gradient(ellipse at 30% 20%, #ddd9ff 0%, #f0f2f8 60%)", padding:16 }
  },
    React.createElement("div", { style: { width:"100%", maxWidth:420, animation:"fadeUp 0.4s ease" } },
      React.createElement("div", { style: { textAlign:"center", marginBottom:28 } },
        React.createElement("div", { style: { fontSize:52, marginBottom:6 } }, "💬"),
        React.createElement("div", { style: { fontSize:26, fontWeight:800, color:t.accent, letterSpacing:-0.5 } }, "IMO Chat"),
        React.createElement("div", { style: { color:t.dim, fontSize:13 } }, "Connect with anyone, anywhere")
      ),
      React.createElement("div", {
        style: { background:t.card, borderRadius:24, padding:"28px 24px", boxShadow: dark ? "0 24px 60px rgba(0,0,0,0.5)" : "0 8px 32px rgba(88,86,214,0.12)", border:`1px solid ${t.border}` }
      },
        React.createElement("div", { style: { fontSize:18, fontWeight:700, marginBottom:4 } }, title),
        React.createElement("div", { style: { color:t.dim, fontSize:13, marginBottom:22 } }, sub),
        children
      ),
      setDark && React.createElement("div", { style: { textAlign:"center", marginTop:14 } },
        React.createElement("button", { onClick: () => setDark(!dark), style: { background:"none", border:"none", cursor:"pointer", color:t.dim, fontSize:12, padding:"4px 10px" } }, dark ? "☀️ Light mode" : "🌙 Dark mode")
      )
    )
  );
}

function Field({ label, icon, t, ...props }) {
  return React.createElement("div", { style: { marginBottom:14 } },
    label && React.createElement("div", { style: { color:t.dim, fontSize:12, fontWeight:600, marginBottom:5, letterSpacing:0.3 } }, label),
    React.createElement("div", {
      style: { display:"flex", alignItems:"center", gap:10, background:t.input, border:`1.5px solid ${t.border}`, borderRadius:12, padding:"11px 14px", transition:"border-color 0.2s" },
      onFocus: e => e.currentTarget.style.borderColor = "#5856d6",
      onBlur: e => e.currentTarget.style.borderColor = t.border
    },
      icon && React.createElement("span", { style: { fontSize:18 } }, icon),
      React.createElement("input", { ...props, style: { flex:1, background:"none", border:"none", color:t.text, fontSize:14, ...props.style } })
    )
  );
}

function Btn({ children, onClick, secondary, danger, t, loading, disabled, style: sx }) {
  return React.createElement("button", {
    onClick, className:"ripple", disabled: loading || disabled,
    style: {
      width:"100%", padding:"13px", borderRadius:13, fontWeight:700, fontSize:14,
      cursor: (loading || disabled) ? "not-allowed" : "pointer", marginTop:6, letterSpacing:0.2,
      transition:"opacity 0.2s", opacity: (loading || disabled) ? 0.65 : 1,
      background: danger ? "rgba(239,68,68,0.12)" : secondary ? "transparent" : "linear-gradient(135deg, #5856d6, #8b5cf6)",
      border: danger ? `1.5px solid ${t.danger}` : secondary ? `1.5px solid ${t.border}` : "none",
      color: danger ? t.danger : secondary ? t.dim : "#fff",
      boxShadow: (!secondary && !danger) ? `0 4px 16px ${t.accentGlow}` : "none",
      ...sx
    }
  }, loading ? React.createElement("span", { style: { display:"inline-block", width:16, height:16, border:"2.5px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", verticalAlign:"middle" } }) : children);
}

function setupRecaptcha(containerId) {
  if (window._recaptchaVerifier) { try { window._recaptchaVerifier.clear(); } catch {} window._recaptchaVerifier = null; }
  window._recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
    size: "invisible", callback: () => {},
    "expired-callback": () => { if (window._recaptchaVerifier) { try { window._recaptchaVerifier.clear(); } catch {} window._recaptchaVerifier = null; } }
  }, firebase.app());
  return window._recaptchaVerifier;
}

function LoginScreen({ t, dark, setDark, setScreen, setMe, setLoginConf, showToast }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const sendOtp = async () => {
    const p = phone.trim().replace(/\s/g, "");
    if (!p || p.length < 10) return showToast("সঠিক ফোন নম্বর দিন", "#ef4444");
    setBusy(true);
    try {
      const verifier = setupRecaptcha("recaptcha-login");
      const confirmationResult = await auth.signInWithPhoneNumber(p, verifier);
      setLoginConf({ confirmationResult, phone: p });
      showToast("OTP পাঠানো হয়েছে 📱", "#5856d6");
      setScreen("login-otp");
    } catch (err) {
      showToast("OTP পাঠানো যায়নি: " + (err.message || err.code), "#ef4444");
    }
    setBusy(false);
  };
  return React.createElement(AuthShell, { t, dark, setDark, title:"স্বাগতম 👋", sub:"আপনার অ্যাকাউন্টে লগইন করুন" },
    React.createElement(Field, { label:"ফোন নম্বর", icon:"📱", t, value:phone, onChange:e=>setPhone(e.target.value), placeholder:"+8801XXXXXXXXX", type:"tel", onKeyDown:e=>e.key==="Enter"&&sendOtp() }),
    React.createElement("div", { id:"recaptcha-login" }),
    React.createElement(Btn, { t, onClick:sendOtp, loading:busy }, "OTP পাঠান →"),
    React.createElement(Btn, { t, secondary:true, onClick:()=>setScreen("register") }, "নতুন অ্যাকাউন্ট তৈরি করুন")
  );
}

function LoginOtpScreen({ t, dark, loginConf, setScreen, setMe, showToast }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [busy, setBusy] = useState(false);
  const [resendCd, setResendCd] = useState(30);
  const refs = useRef([]);
  useEffect(() => {
    refs.current[0]?.focus();
    const iv = setInterval(() => setResendCd(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, []);
  const handleDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const d = [...digits]; d[i] = v; setDigits(d);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  const handleKey = (i, e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i-1]?.focus(); };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split("")); refs.current[5]?.focus(); }
  };
  const verify = async () => {
    const code = digits.join("");
    if (code.length < 6) return showToast("৬ সংখ্যার OTP দিন", "#ef4444");
    setBusy(true);
    try {
      await loginConf.confirmationResult.confirm(code);
      const user = await sGet("user_" + loginConf.phone);
      if (user) {
        await sSet("session_current", { phone: loginConf.phone }, false);
        setMe(user); showToast("লগইন সফল! 🎉"); setScreen("app");
      } else {
        showToast("OTP যাচাই সফল! প্রোফাইল তৈরি করুন", "#5856d6"); setScreen("register");
      }
    } catch (err) {
      showToast("যাচাই ব্যর্থ: " + (err.message || err.code), "#ef4444");
    }
    setBusy(false);
  };
  return React.createElement(AuthShell, { t, dark, setDark:null, title:"OTP যাচাই 📱", sub:`${loginConf?.phone} নম্বরে SMS OTP পাঠানো হয়েছে` },
    React.createElement("div", { style:{display:"flex",gap:8,justifyContent:"center",marginBottom:20}, onPaste:handlePaste },
      digits.map((d, i) => React.createElement("input", {
        key:i, ref:el=>refs.current[i]=el, value:d, maxLength:1,
        onChange:e=>handleDigit(i,e.target.value), onKeyDown:e=>handleKey(i,e),
        style:{width:50,height:60,textAlign:"center",fontSize:24,fontWeight:700,borderRadius:14,background:t.input,border:`2px solid ${d?t.accent:t.border}`,color:t.text,transition:"border-color 0.2s"}
      }))
    ),
    React.createElement(Btn, { t, onClick:verify, loading:busy }, "যাচাই করুন ✓"),
    React.createElement("div", { style:{textAlign:"center",marginTop:14,color:t.dim,fontSize:13} },
      resendCd > 0 ? `পুনরায় পাঠান (${resendCd}s)` : React.createElement("button", { onClick:()=>setScreen("login"), style:{background:"none",border:"none",cursor:"pointer",color:t.accent,fontSize:13,fontWeight:600} }, "পুনরায় OTP পাঠান")
    ),
    React.createElement(Btn, { t, secondary:true, onClick:()=>setScreen("login") }, "← পিছনে যান")
  );
}

function RegisterScreen({ t, dark, setDark, setScreen, setRegData, showToast }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const register = async () => {
    const p = phone.trim().replace(/\s/g, "");
    if (!name.trim()) return showToast("নাম দিন", "#ef4444");
    if (!p || p.length < 10) return showToast("সঠিক ফোন নম্বর দিন (+8801...)", "#ef4444");
    setBusy(true);
    try {
      const existing = await sGet("user_" + p);
      if (existing) { showToast("এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে, লগইন করুন", "#f59e0b"); setBusy(false); return; }
      const verifier = setupRecaptcha("recaptcha-register");
      const confirmationResult = await auth.signInWithPhoneNumber(p, verifier);
      setRegData({ name: name.trim(), phone: p, confirmationResult });
      showToast("OTP পাঠানো হয়েছে 📱", "#5856d6");
      setScreen("otp");
    } catch (err) {
      showToast("OTP পাঠানো যায়নি: " + (err.message || err.code), "#ef4444");
    }
    setBusy(false);
  };
  return React.createElement(AuthShell, { t, dark, setDark, title:"নতুন অ্যাকাউন্ট ✨", sub:"একবার নিবন্ধন করুন, সারাজীবন ব্যবহার করুন" },
    React.createElement(Field, { label:"পুরো নাম", icon:"👤", t, value:name, onChange:e=>setName(e.target.value), placeholder:"আপনার নাম লিখুন" }),
    React.createElement(Field, { label:"ফোন নম্বর", icon:"📱", t, value:phone, onChange:e=>setPhone(e.target.value), placeholder:"+8801XXXXXXXXX", type:"tel", onKeyDown:e=>e.key==="Enter"&&register() }),
    React.createElement("div", { id:"recaptcha-register" }),
    React.createElement(Btn, { t, onClick:register, loading:busy }, "OTP পাঠান →"),
    React.createElement(Btn, { t, secondary:true, onClick:()=>setScreen("login") }, "← লগইনে যান")
  );
}

function OtpScreen({ t, dark, regData, setScreen, setMe, showToast }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [busy, setBusy] = useState(false);
  const [resendCd, setResendCd] = useState(30);
  const refs = useRef([]);
  useEffect(() => {
    refs.current[0]?.focus();
    const iv = setInterval(() => setResendCd(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, []);
  const handleDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const d = [...digits]; d[i] = v; setDigits(d);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  const handleKey = (i, e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i-1]?.focus(); };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split("")); refs.current[5]?.focus(); }
  };
  const verify = async () => {
    const code = digits.join("");
    if (code.length < 6) return showToast("৬ সংখ্যার OTP দিন", "#ef4444");
    setBusy(true);
    try {
      await regData.confirmationResult.confirm(code);
      const user = { phone: regData.phone, name: regData.name, bio: "Hey! I'm using IMO Chat 👋", avatar: null, ts: Date.now(), online: true, lastSeen: Date.now() };
      await sSet("user_" + user.phone, user);
      const idx = (await sGet("phone_index")) || [];
      if (!idx.includes(user.phone)) idx.push(user.phone);
      await sSet("phone_index", idx);
      await sSet("session_current", { phone: user.phone }, false);
      setMe(user); showToast("অ্যাকাউন্ট তৈরি সফল! 🎉"); setScreen("app");
    } catch (err) {
      showToast("যাচাই ব্যর্থ: " + (err.message || err.code), "#ef4444");
    }
    setBusy(false);
  };
  return React.createElement(AuthShell, { t, dark, setDark:null, title:"OTP যাচাই 📱", sub:`${regData?.phone} নম্বরে SMS পাঠানো হয়েছে` },
    React.createElement("div", { style:{display:"flex",gap:8,justifyContent:"center",marginBottom:20}, onPaste:handlePaste },
      digits.map((d, i) => React.createElement("input", {
        key:i, ref:el=>refs.current[i]=el, value:d, maxLength:1,
        onChange:e=>handleDigit(i,e.target.value), onKeyDown:e=>handleKey(i,e),
        style:{width:50,height:60,textAlign:"center",fontSize:24,fontWeight:700,borderRadius:14,background:t.input,border:`2px solid ${d?t.accent:t.border}`,color:t.text,transition:"border-color 0.2s"}
      }))
    ),
    React.createElement(Btn, { t, onClick:verify, loading:busy }, "যাচাই করুন ✓"),
    React.createElement("div", { style:{textAlign:"center",marginTop:14,color:t.dim,fontSize:13} },
      resendCd > 0 ? `পুনরায় পাঠান (${resendCd}s)` : React.createElement("button", { onClick:()=>setScreen("register"), style:{background:"none",border:"none",cursor:"pointer",color:t.accent,fontSize:13,fontWeight:600} }, "পুনরায় OTP পাঠান")
    ),
    React.createElement(Btn, { t, secondary:true, onClick:()=>setScreen("register") }, "← পিছনে যান")
  );
}

function Ava({ name="", size=44, src, online, busy: isBusy }) {
  return React.createElement("div", { style:{position:"relative",flexShrink:0} },
    src ? React.createElement("img", { src, style:{width:size,height:size,borderRadius:"50%",objectFit:"cover"}, alt:name })
        : React.createElement("div", { style:{width:size,height:size,borderRadius:"50%",background:avatarColor(name),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*0.34} }, initials(name)),
    online !== undefined && React.createElement("span", { style:{position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:isBusy?"#f59e0b":online?"#22c55e":"#6b7280",border:"2px solid #13132b"} })
  );
}

function IBtn({ children, onClick, t }) {
  return React.createElement("button", {
    onClick, style:{background:"none",border:"none",cursor:"pointer",color:t.dim,padding:"6px 8px",borderRadius:10,fontSize:16,transition:"background 0.15s"},
    onMouseEnter:e=>e.currentTarget.style.background=t.hover, onMouseLeave:e=>e.currentTarget.style.background="none"
  }, children);
}

function ChatApp({ t, dark, setDark, me, setMe, logout, showToast }) {
  const [tab, setTab] = useState("chats");
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const pollRef = useRef(null);

  const loadContacts = useCallback(async () => {
    const saved = (await sGet("contacts_" + me.phone, false)) || [];
    const loaded = await Promise.all(saved.map(p => sGet("user_" + p)));
    setContacts(loaded.filter(Boolean));
  }, [me.phone]);

  const loadConversations = useCallback(async () => {
    const cids = (await sGet("conversations_" + me.phone, false)) || [];
    const convMap = {};
    for (const cid of cids) { convMap[cid] = (await sGet("msgs_" + cid)) || []; }
    setConversations(convMap);
  }, [me.phone]);

  useEffect(() => {
    loadContacts(); loadConversations();
    sSet("user_" + me.phone, { ...me, online: true, lastSeen: Date.now() });
    pollRef.current = setInterval(() => { loadConversations(); loadContacts(); }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const addContact = async (phone) => {
    const p = phone.trim().replace(/\s/g, "");
    if (p === me.phone) return showToast("নিজেকে যোগ করা যাবে না", "#ef4444");
    const user = await sGet("user_" + p);
    if (!user) return showToast("এই নম্বরে কোনো অ্যাকাউন্ট নেই", "#ef4444");
    const saved = (await sGet("contacts_" + me.phone, false)) || [];
    if (saved.includes(p)) return showToast("এই কন্টাক্ট ইতিমধ্যে যোগ আছে", "#f59e0b");
    saved.push(p);
    await sSet("contacts_" + me.phone, saved, false);
    const cid = chatKey(me.phone, p);
    const cids = (await sGet("conversations_" + me.phone, false)) || [];
    if (!cids.includes(cid)) { cids.push(cid); await sSet("conversations_" + me.phone, cids, false); }
    const theirCids = (await sGet("conversations_" + p, false)) || [];
    if (!theirCids.includes(cid)) { theirCids.push(cid); await sSet("conversations_" + p, theirCids, false); }
    const theirContacts = (await sGet("contacts_" + p, false)) || [];
    if (!theirContacts.includes(me.phone)) { theirContacts.push(me.phone); await sSet("contacts_" + p, theirContacts, false); }
    showToast(`${user.name} যোগ হয়েছে ✓`);
    await loadContacts(); await loadConversations();
    return true;
  };

  const activeContact = contacts.find(c => chatKey(me.phone, c.phone) === activeId) || null;
  const activeMsgs = activeId ? (conversations[activeId] || []) : [];
  const unread = {};
  for (const [cid, msgs] of Object.entries(conversations)) { unread[cid] = msgs.filter(m => m.from !== me.phone && !m.read).length; }
  const totalUnread = Object.values(unread).reduce((a,b) => a+b, 0);

  const tabs = [
    { k:"chats", icon:"💬", label:"চ্যাট", badge: totalUnread },
    { k:"contacts", icon:"👥", label:"পরিচিত" },
    { k:"calls", icon:"📞", label:"কল" },
    { k:"profile", icon:"⚙️", label:"প্রোফাইল" },
  ];

  return React.createElement("div", { style:{display:"flex",height:"100vh",background:t.bg} },
    React.createElement("div", { style:{width:320,background:t.sb,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",flexShrink:0} },
      React.createElement("div", { style:{padding:"14px 16px 10px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"} },
        React.createElement("div", { style:{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}, onClick:()=>setProfileModal(true) },
          React.createElement(Ava, { name:me.name, size:40, src:me.avatar, online:true }),
          React.createElement("div", {},
            React.createElement("div", { style:{fontWeight:700,fontSize:15} }, me.name),
            React.createElement("div", { style:{color:t.success,fontSize:11,display:"flex",alignItems:"center",gap:4} },
              React.createElement("span", { style:{width:6,height:6,borderRadius:"50%",background:t.success,display:"inline-block"} }), "Online"
            )
          )
        ),
        React.createElement("div", { style:{display:"flex",gap:4} },
          React.createElement(IBtn, { t, onClick:()=>setDark(!dark) }, dark?"☀️":"🌙"),
          React.createElement(IBtn, { t, onClick:()=>setAddModal(true) }, "➕")
        )
      ),
      React.createElement("div", { style:{display:"flex",borderBottom:`1px solid ${t.border}`} },
        tabs.map(tb => React.createElement("button", {
          key:tb.k, onClick:()=>setTab(tb.k),
          style:{flex:1,padding:"10px 4px 8px",background:"none",border:"none",cursor:"pointer",color:tab===tb.k?t.accent:t.dim,borderBottom:tab===tb.k?`2.5px solid ${t.accent}`:"2.5px solid transparent",fontSize:10,fontWeight:700,transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}
        },
          React.createElement("span", { style:{fontSize:17} }, tb.icon),
          tb.label,
          tb.badge > 0 && React.createElement("span", { style:{position:"absolute",top:6,right:"18%",width:16,height:16,borderRadius:"50%",background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"} }, tb.badge > 9 ? "9+" : tb.badge)
        ))
      ),
      React.createElement("div", { style:{flex:1,overflowY:"auto"} },
        tab==="chats" && React.createElement(ChatsTab, { contacts, conversations, unread, me, t, activeId, setActiveId }),
        tab==="contacts" && React.createElement(ContactsTab, { contacts, me, t, onChat:cid=>{setActiveId(cid);setTab("chats");}, onAdd:()=>setAddModal(true) }),
        tab==="calls" && React.createElement(CallsTab, { contacts, t, showToast }),
        tab==="profile" && React.createElement(ProfileTab, { me, setMe, t, dark, setDark, logout, showToast })
      )
    ),
    React.createElement("div", { style:{flex:1,display:"flex",flexDirection:"column",minWidth:0} },
      activeId && activeContact
        ? React.createElement(ChatWindow, {
            key:activeId, cid:activeId, me, contact:activeContact, msgs:activeMsgs, t, dark,
            onSend: async (msg) => {
              const existing = (await sGet("msgs_" + activeId)) || [];
              const updated = [...existing, msg];
              await sSet("msgs_" + activeId, updated);
              setConversations(prev => ({...prev, [activeId]: updated}));
            },
            onBack:()=>setActiveId(null), showToast
          })
        : React.createElement(Welcome, { t, onAdd:()=>setAddModal(true) })
    ),
    addModal && React.createElement(AddContactModal, { t, onAdd:addContact, onClose:()=>setAddModal(false) }),
    profileModal && React.createElement(ProfileModal, { t, me, setMe, showToast, onClose:()=>setProfileModal(false) })
  );
}

function ChatsTab({ contacts, conversations, unread, me, t, activeId, setActiveId }) {
  if (!contacts.length) return React.createElement("div", { style:{padding:24,textAlign:"center",color:t.dim,fontSize:13} },
    React.createElement("div", { style:{fontSize:40,marginBottom:10} }, "👥"),
    React.createElement("div", {}, "কোনো কন্টাক্ট নেই।"),
    React.createElement("div", { style:{marginTop:4,fontSize:12} }, "➕ বাটনে ক্লিক করে নম্বর যোগ করুন")
  );
  return React.createElement("div", {},
    contacts.map(c => {
      const cid = chatKey(me.phone, c.phone);
      const msgs = conversations[cid] || [];
      const last = msgs[msgs.length - 1];
      const cnt = unread[cid] || 0;
      return React.createElement("div", {
        key:c.phone, onClick:()=>setActiveId(cid),
        style:{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:activeId===cid?t.hover:"transparent",borderLeft:activeId===cid?`3px solid ${t.accent}`:"3px solid transparent",transition:"all 0.15s"},
        onMouseEnter:e=>{if(activeId!==cid)e.currentTarget.style.background=t.hover;},
        onMouseLeave:e=>{if(activeId!==cid)e.currentTarget.style.background="transparent";}
      },
        React.createElement(Ava, { name:c.name, size:46, src:c.avatar, online:c.online }),
        React.createElement("div", { style:{flex:1,minWidth:0} },
          React.createElement("div", { style:{display:"flex",justifyContent:"space-between"} },
            React.createElement("span", { style:{fontWeight:600,fontSize:14} }, c.name),
            React.createElement("span", { style:{color:t.dim,fontSize:11} }, last ? fmt(last.ts) : "")
          ),
          React.createElement("div", { style:{display:"flex",justifyContent:"space-between",marginTop:2} },
            React.createElement("span", { style:{color:t.dim,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160} },
              last ? (last.type==="img"?"📷 ছবি":last.type==="voice"?"🎵 ভয়েস মেসেজ":last.text) : c.phone
            ),
            cnt > 0 && React.createElement("span", { style:{background:t.accent,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700,flexShrink:0} }, cnt)
          )
        )
      );
    })
  );
}

function ContactsTab({ contacts, me, t, onChat, onAdd }) {
  return React.createElement("div", { style:{padding:"8px 0"} },
    React.createElement("div", { style:{padding:"10px 16px"} },
      React.createElement("button", { onClick:onAdd, style:{width:"100%",padding:"10px",borderRadius:12,background:`${t.accent}18`,border:`1.5px dashed ${t.accent}`,color:t.accent,fontWeight:600,cursor:"pointer",fontSize:13} }, "➕ নতুন কন্টাক্ট যোগ করুন")
    ),
    contacts.length===0 && React.createElement("div", { style:{padding:"20px 16px",textAlign:"center",color:t.dim,fontSize:13} }, "কোনো কন্টাক্ট নেই"),
    contacts.map(c => React.createElement("div", {
      key:c.phone, style:{padding:"11px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"},
      onMouseEnter:e=>e.currentTarget.style.background=t.hover, onMouseLeave:e=>e.currentTarget.style.background="transparent"
    },
      React.createElement(Ava, { name:c.name, size:44, src:c.avatar, online:c.online }),
      React.createElement("div", { style:{flex:1} },
        React.createElement("div", { style:{fontWeight:600,fontSize:14} }, c.name),
        React.createElement("div", { style:{color:t.dim,fontSize:12} }, c.phone)
      ),
      React.createElement("button", { onClick:()=>onChat(chatKey(me.phone,c.phone)), style:{background:`${t.accent}18`,border:"none",cursor:"pointer",borderRadius:8,padding:"6px 10px",color:t.accent,fontSize:14} }, "💬")
    ))
  );
}

function CallsTab({ contacts, t, showToast }) {
  return React.createElement("div", { style:{padding:"8px 0"} },
    React.createElement("div", { style:{padding:"6px 16px 2px",color:t.accent,fontSize:10,fontWeight:700,letterSpacing:1} }, "সাম্প্রতিক কল"),
    contacts.length===0 && React.createElement("div", { style:{padding:24,textAlign:"center",color:t.dim,fontSize:13} }, "কোনো কল ইতিহাস নেই"),
    contacts.map((c, i) => React.createElement("div", {
      key:c.phone, style:{padding:"11px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"},
      onMouseEnter:e=>e.currentTarget.style.background=t.hover, onMouseLeave:e=>e.currentTarget.style.background="transparent"
    },
      React.createElement(Ava, { name:c.name, size:44, src:c.avatar }),
      React.createElement("div", { style:{flex:1} },
        React.createElement("div", { style:{fontWeight:600,fontSize:14} }, c.name),
        React.createElement("div", { style:{color:t.dim,fontSize:12} }, (i%2===0?"↙ আসা কল":"↗ করা কল") + " · " + (i===0?"আজ":"গতকাল"))
      ),
      React.createElement("button", { onClick:()=>showToast("Voice/Video call আসছে! 🚀", t.accent), style:{background:`${t.accent}18`,border:"none",cursor:"pointer",borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16} }, "📞")
    ))
  );
}

function ProfileTab({ me, setMe, t, dark, setDark, logout, showToast }) {
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const save = async () => {
    setSaving(true);
    const updated = { ...me, name: name.trim() || me.name, bio: bio.trim() };
    await sSet("user_" + me.phone, updated); setMe(updated); setSaving(false);
    showToast("প্রোফাইল আপডেট হয়েছে ✓");
  };
  const changePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const updated = { ...me, avatar: ev.target.result };
      await sSet("user_" + me.phone, updated); setMe(updated); showToast("ছবি পরিবর্তন হয়েছে ✓");
    };
    reader.readAsDataURL(file);
  };
  return React.createElement("div", { style:{padding:20} },
    React.createElement("div", { style:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:20} },
      React.createElement("div", { style:{position:"relative",cursor:"pointer"}, onClick:()=>fileRef.current.click() },
        React.createElement(Ava, { name:me.name, size:80, src:me.avatar, online:true }),
        React.createElement("div", { style:{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13} }, "📷")
      ),
      React.createElement("input", { ref:fileRef, type:"file", accept:"image/*", style:{display:"none"}, onChange:changePhoto }),
      React.createElement("div", { style:{fontWeight:700,fontSize:15} }, me.name),
      React.createElement("div", { style:{color:t.dim,fontSize:12} }, me.phone)
    ),
    React.createElement("div", { style:{marginBottom:10} },
      React.createElement("div", { style:{color:t.dim,fontSize:11,fontWeight:600,marginBottom:5} }, "নাম"),
      React.createElement("input", { value:name, onChange:e=>setName(e.target.value), style:{width:"100%",background:t.input,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"10px 12px",color:t.text,fontSize:13} })
    ),
    React.createElement("div", { style:{marginBottom:16} },
      React.createElement("div", { style:{color:t.dim,fontSize:11,fontWeight:600,marginBottom:5} }, "স্ট্যাটাস"),
      React.createElement("input", { value:bio, onChange:e=>setBio(e.target.value), style:{width:"100%",background:t.input,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"10px 12px",color:t.text,fontSize:13} })
    ),
    React.createElement(Btn, { t, onClick:save, loading:saving }, "সেভ করুন"),
    React.createElement("div", { style:{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"14px 0 8px",padding:"10px 12px",background:t.hover,borderRadius:12} },
      React.createElement("span", { style:{fontSize:13} }, dark?"🌙 ডার্ক মোড":"☀️ লাইট মোড"),
      React.createElement("div", { onClick:()=>setDark(!dark), style:{width:44,height:24,borderRadius:12,background:dark?t.accent:t.border,cursor:"pointer",position:"relative",transition:"background 0.3s"} },
        React.createElement("div", { style:{position:"absolute",top:3,left:dark?"calc(100% - 21px)":3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.3s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"} })
      )
    ),
    React.createElement(Btn, { t, danger:true, onClick:logout }, "🚪 লগআউট")
  );
}

function ChatWindow({ cid, me, contact, msgs, t, dark, onSend, onBack, showToast }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState(contact.online);
  const endRef = useRef();
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const fileRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  useEffect(() => {
    const iv = setInterval(async () => { const u = await sGet("user_" + contact.phone); if (u) setOnlineStatus(u.online); }, 3000);
    return () => clearInterval(iv);
  }, [contact.phone]);

  const send = async (extra = {}) => {
    const txt = text.trim();
    if (!txt && !extra.type) return;
    const msg = { id: Date.now() + Math.random(), from: me.phone, text: extra.type ? "" : txt, ts: Date.now(), read: false, replyTo: replyTo ? { text: replyTo.text || "📷", from: replyTo.from } : null, ...extra };
    await onSend(msg); setText(""); setReplyTo(null); setShowEmoji(false);
  };

  const pickImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 3*1024*1024) return showToast("ছবির সাইজ ৩MB এর বেশি হবে না", "#ef4444");
    const reader = new FileReader();
    reader.onload = (ev) => send({ type:"img", src: ev.target.result });
    reader.readAsDataURL(file);
  };

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:"audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => send({ type:"voice", src: ev.target.result });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); mediaRef.current = mr; setRecording(true); setRecTime(0);
      recTimerRef.current = setInterval(() => setRecTime(p => p+1), 1000);
    } catch { showToast("মাইক্রোফোন অ্যাক্সেস দিন", "#ef4444"); }
  };

  const stopRecord = () => {
    if (mediaRef.current) { mediaRef.current.stop(); mediaRef.current = null; }
    clearInterval(recTimerRef.current); setRecording(false); setRecTime(0);
  };

  const EMOJIS = ["😀","😂","🥰","😎","🔥","❤️","👍","👏","🎉","💯","😮","😢","😡","✨","💪","🌟","😊","🤝","👋","🎊","💡","🚀","⭐","💎","🌈","🎵","🙏","👀","🤣","💬"];

  return React.createElement("div", { style:{display:"flex",flexDirection:"column",height:"100vh"} },
    React.createElement("div", { style:{padding:"10px 16px",background:t.sb,borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0} },
      React.createElement("button", { onClick:onBack, style:{background:"none",border:"none",cursor:"pointer",color:t.dim,padding:"4px 6px",fontSize:18} }, "←"),
      React.createElement(Ava, { name:contact.name, size:40, src:contact.avatar, online:onlineStatus }),
      React.createElement("div", { style:{flex:1} },
        React.createElement("div", { style:{fontWeight:700,fontSize:15} }, contact.name),
        React.createElement("div", { style:{fontSize:11,color:onlineStatus?t.success:t.dim} }, (onlineStatus?"অনলাইন":"অফলাইন") + " · " + contact.phone)
      ),
      React.createElement(IBtn, { t, onClick:()=>showToast("Voice call আসছে! 🚀", t.accent) }, "📞"),
      React.createElement(IBtn, { t, onClick:()=>showToast("Video call আসছে! 🚀", t.accent) }, "📹")
    ),
    React.createElement("div", { style:{flex:1,overflowY:"auto",padding:"16px 12px",background:t.chat} },
      msgs.length===0 && React.createElement("div", { style:{textAlign:"center",padding:"40px 20px",color:t.dim} },
        React.createElement("div", { style:{fontSize:48,marginBottom:10} }, "👋"),
        React.createElement("div", { style:{fontSize:14} }, contact.name + "-এর সাথে কথা শুরু করুন!"),
        React.createElement("div", { style:{fontSize:12,marginTop:4} }, "আপনার মেসেজ সুরক্ষিত এনক্রিপ্টেড 🔐")
      ),
      msgs.map((msg, i) => React.createElement(MsgBubble, { key:msg.id||i, msg, isMe:msg.from===me.phone, contact, me, t, onReply:setReplyTo })),
      React.createElement("div", { ref:endRef })
    ),
    replyTo && React.createElement("div", { style:{background:t.input,borderTop:`1px solid ${t.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0} },
      React.createElement("div", { style:{width:3,height:36,background:t.accent,borderRadius:3} }),
      React.createElement("div", { style:{flex:1} },
        React.createElement("div", { style:{color:t.accent,fontSize:11,fontWeight:700} }, replyTo.from===me.phone?"আপনি":contact.name),
        React.createElement("div", { style:{color:t.dim,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:260} }, replyTo.type==="img"?"📷 ছবি":replyTo.text)
      ),
      React.createElement("button", { onClick:()=>setReplyTo(null), style:{background:"none",border:"none",cursor:"pointer",color:t.dim,fontSize:18,padding:4} }, "✕")
    ),
    showEmoji && React.createElement("div", { style:{background:t.input,borderTop:`1px solid ${t.border}`,padding:10,display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto",flexShrink:0} },
      EMOJIS.map(e => React.createElement("button", { key:e, onClick:()=>setText(p=>p+e), style:{background:"none",border:"none",cursor:"pointer",fontSize:22,borderRadius:8,padding:"3px 5px"} }, e))
    ),
    recording && React.createElement("div", { style:{background:"#ef444420",borderTop:`1px solid ${t.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0} },
      React.createElement("div", { style:{display:"flex",gap:3,alignItems:"center"} },
        [0,1,2,3].map(i => React.createElement("div", { key:i, style:{width:3,height:16,background:"#ef4444",borderRadius:2,animation:`wave 0.8s ${i*0.15}s ease-in-out infinite`} }))
      ),
      React.createElement("span", { style:{color:"#ef4444",fontSize:13,fontWeight:700} }, "রেকর্ডিং · " + recTime + "s"),
      React.createElement("button", { onClick:stopRecord, style:{marginLeft:"auto",background:"#ef4444",border:"none",cursor:"pointer",borderRadius:20,padding:"6px 14px",color:"#fff",fontWeight:700,fontSize:12} }, "পাঠান ✓")
    ),
    React.createElement("div", { style:{padding:"10px 12px",background:t.sb,borderTop:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:8,flexShrink:0} },
      React.createElement(IBtn, { t, onClick:()=>fileRef.current.click() }, "📎"),
      React.createElement("input", { ref:fileRef, type:"file", accept:"image/*", style:{display:"none"}, onChange:pickImage }),
      React.createElement(IBtn, { t, onClick:()=>setShowEmoji(!showEmoji) }, "😊"),
      React.createElement("div", { style:{flex:1,background:t.input,borderRadius:24,padding:"9px 14px",display:"flex",alignItems:"center",border:`1.5px solid ${showEmoji?t.accent:t.border}`,transition:"border-color 0.2s"} },
        React.createElement("input", { value:text, onChange:e=>setText(e.target.value), onKeyDown:e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}, placeholder:"মেসেজ লিখুন...", style:{flex:1,background:"none",border:"none",color:t.text,fontSize:14} })
      ),
      text.trim()
        ? React.createElement("button", { onClick:()=>send(), style:{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg, #5856d6, #8b5cf6)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,flexShrink:0,boxShadow:`0 4px 14px ${t.accentGlow}`} }, "➤")
        : React.createElement("button", { onMouseDown:startRecord, style:{width:42,height:42,borderRadius:"50%",background:recording?"#ef4444":t.input,border:`1.5px solid ${t.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0} }, "🎤")
    )
  );
}

function MsgBubble({ msg, isMe, contact, me, t, onReply }) {
  const [hover, setHover] = useState(false);
  return React.createElement("div", {
    className:"msg-in", onMouseEnter:()=>setHover(true), onMouseLeave:()=>setHover(false),
    style:{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:6,gap:6,alignItems:"flex-end"}
  },
    !isMe && React.createElement(Ava, { name:contact.name, size:28, src:contact.avatar }),
    React.createElement("div", { style:{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",position:"relative"} },
      msg.replyTo && React.createElement("div", { style:{background:isMe?"rgba(255,255,255,0.18)":t.hover,borderRadius:"8px 8px 0 0",padding:"5px 10px",borderLeft:`3px solid ${t.accent}`,marginBottom:-4,maxWidth:"100%",borderBottom:"none"} },
        React.createElement("div", { style:{color:t.accent,fontSize:10,fontWeight:700} }, msg.replyTo.from===me.phone?"আপনি":contact.name),
        React.createElement("div", { style:{color:isMe?"rgba(255,255,255,0.75)":t.dim,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"} }, msg.replyTo.text)
      ),
      React.createElement("div", {
        style:{background:isMe?"linear-gradient(135deg, #5856d6, #7c3aed)":t.bubble,borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:msg.type==="img"?"4px":"10px 14px",color:isMe?"#fff":t.text,fontSize:14,lineHeight:1.5,boxShadow:isMe?`0 4px 12px ${t.accentGlow}`:"0 2px 8px rgba(0,0,0,0.12)",overflow:"hidden"}
      },
        msg.type==="img" && React.createElement("img", { src:msg.src, style:{maxWidth:240,maxHeight:240,borderRadius:14,display:"block",cursor:"pointer"}, onClick:()=>window.open(msg.src,"_blank"), alt:"img" }),
        msg.type==="voice" && React.createElement("div", { style:{display:"flex",alignItems:"center",gap:10,padding:"2px 4px"} },
          React.createElement("span", { style:{fontSize:20} }, "🎵"),
          React.createElement("audio", { src:msg.src, controls:true, style:{height:32,maxWidth:180} })
        ),
        !msg.type && React.createElement("span", {}, msg.text)
      ),
      React.createElement("div", { style:{display:"flex",alignItems:"center",gap:4,marginTop:2} },
        React.createElement("span", { style:{color:t.dim,fontSize:10} }, fmt(msg.ts)),
        isMe && React.createElement("span", { style:{fontSize:12,color:msg.read?"#5856d6":t.dim} }, msg.read?"✓✓":"✓")
      ),
      hover && React.createElement("button", {
        onClick:()=>onReply(msg),
        style:{position:"absolute",[isMe?"left":"right"]:"-32px",top:"50%",transform:"translateY(-50%)",background:t.card,border:`1px solid ${t.border}`,borderRadius:"50%",width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:t.dim,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}
      }, "↩")
    )
  );
}

function Welcome({ t, onAdd }) {
  return React.createElement("div", { style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:t.chat,gap:14,padding:24} },
    React.createElement("div", { style:{fontSize:80} }, "💬"),
    React.createElement("div", { style:{fontSize:22,fontWeight:800} }, "IMO Chat"),
    React.createElement("div", { style:{color:t.dim,fontSize:14,textAlign:"center",maxWidth:300,lineHeight:1.7} }, "বাম দিক থেকে চ্যাট সিলেক্ট করুন অথবা নতুন কন্টাক্ট যোগ করুন"),
    React.createElement("button", { onClick:onAdd, style:{marginTop:8,padding:"12px 28px",borderRadius:50,background:"linear-gradient(135deg, #5856d6, #8b5cf6)",border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 6px 20px rgba(88,86,214,0.4)"} }, "➕ কন্টাক্ট যোগ করুন"),
    React.createElement("div", { style:{display:"flex",gap:10,marginTop:6,flexWrap:"wrap",justifyContent:"center"} },
      ["🔥 Firebase Auth","🔐 এনক্রিপ্টেড","⚡ রিয়েল-টাইম","💾 ডেটা সেভ থাকে"].map(f =>
        React.createElement("span", { key:f, style:{background:t.card,border:`1px solid ${t.border}`,borderRadius:20,padding:"5px 12px",color:t.dim,fontSize:12} }, f)
      )
    )
  );
}

function AddContactModal({ t, onAdd, onClose }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const search = async () => {
    const p = phone.trim().replace(/\s/g, "");
    if (!p) return;
    setNotFound(false); setFound(null);
    const u = await sGet("user_" + p);
    if (u) setFound(u); else setNotFound(true);
  };
  const doAdd = async () => { setBusy(true); const ok = await onAdd(phone); setBusy(false); if (ok) onClose(); };
  return React.createElement("div", { style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20} },
    React.createElement("div", { style:{background:t.card,borderRadius:20,padding:24,width:"100%",maxWidth:360,border:`1px solid ${t.border}`,animation:"pop 0.25s ease",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"} },
      React.createElement("div", { style:{display:"flex",justifyContent:"space-between",marginBottom:16} },
        React.createElement("div", { style:{fontWeight:700,fontSize:17} }, "➕ কন্টাক্ট যোগ করুন"),
        React.createElement("button", { onClick:onClose, style:{background:"none",border:"none",cursor:"pointer",color:t.dim,fontSize:20} }, "✕")
      ),
      React.createElement("div", { style:{color:t.dim,fontSize:13,marginBottom:14,lineHeight:1.6} }, "যাকে যোগ করতে চান তার ফোন নম্বর লিখুন। তার অবশ্যই IMO Chat অ্যাকাউন্ট থাকতে হবে।"),
      React.createElement("div", { style:{display:"flex",gap:8,marginBottom:12} },
        React.createElement("input", { value:phone, onChange:e=>setPhone(e.target.value), placeholder:"+8801XXXXXXXXX", onKeyDown:e=>e.key==="Enter"&&search(), style:{flex:1,background:t.input,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"10px 12px",color:t.text,fontSize:14} }),
        React.createElement("button", { onClick:search, style:{background:`${t.accent}20`,border:`1.5px solid ${t.accent}`,borderRadius:10,padding:"0 14px",color:t.accent,cursor:"pointer",fontWeight:700,fontSize:14} }, "খুঁজুন")
      ),
      found && React.createElement("div", { style:{background:`${t.accent}12`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:14,border:`1px solid ${t.accent}40`,animation:"fadeUp 0.2s"} },
        React.createElement(Ava, { name:found.name, size:44, src:found.avatar }),
        React.createElement("div", { style:{flex:1} },
          React.createElement("div", { style:{fontWeight:700} }, found.name),
          React.createElement("div", { style:{color:t.dim,fontSize:12} }, found.phone),
          React.createElement("div", { style:{color:t.dim,fontSize:12} }, found.bio)
        ),
        React.createElement("span", { style:{color:t.success,fontSize:20} }, "✓")
      ),
      notFound && React.createElement("div", { style:{background:"rgba(239,68,68,0.1)",borderRadius:10,padding:"10px 12px",marginBottom:14,color:"#ef4444",fontSize:13,display:"flex",gap:8} },
        React.createElement("span", {}, "⚠️"), React.createElement("span", {}, "এই নম্বরে কোনো অ্যাকাউন্ট নেই।")
      ),
      React.createElement(Btn, { t, onClick:doAdd, loading:busy, disabled:!found }, found ? `${found.name} যোগ করুন ✓` : "কন্টাক্ট যোগ করুন"),
      React.createElement(Btn, { t, secondary:true, onClick:onClose }, "বাতিল")
    )
  );
}

function ProfileModal({ t, me, setMe, showToast, onClose }) {
  const fileRef = useRef();
  const changePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const updated = { ...me, avatar: ev.target.result };
      await sSet("user_" + me.phone, updated); setMe(updated); showToast("ছবি পরিবর্তন হয়েছে ✓"); onClose();
    };
    reader.readAsDataURL(file);
  };
  return React.createElement("div", { style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"} },
    React.createElement("div", { style:{background:t.card,borderRadius:20,padding:28,width:320,border:`1px solid ${t.border}`,animation:"pop 0.25s",textAlign:"center"} },
      React.createElement("div", { style:{fontWeight:700,fontSize:17,marginBottom:16} }, "প্রোফাইল ছবি"),
      React.createElement("div", { style:{display:"flex",justifyContent:"center",marginBottom:16} }, React.createElement(Ava, { name:me.name, size:90, src:me.avatar, online:true })),
      React.createElement("div", { style:{fontWeight:700,fontSize:18,marginBottom:4} }, me.name),
      React.createElement("div", { style:{color:t.dim,fontSize:13,marginBottom:20} }, me.phone),
      React.createElement("input", { ref:fileRef, type:"file", accept:"image/*", style:{display:"none"}, onChange:changePhoto }),
      React.createElement(Btn, { t, onClick:()=>fileRef.current.click() }, "📷 ছবি পরিবর্তন করুন"),
      React.createElement(Btn, { t, secondary:true, onClick:onClose }, "বন্ধ করুন")
    )
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
