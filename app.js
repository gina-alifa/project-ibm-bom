/**
 * KosKu Docs – app.js
 * Boarding-house management app with Document-to-Database feature.
 * Stack: HTML5 + CSS3 + Vanilla JS | Storage: localStorage
 */

'use strict';

/* =============================================================
   SECTION 1 – CONSTANTS & DATA STORE
   ============================================================= */

const STORAGE_KEYS = {
  rooms:    'kosku_rooms',
  tenants:  'kosku_tenants',
  payments: 'kosku_payments',
};

/** Load from localStorage or return default */
function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

/** Persist array to localStorage */
function saveStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Generate a simple unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* =============================================================
   SECTION 2 – SEED / DUMMY DATA
   Only written on first load (localStorage absent).
   ============================================================= */

function seedData() {
  // ── Rooms ──
  const rooms = [
    { id: 'A1', label: 'A1', type: 'Standar',  price: 700000  },
    { id: 'A2', label: 'A2', type: 'Standar',  price: 700000  },
    { id: 'A3', label: 'A3', type: 'Standar',  price: 700000  },
    { id: 'B1', label: 'B1', type: 'Deluxe',   price: 900000  },
    { id: 'B2', label: 'B2', type: 'Deluxe',   price: 900000  },
    { id: 'B3', label: 'B3', type: 'Deluxe',   price: 900000  },
    { id: 'C1', label: 'C1', type: 'VIP',      price: 1200000 },
    { id: 'C2', label: 'C2', type: 'VIP',      price: 1200000 },
    { id: 'C3', label: 'C3', type: 'VIP',      price: 1200000 },
    { id: 'D1', label: 'D1', type: 'Eksklusif',price: 1500000 },
  ];

  // ── Tenants ──
  const tenants = [
    { id: 't1', name: 'Budi Santoso',    phone: '081234567890', room: 'A1', moveIn: '2026-08-01', rent: 700000  },
    { id: 't2', name: 'Siti Rahayu',     phone: '082345678901', room: 'A2', moveIn: '2026-07-15', rent: 700000  },
    { id: 't3', name: 'Dedi Kurniawan',  phone: '083456789012', room: 'B1', moveIn: '2026-09-01', rent: 900000  },
    { id: 't4', name: 'Maya Lestari',    phone: '084567890123', room: 'B3', moveIn: '2026-06-01', rent: 900000  },
    { id: 't5', name: 'Rizky Pratama',   phone: '085678901234', room: 'C1', moveIn: '2026-10-01', rent: 1200000 },
    { id: 't6', name: 'Fitri Handayani', phone: '086789012345', room: 'D1', moveIn: '2026-08-15', rent: 1500000 },
  ];

  // ── Payments (3 months × 6 tenants) ──
  const months = ['2026-08', '2026-09', '2026-10'];
  const payments = [];

  // Statuses per tenant per month (hardcoded for realistic dummy data)
  const statusMatrix = {
    t1: ['Lunas',       'Lunas',      'Lunas'      ],
    t2: ['Lunas',       'Lunas',      'Terlambat'  ],
    t3: ['Lunas',       'Lunas',      'Belum Bayar'],
    t4: ['Lunas',       'Terlambat',  'Lunas'      ],
    t5: ['Belum Bayar', 'Lunas',      'Lunas'      ],
    t6: ['Lunas',       'Lunas',      'Lunas'      ],
  };

  const paidDays = { 'Lunas': '03', 'Terlambat': '08', 'Belum Bayar': null };

  tenants.forEach(t => {
    months.forEach((m, i) => {
      const status = statusMatrix[t.id][i];
      const day    = paidDays[status];
      payments.push({
        id:     uid(),
        tenant: t.id,
        month:  m,
        amount: t.rent,
        paidAt: day ? `${m}-${day}` : '',
        status,
      });
    });
  });

  saveStore(STORAGE_KEYS.rooms,    rooms);
  saveStore(STORAGE_KEYS.tenants,  tenants);
  saveStore(STORAGE_KEYS.payments, payments);
}

/* Seed only if no data exists yet */
if (!localStorage.getItem(STORAGE_KEYS.rooms)) seedData();

/* Live data references (always read fresh from storage) */
const DB = {
  get rooms()    { return loadStore(STORAGE_KEYS.rooms,    []); },
  get tenants()  { return loadStore(STORAGE_KEYS.tenants,  []); },
  get payments() { return loadStore(STORAGE_KEYS.payments, []); },
};

/* =============================================================
   SECTION 3 – UTILITIES
   ============================================================= */

/** Format number as Indonesian Rupiah, e.g. Rp 1.200.000 */
function formatRp(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

/** Format ISO date string to DD/MM/YYYY */
function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Return YYYY-MM of today */
function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Return today's ISO date string */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Resolve a payment's effective status.
 *  Auto-upgrades "Belum Bayar" → "Terlambat" if past day-5 of the month. */
function resolveStatus(payment) {
  if (payment.status === 'Lunas') return 'Lunas';
  // If already explicitly marked Terlambat
  if (payment.status === 'Terlambat') return 'Terlambat';
  // Auto-detect: if today is past day 5 of payment.month
  const today = new Date();
  const [y, m] = payment.month.split('-').map(Number);
  const dueDate = new Date(y, m - 1, 5);
  if (today > dueDate) return 'Terlambat';
  return 'Belum Bayar';
}

/** Build a status <span> badge */
function badgeHTML(status) {
  const cls = {
    'Lunas':      'badge-lunas',
    'Belum Bayar':'badge-belum',
    'Terlambat':  'badge-terlambat',
    'Terisi':     'badge-terisi',
    'Kosong':     'badge-kosong',
  };
  return `<span class="badge ${cls[status] || ''}">${status}</span>`;
}

/** Show toast notification */
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  setTimeout(() => { el.className = 'toast'; }, 3200);
}

/** Get tenant name by id */
function tenantName(id) {
  const t = DB.tenants.find(t => t.id === id);
  return t ? t.name : '—';
}

/** Get room label + type for a tenant */
function tenantRoom(id) {
  const t = DB.tenants.find(t => t.id === id);
  return t ? t.room : '—';
}

/* =============================================================
   SECTION 4 – NAVIGATION
   ============================================================= */

const pageTitles = {
  dashboard:  'Dashboard',
  kamar:      'Daftar Kamar',
  penghuni:   'Penghuni',
  pembayaran: 'Pembayaran',
  dokumen:    'Document to Database',
};

function navigateTo(pageId) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    const isActive = btn.dataset.page === pageId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Show/hide page sections
  document.querySelectorAll('.page').forEach(sec => {
    sec.classList.toggle('active', sec.id === `page-${pageId}`);
  });

  // Update page title
  document.getElementById('pageTitle').textContent = pageTitles[pageId] || '';

  // Render the relevant page
  const renderMap = {
    dashboard:  renderDashboard,
    kamar:      renderKamar,
    penghuni:   renderPenghuni,
    pembayaran: renderPembayaran,
    dokumen:    () => {}, // static, no render needed
  };
  if (renderMap[pageId]) renderMap[pageId]();

  // Close mobile sidebar
  closeSidebar();
}

/* ── Sidebar toggle (mobile) ── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
}

/* =============================================================
   SECTION 5 – DASHBOARD
   ============================================================= */

function renderDashboard() {
  const tenants  = DB.tenants;
  const rooms    = DB.rooms;
  const payments = DB.payments;
  const thisMonth = todayMonth();

  const occupied = tenants.length;
  const vacant   = rooms.length - occupied;

  // Monthly revenue = sum of Lunas payments for current month
  const revenue = payments
    .filter(p => p.month === thisMonth && resolveStatus(p) === 'Lunas')
    .reduce((sum, p) => sum + p.amount, 0);

  document.getElementById('kpiTotal').textContent    = rooms.length;
  document.getElementById('kpiOccupied').textContent = occupied;
  document.getElementById('kpiVacant').textContent   = Math.max(0, vacant);
  document.getElementById('kpiRevenue').textContent  = formatRp(revenue);

  // Recent payments (last 5)
  const recent = [...payments]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 8);

  const tbody = document.querySelector('#dashRecentPayments tbody');
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><span class="empty-icon">📭</span>Belum ada data pembayaran.</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(p => {
    const status = resolveStatus(p);
    return `<tr>
      <td>${tenantName(p.tenant)}</td>
      <td>${tenantRoom(p.tenant)}</td>
      <td>${p.month}</td>
      <td>${formatRp(p.amount)}</td>
      <td>${badgeHTML(status)}</td>
    </tr>`;
  }).join('');
}

/* =============================================================
   SECTION 6 – KAMAR (ROOMS)
   ============================================================= */

function renderKamar() {
  const rooms   = DB.rooms;
  const tenants = DB.tenants;
  const tbody   = document.querySelector('#kamarTable tbody');

  if (rooms.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><span class="empty-icon">🚪</span>Belum ada data kamar.</td></tr>`;
    return;
  }

  tbody.innerHTML = rooms.map(r => {
    const occupant = tenants.find(t => t.room === r.id);
    const status   = occupant ? 'Terisi' : 'Kosong';
    return `<tr>
      <td><strong>${r.label}</strong></td>
      <td>${r.type}</td>
      <td>${formatRp(r.price)}</td>
      <td>${badgeHTML(status)}</td>
      <td>${occupant ? escapeHTML(occupant.name) : '<span style="color:var(--text-muted)">—</span>'}</td>
    </tr>`;
  }).join('');
}

/* =============================================================
   SECTION 7 – PENGHUNI (TENANTS)
   ============================================================= */

function renderPenghuni(filter = '') {
  const tenants = DB.tenants;
  const tbody   = document.querySelector('#penghuniTable tbody');
  const lower   = filter.toLowerCase();

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.room.toLowerCase().includes(lower)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><span class="empty-icon">👥</span>${filter ? 'Tidak ada hasil pencarian.' : 'Belum ada data penghuni.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => `<tr>
    <td><strong>${escapeHTML(t.name)}</strong></td>
    <td>${escapeHTML(t.phone)}</td>
    <td><span class="badge badge-terisi">${t.room}</span></td>
    <td>${formatDate(t.moveIn)}</td>
    <td>${formatRp(t.rent)}</td>
    <td>
      <div class="action-btns">
        <button class="btn btn-sm btn-ghost" onclick="openEditTenant('${t.id}')" aria-label="Edit ${escapeHTML(t.name)}">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTenant('${t.id}')" aria-label="Hapus ${escapeHTML(t.name)}">🗑️</button>
      </div>
    </td>
  </tr>`).join('');
}

/** Populate the room dropdown (available + current room if editing) */
function populateRoomSelect(currentRoom = '') {
  const tenants = DB.tenants;
  const rooms   = DB.rooms;
  const sel     = document.getElementById('fKamar');
  const occupied = tenants.map(t => t.room);

  sel.innerHTML = '<option value="">-- Pilih Kamar --</option>';
  rooms.forEach(r => {
    const isOccupied = occupied.includes(r.id) && r.id !== currentRoom;
    if (!isOccupied) {
      sel.insertAdjacentHTML('beforeend', `<option value="${r.id}">${r.label} – ${r.type} (${formatRp(r.price)})</option>`);
    }
  });
}

/** Open Add Tenant modal */
function openAddTenant() {
  clearTenantForm();
  document.getElementById('modalPenghuniTitle').textContent = 'Tambah Penghuni';
  document.getElementById('fTenantId').value = '';
  document.getElementById('fMasuk').value = todayISO();
  populateRoomSelect();
  document.getElementById('modalPenghuni').removeAttribute('hidden');
  document.getElementById('fNama').focus();
}

/** Open Edit Tenant modal */
function openEditTenant(id) {
  const t = DB.tenants.find(t => t.id === id);
  if (!t) return;
  clearTenantForm();
  document.getElementById('modalPenghuniTitle').textContent = 'Edit Penghuni';
  document.getElementById('fTenantId').value = id;
  document.getElementById('fNama').value     = t.name;
  document.getElementById('fHP').value       = t.phone;
  document.getElementById('fMasuk').value    = t.moveIn;
  document.getElementById('fSewa').value     = t.rent;
  populateRoomSelect(t.room);
  document.getElementById('fKamar').value    = t.room;
  document.getElementById('modalPenghuni').removeAttribute('hidden');
  document.getElementById('fNama').focus();
}

/** Delete a tenant (and their payments) */
function deleteTenant(id) {
  const t = DB.tenants.find(t => t.id === id);
  if (!t) return;
  if (!confirm(`Hapus penghuni "${t.name}"? Data pembayarannya juga akan dihapus.`)) return;

  saveStore(STORAGE_KEYS.tenants,  DB.tenants.filter(x => x.id !== id));
  saveStore(STORAGE_KEYS.payments, DB.payments.filter(p => p.tenant !== id));
  renderPenghuni(document.getElementById('searchTenant').value);
  toast(`Penghuni "${t.name}" berhasil dihapus.`);
}

/** Clear tenant form fields and errors */
function clearTenantForm() {
  ['fNama','fHP','fKamar','fMasuk','fSewa'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('invalid');
  });
  ['errNama','errHP','errKamar','errMasuk','errSewa'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

/** Validate & save tenant form */
function saveTenant(e) {
  e.preventDefault();
  let valid = true;

  const fields = [
    { id: 'fNama',  err: 'errNama',  msg: 'Nama wajib diisi (min. 2 karakter).',   check: v => v.length >= 2      },
    { id: 'fHP',    err: 'errHP',    msg: 'No. HP tidak valid (8–16 digit).',       check: v => /^[0-9+\-\s]{8,16}$/.test(v) },
    { id: 'fKamar', err: 'errKamar', msg: 'Pilih kamar terlebih dahulu.',           check: v => v !== ''           },
    { id: 'fMasuk', err: 'errMasuk', msg: 'Tanggal masuk wajib diisi.',             check: v => v !== ''           },
    { id: 'fSewa',  err: 'errSewa',  msg: 'Harga sewa minimal Rp 100.000.',         check: v => Number(v) >= 100000},
  ];

  fields.forEach(({ id, err, msg, check }) => {
    const el  = document.getElementById(id);
    const val = el.value.trim();
    if (!check(val)) {
      el.classList.add('invalid');
      document.getElementById(err).textContent = msg;
      valid = false;
    } else {
      el.classList.remove('invalid');
      document.getElementById(err).textContent = '';
    }
  });

  if (!valid) return;

  const tenantId = document.getElementById('fTenantId').value;
  const newTenant = {
    id:     tenantId || uid(),
    name:   document.getElementById('fNama').value.trim(),
    phone:  document.getElementById('fHP').value.trim(),
    room:   document.getElementById('fKamar').value,
    moveIn: document.getElementById('fMasuk').value,
    rent:   Number(document.getElementById('fSewa').value),
  };

  const tenants = DB.tenants;
  if (tenantId) {
    const idx = tenants.findIndex(t => t.id === tenantId);
    if (idx >= 0) tenants[idx] = newTenant;
  } else {
    tenants.push(newTenant);
  }

  saveStore(STORAGE_KEYS.tenants, tenants);
  document.getElementById('modalPenghuni').setAttribute('hidden', '');
  renderPenghuni(document.getElementById('searchTenant').value);
  toast(tenantId ? 'Data penghuni berhasil diperbarui.' : 'Penghuni baru berhasil ditambahkan.', 'success');
}

/* =============================================================
   SECTION 8 – PEMBAYARAN (PAYMENTS)
   ============================================================= */

function renderPembayaran(filter = '', statusFilter = '') {
  const payments = DB.payments;
  const lower    = filter.toLowerCase();

  const filtered = payments.filter(p => {
    const name  = tenantName(p.tenant).toLowerCase();
    const room  = tenantRoom(p.tenant).toLowerCase();
    const effStatus = resolveStatus(p);

    const matchText   = name.includes(lower) || room.includes(lower) || p.month.includes(lower);
    const matchStatus = !statusFilter || effStatus === statusFilter;
    return matchText && matchStatus;
  }).sort((a, b) => b.month.localeCompare(a.month));

  const tbody = document.querySelector('#pembayaranTable tbody');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><span class="empty-icon">💳</span>${filter || statusFilter ? 'Tidak ada hasil pencarian.' : 'Belum ada data pembayaran.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const status = resolveStatus(p);
    return `<tr>
      <td><strong>${escapeHTML(tenantName(p.tenant))}</strong></td>
      <td>${escapeHTML(tenantRoom(p.tenant))}</td>
      <td>${p.month}</td>
      <td>${formatRp(p.amount)}</td>
      <td>${p.paidAt ? formatDate(p.paidAt) : '—'}</td>
      <td>${badgeHTML(status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-ghost" onclick="openEditPayment('${p.id}')" aria-label="Edit pembayaran">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deletePayment('${p.id}')" aria-label="Hapus pembayaran">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/** Populate tenant select in payment modal */
function populateTenantSelect(selectedId = '') {
  const sel = document.getElementById('pPenghuni');
  sel.innerHTML = '<option value="">-- Pilih Penghuni --</option>';
  DB.tenants.forEach(t => {
    sel.insertAdjacentHTML('beforeend',
      `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${escapeHTML(t.name)} – ${t.room}</option>`
    );
  });
}

/** Open Add Payment modal */
function openAddPayment() {
  clearPaymentForm();
  document.getElementById('modalPembayaranTitle').textContent = 'Catat Pembayaran';
  document.getElementById('pPaymentId').value = '';
  document.getElementById('pBulan').value = todayMonth();
  document.getElementById('pTglBayar').value = todayISO();
  populateTenantSelect();
  document.getElementById('modalPembayaran').removeAttribute('hidden');
  document.getElementById('pPenghuni').focus();
}

/** Open Edit Payment modal */
function openEditPayment(id) {
  const p = DB.payments.find(p => p.id === id);
  if (!p) return;
  clearPaymentForm();
  document.getElementById('modalPembayaranTitle').textContent = 'Edit Pembayaran';
  document.getElementById('pPaymentId').value  = id;
  document.getElementById('pBulan').value      = p.month;
  document.getElementById('pJumlah').value     = p.amount;
  document.getElementById('pTglBayar').value   = p.paidAt;
  document.getElementById('pStatus').value     = p.status;
  populateTenantSelect(p.tenant);
  document.getElementById('modalPembayaran').removeAttribute('hidden');
}

/** Delete a payment */
function deletePayment(id) {
  if (!confirm('Hapus data pembayaran ini?')) return;
  saveStore(STORAGE_KEYS.payments, DB.payments.filter(p => p.id !== id));
  renderPembayaran(
    document.getElementById('searchPayment').value,
    document.getElementById('filterPaymentStatus').value
  );
  toast('Pembayaran berhasil dihapus.');
}

/** Clear payment form */
function clearPaymentForm() {
  ['pPenghuni','pBulan','pJumlah','pTglBayar','pStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('invalid'); }
  });
  ['errPPenghuni','errPBulan','errPJumlah','errPStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

/** Validate & save payment form */
function savePayment(e) {
  e.preventDefault();
  let valid = true;

  const fields = [
    { id: 'pPenghuni', err: 'errPPenghuni', msg: 'Pilih penghuni.',             check: v => v !== '' },
    { id: 'pBulan',    err: 'errPBulan',    msg: 'Bulan pembayaran wajib diisi.',check: v => v !== '' },
    { id: 'pJumlah',   err: 'errPJumlah',   msg: 'Jumlah minimal Rp 1.',         check: v => Number(v) >= 1 },
    { id: 'pStatus',   err: 'errPStatus',   msg: 'Pilih status.',                check: v => v !== '' },
  ];

  fields.forEach(({ id, err, msg, check }) => {
    const el  = document.getElementById(id);
    const val = el.value.trim();
    if (!check(val)) {
      el.classList.add('invalid');
      document.getElementById(err).textContent = msg;
      valid = false;
    } else {
      el.classList.remove('invalid');
      document.getElementById(err).textContent = '';
    }
  });

  if (!valid) return;

  const paymentId = document.getElementById('pPaymentId').value;
  const newPayment = {
    id:     paymentId || uid(),
    tenant: document.getElementById('pPenghuni').value,
    month:  document.getElementById('pBulan').value,
    amount: Number(document.getElementById('pJumlah').value),
    paidAt: document.getElementById('pTglBayar').value,
    status: document.getElementById('pStatus').value,
  };

  const payments = DB.payments;
  if (paymentId) {
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx >= 0) payments[idx] = newPayment;
  } else {
    payments.push(newPayment);
  }

  saveStore(STORAGE_KEYS.payments, payments);
  document.getElementById('modalPembayaran').setAttribute('hidden', '');
  renderPembayaran(
    document.getElementById('searchPayment').value,
    document.getElementById('filterPaymentStatus').value
  );
  toast(paymentId ? 'Pembayaran berhasil diperbarui.' : 'Pembayaran berhasil dicatat.', 'success');
}

/* =============================================================
   SECTION 9 – DOCUMENT TO DATABASE (PARSER)
   ============================================================= */

/**
 * Rule-based regex parser.
 * Tries multiple common field label patterns from rental contracts.
 * Returns an object: { name, phone, room, moveIn, rent }
 */
function parseDocument(text) {
  const t = text;

  /** Try a list of regex patterns; return first match or '' */
  function tryMatch(patterns) {
    for (const re of patterns) {
      const m = t.match(re);
      if (m && m[1]) return m[1].trim();
    }
    return '';
  }

  // ── Name ──
  const name = tryMatch([
    /(?:nama\s*penghuni|nama\s*penyewa|nama)\s*[:\-–|]\s*([A-Za-z\s.,']+?)(?:[,|;\n]|$)/i,
  ]);

  // ── Phone ──
  const phone = tryMatch([
    /(?:no\.?\s*hp|telepon|telp|phone|kontak)\s*[:\-–|]\s*([0-9+\-\s]{8,16})/i,
    /(?:^|\s)(08[0-9]{8,12})(?:\s|,|;|$)/m,
  ]);

  // ── Room ──
  const room = tryMatch([
    /(?:no\.?\s*kamar|kamar|room)\s*[:\-–|]\s*([A-Za-z0-9]+)/i,
  ]);

  // ── Move-in date ──
  const rawDate = tryMatch([
    /(?:tanggal\s*masuk|tgl\s*masuk|masuk|mulai)\s*[:\-–|]\s*([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4})/i,
    /(?:tanggal\s*masuk|tgl\s*masuk|masuk|mulai)\s*[:\-–|]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  ]);
  const moveIn = normalizeDate(rawDate);

  // ── Rent ──
  const rawRent = tryMatch([
    /(?:harga\s*sewa|biaya\s*sewa|sewa)\s*[:\-–|]\s*Rp\.?\s*([\d.,]+)/i,
    /(?:harga\s*sewa|biaya\s*sewa|sewa)\s*[:\-–|]\s*([\d.,]+)/i,
    /Rp\.?\s*([\d.,]+)/i,
  ]);
  const rent = normalizeRupiah(rawRent);

  return { name, phone, room, moveIn, rent };
}

/** Convert date strings like "01-11-2026" or "01/11/2026" → "2026-11-01" */
function normalizeDate(raw) {
  if (!raw) return '';
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD-MM-YYYY or DD/MM/YYYY
  const m = raw.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return '';
}

/** Parse "850.000" or "850,000" or "850000" → 850000 */
function normalizeRupiah(raw) {
  if (!raw) return '';
  // Remove thousands separators (dots or commas before 3-digit groups)
  const cleaned = raw.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(/,/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? '' : String(n);
}

/** Show extracted data in the preview table */
let extractedData = {};

function extractDoc() {
  const text = document.getElementById('docInput').value.trim();
  if (!text) {
    toast('Tempel teks dokumen terlebih dahulu.', 'error');
    return;
  }

  extractedData = parseDocument(text);

  const fieldLabels = {
    name:   'Nama Penghuni',
    phone:  'No. HP',
    room:   'No. Kamar',
    moveIn: 'Tanggal Masuk',
    rent:   'Harga Sewa (Rp/bulan)',
  };

  const tbody = document.getElementById('previewBody');
  tbody.innerHTML = Object.entries(fieldLabels).map(([key, label]) => {
    const val = extractedData[key] || '';
    const display = val ? escapeHTML(val) : '<em style="color:var(--text-muted)">tidak terdeteksi</em>';
    return `<tr>
      <td><strong>${label}</strong></td>
      <td>${display}</td>
      <td><input class="preview-input" type="text" data-field="${key}" value="${escapeHTML(val)}" placeholder="Edit…" aria-label="${label}" /></td>
    </tr>`;
  }).join('');

  document.getElementById('docPreview').removeAttribute('hidden');
  toast('Data berhasil diekstrak. Periksa dan edit sebelum menyimpan.', 'success');
}

/** Read edited preview values back to extractedData */
function syncPreviewEdits() {
  document.querySelectorAll('.preview-input').forEach(input => {
    extractedData[input.dataset.field] = input.value.trim();
  });
}

/** Save extracted (and edited) data to tenant + payment DB */
function saveDocToDatabase() {
  syncPreviewEdits();

  const { name, phone, room, moveIn, rent } = extractedData;

  // Validate required fields
  const missing = [];
  if (!name)   missing.push('Nama');
  if (!room)   missing.push('No. Kamar');
  if (!moveIn) missing.push('Tanggal Masuk');
  if (!rent)   missing.push('Harga Sewa');

  if (missing.length > 0) {
    toast(`Field wajib belum lengkap: ${missing.join(', ')}.`, 'error');
    return;
  }

  // Check if room exists
  const roomExists = DB.rooms.find(r => r.id.toLowerCase() === room.toLowerCase());
  if (!roomExists) {
    toast(`Kamar "${room}" tidak ditemukan. Pastikan no. kamar sesuai (A1, B2, dst).`, 'error');
    return;
  }

  // Check if room already occupied
  const alreadyOccupied = DB.tenants.find(t => t.room.toLowerCase() === room.toLowerCase());
  if (alreadyOccupied) {
    toast(`Kamar ${room} sudah ditempati oleh ${alreadyOccupied.name}.`, 'error');
    return;
  }

  // Save tenant
  const newTenant = {
    id:     uid(),
    name,
    phone:  phone || '—',
    room:   roomExists.id,
    moveIn: moveIn,
    rent:   Number(rent),
  };
  const tenants = DB.tenants;
  tenants.push(newTenant);
  saveStore(STORAGE_KEYS.tenants, tenants);

  // Save initial payment for move-in month
  const moveInMonth = moveIn.slice(0, 7); // YYYY-MM
  const newPayment = {
    id:     uid(),
    tenant: newTenant.id,
    month:  moveInMonth,
    amount: Number(rent),
    paidAt: '',
    status: 'Belum Bayar',
  };
  const payments = DB.payments;
  payments.push(newPayment);
  saveStore(STORAGE_KEYS.payments, payments);

  // Reset UI
  document.getElementById('docInput').value = '';
  document.getElementById('docPreview').setAttribute('hidden', '');
  extractedData = {};

  toast(`✅ ${name} berhasil ditambahkan ke database! Kamar: ${roomExists.id}.`, 'success');
}

/* =============================================================
   SECTION 10 – HELPERS
   ============================================================= */

/** Escape HTML to prevent XSS in injected strings */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Set today's date in the topbar */
function setCurrentDate() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', opts);
}

/* =============================================================
   SECTION 11 – EVENT LISTENERS (wired on DOMContentLoaded)
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

  setCurrentDate();

  // ── Sidebar navigation ──
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // ── Mobile menu toggle ──
  document.getElementById('menuToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // ── Penghuni page ──
  document.getElementById('btnAddTenant').addEventListener('click', openAddTenant);
  document.getElementById('closePenghuniModal').addEventListener('click', () =>
    document.getElementById('modalPenghuni').setAttribute('hidden', '')
  );
  document.getElementById('cancelPenghuni').addEventListener('click', () =>
    document.getElementById('modalPenghuni').setAttribute('hidden', '')
  );
  document.getElementById('formPenghuni').addEventListener('submit', saveTenant);

  document.getElementById('searchTenant').addEventListener('input', e => {
    renderPenghuni(e.target.value);
  });

  // ── Pembayaran page ──
  document.getElementById('btnAddPayment').addEventListener('click', openAddPayment);
  document.getElementById('closePembayaranModal').addEventListener('click', () =>
    document.getElementById('modalPembayaran').setAttribute('hidden', '')
  );
  document.getElementById('cancelPembayaran').addEventListener('click', () =>
    document.getElementById('modalPembayaran').setAttribute('hidden', '')
  );
  document.getElementById('formPembayaran').addEventListener('submit', savePayment);

  document.getElementById('searchPayment').addEventListener('input', () => {
    renderPembayaran(
      document.getElementById('searchPayment').value,
      document.getElementById('filterPaymentStatus').value
    );
  });
  document.getElementById('filterPaymentStatus').addEventListener('change', () => {
    renderPembayaran(
      document.getElementById('searchPayment').value,
      document.getElementById('filterPaymentStatus').value
    );
  });

  // ── Document to Database ──
  document.getElementById('btnExtract').addEventListener('click', extractDoc);
  document.getElementById('btnClearDoc').addEventListener('click', () => {
    document.getElementById('docInput').value = '';
    document.getElementById('docPreview').setAttribute('hidden', '');
    extractedData = {};
  });
  document.getElementById('btnSaveDoc').addEventListener('click', saveDocToDatabase);
  document.getElementById('btnCancelDoc').addEventListener('click', () => {
    document.getElementById('docPreview').setAttribute('hidden', '');
    extractedData = {};
  });

  // ── Close modals on backdrop click ──
  ['modalPenghuni', 'modalPembayaran'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        e.currentTarget.setAttribute('hidden', '');
      }
    });
  });

  // ── Close modals on Escape key ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => {
        m.setAttribute('hidden', '');
      });
    }
  });

  // ── Initial render ──
  navigateTo('dashboard');
});
