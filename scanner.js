// =========================================================================
// MODUL PEMINDAI KAMERA UNIVERSAL (SINGLE ENGINE - ANTI CRASH & ANTI LOCK)
// =========================================================================

let currentScanner = null;
let currentScannerTarget = null;

async function stopCurrentScanner() {
  if (currentScanner) {
    try {
      if (currentScanner.isScanning) {
        await currentScanner.stop();
      }
      currentScanner.clear();
    } catch (e) {
      console.warn("Info stop camera:", e);
    }
    currentScanner = null;
    currentScannerTarget = null;
  }

  const buttons = [
    { id: "btnCamMasuk", text: "📷 Nyalakan Scanner Kamera" },
    { id: "btnCamMutasi", text: "📷 Nyalakan Scanner Kamera" },
    { id: "btnCamMember", text: "📷 Nyalakan Scanner Kartu" },
    { id: "btnCamCekHarga", text: "📷 Nyalakan Kamera Cek Harga" }
  ];

  buttons.forEach(b => {
    const el = document.getElementById(b.id);
    if (el) {
      el.innerText = b.text;
      el.style.background = "var(--bank-primary)";
    }
  });

  ["laserMasuk", "laserMutasi", "laserMember", "laserCekHarga"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "laser-guide";
  });
}

function stopAllCameras() {
  stopCurrentScanner();
}

async function startUniversalCamera(targetDivId, laserId, btnId, onScanSuccess) {
  const btn = document.getElementById(btnId);
  const laser = document.getElementById(laserId);

  if (btn) btn.innerText = "⏳ Membuka Sensor Kamera...";

  await stopCurrentScanner();

  // Berikan jeda 150ms agar elemen DOM workspace selesai dirender (mencegah layar hitam)
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const scanner = new Html5Qrcode(targetDivId);
    currentScanner = scanner;
    currentScannerTarget = targetDivId;

    const qrConfig = {
      fps: 20,
      qrbox: { width: 250, height: 140 }
    };

    try {
      await scanner.start(
        { facingMode: "environment" },
        qrConfig,
        onScanSuccess,
        () => {}
      );
    } catch (errEnv) {
      await scanner.start(
        { facingMode: "user" },
        qrConfig,
        onScanSuccess,
        () => {}
      );
    }

    if (laser) laser.className = "laser-guide active";
    if (btn) {
      btn.innerText = "⏹ Tutup Kamera";
      btn.style.background = "#EF4444";
    }
  } catch (errFinal) {
    console.error("Gagal membuka kamera:", errFinal);
    await stopCurrentScanner();
    alert("Kamera belum dapat dibuka. Pastikan izin kamera aktif di Pengaturan HP.");
  }
}

// 1. SCANNER BARANG MASUK
async function toggleScannerMasuk() {
  if (currentScanner && currentScannerTarget === "reader-masuk") {
    await stopCurrentScanner();
  } else {
    await startUniversalCamera("reader-masuk", "laserMasuk", "btnCamMasuk", (text) => {
      let clean = extractDigits(text);
      handleScannedBarcodeMasuk(clean);
      showToast("Terbaca: " + clean);
      if (navigator.vibrate) navigator.vibrate(80);
    });
  }
}

// 2. SCANNER MUTASI
async function toggleScannerMutasi() {
  if (currentScanner && currentScannerTarget === "reader-mutasi") {
    await stopCurrentScanner();
  } else {
    await startUniversalCamera("reader-mutasi", "laserMutasi", "btnCamMutasi", (text) => {
      let clean = extractDigits(text);
      handleScannedBarcodeMutasi(clean);
      if (navigator.vibrate) navigator.vibrate(80);
    });
  }
}

// 3. SCANNER MEMBER
async function toggleScannerMember() {
  if (currentScanner && currentScannerTarget === "reader-member") {
    await stopCurrentScanner();
  } else {
    await startUniversalCamera("reader-member", "laserMember", "btnCamMember", (text) => {
      let clean = text.trim();
      handleScannedBarcodeMember(clean);
      if (navigator.vibrate) navigator.vibrate(80);
    });
  }
}

// 4. SCANNER CEK HARGA KILAT
async function toggleScannerCekHarga() {
  if (currentScanner && currentScannerTarget === "reader-cekharga") {
    await stopCurrentScanner();
  } else {
    await startUniversalCamera("reader-cekharga", "laserCekHarga", "btnCamCekHarga", (text) => {
      let clean = extractDigits(text);
      handleScannedBarcodeCekHarga(clean);
      if (navigator.vibrate) navigator.vibrate(80);
    });
  }
}

function extractDigits(rawStr) {
  let s = String(rawStr).replace(/[\s\-]/g, "");
  let match = s.match(/\d{8,25}/);
  return match ? match[0] : s;
}
