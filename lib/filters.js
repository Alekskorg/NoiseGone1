// /lib/filters.js
// Возвращает filtergraph для ffmpeg по пресету.
// Параметры подобраны под голосовые записи с упором на разборчивость.

function graphPodcast() {
  // Чистый голос крупным планом
  return [
    "highpass=f=80",
    "afftdn=nr=18",
    "dynaudnorm=f=150:g=5",
    "compand=attacks=0.05:decays=0.2:points=-80/-900|-40/-10|0/-1",
    "lowpass=f=12000",
    "loudnorm=I=-16:TP=-1.5:LRA=11"
  ].join(",");
}

function graphInterview() {
  // Диалог — более мягкое шумоподавление, без агрессивной компрессии
  return [
    "highpass=f=80",
    "afftdn=nr=12",
    "dynaudnorm=f=200:g=3",
    "lowpass=f=12000",
    "loudnorm=I=-16:TP=-1.5:LRA=11"
  ].join(",");
}

function graphVoiceover() {
  // Дикторская начитка — чуть жёстче de-noise, меньше «насоса»
  return [
    "highpass=f=100",
    "afftdn=nr=20",
    "compand=attacks=0.03:decays=0.15:points=-80/-900|-35/-10|-5/-2|0/-1",
    "lowpass=f=14000",
    "loudnorm=I=-16:TP=-1.5:LRA=9"
  ].join(",");
}

function graphField() {
  // Полевые записи — сильнее гашение гула, мягкая нормализация
  return [
    "highpass=f=60",
    "afftdn=nr=24",
    "dynaudnorm=f=250:g=3",
    "lowpass=f=10000",
    "loudnorm=I=-18:TP=-1.5:LRA=12"
  ].join(",");
}

function filtergraphByPreset(preset) {
  switch ((preset || "podcast").toLowerCase()) {
    case "interview":
      return graphInterview();
    case "voiceover":
      return graphVoiceover();
    case "field":
      return graphField();
    case "podcast":
    default:
      return graphPodcast();
  }
}

module.exports = { filtergraphByPreset };
