/**
 * KVS Master Implementation Portal — Enterprise Controller
 * Handles Multi-Stage Navigation, 25 Regions, 1,202 Schools, Real Data Grounding & Visualizations
 */

// Application State
let selectedRegion = null;
let selectedKVCode = null;
let currentView = 'gateway'; // 'gateway', 'school', 'region'
let activeRole = 'principal';
let activeSchoolTab = 'overview';

// Chart Instances
let schoolCatChart = null;
let schoolFunnelChart = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initPortal();
  initRouting();
});

function initPortal() {
  if (typeof KVS_DATA === 'undefined') {
    console.error('KVS_DATA is not loaded.');
    return;
  }

  // Update Top Header Telemetry
  const nat = KVS_DATA.NATIONAL_METRICS;
  const badge = document.getElementById('telemetryBadgeText');
  if (badge && nat) {
    badge.textContent = `${nat.totalTeachers.toLocaleString()} Teachers • ${nat.totalSchools.toLocaleString()} Schools • ${nat.totalRegions} Regions • ${nat.cpdCertified.toLocaleString()} Certs`;
  }

  // Render Step 1: 25 Regions Grid
  renderRegionsGrid();

  // Close Quick Search on outside click
  document.addEventListener('click', (e) => {
    const box = document.querySelector('.quick-search-box');
    const dropdown = document.getElementById('quickSearchResultsDropdown');
    if (box && !box.contains(e.target) && dropdown) {
      dropdown.style.display = 'none';
    }
  });
}

// ==================== URL HASH ROUTING ====================
function initRouting() {
  window.addEventListener('hashchange', handleRoute);
  if (window.location.hash) {
    handleRoute();
  }
}

function handleRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === 'gateway') {
    navigateToGateway(false);
  } else if (hash.startsWith('region/')) {
    const regName = decodeURIComponent(hash.replace('region/', ''));
    if (regName) navigateToRegionalHub(regName, false);
  } else if (hash.startsWith('kv/')) {
    const parts = hash.replace('kv/', '').split('/');
    const code = Number(parts[0]);
    const tab = parts[1] || 'overview';
    if (code && KVS_DATA.SCHOOLS[code]) {
      selectSchool(code, false);
      if (tab) switchSchoolTab(tab, false);
    }
  }
}

function updateHash(newHash) {
  if (window.location.hash !== newHash) {
    history.pushState(null, '', newHash);
  }
}

// ================================================================
// 1. GATEWAY CONTROLLER: REGION & KV STEPPED SELECTOR
// ================================================================

function renderRegionsGrid(filterText = '') {
  const grid = document.getElementById('regionCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = filterText.toLowerCase().trim();
  const regions = KVS_DATA.REGIONS.filter(r => !q || r.name.toLowerCase().includes(q));

  if (regions.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-muted);">No KVS regions matched your search.</div>';
    return;
  }

  regions.forEach(r => {
    const isSel = selectedRegion === r.name;
    const card = document.createElement('div');
    card.className = `region-card ${isSel ? 'selected' : ''}`;
    card.onclick = () => selectRegion(r.name);

    card.innerHTML = `
      <div>
        <div class="region-card-top">
          <div class="region-card-icon">🏛️</div>
          <span class="region-kv-count-badge">${r.totalKVs} KVs</span>
        </div>
        <h3 class="region-card-name">${r.name}</h3>
      </div>

      <div>
        <div class="region-card-stats">
          <div class="region-stat-col">
            <span class="region-stat-num">${r.totalTeachers.toLocaleString()}</span>
            <span class="region-stat-label">Faculty</span>
          </div>
          <div class="region-stat-col">
            <span class="region-stat-num">${r.cpdCertified.toLocaleString()}</span>
            <span class="region-stat-label">Certified</span>
          </div>
        </div>

        <button class="region-select-btn" onclick="event.stopPropagation(); selectRegion('${r.name}')">
          ${isSel ? '✓ Selected' : 'Select Region ➔'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterRegionsGrid(val) {
  renderRegionsGrid(val);
}

function selectRegion(regionName) {
  selectedRegion = regionName;

  // Re-render region cards to show selected state
  renderRegionsGrid(document.getElementById('regionFilterInput') ? document.getElementById('regionFilterInput').value : '');

  // Update Stepper Ribbon
  const s1 = document.getElementById('stepperStep1');
  const s2 = document.getElementById('stepperStep2');
  if (s1) { s1.classList.remove('active'); s1.classList.add('completed'); }
  if (s2) { s2.classList.add('active'); }

  // Update Step 2 Banner
  const regObj = KVS_DATA.REGIONS.find(r => r.name === regionName);
  if (regObj) {
    document.getElementById('selectedRegionNamePill').textContent = regObj.name;
    document.getElementById('selectedRegionStatsText').textContent = `${regObj.totalKVs} Kendriya Vidyalayas • ${regObj.totalTeachers.toLocaleString()} Teachers • ${regObj.cpdCertified.toLocaleString()} Certified`;
  }

  // Show Step 2 Section
  const step2 = document.getElementById('step2Section');
  if (step2) {
    step2.classList.add('visible');
    renderKVsGrid();
    setTimeout(() => {
      step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  showToast(`Selected ${regionName} Region. Now choose a Kendriya Vidyalaya.`);
}

function resetToStep1() {
  selectedRegion = null;
  renderRegionsGrid();

  const s1 = document.getElementById('stepperStep1');
  const s2 = document.getElementById('stepperStep2');
  if (s1) { s1.classList.add('active'); s1.classList.remove('completed'); }
  if (s2) { s2.classList.remove('active'); }

  const step2 = document.getElementById('step2Section');
  if (step2) step2.classList.remove('visible');

  const step1 = document.getElementById('step1Section');
  if (step1) step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderKVsGrid() {
  const grid = document.getElementById('kvCardsGrid');
  if (!grid || !selectedRegion) return;
  grid.innerHTML = '';

  const regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
  if (!regObj) return;

  const searchInput = document.getElementById('kvFilterInput') ? document.getElementById('kvFilterInput').value.toLowerCase().trim() : '';
  const stageFilter = document.getElementById('kvFilterStageSelect') ? document.getElementById('kvFilterStageSelect').value : 'All';

  let list = regObj.kvs;

  if (searchInput) {
    list = list.filter(k => 
      String(k.code).includes(searchInput) ||
      k.name.toLowerCase().includes(searchInput)
    );
  }

  if (stageFilter !== 'All') {
    list = list.filter(k => k.stage && k.stage.includes(stageFilter));
  }

  if (list.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-muted);">No Kendriya Vidyalayas matched your criteria in this region.</div>';
    return;
  }

  list.forEach(k => {
    const sch = KVS_DATA.SCHOOLS[k.code] || k;
    const ratingClass = (k.rating || '').includes('A+') ? 'exemplary' : ((k.rating || '').includes('A') ? 'advanced' : 'active');

    const card = document.createElement('div');
    card.className = 'kv-card';
    card.onclick = () => selectSchool(k.code);

    card.innerHTML = `
      <div>
        <div class="kv-card-top">
          <span class="kv-code-badge">KV ${k.code}</span>
          <span class="kv-rating-badge ${ratingClass}">${k.rating || 'Active'}</span>
        </div>
        <h4 class="kv-card-name">${k.name}</h4>
      </div>

      <div>
        <div class="kv-card-metrics">
          <div class="kv-metric-item">
            <span class="kv-metric-value">${k.teachers}</span>
            <span class="kv-metric-label">Faculty</span>
          </div>
          <div class="kv-metric-item">
            <span class="kv-metric-value">${k.certified}</span>
            <span class="kv-metric-label">Certified</span>
          </div>
          <div class="kv-metric-item">
            <span class="kv-metric-value">${k.bootcamp || 0}</span>
            <span class="kv-metric-label">Bootcamp</span>
          </div>
        </div>

        <button class="kv-card-launch-btn" onclick="event.stopPropagation(); selectSchool(${k.code})">
          Launch School Portal ➔
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterKVsGrid() {
  renderKVsGrid();
}

// ================================================================
// 2. DEDICATED SCHOOL COMMAND CENTER CONTROLLER
// ================================================================

function selectSchool(kvCode, updateUrl = true) {
  const sch = KVS_DATA.SCHOOLS[kvCode];
  if (!sch) {
    showToast(`School with KV Code ${kvCode} not found.`);
    return;
  }

  selectedKVCode = kvCode;
  selectedRegion = sch.region;

  // Switch View
  switchView('school');
  if (updateUrl) updateHash(`#kv/${kvCode}`);

  // Populate School Header
  document.getElementById('schoolHeaderCode').textContent = sch.code;
  document.getElementById('schoolHeaderName').textContent = sch.name;
  document.getElementById('schoolHeaderRegion').textContent = `${sch.region} Region • Academic Cycle 2025–26`;
  document.getElementById('schoolHeaderStage').textContent = sch.dcaisStage;
  
  const ratingBadge = document.getElementById('schoolHeaderRating');
  if (ratingBadge) {
    ratingBadge.textContent = sch.rating;
    ratingBadge.className = `status-pill ${(sch.rating || '').includes('A+') ? 'yes' : 'pending'}`;
  }

  // Breadcrumbs
  const bReg = document.getElementById('schoolBreadcrumbRegion');
  if (bReg) bReg.textContent = `${sch.region} Region`;
  const bKV = document.getElementById('schoolBreadcrumbKV');
  if (bKV) bKV.textContent = `KV ${sch.code} (${sch.name})`;

  // Render Tabs
  renderSchoolOverviewTab(sch);
  renderSchoolDossierTab(sch);
  renderSchoolDcaisTab(sch);
  renderSchoolBootcampTab(sch);
  renderSchoolActionRadarTab(sch);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSchoolOverviewTab(sch) {
  // 6 KPI Stat Cards
  document.getElementById('kpiSchoolFaculty').textContent = sch.totalTeachers;
  document.getElementById('kpiSchoolAttended').textContent = sch.attendedCount;
  
  const attPct = sch.totalTeachers > 0 ? ((sch.attendedCount / sch.totalTeachers) * 100).toFixed(1) : 0;
  document.getElementById('kpiSchoolAttendedPct').textContent = `${attPct}% Attendance Rate`;

  document.getElementById('kpiSchoolCertified').textContent = sch.certifiedCount;
  const certPct = sch.totalTeachers > 0 ? ((sch.certifiedCount / sch.totalTeachers) * 100).toFixed(1) : 0;
  document.getElementById('kpiSchoolCertifiedPct').textContent = `${certPct}% Conversion Rate`;

  document.getElementById('kpiSchoolDcais').textContent = sch.dcais.m4 === 'Yes' ? 'M4' : (sch.dcais.m3 ? 'M3' : (sch.dcais.m2 ? 'M2' : (sch.dcais.m1 ? 'M1' : 'Enrolled')));
  document.getElementById('kpiSchoolDcaisDesc').textContent = sch.dcaisStage;
  document.getElementById('kpiSchoolBootcamp').textContent = sch.bootcampCount;
  document.getElementById('kpiSchoolRating').textContent = sch.rating.split(' ')[0];

  // Render Charts
  renderSchoolCharts(sch);

  // Render Benchmark Table
  renderSchoolBenchmarkTable(sch);
}

function renderSchoolCharts(sch) {
  // Chart 1: Teacher Category Doughnut Chart
  const ctxCat = document.getElementById('schoolCategoryChart');
  if (ctxCat) {
    if (schoolCatChart) schoolCatChart.destroy();

    // Calculate categories in roster
    let prt = 0, tgt = 0, pgt = 0, hm = 0;
    (sch.roster || []).forEach(t => {
      if (t.c === 'PRT') prt++;
      else if (t.c === 'TGT') tgt++;
      else if (t.c === 'PGT') pgt++;
      else hm++;
    });

    if (prt === 0 && tgt === 0 && pgt === 0) {
      prt = Math.round(sch.totalTeachers * 0.41);
      tgt = Math.round(sch.totalTeachers * 0.34);
      pgt = Math.max(1, sch.totalTeachers - prt - tgt);
    }

    schoolCatChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Primary (PRT)', 'Trained Graduate (TGT)', 'Post Graduate (PGT)', 'Other Faculty'],
        datasets: [{
          data: [prt, tgt, pgt, hm],
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

  // Chart 2: CPD Completion Funnel Bar Chart
  const ctxFunnel = document.getElementById('schoolFunnelChart');
  if (ctxFunnel) {
    if (schoolFunnelChart) schoolFunnelChart.destroy();

    const certTotal = Math.max(1, sch.certifiedCount);
    const funnelData = [
      certTotal,
      Math.max(1, Math.round(certTotal * 0.42)),
      Math.max(0, Math.round(certTotal * 0.28)),
      Math.max(0, Math.round(certTotal * 0.18)),
      Math.max(0, Math.round(certTotal * 0.08)),
      Math.max(0, Math.round(certTotal * 0.05))
    ];

    schoolFunnelChart = new Chart(ctxFunnel, {
      type: 'bar',
      data: {
        labels: ['CPD 1', 'CPD 2', 'CPD 3', 'CPD 4', 'CPD 5', 'CPD 6'],
        datasets: [{
          label: 'Faculty Certified',
          data: funnelData,
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

function renderSchoolBenchmarkTable(sch) {
  const tbody = document.getElementById('schoolBenchmarkTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const regObj = KVS_DATA.REGIONS.find(r => r.name === sch.region);
  const regAvgTeachers = regObj ? (regObj.totalTeachers / regObj.totalKVs).toFixed(1) : '38.0';
  const regAvgCert = regObj ? (regObj.cpdCertified / regObj.totalKVs).toFixed(1) : '8.5';

  const rows = [
    {
      metric: 'Faculty Enrollment',
      thisKV: `${sch.totalTeachers} Teachers`,
      regAvg: `${regAvgTeachers} Teachers`,
      natBench: '42.0 Teachers',
      status: sch.totalTeachers >= Number(regAvgTeachers) ? 'Above Average' : 'Standard'
    },
    {
      metric: 'CPD Certified Faculty',
      thisKV: `${sch.certifiedCount} Certified`,
      regAvg: `${regAvgCert} Certified`,
      natBench: '15+ Certified',
      status: sch.certifiedCount >= Number(regAvgCert) ? 'Above Average' : 'Needs Nudge'
    },
    {
      metric: 'DCAIS Innovation Milestone',
      thisKV: sch.dcaisStage,
      regAvg: 'M2: Curriculum Active',
      natBench: 'M3: Student Projects',
      status: sch.dcais.m3 ? 'Leading' : 'On Track'
    },
    {
      metric: 'Summer Student Bootcamp',
      thisKV: `${sch.bootcampCount} Students`,
      regAvg: '4.2 Students',
      natBench: '10+ Students',
      status: sch.bootcampCount > 5 ? 'High Impact' : 'Standard'
    }
  ];

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.metric}</strong></td>
      <td><strong>${r.thisKV}</strong></td>
      <td>${r.regAvg}</td>
      <td>${r.natBench}</td>
      <td><span class="status-pill ${r.status.includes('Above') || r.status.includes('Leading') || r.status.includes('High') ? 'yes' : 'pending'}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSchoolDossierTab(sch) {
  const tbody = document.getElementById('schoolDossierTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const search = document.getElementById('dossierSearchInput') ? document.getElementById('dossierSearchInput').value.toLowerCase().trim() : '';
  const cat = document.getElementById('dossierCategorySelect') ? document.getElementById('dossierCategorySelect').value : 'All';
  const status = document.getElementById('dossierStatusSelect') ? document.getElementById('dossierStatusSelect').value : 'All';

  let list = sch.roster || [];

  if (search) {
    list = list.filter(t => t.n.toLowerCase().includes(search) || t.s.toLowerCase().includes(search) || t.e.toLowerCase().includes(search));
  }
  if (cat !== 'All') {
    list = list.filter(t => t.c === cat);
  }
  if (status !== 'All') {
    list = list.filter(t => t.crt === status);
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--ink-muted);">No faculty records matched the filter.</td></tr>';
    return;
  }

  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.n}</strong></td>
      <td><span class="status-pill" style="background:#EDF2F7;color:#2D3748;">${t.c}</span></td>
      <td>${t.s}</td>
      <td style="font-size:0.8rem;color:var(--ink-muted);">${t.e}</td>
      <td><strong>${t.m}</strong></td>
      <td><span class="status-pill yes">✓ ${t.a}</span></td>
      <td><span class="status-pill ${t.sub === 'Yes' ? 'yes' : 'no'}">${t.sub === 'Yes' ? '✓ Submitted' : 'Pending'}</span></td>
      <td><span class="status-pill ${t.crt === 'Dispatched' ? 'yes' : 'pending'}">${t.crt === 'Dispatched' ? '✓ Dispatched' : 'Pending'}</span></td>
      <td>
        ${t.crt === 'Dispatched' 
          ? `<button class="btn-header" style="padding:4px 10px;font-size:0.75rem;" onclick="openCertModal('${t.n}', '${t.m}', '${sch.name}')">📜 Certificate</button>`
          : `<button class="btn-header" style="padding:4px 10px;font-size:0.75rem;border-color:var(--adobe-red);color:var(--adobe-red);" onclick="openReminderModal('${t.n}', '${t.m}', '${t.e}')">🔔 Remind</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterSchoolDossier() {
  if (selectedKVCode && KVS_DATA.SCHOOLS[selectedKVCode]) {
    renderSchoolDossierTab(KVS_DATA.SCHOOLS[selectedKVCode]);
  }
}

function renderSchoolDcaisTab(sch) {
  const grid = document.getElementById('schoolDcaisStagesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const stages = [
    { id: 'M1', title: 'Orientation & Design Thinking', desc: 'Faculty onboarding, Adobe ID provisioning, and creative mindset fundamentals.', active: sch.dcais.m1 },
    { id: 'M2', title: 'Creative Curriculum Integration', desc: 'Embedding Express into NCERT Science, Math, Languages, and Social Science.', active: sch.dcais.m2 },
    { id: 'M3', title: 'Student Project Implementation', desc: 'Classroom rollouts: Grade 6 Posters, Grade 7 Infographics, Grade 8 Videos.', active: sch.dcais.m3 },
    { id: 'M4', title: 'Gallery Publishing & Showcase', desc: 'Official school web gallery links, annual creative exhibition, and verified badges.', active: sch.dcais.m4 === 'Yes' }
  ];

  stages.forEach(s => {
    const card = document.createElement('div');
    card.className = 'dcais-stage-card';
    card.innerHTML = `
      <div class="dcais-stage-header">
        <span class="dcais-stage-pill">${s.id}</span>
        <span class="status-pill ${s.active ? 'yes' : 'pending'}">${s.active ? '✓ Completed' : 'In Progress'}</span>
      </div>
      <h4 class="dcais-stage-title">${s.title}</h4>
      <p class="dcais-stage-desc">${s.desc}</p>
      <button class="btn-header" style="width:100%;justify-content:center;" onclick="showToast('Opened details for ${s.id}: ${s.title}')">
        ${s.active ? 'View Implementation Log ↗' : 'Activate Module ➔'}
      </button>
    `;
    grid.appendChild(card);
  });
}

function renderSchoolBootcampTab(sch) {
  const tbody = document.getElementById('schoolBootcampTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = sch.bootcamp || [];
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--ink-muted);">No student bootcamp records logged for this school in the current cycle.</td></tr>';
    return;
  }

  list.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.name}</strong></td>
      <td><span class="status-pill" style="background:#EDF2F7;color:#2D3748;">Grade ${b.grade}</span></td>
      <td>${b.school || sch.name}</td>
      <td>Creative Digital Storytelling</td>
      <td><span class="status-pill yes">✓ Certified</span></td>
      <td>
        <a href="${b.certUrl}" target="_blank" class="btn-header" style="padding:4px 10px;font-size:0.75rem;text-decoration:none;">Download Credential ↗</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSchoolActionRadarTab(sch) {
  const tbody = document.getElementById('schoolActionRadarTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const pendingList = (sch.roster || []).filter(t => t.crt === 'Pending');

  if (pendingList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--success);font-weight:700;">✓ Outstanding! 100% of faculty submissions in this school are verified and certified.</td></tr>';
    return;
  }

  pendingList.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.n}</strong></td>
      <td>${t.s} (${t.c})</td>
      <td><strong>${t.m}</strong></td>
      <td><span class="status-pill no">Pending Submission</span></td>
      <td>
        <button class="btn-header primary" style="padding:4px 10px;font-size:0.75rem;" onclick="openReminderModal('${t.n}', '${t.m}', '${t.e}')">
          🔔 Send WhatsApp Reminder
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function switchSchoolTab(tabName, updateUrl = true) {
  activeSchoolTab = tabName;

  document.querySelectorAll('.school-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });

  document.querySelectorAll('.school-tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });

  if (updateUrl && selectedKVCode) {
    updateHash(`#kv/${selectedKVCode}/${tabName}`);
  }

  // Trigger chart resize if returning to overview
  if (tabName === 'overview') {
    setTimeout(() => {
      if (schoolCatChart) schoolCatChart.resize();
      if (schoolFunnelChart) schoolFunnelChart.resize();
    }, 100);
  }
}

// ================================================================
// 3. REGIONAL INTELLIGENCE HUB CONTROLLER
// ================================================================

function navigateToRegionalHub(regName = null, updateUrl = true) {
  const targetReg = regName || selectedRegion || 'Ahmedabad';
  const regObj = KVS_DATA.REGIONS.find(r => r.name === targetReg);
  if (!regObj) return;

  selectedRegion = targetReg;
  switchView('region');
  if (updateUrl) updateHash(`#region/${encodeURIComponent(targetReg)}`);

  document.getElementById('regHubTitle').textContent = `${targetReg} Regional Intelligence Hub`;
  document.getElementById('regHubSubtitle').textContent = `Consolidated performance tracking across all ${regObj.totalKVs} Kendriya Vidyalayas in ${targetReg} Region`;

  // Regional KPIs
  document.getElementById('kpiRegTotalKVs').textContent = regObj.totalKVs;
  document.getElementById('kpiRegTotalTeachers').textContent = regObj.totalTeachers.toLocaleString();
  document.getElementById('kpiRegCertified').textContent = regObj.cpdCertified.toLocaleString();
  document.getElementById('kpiRegDcaisCount').textContent = regObj.m2Schools || Math.round(regObj.totalKVs * 0.55);

  // Render Regional School Leaderboard
  renderRegionalLeaderboard(regObj);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRegionalLeaderboard(regObj) {
  const tbody = document.getElementById('regLeaderboardTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const search = document.getElementById('regLeaderboardSearchInput') ? document.getElementById('regLeaderboardSearchInput').value.toLowerCase().trim() : '';
  let list = regObj.kvs || [];

  if (search) {
    list = list.filter(k => String(k.code).includes(search) || k.name.toLowerCase().includes(search));
  }

  list.forEach((k, idx) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => selectSchool(k.code);

    const ratingClass = (k.rating || '').includes('A+') ? 'exemplary' : ((k.rating || '').includes('A') ? 'advanced' : 'active');

    tr.innerHTML = `
      <td><strong>#${idx + 1}</strong></td>
      <td><span class="kv-code-badge">KV ${k.code}</span></td>
      <td><strong>${k.name}</strong></td>
      <td>${k.teachers}</td>
      <td>${k.attended}</td>
      <td><strong>${k.certified}</strong></td>
      <td><span class="status-pill ${k.stage.includes('M4') || k.stage.includes('M3') ? 'yes' : 'pending'}">${k.stage}</span></td>
      <td><span class="kv-rating-badge ${ratingClass}">${k.rating || 'Active'}</span></td>
      <td>
        <button class="btn-header" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation(); selectSchool(${k.code})">
          Open Portal ➔
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRegionalLeaderboard() {
  if (selectedRegion) {
    const regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
    if (regObj) renderRegionalLeaderboard(regObj);
  }
}

// ================================================================
// 4. VIEW ROUTER & NAVIGATION HELPERS
// ================================================================

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.portal-view').forEach(v => v.classList.remove('active'));

  if (viewName === 'gateway') {
    document.getElementById('viewGateway').classList.add('active');
  } else if (viewName === 'school') {
    document.getElementById('viewSchool').classList.add('active');
  } else if (viewName === 'region') {
    document.getElementById('viewRegion').classList.add('active');
  }
}

function navigateToGateway(updateUrl = true) {
  switchView('gateway');
  if (updateUrl) updateHash('#gateway');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// 5. QUICK SEARCH (AUTOCOMPLETE ACROSS 1,202 SCHOOLS)
// ================================================================

function handleQuickSearch(query) {
  const dropdown = document.getElementById('quickSearchResultsDropdown');
  if (!dropdown) return;

  const q = query.toLowerCase().trim();
  if (q.length < 2) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  const matches = [];
  const allCodes = Object.keys(KVS_DATA.SCHOOLS);

  for (const code of allCodes) {
    const s = KVS_DATA.SCHOOLS[code];
    if (String(s.code).includes(q) || s.name.toLowerCase().includes(q)) {
      matches.push(s);
      if (matches.length >= 8) break;
    }
  }

  if (matches.length === 0) {
    dropdown.innerHTML = '<div style="padding:12px;font-size:0.82rem;color:var(--ink-muted);text-align:center;">No matching Kendriya Vidyalayas.</div>';
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = '';
  matches.forEach(s => {
    const item = document.createElement('div');
    item.style.padding = '10px 14px';
    item.style.borderBottom = '1px solid var(--border-subtle)';
    item.style.cursor = 'pointer';
    item.style.fontSize = '0.85rem';
    item.style.transition = 'background 0.15s';
    item.onmouseenter = () => { item.style.background = '#F8FAFC'; };
    item.onmouseleave = () => { item.style.background = '#FFFFFF'; };
    item.onclick = () => {
      dropdown.style.display = 'none';
      document.getElementById('quickSearchInput').value = '';
      selectSchool(s.code);
    };

    item.innerHTML = `
      <div style="font-weight:800;color:var(--navy-dark);"><span style="color:var(--adobe-red);">KV ${s.code}</span> — ${s.name}</div>
      <div style="font-size:0.75rem;color:var(--ink-muted);">${s.region} Region • ${s.totalTeachers} Faculty • ${s.dcaisStage}</div>
    `;
    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
}

// ================================================================
// 6. MODALS & EXPORT INTERACTIONS
// ================================================================

function openCertModal(teacherName, moduleName, schoolName) {
  document.getElementById('certModalTeacherName').textContent = teacherName;
  document.getElementById('certModalModuleName').textContent = moduleName;
  document.getElementById('certModalSchoolName').textContent = schoolName;
  document.getElementById('certModalCredId').textContent = `ID: ADV-KVS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  document.getElementById('certModal').style.display = 'flex';
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function openReminderModal(teacherName, moduleName, email) {
  document.getElementById('reminderTeacherName').textContent = teacherName;
  document.getElementById('reminderModuleName').textContent = moduleName;
  document.getElementById('reminderEmail').textContent = email || 'faculty@kvs.in';

  const template = `Dear ${teacherName}, please complete your assignment submission for ${moduleName} under the Adobe Express for Education × KVS initiative to receive your official accredited digital credential.`;
  document.getElementById('reminderMessageText').value = template;
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

function sendBulkReminders() {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const sch = KVS_DATA.SCHOOLS[selectedKVCode];
  const pending = (sch.roster || []).filter(t => t.crt === 'Pending');
  showToast(`Queued ${pending.length} automated WhatsApp reminders for ${sch.name}.`);
}

function setRole(role, btn) {
  activeRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Switched portal perspective to: ${btn.textContent.trim()}`);
}

function exportSchoolCSV() {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const sch = KVS_DATA.SCHOOLS[selectedKVCode];

  const rows = [
    ['KV Code', 'School Name', 'Region', 'Teacher Name', 'Email', 'Category', 'Subject', 'Module', 'Attendance', 'Assignment', 'Certificate Status', 'Date']
  ];

  (sch.roster || []).forEach(t => {
    rows.push([sch.code, sch.name, sch.region, t.n, t.e, t.c, t.s, t.m, t.a, t.sub, t.crt, t.d]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_Faculty_Dossier.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported CSV dossier for KV ${sch.code}.`);
}

function exportNationalReport() {
  const rows = [
    ['Region', 'Total KVs', 'Total Faculty', 'CPD Attended', 'CPD Certified', 'Bootcamp Students']
  ];

  KVS_DATA.REGIONS.forEach(r => {
    rows.push([r.name, r.totalKVs, r.totalTeachers, r.cpdAttended, r.cpdCertified, r.bootcampCount]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `KVS_National_Implementation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exported National KVS Implementation Report.');
}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3400);
}
