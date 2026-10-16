// =========================================================================
// MODUL OPERASIONAL: LOGISTIK, MUTASI, PPOB CHECKLIST, MEMBER & KALKULATOR
// =========================================================================

window.activeStore = window.activeStore || "Toko NMC";
window.masterKatalog = window.masterKatalog || [];
let cartMutasi = {};

function goHome() {
  closeAllWorkspaces();
  if (window.AndroidNative && window.AndroidNative.onWorkspaceStateChanged) {
    window.AndroidNative.onWorkspaceStateChanged(false);
  }
}

function closeAllWorkspaces() {
  stopAllCameras();
  document.querySelectorAll(".workspace-screen").forEach(w => w.style.display = "none");
}

function openWorkspace(id) {
  closeAllWorkspaces();

  if (id === 'SCAN_MASUK') {
    document.getElementById("wsScanMasuk").style.display = "flex";
    resetFormMasuk();
  }
  else if (id === 'MUTASI') {
    document.getElementById("wsMutasi").style.display = "flex";
    populateKatalogMutasi();
  }
  else if (id === 'PPOB_FEED') {
    document.getElementById("wsPpobFeed").style.display = "flex";
    renderPpobChecklist();
  }
  else if (id === 'MEMBER_DAFTAR') {
    document.getElementById("wsMemberDaftar").style.display = "flex";
  }
  else if (id === 'MEMBER_SCAN') {
    document.getElementById("wsMemberScan").style.display = "flex";
  }
  else if (id === 'BIAYA') {
    document.getElementById("wsBiaya").style.display = "flex";
  }
  else if (id === 'REKAP') {
    document.getElementById("wsRekap").style.display = "flex";
    hitungTotalLaci();
  }
  else if (id === 'STOK') {
    document.getElementById("wsStok").style.display = "flex";
    renderStockSummaryView();
  }
  else if (id === 'SOP') {
    document.getElementById("wsSOP").style.display = "flex";
  }

  if (window.AndroidNative && window.AndroidNative.onWorkspaceStateChanged) {
    window.AndroidNative.onWorkspaceStateChanged(true);
  }
}

// =========================================================================
// 1. LOGISTIK: SCAN BARANG MASUK / KULAKAN + KALKULATOR KEMBALIAN
// =========================================================================
function resetFormMasuk() {
  document.getElementById("inpBarcodeMasuk").value = "";
  document.getElementById("inpNamaBarangMasuk").value = "";
  document.getElementById("inpModalMasuk").value = "";
  document.getElementById("inpJualMasuk").value = "";
  document.getElementById("inpQtyMasuk").value = "1";
  document.getElementById("inpUangDiterima").value = "";
  document.getElementById("lblTotalEstimasiKulakan").innerText = "Rp 0";
  document.getElementById("lblUangKembalian").innerText = "Rp 0";
  document.getElementById("panelItemStatus").style.display = "none";
}

function hitungTotalKulakan() {
  const modal = parseInt(document.getElementById("inpModalMasuk").value) || 0;
  const qty = parseInt(document.getElementById("inpQtyMasuk").value) || 1;
  const total = modal * qty;

  const lblTotal = document.getElementById("lblTotalEstimasiKulakan");
  if (lblTotal) {
    lblTotal.innerText = "Rp " + total.toLocaleString('id-ID');
  }
  hitungKembalianKulakan();
}

function hitungKembalianKulakan() {
  const modal = parseInt(document.getElementById("inpModalMasuk").value) || 0;
  const qty = parseInt(document.getElementById("inpQtyMasuk").value) || 1;
  const totalBelanja = modal * qty;

  const uangDiterima = parseInt(document.getElementById("inpUangDiterima").value) || 0;
  const kembalian = uangDiterima - totalBelanja;

  const lblKembalian = document.getElementById("lblUangKembalian");
  if (lblKembalian) {
    if (uangDiterima === 0) {
      lblKembalian.innerText = "Rp 0";
      lblKembalian.style.color = "#B45309";
    } else if (kembalian < 0) {
      lblKembalian.innerText = "⚠️ Uang Kurang (Rp " + Math.abs(kembalian).toLocaleString('id-ID') + ")";
      lblKembalian.style.color = "#EF4444";
    } else {
      lblKembalian.innerText = "Rp " + kembalian.toLocaleString('id-ID');
      lblKembalian.style.color = "#16A34A";
    }
  }
}

function onBarcodeEnteredManual() {
  const code = document.getElementById("inpBarcodeMasuk").value.trim();
  if (code) handleScannedBarcodeMasuk(code);
}

function handleScannedBarcodeMasuk(cleanCode) {
  document.getElementById("inpBarcodeMasuk").value = cleanCode;
  const panel = document.getElementById("panelItemStatus");

  const prod = window.masterKatalog.find(p =>
    p.kode_barang === cleanCode ||
    (p.barcode && p.barcode.includes(cleanCode))
  );

  panel.style.display = "block";
  if (prod) {
    panel.style.background = "#DCFCE7";
    panel.style.border = "1px solid #86EFAC";
    panel.innerHTML = `
      <div style="font-weight: 800; color: #166534; font-size: 11px;">✅ BARANG TERDAFTAR DI MASTER</div>
      <div style="font-size: 12px; font-weight: 700; color: #0F172A;">${prod.nama_barang}</div>
      <div style="font-size: 10px; color: #475569;">Stok Gudang: ${prod.stok_gudang || 0} | NMC: ${prod.stok_nmc || 0} | NACC: ${prod.stok_nacc || 0}</div>
    `;
    document.getElementById("inpNamaBarangMasuk").value = prod.nama_barang;
    document.getElementById("inpNamaBarangMasuk").readOnly = true;
    document.getElementById("inpModalMasuk").value = prod.harga_modal || 0;
    document.getElementById("inpJualMasuk").value = prod.harga_jual || 0;
  } else {
    panel.style.background = "#FEF3C7";
    panel.style.border = "1px solid #FDE68A";
    panel.innerHTML = `
      <div style="font-weight: 800; color: #92400E; font-size: 11px;">✨ BARANG BARU (BELUM DI MASTER)</div>
      <div style="font-size: 10px; color: #78350F;">Lengkapi nama dan harga. Sistem akan mendaftarkannya ke PC Desktop.</div>
    `;
    document.getElementById("inpNamaBarangMasuk").value = "";
    document.getElementById("inpNamaBarangMasuk").readOnly = false;
    document.getElementById("inpModalMasuk").value = "";
    document.getElementById("inpJualMasuk").value = "";
  }
  hitungTotalKulakan();
}

async function simpanBarangMasuk() {
  const code = document.getElementById("inpBarcodeMasuk").value.trim();
  const nama = document.getElementById("inpNamaBarangMasuk").value.trim();
  const modal = parseInt(document.getElementById("inpModalMasuk").value) || 0;
  const jual = parseInt(document.getElementById("inpJualMasuk").value) || modal;
  const qty = parseInt(document.getElementById("inpQtyMasuk").value) || 1;
  const lokasi = document.getElementById("selLokasiMasuk").value;

  if (!code) return alert("Barcode tidak boleh kosong!");
  if (!nama) return alert("Nama barang wajib diisi!");
  if (qty <= 0) return alert("Jumlah QTY harus lebih dari 0!");

  const prod = window.masterKatalog.find(p => p.kode_barang === code || (p.barcode && p.barcode.includes(code)));
  const jenisTrx = prod ? "KULAKAN" : "DAFTAR_BARU";

  const payload = {
    batch_id: "IN-" + Date.now(),
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    jenis: jenisTrx,
    tujuan: lokasi,
    items: [{
      barcode: code,
      nama: nama,
      qty: qty,
      modal: modal,
      jual: jual
    }]
  };

  await sendSafePayload(payload);
  alert(`✅ Stok masuk ${nama} (${qty} pcs) dikirim ke PC Desktop!`);
  resetFormMasuk();
  goHome();
}

// =========================================================================
// 2. MUTASI STOK GUDANG ➔ TOKO CABANG
// =========================================================================
function populateKatalogMutasi() {
  const sel = document.getElementById("selKatalogMutasi");
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Produk Master --</option>';

  window.masterKatalog.forEach((item, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${item.nama_barang} (Stok Gudang: ${item.stok_gudang || 0})`;
    sel.appendChild(opt);
  });
}

function onSelectKatalogMutasi() {
  const sel = document.getElementById("selKatalogMutasi");
  if (!sel || sel.value === "") return;
  const prod = window.masterKatalog[sel.value];
  if (prod) {
    document.getElementById("lblStokGudangMutasi").innerText = prod.stok_gudang || 0;
  }
}

function handleScannedBarcodeMutasi(cleanCode) {
  cartMutasi[cleanCode] = (cartMutasi[cleanCode] || 0) + 1;
  renderCartMutasi();
  showToast("Voucher terpindai: " + cleanCode);
}

function renderCartMutasi() {
  const tbody = document.getElementById("cartTableMutasi");
  tbody.innerHTML = "";
  const keys = Object.keys(cartMutasi);
  if (keys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-gray); padding: 12px;">Belum ada item dipindai.</td></tr>`;
    return;
  }
  keys.forEach(k => {
    tbody.innerHTML += `
      <tr>
        <td><span class="badge-code">${k}</span></td>
        <td style="text-align: center;"><input type="number" class="qty-input" value="${cartMutasi[k]}" onchange="cartMutasi['${k}']=parseInt(this.value)||1; renderCartMutasi();"></td>
        <td style="text-align: right;"><button class="btn-danger" onclick="delete cartMutasi['${k}']; renderCartMutasi();">✕</button></td>
      </tr>
    `;
  });
}

function clearCartMutasi() {
  cartMutasi = {};
  renderCartMutasi();
}

async function kirimMutasiStok() {
  const keys = Object.keys(cartMutasi);
  if (keys.length === 0) return alert("Pindai minimal 1 barcode voucher untuk dimutasi!");
  const sel = document.getElementById("selKatalogMutasi");
  if (!sel || sel.value === "") return alert("Pilih produk master terlebih dahulu!");

  const prod = window.masterKatalog[sel.value];
  const tujuan = document.getElementById("selTujuanMutasi").value;

  const payload = {
    batch_id: "MUTASI-" + Date.now(),
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    jenis: "TRANSFER",
    asal: "Gudang Utama",
    tujuan: tujuan,
    items: keys.map(k => ({
      barcode: k,
      qty: cartMutasi[k],
      modal: prod.harga_modal,
      nama: prod.nama_barang,
      jual: prod.harga_jual
    }))
  };

  await sendSafePayload(payload);
  alert(`✅ Mutasi ${keys.length} item ke ${tujuan} berhasil dikirim ke PC Desktop!`);
  clearCartMutasi();
  goHome();
}

// =========================================================================
// 3. PPOB CHECKLIST VERIFIKASI
// =========================================================================
function renderPpobChecklist() {
  const cont = document.getElementById("ppobChecklistContainer");
  if (!cont) return;

  const rawList = window.ppobListToday || [];
  if (rawList.length === 0) {
    cont.innerHTML = `
      <div style="text-align: center; color: var(--text-gray); padding: 25px 10px;">
        Belum ada notifikasi transaksi masuk hari ini.<br>
        <span style="font-size: 10px;">Setiap notifikasi Order Kuota/Digipos akan otomatis tampil di sini.</span>
      </div>
    `;
    return;
  }

  const verifiedMap = JSON.parse(localStorage.getItem("NIKOLA_VERIFIED_PPOB") || "{}");

  let html = '';
  rawList.forEach((trx) => {
    const isChecked = !!verifiedMap[trx.id_trx];
    html += `
      <div class="checklist-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" style="width: 20px; height: 20px;" ${isChecked ? "checked" : ""} onchange="togglePpobVerify('${trx.id_trx}', this.checked)">
          <div>
            <div style="font-weight: 800; font-size: 12px; color: ${isChecked ? '#16A34A' : '#0F172A'};">
              ${trx.produk || 'Produk'} ➔ ${trx.nomor_tujuan || '-'}
            </div>
            <div style="font-size: 9.5px; color: var(--text-gray);">
              ${trx.aplikasi || 'PPOB'} • ${trx.waktu ? trx.waktu.slice(11, 16) : ''} • ID: ${trx.id_trx}
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 900; font-size: 12px; color: #EF4444;">-Rp ${Number(trx.modal || 0).toLocaleString('id-ID')}</div>
          <div style="font-size: 9px; font-weight: 800; color: ${isChecked ? '#16A34A' : '#D97706'};">
            ${isChecked ? '✅ COCOK FISIK' : '⏳ BELUM DICEKLIS'}
          </div>
        </div>
      </div>
    `;
  });
  cont.innerHTML = html;
}

function togglePpobVerify(idTrx, isChecked) {
  const verifiedMap = JSON.parse(localStorage.getItem("NIKOLA_VERIFIED_PPOB") || "{}");
  if (isChecked) verifiedMap[idTrx] = true;
  else delete verifiedMap[idTrx];
  localStorage.setItem("NIKOLA_VERIFIED_PPOB", JSON.stringify(verifiedMap));
  renderPpobChecklist();
}

// =========================================================================
// 4. MEMBER LOYALITAS
// =========================================================================
let lastRegisteredMember = null;

async function simpanMemberDanGenerateBarcode() {
  const wa = document.getElementById("inpMemberWA").value.trim();
  const nama = document.getElementById("inpMemberName").value.trim();

  if (!wa || wa.length < 10) return alert("Nomor WhatsApp tidak valid!");
  if (!nama) return alert("Nama member wajib diisi!");

  const cleanWA = wa.startsWith("0") ? "62" + wa.slice(1) : wa;
  const memberId = "MBR-" + cleanWA.slice(-6);

  const payload = {
    action: "sync_operation",
    tipe_operasi: "MEMBER_BARU",
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    toko: window.activeStore,
    id_member: memberId,
    nama_member: nama,
    nomor_wa: cleanWA
  };

  await sendSafePayload(payload);

  let members = JSON.parse(localStorage.getItem("NIKOLA_LOCAL_MEMBERS") || "[]");
  members.push({ id_member: memberId, nama_member: nama, nomor_wa: cleanWA, poin: 0 });
  localStorage.setItem("NIKOLA_LOCAL_MEMBERS", JSON.stringify(members));

  lastRegisteredMember = { id: memberId, nama: nama, wa: cleanWA };

  document.getElementById("cardMemberResult").style.display = "block";
  document.getElementById("resMemberName").innerText = nama;
  document.getElementById("resMemberWA").innerText = cleanWA;
  document.getElementById("resMemberID").innerText = memberId;

  try {
    JsBarcode("#memberBarcodeSvg", memberId, {
      format: "CODE128",
      lineColor: "#0F172A",
      width: 2,
      height: 50,
      displayValue: true
    });
  } catch (e) {
    console.error("Barcode Error:", e);
  }

  alert(`✅ Member Berhasil Didaftarkan!\nID Member: ${memberId}`);
  document.getElementById("inpMemberWA").value = "";
  document.getElementById("inpMemberName").value = "";
}

function kirimKartuMemberViaWA() {
  if (!lastRegisteredMember) return alert("Belum ada data member yang dibuat.");
  const msg = `Halo Kak ${lastRegisteredMember.nama},\nSelamat! Anda resmi terdaftar sebagai Member Nikola Cell.\n\nNomor Member: *${lastRegisteredMember.id}*\nGunakan nomor ini atau tunjukkan kartu saat bertransaksi untuk mengumpulkan poin reward menarik.\n\nTerima kasih!`;
  window.location.href = `whatsapp://send?phone=${lastRegisteredMember.wa}&text=${encodeURIComponent(msg)}`;
}

function handleScannedBarcodeMember(cleanCode) {
  const panel = document.getElementById("panelMemberScanResult");
  const members = JSON.parse(localStorage.getItem("NIKOLA_LOCAL_MEMBERS") || "[]");
  const mbr = members.find(m => m.id_member === cleanCode || cleanCode.includes(m.id_member));

  panel.style.display = "block";
  if (mbr) {
    document.getElementById("scanResMemberName").innerText = mbr.nama_member;
    document.getElementById("scanResMemberID").innerText = `ID: ${mbr.id_member} • WA: ${mbr.nomor_wa}`;
    document.getElementById("scanResMemberPoin").innerText = `${mbr.poin || 0} Poin`;
    showToast(`✅ Member Ditemukan: ${mbr.nama_member}`);
  } else {
    document.getElementById("scanResMemberName").innerText = "Member Baru / Tamu";
    document.getElementById("scanResMemberID").innerText = `Kode: ${cleanCode}`;
    document.getElementById("scanResMemberPoin").innerText = "0 Poin";
    showToast("Barcode terdeteksi: " + cleanCode);
  }
}

// =========================================================================
// 5. KAS KELUAR & HITUNG LACI EOD
// =========================================================================
async function simpanBiayaKasir() {
  const kat = document.getElementById("katBiayaSelect").value;
  const nom = parseInt(document.getElementById("inpNominalBiaya").value) || 0;
  const ket = document.getElementById("inpKetBiaya").value.trim();

  if (nom <= 0) return alert("Nominal biaya harus lebih dari Rp 0!");
  if (!ket) return alert("Keterangan wajib diisi!");

  const isSetor = (kat === "SETOR_OWNER");
  const payload = {
    action: "sync_operation",
    tipe_operasi: isSetor ? "SETOR_OWNER" : "OPERASIONAL",
    id_trx: "EXP-" + Date.now(),
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    toko: window.activeStore,
    nominal: nom,
    kategori: kat,
    deskripsi: ket
  };

  await sendSafePayload(payload);
  alert(`✅ ${isSetor ? 'Setoran Kas ke Owner' : 'Pengeluaran Toko'} Rp ${nom.toLocaleString('id-ID')} dicatat ke Desktop!`);
  document.getElementById("inpNominalBiaya").value = "";
  document.getElementById("inpKetBiaya").value = "";
  goHome();
}

function hitungTotalLaci() {
  let total = 0;
  document.querySelectorAll(".inp-pecahan").forEach(inp => {
    const val = parseInt(inp.getAttribute("data-val")) || 0;
    const lembar = parseInt(inp.value) || 0;
    total += (val * lembar);
  });
  const receh = parseInt(document.getElementById("inpReceh")?.value) || 0;
  total += receh;
  if (document.getElementById("lblTotalFisikLaci")) {
    document.getElementById("lblTotalFisikLaci").innerText = "Rp " + total.toLocaleString('id-ID');
  }
  return total;
}

async function simpanHitungLaciEOD() {
  const total = hitungTotalLaci();
  if (total <= 0) {
    if (!confirm("⚠️ Total fisik laci Rp 0. Apakah Anda yakin ingin menyimpan?")) return;
  }

  const rincian = {};
  document.querySelectorAll(".inp-pecahan").forEach(inp => {
    const val = inp.getAttribute("data-val");
    const lembar = parseInt(inp.value) || 0;
    if (lembar > 0) rincian["Rp " + parseInt(val).toLocaleString('id-ID')] = lembar;
  });
  const receh = parseInt(document.getElementById("inpReceh")?.value) || 0;
  if (receh > 0) rincian["Koin/Receh"] = receh;

  if (!confirm(`Konfirmasi Tutup Kasir (EOD):\nToko: ${window.activeStore}\nTotal Fisik Laci: Rp ${total.toLocaleString('id-ID')}\nKirim rekonsiliasi ke PC Desktop?`)) {
    return;
  }

  const payload = {
    action: "sync_operation",
    tipe_operasi: "HITUNG_LACI",
    id_trx: "EOD-MOB-" + Date.now(),
    waktu: new Date().toISOString().slice(0, 19).replace('T', ' '),
    toko: window.activeStore,
    nominal: total,
    deskripsi: `Hitung Fisik Laci ${window.activeStore} EOD`,
    extra_json: JSON.stringify(rincian)
  };

  await sendSafePayload(payload);
  alert(`✅ Hitung Fisik Laci Rp ${total.toLocaleString('id-ID')} berhasil terkirim ke Desktop!`);
  goHome();
}
