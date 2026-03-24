import { Moment } from './models/Moment.js';

// ── State ────────────────────────────────────────────────────
let moments = [];
let activeMoment = null;
let mediaRecorder = null;
let audioChunks = [];
let micStream = null;
let cameraStream = null;
let recordingInterval = null;
let recordingSeconds = 0;
let isRecording = false;

// ── DOM refs ─────────────────────────────────────────────────
const grid = document.getElementById('moments-grid');
const addBtn = document.getElementById('add-moment-btn');
const composeBtn = document.getElementById('compose-btn');
const focusMode = document.getElementById('focus-mode');
const focusBackBtn = document.getElementById('focus-back-btn');
const recordBtn = document.getElementById('record-btn');
const recordBtnWrap = document.getElementById('record-btn-wrap');
const recordLabel = document.getElementById('record-label');
const recordTimer = document.getElementById('record-timer');
const recordWaveform = document.getElementById('record-waveform');
const photoPreview = document.getElementById('photo-preview');
const cameraVideo = document.getElementById('camera-video');
const cameraCanvas = document.getElementById('camera-canvas');
const openCameraBtn = document.getElementById('open-camera-btn');
const retakePhotoBtn = document.getElementById('retake-photo-btn');
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const momentText = document.getElementById('moment-text');
const saveBtn = document.getElementById('save-btn');
const saveHint = document.getElementById('save-hint');

// ── Date helpers ─────────────────────────────────────────────
function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Init date ────────────────────────────────────────────────
document.getElementById('diary-date').textContent = getTodayLabel();

// ── Focus mode ───────────────────────────────────────────────
function openFocusMode() {
  activeMoment = new Moment();
  resetFocusUI();
  focusMode.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeFocusMode() {
  stopRecordingCleanup();
  stopCamera();
  focusMode.classList.add('hidden');
  document.body.style.overflow = '';
}

function resetFocusUI() {
  isRecording = false;
  recordBtn.querySelector('img').src = '/icons/mic-on.svg';
  recordBtn.classList.remove('recording');
  recordBtnWrap.classList.remove('recording');
  recordLabel.textContent = 'TAP TO RECORD';
  recordTimer.classList.remove('visible');
  recordTimer.textContent = '00:00';
  recordWaveform.classList.remove('active');
  photoPreview.src = '';
  photoPreview.classList.remove('visible');
  cameraVideo.classList.remove('visible');
  capturePhotoBtn.classList.remove('visible');
  openCameraBtn.style.display = '';
  retakePhotoBtn.style.display = 'none';
  momentText.value = '';
  updateSaveBtn();
}

function updateSaveBtn() {
  const hasAudio = activeMoment && activeMoment.audioBlob;
  saveBtn.disabled = !hasAudio;
  saveHint.textContent = hasAudio ? '' : 'Record audio to save';
}

// ── Audio recording ──────────────────────────────────────────
async function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    alert('Microphone access denied.');
    return;
  }

  audioChunks = [];
  mediaRecorder = new MediaRecorder(micStream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };
  mediaRecorder.onstop = onRecordingComplete;
  mediaRecorder.start();

  isRecording = true;
  recordBtn.querySelector('img').src = '/icons/stop-square.svg';
  recordBtn.classList.add('recording');
  recordBtnWrap.classList.add('recording');
  recordLabel.textContent = 'TAP TO STOP';
  recordTimer.classList.add('visible');
  recordWaveform.classList.add('active');

  recordingSeconds = 0;
  recordTimer.textContent = formatTime(0);
  recordingInterval = setInterval(() => {
    recordingSeconds++;
    recordTimer.textContent = formatTime(recordingSeconds);
  }, 1000);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  stopRecordingCleanup();
}

function stopRecordingCleanup() {
  clearInterval(recordingInterval);
  recordingInterval = null;
  isRecording = false;
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  if (recordBtn) {
    recordBtn.querySelector('img').src = '/icons/mic-on.svg';
    recordBtn.classList.remove('recording');
    recordBtnWrap.classList.remove('recording');
    recordLabel.textContent = 'RECORDED';
    recordWaveform.classList.remove('active');
  }
}

async function onRecordingComplete() {
  const blob = new Blob(audioChunks, { type: 'audio/webm' });
  activeMoment.audioBlob = blob;
  activeMoment.audioUrl = URL.createObjectURL(blob);

  // Capture GPS after recording stops
  await activeMoment.captureLocation();

  updateSaveBtn();
}

// ── Camera ───────────────────────────────────────────────────
async function openCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
  } catch {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      alert('Camera access denied.');
      return;
    }
  }

  cameraVideo.srcObject = cameraStream;
  await cameraVideo.play();
  cameraVideo.classList.add('visible');
  capturePhotoBtn.classList.add('visible');
  openCameraBtn.style.display = 'none';
}

function capturePhoto() {
  const w = cameraVideo.videoWidth || 640;
  const h = cameraVideo.videoHeight || 480;
  cameraCanvas.width = w;
  cameraCanvas.height = h;
  cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0, w, h);

  activeMoment.photoUrl = cameraCanvas.toDataURL('image/jpeg', 0.85);

  stopCamera();
  cameraVideo.classList.remove('visible');
  capturePhotoBtn.classList.remove('visible');
  photoPreview.src = activeMoment.photoUrl;
  photoPreview.classList.add('visible');
  retakePhotoBtn.style.display = '';
  openCameraBtn.style.display = 'none';
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  cameraVideo.srcObject = null;
}

function retakePhoto() {
  activeMoment.photoUrl = null;
  photoPreview.src = '';
  photoPreview.classList.remove('visible');
  retakePhotoBtn.style.display = 'none';
  openCameraBtn.style.display = '';
}

// ── Save moment ───────────────────────────────────────────────
function saveMoment() {
  if (!activeMoment || !activeMoment.audioBlob) return;

  activeMoment.text = momentText.value.trim();

  moments.push(activeMoment);
  renderMomentCard(activeMoment);

  closeFocusMode();
  activeMoment = null;
}

function renderMomentCard(moment) {
  const card = document.createElement('div');
  card.className = 'moment-card' + (moment.photoUrl ? '' : ' no-photo');

  if (moment.photoUrl) {
    const img = document.createElement('img');
    img.className = 'card-photo';
    img.src = moment.photoUrl;
    img.alt = 'moment photo';
    card.appendChild(img);
  }

  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';

  const waveIcon = document.createElement('img');
  waveIcon.className = 'card-wave-icon';
  waveIcon.src = '/icons/wave.svg';
  waveIcon.alt = '';
  overlay.appendChild(waveIcon);

  if (moment.text) {
    const textEl = document.createElement('span');
    textEl.className = 'card-text';
    textEl.textContent = moment.text;
    overlay.appendChild(textEl);
  }

  card.appendChild(overlay);

  // Insert before the add button (which stays at position 0)
  grid.insertBefore(card, addBtn.nextSibling);
}

// ── Event listeners ───────────────────────────────────────────
addBtn.addEventListener('click', openFocusMode);
composeBtn.addEventListener('click', openFocusMode);
focusBackBtn.addEventListener('click', closeFocusMode);
recordBtn.addEventListener('click', toggleRecording);
openCameraBtn.addEventListener('click', openCamera);
capturePhotoBtn.addEventListener('click', capturePhoto);
retakePhotoBtn.addEventListener('click', retakePhoto);
saveBtn.addEventListener('click', saveMoment);
