(function () {
  "use strict";
  if (window.__funGroundAdblockNoticeLoaded) return;
  window.__funGroundAdblockNoticeLoaded = true;

  var dismissedKey = "site-adblock-notice-dismissed";
  var styles = `
    #site-adblock-notice{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,18,.72);backdrop-filter:blur(5px);font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f8fafc}
    #site-adblock-notice[hidden]{display:none}
    #site-adblock-notice .sab-card{width:min(100%,460px);padding:26px;border:1px solid #334155;border-radius:20px;background:#0f172a;box-shadow:0 24px 80px #0008}
    #site-adblock-notice h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;color:#fff}
    #site-adblock-notice p{margin:0 0 14px;color:#cbd5e1}
    #site-adblock-notice .sab-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
    #site-adblock-notice button{border:1px solid #475569;border-radius:10px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer}
    #site-adblock-notice .sab-primary{background:#7c9cff;color:#0b1020;border-color:#7c9cff}
    #site-adblock-notice .sab-secondary{background:#1e293b;color:#f8fafc}
    #site-adblock-notice .sab-small{font-size:.88rem;color:#94a3b8;margin-top:14px}
    #site-adblock-notice button:focus-visible{outline:3px solid #5eead4;outline-offset:3px}
    @media(prefers-reduced-motion:reduce){#site-adblock-notice *{scroll-behavior:auto}}
  `;
  function addStyles() {
    if (document.getElementById("site-adblock-notice-styles")) return;
    var style = document.createElement("style");
    style.id = "site-adblock-notice-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }
  function isLikelyBlocked() {
    var bait = document.createElement("div");
    bait.className = "adsbox ad-banner ad-unit ad-placeholder";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText = "position:absolute!important;left:-10000px!important;top:-10000px!important;width:10px!important;height:10px!important;pointer-events:none!important;";
    document.body.appendChild(bait);
    var cs = window.getComputedStyle(bait);
    var blocked = bait.offsetHeight === 0 || bait.offsetWidth === 0 || cs.display === "none" || cs.visibility === "hidden";
    bait.remove();
    return blocked;
  }
  function showNotice() {
    if (document.getElementById("site-adblock-notice") || sessionStorage.getItem(dismissedKey) === "1") return;
    addStyles();
    var overlay = document.createElement("div");
    overlay.id = "site-adblock-notice";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "site-adblock-title");
    overlay.innerHTML = '<div class="sab-card"><h2 id="site-adblock-title">Help keep this site free</h2><p>It looks like an ad blocker or privacy setting may be blocking ads. Ads help us maintain this free service.</p><p>Please consider allowing ads on this site. You can also continue using the site if you prefer.</p><div class="sab-actions"><button type="button" class="sab-primary" id="sab-recheck">I’ve disabled it — check again</button><button type="button" class="sab-secondary" id="sab-continue">Continue to site</button></div><p class="sab-small">Ad-free Premium is planned but is not available yet. This check can sometimes be mistaken, especially with strict browser privacy settings.</p></div>';
    document.body.appendChild(overlay);
    document.getElementById("sab-continue").addEventListener("click", function () {
      sessionStorage.setItem(dismissedKey, "1");
      overlay.remove();
    });
    document.getElementById("sab-recheck").addEventListener("click", function () {
      overlay.remove();
      sessionStorage.removeItem(dismissedKey);
      window.setTimeout(function () {
        if (isLikelyBlocked()) showNotice();
      }, 250);
    });
  }
  function run() {
    try {
      if (isLikelyBlocked()) showNotice();
    } catch (e) {
      // Fail open: ad-block detection must never prevent site functionality.
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.setTimeout(run, 900); }, { once: true });
  } else {
    window.setTimeout(run, 900);
  }
})();