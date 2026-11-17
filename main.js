// Waitlist: signups are sent by FormSubmit (formsubmit.co) to the team inbox.
// The endpoint uses FormSubmit's private alias, so no email address is in the page source.
const WAITLIST = {
  endpoint: "https://formsubmit.co/ajax/3ad5dcd16e3015559be82a9ac7de8033",
};

// Mobile menu
const nav = document.querySelector(".nav");
const menuBtn = document.querySelector(".menu-btn");
if (nav && menuBtn) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".links a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("open"))
  );
}

// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Waitlist form
document.querySelectorAll("form.waitlist").forEach((form) => {
  const status = form.querySelector(".status");
  const button = form.querySelector("button[type=submit]");
  const say = (text, kind) => {
    status.textContent = text;
    status.className = "status " + (kind || "");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.elements.email.focus();
      return say("Please enter a valid email address.", "err");
    }
    if (!form.elements.consent.checked) {
      return say("Tick the box so we're allowed to email you about the launch.", "err");
    }
    if (data.get("botcheck")) return (location.href = "thanks.html"); // bots: pretend, send nothing

    button.disabled = true;
    say("Adding you to the list…");
    const slow = setTimeout(() => say("Still sending… this can take up to a minute. Please keep this page open."), 6000);
    try {
      const response = await fetch(WAITLIST.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          university: String(data.get("university") || "").trim() || "(not given)",
          consent: "yes",
          page: location.pathname,
          _subject: "New Katchy waitlist signup",
          _template: "table",
        }),
      });
      const result = await response.json().catch(() => ({}));
      clearTimeout(slow);
      if (!response.ok || String(result.success) !== "true") throw new Error(result.message || "failed");
      location.href = "thanks.html";
    } catch {
      clearTimeout(slow);
      say("The form couldn't send that just now. Please try again in a minute.", "err");
      button.textContent = "Try again";
      button.disabled = false;
    }
  });
});
