// =========================================================================
// MODUL SINKRONISASI CLOUD, KATALOG, OTOMASI PPOB & STATUS LIVE NYATA
// =========================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzX-uB_VVa3I0U0t6ozJ_c0S3RGd4gSSHGQaVPljKa3ipeDrbRylTe_pnsXjfAdwBXB/exec";

// Global Window State (Aman & Bebas Benturan Variabel)
window.masterKatalog = [];
window.isSaldoHidden = false;
window.activeStore = "Toko NMC";
window.activeKasir = "Kasir";
window.storeSummaryToday = {};
window.ppobListToday = JSON.parse(localStorage.getItem("NIKOLA_PPOB_CACHE") || "[]");

// =========================================================================
// 1. INDIKATOR KONEKSI NYATA (REAL LIVE HEARTBEAT)
// =========================================================================
function updateConnectionBadge(status) {
  const badge = document.getElementById("lblSyncStatus");
  if (!badge) return;

  if (status === "ONLINE") {
    badge.innerText = "● LIVE PC";
    badge.style.color = "#0284C7";
    badge.style.background = "#E0F2FE";
  } else if (status === "SYNCING") {
    badge.innerText = "● MENYINKRON...";
    badge.style.color = "#D97706";
    badge.style.background = "#FEF3C7";
  } else {
    badge.innerText = "● OFFLINE";
    badge.style.color = "#EF4444";
    badge.style.background = "#FEE2E2";
  }
}

// Detektor Otomatis Koneksi Internet HP
window.addEventListener('online', () => {
  updateConnectionBadge("SYNCING");
  showToast("🌐 Internet terhubung kembali.");
  fetchLiveStoreData();
  flushOfflineQueue();
});

window.addEventListener('offline', () => {
  updateConnectionBadge("OFFLINE");
  showToast("⚠️ Internet terputus. Mode offline aktif.");
});

function showToast(msg) {
  const t = document.getElementById("toast-msg");
  if (!t) return;
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 2500);
}

// =========================================================================
// 2. SISTEM LOGIN BERBASIS ID TOKO (OUTLET LOCK)
// =========================================================================
function submitLoginById() {
  const storeId = document.getElementById("inpStoreId").value.trim().toUpperCase();
  const kasirName = document.getElementById("inpKasirName").value.trim() || "Kasir";

  if (!storeId) {
    return alert("Harap masukkan ID Toko!");
  }

  // Pemetaan ID Toko Resmi
  let targetStore = "";
  if (storeId === "NMC" || storeId.startsWith("NMC")) {
    targetStore = "Toko NMC";
  } else if (storeId === "NACC" || storeId.startsWith("NACC")) {
    targetStore = "Toko NACC";
  } else {
    return alert("ID Toko tidak dikenali! Gunakan ID: NMC atau NACC.");
  }

  localStorage.setItem("NIKOLA_STORE_ID", storeId);
  localStorage.setItem("NIKOLA_STORE", targetStore);
  localStorage.setItem("NIKOLA_KASIR", kasirName);

  setSession(targetStore, kasirName);
  document.getElementById("onboardingScreen").style.display = "none";
  showToast(`✅ Masuk Terminal: ${targetStore}`);
  fetchLiveStoreData();
}

function setSession(store, kasir) {
  window.activeStore = store;
  window.activeKasir = kasir;

  if (document.getElementById("labelTokoHeader")) document.getElementById("labelTokoHeader").innerText = store.toUpperCase();
  if (document.getElementById("badgeStoreLock")) document.getElementById("badgeStoreLock").innerText = `TERKUNCI: ${store}`;
  if (document.getElementById("displayKasirName")) document.getElementById("displayKasirName").innerText = `${kasir} (${store})`;
  if (document.getElementById("userAvatarChar")) document.getElementById("userAvatarChar").innerText = (store === "Toko NMC") ? "N" : "A";

  if (window.AndroidNative && window.AndroidNative.saveActiveStore) {
    window.AndroidNative.saveActiveStore(store);
  }
}

function logoutKasir() {
  if (confirm("Ingin keluar dari terminal toko ini?")) {
    localStorage.removeItem("NIKOLA_STORE_ID");
    localStorage.removeItem("NIKOLA_STORE");
    document.getElementById("onboardingScreen").style.display = "flex";
  }
}

// =========================================================================
// 3. TARIK STATUS SALDO KAS & LABA PPOB HARI INI DARI PC DESKTOP
// =========================================================================
async function fetchLiveStoreData() {
  if (!navigator.onLine) {
    updateConnectionBadge("OFFLINE");
    return;
  }

  updateConnectionBadge("SYNCING");
  try {
    const resp = await fetch(SCRIPT_URL + "?action=get_ringkasan_harian");
    const data = await resp.json();
    if (data && typeof data === 'object') {
      window.storeSummaryToday = data;
      renderTodayFinancials();
      updateConnectionBadge("ONLINE");
    }
  } catch (e) {
    updateConnectionBadge("OFFLINE");
  }
  fetchKatalogFromCloud();
}

function renderTodayFinancials() {
  const store = window.activeStore;
  const d = window.storeSummaryToday[store] || {
    saldo_kas: 0,
    saldo_bri: 0,
    laba_ppob_today: 0,
    saldo_oq: 0,
    saldo_digipos: 0
  };

  if (!window.isSaldoHidden) {
    document.getElementById("displaySaldoKasir").innerText = "Rp " + Number(d.saldo_kas || 0).toLocaleString('id-ID');
  }
  document.getElementById("lblSaldoOqSub").innerText = "Rp " + Number(d.saldo_oq || 0).toLocaleString('id-ID');
  document.getElementById("lblSaldoDigiSub").innerText = "Rp " + Number(d.saldo_digipos || 0).toLocaleString('id-ID');
  document.getElementById("lblLabaPpobSub").innerText = "Rp " + Number(d.laba_ppob_today || 0).toLocaleString('id-ID');
}

function toggleSaldo() {
  window.isSaldoHidden = !window.isSaldoHidden;
  renderTodayFinancials();
  if (window.isSaldoHidden) {
    document.getElementById("displaySaldoKasir").innerText = "••••••••";
  }
}

// =========================================================================
// 4. PENGIRIMAN DATA ANTI-GAGAL (OFFLINE-FIRST)
// =========================================================================
async function sendSafePayload(payload) {
  try {
    updateConnectionBadge("SYNCING");
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    updateConnectionBadge("ONLINE");
    return true;
  } catch (err) {
    let offlineQ = JSON.parse(localStorage.getItem("NIKOLA_OFFLINE_Q") || "[]");
    offlineQ.push(payload);
    localStorage.setItem("NIKOLA_OFFLINE_Q", JSON.stringify(offlineQ));
    updateConnectionBadge("OFFLINE");
    showToast("⚠️ Disimpan di antrean offline HP.");
    return false;
  }
}

async function flushOfflineQueue() {
  let offlineQ = JSON.parse(localStorage.getItem("NIKOLA_OFFLINE_Q") || "[]");
  if (offlineQ.length === 0) return;

  let remaining = [];
  for (let p of offlineQ) {
    try {
      await fetch(SCRIPT_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" }, 
        body: JSON.stringify(p) 
      });
    } catch (e) {
      remaining.push(p);
    }
  }
  localStorage.setItem("NIKOLA_OFFLINE_Q", JSON.stringify(remaining));
  if (remaining.length === 0) {
    showToast("✅ Seluruh antrean offline berhasil terkirim!");
    updateConnectionBadge("ONLINE");
  }
}

// =========================================================================
// 5. MASTER KATALOG & LIVE STOK
// =========================================================================
async function fetchKatalogFromCloud() {
  try {
    const resp = await fetch(SCRIPT_URL + "?action=get_katalog");
    const data = await resp.json();
    if (Array.isArray(data)) {
      window.masterKatalog = data;
      renderStockSummaryView();
    }
  } catch (e) {}
}

function renderStockSummaryView() {
  const cont = document.getElementById("stockListContainer");
  if (!cont) return;
  if (!window.masterKatalog || window.masterKatalog.length === 0) {
    cont.innerHTML = '<div style="text-align:center; padding:20px; color:#64748B;">Katalog stok kosong / belum ditarik.</div>';
    return;
  }
  let html = '';
  window.masterKatalog.forEach(item => {
    const stokToko = (window.activeStore === "Toko NACC") ? (item.stok_nacc || 0) : (item.stok_nmc || 0);
    html += `
      <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:8px; padding:10px; margin-bottom:8px;">
        <div style="font-weight:700; font-size:13px; color:#0F172A;">${item.nama_barang}</div>
        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:11px; color:#64748B;">
          <span>Barcode: ${item.barcode || item.kode_barang}</span>
          <span style="font-weight:700; color:#0264D6;">Rp ${Number(item.harga_jual || 0).toLocaleString('id-ID')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px;">
          <span>Stok ${window.activeStore}: <b>${stokToko}</b></span>
          <span style="color:#94A3B8;">Gdg: ${item.stok_gudang || 0} • Total: ${item.total_stok || 0}</span>
        </div>
      </div>
    `;
  });
  cont.innerHTML = html;
}

// =========================================================================
// 6. PENERIMA NOTIFIKASI PPOB OTOMATIS (DIPANGGIL DARI KOTLIN SAAT APP BUKA)
// =========================================================================
function onPPOBNotificationReceived(appName, saldoAkhir, modal, noTujuan, produk) {
  const item = {
    id_trx: "PPOB-" + Date.now(),
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    aplikasi: appName,
    modal: modal,
    nomor_tujuan: noTujuan,
    produk: produk
  };

  // Masukkan ke urutan teratas daftar transaksi
  window.ppobListToday.unshift(item);
  localStorage.setItem("NIKOLA_PPOB_CACHE", JSON.stringify(window.ppobListToday));

  if (appName.includes("Order Quota") || appName.includes("Order Kuota")) {
    document.getElementById("lblSaldoOqSub").innerText = "Rp " + Number(saldoAkhir).toLocaleString('id-ID');
  } else {
    document.getElementById("lblSaldoDigiSub").innerText = "Rp " + Number(modal).toLocaleString('id-ID');
  }

  // Update Mini Feed Beranda
  const feedMini = document.getElementById("ppobFeedListMini");
  if (feedMini) {
    const itemHtml = `
      <div class="feed-item">
        <div>
          <div class="feed-target">${produk} ➔ ${noTujuan}</div>
          <div class="feed-time">${appName} • ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="feed-cut">-Rp ${Number(modal).toLocaleString('id-ID')}</div>
      </div>
    `;
    feedMini.insertAdjacentHTML('afterbegin', itemHtml);
  }

  showToast(`⚡ ${appName} Rp ${Number(modal).toLocaleString('id-ID')} tercatat otomatis!`);
}

// =========================================================================
// 7. INISIALISASI SAAT APLIKASI DIBUKA (MEMBACA TRANSAKSI LATAR BELAKANG)
// =========================================================================
window.onload = function() {
  const savedStore = localStorage.getItem("NIKOLA_STORE");
  const savedKasir = localStorage.getItem("NIKOLA_KASIR");

  if (savedStore && savedKasir) {
    setSession(savedStore, savedKasir);
    document.getElementById("onboardingScreen").style.display = "none";
    fetchLiveStoreData();
  } else {
    document.getElementById("onboardingScreen").style.display = "flex";
  }

  // 1. TARIK SEMUA TRANSAKSI DARI MEMORI HP YANG TERSERAP SAAT APLIKASI MATI
  if (window.AndroidNative && window.AndroidNative.getOfflinePPOBCache) {
    try {
      const rawNativeCache = window.AndroidNative.getOfflinePPOBCache();
      const nativeList = JSON.parse(rawNativeCache);
      if (Array.isArray(nativeList) && nativeList.length > 0) {
        window.ppobListToday = nativeList;
        localStorage.setItem("NIKOLA_PPOB_CACHE", JSON.stringify(nativeList));

        // Update saldo Order Kuota terakhir
        const latestOQ = nativeList.find(x => x.aplikasi.includes("Order Quota") || x.aplikasi.includes("Order Kuota"));
        if (latestOQ && latestOQ.saldo_akhir > 0) {
          document.getElementById("lblSaldoOqSub").innerText = "Rp " + Number(latestOQ.saldo_akhir).toLocaleString('id-ID');
        }

        // Tampilkan 5 transaksi terakhir di feed beranda
        const feedMini = document.getElementById("ppobFeedListMini");
        if (feedMini) {
          feedMini.innerHTML = "";
          nativeList.slice(0, 5).forEach(item => {
            const timeStr = item.waktu && item.waktu.length >= 16 ? item.waktu.slice(11, 16) : "-";
            feedMini.innerHTML += `
              <div class="feed-item">
                <div>
                  <div class="feed-target">${item.produk} ➔ ${item.nomor_tujuan}</div>
                  <div class="feed-time">${item.aplikasi} • ${timeStr}</div>
                </div>
                <div class="feed-cut">-Rp ${Number(item.modal).toLocaleString('id-ID')}</div>
              </div>
            `;
          });
        }
      }
    } catch (e) {
      console.error("Gagal membaca cache PPOB native:", e);
    }
  }

  // 2. Status Awal Jaringan
  if (navigator.onLine) {
    updateConnectionBadge("SYNCING");
  } else {
    updateConnectionBadge("OFFLINE");
  }

  flushOfflineQueue();

  // Sinkronisasi Latar Belakang Berkala
  setInterval(flushOfflineQueue, 30000);   // Kirim antrean tertunda tiap 30 detik
  setInterval(fetchLiveStoreData, 60000);  // Tarik ringkasan saldo PC tiap 1 menit
};
