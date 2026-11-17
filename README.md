# Katchy waitlist site

A plain static website: HTML, one CSS file, one small JS file. No build step, no cookies, no trackers.

| Page | What it's for |
|---|---|
| `index.html` | Home: hero, waitlist form, three feature columns, how it works |
| `how.html` | How the recap, the question and the notes work |
| `science.html` | The Szpunar, Khan & Schacter (PNAS 2013) study, with honest caveats |
| `faq.html` | Common questions |
| `privacy.html` | What the waitlist collects and why |
| `about.html` | The team and how to reach you (LinkedIn) |
| `thanks.html` | Shown after someone joins |
| `404.html` | Shown for any page that doesn't exist |

## Where it lives

- **Live now:** https://getkatchy.github.io/ (GitHub Pages, repo `getkatchy/getkatchy.github.io`). Every push to `main` updates the site.
- **Signups:** the form sends each signup to the team inbox through FormSubmit (formsubmit.co), using FormSubmit's private alias so no email address is in the page source. FormSubmit activates per website address: if the site ever moves to a new address, the first signup triggers a new **activation email** for that address, which must be clicked.

## Connect getkatchy.app (about 10 min)
1. Buy **getkatchy.app** from any registrar, for example Cloudflare, Porkbun or Namecheap. It was unregistered when checked on 17 Nov 2026, and `.app` domains usually cost roughly $15–20 a year.
2. In the repo, go to *Settings → Pages → Custom domain*, enter `getkatchy.app`, and tick *Enforce HTTPS* once it's offered.
3. At the registrar, add the DNS records GitHub shows: four `A` records for the domain pointing at GitHub Pages.
4. Update the site's own address: replace `https://getkatchy.github.io` with `https://getkatchy.app` in all files, then activate FormSubmit for the new address.
- Backups if the domain is gone: `joinkatchy.com`, `trykatchy.com`, `katchyapp.com` (all unregistered on 17 Nov 2026).

## Before you share it widely
- Have the privacy page checked (for example by Bocconi's legal clinic), as the existing `site/LAUNCH-CHECKLIST.md` in the Katchy repo suggests.
- Put the site's address in the TikTok bio, since the reel ends with "link in bio".
