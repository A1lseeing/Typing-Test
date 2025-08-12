// --- Elements ---
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

// --- State ---
let targetText = "";
let timerId = null;
let timeLeft = 0;
let startedAt = 0;

let totalTyped = 0;       // total keystrokes considered (characters typed)
let correctTyped = 0;     // correctly matched characters
let errors = 0;           // incorrect committed characters

let lastInputLength = 0;  // for counting new keystrokes
let finished = false;

// --- Sample text ---
const sampleText =
  "The quick brown fox jumps over the lazy dog. Typing tests measure speed and accuracy. " +
  "Try to keep your eyes on the text and type smoothly without looking at the keyboard.";

// --- Utilities ---

// Normalize text for comparison: collapse whitespace, unify newlines
function normalizeText(s) {
  return s.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

// Compute WPM using standard 5-characters-per-word, normalized by elapsed minutes.
// Uses correct characters only (aligned with many platforms' 'wpm')[2].
function computeWPM(correctCharCount, elapsedMs) {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return Math.round((correctCharCount / 5) / minutes);
}

// Accuracy = correct entries / total entries × 100%[6][9][12][15][18].
function computeAccuracy(correctCharCount, totalCharCount) {
  if (totalCharCount === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctCharCount / totalCharCount) * 100)));
}

// Re-render target with coloring to show correctness
function renderTarget(progressLen) {
  const t = targetText;
  const typed = typingArea.value;
  const parts = [];
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (i < typed.length) {
      const ok = typed[i] === ch;
      parts.push(`<span style="color:${ok ? '#22c55e' : '#ef4444'}">${escapeHtml(ch)}</span>`);
    } else {
      parts.push(`<span>${escapeHtml(ch)}</span>`);
    }
  }
  targetTextEl.innerHTML = parts.join("");
}

// Escape HTML for safe rendering
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]
  ));
}

// Reset state
function resetAll() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = Number(durationInput.value || 60);
  timeLeftEl.textContent = timeLeft;

  startedAt = 0;
  totalTyped = 0;
  correctTyped = 0;
  errors = 0;
  lastInputLength = 0;
  finished = false;

  typingArea.value = "";
  typingArea.disabled = true;
  startBtn.disabled = false;
  resetBtn.disabled = true;

  wpmEl.textContent = "0";
  accuracyEl.textContent = "100";
  errorsEl.textContent = "0";

  if (!targetText) {
    targetText = sampleText;
  }
  renderTarget(0);
}

resetAll();

// --- File loading (docx/pdf) ---
loadFileBtn.addEventListener("click", async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    alert("Please choose a DOCX or PDF file first.");
    return;
  }

  try {
    const docToText = new DocToText(); // from docs-to-text
    const ext = file.name.toLowerCase().split(".").pop();
    const text = await docToText.extractToText(file, ext);
    const cleaned = normalizeText(text);
    if (!cleaned) {
      alert("Could not extract text from this file.");
      return;
    }
    targetText = cleaned;
    loadedCount.textContent = String(targetText.length);
    renderTarget(0);
  } catch (err) {
    console.error(err);
    alert("Failed to extract text. Try another file or use the sample text.");
  }
});

// Use sample text
useSampleBtn.addEventListener("click", () => {
  targetText = sampleText;
  loadedCount.textContent = "0";
  renderTarget(0);
});

// --- Start/Reset ---
startBtn.addEventListener("click", () => {
  if (!nameInput.value.trim()) {
    alert("Please enter a name.");
    return;
  }
  if (!targetText || targetText.length === 0) {
    alert("Please load a text or use the sample text.");
    return;
  }

  resetAll(); // ensure clean start but keep targetText
  typingArea.disabled = false;
  typingArea.focus();
  startBtn.disabled = true;
  resetBtn.disabled = false;

  startedAt = Date.now();
  timerId = setInterval(tick, 1000);
});

resetBtn.addEventListener("click", () => {
  resetAll();
});

// --- Typing handling ---
typingArea.addEventListener("input", () => {
  if (finished) return;

  const input = typingArea.value;

  // Count only newly typed characters (not deletions)
  const delta = Math.max(0, input.length - lastInputLength);
  totalTyped += delta;
  lastInputLength = input.length;

  // Compare char-by-char up to the length of input
  let localCorrect = 0;
  let localErrors = 0;
  const n = Math.min(input.length, targetText.length);

  for (let i = 0; i < n; i++) {
    if (input[i] === targetText[i]) localCorrect++;
    else localErrors++;
  }
  // Any extra typed beyond target counts as errors
  if (input.length > targetText.length) {
    localErrors += (input.length - targetText.length);
  }

  correctTyped = localCorrect;
  errors = localErrors;

  renderTarget(input.length);

  // Update live stats
  const elapsed = Math.max(1, Date.now() - startedAt);
  const wpm = computeWPM(correctTyped, elapsed);
  const acc = computeAccuracy(correctTyped, totalTyped);

  wpmEl.textContent = String(wpm);
  accuracyEl.textContent = String(acc);
  errorsEl.textContent = String(errors);

  // End early if the user finished the text
  if (input.length >= targetText.length) {
    finishTest();
  }
});

// --- Timer ---
function tick() {
  timeLeft -= 1;
  timeLeftEl.textContent = String(timeLeft);
  if (timeLeft <= 0) {
    finishTest();
  }
}

function finishTest() {
  if (finished) return;
  finished = true;
  clearInterval(timerId);
  timerId = null;
  typingArea.disabled = true;

  const elapsed = Math.max(1, Date.now() - startedAt);
  const wpm = computeWPM(correctTyped, elapsed);
  const acc = computeAccuracy(correctTyped, totalTyped);

  // Save result to Firestore for leaderboard
  saveResult({
    name: nameInput.value.trim(),
    wpm,
    accuracy: acc,
    errors,
    durationSec: Number(durationInput.value || 60)
  });

  alert(`Finished!\nWPM: ${wpm}\nAccuracy: ${acc}%\nErrors: ${errors}`);
}

// --- Leaderboard (Firestore) ---
const { db, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } = window.__db;

async function saveResult({ name, wpm, accuracy, errors, durationSec }) {
  try {
    await addDoc(collection(db, "typingResults"), {
      name,
      wpm,
      accuracy,
      errors,
      durationSec,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to save result:", e);
  }
}

// subscribe to top 5 by wpm desc, accuracy desc
(function subscribeLeaderboard() {
  const q = query(
    collection(db, "typingResults"),
    orderBy("wpm", "desc"),
    orderBy("accuracy", "desc"),
    limit(5)
  );
  onSnapshot(q, (snap) => {
    leaderboardList.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `${d.name} — ${d.wpm} WPM, ${d.accuracy}% acc, errors: ${d.errors}`;
      leaderboardList.appendChild(li);
    });
  });
})();
