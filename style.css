// ===== Elements =====
const accessCodeInput = document.getElementById("accessCodeInput");
const accessBtn = document.getElementById("accessBtn");
const accessStatus = document.getElementById("accessStatus");

const nameInput = document.getElementById("nameInput");
const durationInput = document.getElementById("durationInput");
const useSampleBtn = document.getElementById("useSampleBtn");
const fileInput = document.getElementById("fileInput");
const loadFileBtn = document.getElementById("loadFileBtn");
const loadedCount = document.getElementById("loadedCount");
const targetTextEl = document.getElementById("targetText");
const typingArea = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timeLeftEl = document.getElementById("timeLeft");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const errorsEl = document.getElementById("errors");
const leaderboardList = document.getElementById("leaderboardList");

// ===== Access Code Logic =====
const ACCESS_CODE = "TYPE-2025"; // Change to your code
let unlocked = false;
function setLockedUI(isLocked) {
  document.querySelectorAll(".user-setup input, .user-setup button, .text-source input, .text-source button, .test-area textarea, .test-area button")
    .forEach(el => el.disabled = isLocked);
}
setLockedUI(true);
accessBtn.addEventListener("click", () => {
  if (accessCodeInput.value.trim() === ACCESS_CODE) {
    unlocked = true;
    setLockedUI(false);
    accessStatus.textContent = "Access granted.";
    accessStatus.style.color = "#22c55e";
  } else {
    unlocked = false;
    setLockedUI(true);
    accessStatus.textContent = "Invalid code.";
    accessStatus.style.color = "#ef4444";
  }
});

// ===== State =====
let targetText = "";
let timerId, timeLeft, startedAt;
let totalTyped, correctTyped, errors, lastInputLength, finished;
const sampleText = "The quick brown fox jumps over the lazy dog.";

// ===== Utils =====
function normalizeText(s) { return s.replace(/\r/g, "").replace(/\s+/g, " ").trim(); }
function computeWPM(chars, elapsedMs) { const m = elapsedMs / 60000; return m > 0 ? Math.round((chars / 5) / m) : 0; }
function computeAccuracy(c, t) { return t > 0 ? Math.round((c / t) * 100) : 100; }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function renderTarget() {
  targetTextEl.innerHTML = [...targetText].map((ch, i) =>
    i < typingArea.value.length
      ? `<span style="color:${typingArea.value[i] === ch ? '#22c55e' : '#ef4444'}">${escapeHtml(ch)}</span>`
      : `<span>${escapeHtml(ch)}</span>`
  ).join("");
}

// ===== Reset =====
function resetAll() {
  clearInterval(timerId);
  timeLeft = Number(durationInput.value || 60);
  timeLeftEl.textContent = timeLeft;
  startedAt = totalTyped = correctTyped = errors = lastInputLength = 0;
  finished = false;
  typingArea.value = ""; typingArea.disabled = true;
  startBtn.disabled = false; resetBtn.disabled = true;
  wpmEl.textContent = "0"; accuracyEl.textContent = "100"; errorsEl.textContent = "0";
  if (!targetText) targetText = sampleText;
  renderTarget();
}
resetAll();

// ===== File loading =====
loadFileBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Select a DOCX or PDF.");
  const ext = file.name.toLowerCase().split(".").pop();
  try {
    let extracted = "";
    if (ext === "pdf") extracted = await extractPdfTextWithPdfJs(file);
    else if (ext === "docx" || ext === "doc") {
      const docToText = new DocToText();
      extracted = await docToText.extractToText(file, ext);
    } else return alert("Unsupported.");
    const cleaned = normalizeText(extracted || "");
    if (!cleaned) return alert("No text found.");
    targetText = cleaned;
    loadedCount.textContent = targetText.length;
    renderTarget();
  } catch (e) { console.error(e); alert("Error extracting."); }
});

// ===== PDF.js + OCR fallback =====
async function extractPdfTextWithPdfJs(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const texts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    let txt = (await page.getTextContent()).items.map(obj => obj.str).join(" ").trim();
    if (!txt) {
      const vp = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.height = vp.height; canvas.width = vp.width;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      const ocrResult = await Tesseract.recognize(canvas, "eng");
      txt = ocrResult.data.text.trim();
    }
    texts.push(txt);
  }
  return texts.join("\n\n");
}

// ===== Buttons =====
useSampleBtn.addEventListener("click", () => { targetText = sampleText; loadedCount.textContent = "0"; renderTarget(); });
startBtn.addEventListener("click", () => {
  if (!unlocked) return alert("Enter access code first!");
  if (!nameInput.value.trim()) return alert("Enter a name.");
  if (!targetText) return alert("Load text or use sample.");
  resetAll();
  typingArea.disabled = false; typingArea.focus();
  startBtn.disabled = true; resetBtn.disabled = false;
  startedAt = Date.now();
  timerId = setInterval(tick, 1000);
});
resetBtn.addEventListener("click", resetAll);

// Typing
typingArea.addEventListener("input", () => {
  if (finished) return;
  const input = typingArea.value;
  totalTyped += Math.max(0, input.length - lastInputLength);
  lastInputLength = input.length;
  correctTyped = errors = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === targetText[i]) correctTyped++; else errors++;
  }
  renderTarget();
  const elapsed = Date.now() - startedAt;
  wpmEl.textContent = computeWPM(correctTyped, elapsed);
  accuracyEl.textContent = computeAccuracy(correctTyped, totalTyped);
  errorsEl.textContent = errors;
  if (input.length >= targetText.length) finishTest();
});

function tick() { if (--timeLeft <= 0) finishTest(); timeLeftEl.textContent = timeLeft; }
function finishTest() {
  if (finished) return; finished = true;
  clearInterval(timerId); typingArea.disabled = true;
  const wpm = computeWPM(correctTyped, Date.now() - startedAt);
  const acc = computeAccuracy(correctTyped, totalTyped);
  saveResult({ name: nameInput.value.trim(), wpm, accuracy: acc, errors, durationSec: Number(durationInput.value) });
  alert(`Finished!\nWPM: ${wpm}\nAccuracy: ${acc}%\nErrors: ${errors}`);
}

// ===== Firebase save + leaderboard =====
const { db, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } = window.__db;
const FIRESTORE_ACCESS_CODE = "TYPE-2025"; // must match Firestore rules

async function saveResult({ name, wpm, accuracy, errors, durationSec }) {
  await addDoc(collection(db, "typingResults"), {
    name, wpm, accuracy, errors, durationSec,
    createdAt: serverTimestamp(),
    accessCode: FIRESTORE_ACCESS_CODE
  });
}

(function subscribeLeaderboard() {
  const q = query(collection(db, "typingResults"), orderBy("wpm", "desc"), orderBy("accuracy", "desc"), limit(5));
  onSnapshot(q, (snap) => {
    leaderboardList.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${d.name} — ${d.wpm} WPM, ${d.accuracy}% acc, errors: ${d.errors}`;
      leaderboardList.appendChild(li);
    });
  });
})();
