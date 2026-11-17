// Waitlist + survey: sent by FormSubmit (formsubmit.co) to the team inbox.
// The endpoint uses FormSubmit's private alias, so no email address is in the page source.
const WAITLIST = {
  endpoint: "https://formsubmit.co/ajax/3ad5dcd16e3015559be82a9ac7de8033",
};

// Where did this visitor come from? Links shared per channel carry ?ref=whatsapp-micro etc.
// Remembered for the visit (sessionStorage), so a signup on a later page still gets credited.
const SOURCE = (() => {
  let ref = "";
  try {
    const p = new URLSearchParams(location.search);
    ref = (p.get("ref") || p.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
    if (ref) sessionStorage.setItem("kref", ref);
    ref = ref || sessionStorage.getItem("kref") || "";
  } catch {}
  if (!ref && document.referrer) { try { const h = new URL(document.referrer).hostname; if (h !== location.hostname) ref = h; } catch {} }
  return ref || "direct";
})();

// Count an event in GoatCounter (cookie-free visit stats). Silently does nothing if it's blocked.
const track = (name, title) => { try { window.goatcounter && window.goatcounter.count({ path: name, title, event: true }); } catch {} };

// FormSubmit is slow (30–60 s) and sometimes answers with a temporary "Server Error",
// so a failed send is retried once automatically before the visitor sees an error.
const send = async (payload, onRetry) => {
  const attempt = async () => {
    const response = await fetch(WAITLIST.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, source: SOURCE, page: location.pathname, _template: "table" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || String(result.success) !== "true") throw new Error(result.message || "failed");
  };
  try { await attempt(); }
  catch (e) {
    if (/activation/i.test(e.message)) throw e; // not temporary: retrying won't help
    if (onRetry) onRetry();
    await attempt();
  }
};
const retryMsg = (say) => () => say("Almost there… the form service was busy, trying once more. Please keep this page open.");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Personal invite code: short and stable per email (same email → same code), e.g. "f-k3x9qa".
// It's included in the signup email, so the team can see who owns which code.
const inviteCode = (email) => {
  let h = 2166136261;
  for (const ch of email.trim().toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return "f-" + h.toString(36).padStart(6, "0").slice(-6);
};
const remember = (k, v) => { try { sessionStorage.setItem(k, v); } catch {} };
const recall = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };

// Mobile menu
const nav = document.querySelector(".nav");
const menuBtn = document.querySelector(".menu-btn");
if (nav && menuBtn) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
}

// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Waitlist form
document.querySelectorAll("form.waitlist").forEach((form) => {
  const status = form.querySelector(".status");
  const button = form.querySelector("button[type=submit]");
  const say = (text, kind) => { status.textContent = text; status.className = "status " + (kind || ""); };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    if (!isEmail(email)) { form.elements.email.focus(); return say("Please enter a valid email address.", "err"); }
    if (!form.elements.consent.checked) return say("Tick the box so we're allowed to email you about the launch.", "err");
    if (data.get("botcheck")) return (location.href = "thanks.html"); // bots: pretend, send nothing

    button.disabled = true;
    say("Adding you to the list…");
    const slow = setTimeout(() => say("Still sending… this can take up to a minute. Please keep this page open."), 6000);
    try {
      const code = inviteCode(email);
      await send({ _subject: "New Katchy waitlist signup", type: "waitlist", email, university: String(data.get("university") || "").trim() || "(not given)", consent: "yes", invite_code: code }, retryMsg(say));
      clearTimeout(slow);
      remember("kcode", code);
      track("event-signup", "Waitlist signup (" + SOURCE + ")");
      location.href = "thanks.html";
    } catch {
      clearTimeout(slow);
      say("The form couldn't send that just now. Please try again in a minute.", "err");
      button.textContent = "Try again";
      button.disabled = false;
    }
  });
});

// Survey
document.querySelectorAll("form.survey").forEach((form) => {
  const status = form.querySelector(".status");
  const button = form.querySelector("button[type=submit]");
  const done = document.querySelector(".survey-done");
  const say = (text, kind) => { status.textContent = text; status.className = "status " + (kind || ""); };
  const questions = [...form.querySelectorAll("fieldset.q")].filter((f) => f.querySelector("input[type=radio]"));
  form.addEventListener("change", (e) => e.target.closest("fieldset.q")?.classList.remove("missing"));
  track("event-survey-open", "Survey opened (" + SOURCE + ")");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const missing = questions.filter((f) => !f.querySelector("input:checked"));
    questions.forEach((f) => f.classList.toggle("missing", missing.includes(f)));
    if (missing.length) { missing[0].scrollIntoView({ behavior: "smooth", block: "center" }); return say(`Please answer question${missing.length > 1 ? "s" : ""} ${missing.map((f) => questions.indexOf(f) + 1).join(", ")}.`, "err"); }
    const email = String(data.get("email") || "").trim();
    const consent = form.elements.consent.checked;
    if (email && !isEmail(email)) { form.elements.email.focus(); return say("That email doesn't look right. Fix it or leave it empty.", "err"); }
    if (email && !consent) return say("Tick the box to join the waitlist, or clear the email field.", "err");
    if (data.get("botcheck")) { form.hidden = true; if (done) done.hidden = false; return; }

    button.disabled = true;
    say("Sending…");
    const slow = setTimeout(() => say("Still sending… this can take up to a minute. Please keep this page open."), 6000);
    const answers = {};
    for (const f of questions) { const i = f.querySelector("input:checked"); answers[i.name] = i.value; }
    try {
      await send({
        _subject: "New Katchy waitlist signup (survey response)",
        type: email ? "survey + waitlist" : "survey",
        ...answers,
        university: String(data.get("university") || "").trim() || "(not given)",
        email: email || "(not given)",
        consent: email ? "yes" : "no",
        invite_code: email ? inviteCode(email) : "(none)",
      }, retryMsg(say));
      clearTimeout(slow);
      if (email) remember("kcode", inviteCode(email));
      track("event-survey", "Survey answered (" + SOURCE + ")");
      if (email) track("event-signup", "Waitlist signup via survey (" + SOURCE + ")");
      document.querySelector(".page-head").hidden = true;
      form.hidden = true;
      if (done) { done.hidden = false; window.scrollTo({ top: 0, behavior: "smooth" }); }
    } catch {
      clearTimeout(slow);
      say("Couldn't send that just now. Please try again in a minute.", "err");
      button.textContent = "Try again";
      button.disabled = false;
    }
  });

  done?.querySelector(".share")?.addEventListener("click", async (e) => {
    track("event-share-survey", "Survey link copied");
    const url = location.origin + "/survey.html?ref=" + (recall("kcode") || "share");
    try { await navigator.clipboard.writeText(url); e.target.textContent = "Link copied ✓"; } catch { e.target.textContent = url; }
  });
});

// Invite box on the thank-you page: personal link + copy / WhatsApp / native share
document.querySelectorAll(".invite").forEach((box) => {
  const code = recall("kcode") || "share";
  const link = location.origin + "/?ref=" + code;
  const input = box.querySelector(".invite-link");
  input.value = link;
  input.addEventListener("focus", () => input.select());
  const msg = "I just joined the waitlist for Katchy: one tap and it recaps what you missed when you zone out in a lecture 🎓 Join here: " + link;

  box.querySelector(".copy-invite").addEventListener("click", async (e) => {
    track("event-invite-copy", "Invite link copied");
    try { await navigator.clipboard.writeText(link); e.target.textContent = "Copied ✓"; }
    catch { input.focus(); input.select(); e.target.textContent = "Press Ctrl+C"; }
    setTimeout(() => (e.target.textContent = "Copy link"), 2500);
  });

  const wa = box.querySelector(".wa-share");
  wa.href = "https://wa.me/?text=" + encodeURIComponent(msg);
  wa.addEventListener("click", () => track("event-invite-whatsapp", "Invite shared on WhatsApp"));

  const native = box.querySelector(".native-share");
  if (navigator.share) {
    native.hidden = false;
    native.addEventListener("click", async () => {
      track("event-invite-native", "Invite shared (phone share sheet)");
      try { await navigator.share({ title: "Katchy", text: msg.replace(link, "").trim(), url: link }); } catch {}
    });
  }
});
