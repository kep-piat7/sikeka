// =========================================================================
// PENGATURAN API & GOOGLE LOGIN (WAJIB DIISI)
// =========================================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbxSTxdco3HFv6qD07k262Yen64myCaRX28gezJCigRYCSm9aNbHC9Nv-ApQfLB5ykpAHA/exec";
const GOOGLE_CLIENT_ID =
  "582583731525-q3nc2v22sspdef6faqio3f9bou9f0ioa.apps.googleusercontent.com";

// =========================================================================

const iconSun = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
const iconMoon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

let USER_EMAIL = "";
let APP_DATA = null;
let CURRENT_USER = {
  nama: "Pengguna",
  namaLengkap: "Pengguna",
  email: "",
  role: "Ustadz",
  track: "Ustadz",
};
let BOOKED_DATES = {};
let FULL_KLASEMEN = [];
let TODAY_STATE = { status: "empty", penginput: "" };

let formLayoutMode = "wizard";
let undoCountdownInterval = null;
let pendingPayload = null;

let SELECTED_MONTH = new Date().getMonth();
let SELECTED_YEAR = new Date().getFullYear();

let calCurrentDate = new Date();
let calViewMonth = calCurrentDate.getMonth();
let calViewYear = calCurrentDate.getFullYear();

let scrollStore = {};
let modalCloseTimeout;

const SYUQQOH_GROUPS = [
  {
    name: "Syuqqoh Arafah",
    rooms: [
      "Arafah 1",
      "Arafah 2",
      "Arafah 3",
      "Arafah 4",
      "Arafah 5",
      "Arafah 6",
    ],
  },
  {
    name: "Syuqqoh Muzdalifah",
    rooms: [
      "Muzdalifah 1",
      "Muzdalifah 2",
      "Muzdalifah 3",
      "Muzdalifah 5",
      "Muzdalifah 6",
    ],
  },
  {
    name: "Syuqqoh Mina",
    rooms: ["Mina 1", "Mina 2", "Mina 3", "Mina 4", "Mina 5", "Mina 6"],
  },
  {
    name: "Syuqqoh Thaif",
    rooms: [
      "Thaif 1",
      "Thaif 2",
      "Thaif 3",
      "Thaif 4",
      "Thaif 5",
      "Thaif 6",
    ],
  },
  {
    name: "Xativa & Sevilla",
    rooms: [
      "Xativa 1",
      "Xativa 2",
      "Xativa 4",
      "Sevilla 1",
      "Sevilla 2",
      "Sevilla 4",
    ],
  },
  {
    name: "Granada & Qordoba",
    rooms: [
      "Granada 1",
      "Granada 2",
      "Granada 3",
      "Granada 4",
      "Qordoba 2",
      "Qordoba 3",
      "Qordoba 4",
    ],
  },
  {
    name: "Awali & Uhud",
    rooms: ["Awali 1", "Uhud 1", "Uhud 2", "Uhud 3", "Uhud 4"],
  },
];
let currentFormPage = 0;
let isSubmitting = false;

window.onload = function () {
  const isDark = document.documentElement.classList.contains("dark");
  document.querySelectorAll(".themeIconContainer").forEach((el) => {
    el.innerHTML = isDark ? iconMoon : iconSun;
  });

  const savedEmail = localStorage.getItem("sikeka_user_email");

  if (savedEmail) {
    USER_EMAIL = savedEmail;
    document.getElementById("loginScreen").classList.remove("active");
    document.getElementById("globalLoader").style.display = "flex";
    initAppData();
  } else {
    if (typeof google !== "undefined" && google.accounts) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("googleSignInBtn"),
        { theme: "outline", size: "large", shape: "pill", width: 250 },
      );
    } else {
      console.warn(
        "Google Client SDK tidak termuat. Anda dapat masuk menggunakan Bypass Otorisasi.",
      );
    }
  }
};

function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  USER_EMAIL = data.email;
  localStorage.setItem("sikeka_user_email", USER_EMAIL);
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("globalLoader").style.display = "flex";
  initAppData();
}

function loginWithBypass() {
  const emailInput = document.getElementById("bypassEmailInput");
  const email = emailInput ? emailInput.value.trim() : "admin@sikeka.com";
  if (!email) {
    customAlert("Silakan masukkan email untuk bypass.");
    return;
  }
  USER_EMAIL = email;
  localStorage.setItem("sikeka_user_email", USER_EMAIL);
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("globalLoader").style.display = "flex";
  initAppData();
}

function logout() {
  localStorage.removeItem("sikeka_user_email");
  window.location.reload();
}

function confirmLogout() {
  customConfirm(
    "Apakah Anda yakin ingin keluar dari akun sistem Sikeka ini?",
    function () {
      logout();
    },
    "Konfirmasi Keluar",
  );
}

function callGasAPI(actionName, payloadData = {}) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: actionName,
      email: USER_EMAIL,
      payload: payloadData,
    }),
  })
    .then((response) => response.json())
    .then((json) => {
      if (!json.success) throw new Error(json.message);
      return json.data;
    });
}

function initAppData() {
  callGasAPI("getInitData")
    .then(function (data) {
      if (data.isRegistered === false) {
        document.getElementById("globalLoader").style.display = "none";
        document.getElementById("unauthEmail").innerText =
          data.user.email;
        document
          .querySelectorAll(".screen")
          .forEach((el) => el.classList.remove("active"));
        document
          .getElementById("unauthorizedScreen")
          .classList.add("active");
        document.getElementById("mainFooter").style.display = "none";
        return;
      }

      document.getElementById("globalLoader").style.display = "none";
      APP_DATA = data;
      CURRENT_USER = data.user;
      BOOKED_DATES = data.bookedDates;
      FULL_KLASEMEN = data.klasemen.all;
      TODAY_STATE = data.todayState;

      let prefixSapaan = CURRENT_USER.role === "JT" ? "" : "Ustadz ";
      document.getElementById("dashUserSapaan").innerText =
        prefixSapaan + CURRENT_USER.nama;

      populateDropdown(data.availableMonths || []);

      document.getElementById("judulKlasemen").innerText =
        "Klasemen " + data.bulanAktif;
      document.getElementById("printJudulKlasemen").innerText =
        "Klasemen Penilaian Kebersihan Kamar - " + data.bulanAktif;

      renderKlasemenDashboard(data.klasemen);
      renderKlasemenLengkap(FULL_KLASEMEN);
      renderFooterButtons();

      navTo("dashboardScreen");

      if (CURRENT_USER.role !== "JT") tampilkanPopupAwal();
    })
    .catch(function (error) {
      document.getElementById("globalLoader").style.display = "none";
      localStorage.removeItem("sikeka_user_email");
      customAlert(
        "Gagal terhubung ke server database. Silakan muat ulang halaman.<br><br>Pesan Sistem: " +
        error.message,
        "Akses Terblokir",
        function () {
          window.location.reload();
        },
      );
    });
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  document.querySelectorAll(".themeIconContainer").forEach((el) => {
    el.innerHTML = isDark ? iconMoon : iconSun;
  });
}

function navTo(screenId, isBackOrTab = false) {
  const current = document.querySelector(".screen.active");
  if (current) {
    scrollStore[current.id] = window.scrollY || window.pageYOffset;
    current.classList.remove("active");
  }
  const target = document.getElementById(screenId);
  target.classList.add("active");

  document.getElementById("mainFooter").style.display =
    screenId === "dashboardScreen" ? "block" : "none";

  if (isBackOrTab && scrollStore[screenId] !== undefined) {
    setTimeout(() => window.scrollTo(0, scrollStore[screenId]), 10);
  } else {
    setTimeout(() => window.scrollTo(0, 0), 10);
  }

  if (screenId === "bookingScreen") renderCalendar();
  if (screenId === "formScreen") initializeFormPages();
}

function reloadSystemData() {
  document.getElementById("globalLoader").style.display = "flex";
  callGasAPI("getInitData")
    .then(function (data) {
      if (data.isRegistered === false) {
        document.getElementById("globalLoader").style.display = "none";
        document.getElementById("unauthEmail").innerText =
          data.user.email;
        document
          .querySelectorAll(".screen")
          .forEach((el) => el.classList.remove("active"));
        document
          .getElementById("unauthorizedScreen")
          .classList.add("active");
        document.getElementById("mainFooter").style.display = "none";
        return;
      }

      document.getElementById("globalLoader").style.display = "none";
      APP_DATA = data;
      CURRENT_USER = data.user;
      BOOKED_DATES = data.bookedDates;
      FULL_KLASEMEN = data.klasemen.all;
      TODAY_STATE = data.todayState;

      let prefixSapaan = CURRENT_USER.role === "JT" ? "" : "Ustadz ";
      document.getElementById("dashUserSapaan").innerText =
        prefixSapaan + CURRENT_USER.nama;

      populateDropdown(data.availableMonths);

      document.getElementById("judulKlasemen").innerText =
        "Klasemen " + data.bulanAktif;
      document.getElementById("printJudulKlasemen").innerText =
        "Klasemen Penilaian Kebersihan Kamar - " + data.bulanAktif;

      renderKlasemenDashboard(data.klasemen);
      renderKlasemenLengkap(FULL_KLASEMEN);
      renderFooterButtons();
      renderCalendar();
      navTo("dashboardScreen");
    })
    .catch(function (error) {
      document.getElementById("globalLoader").style.display = "none";
      customAlert("Gagal merefresh data: " + error.message);
    });
}

function cetakKlasemen() {
  const now = new Date();
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  document.getElementById("printTimestamp").innerText =
    `Dicetak pada: ${now.toLocaleDateString("id-ID", options)} WIB`;
  window.print();
}

function closeCustomModal() {
  var overlay = document.getElementById("customModal");
  overlay.classList.remove("active");
  modalCloseTimeout = setTimeout(
    () => (overlay.style.display = "none"),
    250,
  );
}

function showDynamicModal(
  title,
  message,
  buttonsHTML,
  showCloseBtn = false,
) {
  clearTimeout(modalCloseTimeout);
  var overlay = document.getElementById("customModal");
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerHTML = message;
  document.getElementById("modalActionsContainer").innerHTML =
    buttonsHTML;
  document.getElementById("modalCloseBtn").style.display = showCloseBtn
    ? "flex"
    : "none";
  overlay.style.display = "flex";
  void overlay.offsetWidth;
  overlay.classList.add("active");
}

function customAlert(message, title = "Pemberitahuan", callback = null) {
  window.tempCallback = function () {
    closeCustomModal();
    if (callback) callback();
  };
  showDynamicModal(
    title,
    message,
    `<button class="btn btn-primary btn-small" onclick="window.tempCallback()">OK</button>`,
  );
}

function customConfirm(message, onConfirm, title = "Konfirmasi") {
  window.tempConfirm = function () {
    closeCustomModal();
    if (onConfirm) onConfirm();
  };
  showDynamicModal(
    title,
    message,
    `<button class="btn btn-outline btn-small" onclick="closeCustomModal()">Batal</button><button class="btn btn-danger btn-small" onclick="window.tempConfirm()">Ya, Lanjutkan</button>`,
  );
}

// DROPDOWN BULAN KLASEMEN
function populateDropdown(monthsArray) {
  let dd = document.getElementById("bulanKlasemenDropdown");
  if (!dd) return;
  dd.innerHTML = "";

  if (!monthsArray || monthsArray.length === 0) {
    let opt = document.createElement("option");
    opt.value = SELECTED_YEAR + "-" + SELECTED_MONTH;
    opt.text = "Bulan Ini";
    dd.appendChild(opt);
  } else {
    monthsArray.forEach((m) => {
      let opt = document.createElement("option");
      opt.value = m.value;
      opt.text = m.label;
      dd.appendChild(opt);
    });
  }
  dd.value = SELECTED_YEAR + "-" + SELECTED_MONTH;
}

function loadKlasemenBulanIni() {
  let val = document.getElementById("bulanKlasemenDropdown").value;
  if (!val) return;

  let pts = val.split("-");
  SELECTED_YEAR = parseInt(pts[0]);
  SELECTED_MONTH = parseInt(pts[1]);

  document.getElementById("globalLoader").style.display = "flex";

  callGasAPI("getKlasemenBulan", {
    targetMonth: SELECTED_MONTH,
    targetYear: SELECTED_YEAR,
  })
    .then(function (res) {
      document.getElementById("globalLoader").style.display = "none";
      FULL_KLASEMEN = res.klasemen.all;
      document.getElementById("judulKlasemen").innerText =
        "Klasemen " + res.bulanAktif;
      document.getElementById("printJudulKlasemen").innerText =
        "Klasemen Penilaian Kebersihan Kamar - " + res.bulanAktif;
      renderKlasemenLengkap(FULL_KLASEMEN);
    })
    .catch(function (error) {
      document.getElementById("globalLoader").style.display = "none";
      customAlert("Gagal memuat data klasemen: " + error.message);
    });
}

function renderFooterButtons() {
  let html = "";

  if (CURRENT_USER.role === "JT") {
    html = `
    <button class="btn btn-primary" style="flex: 1; font-size: 16px; height: 60px; border-radius: var(--radius-lg);" onclick="navTo('exportScreen')">
      <svg style="width:24px; height:24px; margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      Impor Data
    </button>`;
  } else if (CURRENT_USER.role === "Admin") {
    let btnText = "Mulai Penilaian";
    let btnDisabled = "";
    let btnClass = "btn-primary";
    if (TODAY_STATE.status === "filled") {
      btnText = "Selesai";
      btnDisabled = "disabled";
    } else if (TODAY_STATE.status === "booked_by_other") {
      btnText = "Jadwal " + TODAY_STATE.penginput;
      btnDisabled = "disabled";
    }

    html = `
    <button class="btn btn-danger" style="width: 60px; height: 60px; border-radius: var(--radius-lg); padding: 0; flex-shrink: 0;" onclick="navTo('bookingScreen')" title="Booking Tanggal">
      <svg style="width:28px; height:28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    </button>
    <button class="btn ${btnClass}" style="flex: 1; font-size: 14px; height: 60px; border-radius: var(--radius-lg);" onclick="navTo('formScreen')" ${btnDisabled}>
      <svg style="width:20px; height:20px; margin-right:6px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      ${btnText}
    </button>
    <button class="btn btn-success" style="width: 60px; height: 60px; border-radius: var(--radius-lg); padding: 0; flex-shrink: 0;" onclick="navTo('exportScreen')" title="Impor Data Excel">
       <svg style="width:28px; height:28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    </button>`;
  } else {
    let btnText = "Mulai Penilaian";
    let btnDisabled = "";
    let btnClass = "btn-primary";
    if (TODAY_STATE.status === "filled") {
      btnText = "Selesai Dinilai Hari Ini";
      btnDisabled = "disabled";
    } else if (TODAY_STATE.status === "booked_by_other") {
      btnText = "Jadwal " + TODAY_STATE.penginput;
      btnDisabled = "disabled";
    }

    html = `
    <button class="btn btn-danger" style="width: 60px; height: 60px; border-radius: var(--radius-lg); padding: 0; flex-shrink: 0;" onclick="navTo('bookingScreen')" title="Booking Tanggal">
      <svg style="width:28px; height:28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    </button>
    <button class="btn ${btnClass}" style="flex: 1; font-size: 16px; height: 60px; border-radius: var(--radius-lg);" onclick="navTo('formScreen')" ${btnDisabled}>
      <svg style="width:24px; height:24px; margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      ${btnText}
    </button>`;
  }
  document.getElementById("footerActionContainer").innerHTML = html;
}

function tampilkanPopupAwal() {
  let title = "Ahlan wa Sahlan!";
  let msg =
    "Anda belum mem-booking jadwal untuk hari ini. Anda bisa mengecek Kalender Booking terlebih dahulu, atau langsung memulai form jika jadwal sedang kosong.";
  window.goToBooking = function () {
    closeCustomModal();
    navTo("bookingScreen");
  };
  window.goToFormAction = function () {
    closeCustomModal();
    navTo("formScreen");
  };

  let buttons = `<button class="btn btn-outline btn-small" onclick="window.goToBooking()">📅 Kalender</button><button class="btn btn-primary btn-small" onclick="window.goToFormAction()">Mulai Form</button>`;

  if (TODAY_STATE.status === "filled") {
    title = "Info Penilaian";
    msg =
      "Alhamdulillah, data penilaian kebersihan untuk hari ini sudah berhasil diinput dan masuk ke sistem.";
    buttons = `<button class="btn btn-primary btn-small" onclick="closeCustomModal()">Tutup</button>`;
  } else if (TODAY_STATE.status === "booked_by_me") {
    title = "Jadwal Anda Hari Ini!";
    let prefixSapaan = CURRENT_USER.role === "JT" ? "" : "Ustadz ";
    msg = `Semangat bertugas ${prefixSapaan}<b>${CURRENT_USER.nama}</b>! Berdasarkan sistem, hari ini adalah jadwal antum untuk mengisi form Penilaian Kebersihan Kamar.`;
    buttons = `<button class="btn btn-outline btn-small" onclick="closeCustomModal()">Tutup</button><button class="btn btn-primary btn-small" onclick="window.goToFormAction()">Mulai Form</button>`;
  } else if (TODAY_STATE.status === "booked_by_other") {
    title = "Informasi Jadwal";
    msg = `Jadwal penilaian hari ini telah di-booking oleh <b>${TODAY_STATE.penginput}</b>. Anda tetap dapat mengakses aplikasi atau melihat kalender untuk mem-booking hari lain.`;
    buttons = `<button class="btn btn-outline btn-small" onclick="closeCustomModal()">Tutup</button><button class="btn btn-danger btn-small" onclick="window.goToBooking()">Lihat Kalender</button>`;
  }
  showDynamicModal(title, msg, buttons, true);
}

function toggleFormLayout() {
  formLayoutMode = formLayoutMode === "wizard" ? "scroll" : "wizard";
  const btn = document.getElementById("btnToggleLayout");
  if (btn) {
    btn.innerText = formLayoutMode === "wizard" ? "Mode Scroll" : "Mode Wizard";
  }
  initializeFormPages();
}

function initializeFormPages() {
  currentFormPage = 0;
  let container = document.getElementById("formPagesContainer");
  let html = "";

  if (formLayoutMode === "scroll") {
    SYUQQOH_GROUPS.forEach((group, index) => {
      html += `<div class="form-page active" id="formPage_${index}" style="margin-bottom: 28px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 24px;">
        <div class="form-header-group" style="margin-bottom: 16px;">${group.name}</div>`;
      group.rooms.forEach((room) => {
        html += `<div class="form-row"><label>${room}</label><input type="number" id="inp_${room.replace(/\s+/g, "_")}" min="0" max="100" placeholder="-"></div>`;
      });
      html += `</div>`;
    });
  } else {
    SYUQQOH_GROUPS.forEach((group, index) => {
      let displayState = index === 0 ? "active" : "";
      html += `<div class="form-page ${displayState}" id="formPage_${index}"><div class="form-header-group">${group.name}</div>`;
      group.rooms.forEach((room) => {
        html += `<div class="form-row"><label>${room}</label><input type="number" id="inp_${room.replace(/\s+/g, "_")}" min="0" max="100" placeholder="-"></div>`;
      });
      html += `</div>`;
    });
  }
  container.innerHTML = html;
  updateFormNavigation();
}

function changeFormPage(direction) {
  if (formLayoutMode === "scroll") return;
  document
    .getElementById(`formPage_${currentFormPage}`)
    .classList.remove("active");
  currentFormPage += direction;
  if (currentFormPage >= SYUQQOH_GROUPS.length) {
    currentFormPage = SYUQQOH_GROUPS.length - 1;
    document
      .getElementById(`formPage_${currentFormPage}`)
      .classList.add("active");
    if (isSubmitting) return;
    customConfirm(
      "Apakah Anda yakin data penilaian sudah benar dan ingin menyimpannya? Anda tidak bisa mengedit kembali setelah ini.",
      function () {
        executeSavePenilaian();
      },
      "Simpan Penilaian",
    );
    return;
  }
  document
    .getElementById(`formPage_${currentFormPage}`)
    .classList.add("active");
  window.scrollTo(0, 0);
  updateFormNavigation();
}

function updateFormNavigation() {
  let btnPrev = document.getElementById("btnFormPrev");
  let btnNext = document.getElementById("btnFormNext");
  let progressText = document.getElementById("formProgressText");

  if (formLayoutMode === "scroll") {
    progressText.innerText = "Mode Tinjau Semua Kamar";
    btnPrev.style.display = "none";
    btnNext.style.display = "block";
    btnNext.className = "btn btn-success";
    btnNext.innerText = "Simpan Penilaian";
    btnNext.onclick = function () {
      if (isSubmitting) return;
      customConfirm(
        "Apakah Anda yakin data penilaian sudah benar dan ingin menyimpannya? Anda tidak bisa mengedit kembali setelah ini.",
        function () {
          executeSavePenilaian();
        },
        "Simpan Penilaian",
      );
    };
  } else {
    btnNext.onclick = function () { changeFormPage(1); };
    progressText.innerText = `Halaman ${currentFormPage + 1} dari ${SYUQQOH_GROUPS.length}`;
    if (currentFormPage === 0) btnPrev.style.display = "none";
    else btnPrev.style.display = "block";

    if (currentFormPage === SYUQQOH_GROUPS.length - 1) {
      btnNext.className = "btn btn-success";
      btnNext.innerText = "Simpan";
    } else {
      btnNext.className = "btn btn-primary";
      btnNext.innerText = "Selanjutnya";
    }
  }
}

function executeSavePenilaian() {
  let hasError = false;
  let errorPageIndex = -1;
  let payload = {};
  for (let i = 0; i < SYUQQOH_GROUPS.length; i++) {
    let group = SYUQQOH_GROUPS[i];
    for (let j = 0; j < group.rooms.length; j++) {
      let room = group.rooms[j];
      let val = document.getElementById(
        `inp_${room.replace(/\s+/g, "_")}`,
      ).value;
      if (val.trim() === "") {
        hasError = true;
        if (errorPageIndex === -1) errorPageIndex = i;
      }
      payload[room] = val;
    }
  }
  if (hasError) {
    customAlert(
      "Ada kamar yang belum dinilai. Silakan lengkapi seluruh penilaian kamar terlebih dahulu.",
      "Data Belum Lengkap",
      function () {
        if (formLayoutMode === "wizard") {
          document
            .getElementById(`formPage_${currentFormPage}`)
            .classList.remove("active");
          currentFormPage = errorPageIndex;
          document
            .getElementById(`formPage_${currentFormPage}`)
            .classList.add("active");
          updateFormNavigation();
        }
        window.scrollTo(0, 0);
      },
    );
    return;
  }

  pendingPayload = payload;
  showUndoToast(5);
}

function showUndoToast(seconds) {
  const toast = document.getElementById("undoToast");
  const countdownEl = document.getElementById("undoCountdown");
  if (!toast || !countdownEl) return;

  toast.classList.add("show");
  countdownEl.innerText = seconds;

  let timeLeft = seconds;
  clearInterval(undoCountdownInterval);
  undoCountdownInterval = setInterval(() => {
    timeLeft--;
    countdownEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(undoCountdownInterval);
      toast.classList.remove("show");
      proceedWithSave();
    }
  }, 1000);
}

function triggerUndoSave() {
  clearInterval(undoCountdownInterval);
  const toast = document.getElementById("undoToast");
  if (toast) toast.classList.remove("show");
  pendingPayload = null;
  customAlert("Penyimpanan dibatalkan. Anda dapat mengoreksi nilai kembali.", "Dibatalkan");
}

function proceedWithSave() {
  if (!pendingPayload) return;
  isSubmitting = true;
  document.getElementById("globalLoader").style.display = "flex";

  callGasAPI("savePenilaian", { penilaianMap: pendingPayload })
    .then(function (res) {
      isSubmitting = false;
      pendingPayload = null;
      customAlert(
        "Data penilaian hari ini berhasil disimpan!",
        "Alhamdulillah",
        function () {
          reloadSystemData();
        },
      );
    })
    .catch(function (error) {
      isSubmitting = false;
      pendingPayload = null;
      document.getElementById("globalLoader").style.display = "none";
      customAlert("Terjadi kesalahan jaringan: " + error.message);
    });
}

function renderKlasemenDashboard(data) {
  let topHtml = "";
  if (data.top3.length === 0)
    topHtml = `<div class="list-row"><span style="color:var(--text-muted); font-weight:400;">Belum ada data...</span></div>`;
  data.top3.forEach((item, index) => {
    let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
    topHtml += `<div class="list-row"><span><span style="margin-right:8px; font-size:1.1rem; line-height:1;">${medal}</span> <b>${item.kamar}</b></span><span class="badge-score bg-top">${item.nilai}</span></div>`;
  });
  document.getElementById("top3Container").innerHTML = topHtml;

  let bottomHtml = "";
  if (data.bottom3.length === 0)
    bottomHtml = `<div class="list-row"><span style="color:var(--text-muted); font-weight:400;">Belum ada data...</span></div>`;
  data.bottom3.forEach((item, index) => {
    let rankAkurat = data.all.length - data.bottom3.length + index + 1;
    bottomHtml += `<div class="list-row"><span><span style="color:var(--text-muted); margin-right:8px; font-weight:700;">#${rankAkurat}</span> ${item.kamar}</span><span class="badge-score bg-bottom">${item.nilai}</span></div>`;
  });
  document.getElementById("bottom3Container").innerHTML = bottomHtml;
}

function renderKlasemenLengkap(allData) {
  let html = "";
  if (allData.length === 0) {
    html = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-weight:400;">Belum ada data penilaian</td></tr>`;
  } else {
    allData.forEach((item, index) => {
      let pos = index + 1;
      let rankDisp = `<span style="font-weight:700; color:var(--text-muted);">#${pos}</span>`;
      if (pos === 1) rankDisp = "🥇";
      else if (pos === 2) rankDisp = "🥈";
      else if (pos === 3) rankDisp = "🥉";

      let badgeClass = "badge-score";
      if (pos <= 3) badgeClass += " bg-top";
      else if (pos >= allData.length - 2 && allData.length > 5)
        badgeClass += " bg-bottom";
      else badgeClass += " bg-baltic";
      let scoreHtml = `<span class="${badgeClass}" style="${badgeClass.includes("bg-baltic") ? "background:var(--brand-main);" : ""}">${item.nilai}</span>`;
      html += `<tr onclick="bukaDetailKamar('${item.kamar}')"><td class="rank-col" style="font-size:1.1rem; text-align:center;">${rankDisp}</td><td><b>${item.kamar}</b></td><td style="text-align: right;">${scoreHtml}</td></tr>`;
    });
  }
  document.getElementById("fullKlasemenBody").innerHTML = html;
}

function bukaDetailKamar(roomName) {
  document.getElementById("globalLoader").style.display = "flex";
  document.getElementById("detailKamarTitle").innerText =
    "Detail " + roomName;

  callGasAPI("getRoomHistory", {
    roomName: roomName,
    filterMonth: SELECTED_MONTH,
    filterYear: SELECTED_YEAR,
  })
    .then(function (history) {
      document.getElementById("globalLoader").style.display = "none";
      let html = "";
      if (history.length === 0) {
        html = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-weight:400;">Tidak ada riwayat di bulan ini</td></tr>`;
      } else {
        history.forEach((item) => {
          html += `<tr><td style="font-size:13px; color:var(--text-secondary);">${item.tanggal}</td><td>${item.penginput}</td><td style="text-align: right; font-weight:700; color:var(--brand-main);">${item.nilai}</td></tr>`;
        });
      }
      document.getElementById("detailKamarBody").innerHTML = html;
      navTo("detailKamarScreen");
    })
    .catch(function (error) {
      document.getElementById("globalLoader").style.display = "none";
      customAlert("Gagal memuat detail: " + error.message);
    });
}

function changeMonth(dir) {
  calViewMonth += dir;
  if (calViewMonth < 0) {
    calViewMonth = 11;
    calViewYear--;
  } else if (calViewMonth > 11) {
    calViewMonth = 0;
    calViewYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const NAMA_BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const NAMA_HARI = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  function getFormatDateKey(d) {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  }

  document.getElementById("calMonthYear").innerText =
    `${NAMA_BULAN[calViewMonth]} ${calViewYear}`;
  const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
  const daysInMonth = new Date(
    calViewYear,
    calViewMonth + 1,
    0,
  ).getDate();
  let html = "";
  const todayKey = getFormatDateKey(new Date());

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-cell empty"></div>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const loopDate = new Date(calViewYear, calViewMonth, day);
    const dateKey = getFormatDateKey(loopDate);
    const isToday = dateKey === todayKey ? "today" : "";
    loopDate.setHours(23, 59, 59, 999);
    const isPast = loopDate < new Date();
    let paramDateStr = `${NAMA_HARI[loopDate.getDay()]}, ${day} ${NAMA_BULAN[calViewMonth]} ${calViewYear}`;

    if (BOOKED_DATES[dateKey] && BOOKED_DATES[dateKey].trim() !== "" && BOOKED_DATES[dateKey] !== "clear" && BOOKED_DATES[dateKey] !== "cancel") {
      const bookedName = BOOKED_DATES[dateKey];
      const isBookedByMe = bookedName === CURRENT_USER.namaLengkap;
      if (isBookedByMe) {
        html += `<div class="calendar-cell booked booked-by-me ${isToday}" onclick="prosesCancelBooking('${dateKey}', '${paramDateStr}')" title="Klik untuk membatalkan booking Anda"><div class="booked-dot"></div>${day}<span class="booked-name">ANDA</span></div>`;
      } else {
        html += `<div class="calendar-cell booked ${isToday}"><div class="booked-dot"></div>${day}<span class="booked-name">${bookedName.substring(0, 6)}..</span></div>`;
      }
    } else if (isPast) {
      html += `<div class="calendar-cell empty" style="color:var(--text-muted); opacity:0.5;">${day}</div>`;
    } else {
      html += `<div class="calendar-cell available ${isToday}" onclick="prosesBooking('${dateKey}', '${paramDateStr}')">${day}</div>`;
    }
  }
  document.getElementById("calendarDays").innerHTML = html;
}

function prosesCancelBooking(dateKey, displayStr) {
  customConfirm(
    `Apakah Anda ingin MEMBATALKAN booking jadwal penilaian kebersihan pada hari:\n\n<b>${displayStr}</b>?`,
    function () {
      document.getElementById("globalLoader").style.display = "flex";

      callGasAPI("submitBooking", {
        dateKey: dateKey,
        namaUser: "clear", // Use truthy "clear" token to override the cell value in Google Sheets
      })
        .then(function (res) {
          document.getElementById("globalLoader").style.display = "none";
          delete BOOKED_DATES[dateKey];
          customAlert(
            `Booking berhasil dibatalkan untuk tanggal ${displayStr}!`,
            "Sukses",
            function () {
              reloadSystemData();
            },
          );
        })
        .catch(function (error) {
          document.getElementById("globalLoader").style.display = "none";
          customAlert("Gagal membatalkan booking: " + error.message);
        });
    },
    "Konfirmasi Pembatalan Booking",
  );
}

function prosesBooking(dateKey, displayStr) {
  customConfirm(
    `Apakah Anda ingin mem-booking jadwal penilaian kebersihan pada hari:\n\n<b>${displayStr}</b>?`,
    function () {
      document.getElementById("globalLoader").style.display = "flex";

      callGasAPI("submitBooking", {
        dateKey: dateKey,
        namaUser: CURRENT_USER.namaLengkap,
      })
        .then(function (res) {
          document.getElementById("globalLoader").style.display = "none";
          BOOKED_DATES[dateKey] = CURRENT_USER.namaLengkap;
          customAlert(
            `Booking berhasil untuk tanggal ${displayStr}!`,
            "Sukses",
            function () {
              reloadSystemData();
            },
          );
        })
        .catch(function (error) {
          document.getElementById("globalLoader").style.display = "none";
          customAlert("Gagal Booking: " + error.message);
        });
    },
    "Konfirmasi Booking",
  );
}

function downloadTemplateExcel() {
  document.getElementById("globalLoader").style.display = "flex";

  callGasAPI("getRoomHeaders")
    .then(function (roomNames) {
      document.getElementById("globalLoader").style.display = "none";
      var headerRow = ["Tanggal"].concat(roomNames);
      var ws = XLSX.utils.aoa_to_sheet([headerRow]);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Template_Impor_Sikeka.xlsx");
    })
    .catch(function (error) {
      document.getElementById("globalLoader").style.display = "none";
      customAlert("Gagal mengunduh template: " + error.message);
    });
}

function handleExcelUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    customAlert(
      "Format file salah. Harap unggah file Excel (.xlsx atau .xls).",
      "Gagal",
    );
    event.target.value = "";
    return;
  }
  document.getElementById("uploadFileName").innerText =
    "File siap: " + file.name;

  customConfirm(
    "Data dari file <b>" +
    file.name +
    "</b> akan ditambahkan ke sistem sebagai data baru. Lanjutkan?",
    function () {
      document.getElementById("globalLoader").style.display = "flex";
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var firstSheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[firstSheetName];
        var excelData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
        });

        callGasAPI("importDataExcel", { excelData: excelData })
          .then(function (res) {
            document.getElementById("globalLoader").style.display =
              "none";
            var pesanSukses =
              "Berhasil mengimpor <b>" +
              res.count +
              "</b> baris data baru ke sistem!";
            if (res.skipped > 0) {
              pesanSukses +=
                "<br><br><span style='color:var(--error-text); font-size:13px;'><b>Info:</b> " +
                res.skipped +
                " baris data dilewati (skip) karena tanggal tersebut sudah ada di jalur antum (Mencegah duplikat).</span>";
            }
            customAlert(pesanSukses, "Laporan Impor", function () {
              reloadSystemData();
            });

            document.getElementById("fileExcelInput").value = "";
            document.getElementById("uploadFileName").innerText = "";
          })
          .catch(function (error) {
            document.getElementById("globalLoader").style.display =
              "none";
            customAlert("Error jaringan: " + error.message);
            document.getElementById("fileExcelInput").value = "";
          });
      };
      reader.readAsArrayBuffer(file);
    },
    "Konfirmasi Impor",
  );
}
