/**
 * KVS Principal Dashboard — Complete Controller
 * High-contrast, easy-to-read, clean English, 100% teacher-focused.
 *
 * Architecture:
 * - View 1: School Search & Overview (Combobox search & regional summary)
 * - View 2: CPD Teacher Training (Attendance Pie + Table, Certificate Pie + Table, Attendance Roster)
 * - View 3: DCAIS Teacher Training (Strictly for Teachers: 4 Module Status Cards, Module Bar Chart, School Module Table, DCAIS Summary Table)
 */

let selectedRegion = '';
let selectedKVCode = null;
let currentView = 'home';
let currentRosterFilter = 'all';
let currentModuleFilter = '';
let currentSubjectFilter = '';
let allSchoolsList = [];
let cpdAttendanceChart = null;
let cpdCertifiedChart = null;
let regionalCpdChart = null;
let regionalDcaisChart = null;
let dcaisBarChart = null;

const CPD_MODULE_NAMES = {
  'CPD 1': 'Digital Creativity Foundations',
  'CPD 2': 'Visual Communication & Design',
  'CPD 3': 'Collaborative Digital Projects',
  'CPD 4': 'Advanced Infographics & Data Visuals',
  'CPD 5': 'Interactive Classrooms & Presentation',
  'CPD 6': 'Digital Skills Mastery & Evaluation'
};

const CPD_MODULE_COLORS = [
  '#FA0F00', // CPD 1 Red
  '#2563EB', // CPD 2 Blue
  '#059669', // CPD 3 Green
  '#D97706', // CPD 4 Amber
  '#7C3AED', // CPD 5 Purple
  '#0D9488'  // CPD 6 Teal
];

document.addEventListener('DOMContentLoaded', () => {
  initPortal();

  // Close combobox when clicking outside
  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.combobox-wrap');
    if (wrap && !wrap.contains(e.target)) {
      hideComboboxDropdown();
    }
  });

  // Handle URL deep linking for DCAIS region (?dcaisRegion=Agra or #dcaisRegion=Agra)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const dcaisRegParam = urlParams.get('dcaisRegion');
    if (dcaisRegParam) {
      setTimeout(() => {
        navigateTo('dcais');
        openRegionDcaisModal(dcaisRegParam);
      }, 350);
    }
  } catch (err) {
    console.error('Error parsing dcaisRegion param', err);
  }

  // Close DCAIS modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRegionDcaisModal();
    }
  });
});

function initPortal() {
  if (typeof KVS_DATA === 'undefined') return;

  // Build flattened school lookup array for instant search
  allSchoolsList = Object.values(KVS_DATA.SCHOOLS).map(s => ({
    code: s.code,
    name: s.name,
    region: s.region,
    totalTeachers: s.totalTeachers,
    attendedCount: s.attendedCount,
    certifiedCount: s.certifiedCount,
    rating: s.rating
  }));

  // Populate Region Dropdown
  const regSelect = document.getElementById('regionSelect');
  if (regSelect) {
    regSelect.innerHTML = '<option value="">Choose Region...</option>';
    KVS_DATA.REGIONS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = `${r.name} (${r.totalKVs} KVs)`;
      regSelect.appendChild(opt);
    });
  }

  // Pre-render DCAIS Summary Table
  renderDcaisSummaryTable(KVS_DATA.DCAIS_SUMMARY || []);

  // Ensure portal starts in full expanded hero mode
  resetToFullHero();
}

// ==================== 1. FAST COMBOBOX / SEARCH ====================

function onGlobalSearchInput(val) {
  const q = val.toLowerCase().trim();
  const clearBtn = document.getElementById('comboboxClearBtn');
  if (clearBtn) clearBtn.style.display = q.length > 0 ? 'block' : 'none';

  const dropdown = document.getElementById('comboboxDropdown');
  if (!dropdown) return;

  if (q.length === 0) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  const matches = allSchoolsList.filter(s => {
    return s.code.toString().includes(q) ||
           s.name.toLowerCase().includes(q) ||
           s.region.toLowerCase().includes(q);
  }).slice(0, 30);

  if (matches.length === 0) {
    dropdown.innerHTML = '<div style="padding:14px;color:var(--slate-500);font-size:0.85rem;text-align:center;">No matching Kendriya Vidyalaya found.</div>';
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = matches.map(s => `
    <div class="combobox-item" onclick="selectComboboxSchool(${s.code})">
      <div class="combobox-item-left">
        <span class="combobox-kv-pill">KV ${s.code}</span>
        <div>
          <div class="combobox-item-name">${s.name}</div>
          <div class="combobox-item-region">${s.region} Region</div>
        </div>
      </div>
      <div class="combobox-item-right">
        <span class="combobox-stat-pill">${s.attendedCount} Attended</span>
      </div>
    </div>
  `).join('');

  dropdown.style.display = 'block';
}

function showComboboxDropdown() {
  const input = document.getElementById('globalSchoolSearch');
  if (input && input.value.trim().length > 0) {
    onGlobalSearchInput(input.value);
  }
}

function hideComboboxDropdown() {
  const dropdown = document.getElementById('comboboxDropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function clearCombobox() {
  const input = document.getElementById('globalSchoolSearch');
  if (input) {
    input.value = '';
    input.focus();
  }
  const clearBtn = document.getElementById('comboboxClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  hideComboboxDropdown();
}

function selectComboboxSchool(code) {
  clearCombobox();
  setSchool(code);
}

// Reset hero card to full expanded mode
function resetToFullHero() {
  selectedKVCode = null;
  const heroCard = document.getElementById('selectorHeroCard');
  if (heroCard) {
    heroCard.classList.remove('hero-shrunk');
    heroCard.classList.add('hero-expanded');
  }

  const heroShrunkBar = document.getElementById('heroShrunkBar');
  if (heroShrunkBar) heroShrunkBar.style.display = 'none';

  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) homePrograms.style.display = 'none';

  const summaryBlock = document.getElementById('regionSummaryBlock');
  if (summaryBlock) summaryBlock.style.display = 'none';

  const schSelect = document.getElementById('schoolSelect');
  if (schSelect) {
    schSelect.innerHTML = '<option value="">First choose a region...</option>';
    schSelect.disabled = true;
  }

  const regSelect = document.getElementById('regionSelect');
  if (regSelect) regSelect.value = '';

  navigateTo('home');
}

// ==================== 2. REGION & SCHOOL SELECTOR ====================

function onRegionChange() {
  const regSelect = document.getElementById('regionSelect');
  const regName = regSelect.value;
  selectedRegion = regName;

  const schSelect = document.getElementById('schoolSelect');
  if (!schSelect) return;

  if (!regName) {
    schSelect.innerHTML = '<option value="">First choose a region...</option>';
    schSelect.disabled = true;
    const summaryBlock = document.getElementById('regionSummaryBlock');
    if (summaryBlock) summaryBlock.style.display = 'none';
    resetToFullHero();
    return;
  }

  const regObj = KVS_DATA.REGIONS.find(r => r.name === regName);
  if (!regObj) return;

  // Populate dropdown with "All Schools in Region" as first option, followed by individual schools
  schSelect.innerHTML = `<option value="ALL">All Schools in ${regName} (${regObj.totalKVs} Kendriya Vidyalayas)</option>`;
  regObj.kvs.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.code;
    opt.textContent = `KV ${k.code} — ${k.name} (${k.attended} Attended)`;
    schSelect.appendChild(opt);
  });
  schSelect.disabled = false;
  schSelect.value = 'ALL';

  // Automatically activate regional view so teachers and metrics appear immediately!
  setSchool('ALL');
  renderRegionSummary(regObj);
}

function renderRegionSummary(regObj) {
  const summaryBlock = document.getElementById('regionSummaryBlock');
  if (!summaryBlock) return;

  const badge = document.getElementById('regSummaryBadge');
  const meta = document.getElementById('regSummaryMeta');
  if (badge) badge.textContent = `${regObj.name} Regional Overview`;
  if (meta) meta.textContent = `${regObj.totalKVs} Kendriya Vidyalayas • ${regObj.cpdAttended.toLocaleString()} Teachers Attended CPD`;

  const cpdDesc = document.getElementById('regCpdDesc');
  if (cpdDesc) cpdDesc.textContent = `Continuous Professional Development across all ${regObj.totalKVs} schools in ${regObj.name} Region.`;

  const certified = regObj.cpdCertified || 0;
  const attended = regObj.cpdAttended || 0;
  const pendingCert = Math.max(0, attended - certified);

  const certRate = attended > 0 ? Math.round((certified / attended) * 100) : 0;
  const pendRate = attended > 0 ? Math.round((pendingCert / attended) * 100) : 0;

  const cpdTot = document.getElementById('regCpdTotalAttended') || document.getElementById('regCpdTotalFaculty');
  const cpdCert = document.getElementById('regCpdCertified');
  const cpdCertPct = document.getElementById('regCpdCertPct');
  const cpdPend = document.getElementById('regCpdPendingCert');
  const cpdPendPct = document.getElementById('regCpdPendingPct');
  const cpdYet = document.getElementById('regCpdYetToAttend');
  const cpdYetPct = document.getElementById('regCpdYetPct');
  const cpdAttSum = document.getElementById('regCpdAttendedSummary');

  if (cpdTot) cpdTot.textContent = attended.toLocaleString();
  if (cpdCert) cpdCert.textContent = certified.toLocaleString();
  if (cpdCertPct) cpdCertPct.textContent = `(${certRate}%)`;
  if (cpdPend) cpdPend.textContent = pendingCert.toLocaleString();
  if (cpdPendPct) cpdPendPct.textContent = `(${pendRate}%)`;
  if (cpdYet) cpdYet.textContent = "0";
  if (cpdYetPct) cpdYetPct.textContent = "(0%)";
  if (cpdAttSum) {
    cpdAttSum.textContent = `${certified.toLocaleString()} of ${attended.toLocaleString()} Attended Teachers Certified (${certRate}% Certification Rate)`;
  }

  // Render Regional CPD Pie/Donut Chart (Certified vs Attended Pending Certification)
  const ctx = document.getElementById('chartRegCpdPie');
  if (ctx) {
    if (regionalCpdChart) regionalCpdChart.destroy();
    regionalCpdChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          `CPD Certified: ${certified.toLocaleString()} (${certRate}%)`,
          `Attended (Pending Cert): ${pendingCert.toLocaleString()} (${pendRate}%)`
        ],
        datasets: [{
          data: [certified, pendingCert],
          backgroundColor: ['#2563EB', '#F59E0B'],
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}`;
              }
            }
          }
        }
      }
    });
  }

  const dcaisDesc = document.getElementById('regDcaisDesc');
  if (dcaisDesc) dcaisDesc.textContent = `Digital Creativity & AI Skills (Modules 1–4) student innovation across ${regObj.name} Region.`;

  const m1 = regObj.m1Schools || 0;
  const m2 = regObj.m2Schools || 0;
  const m3 = regObj.m3Schools || 0;
  const m4 = regObj.m4Schools || 0;
  const totalActiveModules = m1 + m2 + m3 + m4;
  const bootcampCount = regObj.bootcampCount !== undefined ? regObj.bootcampCount : m1;
  const totalKVs = regObj.totalKVs || 0;

  const m1Pct = totalActiveModules > 0 ? Math.round((m1 / totalActiveModules) * 100) : 0;
  const m2Pct = totalActiveModules > 0 ? Math.round((m2 / totalActiveModules) * 100) : 0;
  const m3Pct = totalActiveModules > 0 ? Math.round((m3 / totalActiveModules) * 100) : 0;
  const m4Pct = totalActiveModules > 0 ? Math.max(0, 100 - m1Pct - m2Pct - m3Pct) : 0;

  const elM1 = document.getElementById('regDcaisM1');
  const elM2 = document.getElementById('regDcaisM2');
  const elM3 = document.getElementById('regDcaisM3');
  const elM4 = document.getElementById('regDcaisM4');
  const elTotMod = document.getElementById('regDcaisTotalModules');

  const elM1Pct = document.getElementById('regDcaisM1Pct');
  const elM2Pct = document.getElementById('regDcaisM2Pct');
  const elM3Pct = document.getElementById('regDcaisM3Pct');
  const elM4Pct = document.getElementById('regDcaisM4Pct');

  if (elM1) elM1.textContent = m1.toLocaleString();
  if (elM2) elM2.textContent = m2.toLocaleString();
  if (elM3) elM3.textContent = m3.toLocaleString();
  if (elM4) elM4.textContent = m4.toLocaleString();
  if (elTotMod) elTotMod.textContent = totalActiveModules.toLocaleString();

  if (elM1Pct) elM1Pct.textContent = `(${m1Pct}%)`;
  if (elM2Pct) elM2Pct.textContent = `(${m2Pct}%)`;
  if (elM3Pct) elM3Pct.textContent = `(${m3Pct}%)`;
  if (elM4Pct) elM4Pct.textContent = `(${m4Pct}%)`;

  const dcaisSummaryStrip = document.getElementById('regDcaisSummaryStrip');
  if (dcaisSummaryStrip) {
    dcaisSummaryStrip.textContent = `${totalActiveModules} Active Module Completions • ${bootcampCount.toLocaleString()} Bootcamp Students • ${totalKVs} Total Region KVs`;
  }

  // Render Regional DCAIS Pie/Donut Chart
  const ctxDcais = document.getElementById('chartRegDcaisPie');
  if (ctxDcais) {
    if (regionalDcaisChart) regionalDcaisChart.destroy();

    let labels = [];
    let data = [];
    let bgColors = [];

    if (totalActiveModules === 0) {
      labels = ['No DCAIS modules started yet'];
      data = [1];
      bgColors = ['#CBD5E1'];
    } else {
      labels = [
        `Module 1 (Orientation): ${m1.toLocaleString()} (${m1Pct}%)`,
        `Module 2 (Curriculum): ${m2.toLocaleString()} (${m2Pct}%)`,
        `Module 3 (Projects): ${m3.toLocaleString()} (${m3Pct}%)`,
        `Module 4 (Showcase): ${m4.toLocaleString()} (${m4Pct}%)`
      ];
      data = [m1, m2, m3, m4];
      bgColors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B'];
    }

    regionalDcaisChart = new Chart(ctxDcais, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}`;
              }
            }
          }
        }
      }
    });
  }

  summaryBlock.style.display = 'block';
  summaryBlock.classList.remove('animate-slide-up');
  void summaryBlock.offsetWidth;
  summaryBlock.classList.add('animate-slide-up');

  setTimeout(() => {
    summaryBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function onSchoolChange() {
  const schSelect = document.getElementById('schoolSelect');
  if (!schSelect || !schSelect.value) return;
  const val = schSelect.value;
  setSchool(val === 'ALL' ? 'ALL' : Number(val));
}

function quickSelectRegion(regName) {
  const regSelect = document.getElementById('regionSelect');
  if (!regSelect) return;
  regSelect.value = regName;
  onRegionChange();
}

// ==================== 3. REGIONAL BENCHMARK COMPUTATION ====================

function computeRegionalBenchmark(sch) {
  if (sch.code === 'ALL') {
    return { text: "", cls: "" };
  }
  const regSchools = Object.values(KVS_DATA.SCHOOLS).filter(s => s.region === sch.region);
  if (regSchools.length === 0) return { text: "Regional Leader", cls: "gold" };

  const totalCert = regSchools.reduce((acc, s) => acc + s.certifiedCount, 0);
  const totalAttended = regSchools.reduce((acc, s) => acc + (s.attendedCount || 0), 0);
  const regAvgRate = totalAttended > 0 ? (totalCert / totalAttended) * 100 : 20;

  const schoolRate = (sch.certifiedCount / Math.max(1, sch.attendedCount)) * 100;

  const sorted = [...regSchools].sort((a, b) => (b.certifiedCount / Math.max(1, b.attendedCount)) - (a.certifiedCount / Math.max(1, a.attendedCount)));
  const rank = sorted.findIndex(s => s.code === sch.code) + 1;
  const percentile = Math.round((rank / sorted.length) * 100);

  if (percentile <= 15) {
    return { text: `Top 10% in ${sch.region}`, cls: "gold" };
  } else if (percentile <= 35) {
    return { text: `Top 25% in ${sch.region}`, cls: "gold" };
  } else if (schoolRate >= regAvgRate) {
    const diff = Math.round(schoolRate - regAvgRate);
    return { text: `+${diff}% Above Region Avg (${Math.round(regAvgRate)}%)`, cls: "green" };
  } else {
    return { text: `Target: Region Avg is ${Math.round(regAvgRate)}%`, cls: "" };
  }
}

// ==================== 4. SET SCHOOL & PREPARE DATA ====================

let currentActiveSchool = null;

function getActiveSchool() {
  if (selectedKVCode === 'ALL') return currentActiveSchool;
  if (selectedKVCode && KVS_DATA.SCHOOLS[selectedKVCode]) return KVS_DATA.SCHOOLS[selectedKVCode];
  return null;
}

function setSchool(kvCode) {
  let sch;
  let regObj = null;
  if (kvCode === 'ALL') {
    regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
    if (!regObj) return;
    const regSchools = Object.values(KVS_DATA.SCHOOLS).filter(s => s.region === selectedRegion);
    const combinedRoster = [];
    let totTeachers = 0, totAtt = 0, totCert = 0;
    
    regSchools.forEach(s => {
      totTeachers += (s.totalTeachers || 0);
      totAtt += (s.attendedCount || 0);
      totCert += (s.certifiedCount || 0);
      if (s.roster && s.roster.length > 0) {
        s.roster.forEach(t => {
          combinedRoster.push({
            ...t,
            schoolName: s.name,
            schoolCode: s.code
          });
        });
      }
    });

    sch = {
      code: 'ALL',
      name: `All Schools in ${selectedRegion} Region`,
      region: selectedRegion,
      rating: 'Regional Aggregate',
      totalTeachers: totTeachers || regObj.totalTeachers,
      attendedCount: totAtt || regObj.cpdAttended,
      certifiedCount: totCert || regObj.cpdCertified,
      roster: combinedRoster,
      dcais: { m1: 'Yes', m2: 'Yes', m3: 'Yes', m4: 'Yes' }
    };
    selectedKVCode = 'ALL';
  } else {
    sch = KVS_DATA.SCHOOLS[kvCode];
    if (!sch) return;
    selectedKVCode = kvCode;
    selectedRegion = sch.region;
    regObj = KVS_DATA.REGIONS.find(r => r.name === sch.region);
  }

  currentActiveSchool = sch;
  const benchmark = computeRegionalBenchmark(sch);

  // Hide the region summary block only when an individual school is chosen, not when aggregate is active
  const summaryBlock = document.getElementById('regionSummaryBlock');
  if (summaryBlock && kvCode !== 'ALL') summaryBlock.style.display = 'none';

  // Smoothly morph selector hero from expanded to shrunk state
  const heroCard = document.getElementById('selectorHeroCard');
  if (heroCard) {
    heroCard.classList.remove('hero-expanded');
    heroCard.classList.add('hero-shrunk');
  }

  const heroShrunkBar = document.getElementById('heroShrunkBar');
  if (heroShrunkBar) heroShrunkBar.style.display = 'flex';

  const shrunkTitle = document.getElementById('shrunkSchoolTitle');
  if (shrunkTitle) {
    shrunkTitle.textContent = kvCode === 'ALL'
      ? `All Schools in ${sch.region} Region (${regObj ? regObj.totalKVs : ''} Kendriya Vidyalayas)`
      : `KV ${sch.code} — ${sch.name} (${sch.region} Region)`;
  }

  const shrunkBench = document.getElementById('shrunkBenchmarkPill');
  if (shrunkBench) {
    if (benchmark.text) {
      shrunkBench.style.display = 'inline-flex';
      shrunkBench.textContent = benchmark.text;
      shrunkBench.className = `benchmark-pill ${benchmark.cls}`;
    } else {
      shrunkBench.style.display = 'none';
    }
  }

  // Update Home Page Program Cards
  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) {
    homePrograms.style.display = 'block';
    homePrograms.classList.remove('animate-slide-up');
    void homePrograms.offsetWidth;
    homePrograms.classList.add('animate-slide-up');

    const badge = document.getElementById('homeSelectedSchoolBadge');
    const title = document.getElementById('homeSelectedSchoolTitle');
    const reg = document.getElementById('homeSelectedSchoolRegion');
    const cpdStats = document.getElementById('homeCpdStats');
    const dcaisStats = document.getElementById('homeDcaisStats');
    const benchPill = document.getElementById('homeBenchmarkPill');

    if (badge) {
      if (kvCode === 'ALL') {
        badge.innerHTML = '<img src="kvs-logo.svg" onerror="this.onerror=null; this.src=\'../assets/kvs-logo.svg\';" alt="Kendriya Vidyalaya Sangathan" style="width:38px;height:38px;object-fit:contain;display:block;">';
        badge.title = 'Kendriya Vidyalaya Sangathan — Regional Overview';
      } else {
        badge.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;line-height:1.1;"><span style="font-size:0.62rem;font-weight:800;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.04em;">KV</span><span style="font-size:0.92rem;font-weight:900;color:var(--slate-900);">${sch.code}</span></div>`;
        badge.title = `KV ${sch.code} — ${sch.name}`;
      }
    }
    if (title) title.textContent = kvCode === 'ALL' ? sch.name : `KV ${sch.code} — ${sch.name}`;
    if (reg) reg.textContent = `${sch.region} Region`;
    if (cpdStats) cpdStats.textContent = `${sch.attendedCount} Attended • ${sch.certifiedCount} Certified`;
    
    const dcaisM1Status = sch.dcais && sch.dcais.m1 === 'Yes' ? 'Module 1 Attended' : 'Module 1 Pending';
    if (dcaisStats) dcaisStats.textContent = `${dcaisM1Status} • Teacher Program`;
    if (benchPill) {
      if (benchmark.text) {
        benchPill.style.display = 'inline-flex';
        benchPill.textContent = benchmark.text;
        benchPill.className = `benchmark-pill ${benchmark.cls}`;
      } else {
        benchPill.style.display = 'none';
      }
    }

    setTimeout(() => {
      homePrograms.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }

  // Pre-populate CPD View Header
  const cpdBadge = document.getElementById('cpdSchoolCodeBadge');
  const cpdTitle = document.getElementById('cpdSchoolNameTitle');
  const cpdReg = document.getElementById('cpdSchoolRegionTag');
  const cpdRating = document.getElementById('cpdSchoolRatingTag');
  const cpdFaculty = document.getElementById('cpdSumFaculty');
  const cpdAtt = document.getElementById('cpdSumAttended');
  const cpdCert = document.getElementById('cpdSumCertified');
  const cpdCertRateKpi = document.getElementById('cpdSumCertRate');
  const cpdBench = document.getElementById('cpdBenchmarkPill');

  const cpdBadgeBox = cpdBadge ? cpdBadge.closest('.kv-badge-square') : null;
  if (cpdBadgeBox) {
    if (kvCode === 'ALL') {
      cpdBadgeBox.style.background = '#FFFFFF';
      cpdBadgeBox.style.border = '1.5px solid var(--slate-200)';
      cpdBadgeBox.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
      cpdBadgeBox.innerHTML = '<img src="kvs-logo.svg" onerror="this.onerror=null; this.src=\'../assets/kvs-logo.svg\';" alt="Kendriya Vidyalaya Sangathan" style="width:36px;height:36px;object-fit:contain;display:block;">';
    } else {
      cpdBadgeBox.style.background = '';
      cpdBadgeBox.style.border = '';
      cpdBadgeBox.style.boxShadow = '';
      cpdBadgeBox.innerHTML = `<span>KV</span><span id="cpdSchoolCodeBadge">${sch.code}</span>`;
    }
  } else if (cpdBadge) {
    cpdBadge.textContent = kvCode === 'ALL' ? 'ALL' : sch.code;
  }
  if (cpdTitle) cpdTitle.textContent = sch.name;
  if (cpdReg) cpdReg.textContent = `${sch.region} Region`;
  if (cpdRating) cpdRating.textContent = `Rating: ${sch.rating}`;
  if (cpdFaculty) cpdFaculty.textContent = sch.attendedCount;
  if (cpdAtt) cpdAtt.textContent = sch.attendedCount;
  if (cpdCert) cpdCert.textContent = sch.certifiedCount;
  const cpdRateVal = sch.attendedCount > 0 ? Math.round((sch.certifiedCount / sch.attendedCount) * 100) : 0;
  if (cpdCertRateKpi) cpdCertRateKpi.textContent = `${cpdRateVal}%`;
  if (cpdBench) {
    if (benchmark.text) {
      cpdBench.style.display = 'inline-flex';
      cpdBench.textContent = benchmark.text;
      cpdBench.className = `benchmark-pill ${benchmark.cls}`;
    } else {
      cpdBench.style.display = 'none';
    }
  }

  // Pre-populate DCAIS View Header
  const dcaisBadge = document.getElementById('dcaisSchoolCodeBadge');
  const dcaisTitle = document.getElementById('dcaisSchoolNameTitle');
  const dcaisReg = document.getElementById('dcaisSchoolRegionTag');
  const dcaisStage = document.getElementById('dcaisSchoolStageTag');
  const dcaisFaculty = document.getElementById('dcaisSumFaculty');
  const dcaisStatusKpi = document.getElementById('dcaisSumSchoolStatus');
  const dcaisSumStage = document.getElementById('dcaisSumStage');
  const dcaisSumRegionAtt = document.getElementById('dcaisSumRegionAtt');
  const dcaisBench = document.getElementById('dcaisBenchmarkPill');

  const regSum = (KVS_DATA.DCAIS_SUMMARY || []).find(r => r.region.toLowerCase() === sch.region.toLowerCase());
  const regM1Attended = regSum ? regSum.m1_present : 0;

  const dcaisBadgeBox = dcaisBadge ? dcaisBadge.closest('.kv-badge-square') : null;
  if (dcaisBadgeBox) {
    if (kvCode === 'ALL') {
      dcaisBadgeBox.style.background = '#FFFFFF';
      dcaisBadgeBox.style.border = '1.5px solid var(--slate-200)';
      dcaisBadgeBox.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
      dcaisBadgeBox.innerHTML = '<img src="kvs-logo.svg" onerror="this.onerror=null; this.src=\'../assets/kvs-logo.svg\';" alt="Kendriya Vidyalaya Sangathan" style="width:36px;height:36px;object-fit:contain;display:block;">';
    } else {
      dcaisBadgeBox.style.background = '#1E1B4B';
      dcaisBadgeBox.style.border = '';
      dcaisBadgeBox.style.boxShadow = '';
      dcaisBadgeBox.innerHTML = `<span>KV</span><span id="dcaisSchoolCodeBadge">${sch.code}</span>`;
    }
  } else if (dcaisBadge) {
    dcaisBadge.textContent = kvCode === 'ALL' ? 'ALL' : sch.code;
  }
  if (dcaisTitle) dcaisTitle.textContent = sch.name;
  if (dcaisReg) dcaisReg.textContent = `${sch.region} Region`;
  if (dcaisStage) dcaisStage.textContent = `DCAIS: ${sch.dcais && sch.dcais.m1 === 'Yes' ? 'M1 Attended' : 'Initiating'}`;
  if (dcaisFaculty) dcaisFaculty.textContent = sch.attendedCount;
  if (dcaisStatusKpi) dcaisStatusKpi.textContent = (sch.dcais && sch.dcais.m1 === 'Yes') ? 'Active' : 'Initiating';
  if (dcaisSumStage) {
    let currentMod = 'Initiating';
    if (sch.dcais) {
      if (sch.dcais.m4 === 'Yes') currentMod = 'M4 Completed';
      else if (sch.dcais.m3 === 'Yes') currentMod = 'M3 Completed';
      else if (sch.dcais.m2 === 'Yes') currentMod = 'M2 Completed';
      else if (sch.dcais.m1 === 'Yes') currentMod = 'M1 Attended';
    }
    dcaisSumStage.textContent = currentMod;
  }
  if (dcaisSumRegionAtt) dcaisSumRegionAtt.textContent = `${regM1Attended} in Region`;
  if (dcaisBench) {
    dcaisBench.textContent = sch.dcais && sch.dcais.m1 === 'Yes' ? 'M1 Attended' : 'Teacher Training';
  }

  // Render Sub-Views
  currentRosterFilter = 'all';
  currentModuleFilter = '';
  currentSubjectFilter = '';
  const rSearch = document.getElementById('rosterSearch');
  if (rSearch) rSearch.value = '';
  document.querySelectorAll('#rosterFilterPills .filter-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  populateRosterFilters(sch.roster || []);
  filterRoster();
  renderCpdCharts(sch);
  renderDcaisView(sch);
}

// ==================== 5. MULTI-VIEW NAVIGATION ====================

function navigateTo(viewName) {
  currentView = viewName;

  const viewHome = document.getElementById('viewHome');
  const viewCpd = document.getElementById('viewCpd');
  const viewDcais = document.getElementById('viewDcais');

  ['navTabHome', 'navTabCpd', 'navTabDcais'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const sch = getActiveSchool();

  if (viewName === 'home') {
    if (viewHome) viewHome.style.display = 'block';
    if (viewCpd) viewCpd.style.display = 'none';
    if (viewDcais) viewDcais.style.display = 'none';
    const tab = document.getElementById('navTabHome');
    if (tab) tab.classList.add('active');
  } else if (viewName === 'cpd') {
    if (!selectedKVCode) {
      showToast('Please select your Kendriya Vidyalaya first.');
      if (viewHome) viewHome.style.display = 'block';
      const tab = document.getElementById('navTabHome');
      if (tab) tab.classList.add('active');
      return;
    }
    if (viewHome) viewHome.style.display = 'none';
    if (viewCpd) viewCpd.style.display = 'block';
    if (viewDcais) viewDcais.style.display = 'none';
    const tab = document.getElementById('navTabCpd');
    if (tab) tab.classList.add('active');
    if (sch) {
      renderCpdCharts(sch);
    }
  } else if (viewName === 'dcais') {
    if (!selectedKVCode) {
      showToast('Please select your Kendriya Vidyalaya first.');
      if (viewHome) viewHome.style.display = 'block';
      const tab = document.getElementById('navTabHome');
      if (tab) tab.classList.add('active');
      return;
    }
    if (viewHome) viewHome.style.display = 'none';
    if (viewCpd) viewCpd.style.display = 'none';
    if (viewDcais) viewDcais.style.display = 'block';
    const tab = document.getElementById('navTabDcais');
    if (tab) tab.classList.add('active');
    if (sch) {
      renderDcaisView(sch);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 6. CPD CHARTS & SUMMARY TABLES ====================

function renderCpdCharts(sch) {
  const roster = sch.roster || [];
  const moduleKeys = ['CPD 1', 'CPD 2', 'CPD 3', 'CPD 4', 'CPD 5', 'CPD 6'];

  // 1. Calculate per-module attendance and certificate counts
  const attCounts = {};
  const certCounts = {};
  moduleKeys.forEach(m => {
    attCounts[m] = 0;
    certCounts[m] = 0;
  });

  roster.forEach(t => {
    const mod = t.m || 'CPD 1';
    if (t.a === 'Yes') {
      attCounts[mod] = (attCounts[mod] || 0) + 1;
    }
    if (t.crt === 'Dispatched') {
      certCounts[mod] = (certCounts[mod] || 0) + 1;
    }
  });

  const totalAttended = Object.values(attCounts).reduce((a, b) => a + b, 0);
  const totalCertified = Object.values(certCounts).reduce((a, b) => a + b, 0);

  // Update Badges
  const badgeAtt = document.getElementById('badgeCpdAttRate');
  if (badgeAtt) {
    badgeAtt.textContent = `${totalAttended} Teachers Attended`;
  }
  const badgeCert = document.getElementById('badgeCpdCertRate');
  if (badgeCert) {
    badgeCert.textContent = `${totalCertified} Certificates Received`;
  }

  // --- CHART 1: CPD Module Attendance Pie Chart ---
  const ctxAtt = document.getElementById('chartCpdAttPie');
  if (ctxAtt) {
    if (cpdAttendanceChart) cpdAttendanceChart.destroy();

    const attValues = moduleKeys.map(m => attCounts[m]);
    const hasData = totalAttended > 0;

    cpdAttendanceChart = new Chart(ctxAtt, {
      type: 'doughnut',
      data: {
        labels: moduleKeys.map(m => `${m}: ${CPD_MODULE_NAMES[m]}`),
        datasets: [{
          data: hasData ? attValues : [1],
          backgroundColor: hasData ? CPD_MODULE_COLORS : ['#E2E8F0'],
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (!hasData) return ' No attendance records';
                const val = context.parsed;
                const pct = totalAttended > 0 ? Math.round((val / totalAttended) * 100) : 0;
                return ` ${context.label}: ${val} teachers (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // --- TABLE 1: CPD Module Attendance Full Table ---
  const tableAttBody = document.getElementById('tableCpdAttBody');
  if (tableAttBody) {
    tableAttBody.innerHTML = moduleKeys.map((m, idx) => {
      const count = attCounts[m] || 0;
      const share = totalAttended > 0 ? ((count / totalAttended) * 100).toFixed(1) : '0.0';
      const color = CPD_MODULE_COLORS[idx];
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
              <div>
                <strong style="color:var(--slate-900);font-size:0.88rem;">${m}</strong>
                <span style="font-size:0.75rem;color:var(--slate-500);display:block;">${CPD_MODULE_NAMES[m]}</span>
              </div>
            </div>
          </td>
          <td style="text-align:right;font-weight:800;color:var(--slate-900);font-size:0.88rem;">${count.toLocaleString()}</td>
          <td style="text-align:right;font-weight:700;color:var(--slate-600);">${share}%</td>
        </tr>
      `;
    }).join('') + `
      <tr class="total-row" style="background:var(--slate-100);font-weight:900;border-top:2px solid var(--slate-300);">
        <td><strong>Total Attended</strong></td>
        <td style="text-align:right;color:var(--green);font-weight:900;font-size:0.92rem;">${totalAttended.toLocaleString()}</td>
        <td style="text-align:right;font-weight:900;">100%</td>
      </tr>
    `;
  }

  // --- CHART 2: CPD Certificates Received Pie Chart ---
  const ctxCert = document.getElementById('chartCpdCertPie');
  if (ctxCert) {
    if (cpdCertifiedChart) cpdCertifiedChart.destroy();

    const certValues = moduleKeys.map(m => certCounts[m]);
    const hasCertData = totalCertified > 0;

    cpdCertifiedChart = new Chart(ctxCert, {
      type: 'doughnut',
      data: {
        labels: moduleKeys.map(m => `${m}: ${CPD_MODULE_NAMES[m]}`),
        datasets: [{
          data: hasCertData ? certValues : [1],
          backgroundColor: hasCertData ? CPD_MODULE_COLORS : ['#E2E8F0'],
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (!hasCertData) return ' 0 Certificates received yet';
                const val = context.parsed;
                const pct = totalCertified > 0 ? Math.round((val / totalCertified) * 100) : 0;
                return ` ${context.label}: ${val} certificates (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // --- TABLE 2: CPD Certificates Received Full Table ---
  const tableCertBody = document.getElementById('tableCpdCertBody');
  if (tableCertBody) {
    tableCertBody.innerHTML = moduleKeys.map((m, idx) => {
      const count = certCounts[m] || 0;
      const share = totalCertified > 0 ? ((count / totalCertified) * 100).toFixed(1) : '0.0';
      const color = CPD_MODULE_COLORS[idx];
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
              <div>
                <strong style="color:var(--slate-900);font-size:0.88rem;">${m}</strong>
                <span style="font-size:0.75rem;color:var(--slate-500);display:block;">${CPD_MODULE_NAMES[m]}</span>
              </div>
            </div>
          </td>
          <td style="text-align:right;font-weight:800;color:var(--slate-900);font-size:0.88rem;">${count.toLocaleString()}</td>
          <td style="text-align:right;font-weight:700;color:var(--slate-600);">${share}%</td>
        </tr>
      `;
    }).join('') + `
      <tr class="total-row" style="background:var(--slate-100);font-weight:900;border-top:2px solid var(--slate-300);">
        <td><strong>Total Certificates</strong></td>
        <td style="text-align:right;color:var(--blue);font-weight:900;font-size:0.92rem;">${totalCertified.toLocaleString()}</td>
        <td style="text-align:right;font-weight:900;">100%</td>
      </tr>
    `;
  }
}

// ==================== 7. TEACHER ATTENDANCE ROSTER (ALL TEACHERS — NO CATEGORY) ====================

function populateRosterFilters(roster) {
  const modSelect = document.getElementById('rosterModuleFilter');
  const subjSelect = document.getElementById('rosterSubjectFilter');
  if (!modSelect && !subjSelect) return;

  const modules = new Set();
  const subjects = new Set();

  (roster || []).forEach(t => {
    if (t.m && t.m.trim()) modules.add(t.m.trim());
    if (t.s && t.s.trim()) subjects.add(t.s.trim());
  });

  if (modSelect) {
    const curMod = modSelect.value;
    const sortedModules = Array.from(modules).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    modSelect.innerHTML = '<option value="">All CPD Modules</option>' +
      sortedModules.map(m => `<option value="${m}">${m}</option>`).join('');
    if (modules.has(curMod)) {
      modSelect.value = curMod;
      currentModuleFilter = curMod;
    } else {
      modSelect.value = '';
      currentModuleFilter = '';
    }
  }

  if (subjSelect) {
    const curSubj = subjSelect.value;
    const sortedSubjects = Array.from(subjects).sort((a, b) => a.localeCompare(b));
    subjSelect.innerHTML = '<option value="">All Subjects</option>' +
      sortedSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
    if (subjects.has(curSubj)) {
      subjSelect.value = curSubj;
      currentSubjectFilter = curSubj;
    } else {
      subjSelect.value = '';
      currentSubjectFilter = '';
    }
  }

  const modWrap = document.getElementById('rosterModuleWrap');
  if (modWrap) modWrap.classList.toggle('has-active-filter', currentModuleFilter !== '');

  const subjWrap = document.getElementById('rosterSubjectWrap');
  if (subjWrap) subjWrap.classList.toggle('has-active-filter', currentSubjectFilter !== '');
}

function resetRosterFilters() {
  currentRosterFilter = 'all';
  currentModuleFilter = '';
  currentSubjectFilter = '';

  const searchInput = document.getElementById('rosterSearch');
  if (searchInput) searchInput.value = '';

  const modSelect = document.getElementById('rosterModuleFilter');
  if (modSelect) {
    modSelect.value = '';
    modSelect.classList.remove('active-filter');
  }

  const subjSelect = document.getElementById('rosterSubjectFilter');
  if (subjSelect) {
    subjSelect.value = '';
    subjSelect.classList.remove('active-filter');
  }

  const modWrap = document.getElementById('rosterModuleWrap');
  if (modWrap) modWrap.classList.remove('has-active-filter');

  const subjWrap = document.getElementById('rosterSubjectWrap');
  if (subjWrap) subjWrap.classList.remove('has-active-filter');

  document.querySelectorAll('#rosterFilterPills .filter-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  const btnReset = document.getElementById('btnResetRosterFilters');
  if (btnReset) btnReset.style.display = 'none';

  filterRoster();
}

function updateRosterFilterCounts(roster) {
  let attended = 0, cert = 0, pend = 0;
  (roster || []).forEach(t => {
    if (t.a === 'Yes') attended++;
    if (t.crt === 'Dispatched') cert++;
    else pend++;
  });

  const cAll = document.getElementById('countFilterAll');
  const cAtt = document.getElementById('countFilterAttended');
  const cCert = document.getElementById('countFilterCertified');
  const cPend = document.getElementById('countFilterPending');

  if (cAll) cAll.textContent = (roster || []).length.toLocaleString();
  if (cAtt) cAtt.textContent = attended.toLocaleString();
  if (cCert) cCert.textContent = cert.toLocaleString();
  if (cPend) cPend.textContent = pend.toLocaleString();
}

function setRosterFilter(filterType, btn) {
  currentRosterFilter = filterType;

  document.querySelectorAll('#rosterFilterPills .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  filterRoster();
}

function filterRoster(textQuery) {
  const sch = getActiveSchool();
  if (!sch) return;

  const searchInput = document.getElementById('rosterSearch');
  const q = (typeof textQuery === 'string' ? textQuery : (searchInput ? searchInput.value : '')).toLowerCase().trim();

  const modSelect = document.getElementById('rosterModuleFilter');
  currentModuleFilter = modSelect ? modSelect.value.trim() : '';

  const subjSelect = document.getElementById('rosterSubjectFilter');
  currentSubjectFilter = subjSelect ? subjSelect.value.trim() : '';

  const modWrap = document.getElementById('rosterModuleWrap');
  if (modWrap) modWrap.classList.toggle('has-active-filter', currentModuleFilter !== '');

  const subjWrap = document.getElementById('rosterSubjectWrap');
  if (subjWrap) subjWrap.classList.toggle('has-active-filter', currentSubjectFilter !== '');

  const btnReset = document.getElementById('btnResetRosterFilters');
  const hasActiveFilters = (currentModuleFilter !== '') || (currentSubjectFilter !== '') || (q !== '') || (currentRosterFilter !== 'all');
  if (btnReset) {
    btnReset.style.display = hasActiveFilters ? 'inline-flex' : 'none';
  }

  const all = sch.roster || [];

  // Filter by Module and Subject first
  const baseFiltered = all.filter(t => {
    if (currentModuleFilter && t.m !== currentModuleFilter) return false;
    if (currentSubjectFilter && (t.s || '').toLowerCase() !== currentSubjectFilter.toLowerCase()) return false;
    return true;
  });

  // Update counts on the status pills based on baseFiltered
  updateRosterFilterCounts(baseFiltered);

  // Then filter by search and status pill
  const filtered = baseFiltered.filter(t => {
    if (q) {
      const matchName = t.n && t.n.toLowerCase().includes(q);
      const matchSubj = t.s && t.s.toLowerCase().includes(q);
      const matchMod = t.m && t.m.toLowerCase().includes(q);
      const matchSch = t.schoolName && t.schoolName.toLowerCase().includes(q);
      if (!matchName && !matchSubj && !matchMod && !matchSch) return false;
    }

    if (currentRosterFilter === 'attended') return t.a === 'Yes';
    if (currentRosterFilter === 'certified') return t.crt === 'Dispatched';
    if (currentRosterFilter === 'pending') return t.crt !== 'Dispatched';
    return true;
  });

  renderRosterTable(filtered);
}

function renderRosterTable(roster) {
  const tbody = document.getElementById('rosterTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!roster || roster.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--slate-500);font-weight:600;">No teacher records found matching criteria.</td></tr>';
    return;
  }

  const sch = getActiveSchool();
  const isRegional = selectedKVCode === 'ALL';
  const frag = document.createDocumentFragment();

  // Show up to 500 records at a time for optimal performance
  const maxDisplay = 500;
  const toDisplay = roster.slice(0, maxDisplay);

  toDisplay.forEach(t => {
    const isCert = t.crt === 'Dispatched';
    const isAtt = t.a === 'Yes';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${t.n}</strong>
        ${t.schoolName ? `<div style="font-size:0.72rem;color:var(--slate-500);margin-top:2px;">KV ${t.schoolCode || ''} ${t.schoolName}</div>` : ''}
      </td>
      <td>${t.s}</td>
      <td><strong>${t.m}</strong></td>
      <td>
        <span class="status-dot-wrap">
          <span class="dot ${isAtt ? 'green' : 'amber'}"></span>
          <span style="font-weight:800;color:${isAtt ? 'var(--green-text)' : 'var(--amber-text)'};">${isAtt ? 'Attended' : 'Not Attended'}</span>
        </span>
        ${t.d ? `<div style="font-size:0.74rem;color:var(--slate-500);margin-top:2px;">Attended on: ${t.d}</div>` : ''}
      </td>
      <td>
        ${isCert 
          ? `<button class="badge-cert-btn received" onclick="openCertModal('${t.n.replace(/'/g, "\\'")}', '${t.m}', '${(t.schoolName || (sch ? sch.name : '')).replace(/'/g, "\\'")}')" title="Click to view verified certificate">
               <span class="dot green"></span>
               <span>Certificate Received</span>
             </button>`
          : `<button class="badge-cert-btn not-received" onclick="copyTeacherNotice('${t.n.replace(/'/g, "\\'")}', '${t.e}', '${t.m}')" title="Click to copy official reminder notice">
               <span class="dot amber"></span>
               <span>Not Received</span>
             </button>`
        }
      </td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);

  if (roster.length > maxDisplay) {
    const trMore = document.createElement('tr');
    trMore.innerHTML = `
      <td colspan="5" style="text-align:center;padding:14px;background:var(--slate-50);color:var(--slate-600);font-size:0.85rem;font-weight:700;">
        Showing first ${maxDisplay} of ${roster.length.toLocaleString()} teachers in ${isRegional ? selectedRegion + ' Region' : 'this school'}. Use the search box above to find any teacher by name or subject.
      </td>
    `;
    tbody.appendChild(trMore);
  }
}

// ==================== 8. DCAIS TEACHER TRAINING VIEW (100% TEACHER FOCUSED) ====================

function renderDcaisView(sch) {
  renderDcaisBarChart(sch);
  renderDcaisSchoolModulesTable(sch);
  highlightDcaisSummarySchoolRegion(sch.region);
  initDcaisRoster(sch);
}

// 4 Module Status Cards for the Selected School
function renderDcaisStages(sch) {
  const grid = document.getElementById('dcaisStagesRow');
  if (!grid) return;
  grid.innerHTML = '';

  const dcais = sch.dcais || { m1: 'No', m2: 'Yet to be Planned', m3: 'Yet to be Planned', m4: 'Yet to be Planned' };

  const stages = [
    {
      num: 'Module 1',
      title: 'Orientation & Design Thinking',
      status: dcais.m1,
      desc: 'Creative Pedagogy Foundations'
    },
    {
      num: 'Module 2',
      title: 'Creative Curriculum Integration',
      status: dcais.m2,
      desc: 'Subject Integration & Lesson Workflows'
    },
    {
      num: 'Module 3',
      title: 'Student Project Implementation',
      status: dcais.m3,
      desc: 'Classroom Delivery & Mentoring'
    },
    {
      num: 'Module 4',
      title: 'Gallery Publishing & Showcase',
      status: dcais.m4,
      desc: 'AI Portfolios & State Exhibition'
    }
  ];

  stages.forEach(s => {
    const isAtt = s.status === 'Yes';
    const isPlanned = s.status === 'Yet to be Planned';
    const box = document.createElement('div');
    box.className = `dcais-stage-box ${isAtt ? 'completed' : ''}`;

    let badgeHtml = '';
    if (isAtt) {
      badgeHtml = `<span class="tag-pill green" style="display:inline-flex;align-items:center;gap:4px;font-weight:800;">✓ Attended</span>`;
    } else if (isPlanned) {
      badgeHtml = `<span class="tag-pill" style="background:#F1F5F9;color:#64748B;font-weight:700;">○ Yet to be Planned</span>`;
    } else {
      badgeHtml = `<span class="tag-pill" style="background:#FEF3C7;color:#92400E;font-weight:800;">! Absent</span>`;
    }

    box.innerHTML = `
      <div class="dcais-stage-num">${s.num}</div>
      <div class="dcais-stage-name">${s.title}</div>
      <div style="font-size:0.75rem;color:var(--slate-500);margin-bottom:10px;">${s.desc}</div>
      <div>${badgeHtml}</div>
    `;
    grid.appendChild(box);
  });
}

// DCAIS Bar Chart for Teacher Attendance
function renderDcaisBarChart(sch) {
  const ctx = document.getElementById('chartDcaisBar');
  if (!ctx) return;

  if (dcaisBarChart) dcaisBarChart.destroy();

  // Find regional telemetry from DCAIS_SUMMARY
  const regSum = (KVS_DATA.DCAIS_SUMMARY || []).find(r => r.region.toLowerCase() === sch.region.toLowerCase()) || {
    region: sch.region,
    m1_present: 20, m1_absent: 15,
    m2_present: 16, m2_absent: 20, m2_planned: 0,
    m3_present: 10, m3_absent: 25, m3_planned: 0,
    m4_present: 4, m4_absent: 30, m4_planned: 0
  };

  const presentData = [
    regSum.m1_present,
    regSum.m2_present,
    regSum.m3_present,
    regSum.m4_present
  ];

  const absentData = [
    regSum.m1_absent,
    regSum.m2_absent + (regSum.m2_planned || 0),
    regSum.m3_absent + (regSum.m3_planned || 0),
    regSum.m4_absent + (regSum.m4_planned || 0)
  ];

  const badgeStatus = document.getElementById('badgeDcaisStatus');
  if (badgeStatus) {
    badgeStatus.textContent = `${regSum.region} Region: ${regSum.m1_present} Attended M1`;
  }

  dcaisBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Module 1: Design', 'Module 2: Integration', 'Module 3: Projects', 'Module 4: Showcase'],
      datasets: [
        {
          label: 'Attended (Present)',
          data: presentData,
          backgroundColor: '#059669',
          borderRadius: 6,
          barPercentage: 0.65,
          categoryPercentage: 0.75
        },
        {
          label: 'Absent / Yet to be Planned',
          data: absentData,
          backgroundColor: '#E2E8F0',
          borderRadius: 6,
          barPercentage: 0.65,
          categoryPercentage: 0.75
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold', size: 11, family: "'Inter', sans-serif" }, color: '#334155' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#F1F5F9' },
          ticks: { font: { weight: '600', size: 11, family: "'Inter', sans-serif" }, color: '#64748B' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12, weight: 'bold', family: "'Inter', sans-serif" },
            color: '#1E293B',
            boxWidth: 14
          }
        },
        tooltip: {
          callbacks: {
            title: function(items) {
              return `${items[0].label} (${regSum.region} Region)`;
            },
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y} schools/teachers`;
            }
          }
        }
      }
    }
  });
}

// School DCAIS Module Details Table
function renderDcaisSchoolModulesTable(sch) {
  const tbody = document.getElementById('tableDcaisSchoolModulesBody');
  if (!tbody) return;

  const dcais = sch.dcais || { m1: 'No', m2: 'Yet to be Planned', m3: 'Yet to be Planned', m4: 'Yet to be Planned' };

  const rows = [
    { mod: 'Module 1', name: 'Orientation & Design Thinking', area: 'Creative Pedagogy & Design Principles', val: dcais.m1 },
    { mod: 'Module 2', name: 'Creative Curriculum Integration', area: 'Subject Integration & Digital Lesson Workflows', val: dcais.m2 },
    { mod: 'Module 3', name: 'Student Project Implementation', area: 'Classroom Delivery & Student Mentoring', val: dcais.m3 },
    { mod: 'Module 4', name: 'Gallery Publishing & Showcase', area: 'AI Portfolios & State Showcase', val: dcais.m4 }
  ];

  tbody.innerHTML = rows.map(r => {
    let pill = '';
    if (r.val === 'Yes') {
      pill = `<span class="tag-pill green" style="font-weight:800;">✓ Attended</span>`;
    } else if (r.val === 'Yet to be Planned') {
      pill = `<span class="tag-pill" style="background:#F1F5F9;color:#64748B;font-weight:700;">Yet to be Planned</span>`;
    } else {
      pill = `<span class="tag-pill" style="background:#FEF3C7;color:#92400E;font-weight:800;">Absent</span>`;
    }

    return `
      <tr>
        <td>
          <strong style="color:var(--slate-900);">${r.mod}</strong>
          <div style="font-size:0.75rem;color:var(--slate-500);">${r.name}</div>
        </td>
        <td style="font-size:0.82rem;color:var(--slate-700);font-weight:600;">${r.area}</td>
        <td style="text-align:right;">${pill}</td>
      </tr>
    `;
  }).join('');
}

// DCAIS Regional & National Summary Table (from Semi Annual Report.xlsx)
function renderDcaisSummaryTable(dataList) {
  const tbody = document.getElementById('tableDcaisSummaryBody');
  if (!tbody) return;

  if (dataList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--slate-500);">No regional DCAIS summary data available.</td></tr>';
    return;
  }

  tbody.innerHTML = dataList.map(r => {
    const isTotal = r.region.toLowerCase() === 'total';
    const isSelected = selectedRegion && r.region.toLowerCase() === selectedRegion.toLowerCase();
    const rowClass = isTotal ? 'row-total' : (isSelected ? 'row-highlight-active' : '');
    const displayRegionName = isTotal ? 'Total (All 15 Regions)' : r.region;

    return `
      <tr class="${rowClass}" id="dcaisRow_${r.region.replace(/\s+/g, '_')}">
        <td style="cursor:pointer;" onclick="openRegionDcaisModal('${r.region}')">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <a href="javascript:void(0)" class="dcais-region-link" onclick="event.stopPropagation(); openRegionDcaisModal('${r.region}');" title="Click to view detailed attendance summary of all KV codes in ${r.region}">
              <strong>${displayRegionName}</strong>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:3px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <button class="btn-dcais-drilldown ${isTotal ? 'national' : ''}" onclick="event.stopPropagation(); openRegionDcaisModal('${r.region}');" title="Open detailed attendance of all ${isTotal ? '822' : r.region} KV codes">
              <span>${isTotal ? 'View All 822 KVs' : 'View KVs'}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            ${isSelected ? `<span class="tag-pill blue" style="font-size:0.68rem;padding:2px 7px;">Current Region</span>` : ''}
          </div>
        </td>
        <td>
          <span class="val-present">${r.m1_present}</span>
          <span class="val-sep">/</span>
          <span class="val-absent">${r.m1_absent}</span>
        </td>
        <td>
          <span class="val-present">${r.m2_present}</span>
          <span class="val-sep">/</span>
          <span class="val-absent">${r.m2_absent}</span>
          <span class="val-sep">/</span>
          <span class="val-planned">${r.m2_planned || 0}</span>
        </td>
        <td>
          <span class="val-present">${r.m3_present}</span>
          <span class="val-sep">/</span>
          <span class="val-absent">${r.m3_absent}</span>
          <span class="val-sep">/</span>
          <span class="val-planned">${r.m3_planned || 0}</span>
        </td>
        <td>
          <span class="val-present">${r.m4_present}</span>
          <span class="val-sep">/</span>
          <span class="val-absent">${r.m4_absent}</span>
          <span class="val-sep">/</span>
          <span class="val-planned">${r.m4_planned || 0}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function filterDcaisSummary(query) {
  const q = query.toLowerCase().trim();
  const all = KVS_DATA.DCAIS_SUMMARY || [];
  if (q === '') {
    renderDcaisSummaryTable(all);
    return;
  }
  const filtered = all.filter(r => r.region.toLowerCase().includes(q) || r.region.toLowerCase() === 'total');
  renderDcaisSummaryTable(filtered);
}

function filterDcaisSummaryCurrentRegion() {
  if (!selectedRegion) {
    showToast('Please select a school or region first.');
    return;
  }
  const input = document.getElementById('dcaisSummarySearch');
  if (input) input.value = selectedRegion;
  filterDcaisSummary(selectedRegion);
}

function highlightDcaisSummarySchoolRegion(regionName) {
  renderDcaisSummaryTable(KVS_DATA.DCAIS_SUMMARY || []);
  const rowId = `dcaisRow_${regionName.replace(/\s+/g, '_')}`;
  const targetRow = document.getElementById(rowId);
  if (targetRow) {
    targetRow.classList.add('row-highlight-active');
  }
}

// ==================== DCAIS REGIONAL ATTENDANCE DETAIL MODAL ====================
let currentDcaisModalRegion = 'Agra';
let currentDcaisModalData = [];
let currentDcaisModalFiltered = [];

function openRegionDcaisModal(regionName) {
  if (!regionName || regionName === 'undefined') regionName = selectedRegion || 'Total';
  currentDcaisModalRegion = regionName;

  const modal = document.getElementById('regionDcaisModal');
  if (!modal) return;

  const isTotal = regionName.toLowerCase() === 'total' || regionName.toLowerCase() === 'all';
  
  // Get all DCAIS KV details
  const allList = (typeof KVS_DATA !== 'undefined' && (KVS_DATA.DCAIS_SCHOOLS || KVS_DATA.DCAIS_KV_DETAILS)) || [];

  // Populate region dropdown in modal if not populated or update its selection
  const regSelect = document.getElementById('dcaisModalRegionFilter');
  if (regSelect) {
    const uniqueRegions = Array.from(new Set(allList.map(d => d.region))).filter(Boolean).sort();
    regSelect.innerHTML = `<option value="Total">All 15 Regions (${allList.length} KVs)</option>` +
      uniqueRegions.map(reg => {
        const count = allList.filter(d => d.region.toLowerCase() === reg.toLowerCase()).length;
        return `<option value="${reg}">${reg} (${count} KVs)</option>`;
      }).join('');
    
    if (isTotal) {
      regSelect.value = 'Total';
    } else {
      const match = uniqueRegions.find(r => r.toLowerCase() === regionName.toLowerCase() || 
        (regionName.toLowerCase() === 'bengaluru' && r.toLowerCase() === 'bangalore') ||
        (regionName.toLowerCase() === 'bangalore' && r.toLowerCase() === 'bengaluru'));
      regSelect.value = match || regionName;
    }
  }

  // Update Header Title & Subtitle
  const badge = document.getElementById('dcaisModalBadge');
  const title = document.getElementById('dcaisModalTitle');

  const displayRegion = isTotal ? 'National Total (All 15 Regions)' : `${regionName} Region`;
  if (badge) badge.textContent = displayRegion;
  if (title) title.textContent = `DCAIS Attendance Summary — ${displayRegion}`;

  // Filter records
  if (isTotal) {
    currentDcaisModalData = allList.slice();
  } else {
    currentDcaisModalData = allList.filter(d => {
      const dr = d.region.toLowerCase();
      const tr = regionName.toLowerCase();
      return dr === tr || (tr === 'bengaluru' && dr === 'bangalore') || (tr === 'bangalore' && dr === 'bengaluru');
    });

    // Fallback if region not in 15 cohorts
    if (currentDcaisModalData.length === 0 && KVS_DATA.SCHOOLS) {
      const schs = Object.values(KVS_DATA.SCHOOLS).filter(s => s.region.toLowerCase() === regionName.toLowerCase());
      currentDcaisModalData = schs.map(s => ({
        code: s.code,
        name: s.name,
        region: s.region,
        m1: (s.dcais && s.dcais.m1) || 'Yet to be Planned',
        m2: (s.dcais && s.dcais.m2) || 'Yet to be Planned',
        m3: (s.dcais && s.dcais.m3) || 'Yet to be Planned',
        m4: (s.dcais && s.dcais.m4) || 'Yet to be Planned'
      }));
    }
  }

  // Also sync the in-page roster filter dropdown to this region if applicable
  const pageRosterRegSelect = document.getElementById('dcaisRosterRegionFilter');
  if (pageRosterRegSelect) {
    if (isTotal) {
      pageRosterRegSelect.value = 'ALL';
    } else {
      const foundOpt = Array.from(pageRosterRegSelect.options).find(o => o.value.toLowerCase() === regionName.toLowerCase());
      if (foundOpt) pageRosterRegSelect.value = foundOpt.value;
    }
  }

  // Reset search and filter inputs
  const searchInput = document.getElementById('dcaisModalSearchInput');
  if (searchInput) searchInput.value = '';
  const statusFilter = document.getElementById('dcaisModalStatusFilter');
  if (statusFilter) statusFilter.value = 'ALL';

  // Calculate and populate KPI strip
  updateDcaisModalKpis(currentDcaisModalData, isTotal, regionName);

  // Render Table
  filterAndRenderDcaisModalTable();

  // Show Modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeRegionDcaisModal() {
  const modal = document.getElementById('regionDcaisModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function updateDcaisModalKpis(dataList, isTotal, regionName) {
  const totalKVs = dataList.length;
  const m1Present = dataList.filter(d => d.m1 === 'Yes').length;
  const m1Absent = dataList.filter(d => d.m1 === 'No').length;
  const m2Present = dataList.filter(d => d.m2 === 'Yes').length;
  const m2Absent = dataList.filter(d => d.m2 === 'No').length;
  const m2Planned = dataList.filter(d => d.m2 === 'Yet to be Planned').length;
  const m3Present = dataList.filter(d => d.m3 === 'Yes').length;
  const m3Absent = dataList.filter(d => d.m3 === 'No').length;
  const m3Planned = dataList.filter(d => d.m3 === 'Yet to be Planned').length;
  const m4Present = dataList.filter(d => d.m4 === 'Yes').length;
  const m4Absent = dataList.filter(d => d.m4 === 'No').length;
  const m4Planned = dataList.filter(d => d.m4 === 'Yet to be Planned').length;

  const kpiTotal = document.getElementById('kpiModalTotalKVs');
  const kpiM1 = document.getElementById('kpiModalM1');
  const kpiM2 = document.getElementById('kpiModalM2');
  const kpiM3 = document.getElementById('kpiModalM3');
  const kpiM4 = document.getElementById('kpiModalM4');

  if (kpiTotal) kpiTotal.textContent = `${totalKVs.toLocaleString()} KVs`;
  if (kpiM1) kpiM1.innerHTML = `${m1Present} <span class="sub">/ ${m1Absent} absent</span>`;
  if (kpiM2) kpiM2.innerHTML = `${m2Present} <span class="sub">/ ${m2Absent} absent</span>`;
  if (kpiM3) kpiM3.innerHTML = `${m3Present} <span class="sub">/ ${m3Absent} absent</span>`;
  if (kpiM4) kpiM4.innerHTML = `${m4Present} <span class="sub">/ ${m4Planned} planned</span>`;

  const subtitle = document.getElementById('dcaisModalSubtitle');
  if (subtitle) {
    const pct = totalKVs ? Math.round(m1Present * 100 / totalKVs) : 0;
    subtitle.textContent = `${totalKVs} Kendriya Vidyalayas • ${m1Present} M1 Attended (${pct}%) • Official Telemetry from Semi Annual Report.xlsx`;
  }
}

function onDcaisModalSearch(val) {
  filterAndRenderDcaisModalTable();
}

function onDcaisModalFilterChange() {
  filterAndRenderDcaisModalTable();
}

function onDcaisModalRegionSelect(region) {
  openRegionDcaisModal(region);
}

function filterAndRenderDcaisModalTable() {
  const searchInput = document.getElementById('dcaisModalSearchInput');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const statusFilter = document.getElementById('dcaisModalStatusFilter');
  const sf = statusFilter ? statusFilter.value : 'ALL';

  let list = currentDcaisModalData.slice();

  // Apply Search
  if (q) {
    list = list.filter(d => 
      String(d.code).includes(q) || 
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.region && d.region.toLowerCase().includes(q))
    );
  }

  // Apply Status Filter
  if (sf === 'M1_YES') list = list.filter(d => d.m1 === 'Yes');
  else if (sf === 'M1_NO') list = list.filter(d => d.m1 === 'No');
  else if (sf === 'M2_YES') list = list.filter(d => d.m2 === 'Yes');
  else if (sf === 'M2_NO') list = list.filter(d => d.m2 === 'No');
  else if (sf === 'M2_PLAN') list = list.filter(d => d.m2 === 'Yet to be Planned');
  else if (sf === 'M3_YES') list = list.filter(d => d.m3 === 'Yes');
  else if (sf === 'M4_YES') list = list.filter(d => d.m4 === 'Yes');
  else if (sf === 'M4_PLAN') list = list.filter(d => d.m4 === 'Yet to be Planned');

  currentDcaisModalFiltered = list;
  renderDcaisModalTableRows(list);

  const counter = document.getElementById('dcaisModalCounter');
  if (counter) {
    counter.textContent = `Showing ${list.length} of ${currentDcaisModalData.length} Kendriya Vidyalayas`;
  }
}

function renderDcaisModalTableRows(list) {
  const tbody = document.getElementById('dcaisModalTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--slate-500);font-weight:600;">No Kendriya Vidyalayas match the search/filter criteria.</td></tr>`;
    return;
  }

  function pill(val) {
    if (val === 'Yes') {
      return `<span class="status-pill present"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Attended</span>`;
    } else if (val === 'No') {
      return `<span class="status-pill absent"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Absent</span>`;
    } else {
      return `<span class="status-pill planned">⏳ Planned</span>`;
    }
  }

  function getOverallStage(d) {
    if (d.m4 === 'Yes') return '<span class="tag-pill green">M4 Completed</span>';
    if (d.m3 === 'Yes') return '<span class="tag-pill blue">M3 Completed</span>';
    if (d.m2 === 'Yes') return '<span class="tag-pill blue">M2 Completed</span>';
    if (d.m1 === 'Yes') return '<span class="tag-pill" style="background:#EFF6FF;color:#1D4ED8;">M1 Attended</span>';
    return '<span class="tag-pill" style="background:#F1F5F9;color:#64748B;">Initiating</span>';
  }

  tbody.innerHTML = list.map(d => {
    return `
      <tr>
        <td><span class="kv-code-badge">${d.code}</span></td>
        <td><strong>${d.name}</strong></td>
        <td><span style="font-size:0.78rem;font-weight:700;color:var(--slate-700);">${d.region}</span></td>
        <td style="text-align:center;">${pill(d.m1)}</td>
        <td style="text-align:center;">${pill(d.m2)}</td>
        <td style="text-align:center;">${pill(d.m3)}</td>
        <td style="text-align:center;">${pill(d.m4)}</td>
        <td>${getOverallStage(d)}</td>
        <td style="text-align:center;">
          <button class="btn-select-school-modal" onclick="selectSchoolFromDcaisModal(${d.code})" title="Select KV ${d.code} in main dashboard">
            Select School
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function selectSchoolFromDcaisModal(kvCode) {
  closeRegionDcaisModal();
  setSchool(Number(kvCode));
  const schSelect = document.getElementById('schoolSelect');
  if (schSelect) {
    schSelect.disabled = false;
    schSelect.value = String(kvCode);
  }
  const regSelect = document.getElementById('regionSelect');
  if (regSelect && selectedRegion) {
    regSelect.value = selectedRegion;
  }
  const homeCard = document.getElementById('homeProgramsCard');
  if (homeCard) {
    homeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function copyRegionDcaisShareLink() {
  const reg = currentDcaisModalRegion || 'Total';
  const url = `${window.location.origin}${window.location.pathname}?dcaisRegion=${encodeURIComponent(reg)}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast(`Copied shareable link: ${url}`);
    }).catch(() => {
      prompt('Copy shareable link for today\'s discussion:', url);
    });
  } else {
    prompt('Copy shareable link for today\'s discussion:', url);
  }
}

function exportRegionDcaisCsv() {
  const list = currentDcaisModalFiltered || currentDcaisModalData || [];
  if (list.length === 0) {
    showToast('No records to export');
    return;
  }

  const regName = (currentDcaisModalRegion || 'National_Total').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `KVS_DCAIS_Attendance_Summary_${regName}.csv`;

  const headers = ['KV Code', 'Kendriya Vidyalaya Name', 'Region', 'Module 1 (Orientation)', 'Module 2 (Curriculum)', 'Module 3 (Projects)', 'Module 4 (Showcase)', 'Overall Status'];
  
  const rows = list.map(d => [
    d.code,
    `"${(d.name || '').replace(/"/g, '""')}"`,
    `"${(d.region || '').replace(/"/g, '""')}"`,
    d.m1 === 'Yes' ? 'Attended' : (d.m1 === 'No' ? 'Absent' : d.m1),
    d.m2 === 'Yes' ? 'Attended' : (d.m2 === 'No' ? 'Absent' : d.m2),
    d.m3 === 'Yes' ? 'Attended' : (d.m3 === 'No' ? 'Absent' : d.m3),
    d.m4 === 'Yes' ? 'Attended' : (d.m4 === 'No' ? 'Absent' : d.m4),
    d.m4 === 'Yes' ? 'M4 Completed' : (d.m3 === 'Yes' ? 'M3 Completed' : (d.m2 === 'Yes' ? 'M2 Completed' : (d.m1 === 'Yes' ? 'M1 Attended' : 'Initiating')))
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${list.length} KV records to ${filename}`);
}

function printRegionDcaisReport() {
  const list = currentDcaisModalFiltered || currentDcaisModalData || [];
  const reg = currentDcaisModalRegion || 'National Total';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const rowsHtml = list.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${d.code}</strong></td>
      <td>${d.name}</td>
      <td>${d.region}</td>
      <td style="text-align:center;font-weight:bold;color:${d.m1 === 'Yes' ? '#059669' : '#DC2626'};">${d.m1 === 'Yes' ? 'Attended' : 'Absent'}</td>
      <td style="text-align:center;font-weight:bold;color:${d.m2 === 'Yes' ? '#059669' : (d.m2 === 'No' ? '#DC2626' : '#64748B')};">${d.m2 === 'Yes' ? 'Attended' : d.m2}</td>
      <td style="text-align:center;font-weight:bold;color:${d.m3 === 'Yes' ? '#059669' : (d.m3 === 'No' ? '#DC2626' : '#64748B')};">${d.m3 === 'Yes' ? 'Attended' : d.m3}</td>
      <td style="text-align:center;font-weight:bold;color:${d.m4 === 'Yes' ? '#059669' : (d.m4 === 'No' ? '#DC2626' : '#64748B')};">${d.m4 === 'Yes' ? 'Attended' : d.m4}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>DCAIS Detailed Attendance Summary - ${reg}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #0F172A; }
        h1 { font-size: 1.4rem; margin: 0 0 4px 0; color: #0F172A; }
        p { margin: 0 0 16px 0; color: #475569; font-size: 0.85rem; }
        table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 12px; }
        th { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; font-size: 0.75rem; }
        td { border: 1px solid #E2E8F0; padding: 6px 10px; }
        tr:nth-child(even) { background: #F8FAFC; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Kendriya Vidyalaya Sangathan — DCAIS Attendance Summary</h1>
      <p>Region: <strong>${reg}</strong> • Total Records: <strong>${list.length}</strong> • Source: Semi Annual Report.xlsx</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>KV Code</th>
            <th>School Name</th>
            <th>Region</th>
            <th style="text-align:center;">Module 1</th>
            <th style="text-align:center;">Module 2</th>
            <th style="text-align:center;">Module 3</th>
            <th style="text-align:center;">Module 4</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function jumpToDcaisRosterTable() {
  closeRegionDcaisModal();
  const box = document.getElementById('dcaisRosterBox');
  if (box) {
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    box.style.outline = '3px solid #2563EB';
    setTimeout(() => { box.style.outline = ''; }, 2000);
  }
}

// ==================== DCAIS KV CODE PARTICIPATION ROSTER ====================

let currentDcaisRosterFilter = 'all'; // 'all' | 'attended' | 'not_attended' | 'planned'
let currentDcaisModuleFilter = 'm1';  // 'm1' | 'm2' | 'm3' | 'm4' | 'all'
let currentDcaisRegionFilter = 'CURRENT'; // 'CURRENT' | 'ALL' | region name

function initDcaisRoster(sch) {
  const regSelect = document.getElementById('dcaisRosterRegionFilter');
  if (regSelect && regSelect.options.length <= 2) {
    const summary = KVS_DATA.DCAIS_SUMMARY || [];
    summary.forEach(r => {
      if (r.region && r.region.toLowerCase() !== 'total') {
        const opt = document.createElement('option');
        opt.value = r.region;
        opt.textContent = `${r.region} Region`;
        regSelect.appendChild(opt);
      }
    });
  }

  if (regSelect) {
    regSelect.value = 'CURRENT';
    const currentOpt = regSelect.querySelector('option[value="CURRENT"]');
    if (currentOpt) {
      currentOpt.textContent = `Current Region (${sch.region})`;
    }
  }

  const searchInput = document.getElementById('dcaisRosterSearch');
  if (searchInput) {
    if (selectedKVCode !== 'ALL' && sch.code) {
      searchInput.value = String(sch.code);
    } else {
      searchInput.value = '';
    }
  }

  filterDcaisRoster();
}

function setDcaisRosterFilter(filterType, btn) {
  currentDcaisRosterFilter = filterType;

  document.querySelectorAll('#dcaisRosterFilterPills .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  filterDcaisRoster();
}

function resetDcaisRosterFilters() {
  currentDcaisRosterFilter = 'all';
  currentDcaisModuleFilter = 'm1';
  currentDcaisRegionFilter = 'CURRENT';

  const regSelect = document.getElementById('dcaisRosterRegionFilter');
  if (regSelect) regSelect.value = 'CURRENT';

  const modSelect = document.getElementById('dcaisRosterModuleFilter');
  if (modSelect) modSelect.value = 'm1';

  const searchInput = document.getElementById('dcaisRosterSearch');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('#dcaisRosterFilterPills .filter-pill').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
  });

  filterDcaisRoster();
}

function filterDcaisRoster(textQuery) {
  const sch = getActiveSchool();
  const currentRegion = sch ? sch.region : (selectedRegion || 'Agra');

  const searchInput = document.getElementById('dcaisRosterSearch');
  const q = (typeof textQuery === 'string' ? textQuery : (searchInput ? searchInput.value : '')).toLowerCase().trim();

  const modSelect = document.getElementById('dcaisRosterModuleFilter');
  currentDcaisModuleFilter = modSelect ? modSelect.value : 'm1';

  const regSelect = document.getElementById('dcaisRosterRegionFilter');
  const selectedRegVal = regSelect ? regSelect.value : 'CURRENT';
  currentDcaisRegionFilter = selectedRegVal;

  const btnReset = document.getElementById('btnResetDcaisFilters');
  const hasActiveFilters = (selectedRegVal !== 'CURRENT') || (currentDcaisModuleFilter !== 'm1') || (q !== '') || (currentDcaisRosterFilter !== 'all');
  if (btnReset) {
    btnReset.style.display = hasActiveFilters ? 'inline-flex' : 'none';
  }

  const allDcais = KVS_DATA.DCAIS_SCHOOLS || [];

  let baseFiltered = allDcais.filter(item => {
    if (selectedRegVal === 'CURRENT') {
      return item.region.toLowerCase() === currentRegion.toLowerCase();
    } else if (selectedRegVal === 'ALL') {
      return true;
    } else {
      return item.region.toLowerCase() === selectedRegVal.toLowerCase();
    }
  });

  const targetMod = currentDcaisModuleFilter === 'all' ? 'm1' : currentDcaisModuleFilter;
  let countAtt = 0;
  let countNotAtt = 0;
  let countPlan = 0;

  baseFiltered.forEach(item => {
    const st = item[targetMod];
    if (st === 'Yes') countAtt++;
    else if (st === 'Yet to be Planned') countPlan++;
    else countNotAtt++;
  });

  const elAll = document.getElementById('countDcaisAll');
  const elAtt = document.getElementById('countDcaisAttended');
  const elNotAtt = document.getElementById('countDcaisNotAttended');
  const elPlan = document.getElementById('countDcaisPlanned');

  if (elAll) elAll.textContent = baseFiltered.length.toLocaleString();
  if (elAtt) elAtt.textContent = countAtt.toLocaleString();
  if (elNotAtt) elNotAtt.textContent = countNotAtt.toLocaleString();
  if (elPlan) elPlan.textContent = countPlan.toLocaleString();

  if (q) {
    baseFiltered = baseFiltered.filter(item => {
      const matchCode = String(item.code).toLowerCase().includes(q);
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchReg = (item.region || '').toLowerCase().includes(q);
      return matchCode || matchName || matchReg;
    });
  }

  const finalFiltered = baseFiltered.filter(item => {
    const st = item[targetMod];
    if (currentDcaisRosterFilter === 'attended') return st === 'Yes';
    if (currentDcaisRosterFilter === 'not_attended') return st === 'No';
    if (currentDcaisRosterFilter === 'planned') return st === 'Yet to be Planned';
    return true;
  });

  renderDcaisRosterTable(finalFiltered);
}

function renderDcaisRosterTable(schoolsList) {
  const tbody = document.getElementById('tableDcaisRosterBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!schoolsList || schoolsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--slate-500);font-weight:600;">No KV school records found matching criteria.</td></tr>';
    return;
  }

  const sch = getActiveSchool();
  const activeCode = sch ? sch.code : null;
  const frag = document.createDocumentFragment();

  schoolsList.forEach((item, idx) => {
    const isSelected = activeCode && (String(item.code) === String(activeCode));
    const tr = document.createElement('tr');
    if (isSelected) tr.className = 'row-highlight-active';

    function getPill(val) {
      if (val === 'Yes') {
        return `<span class="tag-pill green" style="display:inline-flex;align-items:center;gap:3px;font-weight:800;font-size:0.75rem;padding:3px 8px;"><span style="font-size:0.82rem;">✓</span> Attended</span>`;
      } else if (val === 'Yet to be Planned') {
        return `<span class="tag-pill" style="background:#F1F5F9;color:#64748B;font-weight:700;font-size:0.75rem;padding:3px 8px;">○ Planned</span>`;
      } else {
        return `<span class="tag-pill" style="display:inline-flex;align-items:center;gap:3px;background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;font-weight:800;font-size:0.75rem;padding:3px 8px;"><span style="font-size:0.82rem;">✗</span> Not Attended</span>`;
      }
    }

    let overall = '';
    if (item.m4 === 'Yes') {
      overall = `<span class="tag-pill purple" style="font-weight:800;font-size:0.74rem;">M4 Showcase</span>`;
    } else if (item.m3 === 'Yes') {
      overall = `<span class="tag-pill blue" style="font-weight:800;font-size:0.74rem;">M3 Projects</span>`;
    } else if (item.m2 === 'Yes') {
      overall = `<span class="tag-pill green" style="font-weight:800;font-size:0.74rem;">M2 Curriculum</span>`;
    } else if (item.m1 === 'Yes') {
      overall = `<span class="tag-pill green" style="font-weight:800;font-size:0.74rem;">M1 Attended</span>`;
    } else {
      overall = `<span class="tag-pill" style="background:#FEF3C7;color:#92400E;border-color:#FDE68A;font-weight:800;font-size:0.74rem;">Not Started</span>`;
    }

    tr.innerHTML = `
      <td style="text-align:center;color:var(--slate-400);font-weight:700;font-size:0.82rem;">${idx + 1}</td>
      <td>
        <span class="combobox-kv-pill" style="font-size:0.82rem;padding:3px 9px;cursor:pointer;" onclick="selectSchoolFromDcais('${item.code}')" title="Click to view details for KV ${item.code}">
          KV ${item.code}
        </span>
      </td>
      <td>
        <strong style="color:var(--slate-900);font-size:0.88rem;cursor:pointer;" onclick="selectSchoolFromDcais('${item.code}')" title="Click to view details for ${item.name}">
          ${item.name}
        </strong>
      </td>
      <td style="font-size:0.82rem;color:var(--slate-700);font-weight:600;">${item.region}</td>
      <td style="text-align:center;">${getPill(item.m1)}</td>
      <td style="text-align:center;">${getPill(item.m2)}</td>
      <td style="text-align:center;">${getPill(item.m3)}</td>
      <td style="text-align:center;">${getPill(item.m4)}</td>
      <td style="text-align:center;">${overall}</td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function selectSchoolFromDcais(kvCode) {
  setSchool(kvCode);
  navigateTo('dcais');
}

function exportDcaisRosterCsv() {
  const sch = getActiveSchool();
  const currentRegion = sch ? sch.region : (selectedRegion || 'Agra');
  const regSelect = document.getElementById('dcaisRosterRegionFilter');
  const selectedRegVal = regSelect ? regSelect.value : 'CURRENT';

  const allDcais = KVS_DATA.DCAIS_SCHOOLS || [];
  let records = allDcais.filter(item => {
    if (selectedRegVal === 'CURRENT') {
      return item.region.toLowerCase() === currentRegion.toLowerCase();
    } else if (selectedRegVal === 'ALL') {
      return true;
    } else {
      return item.region.toLowerCase() === selectedRegVal.toLowerCase();
    }
  });

  if (records.length === 0) {
    showToast('No DCAIS records available to export.');
    return;
  }

  const headers = ['KV Code', 'School Name', 'Region', 'Module 1 Status', 'Module 2 Status', 'Module 3 Status', 'Module 4 Status', 'Overall Maturity'];
  const rows = records.map(r => {
    let overall = 'Not Started';
    if (r.m4 === 'Yes') overall = 'M4 Showcase';
    else if (r.m3 === 'Yes') overall = 'M3 Projects';
    else if (r.m2 === 'Yes') overall = 'M2 Curriculum';
    else if (r.m1 === 'Yes') overall = 'M1 Attended';

    return [
      `"${r.code}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.region}"`,
      `"${r.m1 === 'Yes' ? 'Attended' : 'Not Attended'}"`,
      `"${r.m2}"`,
      `"${r.m3}"`,
      `"${r.m4}"`,
      `"${overall}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const regName = selectedRegVal === 'ALL' ? 'All_Regions_National' : (selectedRegVal === 'CURRENT' ? currentRegion : selectedRegVal);
  link.setAttribute('download', `KVS_DCAIS_KV_Codes_Attendance_${regName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${records.length} KV Codes to CSV!`);
}

// ==================== 9. EASY ENGLISH PRINTABLE REPORTS (PDF) ====================

function printSchoolReport(type) {
  const sch = getActiveSchool();
  if (!sch) {
    showToast('Please select a school or region first.');
    return;
  }
  const printWin = window.open('', '_blank', 'width=950,height=750');
  if (!printWin) {
    showToast('Please allow popup windows to print the report.');
    return;
  }

  const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const refId = `KVS-ADOBE-${type.toUpperCase()}-${sch.code}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (type === 'cpd') {
    const rosterRows = (sch.roster || []).map((t, idx) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;text-align:center;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:bold;">${t.n}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;">${t.s}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:600;">${t.m}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:bold;color:${t.a === 'Yes' ? '#059669' : '#D97706'};">
          ${t.a === 'Yes' ? 'Attended' : 'Not Attended'} ${t.d ? '(' + t.d + ')' : ''}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPD Teacher Training Report — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 14px; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #FA0F00; padding-bottom: 12px; margin-bottom: 14px; }
            .logo-title h1 { font-size: 19px; margin: 0 0 2px; color: #0F172A; font-family: Georgia, serif; }
            .logo-title p { font-size: 11px; color: #64748B; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
            .dossier-tag { background: #FA0F00; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; text-align: right; }
            .meta-strip { display: flex; justify-content: space-between; align-items: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
            .s-tile { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; text-align: center; background: #FFFFFF; }
            .s-val { font-size: 18px; font-weight: 900; color: #0F172A; }
            .s-lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background: #F1F5F9; padding: 7px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .sign-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 18px; border-top: 1px dashed #CBD5E1; }
            .sign-col { text-align: center; width: 180px; font-size: 11px; font-weight: bold; border-top: 1px solid #0F172A; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="logo-title">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express</h1>
              <p>Continuous Professional Development (CPD) • Teacher Training Report</p>
            </div>
            <div class="dossier-tag">
              KV ${sch.code}<br>
              <span style="font-size:9px;opacity:0.85;">Official Report</span>
            </div>
          </div>

          <div class="meta-strip">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F172A;">${sch.name}</div>
              <div style="color:#64748B;margin-top:2px;">
                <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
                
                <strong>Reference:</strong> ${refId}
              </div>
            </div>
            <div style="text-align:right;color:#64748B;">
              <strong>Date:</strong> ${now}<br>
              <strong>Portal:</strong> kvsangathan.nic.in
            </div>
          </div>

          <div class="summary-cards">
            <div class="s-tile">
              <div class="s-val" style="color:#059669;">${sch.attendedCount}</div>
              <div class="s-lbl">Teachers Attended</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#2563EB;">${sch.certifiedCount}</div>
              <div class="s-lbl">CPD Certified</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#D97706;">${sch.attendedCount > 0 ? Math.round((sch.certifiedCount / sch.attendedCount) * 100) : 0}%</div>
              <div class="s-lbl">Certification Rate</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;margin-bottom:4px;">
            Teacher Attendance List
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:25px;text-align:center;">#</th>
                <th>Teacher Name</th>
                <th>Subject</th>
                <th>Module</th>
                <th>CPD Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows || '<tr><td colspan="5" style="text-align:center;padding:14px;">No teacher records registered.</td></tr>'}
            </tbody>
          </table>

          <div class="sign-area">
            <div class="sign-col">Principal Signature &amp; Stamp</div>
            <div class="sign-col">Regional Officer Verification</div>
          </div>
        </body>
      </html>
    `);
  } else {
    // DCAIS Teacher Training Report
    const dcais = sch.dcais || { m1: 'No', m2: 'Yet to be Planned', m3: 'Yet to be Planned', m4: 'Yet to be Planned' };
    const regSum = (KVS_DATA.DCAIS_SUMMARY || []).find(r => r.region.toLowerCase() === sch.region.toLowerCase()) || {};

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DCAIS Teacher Training Report — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 14px; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1E1B4B; padding-bottom: 12px; margin-bottom: 14px; }
            .logo-title h1 { font-size: 19px; margin: 0 0 2px; color: #0F172A; font-family: Georgia, serif; }
            .logo-title p { font-size: 11px; color: #64748B; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
            .dossier-tag { background: #1E1B4B; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; text-align: right; }
            .meta-strip { display: flex; justify-content: space-between; align-items: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
            .s-tile { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; text-align: center; background: #FFFFFF; }
            .s-val { font-size: 18px; font-weight: 900; color: #0F172A; }
            .s-lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th { text-align: left; background: #F1F5F9; padding: 7px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            td { padding: 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; }
            .sign-area { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 18px; border-top: 1px dashed #CBD5E1; }
            .sign-col { text-align: center; width: 180px; font-size: 11px; font-weight: bold; border-top: 1px solid #0F172A; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="logo-title">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express</h1>
              <p>Digital Creativity &amp; AI Skills (DCAIS) • Teacher Training Report</p>
            </div>
            <div class="dossier-tag">
              KV ${sch.code}<br>
              <span style="font-size:9px;opacity:0.85;">Official Report</span>
            </div>
          </div>

          <div class="meta-strip">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F172A;">${sch.name}</div>
              <div style="color:#64748B;margin-top:2px;">
                <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
                <strong>Reference:</strong> ${refId}
              </div>
            </div>
            <div style="text-align:right;color:#64748B;">
              <strong>Date:</strong> ${now}<br>
              <strong>Teacher Development:</strong> Continuous Professional Training
            </div>
          </div>

          <div class="summary-cards">
            <div class="s-tile">
              <div class="s-val" style="color:#2563EB;">${dcais.m1 === 'Yes' ? 'Attended M1' : 'Initiating'}</div>
              <div class="s-lbl">Module 1 Status</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#059669;">${regSum.m1_present || 0}</div>
              <div class="s-lbl">Region Teachers Attended</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#D97706;">${sch.region}</div>
              <div class="s-lbl">KVS Region</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;margin-bottom:6px;">
            ${sch.code === 'ALL' ? `Regional KV Codes DCAIS Attendance Roster (${sch.region} Region)` : 'School DCAIS Teacher Module Status'}
          </div>

          ${sch.code === 'ALL' ? `
          <table>
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th style="width:70px;">KV Code</th>
                <th>School Name</th>
                <th style="text-align:center;">Module 1</th>
                <th style="text-align:center;">Module 2</th>
                <th style="text-align:center;">Module 3</th>
                <th style="text-align:center;">Module 4</th>
              </tr>
            </thead>
            <tbody>
              ${(KVS_DATA.DCAIS_SCHOOLS || []).filter(item => item.region.toLowerCase() === sch.region.toLowerCase()).map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.code}</strong></td>
                  <td>${item.name}</td>
                  <td style="text-align:center;font-weight:bold;color:${item.m1 === 'Yes' ? '#059669' : '#D97706'};">${item.m1 === 'Yes' ? 'Attended' : 'Not Attended'}</td>
                  <td style="text-align:center;font-weight:bold;color:${item.m2 === 'Yes' ? '#059669' : '#64748B'};">${item.m2 === 'Yes' ? 'Attended' : item.m2}</td>
                  <td style="text-align:center;font-weight:bold;color:${item.m3 === 'Yes' ? '#059669' : '#64748B'};">${item.m3 === 'Yes' ? 'Attended' : item.m3}</td>
                  <td style="text-align:center;font-weight:bold;color:${item.m4 === 'Yes' ? '#059669' : '#64748B'};">${item.m4 === 'Yes' ? 'Attended' : item.m4}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : `
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Focus Area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Module 1: Orientation &amp; Design Thinking</strong></td>
                <td>Creative Pedagogy Foundations</td>
                <td style="font-weight:bold;color:${dcais.m1 === 'Yes' ? '#059669' : '#D97706'};">${dcais.m1 === 'Yes' ? 'Attended' : 'Not Attended'}</td>
              </tr>
              <tr>
                <td><strong>Module 2: Creative Curriculum Integration</strong></td>
                <td>Subject Integration &amp; Digital Workflows</td>
                <td style="font-weight:bold;color:${dcais.m2 === 'Yes' ? '#059669' : '#64748B'};">${dcais.m2 === 'Yes' ? 'Attended' : dcais.m2}</td>
              </tr>
              <tr>
                <td><strong>Module 3: Student Project Implementation</strong></td>
                <td>Classroom Delivery &amp; Mentoring</td>
                <td style="font-weight:bold;color:${dcais.m3 === 'Yes' ? '#059669' : '#64748B'};">${dcais.m3 === 'Yes' ? 'Attended' : dcais.m3}</td>
              </tr>
              <tr>
                <td><strong>Module 4: Gallery Publishing &amp; Showcase</strong></td>
                <td>AI Portfolios &amp; Public Exhibition</td>
                <td style="font-weight:bold;color:${dcais.m4 === 'Yes' ? '#059669' : '#64748B'};">${dcais.m4 === 'Yes' ? 'Attended' : dcais.m4}</td>
              </tr>
            </tbody>
          </table>
          `}

          <div class="sign-area">
            <div class="sign-col">Principal Signature &amp; Stamp</div>
            <div class="sign-col">Regional Officer Verification</div>
          </div>
        </body>
      </html>
    `);
  }

  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 450);

  showToast(`Report prepared for KV ${sch.code}! Use Save as PDF.`);
}

// ==================== 10. EASY ENGLISH EXPORT (CSV) ====================

function exportSchoolCsv(type) {
  const sch = getActiveSchool();
  if (!sch) {
    showToast('Please select a school or region first.');
    return;
  }
  let csvContent = '';
  let filename = '';

  if (type === 'cpd') {
    filename = `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_CPD_Attendance.csv`;
    const rows = [
      ['KV Code', 'School Name', 'Region', 'Teacher Name', 'Subject', 'Module', 'Attendance Status', 'Attendance Date']
    ];
    (sch.roster || []).forEach(t => {
      rows.push([
        sch.code,
        sch.name,
        sch.region,
        t.n,
        t.s,
        t.m,
        t.a === 'Yes' ? 'Attended' : 'Not Attended',
        t.d || ''
      ]);
    });
    csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  } else {
    const isRegional = sch.code === 'ALL';
    filename = isRegional 
      ? `All_Schools_in_${sch.region}_Region_DCAIS_Teacher_Training.csv`
      : `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_DCAIS_Teacher_Training.csv`;
    
    let rows = [];
    if (isRegional) {
      rows.push(['KV Code', 'School Name', 'Region', 'Module 1 (Orientation)', 'Module 2 (Curriculum)', 'Module 3 (Projects)', 'Module 4 (Showcase)', 'Overall Status']);
      const regSchools = (KVS_DATA.DCAIS_SCHOOLS || []).filter(item => item.region.toLowerCase() === sch.region.toLowerCase());
      regSchools.forEach(r => {
        let overall = 'Not Started';
        if (r.m4 === 'Yes') overall = 'M4 Showcase';
        else if (r.m3 === 'Yes') overall = 'M3 Projects';
        else if (r.m2 === 'Yes') overall = 'M2 Curriculum';
        else if (r.m1 === 'Yes') overall = 'M1 Attended';
        
        rows.push([
          r.code,
          r.name,
          r.region,
          r.m1 === 'Yes' ? 'Attended' : 'Not Attended',
          r.m2,
          r.m3,
          r.m4,
          overall
        ]);
      });
    } else {
      const dcais = sch.dcais || { m1: 'No', m2: 'Yet to be Planned', m3: 'Yet to be Planned', m4: 'Yet to be Planned' };
      rows = [
        ['KV Code', 'School Name', 'Region', 'Module', 'Focus Area', 'Attendance Status'],
        [sch.code, sch.name, sch.region, 'Module 1', 'Orientation & Design Thinking', dcais.m1 === 'Yes' ? 'Attended' : 'Not Attended'],
        [sch.code, sch.name, sch.region, 'Module 2', 'Creative Curriculum Integration', dcais.m2 === 'Yes' ? 'Attended' : dcais.m2],
        [sch.code, sch.name, sch.region, 'Module 3', 'Student Project Implementation', dcais.m3 === 'Yes' ? 'Attended' : dcais.m3],
        [sch.code, sch.name, sch.region, 'Module 4', 'Gallery Publishing & Showcase', dcais.m4 === 'Yes' ? 'Attended' : dcais.m4]
      ];
    }
    csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloaded ${filename}!`);
}

// ==================== 11. CERTIFICATE MODAL & NOTICES ====================

function openCertModal(name, mod, school) {
  const tName = document.getElementById('modalTeacherName');
  const mName = document.getElementById('modalModuleName');
  const sName = document.getElementById('modalSchoolName');
  if (tName) tName.textContent = name;
  if (mName) mName.textContent = mod;
  if (sName) sName.textContent = school;
  const modal = document.getElementById('certModal');
  if (modal) modal.style.display = 'flex';
}

function closeCertModal() {
  const modal = document.getElementById('certModal');
  if (modal) modal.style.display = 'none';
}

function downloadCertPdf() {
  const teacherName = document.getElementById('modalTeacherName')?.textContent || 'Teacher';
  const modName = document.getElementById('modalModuleName')?.textContent || 'CPD Module';
  const schName = document.getElementById('modalSchoolName')?.textContent || 'Kendriya Vidyalaya';

  const printWin = window.open('', '_blank', 'width=850,height=650');
  if (!printWin) {
    showToast('Please allow popups to download certificate PDF.');
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate — ${teacherName}</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFFDF9; margin: 0; padding: 40px; color: #0F172A; text-align: center; }
          .cert-outer { border: 12px double #FA0F00; padding: 36px 30px; border-radius: 18px; background: #FFFFFF; }
          .kvs-logo { font-size: 26px; font-weight: 900; color: #FA0F00; margin-bottom: 8px; font-family: Georgia, serif; }
          .header-tag { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #64748B; margin-bottom: 18px; }
          h1 { font-size: 24px; color: #475569; font-weight: 500; margin: 8px 0; }
          .recipient-name { font-size: 34px; font-weight: 900; color: #0F172A; border-bottom: 2px solid #FA0F00; display: inline-block; padding-bottom: 6px; margin: 12px 0; }
          .school-name { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 16px; }
          .cert-desc { font-size: 16px; color: #475569; line-height: 1.6; max-width: 650px; margin: 0 auto 28px; }
          .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding: 0 30px; font-size: 12px; color: #64748B; text-align: left; }
        </style>
      </head>
      <body>
        <div class="cert-outer">
          <div class="kvs-logo">Adobe Express for Education × Kendriya Vidyalaya Sangathan</div>
          <div class="header-tag">Official Training Credential</div>
          <h1>Certificate of Completion</h1>
          <div class="recipient-name">${teacherName}</div>
          <div class="school-name">${schName}</div>
          <div class="cert-desc">
            Has successfully attended and completed professional training in<br>
            <strong>${modName}</strong>.
          </div>
          <div class="footer-row">
            <div>
              <strong>Date:</strong> October 2026<br>
              <strong>Status:</strong> Completed
            </div>
            <div style="text-align:right;">
              <strong>Kendriya Vidyalaya Sangathan</strong><br>
              Adobe India Education Program
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 400);

  closeCertModal();
  showToast('Certificate opened! Use Print -> Save as PDF.');
}

function openArtifactModal() {}
function closeArtifactModal() {}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
