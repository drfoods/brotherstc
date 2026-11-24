/* BROTHERS_TC_V14_BANK_ACCOUNT_GUIDE_20261124 */
/* BROTHERS_TC_V12_PC_BALANCE_VISIBLE_20261124 */
/* BROTHERS TC CLUB HUB · no-login member attendance, admin-only management */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  // Keep desktop and phone ledger dates mutually exclusive even if styles.css
  // has not been updated. This only affects presentation, never Firestore data.
  const dateStyles = document.createElement('style');
  dateStyles.id = 'brothers-ledger-date-fix';
  dateStyles.textContent = `
    .public-ledger-table .ledger-date-full { display: inline !important; white-space: nowrap; }
    .public-ledger-table .ledger-date-short { display: none !important; }
    @media (max-width: 760px) {
      .public-ledger-table .ledger-date-full { display: none !important; }
      .public-ledger-table .ledger-date-short { display: inline !important; white-space: nowrap; }
    }
  `;
  document.head.appendChild(dateStyles);
  const weatherStyles=document.createElement('style');
  weatherStyles.id='brothers-weather-menu-v13';
  weatherStyles.textContent='\n/* BROTHERS_TC_V13_WEATHER_MENU_20261124 */\n.tc-weather-panel{overflow:hidden;padding:0}\n.tc-weather-intro{background:linear-gradient(115deg,#1a3221,#23442a);color:#fff;padding:24px 28px}\n.tc-weather-kicker{font-size:11px;font-weight:900;letter-spacing:1.7px;color:#bbf06c}\n.tc-weather-intro h2{font-size:clamp(21px,2.7vw,29px);margin:7px 0 5px;letter-spacing:-.8px}\n.tc-weather-intro p{font-size:13px;color:#d9e5d6;margin:0;line-height:1.7}\n.tc-weather-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:22px}\n.tc-weather-card{border:1px solid #e2eadd;background:#fbfdf9;border-radius:18px;padding:22px;display:flex;flex-direction:column;min-width:0}\n.tc-weather-icon{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:#e7f7d0;color:#2a5a29;font-size:27px;margin-bottom:16px}\n.tc-weather-type{font-size:11px;font-weight:850;color:#618557;letter-spacing:.3px}\n.tc-weather-card h3{font-size:23px;letter-spacing:-.7px;margin:5px 0 9px;line-height:1.32}\n.tc-weather-card p{font-size:13px;line-height:1.7;color:#64766a;margin:0 0 23px}\n.tc-weather-open{display:flex;align-items:center;justify-content:center;min-height:48px;padding:10px 12px;border-radius:11px;font-size:15px;font-weight:850;margin-top:auto;text-decoration:none}\n.tc-weather-open:hover{filter:brightness(.95)}\n.tc-weather-open-primary{background:#c5ff54;color:#172919}\n.tc-weather-open-secondary{background:#1c3022;color:#fff}\n.tc-weather-footnote{margin:0 22px 22px;background:#f0f5ec;border-radius:12px;padding:14px 16px;color:#65796a;font-size:12px;line-height:1.8}\n.tc-weather-footnote a{font-weight:800;text-decoration:underline;text-underline-offset:2px;color:#315d32}\n@media (max-width:760px){\n .side .nav{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;align-items:stretch}\n .side .nav-btn{min-width:0;padding:7px 0 4px;gap:2px;font-size:10px;line-height:1.2;white-space:nowrap}\n .side .nav-btn .ni{font-size:18px;line-height:21px}\n .tc-weather-grid{grid-template-columns:1fr;padding:13px;gap:12px}\n .tc-weather-intro{padding:20px 17px}\n .tc-weather-intro h2{font-size:22px}\n .tc-weather-card{padding:18px}\n .tc-weather-card h3{font-size:20px}\n .tc-weather-footnote{margin:0 13px 14px}\n}\n@media (max-width:360px){.side .nav-btn{font-size:9px}.side .nav-btn .ni{font-size:17px}}\n';
  document.head.appendChild(weatherStyles);
  const storage={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const today = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  const monthNow = () => today().slice(0,7);
  const datePlus = n => { const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const dstr=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  function weekDays(offset=state.weekOffset){const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7)+offset*7);return Array.from({length:5},(_,i)=>{const n=new Date(d);n.setDate(n.getDate()+i);return dstr(n);});}
  const weekdayOnly=d=>{const n=new Date(d+'T12:00:00').getDay();return n>=1&&n<=5;};
  const initialDate=()=>weekdayOnly(today())?today():weekDays(0)[0];
  const dayKey=date=>'day_'+date;
  const weekday=['일','월','화','수','목','금','토'];
  function eventOfDay(date){return eventsSorted().find(x=>x.date===date)||null;}
  function answersOfDay(date){const ids=new Set([dayKey(date),...state.events.filter(e=>e.date===date).map(e=>e.id)]);const result=new Map();for(const item of state.attendance){if(ids.has(item.eventId)&&memberById(item.memberId)?.active!==false){if(!result.has(item.memberId)||item.eventId===dayKey(date))result.set(item.memberId,item);}}return [...result.values()];}
  function responseOf(date,memberId){return answersOfDay(date).find(a=>a.memberId===memberId)?.status||'';}
  function responseMembers(date,status){return answersOfDay(date).filter(a=>a.status===status).map(a=>memberById(a.memberId)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ko'));}
  function countFor(date,status='yes'){return responseMembers(date,status).length;}
  function weekLabel(days){const a=days[0].split('-');const b=days[days.length-1].split('-');return a[1]+'/'+Number(a[2])+' ~ '+b[1]+'/'+Number(b[2]);}
  const fmtMoney = n => Number(n||0).toLocaleString('ko-KR')+'원';
  const fmtDay = s => { if(!s) return ''; const a=String(s).slice(0,10).split('-').map(Number); const d=new Date(a[0],a[1]-1,a[2]);return `${a[1]}.${String(a[2]).padStart(2,'0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;};
  const uid=()=> 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const CLUB_BANK = { bank: '카카오뱅크', number: '79420935851', holder: '문정준' };
  const CHANNEL_URL = 'https://www.youtube.com/@BROTHERSTC';
  const KMA_WEATHER_URL = 'https://www.weather.go.kr/w/index.do#dong/4148052000/37.7557185972725/126.784778250987/%EA%B2%BD%EA%B8%B0%20%ED%8C%8C%EC%A3%BC%EC%8B%9C%20%EA%B8%88%EB%A6%89%EB%8F%99/SCH/%ED%8C%8C%EC%A3%BC%EC%8A%A4%ED%83%80%EB%94%94%EC%9B%80%20%ED%85%8C%EB%8B%88%EC%8A%A4%EC%9E%A5';
  const BONGIL_CCTV_URL = 'https://trafficcctv.paju.go.kr:443/live/cctv_75.stream/playlist.m3u8';
  const PAJU_CCTV_PORTAL = 'https://traffic.paju.go.kr/traffic2.view';
  const DEFAULTS = { intro:'테니스로 연결되는 우리, 함께 치고 함께 웃는 BROTHERS TC.', motto:'Together on court. Brothers for life.', location:'운영진에게 문의', schedule:'정기모임 일정은 출석 게시판에서 확인하세요.', youtube:CHANNEL_URL, instagram:'', contact:'운영진에게 문의', monthlyFee:20000, rules:'서로 배려하고 응원하며 즐겁게 운동합니다.\n모임 참석 여부는 가능한 한 미리 등록해 주세요.\n코트 시설과 클럽 장비를 소중히 사용해 주세요.' };
  const navItems = [ ['attendance','✓','출석'],['fees','₩','회비'],['members','♧','회원'],['notices','▤','공지'],['weather','☀','날씨'],['channel','▶','채널'] ];
  const state={page:'home', mode:'demo', ready:false, admin:false, loading:false, members:[],dues:[],events:[],attendance:[],notices:[],payments:[],transactions:[],meta:{...DEFAULTS},publicFinance:{},publicLedger:[],publicMemberPayments:{},publicBalance:null,month:monthNow(),selectedEvent:'',selectedMember:storage.get('brotherstc_selected_member')||'',search:'',weekOffset:0,selectedDate:initialDate(),firebase:null,user:null,unsubs:[],adminUnsubs:[]};
  const DEMO_KEY='brothersTC_demo_v8_publicledger';
  // Initial club setup: eight member names supplied by the club. Financial rows are only
  // those identifiable in the uploaded bank screenshot. Items missing a date are not booked.
  const STARTER_NAMES=[
    ['왕윤호','회장','wang_yunho'],['박종인','회원','park_jongin'],['문정준','회원','moon_jeongjun'],
    ['이형석','회원','lee_hyeongseok'],['오윤민','회원','oh_yunmin'],['윤재용','회원','yoon_jaeyong'],
    ['이제윤','회원','lee_jaeyun'],['임정훈','회원','lim_jeonghun']
  ];
  // Financial seed is intentionally NEVER shipped in public site JavaScript.
  // Local standalone preview can optionally inject test-only receipt data.
  function seed(){
    const members=STARTER_NAMES.map(([name,role,code],i)=>({id:'member_'+code,name,role,sortOrder:i+1,active:true,createdAt:'2026-11-18'}));
    const memberId=code=>'member_'+code;
    const dues=members.map(m=>({id:m.id,monthlyFee:20000}));
    const payments=(window.BROTHERS_DEMO_RECEIPTS||[]).map(([code,month,paidAt,paidTime,memo])=>({id:month+'_'+memberId(code),month,memberId:memberId(code),amount:20000,paidAt,paidTime,memo}));
    const transactions=(window.BROTHERS_DEMO_MISC||[]).map(t=>({...t}));
    const notices=[{id:'opening_notice',title:'브라더스 테니스 클럽 허브 오픈',body:'안녕하세요~ 브라더스 테니스 클럽 허브가 오픈했습니다.',pinned:true,createdAt:'2026-11-18'}];
    // No fictitious attendance, spending, or dates: members fill these in as they use the site.
    return {members,dues,events:[],notices,attendance:[],payments,transactions,meta:{...DEFAULTS,monthlyFee:20000},publicFinance:{}};
  }
  function loadDemo(){try{const x=JSON.parse(storage.get(DEMO_KEY)||'null'); if(x&&Array.isArray(x.members)) return x;}catch(e){}return seed();}
  function demoSave(){ storage.set(DEMO_KEY,JSON.stringify({members:state.members,dues:state.dues,events:state.events,notices:state.notices,attendance:state.attendance,payments:state.payments,transactions:state.transactions,meta:state.meta,publicFinance:state.publicFinance})); }
  function applyDemo(){Object.assign(state,loadDemo());state.mode='demo';state.ready=true; if(!state.selectedEvent) selectDefaultEvent(); render();}
  function selectDefaultEvent(){const ev=[...state.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));state.selectedEvent=(ev.find(e=>e.date>=today())||ev[0]||{}).id||'';}
  const activeMembers=()=>state.members.filter(m=>m.active!==false).sort((a,b)=>(Number(a.sortOrder)||999)-(Number(b.sortOrder)||999)||a.name.localeCompare(b.name,'ko'));
  const eventsSorted=()=>[...state.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const eventById=id=>state.events.find(e=>e.id===id);
  const memberById=id=>state.members.find(m=>m.id===id);
  const reply=(eid,mid)=>state.attendance.find(a=>a.eventId===eid&&a.memberId===mid)?.status||'';
  const countReplies=(eid,st)=>state.attendance.filter(a=>a.eventId===eid&&a.status===st && memberById(a.memberId)?.active!==false).length;
  function settings(){return {...DEFAULTS,...state.meta,youtube:CHANNEL_URL};}
  function feeFor(id){const o=state.dues.find(x=>x.id===id);return o?Math.max(0,Number(o.monthlyFee)||0):Math.max(0,Number(settings().monthlyFee)||0);}
  function summaryFor(month){
    if(!state.admin&&state.mode==='cloud') return state.publicFinance[month]||{due:0,paid:0,paidMembers:0,members:activeMembers().length,expense:0,income:0};
    const members=activeMembers();const relevant=state.payments.filter(p=>p.month===month);const due=members.reduce((s,m)=>s+feeFor(m.id),0);
    const paid=relevant.reduce((s,p)=>s+Number(p.amount||0),0);
    const paidMembers=members.filter(m=>Number(relevant.find(p=>p.memberId===m.id)?.amount||0)>=feeFor(m.id)).length;
    const ts=state.transactions.filter(t=>String(t.date).slice(0,7)===month);
    return {due,paid,paidMembers,members:members.length,expense:ts.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount||0),0),income:ts.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount||0),0)};
  }
  async function startFirebase(){
    const cfg=window.BROTHERS_CONFIG?.firebase;
    if(!cfg?.apiKey||!cfg?.projectId){applyDemo();return;}
    try{
      const [appMod,fs,auth]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')]);
      const app=appMod.initializeApp(cfg);const db=fs.getFirestore(app); const authentication=auth.getAuth(app);
      state.firebase={fs,auth,db,authentication};state.mode='cloud';state.ready=true;
      const watch=(coll,key)=>fs.onSnapshot(fs.collection(db,coll),snap=>{state[key]=snap.docs.map(d=>({id:d.id,...d.data()}));if(!state.selectedEvent)selectDefaultEvent();render();},e=>{console.error(coll,e);toast('자료를 불러오지 못했습니다. Firebase 보안 규칙을 확인해 주세요.');});
      ['members','events','attendance','notices'].forEach(k=>state.unsubs.push(watch(k,k)));
      state.unsubs.push(fs.onSnapshot(fs.doc(db,'meta','settings'),snap=>{state.meta={...DEFAULTS,...(snap.data()||{})};render();},console.error));
      state.unsubs.push(fs.onSnapshot(fs.doc(db,'meta','finance'),snap=>{state.publicFinance=snap.data()?.months||{};state.publicLedger=snap.data()?.ledger||[];state.publicMemberPayments=snap.data()?.memberPayments||{};state.publicBalance=snap.data()?.balance||null;render();},console.error));
      auth.onAuthStateChanged(authentication,user=>{
        state.user=user;const allowedAdmins=(window.BROTHERS_CONFIG?.adminEmails?.length?window.BROTHERS_CONFIG.adminEmails:[window.BROTHERS_CONFIG?.adminEmail||'']).map(x=>String(x).trim().toLowerCase());const valid=!!user&&!!user.email&&allowedAdmins.includes(user.email.toLowerCase())&&user.emailVerified;
        state.admin=valid;
        state.adminUnsubs.forEach(u=>u());state.adminUnsubs=[];
        if(valid){['dues','payments','transactions'].forEach(k=>state.adminUnsubs.push(watch(k,k)));}
        else{state.dues=[];state.payments=[];state.transactions=[];}
        render();
      });
      render();
    }catch(e){ console.error(e); applyDemo();toast('클라우드 연결 실패: 데모 모드로 전환했습니다. 설정을 확인해 주세요.'); }
  }
  async function put(coll,data){
    if(state.mode==='demo'){
      const k=coll; const i=state[k].findIndex(x=>x.id===data.id);if(i<0)state[k].push(data);else state[k][i]={...state[k][i],...data};demoSave();render();return;
    }
    const {fs,db}=state.firebase;
    // Optimistic local state keeps finance aggregates correct immediately after editing.
    const pos=state[coll].findIndex(x=>x.id===data.id);
    if(pos<0)state[coll].push(data);else state[coll][pos]={...state[coll][pos],...data};
    render();
    const record={...data};delete record.id;
    if(coll==='attendance')record.updatedAt=fs.serverTimestamp();
    await fs.setDoc(fs.doc(db,coll,data.id),record,{merge:true});
  }
  async function remove(coll,id){
    if(state.mode==='demo'){state[coll]=state[coll].filter(x=>x.id!==id);demoSave();render();return;}
    const {fs,db}=state.firebase;state[coll]=state[coll].filter(x=>x.id!==id);render();await fs.deleteDoc(fs.doc(db,coll,id));
  }
  async function saveSettings(next){
    if(state.mode==='demo'){state.meta={...state.meta,...next};demoSave();render();return;}
    const {fs,db}=state.firebase;state.meta={...state.meta,...next};render();await fs.setDoc(fs.doc(db,'meta','settings'),next,{merge:true});
  }
  // Rebuild the public summary from the authoritative private records.
  // One admin action refreshes public ledger even for historical payments already saved.
  async function syncSummary(){
    if(state.mode==='demo'){demoSave();render();return;}
    if(!state.admin)return;
    const {fs,db}=state.firebase;
    for(const coll of ['members','dues','payments','transactions']){
      const snap=await fs.getDocs(fs.collection(db,coll));
      state[coll]=snap.docs.map(d=>({id:d.id,...d.data()}));
    }
    const months=new Set([monthNow(),...state.payments.map(p=>p.month),...state.transactions.map(t=>String(t.date).slice(0,7))]);
    const monthly={};const memberPayments={};
    for(const mo of months){
      if(!/^\d{4}-\d{2}$/.test(mo))continue;
      monthly[mo]=summaryFor(mo);
      memberPayments[mo]=activeMembers().map(m=>{
        const p=state.payments.find(x=>x.month===mo&&x.memberId===m.id);
        return {memberId:m.id,name:m.name,due:feeFor(m.id),paid:Number(p?.amount||0)};
      });
    }
    const entries=fullLedgerEntries();
    const ledger=entries.slice(0,300).map(t=>({date:t.date,type:t.type,amount:t.amount,category:String(t.category||'운영비').slice(0,90)}));
    const balance=balanceFromEntries(entries);
    await fs.setDoc(fs.doc(db,'meta','finance'),{months:monthly,ledger,memberPayments,balance,updatedAt:fs.serverTimestamp()});
    state.publicFinance=monthly;state.publicLedger=ledger;state.publicMemberPayments=memberPayments;state.publicBalance=balance;
    render();
  }
  function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('visible'),3000);}
  function closeModal(){const r=$('#modalRoot');if(r)r.innerHTML='';}
  function modal(title,body,onSubmit,sub=''){const r=$('#modalRoot');r.innerHTML=`<div class="modal-shade" data-close-shade="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${sub?`<div class="sub">${esc(sub)}</div>`:''}<form id="modalForm">${body}<div class="modal-actions"><button type="button" class="btn" data-close-modal="1">취소</button><button type="submit" class="btn btn-primary">저장하기</button></div></form></div></div>`;$('#modalForm').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter||$('#modalForm [type="submit"]');if(b)b.disabled=true;try{await onSubmit(new FormData(e.currentTarget));closeModal();toast('저장했습니다.');}catch(err){toast('저장 실패: '+(err.message||err));if(b)b.disabled=false;}});}
  function field(label,name,value='',type='text',extra=''){return `<div class="field"><label for="f_${name}">${label}</label><input class="input" id="f_${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;}
  function textarea(label,name,value='',extra=''){return `<div class="field"><label for="f_${name}">${label}</label><textarea class="input" id="f_${name}" name="${name}" ${extra}>${esc(value)}</textarea></div>`;}
  function pickOptions(arr,selected='',textFn=x=>x.name){return arr.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(textFn(x))}</option>`).join('');}
  function header(){const demo=state.mode==='demo';return `<div class="app-shell"><header class="site-top"><a href="#home" class="brand brand-header" data-page="home" aria-label="브라더스 테니스클럽 홈"><img class="brand-ball" src="brand-ball.png" alt="BROTHERS TC 심볼"><div class="brand-copy"><strong>BROTHERS TENNIS CLUB</strong><span>브라더스테니스클럽 HUB</span></div></a><div class="top-right"><span class="mode-flag">${demo?'샘플 화면':'● 실시간 공유'}</span>${state.admin?`<button class="account" data-page="admin">⚙ 관리자 페이지</button><button class="account account-ghost" data-action="admin-logout">로그아웃</button>`:`<button class="account" data-action="admin-login">⚙ 운영진 로그인</button>`}</div></header><div class="layout"><aside class="side"><div class="side-panel"><div class="side-label">BROTHERS TENNIS CLUB HUB</div><nav class="nav">${navItems.map(([id,ico,label])=>id==='channel'?`<a class="nav-btn" href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer" aria-label="브라더스 유튜브 채널 새 창 열기"><span class="ni">${ico}</span>${label} ↗</a>`:`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}" aria-current="${state.page===id?'page':'false'}"><span class="ni">${ico}</span>${label}</button>`).join('')}</nav><div class="side-bottom"><strong>PLAY TOGETHER</strong><p>함께 치고, 함께 웃고,<br>우리는 브라더스.</p>${state.admin?`<button class="btn btn-primary btn-small side-admin-btn" data-page="admin">관리자 바로가기</button>`:''}</div></div></aside><main class="main">`;}
  function footer(){return `</main></div><footer class="footer"><span>© ${new Date().getFullYear()} BROTHERS TENNIS CLUB</span><span>PLAY TOGETHER. STAY BROTHERS.</span></footer></div>`;}
  function pageTitle(eyebrow,title,subtitle='',tools=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${tools?`<div class="toolbar">${tools}</div>`:''}</div>`;}
  function weeklyBoard(compact=false){
    const days=weekDays();
    // Switching weeks or landing on a weekend must never select a non-visible day.
    if(!days.includes(state.selectedDate))state.selectedDate=days[0];
    const d=state.selectedDate;
    const yes=responseMembers(d,'yes');
    const maybe=responseMembers(d,'maybe');
    const no=responseMembers(d,'no');
    const ev=eventOfDay(d);
    const dayName=weekday[new Date(d+'T12:00:00').getDay()];
    return `<section class="weekly-board panel ${compact?'on-attendance':''}" aria-label="평일 참석 현황">
      <div class="week-head"><div><div class="eyebrow">BROTHERS WEEKLY ATTENDANCE</div><h1>🎾 이번 주 참석 현황</h1><p>월요일부터 금요일까지 한눈에 확인하세요. 요일을 누르면 아래에 참석자 명단이 표시됩니다.</p></div>
        <div class="week-ctrl"><button class="week-arrow" data-week="prev" aria-label="이전 주">‹</button><strong>${weekLabel(days)}</strong><button class="week-arrow" data-week="next" aria-label="다음 주">›</button><button class="week-today" data-week="today">이번 주</button></div>
      </div>
      <div class="weekly-scroll"><div class="weekly-grid">
       ${days.map(date=>{const count=countFor(date);const isSelected=date===d;const isToday=date===today();return `<button type="button" class="weekly-day ${isSelected?'selected':''} ${isToday?'today':''} ${count?'has-people':''}" data-date="${date}" aria-pressed="${isSelected}" aria-label="${fmtDay(date)}, 참석 ${count}명, 명단 보기"><span class="weekday">${weekday[new Date(date+'T12:00:00').getDay()]}</span><span class="day-date">${Number(date.slice(8))}<small>일</small></span><span class="day-count">${count}<small>명 참석</small></span>${isToday?'<span class="today-dot">오늘</span>':''}</button>`;}).join('')}
      </div></div>
      <div class="weekday-detail" aria-live="polite" aria-label="선택한 요일 참석자 명단">
        <div class="weekday-detail-head"><div><span class="detail-eyebrow">${dayName}요일 · ${fmtDay(d)}</span><h2>참석 회원 <strong>${yes.length}명</strong></h2></div><div class="detail-side"><span>미정 ${maybe.length}명 · 불참 ${no.length}명</span>${ev?`<small>${esc(ev.time||'')} ${esc(ev.title||'')}</small>`:''}</div></div>
        <div class="weekday-names">${yes.length?yes.map(m=>`<span class="weekday-name">✓ ${esc(m.name)}</span>`).join(''):'<span class="weekday-empty">아직 참석을 등록한 회원이 없습니다.</span>'}</div>
        <div class="weekday-detail-foot"><span>본인 이름을 찾아 참석 여부를 등록하거나 변경할 수 있습니다.</span><button type="button" class="btn btn-dark btn-small" data-page="attendance">내 이름 찾아 참석 체크 ›</button></div>
      </div>
    </section>`;
  }

  // Publish only a member name, designated fee month, deposit date and amount.
  // Bank identifiers, source statement details and internal memos are NEVER included.
  function feeTitle(p){
    const name=memberById(p.memberId)?.name||'회원 확인 필요';
    const [year,month]=String(p.month||'').split('-');
    const monthLabel=Number(month)?Number(month)+'월':'귀속월 미확인';
    const yearLabel=year&&String(p.paidAt||'').slice(0,4)!==year?year+'년 ':'';
    const advance=String(p.paidAt||'').slice(0,7)<String(p.month||'')?' (선납)':'';
    return `${name} ${yearLabel}${monthLabel} 회비${advance}`;
  }
  function fullLedgerEntries(){
    const costs=state.transactions.map(t=>({id:t.id,date:String(t.date||'').slice(0,10),type:t.type,amount:Number(t.amount||0),category:t.category||'운영비',kind:'transaction'}));
    const memberDues=state.payments.filter(p=>p.paidAt&&Number(p.amount)>0).map(p=>({id:p.id,date:String(p.paidAt).slice(0,10),type:'income',amount:Number(p.amount||0),category:feeTitle(p),kind:'payment'}));
    return [...costs,...memberDues].sort((a,b)=>b.date.localeCompare(a.date));
  }
  // Balance is calculated from ALL saved fee payments and miscellaneous transactions.
  // Do not total only the last 300 public rows, or only the selected month.
  function balanceFromEntries(entries){
    const valid=entries.filter(t=>/^\d{4}-\d{2}-\d{2}$/.test(t.date||'')&&t.date<=today()&&Number.isFinite(Number(t.amount))&&Number(t.amount)>=0);
    const income=valid.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
    const expense=valid.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
    return {amount:income-expense,income,expense,entries:valid.length,asOf:today()};
  }
  function balanceDisplay(){
    if(state.mode==='demo')return balanceFromEntries(fullLedgerEntries());
    const b=state.publicBalance;
    if(!b||!Number.isFinite(Number(b.amount)))return null;
    return {amount:Number(b.amount),income:Number(b.income||0),expense:Number(b.expense||0),entries:Number(b.entries||0),asOf:String(b.asOf||'')};
  }
  function balanceHero(){
    const b=balanceDisplay();
    return `<section class="tc-balance-hero" aria-label="클럽 장부상 현재 잔액">
      <div class="tc-balance-main"><div class="tc-balance-title"><span class="tc-balance-dot">●</span> 클럽 현재 잔액</div>
      ${b?`<div class="tc-balance-number">${Number(b.amount).toLocaleString('ko-KR')}<small>원</small></div>`:`<div class="tc-balance-unset">잔액 확인 준비 중</div>`}
      <p class="tc-balance-caption">${b?`운영진 입력 장부 기준 · ${esc(b.asOf||'현재')}까지`:'운영진이 「공개 장부 갱신」을 누르면 잔액이 표시됩니다.'} · 은행 자동 조회 아님</p></div>
      <div class="tc-balance-side">
      ${b?`<div class="tc-balance-stat"><span>누적 입금</span><b>+${fmtMoney(b.income)}</b></div><div class="tc-balance-stat"><span>누적 출금</span><b>−${fmtMoney(b.expense)}</b></div>`:'<div class="tc-balance-stat">이월잔액과 모든 입출금 기록을 기준으로 계산합니다.</div>'}
      ${state.admin?`<button type="button" class="tc-balance-adjust" data-action="balance-reconcile">↻ 실제 통장 잔액에 맞추기</button>`:''}
      </div>
    </section>`;
  }
  function publicLedger(month){
    if(state.mode==='cloud'&&!state.admin)return state.publicLedger.filter(t=>String(t.date).startsWith(month));
    return fullLedgerEntries().filter(t=>t.date.startsWith(month));
  }
  function ledgerTable(month,limit=0,admin=false){let rows=publicLedger(month);if(limit)rows=rows.slice(0,limit);return `<div class="table-wrap"><table class="data-table public-ledger-table"><thead><tr><th>날짜</th><th>구분</th><th>내용</th><th style="text-align:right">금액</th>${admin?'<th>관리</th>':''}</tr></thead><tbody>${rows.map(t=>`<tr><td><span class="ledger-date-full">${esc(t.date)}</span><span class="ledger-date-short">${esc(t.date.slice(5).replace('-','/'))}</span></td><td><span class="tag ${t.type==='income'?'yes':'no'}">${t.type==='income'?'입금':'출금'}</span></td><td>${esc(t.category||'운영비')}</td><td style="text-align:right;font-weight:800">${t.type==='expense'?'-':'+'}${fmtMoney(t.amount)}</td>${admin?`<td><button class="btn btn-small btn-red" data-action="remove-transaction" data-id="${esc(t.id)}">삭제</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${admin?5:4}" class="empty-table">해당 월에 등록된 기타 입출금 내역이 없습니다.</td></tr>`}</tbody></table></div>`;}
  function home(){const month=monthNow();const s=summaryFor(month);const youtube=CHANNEL_URL;return `${weeklyBoard()}<div class="home-quick"><button class="quick-card" data-page="fees"><span class="quick-ico">₩</span><span><b>회비 입출금</b><small>${balanceDisplay()?`현재 잔액 ${fmtMoney(balanceDisplay().amount)}`:`이번 달 회비 ${fmtMoney(s.paid)}`}</small></span><em>›</em></button><button class="quick-card" data-page="members"><span class="quick-ico">♧</span><span><b>회원명부</b><small>등록 회원 ${activeMembers().length}명</small></span><em>›</em></button><button class="quick-card" data-page="notices"><span class="quick-ico">▤</span><span><b>공지사항</b><small>운영진 공지 확인</small></span><em>›</em></button></div><div class="home-panels"><section class="panel"><div class="panel-head"><h3>💰 회비 입출금 내역</h3><button class="text-link" data-page="fees">전체 내역 ›</button></div><div class="finance-overview"><div><span>이번 달 귀속 회비</span><b>${fmtMoney(s.paid)}</b></div><div><span>기타 입금</span><b>${fmtMoney(s.income)}</b></div><div><span>운영비 지출</span><b>${fmtMoney(s.expense)}</b></div></div>${ledgerTable(month,4)}</section><section class="panel"><div class="panel-head"><h3>📢 공지사항</h3><button class="text-link" data-page="notices">전체 공지 ›</button></div>${recentNotices(3)}<div class="home-members"><strong>👥 클럽 회원 ${activeMembers().length}명</strong><p>${activeMembers().slice(0,10).map(x=>esc(x.name)).join(' · ')}</p><button class="text-link" data-page="members">회원 명부 보기 ›</button></div></section></div><div class="youtube-band"><div class="play-circle">▶</div><div><strong>BROTHERS TC YouTube</strong><p>브라더스의 경기 영상과 하이라이트를 만나보세요.</p></div>${youtube?`<a href="${esc(youtube)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">채널 바로가기 ↗</a>`:'<span class="muted small">운영진 채널 등록 예정</span>'}</div>${state.mode==='demo'?'<div class="demo-caption">시연 화면입니다. 이 브라우저에서만 내용이 저장됩니다. 실제 클럽 공동 운영은 Firebase 연결 후 가능합니다. <button class="text-link" data-action="how-connect">설치 안내</button></div>':''}`;}
  function recentNotices(n){const arr=[...state.notices].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,n);return arr.length?arr.map(x=>`<div class="notice-item"><div class="notice-title">${x.pinned?'<span class="pin">중요</span>':''}${esc(x.title)}</div><p>${esc(x.body).slice(0,200)}</p><time>${esc(String(x.createdAt||'').slice(0,10))}</time></div>`).join(''):'<div class="empty"><b>등록된 공지가 없습니다</b>운영진이 공지사항을 등록해 주세요.</div>';}
  function attendance(){const d=state.selectedDate;const ev=eventOfDay(d);const yes=responseMembers(d,'yes');const maybe=responseMembers(d,'maybe');const no=responseMembers(d,'no');const cap=Number(ev?.capacity)||0;const filtered=activeMembers().filter(m=>m.name.includes(state.search.trim()));return `${pageTitle('ATTENDANCE · NO LOGIN','날짜별 참석 체크','① 날짜 선택 → ② 본인 이름 터치 → ③ 참석 여부 누르기',state.admin?'<button class="btn btn-dark" data-action="edit-event">+ 모임 일정 등록</button>':'')} ${weeklyBoard(true)}<section class="panel"><div class="panel-head"><h3>내 이름을 선택하세요</h3><span class="tag yes">회원 로그인 없음</span></div><div class="search-wrap"><input class="input" id="member-search" placeholder="🔎  이름 검색" aria-label="회원 이름 검색" value="${esc(state.search)}" autocomplete="off"></div><div class="member-pick-grid" id="member-pick-grid">${filtered.map(m=>{const st=responseOf(d,m.id);return `<button class="member-pick ${st?'pick-'+st:''}" data-member-choose="${esc(m.id)}"><span class="pick-name">${esc(m.name)}</span><span class="pick-status">${st==='yes'?'✓ 참석':st==='maybe'?'? 미정':st==='no'?'× 불참':'선택하기'}</span></button>`;}).join('')||'<div class="empty">검색된 회원이 없습니다.</div>'}</div><p class="muted small" style="margin:15px 0 0">이름을 선택하면 참석·미정·불참을 바로 등록하거나 변경할 수 있습니다. 본인 이름만 선택해 주세요.</p></section><div class="response-panels"><section class="panel"><div class="panel-head"><h3>✅ 참석 ${yes.length}명</h3></div><div class="roster">${yes.length?yes.map(m=>`<span class="member-chip">${esc(m.name)}</span>`).join(''):'<div class="muted small">등록된 참석자가 없습니다.</div>'}</div></section><section class="panel"><div class="panel-head"><h3>🟡 미정 ${maybe.length}명 · 불참 ${no.length}명</h3></div><div class="roster">${maybe.map(m=>`<span class="member-chip maybe">${esc(m.name)} (미정)</span>`).join('')}${no.map(m=>`<span class="member-chip no">${esc(m.name)} (불참)</span>`).join('')||'<div class="muted small">등록된 응답이 없습니다.</div>'}</div></section></div>${state.admin&&ev?`<div class="toolbar" style="margin-top:12px"><button class="btn btn-small" data-action="edit-event" data-id="${esc(ev.id)}">✎ 일정 수정</button><button class="btn btn-small btn-red" data-action="remove-event" data-id="${esc(ev.id)}">일정 삭제</button></div>`:''}`;}
  function chooseMember(mid){const m=memberById(mid);if(!m)return;state.selectedMember=mid;storage.set('brotherstc_selected_member',mid);const st=responseOf(state.selectedDate,mid);const r=$('#modalRoot');r.innerHTML=`<div class="modal-shade" data-close-shade="1"><div class="modal rsvp-modal" role="dialog" aria-modal="true" aria-label="참석 체크"><div class="eyebrow">${fmtDay(state.selectedDate)}</div><h3>${esc(m.name)}님 참석 여부</h3><p class="sub">${st?'현재 응답을 변경할 수 있습니다.':'오늘의 참석 여부를 선택하세요.'}</p><div class="rsvp-choices">${[['yes','✓ 참석'],['maybe','? 미정'],['no','✕ 불참']].map(([status,label])=>`<button class="rsvp ${status} ${status===st?'selected':''}" data-rsvp-choice="${status}">${label}</button>`).join('')}</div><div class="modal-actions"><button class="btn" data-close-modal="1">취소</button></div></div></div>`;}
  function monthControl(){return `<input class="month-select" id="monthPicker" type="month" value="${esc(state.month)}" aria-label="회비 조회 월">`;}
  function publicPaymentTable(month){
    const rows=state.mode==='cloud'&&!state.admin
      ?state.publicMemberPayments[month]
      :activeMembers().map(m=>({memberId:m.id,name:m.name,due:feeFor(m.id),paid:Number(state.payments.find(p=>p.month===month&&p.memberId===m.id)?.amount||0)}));
    if(!rows)return `<div class="hint">공개 회비 현황이 아직 게시되지 않았습니다. 운영진이 관리자 페이지에서 <b>공개 장부 갱신</b>을 눌러주면 표시됩니다.</div>`;
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>회원</th><th style="text-align:right">월 회비</th><th style="text-align:right">납부액</th><th>상태</th></tr></thead><tbody>${rows.map(m=>{const amt=Number(m.paid||0),due=Number(m.due||0);const status=due===0?'면제':amt>=due?'완납':amt>0?'일부납부':'미납';return `<tr><td><strong>${esc(m.name)}</strong></td><td style="text-align:right">${fmtMoney(due)}</td><td style="text-align:right">${fmtMoney(amt)}</td><td><span class="tag ${status==='완납'?'paid':status==='미납'?'unpaid':''}">${status}</span></td></tr>`;}).join('')||'<tr><td colspan="4" class="empty-table">등록된 회원이 없습니다.</td></tr>'}</tbody></table></div>`;
  }
  function bankAccountNotice(){return `<section class="tc-bank-account-v14" aria-label="클럽 회비 입금 계좌 안내"><div class="tc-bank-info-v14"><div class="tc-bank-kicker-v14">💳 회비 입금 계좌</div><div class="tc-bank-line-v14"><span class="tc-bank-name-v14">${esc(CLUB_BANK.bank)}</span><strong class="tc-bank-number-v14">${esc(CLUB_BANK.number)}</strong></div><div class="tc-bank-holder-v14">예금주 <b>${esc(CLUB_BANK.holder)}</b></div></div><button type="button" class="tc-bank-copy-v14" data-action="copy-club-bank" aria-label="회비 입금 계좌번호 복사">계좌번호 복사 ⧉</button></section>`;}
  function fees(){const s=summaryFor(state.month);const pct=s.due?Math.min(100,Math.round(s.paid/s.due*100)):0;const month=state.month;const all=activeMembers();const pm=state.payments.filter(x=>x.month===month);return `${pageTitle('CLUB ACCOUNTING','회비 및 운영 현황','회비 입금자·귀속월과 클럽 운영 입출금 내역을 모두에게 공개합니다.',monthControl())}<div class="tc-balance-feature-v12" data-feature="pc-mobile-balance-v12">${balanceHero()}</div>${bankAccountNotice()}<div class="kpi-row"><div class="kpi"><span>${esc(month)} 납부 완료</span><b>${s.paidMembers}<small style="font-size:12px;color:#889"> / ${s.members}명</small></b></div><div class="kpi"><span>선택 월 회비 납부액</span><b>${fmtMoney(s.paid)}</b></div><div class="kpi"><span>회비 수납률 (금액)</span><b>${pct}%</b></div></div><section class="panel"><div class="panel-head"><h3>이번 달 회비 집계</h3><span class="tag">운영진이 입력한 자료 기준</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;gap:8px;margin-top:12px" class="muted small"><span>수납 ${fmtMoney(s.paid)}</span><span>예상 ${fmtMoney(s.due)}</span></div><div class="hint">입금일 기준 장부에는 회원 이름과 회비 귀속월을 표시합니다. 월별 납부액은 귀속월 기준이므로 선납분은 입금일과 귀속월이 다를 수 있습니다. 현재 잔액은 입력된 누적 입금(이월잔액 포함)에서 지출을 뺀 장부 계산액입니다. 실제 통장 잔액과 정기적으로 대조해 주세요.</div></section>
    <div class="section-head"><div><h2>공개 입출금 장부</h2><p>누가 몇 월 회비를 납부했는지 입금일과 금액을 함께 공개합니다.</p></div></div><section class="panel">${ledgerTable(month)}</section>
    <div class="section-head"><div><h2>${esc(month)} 회원별 회비 납부 현황</h2><p>전체 회원이 이름별 납부액과 상태를 확인할 수 있습니다.</p></div></div>
    <section class="panel">${publicPaymentTable(month)}<div class="hint" style="margin-top:14px">개인별 회비 정보는 클럽 회원뿐 아니라 이 홈페이지 주소를 아는 누구나 열람할 수 있습니다. 계좌번호·연락처·은행 거래메모는 공개하지 않습니다.</div></section>
    ${state.admin?`<div class="section-head"><div><h2>회원별 납부 관리</h2><p>조회는 전체 공개 · 등록과 수정은 운영진 전용입니다.</p></div><div class="toolbar"><button class="btn btn-small" data-action="refresh-finance">↻ 공개 장부 갱신</button><button class="btn btn-small" data-action="edit-settings">⚙ 기본 설정</button><button class="btn btn-dark" data-action="add-transaction">+ 수입·지출 등록</button></div></div><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>회원</th><th>월 회비</th><th>납부액</th><th>상태</th><th>관리</th></tr></thead><tbody>${all.map(m=>{const p=pm.find(x=>x.memberId===m.id);const amount=Number(p?.amount||0);return `<tr><td><strong>${esc(m.name)}</strong></td><td>${fmtMoney(feeFor(m.id))}</td><td>${fmtMoney(amount)}</td><td><span class="tag ${amount>=feeFor(m.id)?'paid':'unpaid'}">${amount>=feeFor(m.id)?'완납':'미납/일부'}</span></td><td><div class="action-row"><button class="btn btn-small" data-action="edit-payment" data-id="${esc(m.id)}">${p?'수정':'입금'}</button>${p?`<button class="btn btn-small btn-red" data-action="remove-payment" data-id="${esc(m.id)}">취소</button>`:''}</div></td></tr>`}).join('')||'<tr><td colspan="5">등록된 회원이 없습니다.</td></tr>'}</tbody></table></div></section>`:''}`;}
  function members(){const all=activeMembers();return `${pageTitle('OUR BROTHERS','클럽 회원','함께 운동하는 브라더스 멤버들을 소개합니다.',state.admin?'<button class="btn btn-dark" data-action="edit-member">+ 회원 등록</button>':'')}<div class="member-directory-hint"><span>👆 회원 이름을 누르면 <b>${esc(fmtDay(state.selectedDate))}</b> 참석을 등록하거나 변경할 수 있습니다.</span><button class="btn btn-small" data-page="attendance">날짜 변경</button></div><section class="panel"><div class="panel-head"><h3>등록 회원 ${all.length}명</h3><span class="muted small">연락처 등 개인 정보는 게시하지 않습니다.</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th style="width:70px">번호</th><th>회원명</th><th>구분</th>${state.admin?'<th>관리</th>':''}</tr></thead><tbody>${all.map((m,i)=>`<tr><td>${i+1}</td><td><button class="member-name-btn" data-member-choose="${esc(m.id)}" title="이름을 눌러 참석 체크">${esc(m.name)} ✓</button></td><td><span class="tag">${esc(m.role||'회원')}</span></td>${state.admin?`<td><div class="action-row"><button class="btn btn-small" data-action="edit-member" data-id="${esc(m.id)}">수정</button><button class="btn btn-small btn-red" data-action="disable-member" data-id="${esc(m.id)}">비활성</button></div></td>`:''}</tr>`).join('')||`<tr><td colspan="${state.admin?4:3}" style="text-align:center;padding:26px">아직 등록된 회원이 없습니다.</td></tr>`}</tbody></table></div></section>${state.admin?`<div class="hint">비활성 회원: ${state.members.filter(x=>x.active===false).map(x=>`${esc(x.name)} <button class="btn btn-small" data-action="activate-member" data-id="${esc(x.id)}">재등록</button>`).join('　')||'없음'} · 비활성 회원의 과거 출석 기록은 보존됩니다.</div>`:''}`;}
  function weather(){return `${pageTitle('COURT WEATHER · PAJU','코트 날씨 확인','기상청 예보와 봉일천사거리 CCTV를 빠르게 확인하세요.')}<section class="panel tc-weather-panel"><div class="tc-weather-intro"><div><span class="tc-weather-kicker">BROTHERS COURT WEATHER</span><h2>오늘 테니스, 날씨부터 확인하세요</h2><p>예보는 파주스타디움 테니스장 기준, CCTV는 봉일천사거리(보) 기준입니다.</p></div></div><div class="tc-weather-grid"><article class="tc-weather-card"><div class="tc-weather-icon" aria-hidden="true">☀</div><span class="tc-weather-type">기상청 공식 예보</span><h3>파주스타디움 테니스장</h3><p>시간대별 날씨, 기온, 강수 확률과 바람을 확인하세요.</p><a class="tc-weather-open tc-weather-open-primary" href="${esc(KMA_WEATHER_URL)}" target="_blank" rel="noopener noreferrer" aria-label="기상청 파주스타디움 테니스장 날씨예보 새 창으로 열기">기상청 날씨예보 보기 ↗</a></article><article class="tc-weather-card"><div class="tc-weather-icon" aria-hidden="true">▣</div><span class="tc-weather-type">파주시 교통정보센터 CCTV</span><h3>봉일천사거리(보)</h3><p>도로 주변의 하늘과 비·눈 상태를 영상으로 참고하세요.</p><a class="tc-weather-open tc-weather-open-secondary" href="${esc(BONGIL_CCTV_URL)}" target="_blank" rel="noopener noreferrer" aria-label="봉일천사거리 CCTV 실시간 영상 새 창으로 열기">실시간 CCTV 보기 ↗</a></article></div><div class="tc-weather-footnote">※ CCTV는 코트 현장 영상이 아닙니다. 기상 상황 참고용이며, 영상 제공처의 접속 정책이나 휴대폰 브라우저에 따라 재생되지 않을 수 있습니다. 그때는 <a href="${esc(PAJU_CCTV_PORTAL)}" target="_blank" rel="noopener noreferrer">파주시 CCTV 검색 페이지 ↗</a>에서 ‘봉일천’을 검색해 주세요.</div></section>`;}
  function notices(){const arr=[...state.notices].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||String(b.createdAt).localeCompare(String(a.createdAt)));return `${pageTitle('CLUB NOTICE','공지사항','운영진의 모임 안내와 클럽 소식을 확인하세요.',state.admin?'<button class="btn btn-dark" data-action="edit-notice">+ 공지 등록</button>':'')}<div class="stack">${arr.map(n=>`<article class="panel"><div class="panel-head" style="margin-bottom:8px"><div><div class="notice-title" style="font-size:17px">${n.pinned?'<span class="pin">중요</span>':''}${esc(n.title)}</div><span class="muted tiny">${esc(String(n.createdAt||'').slice(0,10))}</span></div>${state.admin?`<div class="toolbar"><button class="btn btn-small" data-action="edit-notice" data-id="${esc(n.id)}">수정</button><button class="btn btn-small btn-red" data-action="remove-notice" data-id="${esc(n.id)}">삭제</button></div>`:''}</div><div class="notice-full">${esc(n.body)}</div></article>`).join('')||'<div class="panel"><div class="empty"><b>아직 공지사항이 없습니다.</b>새로운 소식이 올라오면 이곳에 표시됩니다.</div></div>'}</div>`;}

  function adminPage(){
    if(!state.admin){return `${pageTitle('ADMIN CONSOLE','관리자 페이지','운영진만 사용할 수 있는 관리 화면입니다.','<button class="btn btn-primary" data-action="admin-login">운영진 로그인</button>')}<section class="panel login-panel"><h3>운영진 전용 메뉴</h3><p>회원 등록, 회비 입출금 기록, 공지 등록, 모임 일정 관리는 운영진 로그인 후 가능합니다.</p></section>`;}
    const month=state.month;
    const s=summaryFor(month);
    const members=activeMembers();
    const events=eventsSorted();
    const recentTx=fullLedgerEntries().slice(0,8);
    const recentNoti=[...state.notices].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,5);
    return `${pageTitle('ADMIN CONSOLE','관리자 페이지','회원, 회비, 공지와 모임 일정을 한 곳에서 빠르게 관리하세요.',`<button class="btn btn-small btn-dark" data-action="refresh-finance">↻ 공개 장부 갱신</button><button class="btn btn-small" data-action="edit-settings">기본 설정</button><button class="btn btn-primary" data-page="fees">회비 상세 보기</button>`)}
    ${state.mode==='cloud'&&!state.members.length?`<section class="panel admin-import-panel"><div><h3>클럽 초기자료 등록</h3><p>제공된 관리자 전용 초기자료 JSON 파일을 선택하면 8명 회원·회비 내역·공지를 한 번에 등록합니다. 기존 자료는 덮어쓰지 않습니다.</p><div class="field" style="margin:12px 0 0"><label for="starter-file">초기자료 파일 선택 (GitHub에 업로드하지 마세요)</label><input type="file" class="input" id="starter-file" accept=".json,application/json"></div></div><button class="btn btn-primary" data-action="import-starter">선택한 자료 등록</button></section>`:''}
    <section class="panel admin-quick-panel">
      <div class="panel-head"><h3>빠른 등록</h3><span class="tag paid">운영진 전용</span></div><div class="hint">기존 회원 회비 내역을 공개 장부에 반영하려면 상단 <b>공개 장부 갱신</b>을 한 번 눌러주세요. 이후 입금/지출 변경 시 자동 갱신됩니다.</div>
      <div class="admin-quick-grid">
        <button class="admin-quick-card" data-action="edit-member"><b>+ 회원 등록</b><small>새 회원 추가 및 회비 설정</small></button>
        <button class="admin-quick-card" data-action="add-transaction"><b>+ 입출금 기록</b><small>운영비 지출/기타 수입 기록</small></button>
        <button class="admin-quick-card" data-action="edit-notice"><b>+ 공지 등록</b><small>공지사항 작성 및 중요 고정</small></button>
        <button class="admin-quick-card" data-action="edit-event"><b>+ 모임 일정 등록</b><small>월~금 일정과 장소 등록</small></button>
      </div>
    </section>
    <div class="admin-summary-grid">
      <div class="kpi"><span>${esc(month)} 회비 수납</span><b>${fmtMoney(s.paid)}</b></div>
      <div class="kpi"><span>완납 회원</span><b>${s.paidMembers}<small>/ ${members.length}명</small></b></div>
      <div class="kpi"><span>운영비 지출</span><b>${fmtMoney(s.expense)}</b></div>
    </div>
    <div class="hint" role="note"><b>거래내역 확인 필요:</b> 날짜가 잘린 이형석 입금 1건은 별도 관리자용 확인표를 참고하세요. 화면에 없는 잔액·거래는 입력하지 않았습니다.</div>
    <div class="admin-grid">
      <section class="panel">
        <div class="panel-head"><h3>회원 관리</h3><button class="text-link" data-page="members">회원 메뉴로 이동 ›</button></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>회원명</th><th>구분</th><th>월 회비</th><th>관리</th></tr></thead><tbody>
        ${members.map(m=>`<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.role||'회원')}</td><td>${fmtMoney(feeFor(m.id))}</td><td><div class="action-row"><button class="btn btn-small" data-action="edit-member" data-id="${esc(m.id)}">수정</button><button class="btn btn-small" data-action="edit-payment" data-id="${esc(m.id)}">회비 입력</button></div></td></tr>`).join('')||'<tr><td colspan="4">등록된 회원이 없습니다.</td></tr>'}
        </tbody></table></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>회비 · 입출금 관리</h3><button class="text-link" data-page="fees">회비 메뉴로 이동 ›</button></div>
        <div class="hint">첨부 거래내역 중 입금일 누락 및 회원명 불일치 항목은 별도 관리자용 확인표를 참고하세요.</div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>구분</th><th>내용</th><th style="text-align:right">금액</th><th>관리</th></tr></thead><tbody>
        ${recentTx.map(t=>`<tr><td>${t.type==='income'?'입금':'출금'}</td><td>${esc(t.category||'운영비')}<div class="tiny muted">${esc(t.date)}</div></td><td style="text-align:right;font-weight:800">${t.type==='expense'?'-':'+'}${fmtMoney(t.amount)}</td><td>${t.kind==='payment'?'<span class="tag">회비</span>':`<button class="btn btn-small btn-red" data-action="remove-transaction" data-id="${esc(t.id)}">삭제</button>`}</td></tr>`).join('')||'<tr><td colspan="4">등록된 입출금 내역이 없습니다.</td></tr>'}
        </tbody></table></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>공지 관리</h3><button class="btn btn-small btn-primary" data-action="edit-notice">+ 공지 등록</button></div>
        <div class="stack admin-stack">${recentNoti.map(n=>`<div class="admin-item"><div><strong>${n.pinned?'[중요] ':''}${esc(n.title)}</strong><div class="tiny muted">${esc(String(n.createdAt||'').slice(0,10))}</div></div><div class="action-row"><button class="btn btn-small" data-action="edit-notice" data-id="${esc(n.id)}">수정</button><button class="btn btn-small btn-red" data-action="remove-notice" data-id="${esc(n.id)}">삭제</button></div></div>`).join('')||'<div class="empty">등록된 공지사항이 없습니다.</div>'}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>모임 일정 관리</h3><button class="btn btn-small btn-primary" data-action="edit-event">+ 일정 등록</button></div>
        <div class="stack admin-stack">${events.map(ev=>`<div class="admin-item"><div><strong>${esc(fmtDay(ev.date))} ${esc(ev.title||'정기 모임')}</strong><div class="tiny muted">${esc(ev.time||'')} ${esc(ev.place||'장소 미정')}</div></div><div class="action-row"><button class="btn btn-small" data-action="edit-event" data-id="${esc(ev.id)}">수정</button><button class="btn btn-small btn-red" data-action="remove-event" data-id="${esc(ev.id)}">삭제</button></div></div>`).join('')||'<div class="empty">등록된 일정이 없습니다.</div>'}</div>
      </section>
    </div>`;
  }
  function render(){if(!state.ready)return;document.title='브라더스테니스클럽 HUB';let body={home,attendance,fees,members,notices,weather,admin:adminPage}[state.page]||home;$('#app').innerHTML=header()+body()+footer();document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',b.dataset.page===state.page?'page':'false'));}
  async function rsvp(status){const d=state.selectedDate;const m=memberById(state.selectedMember);if(!m||!d)return toast('날짜와 회원을 선택해 주세요.');if(!weekdayOnly(d))return toast('브라더스 출석은 월~금만 등록할 수 있습니다.');if(m.active===false)return toast('비활성 회원은 등록할 수 없습니다.');const ev=eventOfDay(d);const cap=Number(ev?.capacity)||0;if(status==='yes'&&responseOf(d,m.id)!=='yes'&&cap>0&&countFor(d,'yes')>=cap)return toast('등록 정원이 찼습니다. 운영진에게 문의하세요.');const key=dayKey(d);const data={id:key+'_'+m.id,eventId:key,memberId:m.id,status,updatedAt:new Date().toISOString()};try{await put('attendance',data);closeModal();toast(`${m.name}님 · ${fmtDay(d)} ${ {yes:'참석',maybe:'미정',no:'불참'}[status]} 등록 완료`);}catch(err){toast('출석 등록 실패: '+(err.message||err));}}
  function editMember(id){if(!state.admin)return;const m=memberById(id)||{id:uid(),name:'',role:'회원',active:true};modal(id?'회원 정보 수정':'신규 회원 등록',`${field('회원 이름','name',m.name,'text','required maxlength="30"')}<div class="field"><label>구분</label><select class="input" name="role">${['회원','회장','총무','운영진','고문'].map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select></div>${field('월 회비 (원)','fee',id?feeFor(id):settings().monthlyFee,'number','min="0" max="10000000" required')}`,async f=>{const name=String(f.get('name')).trim();if(!name)throw Error('이름을 입력해 주세요.');if(!id&&activeMembers().some(x=>x.name===name))throw Error('동일한 이름이 있습니다.');await put('members',{...m,name,role:f.get('role'),active:true});await put('dues',{id:m.id,monthlyFee:Number(f.get('fee'))});await syncSummary();});}
  function editEvent(id){if(!state.admin)return;const e=eventById(id)||{id:uid(),date:datePlus(7),time:'19:00',title:'정기 모임',place:'',capacity:12,description:''};modal(id?'모임 일정 수정':'새 모임 일정',`<div class="grid2">${field('날짜','date',e.date,'date','required')}${field('시간','time',e.time,'time','required')}</div>${field('모임 제목','title',e.title,'text','required maxlength="70"')}${field('코트 / 장소','place',e.place,'text','maxlength="100"')}${field('정원 (0=제한없음)','capacity',e.capacity,'number','min="0" max="300"')}${textarea('안내 문구','description',e.description,'maxlength="500"')}`,async f=>{if(!weekdayOnly(String(f.get('date'))))throw Error('모임은 월요일부터 금요일까지만 등록할 수 있습니다.');await put('events',{id:e.id,date:String(f.get('date')),time:String(f.get('time')),title:String(f.get('title')).trim(),place:String(f.get('place')).trim(),capacity:Number(f.get('capacity'))||0,description:String(f.get('description')).trim()});state.selectedEvent=e.id;});}
  function editNotice(id){if(!state.admin)return;const n=state.notices.find(x=>x.id===id)||{id:uid(),title:'',body:'',pinned:false,createdAt:today()};modal(id?'공지 수정':'새 공지 등록',`${field('공지 제목','title',n.title,'text','required maxlength="120"')}${textarea('공지 내용','body',n.body,'required maxlength="5000"')}<label class="checkline"><input type="checkbox" name="pinned" ${n.pinned?'checked':''}>중요 공지로 고정</label>`,async f=>{await put('notices',{id:n.id,title:String(f.get('title')).trim(),body:String(f.get('body')).trim(),pinned:f.has('pinned'),createdAt:n.createdAt});});}
  function editPayment(memberId){if(!state.admin)return;const m=memberById(memberId);if(!m)return;const p=state.payments.find(x=>x.id===state.month+'_'+memberId);modal(`${m.name} · ${state.month} 회비`,`${field('납부 금액 (원)','amount',p?.amount??feeFor(memberId),'number','required min="0" max="100000000"')}${field('입금일','paidAt',p?.paidAt||today(),'date','required')}${field('메모','memo',p?.memo||'','text','maxlength="120"')}`,async f=>{await put('payments',{id:state.month+'_'+memberId,month:state.month,memberId,amount:Number(f.get('amount')),paidAt:String(f.get('paidAt')),memo:String(f.get('memo'))});if(state.mode==='cloud'){await new Promise(r=>setTimeout(r,250));}await syncSummary();});}
  function editTransaction(){if(!state.admin)return;modal('기타 수입·지출 등록',`<div class="field"><label>거래 구분</label><select class="input" name="type"><option value="expense">지출</option><option value="income">기타 수입</option></select></div><div class="grid2">${field('거래 날짜','date',today(),'date','required')}${field('금액 (원)','amount','','number','required min="1" max="1000000000"')}</div>${field('항목','category','','text','required maxlength="80"')}${field('메모','memo','','text','maxlength="200"')}`,async f=>{await put('transactions',{id:uid(),date:String(f.get('date')),type:String(f.get('type')),amount:Number(f.get('amount')),category:String(f.get('category')).trim(),memo:String(f.get('memo')).trim()});if(state.mode==='cloud')await new Promise(r=>setTimeout(r,250));await syncSummary();});}
  function reconcileBankBalance(){
    if(!state.admin)return;
    const current=balanceDisplay();
    const note=current?`현재 장부상 잔액은 ${fmtMoney(current.amount)}입니다.`:'현재 장부 잔액이 아직 게시되지 않았습니다.';
    modal('클럽 통장 잔액 맞추기',`<div class="hint"><b>주의:</b> ${esc(note)} 실제 은행 잔액을 입력하면 기존 회비 입금을 다시 더하지 않고 <b>차액만</b> 이월·정산 항목으로 기록합니다. 이미 이월액을 등록했다면 중복 입력하지 않습니다.</div>${field('은행에서 확인한 현재 잔액 (원)','actual','','number','required min="0" max="100000000000" step="1" placeholder="예: 357535"')}<div class="hint">기준일: ${esc(today())} · 마이너스 차액이면 기타 출금으로 기록됩니다. 입력된 이전 거래가 모두 정확한지 확인하세요.</div>`,async f=>{
      const target=Number(f.get('actual'));
      if(!Number.isSafeInteger(target)||target<0)throw Error('실제 은행 잔액을 정확히 입력해 주세요.');
      if(state.mode==='cloud'){
        const {fs,db}=state.firebase;
        for(const coll of ['members','payments','transactions']){
          const snap=await fs.getDocs(fs.collection(db,coll));
          state[coll]=snap.docs.map(d=>({id:d.id,...d.data()}));
        }
      }
      const before=balanceFromEntries(fullLedgerEntries());
      const diff=target-before.amount;
      if(!diff){await syncSummary();toast('이미 은행 잔액과 일치합니다.');return;}
      const message=`기록된 장부잔액 ${fmtMoney(before.amount)}\n은행 확인잔액 ${fmtMoney(target)}\n차액 ${diff>0?'+':'−'}${fmtMoney(Math.abs(diff))}\n\n차액만 「기초 이월·잔액 정산」으로 기록할까요?`;
      if(!confirm(message))throw Error('입력을 취소했습니다.');
      await put('transactions',{id:uid(),date:today(),type:diff>0?'income':'expense',amount:Math.abs(diff),category:'기초 이월·잔액 정산',memo:`${today()} 실제 은행 잔액 ${fmtMoney(target)}에 맞춘 차액`});
      await syncSummary();
    });
  }
  function editSettings(){if(!state.admin)return;const a=settings();modal('클럽 소개 및 운영 정보',`${textarea('클럽 소개','intro',a.intro,'maxlength="800"')}${field('영문 슬로건','motto',a.motto,'text','maxlength="120"')}${field('활동 장소','location',a.location,'text','maxlength="200"')}${field('정기 모임 안내','schedule',a.schedule,'text','maxlength="200"')}${field('운영진 문의 안내','contact',a.contact,'text','maxlength="200"')}${field('기본 월 회비 (원)','monthlyFee',a.monthlyFee,'number','required min="0"')}${textarea('클럽 이용 안내 (줄바꿈으로 항목 구분)','rules',a.rules,'maxlength="1500"')}`,async f=>{const data={};['intro','motto','location','schedule','contact','rules'].forEach(k=>data[k]=String(f.get(k)).trim());data.monthlyFee=Number(f.get('monthlyFee'))||0;data.youtube=CHANNEL_URL;await saveSettings(data);await syncSummary();});}
  async function importStarter(){
    if(!state.admin||state.mode!=='cloud')return toast('운영진 로그인 후 사용할 수 있습니다.');
    const file=document.getElementById('starter-file')?.files?.[0];
    if(!file)throw Error('관리자용 초기자료 JSON 파일을 먼저 선택해 주세요.');
    if(file.size>200000)throw Error('파일이 너무 큽니다.');
    const d=JSON.parse(await file.text());
    const collections=['members','dues','payments','transactions','notices'];
    for(const coll of collections){
      if(!Array.isArray(d[coll]))throw Error('초기자료 형식 오류: '+coll);
      for(const row of d[coll]){if(!row||typeof row.id!=='string'||!row.id.match(/^[a-zA-Z0-9_-]{2,120}$/))throw Error('초기자료 ID 오류: '+coll);}
    }
    if(d.members.length!==8)throw Error('회원 수가 8명이 아닙니다. 파일을 확인해 주세요.');
    const {fs,db}=state.firebase;
    // Server check, including finance data: never write over any existing live data.
    for(const coll of collections){
      const existing=await fs.getDocs(fs.collection(db,coll));
      if(!existing.empty)throw Error('기존 데이터('+coll+')가 있어 초기등록을 중단했습니다.');
    }
    const batch=fs.writeBatch(db);
    for(const coll of collections){
      for(const obj of d[coll]){const data={...obj};delete data.id;batch.set(fs.doc(db,coll,obj.id),data);}
    }
    batch.set(fs.doc(db,'meta','settings'),{...DEFAULTS,monthlyFee:20000},{merge:true});
    await batch.commit();
    collections.forEach(k=>state[k]=d[k]);
    state.meta={...DEFAULTS,monthlyFee:20000};
    await syncSummary();
    render();
    toast('회원 8명 · 회비 내역 · 공지를 초기 등록했습니다.');
  }
  async function adminLogin(){if(state.admin){state.page='admin';render();window.scrollTo({top:0,behavior:'smooth'});return;}if(state.mode==='demo'){modal('운영진 모드 · 샘플',`${field('시연용 관리자 코드','pin','','password','required autocomplete="off"')}<div class="hint">시연용 비밀번호: <strong>1234</strong><br>실제 사이트는 Firebase에 등록한 관리자 Google 계정으로 보호됩니다.</div>`,async f=>{if(String(f.get('pin'))!=='1234')throw Error('코드가 맞지 않습니다.');state.admin=true;state.page='admin';render();});return;}const adminList=(window.BROTHERS_CONFIG?.adminEmails?.length?window.BROTHERS_CONFIG.adminEmails:[window.BROTHERS_CONFIG?.adminEmail||'']).filter(Boolean);if(!adminList.length){toast('firebase-config.js에 관리자 이메일을 입력해 주세요.');return;}try{const provider=new state.firebase.auth.GoogleAuthProvider();const result=await state.firebase.auth.signInWithPopup(state.firebase.authentication,provider);if(!adminList.map(x=>String(x).trim().toLowerCase()).includes(String(result.user?.email||'').toLowerCase())){toast('등록된 운영진 Google 계정으로 로그인해 주세요.');}else{state.page='admin';render();}}catch(e){toast('관리자 인증 실패: '+(e.code||e.message));}}
  async function adminLogout(){if(state.mode==='demo'){state.admin=false;state.page='home';render();toast('운영진 모드를 종료했습니다.');return;}if(state.firebase?.authentication){await state.firebase.auth.signOut(state.firebase.authentication);state.page='home';render();}}
  function clickHandler(e){const modalShade=e.target.closest('[data-close-shade]');if(modalShade&&e.target===modalShade){closeModal();return;}if(e.target.closest('[data-close-modal]')){closeModal();return;}
    // Clicking the attendance CTA in the weekly board should show the member buttons,
    // not reset the viewport to the top of the attendance screen.
    const p=e.target.closest('[data-page]');
    if(p){
      e.preventDefault();
      const jumpToMembers=p.dataset.page==='attendance' && !!p.closest('.weekday-detail-foot');
      state.page=p.dataset.page;
      state.search='';
      render();
      if(jumpToMembers){
        requestAnimationFrame(()=>{
          const grid=document.getElementById('member-pick-grid');
          const section=grid&&grid.closest('section.panel');
          (section||grid)?.scrollIntoView({behavior:'smooth',block:'start'});
        });
      }else{
        window.scrollTo({top:0,behavior:'smooth'});
      }
      return;
    }
    const wk=e.target.closest('[data-week]');if(wk){if(wk.dataset.week==='today'){state.weekOffset=0;state.selectedDate=initialDate();}else{state.weekOffset+=(wk.dataset.week==='next'?1:-1);state.selectedDate=weekDays()[0];}render();return;}
    const day=e.target.closest('[data-date]');if(day){state.selectedDate=day.dataset.date;render();return;}
    const name=e.target.closest('[data-member-choose]');if(name){chooseMember(name.dataset.memberChoose);return;}
    const choice=e.target.closest('[data-rsvp-choice]');if(choice){rsvp(choice.dataset.rsvpChoice);return;}
    const se=e.target.closest('[data-select-event]');if(se){state.selectedEvent=se.dataset.selectEvent;render();return;}
    const go=e.target.closest('[data-event-go]');if(go){state.selectedDate=eventById(go.dataset.eventGo)?.date||today();state.page='attendance';render();window.scrollTo({top:0,behavior:'smooth'});return;}
    const rv=e.target.closest('[data-rsvp]');if(rv){rsvp(rv.dataset.rsvp);return;}
    const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id;
    if(action==='copy-link'){if(state.mode!=='cloud'){toast('공유 사이트를 개설한 뒤 링크를 복사할 수 있습니다.');return;}const link=window.location.href;Promise.resolve(navigator.clipboard?.writeText(link)).then(()=>toast('사이트 링크를 복사했습니다. 카카오톡에 붙여넣으세요.')).catch(()=>prompt('이 주소를 복사해 주세요.',link));return;}
    if(action==='copy-club-bank'){
      const value=CLUB_BANK.number;
      if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(value).then(()=>toast('클럽 계좌번호가 복사되었습니다.')).catch(()=>{window.prompt('계좌번호를 복사하세요.',value);});
      }else{window.prompt('계좌번호를 복사하세요.',value);}
      return;
    }
    if(action==='how-connect'){alert('현재 샘플 모드에서는 변경 내용이 이 브라우저에만 저장됩니다. 다운로드한 ZIP 파일의 README.md에 있는 Firebase + GitHub Pages 연결 안내를 따라 설정하면 모든 회원이 같은 출석·공지 정보를 실시간 공유할 수 있습니다.');return;}
    if(action==='admin-login'){adminLogin();return;}
    if(action==='admin-logout'){adminLogout().catch(err=>toast(err.message||err));return;}
    if(action==='import-starter'){if(!confirm('선택한 초기자료 파일의 회원·회비·공지 내역을 Firebase에 등록할까요?'))return;importStarter().catch(err=>toast('초기자료 등록 실패: '+(err.message||err)));return;}
    if(!state.admin){toast('운영진 관리자 권한이 필요합니다.');return;}
    if(action==='balance-reconcile'){reconcileBankBalance();return;}
    if(action==='refresh-finance'){syncSummary().then(()=>toast('공개 장부를 최신 내역으로 갱신했습니다.')).catch(err=>toast('장부 갱신 실패: '+(err.message||err)));return;}
    if(action==='edit-member')editMember(id);
    if(action==='edit-event')editEvent(id);
    if(action==='edit-notice')editNotice(id);
    if(action==='edit-payment')editPayment(id);
    if(action==='add-transaction')editTransaction();
    if(action==='edit-settings')editSettings();
    if(action==='disable-member'&&confirm('해당 회원을 비활성화할까요? 과거 출석 기록은 남습니다.'))put('members',{...memberById(id),active:false}).then(()=>syncSummary()).catch(err=>toast(err.message));
    if(action==='activate-member')put('members',{...memberById(id),active:true}).then(()=>syncSummary()).catch(err=>toast(err.message));
    if(action==='remove-event'&&confirm('이 모임을 삭제할까요? 등록된 해당 모임의 출석 응답도 함께 삭제됩니다.')){(async()=>{for(const a of [...state.attendance].filter(x=>x.eventId===id))await remove('attendance',a.id);await remove('events',id);selectDefaultEvent();render();toast('모임을 삭제했습니다.');})().catch(err=>toast(err.message));}
    if(action==='remove-notice'&&confirm('이 공지사항을 삭제할까요?'))remove('notices',id).catch(err=>toast(err.message));
    if(action==='remove-payment'&&confirm('납부 처리 내역을 취소할까요?'))remove('payments',state.month+'_'+id).then(()=>syncSummary()).catch(err=>toast(err.message));
    if(action==='remove-transaction'&&confirm('이 장부 항목을 삭제할까요?'))remove('transactions',id).then(()=>syncSummary()).catch(err=>toast(err.message));
  }
  function changeHandler(e){if(e.target.id==='member-picker'){state.selectedMember=e.target.value;storage.set('brotherstc_selected_member',state.selectedMember);render();}if(e.target.id==='monthPicker'){state.month=e.target.value||monthNow();render();}}
  function inputHandler(e){if(e.target.id==='member-search'){state.search=e.target.value;const v=state.search.trim();const grid=$('#member-pick-grid');if(grid)grid.innerHTML=activeMembers().filter(m=>m.name.includes(v)).map(m=>{const st=responseOf(state.selectedDate,m.id);return `<button class="member-pick ${st?'pick-'+st:''}" data-member-choose="${esc(m.id)}"><span class="pick-name">${esc(m.name)}</span><span class="pick-status">${st==='yes'?'✓ 참석':st==='maybe'?'? 미정':st==='no'?'× 불참':'선택하기'}</span></button>`;}).join('')||'<div class="empty">검색된 회원이 없습니다.</div>';}}
  function addBalanceStyles(){if(document.getElementById('tc-balance-styles'))return;const style=document.createElement('style');style.id='tc-balance-styles';style.textContent='/* Balance feature · v11 */\n.tc-balance-hero{background:linear-gradient(117deg,#14251a,#294a2c);color:#fff;border-radius:22px;margin:0 0 18px;padding:27px 32px;display:flex;justify-content:space-between;align-items:center;gap:28px;box-shadow:0 14px 30px #0a231522}\n.tc-balance-main{flex:1;min-width:0}\n.tc-balance-title{font-size:17px;font-weight:850;color:#dbeec9;letter-spacing:.2px}\n.tc-balance-dot{color:#b9f24a;margin-right:6px;font-size:13px}\n.tc-balance-number{font-size:clamp(39px,5vw,62px);font-weight:950;line-height:1.2;letter-spacing:-2px;white-space:nowrap;margin:8px 0;color:#fff;font-variant-numeric:tabular-nums}\n.tc-balance-number small{font-size:22px;font-weight:780;margin-left:6px;color:#cbe7b9;letter-spacing:0}\n.tc-balance-unset{font-size:24px;font-weight:850;margin:12px 0;color:#d0e1c8}\n.tc-balance-caption{font-size:12px;color:#b6d1b0;margin:7px 0 0;line-height:1.7}\n.tc-balance-side{min-width:178px;display:flex;flex-direction:column;gap:12px;border-left:1px solid #ffffff30;padding-left:22px}\n.tc-balance-stat{display:flex;flex-direction:column;gap:2px;color:#b4cdb2;font-size:12px}\n.tc-balance-stat b{color:#f6fff1;font-size:16px;font-weight:850;font-variant-numeric:tabular-nums}\n.tc-balance-adjust{padding:9px 11px;background:#d6fc84;color:#183015;border:0;border-radius:10px;font-weight:850;font-size:12px;cursor:pointer;margin-top:2px}\n.tc-balance-adjust:hover{background:#c6f069}\n@media(max-width:760px){.tc-balance-hero{padding:22px 19px;flex-direction:column;align-items:stretch;gap:15px;border-radius:17px}.tc-balance-number{font-size:clamp(37px,11vw,52px);margin:8px 0 4px}.tc-balance-number small{font-size:19px}.tc-balance-title{font-size:15px}.tc-balance-side{min-width:0;border-left:0;border-top:1px solid #ffffff30;padding:12px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.tc-balance-adjust{grid-column:span 2}.tc-balance-stat b{font-size:14px}}\n@media(max-width:350px){.tc-balance-number{font-size:36px}}\n/* v12 desktop + mobile balance card visible */\n.tc-balance-feature-v12{display:block!important;visibility:visible!important;opacity:1!important;width:100%;margin-bottom:18px;clear:both}\n.tc-balance-feature-v12 .tc-balance-hero{display:flex!important;visibility:visible!important;opacity:1!important;width:100%;min-height:170px}\n.tc-balance-feature-v12 .tc-balance-number{display:block!important;font-size:clamp(42px,5vw,68px)!important;font-weight:950!important}\n@media(max-width:760px){.tc-balance-feature-v12 .tc-balance-hero{display:flex!important;flex-direction:column!important;min-height:0}.tc-balance-feature-v12 .tc-balance-number{font-size:clamp(36px,11vw,54px)!important}}\n';document.head.appendChild(style);}
  function addClubBankStyles(){
    if(document.getElementById('brothers-bank-account-v14'))return;
    const style=document.createElement('style');
    style.id='brothers-bank-account-v14';
    style.textContent=`
      .tc-bank-account-v14{display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border:1px solid #dce8d3;border-radius:19px;padding:20px 24px;margin:0 0 18px;box-shadow:0 7px 18px rgba(21,40,18,.035)}
      .tc-bank-info-v14{min-width:0}
      .tc-bank-kicker-v14{font-size:13px;font-weight:850;color:#42753a;margin-bottom:8px}
      .tc-bank-line-v14{display:flex;align-items:baseline;gap:15px;flex-wrap:wrap}
      .tc-bank-name-v14{font-size:16px;font-weight:800;color:#2a392b}
      .tc-bank-number-v14{font-size:clamp(21px,2.6vw,29px);font-weight:950;line-height:1.25;letter-spacing:.3px;color:#132719;font-variant-numeric:tabular-nums;white-space:nowrap}
      .tc-bank-holder-v14{font-size:13px;color:#667568;margin-top:6px}
      .tc-bank-holder-v14 b{color:#304534;margin-left:7px}
      .tc-bank-copy-v14{flex:0 0 auto;border:1px solid #c9e4ab;border-radius:12px;background:#e9f9d7;color:#285129;font-size:13px;font-weight:850;padding:13px 17px;min-height:45px;cursor:pointer}
      .tc-bank-copy-v14:hover,.tc-bank-copy-v14:focus-visible{background:#d9f2be;outline-color:#78ad48}
      @media (max-width:760px){
        .tc-bank-account-v14{padding:17px 16px;gap:12px;flex-direction:column;align-items:stretch;border-radius:16px}
        .tc-bank-line-v14{gap:5px;flex-direction:column;align-items:flex-start}
        .tc-bank-name-v14{font-size:14px}
        .tc-bank-number-v14{font-size:27px}
        .tc-bank-copy-v14{width:100%;padding:11px;min-height:41px}
      }
    `;
    document.head.appendChild(style);
  }
  addClubBankStyles();
  addBalanceStyles();
  document.addEventListener('click',clickHandler);document.addEventListener('change',changeHandler);document.addEventListener('input',inputHandler);
  startFirebase();
})();
