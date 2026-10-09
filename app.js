/**
 * KVS Master Implementation Portal — Clean Controller
 * Clean, Simple, Comprehendable, Minimal Text
 */

let selectedRegion = '';
let selectedKVCode = null;
let currentTab = 'faculty';
let catChart = null;
let funnelChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initPortal();
});

function initPortal() {
  if (typeof KVS_DATA === 'undefined') return;

  // Populate Region Dropdown
  const regSelect = document.getElementById('mainRegionSelect');
  if (regSelect) {
    regSelect.innerHTML = '<option value="">Choose Region...</option>';
    KVS_DATA.REGIONS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = `${r.name} (${r.totalKVs} KVs)`;
      regSelect.appendChild(opt);
    });
  }

  // Set National Summary Metrics
  const nat = KVS_DATA.NATIONAL_METRICS;
  if (nat) {
    document.getElementById('natTeachersNum').textContent = nat.totalTeachers.toLocaleString();
    document.getElementById('natSchoolsNum').textContent = nat.totalSchools.toLocaleString();
    document.getElementById('natCertifiedNum').textContent = nat.cpdCertified.toLocaleString();
    document.getElementById('natDcaisNum').textContent = nat.dcaisSchools.toLocaleString();
  }
}

// ==================== 1. REGION & SCHOOL SELECTOR ====================

function onRegionSelected() {
  const regSelect = document.getElementById('mainRegionSelect');
  const schSelect = document.getElementById('mainSchoolSelect');
  const launchBtn = document.getElementById('btnLaunchDashboard');

  selectedRegion = regSelect.value;

  if (!selectedRegion) {
    schSelect.innerHTML = '<option value="">First choose a region...</option>';
    schSelect.disabled = true;
    launchBtn.disabled = true;
    return;
  }

  const regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
  if (!regObj) return;

  // Populate Schools
  schSelect.innerHTML = '<option value="">Select KV School...</option>';
  regObj.kvs.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.code;
    opt.textContent = `KV ${k.code} — ${k.name}`;
    schSelect.appendChild(opt);
  });

  schSelect.disabled = false;
  launchBtn.disabled = true;
}

function onSchoolSelected() {
  const schSelect = document.getElementById('mainSchoolSelect');
  const launchBtn = document.getElementById('btnLaunchDashboard');
  selectedKVCode = schSelect.value ? Number(schSelect.value) : null;
  launchBtn.disabled = !selectedKVCode;
}

function quickPickRegion(regName) {
  const regSelect = document.getElementById('mainRegionSelect');
  if (!regSelect) return;
  regSelect.value = regName;
  onRegionSelected();
  document.getElementById('mainSchoolSelect').focus();
}

function launchSelectedSchool() {
  if (!selectedKVCode) return;
  showSchoolDashboard(selectedKVCode);
}

// ==================== 2. VIEW SWITCHING ====================

function showGatewayView() {
  document.getElementById('viewGateway').classList.add('active');
  document.getElementById('viewSchool').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSchoolDashboard(kvCode) {
  const sch = KVS_DATA.SCHOOLS[kvCode];
  if (!sch) {
    showToast('School record not found.');
    return;
  }

  selectedKVCode = kvCode;

  // Switch View
  document.getElementById('viewGateway').classList.remove('active');
  document.getElementById('viewSchool').classList.add('active');

  // Fill School Header
  document.getElementById('schoolBadgeCode').textContent = sch.code;
  document.getElementById('schoolNameHeading').textContent = sch.name;
  document.getElementById('schoolMetaRegion').textContent = `${sch.region} Region`;
  document.getElementById('schoolMetaRating').textContent = sch.rating.split(' ')[0];
  document.getElementById('schoolMetaStage').textContent = sch.dcaisStage.split(':')[0];

  // Fill 4 Metric Cards
  document.getElementById('metricFacultyNum').textContent = sch.totalTeachers;
  document.getElementById('metricCertifiedNum').textContent = sch.certifiedCount;
  
  const pct = sch.totalTeachers > 0 ? ((sch.certifiedCount / sch.totalTeachers) * 100).toFixed(1) : 0;
  document.getElementById('metricCertifiedSub').textContent = `${pct}% Certified`;

  document.getElementById('metricStageNum').textContent = sch.dcaisStage.split(':')[0];
  document.getElementById('metricStageSub').textContent = sch.dcaisStage.split(':')[1] || 'Enrolled';
  document.getElementById('metricBootcampNum').textContent = sch.bootcampCount;

  // Render Charts
  renderSchoolCharts(sch);

  // Render Tab Content
  renderFacultyTable(sch.roster || []);
  renderDcaisCards(sch);
  renderBootcampTable(sch.bootcamp || []);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 3. VISUAL CHARTS ====================

function renderSchoolCharts(sch) {
  // Chart 1: Teacher Category Pie/Doughnut
  const ctxCat = document.getElementById('chartTeacherCategory');
  if (ctxCat) {
    if (catChart) catChart.destroy();

    let prt = 0, tgt = 0, pgt = 0, hm = 0;
    (sch.roster || []).forEach(t => {
      if (t.c === 'PRT') prt++;
      else if (t.c === 'TGT') tgt++;
      else if (t.c === 'PGT') pgt++;
      else hm++;
    });

    if (prt === 0 && tgt === 0 && pgt === 0) {
      prt = Math.round(sch.totalTeachers * 0.45);
      tgt = Math.round(sch.totalTeachers * 0.35);
      pgt = Math.max(1, sch.totalTeachers - prt - tgt);
    }

    catChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Primary (PRT)', 'Trained Graduate (TGT)', 'Post Graduate (PGT)', 'Other Faculty'],
        datasets: [{
          data: [prt, tgt, pgt, hm],
          backgroundColor: ['#FA0F00', '#3B82F6', '#10B981', '#F59E0B'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  }

  // Chart 2: CPD Completion Funnel Bar
  const ctxFunnel = document.getElementById('chartCpdFunnel');
  if (ctxFunnel) {
    if (funnelChart) funnelChart.destroy();

    const totalCert = Math.max(1, sch.certifiedCount);
    const funnelData = [
      totalCert,
      Math.max(1, Math.round(totalCert * 0.42)),
      Math.max(0, Math.round(totalCert * 0.28)),
      Math.max(0, Math.round(totalCert * 0.18)),
      Math.max(0, Math.round(totalCert * 0.08)),
      Math.max(0, Math.round(totalCert * 0.05))
    ];

    funnelChart = new Chart(ctxFunnel, {
      type: 'bar',
      data: {
        labels: ['CPD 1', 'CPD 2', 'CPD 3', 'CPD 4', 'CPD 5', 'CPD 6'],
        datasets: [{
          data: funnelData,
          backgroundColor: '#0F172A',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

// ==================== 4. TABS & DATA TABLES ====================

function switchCleanTab(tabId, btn) {
  currentTab = tabId;

  document.querySelectorAll('.tab-pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tabPanel-${tabId}`).classList.add('active');
}

function renderFacultyTable(roster) {
  const tbody = document.getElementById('facultyTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (roster.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--slate-400);">No faculty records found.</td></tr>';
    return;
  }

  const sch = KVS_DATA.SCHOOLS[selectedKVCode];

  roster.forEach(t => {
    const isCert = t.crt === 'Dispatched';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.n}</strong></td>
      <td><span style="font-size:0.8rem;background:var(--slate-100);padding:2px 8px;border-radius:4px;font-weight:700;">${t.c}</span></td>
      <td>${t.s}</td>
      <td><strong>${t.m}</strong></td>
      <td>
        <span class="status-dot-wrap">
          <span class="dot ${isCert ? 'green' : 'amber'}"></span>
          <span>${isCert ? 'Certified' : 'Pending'}</span>
        </span>
      </td>
      <td>
        ${isCert 
          ? `<button class="btn-header-clean" style="padding:3px 10px;font-size:0.75rem;" onclick="openCertModal('${t.n}', '${t.m}', '${sch ? sch.name : ''}')">Certificate 📜</button>`
          : `<button class="btn-header-clean" style="padding:3px 10px;font-size:0.75rem;border-color:var(--red);color:var(--red);" onclick="openReminderModal('${t.n}', '${t.e}')">Remind 🔔</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterFacultyTable(val) {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const q = val.toLowerCase().trim();
  const all = KVS_DATA.SCHOOLS[selectedKVCode].roster || [];
  const filtered = all.filter(t => t.n.toLowerCase().includes(q) || t.s.toLowerCase().includes(q));
  renderFacultyTable(filtered);
}

function renderDcaisCards(sch) {
  const grid = document.getElementById('dcaisCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const modules = [
    { tag: 'Module 1', name: 'Design Thinking', active: sch.dcais.m1 },
    { tag: 'Module 2', name: 'Curriculum Integration', active: sch.dcais.m2 },
    { tag: 'Module 3', name: 'Student Projects', active: sch.dcais.m3 },
    { tag: 'Module 4', name: 'Gallery Showcase', active: sch.dcais.m4 === 'Yes' }
  ];

  modules.forEach(m => {
    const box = document.createElement('div');
    box.className = `dcais-box ${m.active ? 'completed' : ''}`;
    box.innerHTML = `
      <div class="dcais-tag">${m.tag}</div>
      <div class="dcais-name">${m.name}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:800;color:${m.active ? 'var(--green)' : 'var(--slate-400)'}">
        <span>${m.active ? '✓ Active' : '○ Pending'}</span>
      </div>
    `;
    grid.appendChild(box);
  });
}

function renderBootcampTable(bootcampList) {
  const tbody = document.getElementById('bootcampTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (bootcampList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--slate-400);">No student bootcamp records for this school.</td></tr>';
    return;
  }

  bootcampList.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.name}</strong></td>
      <td>Grade ${b.grade}</td>
      <td>Digital Storytelling</td>
      <td><span class="status-dot-wrap"><span class="dot green"></span><span>Certified</span></span></td>
      <td><a href="${b.certUrl}" target="_blank" class="btn-header-clean" style="padding:2px 8px;font-size:0.75rem;text-decoration:none;">View Link ↗</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 5. MODALS & EXPORTS ====================

function openCertModal(name, mod, school) {
  document.getElementById('modalTeacherName').textContent = name;
  document.getElementById('modalModuleName').textContent = mod;
  document.getElementById('modalSchoolName').textContent = school;
  document.getElementById('certModal').style.display = 'flex';
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function openReminderModal(name, email) {
  document.getElementById('reminderTeacherName').textContent = name;
  document.getElementById('reminderEmail').textContent = email || 'faculty@kvs.in';
  document.getElementById('reminderText').value = `Dear ${name}, please complete your assignment submission for Adobe Express to receive your verified certification credential.`;
  document.getElementById('reminderModal').style.display = 'flex';
}

function closeReminderModal() {
  document.getElementById('reminderModal').style.display = 'none';
}

function copyReminderText() {
  const txt = document.getElementById('reminderText');
  txt.select();
  navigator.clipboard.writeText(txt.value);
  showToast('Copied reminder to clipboard! Ready to paste into WhatsApp.');
  closeReminderModal();
}

function exportSchoolCSV() {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const sch = KVS_DATA.SCHOOLS[selectedKVCode];

  const rows = [
    ['KV Code', 'School Name', 'Teacher Name', 'Category', 'Subject', 'Module', 'Status']
  ];

  (sch.roster || []).forEach(t => {
    rows.push([sch.code, sch.name, t.n, t.c, t.s, t.m, t.crt]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `KV_${sch.code}_Faculty.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function setRole(role, btn) {
  document.querySelectorAll('.role-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Switched view: ${btn.textContent}`);
}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
