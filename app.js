
import { DICTS, getLang, setLang, t } from "./lib/i18n.js";

const qs = (s) => document.querySelector(s);

const langSelect = qs("#langSelect");
const title = qs("#title");
const heroSub = qs("#heroSub");
const drop = qs("#drop");
const dropTitle = qs("#dropTitle");
const dropSub = qs("#dropSub");
const pPodcast = qs("#pPodcast");
const pInterview = qs("#pInterview");
const pVoiceover = qs("#pVoiceover");
const pField = qs("#pField");

const fileInput = qs("#file");
const cleanBtn = qs("#cleanBtn");
const newBtn = qs("#newBtn");
const resetBtn = qs("#resetBtn");
const statusEl = qs("#status");
const bar = qs("#bar");
const result = qs("#result");
const player = qs("#player");
const abLabel = qs("#abLabel");
const footerNote = qs("#footerNote");
const langLabel = qs("#langLabel");

let currentPreset = "podcast";
let selectedFile = null;
let beforeURL = null;
let afterURL = null;
let currentSource = "before"; // for A/B
let fakeProgressTimer = null;

function applyLang() {
  const dictLang = getLang();
  langSelect.value = dictLang;

  title.textContent = t("hero_title");
  heroSub.textContent = t("drop_sub");
  dropTitle.textContent = t("drop_title");
  dropSub.textContent = t("drop_sub");

  pPodcast.textContent = t("preset_podcast");
  pInterview.textContent = t("preset_interview");
  pVoiceover.textContent = t("preset_voiceover");
  pField.textContent = t("preset_field");

  cleanBtn.textContent = t("btn_clean");
  newBtn.textContent = t("btn_new");
  resetBtn.textContent = t("btn_reset");
  abLabel.textContent = t("ab_label");
  footerNote.textContent = t("footer_note");
  langLabel.textContent = t("lang_label");
}

function setPreset(preset) {
  currentPreset = preset;
  [pPodcast, pInterview, pVoiceover, pField].forEach(btn => btn.classList.remove("active"));
  if (preset === "podcast") pPodcast.classList.add("active");
  if (preset === "interview") pInterview.classList.add("active");
  if (preset === "voiceover") pVoiceover.classList.add("active");
  if (preset === "field") pField.classList.add("active");
}

function resetState() {
  selectedFile = null;
  beforeURL && URL.revokeObjectURL(beforeURL);
  afterURL && URL.revokeObjectURL(afterURL);
  beforeURL = afterURL = null;
  player.removeAttribute("src");
  result.style.display = "none";

  cleanBtn.disabled = true;
  newBtn.disabled = true;
  statusEl.textContent = "";
  statusEl.classList.remove("error");
  bar.style.width = "0%";
  currentSource = "before";
}

function enableFileUI(file) {
  selectedFile = file;
  beforeURL && URL.revokeObjectURL(beforeURL);
  beforeURL = URL.createObjectURL(file);
  currentSource = "before";
  player.src = beforeURL;
  result.style.display = "block";
  cleanBtn.disabled = false;
  newBtn.disabled = false;
}

function fakeProcessingStart() {
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
  let p = 50;
  fakeProgressTimer = setInterval(() => {
    if (p < 95) {
      p += 1;
      bar.style.width = p + "%";
    }
  }, 250);
}

function fakeProcessingStop() {
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
}

function setStatus(text, isError = false) {
  statusEl.textContent = text || "";
  statusEl.classList.toggle("error", !!isError);
}

function errorByCode(status) {
  if (status === 413) return t("error_413");
  if (status === 415) return t("error_415");
  return t("error_500");
}

// --- Events
langSelect.addEventListener("change", () => {
  setLang(langSelect.value);
  applyLang();
});

[pPodcast, pInterview, pVoiceover, pField].forEach(btn => {
  btn.addEventListener("click", () => setPreset(btn.dataset.preset));
});

drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("hover");
});
drop.addEventListener("dragleave", () => drop.classList.remove("hover"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("hover");
  const f = e.dataTransfer.files?.[0];
  if (f) enableFileUI(f);
});

fileInput.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) enableFileUI(f);
});

resetBtn.addEventListener("click", resetState);
newBtn.addEventListener("click", () => fileInput.click());

abLabel.addEventListener("click", () => {
  if (!beforeURL || !afterURL) return;
  if (currentSource === "before") {
    currentSource = "after";
    player.src = afterURL;
  } else {
    currentSource = "before";
    player.src = beforeURL;
  }
  player.play().catch(() => {});
});

cleanBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/clean");
  xhr.responseType = "blob";
  xhr.timeout = 240000;

  bar.style.width = "0%";
  setStatus(t("progress_upload"));
  cleanBtn.disabled = true;

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 50);
      bar.style.width = pct + "%";
    }
  };

  xhr.upload.onload = () => {
    setStatus(t("progress_process"));
    fakeProcessingStart();
  };

  xhr.onprogress = () => {
    // завершаем от 95 до 100
    bar.style.width = "100%";
  };

  xhr.onload = () => {
    fakeProcessingStop();
    if (xhr.status !== 200) {
      setStatus(errorByCode(xhr.status), true);
      cleanBtn.disabled = false;
      return;
    }
    // получаем результат
    afterURL && URL.revokeObjectURL(afterURL);
    afterURL = URL.createObjectURL(xhr.response);

    // по умолчанию ставим After
    currentSource = "after";
    player.src = afterURL;
    player.play().catch(() => {});

    setStatus(t("progress_done"));
    cleanBtn.disabled = false;
  };

  xhr.onerror = () => {
    fakeProcessingStop();
    setStatus(t("error_500"), true);
    cleanBtn.disabled = false;
  };

  xhr.ontimeout = () => {
    fakeProcessingStop();
    setStatus(t("error_500"), true);
    cleanBtn.disabled = false;
  };

  const form = new FormData();
  form.append("file", selectedFile);
  form.append("preset", currentPreset);
  xhr.send(form);
});

// Init
(function init() {
  if (!localStorage.getItem("lang")) setLang("en");
  applyLang();
  resetState();
})();
