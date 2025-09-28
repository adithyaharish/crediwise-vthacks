// Endpoint to POST when a checkout page is detected
const API_BASE_URL = 'http://localhost:5000'; // TODO: replace with your deployed backend URL
const CHECKOUT_ENDPOINT = `${API_BASE_URL}/checkout`;
const DASHBOARD_BASE_URL = 'http://localhost:5173/dashboard'; // TODO: replace with deployed dashboard URL

// Inject on pages that likely relate to checkout: URL contains "/checkout" OR
// broader keywords so the content script can run DOM heuristics.
function shouldTrigger(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathAndQuery = `${url.pathname}${url.search}`.toLowerCase();
    if (pathAndQuery.includes("/checkout")) return true;
    const patterns = [
      /cart/, /payment/, /billing/, /shipping/, /place[-_ ]?order/, /confirm/, /order[-_ ]?summary/
    ];
    return patterns.some((re) => re.test(pathAndQuery));
  } catch {
    return false;
  }
}
  
  // Debounce map so we only trigger once per final load
  const triggered = new Set();
  
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;
    if (!shouldTrigger(tab.url)) return;
  
    const key = `${tabId}@${tab.url}`;
    if (triggered.has(key)) return;
    triggered.add(key);
  
    // Inject content script into the page
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: ["content.js"]
      });
      // Example: show a badge so you can see it ran
      chrome.action.setBadgeText({ tabId, text: "ON" });
    } catch (e) {
      console.error("Injection failed", e);
    }
  });
  
  // Optional cleanup when tab changes away
  chrome.tabs.onRemoved.addListener(() => triggered.clear());

// Receive confirmation from the content script and POST to API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "checkout_detected") {
    const resolvedUrl = message.url || sender?.tab?.url || null;
    let domain = null;
    if (resolvedUrl) {
      try {
        const parsed = new URL(resolvedUrl);
        domain = parsed.hostname.replace(/^www\./i, "");
      } catch (error) {
        console.warn("Failed to parse URL for domain", resolvedUrl, error);
      }
    }

    const payload = {
      url: resolvedUrl,
      title: message.title || sender?.tab?.title || null,
      detectedAt: new Date().toISOString(),
      tabId: sender?.tab?.id || null,
      source: "content",
      signals: message.signals || {},
      userAgent: navigator.userAgent,
      domain,
    };

    fetch(CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
    })
      .then(async (res) => {
        const text = await res.text().catch(() => "");
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (error) {
          console.warn("Failed to parse checkout response body", error, text);
        }

        const result = { ok: res.ok, status: res.status, data };

        if (sender?.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "checkout_result",
            result,
          });
        }

        if (!res.ok) {
          console.warn("Checkout endpoint responded with non-OK status", res.status, text);
        }

        sendResponse(result);
      })
      .catch((err) => {
        console.error("Checkout POST failed", err);
        if (sender?.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "checkout_result",
            result: { ok: false, status: 0, error: String(err) },
          });
        }
        sendResponse({ ok: false, status: 0, error: String(err) });
      });
    return true; // keep the message channel open for async sendResponse
  }
  if (message && message.type === 'open_dashboard') {
    const token = message.token;
    if (!token) {
      sendResponse({ ok: false, error: 'Missing token' });
      return undefined;
    }
    const url = `${DASHBOARD_BASE_URL}?token=${encodeURIComponent(token)}`;
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
    return undefined;
  }
  return undefined;
});
  