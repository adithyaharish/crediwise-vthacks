(function () {
  if (window.__checkout_triggered__) return;
  window.__checkout_triggered__ = true;

  const url = location.href.toLowerCase();
  const urlLooksLikeCheckout = url.includes('/checkout');
  const heuristics = [/checkout/, /payment/, /billing/, /shipping/, /place[-_ ]?order/, /order[-_ ]?summary/, /proceed to checkout/, /pay now/];
  let checkoutToken = null;

  const overlayState = {
    host: null,
    messageNode: null,
    detailNode: null,
    buttonNode: null,
  };

  function collectDomSignals() {
    const signals = {};
    try {
      const textContent = document.body.innerText.toLowerCase();
      signals.textMentions = heuristics.filter((re) => re.test(textContent)).map((re) => re.source);
      const buttonTexts = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], a'))
        .map((el) => (el.textContent || el.getAttribute('value') || '').trim().toLowerCase())
        .filter(Boolean);
      signals.buttonMentions = buttonTexts
        .filter((t) => /(pay|place order|checkout|continue to payment|buy now|proceed to checkout)/.test(t))
        .slice(0, 10);
      signals.formsCount = document.forms.length;
    } catch (e) {}
    return signals;
  }

  function ensureOverlay() {
    if (overlayState.host && overlayState.host.isConnected) {
      return overlayState;
    }

    const host = document.createElement('div');
    host.id = 'cw-checkout-overlay';
    host.style.position = 'fixed';
    host.style.bottom = '16px';
    host.style.right = '16px';
    host.style.zIndex = '2147483647';
    host.style.maxWidth = '90vw';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .cw-widget {
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        width: 320px;
        max-width: 90vw;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        overflow: hidden;
      }
      .cw-header {
        background: #111827;
        color: #ffffff;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .cw-title {
        font-size: 14px;
        font-weight: 600;
      }
      .cw-close {
        all: unset;
        cursor: pointer;
        color: #9ca3af;
        font-size: 16px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .cw-close:hover {
        background: rgba(255,255,255,0.1);
        color: #ffffff;
      }
      .cw-body {
        padding: 12px;
        background: #f9fafb;
        display: grid;
        gap: 8px;
      }
      .cw-message {
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.08);
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 13px;
        white-space: pre-wrap;
      }
      .cw-detail {
        font-size: 12px;
        color: #475569;
        white-space: pre-wrap;
      }
      .cw-cta {
        all: unset;
        cursor: pointer;
        text-align: center;
        background: #111827;
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 12px;
        border-radius: 10px;
      }
      .cw-cta[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `;
    const wrapper = document.createElement('div');
    wrapper.className = 'cw-widget';
    wrapper.innerHTML = `
      <div class="cw-header">
        <div class="cw-title">Checkout detected</div>
        <button class="cw-close" aria-label="Close">×</button>
      </div>
      <div class="cw-body">
        <div class="cw-message"></div>
        <div class="cw-detail"></div>
        <button class="cw-cta">Know more</button>
      </div>
    `;
    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    const closeBtn = shadow.querySelector('.cw-close');
    if (closeBtn) closeBtn.addEventListener('click', () => host?.remove());

    const button = shadow.querySelector('.cw-cta');
    if (button) {
      button.addEventListener('click', () => {
        if (!checkoutToken) return;
        chrome.runtime.sendMessage({ type: 'open_dashboard', token: checkoutToken }, () => {});
      });
    }

    overlayState.host = host;
    overlayState.messageNode = shadow.querySelector('.cw-message');
    overlayState.detailNode = shadow.querySelector('.cw-detail');
    overlayState.buttonNode = button;

    return overlayState;
  }

  function renderOverlay({
    message = 'We detected a checkout page.',
    detail = '',
    loading = false,
    error = null,
  }) {
    try {
      const nodes = ensureOverlay();
      if (nodes.messageNode) nodes.messageNode.textContent = message;
      if (nodes.detailNode) nodes.detailNode.textContent = detail;

      if (nodes.buttonNode) {
        nodes.buttonNode.disabled = loading || !checkoutToken || Boolean(error);
        nodes.buttonNode.textContent = loading ? 'Loading…' : 'Know more';
        nodes.buttonNode.style.display = error ? 'none' : 'block';
      }

      if (error && nodes.detailNode) {
        nodes.detailNode.textContent = error;
      }
    } catch (err) {
      console.warn('Failed to render overlay', err);
    }
  }

  const signals = collectDomSignals();
  const domLooksLikeCheckout =
    !urlLooksLikeCheckout &&
    ((signals.textMentions && signals.textMentions.length > 0) ||
      (signals.buttonMentions && signals.buttonMentions.length > 0));

  if (urlLooksLikeCheckout || domLooksLikeCheckout) {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'checkout_detected',
          url: location.href,
          title: document.title,
          signals,
        },
        () => {}
      );
    } catch {}

    checkoutToken = null;
    renderOverlay({ message: 'Detecting checkout offers...', loading: true, detail: '' });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'checkout_result') return;
    const { result } = message;
    if (!result) return;

    if (result.ok && result.data) {
      const summary = result.data.summary || {};
      checkoutToken = result.data.token || summary.token || null;

      const lines = [];
      if (summary.message) lines.push(summary.message);
      const bestCardName = summary.bestCard?.name;
      if (bestCardName) lines.push(`Best card: ${bestCardName}`);
      if (summary.generatedAt) {
        const when = new Date(summary.generatedAt).toLocaleString();
        lines.push(`Generated: ${when}`);
      }

      renderOverlay({
        message: lines[0] || 'Savings recommendation available.',
        detail: lines.slice(1).join('\n') || '',
        loading: false,
      });
    } else if (!result.ok) {
      checkoutToken = null;
      const errorMsg = result?.data?.message || result?.error || 'Failed to fetch recommendation.';
      renderOverlay({
        message: 'Checkout detected, but the request failed.',
        detail: errorMsg,
        loading: false,
        error: errorMsg,
      });
    }
  });
})();
  