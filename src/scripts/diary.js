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
let audioPlayer = null;
let dateCache = {};   // { 'YYYY-MM-DD': Moment[] }
let activeDate = null;

// ── DOM refs ─────────────────────────────────────────────────
const grid = document.getElementById('moments-grid');
const addBtn = document.getElementById('add-moment-btn');
const focusMode = document.getElementById('focus-mode');
const focusTitle = document.getElementById('focus-title');
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
const momentFeel = document.getElementById('moment-feel');
const saveBtn = document.getElementById('save-btn');
const saveHint = document.getElementById('save-hint');
const playBtn = document.getElementById('play-btn');
const playTimer = document.getElementById('play-timer');
const rerecordBtn = document.getElementById('rerecord-btn');
const metaTime = document.getElementById('meta-time');
const metaCoords = document.getElementById('meta-coords');
const locationNameInput = document.getElementById('location-name-input');
const locationNameDisplay = document.getElementById('location-name-display');
const diaryDateEl = document.getElementById('diary-date');
const diaryDateBtn = document.getElementById('diary-date-btn');
const dateDropdown = document.getElementById('date-dropdown');
const headerUsername = document.getElementById('header-username');
const headerCity = document.getElementById('header-city');

// ── Username ──────────────────────────────────────────────────
function getUsername() {
  return localStorage.getItem('usd_username') || 'anonymous';
}

function getCity() {
  return localStorage.getItem('usd_city') || null;
}

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

function formatReviewTitle(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function momentDateKey(isoString) {
  return isoString.slice(0, 10);
}

function formatDateLabel(dateKey) {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (dateKey === todayKey) return getTodayLabel();
  // Parse as local midnight to get correct weekday
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function rowToMoment(row) {
  const m = new Moment();
  m.id = row.id;
  m.timestamp = row.timestamp;
  m.text = row.description || '';
  m.locationName = row.location_name || '';
  m.location = row.location_lat != null
    ? { lat: row.location_lat, lng: row.location_lng, accuracy: row.location_accuracy }
    : null;
  if (row.audio_path) m.audioUrl = `/${row.audio_path}`;
  if (row.photo_path) m.photoUrl = `/${row.photo_path}`;
  return m;
}

// ── Grid ──────────────────────────────────────────────────────
function clearGrid() {
  grid.querySelectorAll('.moment-card').forEach(c => c.remove());
}

function renderGrid(dateKey) {
  clearGrid();
  for (const m of (dateCache[dateKey] || [])) renderMomentCard(m);
}

// ── Date dropdown ─────────────────────────────────────────────
function populateDateDropdown(dates) {
  dateDropdown.innerHTML = '';
  for (const dateKey of dates) {
    const btn = document.createElement('button');
    btn.className = 'date-option';
    btn.setAttribute('role', 'option');
    btn.dataset.date = dateKey;
    btn.textContent = formatDateLabel(dateKey);
    btn.addEventListener('click', () => selectDate(dateKey));
    dateDropdown.appendChild(btn);
  }
}

function updateDropdownSelection() {
  dateDropdown.querySelectorAll('.date-option').forEach(btn => {
    btn.setAttribute('aria-selected', btn.dataset.date === activeDate ? 'true' : 'false');
  });
}

function openDateDropdown() {
  dateDropdown.classList.remove('hidden');
  diaryDateBtn.setAttribute('aria-expanded', 'true');
}

function closeDateDropdown() {
  dateDropdown.classList.add('hidden');
  diaryDateBtn.setAttribute('aria-expanded', 'false');
}

async function selectDate(dateKey) {
  activeDate = dateKey;
  diaryDateEl.textContent = formatDateLabel(dateKey);
  updateDropdownSelection();
  closeDateDropdown();
  if (dateCache[dateKey] !== undefined) {
    renderGrid(dateKey);
  } else {
    await fetchMomentsForDate(dateKey);
  }
}

async function fetchMomentsForDate(dateKey) {
  const username = getUsername();
  try {
    const res = await fetch(`/api/moments?username=${encodeURIComponent(username)}&date=${dateKey}`);
    if (!res.ok) return;
    const data = await res.json();
    const loaded = (data.moments || []).map(rowToMoment);
    dateCache[dateKey] = loaded;
    moments.push(...loaded);
    renderGrid(dateKey);
  } catch (err) {
    console.warn('Failed to fetch moments for date:', dateKey, err);
  }
}

// ── Focus mode — shared open/close ───────────────────────────
function openOverlay() {
  focusMode.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeFocusMode() {
  stopRecordingCleanup();
  stopCamera();
  stopAudioPlayer();
  if (activeMoment) activeMoment.cleanup();
  activeMoment = null;
  focusMode.classList.add('hidden');
  focusMode.dataset.mode = 'capture';
  momentText.readOnly = false;
  document.body.style.overflow = '';
}

// ── Capture mode ─────────────────────────────────────────────
function openFocusMode() {
  activeMoment = new Moment();
  focusMode.dataset.mode = 'capture';
  focusTitle.textContent = 'New Moment';
  resetCaptureUI();
  metaTime.textContent = new Date(activeMoment.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  metaCoords.textContent = 'Locating…';
  locationNameInput.value = '';
  openOverlay();
}

function resetCaptureUI() {
  stopAudioPlayer();
  focusMode.classList.remove('has-recording');
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

// ── Review mode ───────────────────────────────────────────────
function openReviewMode(moment) {
  focusMode.dataset.mode = 'review';
  focusTitle.textContent = formatReviewTitle(moment.timestamp);

  if (moment.photoUrl) {
    photoPreview.src = moment.photoUrl;
    photoPreview.classList.add('visible');
  } else {
    photoPreview.classList.remove('visible');
  }

  momentText.value = moment.text;
  momentText.readOnly = true;

  setupAudioPlayer(moment.audioUrl);

  metaTime.textContent = new Date(moment.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  metaCoords.textContent = moment.location
    ? `${moment.location.lat.toFixed(4)}, ${moment.location.lng.toFixed(4)}`
    : 'No location';
  locationNameDisplay.textContent = moment.locationName || '';

  openOverlay();
}

// ── Audio player ──────────────────────────────────────────────
function setupAudioPlayer(url) {
  stopAudioPlayer();
  audioPlayer = new Audio(url);
  audioPlayer.ontimeupdate = () => {
    playTimer.textContent = formatTime(Math.floor(audioPlayer.currentTime));
  };
  audioPlayer.onended = () => {
    playBtn.querySelector('img').src = '/icons/play-circle.svg';
  };
  playTimer.textContent = '0:00';
  playBtn.querySelector('img').src = '/icons/play-circle.svg';
}

function stopAudioPlayer() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.ontimeupdate = null;
    audioPlayer.onended = null;
    audioPlayer = null;
  }
  if (playTimer) playTimer.textContent = '0:00';
  if (playBtn) playBtn.querySelector('img').src = '/icons/play-circle.svg';
}

function togglePlayback() {
  if (!audioPlayer) return;
  if (audioPlayer.paused) {
    audioPlayer.play();
    playBtn.querySelector('img').src = '/icons/pause-circle.svg';
  } else {
    audioPlayer.pause();
    playBtn.querySelector('img').src = '/icons/play-circle.svg';
  }
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
  const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
  activeMoment.audioBlob = blob;
  activeMoment.audioUrl = URL.createObjectURL(blob);

  await activeMoment.captureLocation();
  metaCoords.textContent = activeMoment.location
    ? `${activeMoment.location.lat.toFixed(4)}, ${activeMoment.location.lng.toFixed(4)}`
    : 'No location';
  updateSaveBtn();
  setupAudioPlayer(activeMoment.audioUrl);
  focusMode.classList.add('has-recording');
}

function rerecord() {
  if (activeMoment) {
    activeMoment.cleanup();
    activeMoment.audioBlob = null;
  }
  resetCaptureUI();
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

// ── Server persistence ────────────────────────────────────────
async function persistMoment(moment) {
  const formData = new FormData();
  formData.append('username', getUsername());
  const city = getCity();
  if (city) formData.append('city', city);
  formData.append('metadata', JSON.stringify({
    id: moment.id,
    timestamp: moment.timestamp,
    location: moment.location,
    locationName: moment.locationName,
    text: moment.text,
    feel: moment.feel,
  }));

  if (moment.audioBlob) {
    formData.append('audio', moment.audioBlob, `${moment.id}.webm`);
  }

  if (moment.photoUrl) {
    try {
      const photoRes = await fetch(moment.photoUrl);
      const blob = await photoRes.blob();
      formData.append('photo', blob, `${moment.id}.jpg`);
    } catch {}
  }

  try {
    const response = await fetch('/api/moments', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.audioPath) moment.audioUrl = `/${data.audioPath}`;
    if (data.photoPath) moment.photoUrl = `/${data.photoPath}`;
  } catch (err) {
    console.warn('Failed to persist moment to server:', err);
  }
}

// ── Save moment ───────────────────────────────────────────────
async function saveMoment() {
  if (!activeMoment || !activeMoment.audioBlob) return;

  activeMoment.text = momentText.value.trim();
  activeMoment.feel = momentFeel.value.trim();
  activeMoment.locationName = locationNameInput.value.trim();

  const saved = activeMoment;
  const dateKey = momentDateKey(saved.timestamp);

  if (!dateCache[dateKey]) dateCache[dateKey] = [];
  dateCache[dateKey].push(saved);
  moments.push(saved);

  if (activeDate === dateKey) renderMomentCard(saved);

  closeFocusMode();
  await persistMoment(saved);
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
  card.addEventListener('click', () => openReviewMode(moment));
  grid.insertBefore(card, addBtn.nextSibling);
}

// ── Event listeners ───────────────────────────────────────────
addBtn.addEventListener('click', openFocusMode);
focusBackBtn.addEventListener('click', closeFocusMode);
recordBtn.addEventListener('click', toggleRecording);
openCameraBtn.addEventListener('click', openCamera);
capturePhotoBtn.addEventListener('click', capturePhoto);
retakePhotoBtn.addEventListener('click', retakePhoto);
saveBtn.addEventListener('click', saveMoment);
playBtn.addEventListener('click', togglePlayback);
rerecordBtn.addEventListener('click', rerecord);

diaryDateBtn.addEventListener('click', () => {
  if (dateDropdown.classList.contains('hidden')) openDateDropdown();
  else closeDateDropdown();
});

document.addEventListener('click', (e) => {
  if (!diaryDateBtn.contains(e.target) && !dateDropdown.contains(e.target)) {
    closeDateDropdown();
  }
});

// ── Load moments from server on page start ────────────────────
function renderHeaderProfile() {
  const username = getUsername();
  headerUsername.textContent = username !== 'anonymous' ? username : '';
  headerCity.textContent = getCity() || '';
}

activeDate = new Date().toISOString().slice(0, 10);
diaryDateEl.textContent = getTodayLabel();
renderHeaderProfile();

async function initDiary() {
  const username = getUsername();
  if (!username || username === 'anonymous') return;

  try {
    const [datesRes, momentsRes] = await Promise.all([
      fetch(`/api/moments/dates?username=${encodeURIComponent(username)}`),
      fetch(`/api/moments?username=${encodeURIComponent(username)}&days=3`),
    ]);
    const [datesData, momentsData] = await Promise.all([datesRes.json(), momentsRes.json()]);

    populateDateDropdown(datesData.dates || []);

    for (const row of (momentsData.moments || [])) {
      const m = rowToMoment(row);
      moments.push(m);
      const key = momentDateKey(m.timestamp);
      if (!dateCache[key]) dateCache[key] = [];
      dateCache[key].push(m);
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    activeDate = dateCache[todayKey] ? todayKey : Object.keys(dateCache).sort().at(-1) ?? todayKey;

    diaryDateEl.textContent = formatDateLabel(activeDate);
    updateDropdownSelection();
    renderGrid(activeDate);
  } catch (err) {
    console.warn('Could not load moments from server:', err);
  }
}

initDiary();
