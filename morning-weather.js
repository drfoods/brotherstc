/* BROTHERS TC – 공식 기상청 오전 7시 날씨 카드 v20 (강수확률 표시 제거)
   기존 app.js/Firebase/출석 로직은 수정하지 않습니다.
   GitHub Actions가 게시한 weather.json을 15분마다 재확인합니다.
*/
(() => {
  'use strict';
  const DATA_FILE = './weather.json';
  const REFRESH_MS = 15 * 60 * 1000;
  let forecast = {};
  let lastUpdated = '';
  const weatherUrl = 'https://www.weather.go.kr/w/index.do#dong/4148052000/37.7557185972725/126.784778250987/%EA%B2%BD%EA%B8%B0%20%ED%8C%8C%EC%A3%BC%EC%8B%9C%20%EA%B8%88%EB%A6%89%EB%8F%99/SCH/%ED%8C%8C%EC%A3%BC%EC%8A%A4%ED%83%80%EB%94%94%EC%9B%80%20%ED%85%8C%EB%8B%88%EC%8A%A4%EC%9E%A5';

  const css = document.createElement('style');
  css.textContent = `
    .weekly-day .bro-7am {display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
      min-height:55px; margin:2px 0 4px; line-height:1.18; pointer-events:none; width:100%;}
    .weekly-day .bro-7am-emoji {font-size:21px; line-height:1.06;}
    .weekly-day .bro-7am-temp {font-size:12px; font-weight:800; color:inherit; font-variant-numeric:tabular-nums;}
    .weekly-day .bro-7am-missing {font-size:11px; font-weight:600; color:#718174;}
    .weekly-day.selected .bro-7am-missing {color:#c8e6d0;}
    @media(max-width:760px){
      .weekly-day .bro-7am {min-height:49px;margin:2px 0 3px;}
      .weekly-day .bro-7am-emoji {font-size:18px;}
      .weekly-day .bro-7am-temp {font-size:10.5px;}
      .weekly-day .bro-7am-missing {font-size:9px;}
    }
    @media(max-width:380px){.weekly-day .bro-7am-emoji{font-size:16px}.weekly-day .bro-7am-temp{font-size:9px}}
  `;
  document.head.appendChild(css);

  const icons = {clear:'☀️', partly:'🌤️', cloudy:'☁️', rain:'🌧️', snow:'🌨️', sleet:'🌨️', shower:'🌦️', unknown:'🌡️'};

  function paint() {
    document.querySelectorAll('.weekly-day[data-date]').forEach(card => {
      const date = card.getAttribute('data-date');
      const item = forecast[date];
      const fingerprint = JSON.stringify(item || null) + '|' + lastUpdated;
      if (card.dataset.broWxStamp === fingerprint && card.querySelector('.bro-7am')) return;
      card.dataset.broWxStamp = fingerprint;
      const old = card.querySelector('.bro-7am');
      if(old) old.remove();
      const box = document.createElement('span');
      box.className = 'bro-7am';
      if (!item || item.temp === null || item.temp === undefined || !Number.isFinite(Number(item.temp))) {
        const missing = document.createElement('span');
        missing.className = 'bro-7am-missing';
        missing.textContent = '예보 준비중';
        box.appendChild(missing);
        box.title = '기상청 오전 7시 예보가 아직 게시되지 않았습니다.';
      } else {
        const icon = document.createElement('span');
        icon.className = 'bro-7am-emoji';
        icon.textContent = icons[item.icon] || icons.unknown;
        const temp = document.createElement('span');
        temp.className = 'bro-7am-temp';
        const t = Number(item.temp);
        temp.textContent = `${Number.isInteger(t) ? t : t.toFixed(1)}℃`;
        box.append(icon, temp);
        const refTime = item.time || '0700';
        box.title = `파주스타디움 인근 · 기상청 ${refTime.slice(0, 2)}:${refTime.slice(2)} 예보 · ${item.label || ''} · 업데이트 ${lastUpdated || '미확인'}`;
      }
      const anchor = card.querySelector('.day-date');
      if(anchor) anchor.insertAdjacentElement('afterend', box);
      else card.prepend(box);
    });
  }
  async function refresh() {
    try {
      const response = await fetch(`${DATA_FILE}?v=${Date.now()}`, {cache:'no-store'});
      if(!response.ok) throw new Error(`weather.json ${response.status}`);
      const doc = await response.json();
      if (!doc || typeof doc.days !== 'object' || !doc.days) return;
      forecast = doc.days;
      lastUpdated = doc.updatedAt || '';
      paint();
    } catch (e) {
      // 예보를 가져오지 못해도 출석 카드와 앱 기능은 그대로 유지
      paint();
      console.info('[BROTHERS weather] 예보 데이터가 준비되지 않았습니다.', e.message);
    }
  }
  function boot() {
    const app = document.querySelector('#app') || document.body;
    const observer = new MutationObserver(() => paint());
    observer.observe(app, {childList:true, subtree:true});
    paint();
    refresh();
    setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', () => {if(!document.hidden) refresh();});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
