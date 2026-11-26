/* BROTHERS TC HUB v33 - 모바일 PWA 설치 도우미
   독립형 스크립트: 기존 app.js / styles.css / Firebase 설정 변경 없음.
   HTTPS + 정상적인 manifest.webmanifest 가 먼저 적용되어 있어야 합니다.
*/
(() => {
  'use strict';
  const STORE_KEY = 'brotherstc_pwa_install_dismissed_v33';
  const UA = navigator.userAgent || '';
  const isAndroid = /Android/i.test(UA);
  const isIOS = /iPad|iPhone|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isKakao = /KAKAOTALK/i.test(UA);
  const isSamsung = /SamsungBrowser/i.test(UA);
  const isSafari = isIOS && /Safari/i.test(UA) && !/CriOS|FxiOS|EdgiOS|OPiOS|KAKAOTALK/i.test(UA);
  const isMobile = isAndroid || isIOS;
  let pendingInstall = null;
  let installed = false;
  let opened = false;
  let chip, veil, action, info;

  const standalone = () => window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;

  const readDismissed = () => {
    try {
      const value = Number(localStorage.getItem(STORE_KEY) || 0);
      return value > 0 && (Date.now() - value) < 14 * 24 * 60 * 60 * 1000;
    } catch (_) { return false; }
  };
  const rememberDismissed = () => {
    try { localStorage.setItem(STORE_KEY, String(Date.now())); } catch (_) { /* ignored */ }
  };

  // Some Android browsers expose this event only when PWA requirements are satisfied.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pendingInstall = e;
    if (opened) refreshContents();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    pendingInstall = null;
    closeDialog();
    if (chip) chip.remove();
  });

  function refreshContents() {
    if (!action || !info) return;
    if (isKakao) {
      info.innerHTML = '<strong>카카오톡에서는 직접 설치가 제한될 수 있습니다.</strong><span>오른쪽 위 ⋮ 또는 ··· 메뉴에서 <b>다른 브라우저로 열기</b>를 누른 다음 설치해 주세요.</span>';
      action.textContent = '브라우저에서 설치하는 방법';
    } else if (pendingInstall) {
      info.innerHTML = '<strong>브라더스 앱을 홈 화면에 추가하세요.</strong><span>아래 버튼을 누르면 휴대폰의 설치 확인창이 열립니다.</span>';
      action.textContent = 'BRO 앱 설치하기';
    } else if (isIOS) {
      info.innerHTML = isSafari
        ? '<strong>Safari에서 설치하는 방법</strong><span>화면의 공유 아이콘(□↑) → <b>홈 화면에 추가</b> → <b>추가</b>를 선택하세요.</span>'
        : '<strong>아이폰에서 설치하는 방법</strong><span>Safari로 이 페이지를 연 다음 <b>공유 → 홈 화면에 추가</b>를 선택하세요.</span>';
      action.textContent = isSafari ? '설치 방법 확인' : 'Safari에서 여는 방법';
    } else if (isSamsung) {
      info.innerHTML = '<strong>삼성 인터넷에서 설치하는 방법</strong><span>아래쪽 ≡ 메뉴 → <b>현재 페이지 추가 → 홈 화면</b>을 선택하세요. 설치창 지원 시 자동으로 열립니다.</span>';
      action.textContent = '설치 방법 확인';
    } else {
      info.innerHTML = '<strong>홈 화면에서 앱처럼 사용할 수 있습니다.</strong><span>Chrome 오른쪽 위 ⋮ → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 선택하세요.</span>';
      action.textContent = '설치 방법 확인';
    }
  }

  function closeDialog(mark = false) {
    if (mark) rememberDismissed();
    opened = false;
    if (veil) veil.hidden = true;
    if (chip) chip.hidden = standalone() || installed;
  }

  function openDialog() {
    if (!veil || standalone() || installed) return;
    opened = true;
    veil.hidden = false;
    if (chip) chip.hidden = true;
    refreshContents();
  }

  async function mainAction() {
    if (pendingInstall && !isKakao) {
      const currentPrompt = pendingInstall;
      pendingInstall = null;
      // Must be called from the real user click handler.
      try {
        const choice = await currentPrompt.prompt();
        if (choice && choice.outcome === 'accepted') {
          closeDialog(true);
        } else {
          refreshContents();
        }
      } catch (_) {
        refreshContents();
      }
    } else if (isKakao) {
      info.innerHTML = '<strong>카카오톡 메뉴에서 외부 브라우저로 열어주세요.</strong><span>오른쪽 위 <b>⋮ 또는 ···</b> → <b>다른 브라우저로 열기</b><br>갤럭시는 Chrome/삼성 인터넷, 아이폰은 Safari에서 설치하세요.</span>';
    } else if (isIOS) {
      info.innerHTML = '<strong>아이폰에서는 직접 설치 확인창을 띄울 수 없습니다.</strong><span>Safari에서 <b>공유(□↑) → 홈 화면에 추가 → 추가</b>를 누르세요.</span>';
    } else {
      info.innerHTML = '<strong>설치 메뉴를 이용해 주세요.</strong><span>Chrome ⋮ → <b>앱 설치 / 홈 화면에 추가</b><br>삼성 인터넷 ≡ → <b>현재 페이지 추가 → 홈 화면</b></span>';
    }
  }

  function render() {
    if (!isMobile || standalone() || installed || document.getElementById('brtc-pwa-install-root')) return;
    const style = document.createElement('style');
    style.textContent = `
      #brtc-pwa-install-root{font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif}
      #brtc-pwa-chip{position:fixed;right:13px;bottom:calc(105px + env(safe-area-inset-bottom,0px));z-index:2147483000;border:1px solid #a1ba77;border-radius:50px;background:#c9f967;color:#162616;padding:10px 15px;font-size:13px;font-weight:900;box-shadow:0 4px 13px #15291b40;cursor:pointer}
      #brtc-pwa-veil[hidden],#brtc-pwa-chip[hidden]{display:none!important}
      #brtc-pwa-veil{position:fixed;inset:0;z-index:2147483001;background:#07130bbb;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
      #brtc-pwa-dialog{width:min(100%,380px);box-sizing:border-box;padding:22px 19px 19px;background:#fff;border:1px solid #deead5;border-radius:22px;box-shadow:0 20px 60px #0005;color:#152919;position:relative}
      #brtc-pwa-logo{width:70px;height:70px;object-fit:cover;border-radius:17px;background:#07110a;display:block;margin:0 auto 10px}
      #brtc-pwa-dialog h2{font-size:22px;letter-spacing:-.05em;margin:6px 0 12px;text-align:center;line-height:1.3}
      #brtc-pwa-info{display:grid;gap:7px;color:#566455;font-size:14px;line-height:1.6;margin:6px 0 17px;overflow-wrap:break-word}
      #brtc-pwa-info strong{color:#29452c;text-align:center;font-size:15px}
      #brtc-pwa-action{width:100%;padding:14px;border:0;border-radius:13px;background:#c7f95b;color:#132515;font-size:17px;font-weight:900;cursor:pointer}
      #brtc-pwa-close{width:100%;padding:12px;border:0;background:transparent;color:#687368;font-size:14px;cursor:pointer}
      #brtc-pwa-x{position:absolute;top:10px;right:11px;font-size:25px;border:0;background:transparent;color:#7b8979;cursor:pointer;width:36px;height:36px}
      @media(max-width:350px){#brtc-pwa-dialog{padding:18px 14px}#brtc-pwa-dialog h2{font-size:20px}#brtc-pwa-chip{padding:8px 12px;font-size:12px}}
    `;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'brtc-pwa-install-root';
    root.innerHTML = `
      <button type="button" id="brtc-pwa-chip" aria-label="브라더스 앱 설치 안내">📲 앱 설치</button>
      <div id="brtc-pwa-veil" hidden>
        <div id="brtc-pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="brtc-pwa-title">
          <button type="button" id="brtc-pwa-x" aria-label="닫기">×</button>
          <img id="brtc-pwa-logo" src="./bro-favicon-192.png" alt="BRO 로고">
          <h2 id="brtc-pwa-title">브라더스 앱 설치</h2>
          <div id="brtc-pwa-info" aria-live="polite"></div>
          <button type="button" id="brtc-pwa-action">BRO 앱 설치하기</button>
          <button type="button" id="brtc-pwa-close">나중에 하기</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    chip = document.getElementById('brtc-pwa-chip');
    veil = document.getElementById('brtc-pwa-veil');
    action = document.getElementById('brtc-pwa-action');
    info = document.getElementById('brtc-pwa-info');
    chip.addEventListener('click', openDialog);
    action.addEventListener('click', mainAction);
    document.getElementById('brtc-pwa-close').addEventListener('click', () => closeDialog(true));
    document.getElementById('brtc-pwa-x').addEventListener('click', () => closeDialog(true));
    veil.addEventListener('click', (e) => { if (e.target === veil) closeDialog(true); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && opened) closeDialog(true); });
    if (!readDismissed()) {
      // Display custom info, not the browser's native prompt, until the user taps install.
      setTimeout(openDialog, 1100);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once:true });
  else render();
})();
