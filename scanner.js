// =========================================================================
// MODUL PEMINDAI KAMERA: SCAN MASUK, MUTASI VOUCHER & SCAN KARTU MEMBER
// =========================================================================

let scanMasukQr = null;
let scanMutasiQr = null;
let scanMemberQr = null;

let isScanMasukRunning = false;
let isScanMutasiRunning = false;
let isScanMemberRunning = false;

function stopAllCameras() {
  stopScannerMasuk();
  stopScannerMutasi();
  stopScannerMember();
}

// 1. SCANNER BARANG MASUK
async function toggleScannerMasuk() {
  if (isScanMasukRunning) stopScannerMasuk();
  else startScannerMasuk();
}

async function startScannerMasuk() {
  const btn = document.getElementById("btnCamMasuk");
  const laser = document.getElementById("laserMasuk");
  btn.innerText = "⏳ Membuka Kamera...";

  try {
    if (!scanMasukQr) scanMasukQr = new Html5Qrcode("reader-masuk");
    await scanMasukQr.start(
      { facingMode: "environment" },
      { fps: 20, qrbox: { width: 250, height: 130 } },
      (text) => {
        let clean = extractDigits(text);
        handleScannedBarcodeMasuk(clean);
        showToast("Terbaca: " + clean);
        if (navigator.vibrate) navigator.vibrate(80);
      },
      () => {}
    );
    isScanMasukRunning = true;
    laser.className = "laser-guide active";
    btn.innerText = "⏹ Tutup Kamera";
    btn.style.background = "#EF4444";
  } catch (e) {
    btn.innerText = "📷 Nyalakan Scanner Kamera";
    btn.style.background = "var(--bri-blue)";
    alert("Kamera belum dapat dibuka. Periksa izin kamera HP.");
  }
}

async function stopScannerMasuk() {
  const btn = document.getElementById("btnCamMasuk");
  const laser = document.getElementById("laserMasuk");
  try {
    if (scanMasukQr && scanMasukQr.isScanning) await scanMasukQr.stop();
  } catch (e) {}
  isScanMasukRunning = false;
  if (laser) laser.className = "laser-guide";
  if (btn) {
    btn.innerText = "📷 Nyalakan Scanner Kamera";
    btn.style.background = "var(--bri-blue)";
  }
}

// 2. SCANNER MUTASI
async function toggleScannerMutasi() {
  if (isScanMutasiRunning) stopScannerMutasi();
  else startScannerMutasi();
}

async function startScannerMutasi() {
  const btn = document.getElementById("btnCamMutasi");
  const laser = document.getElementById("laserMutasi");
  btn.innerText = "⏳ Membuka Kamera...";

  try {
    if (!scanMutasiQr) scanMutasiQr = new Html5Qrcode("reader-mutasi");
    await scanMutasiQr.start(
      { facingMode: "environment" },
      { fps: 20, qrbox: { width: 250, height: 130 } },
      (text) => {
        let clean = extractDigits(text);
        handleScannedBarcodeMutasi(clean);
        if (navigator.vibrate) navigator.vibrate(80);
      },
      () => {}
    );
    isScanMutasiRunning = true;
    laser.className = "laser-guide active";
    btn.innerText = "⏹ Tutup Kamera";
    btn.style.background = "#EF4444";
  } catch (e) {
    btn.innerText = "📷 Nyalakan Scanner Kamera";
    btn.style.background = "var(--bri-blue)";
    alert("Kamera belum dapat dibuka.");
  }
}

async function stopScannerMutasi() {
  const btn = document.getElementById("btnCamMutasi");
  const laser = document.getElementById("laserMutasi");
  try {
    if (scanMutasiQr && scanMutasiQr.isScanning) await scanMutasiQr.stop();
  } catch (e) {}
  isScanMutasiRunning = false;
  if (laser) laser.className = "laser-guide";
  if (btn) {
    btn.innerText = "📷 Nyalakan Scanner Kamera";
    btn.style.background = "var(--bri-blue)";
  }
}

// 3. SCANNER KARTU MEMBER
async function toggleScannerMember() {
  if (isScanMemberRunning) stopScannerMember();
  else startScannerMember();
}

async function startScannerMember() {
  const btn = document.getElementById("btnCamMember");
  const laser = document.getElementById("laserMember");
  btn.innerText = "⏳ Membuka Kamera...";

  try {
    if (!scanMemberQr) scanMemberQr = new Html5Qrcode("reader-member");
    await scanMemberQr.start(
      { facingMode: "environment" },
      { fps: 20, qrbox: { width: 250, height: 130 } },
      (text) => {
        let clean = text.trim();
        handleScannedBarcodeMember(clean);
        if (navigator.vibrate) navigator.vibrate(80);
      },
      () => {}
    );
    isScanMemberRunning = true;
    laser.className = "laser-guide active";
    btn.innerText = "⏹ Tutup Kamera";
    btn.style.background = "#EF4444";
  } catch (e) {
    btn.innerText = "📷 Nyalakan Scanner Kartu";
    btn.style.background = "var(--bri-blue)";
    alert("Kamera belum dapat dibuka.");
  }
}

async function stopScannerMember() {
  const btn = document.getElementById("btnCamMember");
  const laser = document.getElementById("laserMember");
  try {
    if (scanMemberQr && scanMemberQr.isScanning) await scanMemberQr.stop();
  } catch (e) {}
  isScanMemberRunning = false;
  if (laser) laser.className = "laser-guide";
  if (btn) {
    btn.innerText = "📷 Nyalakan Scanner Kartu";
    btn.style.background = "var(--bri-blue)";
  }
}

function extractDigits(rawStr) {
  let s = String(rawStr).replace(/[\s\-]/g, "");
  let match = s.match(/\d{8,25}/);
  return match ? match[0] : s;
}
