// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxSTxdco3HFv6qD07k262Yen64myCaRX28gezJCigRYCSm9aNbHC9Nv-ApQfLB5ykpAHA/exec";
const GOOGLE_CLIENT_ID = "582583731525-q3nc2v22sspdef6faqio3f9bou9f0ioa.apps.googleusercontent.com";
// =========================================================================

const icHome = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
const icChart = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`;
const icCal = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
const icPen = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>`;
const icData = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`;
const icMoon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

let USER_EMAIL = ""; let APP_DATA = null; let CURRENT_USER = {}; let BOOKED_DATES = {}; let FULL_KLASEMEN = []; let TODAY_STATE = {};
let SELECTED_MONTH = new Date().getMonth(); let SELECTED_YEAR = new Date().getFullYear();
let calViewMonth = new Date().getMonth(); let calViewYear = new Date().getFullYear();
let currentFormPage = 0;

const SYUQQOH_GROUPS = [
  { name: "Syuqqoh Arafah", rooms: ["Arafah 1", "Arafah 2", "Arafah 3", "Arafah 4", "Arafah 5", "Arafah 6"] },
  { name: "Syuqqoh Muzdalifah", rooms: ["Muzdalifah 1", "Muzdalifah 2", "Muzdalifah 3", "Muzdalifah 5", "Muzdalifah 6"] },
  { name: "Syuqqoh Mina", rooms: ["Mina 1", "Mina 2", "Mina 3", "Mina 4", "Mina 5", "Mina 6"] },
  { name: "Syuqqoh Thaif", rooms: ["Thaif 1", "Thaif 2", "Thaif 3", "Thaif 4", "Thaif 5", "Thaif 6"] },
  { name: "Xativa & Sevilla", rooms: ["Xativa 1", "Xativa 2", "Xativa 4", "Sevilla 1", "Sevilla 2", "Sevilla 4"] },
  { name: "Granada & Qordoba", rooms: ["Granada 1", "Granada 2", "Granada 3", "Granada 4", "Qordoba 2", "Qordoba 3", "Qordoba 4"] },
  { name: "Awali & Uhud", rooms: ["Awali 1", "Uhud 1", "Uhud 2", "Uhud 3", "Uhud 4"] },
];

window.onload = function () {
  const savedEmail = localStorage.getItem("sikeka_user_email");
  if (savedEmail) {
    USER_EMAIL = savedEmail;
    document.getElementById("loginScreen").classList.remove("active");
    document.getElementById("globalLoader").classList.add("active");
    initAppData();
  } else {
    if (typeof google !== "undefined" && google.accounts) {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleAuth });
      google.accounts.id.renderButton(document.getElementById("googleSignInBtn"), { theme: "outline", size: "large", width: 250 });
    } else { customAlert("Gagal memuat sistem Google Sign-In. Silakan periksa koneksi Anda.", "Sistem Error"); }
  }
};

function handleAuth(response) {
  let token = response.credential.split(".")[1];
  let payload = JSON.parse(decodeURIComponent(atob(token.replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
  USER_EMAIL = payload.email; localStorage.setItem("sikeka_user_email", USER_EMAIL);
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("globalLoader").classList.add("active"); initAppData();
}

function logout() { localStorage.removeItem("sikeka_user_email"); window.location.reload(); }
function confirmLogout() { customConfirm("Keluar dari Sikeka?", logout); }

function callAPI(action, payload = {}) {
  return fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: action, email: USER_EMAIL, payload: payload }) })
    .then(res => res.json()).then(json => { if (!json.success) throw new Error(json.message); return json.data; });
}

function initAppData() {
  callAPI("getInitData").then(data => {
    if (!data.isRegistered) {
      document.getElementById("globalLoader").classList.remove("active");
      document.getElementById("unauthEmail").innerText = data.user.email;
      navTo("unauthorizedScreen"); return;
    }
    APP_DATA = data; CURRENT_USER = data.user; BOOKED_DATES = data.bookedDates; FULL_KLASEMEN = data.klasemen.all; TODAY_STATE = data.todayState;
    document.getElementById("globalLoader").classList.remove("active");
    document.getElementById("app-wrapper").style.display = "flex"; // Tampilkan layout utama

    document.getElementById("dashUserSapaan").innerText = (CURRENT_USER.role === "JT" ? "" : "Ustadz ") + CURRENT_USER.nama.split(" ")[0];
    
    populateDropdown(data.availableMonths || []);
    renderKlasemenDashboard(data.klasemen);
    renderKlasemenLengkap(FULL_KLASEMEN);
    renderJadwalMendatang();
    
    navTo("dashboardScreen");
  }).catch(err => {
    localStorage.removeItem("sikeka_user_email");
    customAlert("Gagal terhubung ke server Sikeka. Silakan muat ulang halaman.", "Koneksi Gagal", () => window.location.reload());
  });
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
}

function navTo(screenId) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  window.scrollTo(0, 0);
  if (screenId === "bookingScreen") renderCalendar();
  if (screenId === "formScreen") initializeFormPages();
  renderNavigation(screenId); 
}

/* RENDERING NAVIGASI RESPONSIVE (MOBILE & DESKTOP) */
function renderNavigation(active) {
  if(active === "unauthorizedScreen") return;

  // 1. MOBILE BOTTOM NAV
  let mob = document.getElementById("mobileBottomNav");
  let mHtml = `<div class="nav-item ${active==='dashboardScreen'?'active':''}" onclick="navTo('dashboardScreen')">${icHome}<span>Home</span></div>`;
  mHtml += `<div class="nav-item ${active==='klasemenScreen'?'active':''}" onclick="navTo('klasemenScreen')">${icChart}<span>Klasemen</span></div>`;
  
  // Tengah: FAB Inspeksi
  let fabState = (TODAY_STATE.status === "filled" || TODAY_STATE.status === "booked_by_other") ? "disabled" : "";
  let fabAction = fabState ? "customAlert('Jadwal tidak tersedia')" : "navTo('formScreen')";
  if(CURRENT_USER.role === "JT") {
     mHtml += `<div class="nav-fab-wrapper"><button class="nav-fab" onclick="navTo('exportScreen')">${icData}</button></div>`;
  } else {
     mHtml += `<div class="nav-fab-wrapper"><button class="nav-fab ${fabState}" onclick="${fabAction}">${icPen}</button></div>`;
  }

  if (CURRENT_USER.role !== "JT") mHtml += `<div class="nav-item ${active==='bookingScreen'?'active':''}" onclick="navTo('bookingScreen')">${icCal}<span>Jadwal</span></div>`;
  if (CURRENT_USER.role === "Admin" || CURRENT_USER.role === "JT") mHtml += `<div class="nav-item ${active==='exportScreen'?'active':''}" onclick="navTo('exportScreen')">${icData}<span>Data</span></div>`;
  mob.innerHTML = mHtml;

  // 2. DESKTOP SIDEBAR
  let desk = document.getElementById("desktopSidebar");
  let dHtml = `
    <div class="sidebar-logo"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Sikeka</div>
    <div class="sidebar-menu">
      <div class="side-item ${active==='dashboardScreen'?'active':''}" onclick="navTo('dashboardScreen')">${icHome} Dashboard</div>
      <div class="side-item ${active==='klasemenScreen'?'active':''}" onclick="navTo('klasemenScreen')">${icChart} Klasemen Asrama</div>`;
      if (CURRENT_USER.role !== "JT") dHtml += `<div class="side-item ${active==='bookingScreen'?'active':''}" onclick="navTo('bookingScreen')">${icCal} Kalender Jadwal</div>`;
      if (CURRENT_USER.role === "Admin" || CURRENT_USER.role === "JT") dHtml += `<div class="side-item ${active==='exportScreen'?'active':''}" onclick="navTo('exportScreen')">${icData} Data Manajemen</div>`;
  dHtml += `</div>
    <div class="sidebar-action">`;
      if(CURRENT_USER.role !== "JT") dHtml += `<button class="btn btn-primary" style="padding:14px;" onclick="${fabAction}" ${fabState}>${icPen} Mulai Inspeksi</button>`;
      dHtml += `<div style="display:flex; gap:8px;">
        <button class="btn btn-outline" style="flex:1;" onclick="toggleTheme()">${icMoon} Tema</button>
        <button class="btn btn-outline" style="flex:1; color:var(--danger-main)" onclick="confirmLogout()">Keluar</button>
      </div>
    </div>`;
  desk.innerHTML = dHtml;
}

// DASHBOARD: Widget Jadwal Mendatang
function renderJadwalMendatang() {
  let html = ""; let today = new Date();
  const dName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const mName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  for(let i=0; i<4; i++) {
      let d = new Date(today); d.setDate(today.getDate() + i);
      let key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      
      let dateStr = i===0 ? "Hari ini" : i===1 ? "Besok" : `${dName[d.getDay()]}, ${d.getDate()} ${mName[d.getMonth()]}`;
      let orang = BOOKED_DATES[key] ? BOOKED_DATES[key] : "<span class='text-muted'>Kosong</span>";
      
      // Highlight jika itu jadwal user
      if(BOOKED_DATES[key] === CURRENT_USER.namaLengkap) orang = `<span class="badge badge-success">Jadwal Anda</span>`;

      html += `<div class="data-row"><div class="data-row-main" style="width:100px;">${dateStr}</div><div style="font-weight:600; text-align:right;">${orang}</div></div>`;
  }
  document.getElementById("jadwalMendatangContainer").innerHTML = html;
}

function renderKlasemenDashboard(data) {
  let h1 = ""; data.top3.forEach((x, i) => h1 += `<div class="data-row"><div class="data-row-main"><span class="data-rank">${i+1}</span> <span>${x.kamar}</span></div><span class="badge badge-neutral">${x.nilai}</span></div>`);
  document.getElementById("top3Container").innerHTML = h1 || `<div class="data-row text-muted">Kosong</div>`;
  let h2 = ""; data.bottom3.forEach((x, i) => h2 += `<div class="data-row"><div class="data-row-main"><span class="data-rank">${data.all.length - data.bottom3.length + i + 1}</span> <span>${x.kamar}</span></div><span class="badge badge-neutral">${x.nilai}</span></div>`);
  document.getElementById("bottom3Container").innerHTML = h2 || `<div class="data-row text-muted">Kosong</div>`;
}

// KLASEMEN
function populateDropdown(mArr) {
  let dd = document.getElementById("bulanKlasemenDropdown"); dd.innerHTML = "";
  if (mArr.length === 0) dd.innerHTML = `<option value="${SELECTED_YEAR}-${SELECTED_MONTH}">Bulan Ini</option>`;
  else mArr.forEach(m => dd.innerHTML += `<option value="${m.value}">${m.label}</option>`);
  dd.value = SELECTED_YEAR + "-" + SELECTED_MONTH;
}

function loadKlasemenBulanIni() {
  let pts = document.getElementById("bulanKlasemenDropdown").value.split("-");
  SELECTED_YEAR = parseInt(pts[0]); SELECTED_MONTH = parseInt(pts[1]);
  document.getElementById("globalLoader").classList.add("active");
  callAPI("getKlasemenBulan", { targetMonth: SELECTED_MONTH, targetYear: SELECTED_YEAR }).then(res => {
      document.getElementById("globalLoader").classList.remove("active");
      FULL_KLASEMEN = res.klasemen.all; renderKlasemenLengkap(FULL_KLASEMEN);
  }).catch(err => { document.getElementById("globalLoader").classList.remove("active"); customAlert(err.message); });
}

function renderKlasemenLengkap(allData) {
  let html = "";
  allData.forEach((item, idx) => { html += `<tr onclick="bukaDetailKamar('${item.kamar}')"><td style="padding-left:16px;">${idx+1}</td><td>${item.kamar}</td><td style="text-align:right; padding-right:16px;">${item.nilai}</td></tr>`; });
  document.getElementById("fullKlasemenBody").innerHTML = html || `<tr><td colspan="3" class="text-center text-muted">Belum ada data</td></tr>`;
}

function bukaDetailKamar(roomName) {
  document.getElementById("globalLoader").classList.add("active"); document.getElementById("detailKamarTitle").innerText = roomName;
  callAPI("getRoomHistory", { roomName: roomName, filterMonth: SELECTED_MONTH, filterYear: SELECTED_YEAR }).then(hist => {
      document.getElementById("globalLoader").classList.remove("active"); let html = "";
      hist.forEach(item => { html += `<tr><td style="padding-left:16px;"><span class="text-muted" style="font-size:12px;display:block">${item.tanggal}</span>${item.penginput.split(' ')[0]}</td><td style="text-align:right; padding-right:16px;">${item.nilai}</td></tr>`; });
      document.getElementById("detailKamarBody").innerHTML = html || `<tr><td colspan="2" class="text-center text-muted">Kosong</td></tr>`;
      navTo("detailKamarScreen");
  });
}

// CALENDAR
function changeMonth(dir) {
  calViewMonth += dir; if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; } else if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
  renderCalendar();
}

function renderCalendar() {
  const bln = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  document.getElementById("calMonthYear").innerText = `${bln[calViewMonth]} ${calViewYear}`;
  
  let fd = new Date(calViewYear, calViewMonth, 1).getDay(); let days = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  let todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
  
  let html = ""; for (let i = 0; i < fd; i++) html += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= days; d++) {
    let dt = new Date(calViewYear, calViewMonth, d); dt.setHours(23, 59, 59);
    let key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    let isPast = dt < new Date(); let cls = (key === todayStr) ? "cal-day available today" : "cal-day available";

    if (BOOKED_DATES[key]) html += `<div class="cal-day booked">${d}<div class="dot"></div></div>`;
    else if (isPast && key !== todayStr) html += `<div class="cal-day booked">${d}</div>`;
    else html += `<div class="${cls}" onclick="prosesBooking('${key}')">${d}</div>`;
  }
  document.getElementById("calendarDays").innerHTML = html;
}

function prosesBooking(dateKey) {
  customConfirm(`Reservasi jadwal inspeksi asrama untuk tanggal ${dateKey}?`, () => {
    document.getElementById("globalLoader").classList.add("active");
    callAPI("submitBooking", { dateKey: dateKey, namaUser: CURRENT_USER.namaLengkap }).then(() => window.location.reload())
    .catch(err => { document.getElementById("globalLoader").classList.remove("active"); customAlert(err.message); });
  });
}

// FORM PENILAIAN
function initializeFormPages() {
  if(TODAY_STATE.status === "filled" || TODAY_STATE.status === "booked_by_other") {
      document.getElementById("formPagesContainer").innerHTML = `<div class="text-center text-muted" style="padding:40px 20px;">Jadwal inspeksi tidak tersedia.</div>`;
      document.getElementById("btnFormNext").disabled = true; return;
  }
  document.getElementById("btnFormNext").disabled = false; currentFormPage = 0; let html = "";
  SYUQQOH_GROUPS.forEach((g, i) => {
    html += `<div class="screen ${i===0?'active':''}" id="formPage_${i}" style="padding:0;"><div style="padding:16px 20px; background:var(--bg-body); border-bottom:1px solid var(--border-color); font-weight:700;">${g.name}</div>`;
    g.rooms.forEach(r => { html += `<div class="form-group" style="padding:12px 20px;"><label>${r}</label><input type="number" id="inp_${r.replace(/\s+/g,"_")}" placeholder="-"></div>`; });
    html += `</div>`;
  });
  document.getElementById("formPagesContainer").innerHTML = html; updateFormNavigation();
}

function changeFormPage(dir) {
  document.getElementById(`formPage_${currentFormPage}`).classList.remove("active"); currentFormPage += dir;
  if (currentFormPage >= SYUQQOH_GROUPS.length) {
    currentFormPage--; document.getElementById(`formPage_${currentFormPage}`).classList.add("active");
    customConfirm("Simpan data nilai inspeksi asrama sekarang?", executeSavePenilaian); return;
  }
  document.getElementById(`formPage_${currentFormPage}`).classList.add("active"); updateFormNavigation(); window.scrollTo(0,0);
}

function updateFormNavigation() {
  document.getElementById("formProgressText").innerText = `Hal ${currentFormPage + 1} / ${SYUQQOH_GROUPS.length}`;
  document.getElementById("btnFormPrev").style.display = currentFormPage === 0 ? "none" : "block";
  document.getElementById("btnFormNext").innerText = currentFormPage === SYUQQOH_GROUPS.length - 1 ? "Submit" : "Next";
}

function executeSavePenilaian() {
  let payload = {}; let errIdx = -1;
  SYUQQOH_GROUPS.forEach((g, i) => {
    g.rooms.forEach(r => { let v = document.getElementById(`inp_${r.replace(/\s+/g,"_")}`).value; if(v==="" && errIdx===-1) errIdx = i; payload[r] = v; });
  });
  if(errIdx !== -1) {
     customAlert("Lengkapi seluruh form penilaian sebelum mengirim data.", "Form Belum Lengkap"); document.getElementById(`formPage_${currentFormPage}`).classList.remove("active");
     currentFormPage = errIdx; document.getElementById(`formPage_${currentFormPage}`).classList.add("active"); updateFormNavigation(); return;
  }
  document.getElementById("globalLoader").classList.add("active");
  callAPI("savePenilaian", { penilaianMap: payload }).then(() => window.location.reload())
  .catch(err => { document.getElementById("globalLoader").classList.remove("active"); customAlert(err.message); });
}

// EXPORT / IMPORT
function downloadTemplateExcel() {
  document.getElementById("globalLoader").classList.add("active");
  callAPI("getRoomHeaders").then(rooms => {
      document.getElementById("globalLoader").classList.remove("active");
      let wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Tanggal"].concat(rooms)]), "Template"); XLSX.writeFile(wb, "Template_Sikeka.xlsx");
  });
}

function handleExcelUpload(e) {
  let file = e.target.files[0]; if (!file) return;
  customConfirm(`Upload data dari ${file.name}?`, () => {
      document.getElementById("globalLoader").classList.add("active"); let reader = new FileReader();
      reader.onload = function(evt) {
        let data = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(evt.target.result), {type: "array"}).Sheets[XLSX.read(new Uint8Array(evt.target.result), {type: "array"}).SheetNames[0]], {header:1});
        callAPI("importDataExcel", { excelData: data }).then(res => { customAlert(`Berhasil upload ${res.count} baris.`, "Sukses", () => window.location.reload()); })
        .catch(err => { document.getElementById("globalLoader").classList.remove("active"); customAlert(err.message); });
      };
      reader.readAsArrayBuffer(file);
  });
}

// UTIL
function showDynamicModal(title, msg, btns) { document.getElementById("modalTitle").innerText = title; document.getElementById("modalMessage").innerHTML = msg; document.getElementById("modalActionsContainer").innerHTML = btns; document.getElementById("customModal").classList.add("active"); }
function closeCustomModal() { document.getElementById("customModal").classList.remove("active"); }
function customAlert(msg, title="Info", cb=null) { window.tempCb = () => { closeCustomModal(); if(cb) cb(); }; showDynamicModal(title, msg, `<button class="btn btn-primary" onclick="window.tempCb()">OK</button>`); }
function customConfirm(msg, onConfirm) { window.tempCf = () => { closeCustomModal(); if(onConfirm) onConfirm(); }; showDynamicModal("Konfirmasi", msg, `<button class="btn btn-outline" onclick="closeCustomModal()">Batal</button><button class="btn btn-primary" onclick="window.tempCf()">Ya</button>`); }
function cetakKlasemen() { document.getElementById("printTimestamp").innerText = `Dicetak: ${new Date().toLocaleString("id-ID")} WIB`; window.print(); }