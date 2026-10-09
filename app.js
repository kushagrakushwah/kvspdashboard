/**
 * KVS Master Dashboard Controller
 * Handles cascading filters, Chart.js visualizations, teacher dossier, and modal interactions
 */

let activeRegion = 'All';
let activeKV = 'All';
let activeRole = 'principal';
let currentProgram = 'cpd';

// Chart instances
let catPieChart = null;
let cpdFunnelChart = null;
let dcaisChart = null;
let regionalChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  updateKPIs();
  renderCPDTable();
  renderTeacherRoster();
  renderDCAISTables();
  renderInsightsLeaderboard();
  initCharts();
});

// ==================== 1. FILTER INITIALIZATION ====================
function initFilters() {
  const regSelect = document.getElementById('regionSelect');
  regSelect.innerHTML = '<option value=\"All\">All Regions (National: 48,267 Teachers)</option>';

  KVS_DATA.REGIONS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.name;
    opt.textContent = `${r.name} (${r.totalTeachers.toLocaleString()} Teachers)`;
    regSelect.appendChild(opt);
  });

  populateKVs();
}

function onRegionChange() {
  activeRegion = document.getElementById('regionSelect').value;
  activeKV = 'All';
  populateKVs();
  updateKPIs();
  renderTeacherRoster();
  updateCharts();
}

function populateKVs() {
  const kvSelect = document.getElementById('kvSelect');
  kvSelect.innerHTML = '<option value=\"All\">All Schools in Selection</option>';

  let kvsList = [];
  if (activeRegion === 'All') {
    KVS_DATA.REGIONS.forEach(r => {
      kvsList.push(...r.kvs);
    });
  } else {
    const regObj = KVS_DATA.REGIONS.find(r => r.name === activeRegion);
    if (regObj) kvsList = regObj.kvs;
  }

  // Deduplicate and sort by code
  const unique = [];
  const seen = new Set();
  kvsList.forEach(k => {
    if (!seen.has(k.code)) {
      seen.add(k.code);
      unique.push(k);
    }
  });

  unique.sort((a,b) => a.code - b.code);

  unique.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.code;
    opt.textContent = `KV ${k.code} — ${k.name} (${k.teachers} Teachers)`;
    kvSelect.appendChild(opt);
  });
}

function onKVChange() {
  activeKV = document.getElementById('kvSelect').value;
  updateKPIs();
  renderTeacherRoster();
}

// ==================== 2. KPI UPDATES ====================
function updateKPIs() {
  let teachers = 0;
  let attended = 0;
  let certified = 0;
  let dcais = 'M2 (Active)';

  if (activeRegion === 'All' && activeKV === 'All') {
    teachers = KVS_DATA.NATIONAL_METRICS.totalTeachers;
    attended = KVS_DATA.NATIONAL_METRICS.cpdAttended;
    certified = KVS_DATA.NATIONAL_METRICS.cpdCertified;
    dcais = '822 Enrolled';
  } else if (activeKV !== 'All') {
    let targetKV = null;
    KVS_DATA.REGIONS.forEach(r => {
      const found = r.kvs.find(k => k.code == activeKV);
      if (found) targetKV = found;
    });
    if (targetKV) {
      teachers = targetKV.teachers;
      attended = targetKV.trained;
      certified = targetKV.certified;
      dcais = targetKV.dcaisStatus;
    }
  } else {
    const regObj = KVS_DATA.REGIONS.find(r => r.name === activeRegion);
    if (regObj) {
      teachers = regObj.totalTeachers;
      attended = regObj.cpdAttended;
      certified = regObj.cpdCertified;
      dcais = `${regObj.totalKVs} KVs Enrolled`;
    }
  }

  document.getElementById('kpiTotalTeachers').textContent = Number(teachers).toLocaleString();
  document.getElementById('kpiCpdAttended').textContent = Number(attended).toLocaleString();
  document.getElementById('kpiCpdCertified').textContent = Number(certified).toLocaleString();
  document.getElementById('kpiDcaisStatus').textContent = dcais;

  // Header live subtitle update
  const scopeText = activeKV !== 'All' 
    ? `KV ${activeKV} Selected` 
    : (activeRegion !== 'All' ? `${activeRegion} Region Selected` : 'National KVS View (All 28 Regions)');
  document.getElementById('activeScopeSubtitle').textContent = scopeText;
}

// ==================== 3. TAB CONTROLLER ====================
function switchProgram(progId) {
  currentProgram = progId;
  document.querySelectorAll('.prog-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === progId);
  });

  document.querySelectorAll('.workspace-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${progId}`);
  });

  // Re-render chart size if switching to tab
  if (progId === 'cpd') {
    setTimeout(() => {
      if (catPieChart) catPieChart.resize();
      if (cpdFunnelChart) cpdFunnelChart.resize();
    }, 100);
  } else if (progId === 'dcais') {
    setTimeout(() => {
      if (dcaisChart) dcaisChart.resize();
    }, 100);
  } else if (progId === 'insights') {
    setTimeout(() => {
      if (regionalChart) regionalChart.resize();
    }, 100);
  }
}

function setRole(role, btn) {
  activeRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Switched view to: ${btn.textContent.trim()}`);
}

// ==================== 4. CPD DATA RENDERING ====================
function renderCPDTable() {
  const tbody = document.getElementById('cpdOverviewTableBody');
  tbody.innerHTML = '';

  KVS_DATA.CPD_MODULES.forEach((m, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.id}</strong></td>
      <td><strong>${m.name}</strong></td>
      <td>${m.attended.toLocaleString()}</td>
      <td><span class=\"status-pill yes\">✓ 100% Yes</span></td>
      <td>${m.certified.toLocaleString()}</td>
      <td><strong>${m.certified.toLocaleString()}</strong></td>
      <td>
        <div style=\"display:flex;align-items:center;gap:8px;\">
          <div style=\"flex:1;height:8px;background:#E2E8F0;border-radius:9999px;overflow:hidden;\">
            <div style=\"height:100%;width:${m.rate};background:var(--adobe-red);border-radius:9999px;\"></div>
          </div>
          <span style=\"font-size:0.75rem;font-weight:800;color:var(--adobe-red);\">${m.rate}</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTeacherRoster() {
  const tbody = document.getElementById('teacherRosterTableBody');
  tbody.innerHTML = '';

  const searchInput = document.getElementById('teacherSearchInput') ? document.getElementById('teacherSearchInput').value.toLowerCase() : '';
  const moduleFilter = document.getElementById('moduleFilterSelect') ? document.getElementById('moduleFilterSelect').value : 'All';

  let list = KVS_DATA.TEACHERS_ROSTER;

  if (activeRegion !== 'All') {
    list = list.filter(t => t.region === activeRegion);
  }
  if (activeKV !== 'All') {
    list = list.filter(t => t.kvCode == activeKV);
  }
  if (moduleFilter !== 'All') {
    list = list.filter(t => t.module === moduleFilter);
  }
  if (searchInput) {
    list = list.filter(t => 
      t.name.toLowerCase().includes(searchInput) ||
      t.subject.toLowerCase().includes(searchInput) ||
      t.category.toLowerCase().includes(searchInput) ||
      t.schoolName.toLowerCase().includes(searchInput)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan=\"9\" style=\"text-align:center;padding:24px;color:var(--ink-muted);\">No teachers matched the current filter.</td></tr>';
    return;
  }

  list.slice(0, 15).forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.name}</strong></td>
      <td><span class=\"status-pill\" style=\"background:#EDF2F7;color:#2D3748;\">${t.category}</span></td>
      <td>${t.subject}</td>
      <td><span style=\"font-weight:700;\">KV ${t.kvCode}</span> <span style=\"font-size:0.75rem;color:#718096;\">(${t.schoolName})</span></td>
      <td><strong>${t.module}</strong></td>
      <td><span class=\"status-pill yes\">✓ Attended</span></td>
      <td><span class=\"status-pill ${t.submitted === 'Yes' ? 'yes' : 'no'}\">${t.submitted === 'Yes' ? '✓ Submitted' : '✗ Pending'}</span></td>
      <td><span class=\"status-pill ${t.certificate === 'Dispatched' ? 'yes' : 'pending'}\">${t.certificate === 'Dispatched' ? '✓ Dispatched' : 'Pending'}</span></td>
      <td>
        ${t.certificate === 'Dispatched' 
          ? `<button class=\"btn-header\" style=\"padding:4px 10px;font-size:0.75rem;\" onclick=\"openCertModal('${t.name}', '${t.module}', '${t.schoolName}')\">📜 Certificate</button>`
          : `<button class=\"btn-header\" style=\"padding:4px 10px;font-size:0.75rem;border-color:var(--adobe-red);color:var(--adobe-red);\" onclick=\"openReminderModal('${t.name}', '${t.module}', '${t.email}')\">🔔 Remind</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 5. DCAIS DATA RENDERING ====================
function renderDCAISTables() {
  const tbody = document.getElementById('dcaisStatusTableBody');
  tbody.innerHTML = '';

  KVS_DATA.DCAIS_STAGES.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.id}</strong></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.present.toLocaleString()} Schools</td>
      <td>${s.total.toLocaleString()} Schools</td>
      <td><span class=\"status-pill ${s.pct > 30 ? 'yes' : (s.pct > 15 ? 'pending' : 'no')}\">${s.pct}% Active</span></td>
      <td>
        <button class=\"btn-header\" style=\"padding:4px 10px;font-size:0.75rem;\" onclick=\"showToast('Exported school adoption list for ${s.id}')\">Download List ↗</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 6. INSIGHTS LEADERBOARD ====================
function renderInsightsLeaderboard() {
  const tbody = document.getElementById('insightsLeaderboardBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const sortedRegions = [...KVS_DATA.REGIONS].sort((a,b) => b.cpdCertified - a.cpdCertified).slice(0, 10);

  sortedRegions.forEach((r, idx) => {
    const convRate = ((r.cpdCertified / r.totalTeachers) * 100).toFixed(1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${idx + 1}</strong></td>
      <td><strong>${r.name}</strong></td>
      <td>${r.totalTeachers.toLocaleString()}</td>
      <td>${r.totalKVs} KVs</td>
      <td>${r.cpdAttended.toLocaleString()}</td>
      <td><strong>${r.cpdCertified.toLocaleString()}</strong></td>
      <td><span class=\"status-pill ${convRate > 40 ? 'yes' : 'pending'}\">${convRate}%</span></td>
      <td>
        <button class=\"btn-header\" style=\"padding:3px 8px;font-size:0.72rem;\" onclick=\"openRegionQuickView('${r.name}')\">View Roster ↗</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 7. CHARTS INITIALIZATION (CHART.JS) ====================
function initCharts() {
  // Chart 1: Teacher Category Pie Chart
  const ctxCat = document.getElementById('teacherCategoryChart');
  if (ctxCat) {
    catPieChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Primary (PRT)', 'Trained Graduate (TGT)', 'Post Graduate (PGT)', 'Head Masters (HM)'],
        datasets: [{
          data: [
            KVS_DATA.TEACHER_CATEGORIES.PRT,
            KVS_DATA.TEACHER_CATEGORIES.TGT,
            KVS_DATA.TEACHER_CATEGORIES.PGT,
            KVS_DATA.TEACHER_CATEGORIES.HM
          ],
          backgroundColor: ['#FA0F00', '#2563EB', '#16A34A', '#D97706'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  }

  // Chart 2: CPD Funnel Bar Chart
  const ctxFunnel = document.getElementById('cpdFunnelChart');
  if (ctxFunnel) {
    cpdFunnelChart = new Chart(ctxFunnel, {
      type: 'bar',
      data: {
        labels: ['CPD 1', 'CPD 2', 'CPD 3', 'CPD 4', 'CPD 5', 'CPD 6'],
        datasets: [{
          label: 'Certificates Dispatched',
          data: KVS_DATA.CPD_MODULES.map(m => m.certified),
          backgroundColor: '#FA0F00',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#EDF2F7' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Chart 3: DCAIS Adoption Funnel
  const ctxDcais = document.getElementById('dcaisAdoptionChart');
  if (ctxDcais) {
    dcaisChart = new Chart(ctxDcais, {
      type: 'bar',
      data: {
        labels: ['M1: Orientation', 'M2: Curriculum', 'M3: Projects', 'M4: Gallery Showcase'],
        datasets: [{
          label: 'Active Schools',
          data: KVS_DATA.DCAIS_STAGES.map(s => s.present),
          backgroundColor: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#EDF2F7' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Chart 4: Regional Leaderboard
  const ctxRegional = document.getElementById('regionalLeaderboardChart');
  if (ctxRegional) {
    const top7 = [...KVS_DATA.REGIONS].sort((a,b) => b.cpdCertified - a.cpdCertified).slice(0, 7);
    regionalChart = new Chart(ctxRegional, {
      type: 'bar',
      data: {
        labels: top7.map(r => r.name),
        datasets: [{
          label: 'CPD Certified',
          data: top7.map(r => r.cpdCertified),
          backgroundColor: '#0E2A47',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#EDF2F7' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

function updateCharts() {
  // Can filter charts dynamically based on region if required
}

// ==================== 8. MODAL & INTERACTIONS ====================
function openCertModal(name, mod, school) {
  document.getElementById('certModalTeacherName').textContent = name;
  document.getElementById('certModalModuleName').textContent = mod;
  document.getElementById('certModalSchoolName').textContent = school;
  document.getElementById('certModal').style.display = 'flex';
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function openReminderModal(name, mod, email) {
  document.getElementById('reminderTeacherName').textContent = name;
  document.getElementById('reminderModuleName').textContent = mod;
  document.getElementById('reminderEmail').textContent = email;
  
  const msg = `Dear ${name}, please complete your assignment submission for ${mod} in Adobe Express for Education to receive your official accredited digital certificate.`;
  document.getElementById('reminderMessageText').value = msg;

  document.getElementById('reminderModal').style.display = 'flex';
}

function closeReminderModal() {
  document.getElementById('reminderModal').style.display = 'none';
}

function copyReminderMessage() {
  const txt = document.getElementById('reminderMessageText');
  txt.select();
  navigator.clipboard.writeText(txt.value);
  showToast('Reminder copied to clipboard! Ready to paste into WhatsApp.');
  closeReminderModal();
}

function openRegionQuickView(regionName) {
  document.getElementById('regionSelect').value = regionName;
  onRegionChange();
  switchProgram('cpd');
  showToast(`Filtered dashboard to ${regionName} region.`);
}

function exportDashboardExcel() {
  showToast('Generating official KVS Master Dashboard Excel export...');
  setTimeout(() => {
    // Generates a client-side CSV download
    const rows = [
      ['Region', 'KV Code', 'School Name', 'Teacher Name', 'Category', 'Subject', 'Module', 'Submitted', 'Certificate']
    ];
    KVS_DATA.TEACHERS_ROSTER.slice(0, 100).forEach(t => {
      rows.push([t.region, t.kvCode, t.schoolName, t.name, t.category, t.subject, t.module, t.submitted, t.certificate]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `\"${i}\"`).join(',')).join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KVS_Master_Dashboard_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, 600);
}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3400);
}
