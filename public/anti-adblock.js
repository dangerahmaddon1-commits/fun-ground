(function () {
  "use strict";
  if (window.__funGroundAdblockGateLoaded) return;
  window.__funGroundAdblockGateLoaded = true;

  var overlayId = "site-adblock-notice";
  var styles = `
    #site-adblock-notice{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,18,.94);backdrop-filter:blur(8px);font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f8fafc}
    #site-adblock-notice .sab-card{width:min(100%,460px);padding:26px;border:2px solid #ef4444;border-radius:20px;background:#0f172a;box-shadow:0 24px 80px #0008}
    #site-adblock-notice h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;color:#f87171}
    #site-adblock-notice p{margin:0 0 14px;color:#cbd5e1}
    #site-adblock-notice .sab-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
    #site-adblock-notice button{border:1px solid #22c55e;border-radius:10px;padding:11px 16px;font:inherit;font-weight:700;cursor:pointer;background:#22c55e;color:#052e16}
    #site-adblock-notice .sab-small{font-size:.88rem;color:#94a3b8;margin-top:14px}
    #site-adblock-notice button:focus-visible{outline:3px solid #86efac;outline-offset:3px}
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
    bait.className = "adsbox ad-banner ad-unit ad-placeholder adsbygoogle text-ad banner-ad";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText = "position:absolute!important;left:-10000px!important;top:-10000px!important;width:12px!important;height:12px!important;overflow:hidden!important;pointer-events:none!important;";
    document.body.appendChild(bait);
    var cs = window.getComputedStyle(bait);
    var blocked = bait.offsetHeight === 0 || bait.offsetWidth === 0 ||
      cs.display === "none" || cs.visibility === "hidden" ||
      cs.opacity === "0" || bait.getClientRects().length === 0;
    bait.remove();
    return blocked;
  }

  function showGate() {
    if (document.getElementById(overlayId)) return;
    addStyles();
    var overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "site-adblock-title");
    overlay.innerHTML = '<div class="sab-card"><h2 id="site-adblock-title">Please disable your ad blocker</h2><p>Fun Ground is free to use, and advertising helps pay for hosting and maintenance. An ad blocker or browser privacy setting appears to be blocking ads.</p><p>Turn off ad blocking for this site, then select <strong>Check again</strong>. The games will remain locked until the check passes.</p><div class="sab-actions"><button type="button" id="sab-recheck">Check again</button></div><p class="sab-small">If you do not use an ad blocker, check your browser’s tracking protection or DNS filtering. Detection is not perfect, so this check may occasionally be mistaken.</p></div>';
    document.body.appendChild(overlay);
    document.getElementById("sab-recheck").addEventListener("click", function () {
      if (isLikelyBlocked()) {
        var p = overlay.querySelector(".sab-card p");
        if (p) p.textContent = "Ads are still being blocked. Disable the blocker for Fun Ground and try again.";
        return;
      }
      overlay.remove();
    });
  }

  function run() {
    try {
      if (isLikelyBlocked()) showGate();
    } catch (e) {
      // Keep the site usable if the detection script itself fails.
    }
  }

  function start() {
    window.setTimeout(run, 500);
    window.setTimeout(run, 1800);
    window.setTimeout(run, 3500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();