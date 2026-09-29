(function () {
  "use strict";

  /* ───────── i18n ───────── */
  var dict = {
    en: {
      entry_intro: "INTRODUCING", entry_signup: "Sign Up", entry_signin: "Sign In",
      footer_website: "Visit our website", footer_contact: "Contact Sales & Support",
      footer_terms: "Terms of Use & Policy", footer_browse: "Browse all videos",
      btn_addfiles: "Add files", btn_mode: "Mode", btn_send: "Send", btn_confirm: "Confirm",
      type_here: "Type here...",
      video_placeholder: "Your generated video will appear here",
      video_generating: "Generating…",
      mode_text: "Text → Video", mode_text_desc: "5000 symbols max. No additional files supported.",
      mode_ti: "Text & Image → Video", mode_ti_desc: "5000 symbols max. Up to 2 images (PNG, JPG, JPEG, WEBP), <20MB each.",
      mode_fs: "Full-Stack → Video", mode_fs_desc: "5000 symbols max. Up to 5 elements: images or video (<10s, <100MB). Formats: PNG, JPG, JPEG, WEBP, MP4, MOV.",
      mode_audio: "Audio-generation", mode_duration: "Duration", mode_ratio: "Ratio",
      balance_label: "Your Balance:", balance_warn: "Warning! Payment works in and goes to OpenRouter.",
      topup_title: "Wanna top up? ---------- $0.1 per second", topup_unit_sec: "s"
    },
    ru: {
      entry_intro: "ЗНАКОМЬТЕСЬ", entry_signup: "Регистрация", entry_signin: "Вход",
      footer_website: "Наш сайт", footer_contact: "Отдел продаж и поддержка",
      footer_terms: "Условия использования и политика", footer_browse: "Все видео",
      btn_addfiles: "Файлы", btn_mode: "Режим", btn_send: "Отправить", btn_confirm: "Подтвердить",
      type_here: "Введите текст...",
      video_placeholder: "Здесь появится сгенерированное видео",
      video_generating: "Генерация…",
      mode_text: "Текст → Видео", mode_text_desc: "До 5000 символов. Дополнительные файлы не поддерживаются.",
      mode_ti: "Текст и изображение → Видео", mode_ti_desc: "До 5000 символов. До 2 изображений (PNG, JPG, JPEG, WEBP), <20MB каждое.",
      mode_fs: "Full-Stack → Видео", mode_fs_desc: "До 5000 символов. До 5 элементов: изображения или видео (<10с, <100MB). Форматы: PNG, JPG, JPEG, WEBP, MP4, MOV.",
      mode_audio: "Генерация звука", mode_duration: "Длительность", mode_ratio: "Соотношение",
      balance_label: "Ваш баланс:", balance_warn: "Внимание! Оплата проходит и уходит напрямую в OpenRouter.",
      topup_title: "Пополнить баланс? ---------- $0.1 за секунду", topup_unit_sec: "с"
    }
  };

  var state = {
    lang: "en",
    mode: null,           // 'text' | 'text-image' | 'fullstack'
    audio: "O",            // 'I' | 'O'
    duration: 15,
    ratio: "16/9",
    files: [],
    balanceSec: 0
  };

  function t(key) { return dict[state.lang][key] || key; }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-template]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-template");
      if (key === "topup_title") el.textContent = t("topup_title");
    });
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.classList.toggle("chosen", b.getAttribute("data-lang") === state.lang);
    });
    document.getElementById("char-count").textContent =
      document.getElementById("prompt-input").value.length + " / 5000";
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.getAttribute("data-lang");
      applyI18n();
    });
  });

  /* ───────── double-press-to-activate ─────────
     First tap arms the button (white stroke). Second tap, while armed,
     fires the action. Tapping a different armable button re-arms that
     one instead and disarms the previous one. */
  var armed = null;

  function wireArmable(el, action) {
    el.classList.add("btn2", "armable");
    el.addEventListener("click", function (e) {
      if (el.hasAttribute("disabled")) return;
      if (armed === el) {
        el.classList.remove("armed");
        armed = null;
        action(e);
      } else {
        if (armed) armed.classList.remove("armed");
        armed = el;
        el.classList.add("armed");
      }
    });
  }

  document.querySelectorAll(".armable").forEach(function (el) {
    if (el.dataset.wired) return;
  });

  /* ───────── screen navigation ───────── */
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
    document.getElementById(id).classList.add("active");
  }

  function goToApp() {
    // In production: this fires only after a verified OpenRouter OAuth
    // redirect lands back on this origin with a valid session.
    showScreen("screen-main");
  }

  wireArmable(document.getElementById("btn-gear"), function () { showScreen("screen-settings"); });
  wireArmable(document.getElementById("btn-back"), function () { showScreen("screen-main"); });

  document.querySelectorAll(".auth-btn").forEach(function (b) {
    wireArmable(b, function () {
      // Stub: real build opens OpenRouter's OAuth page in a new tab/redirect.
      // Kept as a no-op placeholder here since there's no live endpoint yet.
      goToApp();
    });
  });

  /* ───────── mode panel ───────── */
  var modeOverlay = document.getElementById("modeOverlay");
  wireArmable(document.getElementById("btn-mode"), function () { modeOverlay.classList.add("show"); });

  document.querySelectorAll(".mode-opt").forEach(function (opt) {
    opt.addEventListener("click", function () {
      document.querySelectorAll(".mode-opt").forEach(function (o) { o.classList.remove("selected"); });
      opt.classList.add("selected");
      state.mode = opt.getAttribute("data-mode");
      updateModeFieldLocks();
    });
  });

  function updateModeFieldLocks() {
    var addFilesBtn = document.getElementById("btn-addfiles");
    if (state.mode === "text") {
      addFilesBtn.setAttribute("disabled", "disabled");
    } else {
      addFilesBtn.removeAttribute("disabled");
    }
  }

  var audioToggle = document.getElementById("audioToggle");
  audioToggle.addEventListener("click", function () {
    state.audio = state.audio === "O" ? "I" : "O";
    audioToggle.textContent = state.audio === "I" ? "ON (I)" : "OFF (O)";
    audioToggle.classList.toggle("selected", state.audio === "I");
  });

  var durVal = document.getElementById("durVal");
  document.getElementById("durMinus").addEventListener("click", function () {
    state.duration = Math.max(2, state.duration - 1);
    durVal.textContent = state.duration + " sec";
  });
  document.getElementById("durPlus").addEventListener("click", function () {
    state.duration = Math.min(30, state.duration + 1);
    durVal.textContent = state.duration + " sec";
  });

  document.querySelectorAll(".ratio-opt").forEach(function (r) {
    r.addEventListener("click", function () {
      document.querySelectorAll(".ratio-opt").forEach(function (o) { o.classList.remove("selected"); });
      r.classList.add("selected");
      state.ratio = r.getAttribute("data-ratio");
    });
  });

  wireArmable(document.getElementById("confirm-mode"), function () {
    if (!state.mode) return; // nothing chosen — panel just stays open
    modeOverlay.classList.remove("show");
    document.getElementById("videoFrame").style.aspectRatio = state.ratio.replace("/", " / ");
    updateSendState();
  });

  /* ───────── send / prompt ───────── */
  var promptInput = document.getElementById("prompt-input");
  promptInput.addEventListener("input", function () {
    document.getElementById("char-count").textContent = promptInput.value.length + " / 5000";
  });

  function updateSendState() {
    var sendBtn = document.getElementById("btn-send");
    if (state.mode) sendBtn.removeAttribute("disabled");
    else sendBtn.setAttribute("disabled", "disabled");
  }

  wireArmable(document.getElementById("btn-send"), function () {
    if (!state.mode) return;
    runGeneration();
  });

  wireArmable(document.getElementById("btn-addfiles"), function () {
    document.getElementById("fileInput").click();
  });

  document.getElementById("fileInput").addEventListener("change", function (e) {
    var max = state.mode === "text-image" ? 2 : state.mode === "fullstack" ? 5 : 0;
    state.files = Array.from(e.target.files).slice(0, max);
    if (state.files.length >= max) {
      document.getElementById("fileInput").setAttribute("disabled", "disabled");
    }
  });

  /* ───────── generation + video playback ─────────
     Swap runGeneration()'s body for a real fetch() to OpenRouter once
     the app is wired to a live account/session. This stub only proves
     out the loading → play → error states in the UI. */
  function runGeneration() {
    var frame = document.getElementById("videoFrame");
    var placeholder = document.getElementById("videoPlaceholder");
    var status = document.getElementById("videoStatus");
    var player = document.getElementById("videoPlayer");

    placeholder.style.display = "none";
    player.style.display = "none";
    status.classList.add("show");
    status.textContent = t("video_generating");

    // Placeholder timing only — replace with the real OpenRouter response.
    setTimeout(function () {
      status.classList.remove("show");
      placeholder.style.display = "block";
    }, 1500);
  }

  async function showGeneratedVideo(url) {
    var player = document.getElementById("videoPlayer");
    var status = document.getElementById("videoStatus");
    status.classList.add("show");
    status.textContent = t("video_generating");
    player.style.display = "none";

    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error("bad response");
      var blob = await res.blob();
      var objectUrl = URL.createObjectURL(blob);
      player.src = objectUrl;
      player.load();
      player.onloadedmetadata = function () {
        status.classList.remove("show");
        player.style.display = "block";
      };
      player.onerror = function () {
        status.textContent = "Couldn't load this video";
      };
    } catch (e) {
      status.textContent = "Couldn't load this video";
    }
  }

  /* ───────── settings: balance / top-up ───────── */
  function renderBalance() {
    document.getElementById("balanceVal").textContent = state.balanceSec + " sec";
  }

  var topupX = document.getElementById("topupX");
  var topupY = document.getElementById("topupY");
  function syncTopup() {
    var sec = Math.max(0, parseInt(topupX.value, 10) || 0);
    topupY.value = (sec * 0.1).toFixed(2);
  }
  topupX.addEventListener("input", syncTopup);

  wireArmable(document.getElementById("confirm-topup"), function () {
    // Stub: real build redirects to OpenRouter's checkout with this
    // amount, then reflects the confirmed balance OpenRouter returns.
    var sec = Math.max(0, parseInt(topupX.value, 10) || 0);
    state.balanceSec += sec;
    renderBalance();
  });

  document.getElementById("browseVideos").addEventListener("click", function (e) {
    e.preventDefault();
    // No filesystem access from a browser tab — point users at their
    // browser's own downloads list instead of a Results/ folder.
    alert(state.lang === "ru"
      ? "Все скачанные видео находятся в папке загрузок вашего браузера."
      : "All downloaded videos are in your browser's downloads folder.");
  });

  /* ───────── init ───────── */
  applyI18n();
  updateModeFieldLocks();
  updateSendState();
  syncTopup();
  renderBalance();
})();