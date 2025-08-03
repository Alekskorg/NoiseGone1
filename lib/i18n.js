
export const DICTS = {
  en: {
    app_title: "NoiseGone",
    hero_title: "Upload an audio file and we'll remove the noise",
    drop_title: "Drag & drop audio here or click to choose",
    drop_sub: "WAV, MP3, M4A (up to ~50 MB)",
    preset_podcast: "Podcast",
    preset_interview: "Interview",
    preset_voiceover: "Voice-over",
    preset_field: "Field",
    btn_clean: "Clean noise",
    btn_new: "New file",
    btn_reset: "Reset",
    btn_record: "Record (soon)",
    progress_upload: "Uploading…",
    progress_process: "Processing…",
    progress_done: "Done! Click to download.",
    error_413: "File exceeds 50 MB limit.",
    error_415: "File type is not supported.",
    error_500: "Processing error. Try another preset or file.",
    ab_label: "A/B: Before / After",
    footer_note: "Free — up to 5 minutes/day. Large volume billed per minute.",
    lang_label: "Language"
  },
  ru: {
    app_title: "NoiseGone",
    hero_title: "Загрузите аудиофайл, и мы удалим шум",
    drop_title: "Перетащите аудио сюда или нажмите, чтобы выбрать",
    drop_sub: "WAV, MP3, M4A (до ~50 МБ)",
    preset_podcast: "Подкаст",
    preset_interview: "Интервью",
    preset_voiceover: "Диктор",
    preset_field: "Полевые",
    btn_clean: "Очистить шум",
    btn_new: "Новый файл",
    btn_reset: "Сбросить",
    btn_record: "Запись (скоро)",
    progress_upload: "Идёт загрузка…",
    progress_process: "Идёт обработка…",
    progress_done: "Готово! Нажмите, чтобы скачать.",
    error_413: "Размер файла превышает 50 МБ.",
    error_415: "Формат не поддерживается.",
    error_500: "Ошибка обработки. Попробуйте другой пресет или файл.",
    ab_label: "A/B: До / После",
    footer_note: "Бесплатно — до 5 минут/день. Для больших объёмов будет поминутная оплата.",
    lang_label: "Язык"
  },
  de: {
    app_title: "NoiseGone",
    hero_title: "Laden Sie eine Audiodatei hoch, wir entfernen das Rauschen",
    drop_title: "Ziehen Sie die Audiodatei hierher oder klicken Sie zum Auswählen",
    drop_sub: "WAV, MP3, M4A (bis ~50 MB)",
    preset_podcast: "Podcast",
    preset_interview: "Interview",
    preset_voiceover: "Voice-over",
    preset_field: "Außenaufnahmen",
    btn_clean: "Rauschen entfernen",
    btn_new: "Neue Datei",
    btn_reset: "Zurücksetzen",
    btn_record: "Aufnahme (bald)",
    progress_upload: "Wird hochgeladen…",
    progress_process: "Wird verarbeitet…",
    progress_done: "Fertig! Zum Herunterladen klicken.",
    error_413: "Datei überschreitet 50 MB.",
    error_415: "Dateityp wird nicht unterstützt.",
    error_500: "Verarbeitungsfehler. Anderen Preset oder Datei probieren.",
    ab_label: "A/B: Vorher / Nachher",
    footer_note: "Kostenlos — bis 5 Minuten/Tag. Größere Mengen pro Minute abgerechnet.",
    lang_label: "Sprache"
  }
};

export function getLang() {
  return localStorage.getItem("lang") || "en";
}

export function setLang(lang) {
  localStorage.setItem("lang", lang);
}

export function t(key) {
  const lang = getLang();
  return (DICTS[lang] && DICTS[lang][key]) || DICTS.en[key] || key;
}
