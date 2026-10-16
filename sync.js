// =========================================================================
// INISIALISASI SAAT APLIKASI DIBUKA (MEMBACA TRANSAKSI LATAR BELAKANG)
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

  // 1. TARIK DATA DARI MEMORI HP YANG TERSERAP SAAT APLIKASI MATI
  if (window.AndroidNative && window.AndroidNative.getOfflinePPOBCache) {
    try {
      const rawNativeCache = window.AndroidNative.getOfflinePPOBCache();
      const nativeList = JSON.parse(rawNativeCache);
      if (Array.isArray(nativeList) && nativeList.length > 0) {
        window.ppobListToday = nativeList;
        localStorage.setItem("NIKOLA_PPOB_CACHE", JSON.stringify(nativeList));
        
        // Perbarui tampilan mini feed dan status saldo
        const latest = nativeList[0];
        if (latest.aplikasi.includes("Order Quota") && latest.saldo_akhir > 0) {
          document.getElementById("lblSaldoOqSub").innerText = "Rp " + Number(latest.saldo_akhir).toLocaleString('id-ID');
        }

        const feedMini = document.getElementById("ppobFeedListMini");
        if (feedMini) {
          feedMini.innerHTML = "";
          nativeList.slice(0, 5).forEach(item => {
            feedMini.innerHTML += `
              <div class="feed-item">
                <div>
                  <div class="feed-target">${item.produk} ➔ ${item.nomor_tujuan}</div>
                  <div class="feed-time">${item.aplikasi} • ${item.waktu.slice(11, 16)}</div>
                </div>
                <div class="feed-cut">-Rp ${Number(item.modal).toLocaleString('id-ID')}</div>
              </div>
            `;
          });
        }
      }
    } catch (e) {
      console.error("Gagal parse cache PPOB native:", e);
    }
  }

  if (navigator.onLine) updateConnectionBadge("SYNCING");
  else updateConnectionBadge("OFFLINE");

  flushOfflineQueue();
  setInterval(flushOfflineQueue, 30000);
  setInterval(fetchLiveStoreData, 60000);
};
