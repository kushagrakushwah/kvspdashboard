/**
 * KVS Principal Portal — Complete Controller (Full Overhaul)
 * Architecture:
 * - View 1: Institution & Program Selection with Fast Combobox Search & Regional Benchmarking
 * - View 2: Dedicated School CPD Portal (A4 Print Dossier, Filter Pills, Roster, 1-Click Notice)
 * - View 3: Dedicated School DCAIS Portal (A4 Print Dossier, Artifact Showcase Modal, 4 Stages, Bootcamp)
 */

let selectedRegion = '';
let selectedKVCode = null;
let currentView = 'home';
let currentRosterFilter = 'all';
let allSchoolsList = [];
let catChart = null;
let funnelChart = null;

// Creative Artifacts Metadata
const ARTIFACT_METADATA = [
  {
    grade: "Grade 6 • Science & Environmental Studies",
    title: "Ecosystem Conservation & Biodiversity Poster",
    iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    bg: "#FFF1F0",
    color: "#FA0F00",
    theme: "Design Thinking & Visual Communication (NCERT Chapter 7)",
    tools: "Adobe Express Visual Layout, Typography Pairing, Vector Assets",
    description: "Students utilized design thinking principles to identify regional deforestation issues and synthesized solutions into high-impact visual posters.",
    rubric: "Visual hierarchy (40%), clarity of environmental message (30%), typography and color contrast (30%).",
    competencies: "Visual Literacy, Environmental Sensitivity, Digital Media Composition"
  },
  {
    grade: "Grade 7 • Social Science (History)",
    title: "Medieval Indian Architecture & Heritage Infographic",
    iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="3" y1="2" x2="21" y2="2"/><line x1="6" y1="6" x2="6" y2="18"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="18" y1="6" x2="18" y2="18"/></svg>`,
    bg: "#EFF6FF",
    color: "#2563EB",
    theme: "Curriculum Integration & Historical Process Mapping (NCERT Chapter 5)",
    tools: "Adobe Express Timeline Layout, Information Chunking, Custom Iconography",
    description: "Students mapped the architectural evolution of Qutub Minar, Konark Sun Temple, and Red Fort with annotations and historical context.",
    rubric: "Historical fidelity (35%), graphic organization (35%), structured storytelling (30%).",
    competencies: "Historical Inquiry, Analytical Thinking, Infographic Construction"
  },
  {
    grade: "Grade 8 • Digital Creativity Skills",
    title: "Personal Creative Portfolio & Academic Showcase",
    iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="m8 10-2 2 2 2"/><path d="m16 10 2 2-2 2"/></svg>`,
    bg: "#ECFDF5",
    color: "#059669",
    theme: "Multimedia Web Page Design & Digital Identity (NEP 2020 Aligned)",
    tools: "Adobe Express Web Page Builder, Responsive Layouts, Embedded Assets",
    description: "Students built interactive digital portfolios featuring project highlights, personal essays, science reflections, and creative artwork.",
    rubric: "Navigation clarity (30%), depth of creative reflections (40%), responsive web aesthetics (30%).",
    competencies: "Digital Identity, Self-Reflective Pedagogy, Web Publishing"
  },
  {
    grade: "Summer Innovation Bootcamp • Special Credential",
    title: "Animated Science Story Explainer Video",
    iconSvg: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`,
    bg: "#FAF5FF",
    color: "#7C3AED",
    theme: "Creative Storytelling, Audio Pacing & Kinetic Visuals",
    tools: "Adobe Express Video Generator, Audio Narration, Motion Transitions",
    description: "Bootcamp participants created 60-second animated scientific explanations of the Water Cycle, Lunar Eclipses, and Photosynthesis.",
    rubric: "Conceptual clarity (40%), audiovisual synchrony (30%), engagement factor (30%).",
    competencies: "Scientific Storytelling, Audio-Visual Production, Creative Problem Solving"
  }
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
});

function initPortal() {
  if (typeof KVS_DATA === 'undefined') return;

  // Build flattened school lookup array for instant typeahead
  allSchoolsList = Object.values(KVS_DATA.SCHOOLS).map(s => ({
    code: s.code,
    name: s.name,
    region: s.region,
    totalTeachers: s.totalTeachers,
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

  // Ensure portal starts in full expanded hero mode
  resetToFullHero();
}

// ==================== 1. FAST COMBOBOX / TYPEAHEAD ====================

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

  // Filter across all KV schools
  const matches = allSchoolsList.filter(s => 
    String(s.code).includes(q) || 
    s.name.toLowerCase().includes(q) ||
    s.region.toLowerCase().includes(q)
  ).slice(0, 12);

  if (matches.length === 0) {
    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--slate-400);font-size:0.85rem;">No matching Kendriya Vidyalayas found.</div>';
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = '';
  matches.forEach(m => {
    const div = document.createElement('div');
    div.className = 'combobox-item';
    div.onclick = () => selectSchoolFromCombobox(m.code);
    div.innerHTML = `
      <div class="combobox-item-left">
        <span class="combobox-kv-pill">KV ${m.code}</span>
        <div>
          <div class="combobox-name">${m.name}</div>
          <div class="combobox-reg">${m.region} Region • Rating: ${m.rating}</div>
        </div>
      </div>
      <span style="font-size:0.75rem;font-weight:800;color:var(--red);">Select ➔</span>
    `;
    dropdown.appendChild(div);
  });

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

function resetToFullHero() {
  selectedKVCode = null;
  selectedRegion = null;
  const heroCard = document.getElementById('selectorHeroCard');
  if (heroCard) {
    heroCard.classList.remove('hero-shrunk');
    heroCard.classList.add('hero-expanded');
  }

  const heroShrunkBar = document.getElementById('heroShrunkBar');
  if (heroShrunkBar) {
    heroShrunkBar.style.display = 'none';
  }

  const regionSummary = document.getElementById('regionSummaryBlock');
  if (regionSummary) {
    regionSummary.style.display = 'none';
  }

  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) {
    homePrograms.style.display = 'none';
    homePrograms.classList.remove('animate-slide-up');
  }

  const input = document.getElementById('globalSchoolSearch');
  if (input) input.value = '';
  const clearBtn = document.getElementById('comboboxClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  const regSelect = document.getElementById('regionSelect');
  if (regSelect) regSelect.value = '';

  const schSelect = document.getElementById('schoolSelect');
  if (schSelect) {
    schSelect.innerHTML = '<option value="">First choose a region...</option>';
    schSelect.disabled = true;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearCombobox() {
  hideComboboxDropdown();
  resetToFullHero();
}

function selectSchoolFromCombobox(code) {
  const sch = KVS_DATA.SCHOOLS[code];
  if (!sch) return;

  hideComboboxDropdown();
  const input = document.getElementById('globalSchoolSearch');
  if (input) input.value = `KV ${sch.code} — ${sch.name} (${sch.region})`;
  const clearBtn = document.getElementById('comboboxClearBtn');
  if (clearBtn) clearBtn.style.display = 'block';

  // Synchronize region dropdown
  const regSelect = document.getElementById('regionSelect');
  if (regSelect) regSelect.value = sch.region;

  // Repopulate and synchronize school dropdown
  const regObj = KVS_DATA.REGIONS.find(r => r.name === sch.region);
  const schSelect = document.getElementById('schoolSelect');
  if (regObj && schSelect) {
    schSelect.innerHTML = '<option value="">Select KV School (Code / Name)...</option>';
    regObj.kvs.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.code;
      opt.textContent = `KV ${k.code} — ${k.name}`;
      schSelect.appendChild(opt);
    });
    schSelect.disabled = false;
    schSelect.value = sch.code;
  }

  setSchool(sch.code);
}

// ==================== 2. REGION & SCHOOL CASCADE ====================

function onRegionChange() {
  const regSelect = document.getElementById('regionSelect');
  const schSelect = document.getElementById('schoolSelect');

  selectedRegion = regSelect.value;

  if (!selectedRegion) {
    resetToFullHero();
    return;
  }

  const regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
  if (!regObj) return;

  // Clear previous school state so user chooses from this region
  selectedKVCode = null;
  const heroCard = document.getElementById('selectorHeroCard');
  if (heroCard) {
    heroCard.classList.remove('hero-shrunk');
    heroCard.classList.add('hero-expanded');
  }
  const heroShrunkBar = document.getElementById('heroShrunkBar');
  if (heroShrunkBar) heroShrunkBar.style.display = 'none';

  // Populate school select dropdown with this region's schools
  schSelect.innerHTML = `<option value="">Select KV School (${regObj.kvs.length} Schools in ${selectedRegion})...</option>`;
  regObj.kvs.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.code;
    opt.textContent = `KV ${k.code} — ${k.name}`;
    schSelect.appendChild(opt);
  });

  schSelect.disabled = false;
  schSelect.value = '';

  const input = document.getElementById('globalSchoolSearch');
  if (input) input.value = '';
  const clearBtn = document.getElementById('comboboxClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  // Hide school programs card until school is explicitly selected
  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) homePrograms.style.display = 'none';

  // Render and display Regional Summary for CPD & DCAIS
  renderRegionSummary(regObj);
}

function renderRegionSummary(regObj) {
  const summaryBlock = document.getElementById('regionSummaryBlock');
  if (!summaryBlock) return;

  const badge = document.getElementById('regSummaryBadge');
  const meta = document.getElementById('regSummaryMeta');
  if (badge) badge.textContent = `${regObj.name} Regional Overview`;
  if (meta) meta.textContent = `${regObj.totalKVs} Kendriya Vidyalayas • ${regObj.totalTeachers.toLocaleString()} Total Teachers`;

  const cpdDesc = document.getElementById('regCpdDesc');
  if (cpdDesc) cpdDesc.textContent = `Continuous Professional Development across all ${regObj.totalKVs} schools in ${regObj.name} Region.`;

  const cpdCert = document.getElementById('regCpdCertified');
  const cpdAtt = document.getElementById('regCpdAttended');
  const cpdTot = document.getElementById('regCpdTotalFaculty');
  const cpdFill = document.getElementById('regCpdProgressFill');
  const cpdText = document.getElementById('regCpdProgressText');
  const cpdRate = Math.round((regObj.cpdCertified / Math.max(1, regObj.totalTeachers)) * 100);

  if (cpdCert) cpdCert.textContent = regObj.cpdCertified.toLocaleString();
  if (cpdAtt) cpdAtt.textContent = regObj.cpdAttended.toLocaleString();
  if (cpdTot) cpdTot.textContent = regObj.totalTeachers.toLocaleString();
  if (cpdFill) cpdFill.style.width = `${Math.min(100, Math.max(6, cpdRate))}%`;
  if (cpdText) cpdText.textContent = `${cpdRate}% Regional Certification Rate • CPD 1–6 Completed (10 Total Modules)`;

  const dcaisDesc = document.getElementById('regDcaisDesc');
  if (dcaisDesc) dcaisDesc.textContent = `Digital Creativity & Innovation Skills (Stages M1–M4) implementation across ${regObj.name} Region.`;

  const dcaisSchools = document.getElementById('regDcaisSchools');
  const dcaisBoot = document.getElementById('regDcaisBootcamp');
  const dcaisTotal = document.getElementById('regDcaisTotalSchools');
  const activeCount = (regObj.m1Schools || 0) + (regObj.m2Schools || 0) + (regObj.m3Schools || 0) + (regObj.m4Schools || 0);

  if (dcaisSchools) dcaisSchools.textContent = activeCount;
  if (dcaisBoot) dcaisBoot.textContent = (regObj.bootcampCount || 0).toLocaleString();
  if (dcaisTotal) dcaisTotal.textContent = regObj.totalKVs;

  const m1Pill = document.getElementById('regM1Pill');
  const m2Pill = document.getElementById('regM2Pill');
  const m3Pill = document.getElementById('regM3Pill');
  const m4Pill = document.getElementById('regM4Pill');
  if (m1Pill) m1Pill.textContent = `Stage M1: ${regObj.m1Schools || 0}`;
  if (m2Pill) m2Pill.textContent = `Stage M2: ${regObj.m2Schools || 0}`;
  if (m3Pill) m3Pill.textContent = `Stage M3: ${regObj.m3Schools || 0}`;
  if (m4Pill) m4Pill.textContent = `Stage M4: ${regObj.m4Schools || 0}`;

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
  const code = schSelect.value ? Number(schSelect.value) : null;
  if (!code) return;
  setSchool(code);
}

function quickSelectRegion(regName) {
  const regSelect = document.getElementById('regionSelect');
  if (!regSelect) return;
  regSelect.value = regName;
  onRegionChange();
}

// ==================== 3. REGIONAL BENCHMARK COMPUTATION ====================

function computeRegionalBenchmark(sch) {
  const regSchools = Object.values(KVS_DATA.SCHOOLS).filter(s => s.region === sch.region);
  if (regSchools.length === 0) return { text: "Regional Leader", cls: "gold" };

  const totalCert = regSchools.reduce((acc, s) => acc + s.certifiedCount, 0);
  const totalFaculty = regSchools.reduce((acc, s) => acc + s.totalTeachers, 0);
  const regAvgRate = totalFaculty > 0 ? (totalCert / totalFaculty) * 100 : 20;

  const schoolRate = (sch.certifiedCount / Math.max(1, sch.totalTeachers)) * 100;

  // Sort schools in region by certification count
  const sorted = [...regSchools].sort((a, b) => (b.certifiedCount / b.totalTeachers) - (a.certifiedCount / a.totalTeachers));
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

function setSchool(kvCode) {
  const sch = KVS_DATA.SCHOOLS[kvCode];
  if (!sch) return;

  selectedKVCode = kvCode;
  selectedRegion = sch.region;
  const benchmark = computeRegionalBenchmark(sch);

  // Hide the region summary block so the school summary takes center stage
  const summaryBlock = document.getElementById('regionSummaryBlock');
  if (summaryBlock) summaryBlock.style.display = 'none';

  // 0. Smoothly morph selector hero from expanded to shrunk state
  const heroCard = document.getElementById('selectorHeroCard');
  if (heroCard) {
    heroCard.classList.remove('hero-expanded');
    heroCard.classList.add('hero-shrunk');
  }

  const heroShrunkBar = document.getElementById('heroShrunkBar');
  if (heroShrunkBar) {
    heroShrunkBar.style.display = 'flex';
  }

  const shrunkTitle = document.getElementById('shrunkSchoolTitle');
  if (shrunkTitle) {
    shrunkTitle.textContent = `KV ${sch.code} — ${sch.name} (${sch.region} Region)`;
  }

  const shrunkBench = document.getElementById('shrunkBenchmarkPill');
  if (shrunkBench) {
    shrunkBench.textContent = benchmark.text;
    shrunkBench.className = `benchmark-pill ${benchmark.cls}`;
  }

  // 1. Update Home Page Program Cards & Trigger Animation
  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) {
    homePrograms.style.display = 'block';
    homePrograms.classList.remove('animate-slide-up');
    void homePrograms.offsetWidth; // trigger reflow for smooth animation
    homePrograms.classList.add('animate-slide-up');

    const badge = document.getElementById('homeSelectedSchoolBadge');
    const title = document.getElementById('homeSelectedSchoolTitle');
    const reg = document.getElementById('homeSelectedSchoolRegion');
    const cpdStats = document.getElementById('homeCpdStats');
    const dcaisStats = document.getElementById('homeDcaisStats');
    const benchPill = document.getElementById('homeBenchmarkPill');

    if (badge) badge.textContent = `KV ${sch.code}`;
    if (title) title.textContent = `KV ${sch.code} — ${sch.name}`;
    if (reg) reg.textContent = `${sch.region} Region • Academic Rating: ${sch.rating}`;
    if (cpdStats) cpdStats.textContent = `${sch.attendedCount} Attended • ${sch.certifiedCount} Certified • ${sch.totalTeachers} Total Teachers`;
    if (dcaisStats) dcaisStats.textContent = `${sch.dcaisStage} Active • ${sch.bootcampCount} Bootcamp Students`;
    if (benchPill) {
      benchPill.textContent = benchmark.text;
      benchPill.className = `benchmark-pill ${benchmark.cls}`;
    }

    // Smooth scroll so the CPD and DCAIS cards are comfortably visible
    setTimeout(() => {
      homePrograms.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }

  // 2. Pre-populate CPD View
  const cpdBadge = document.getElementById('cpdSchoolCodeBadge');
  const cpdTitle = document.getElementById('cpdSchoolNameTitle');
  const cpdReg = document.getElementById('cpdSchoolRegionTag');
  const cpdRating = document.getElementById('cpdSchoolRatingTag');
  const cpdFaculty = document.getElementById('cpdSumFaculty');
  const cpdAtt = document.getElementById('cpdSumAttended');
  const cpdCert = document.getElementById('cpdSumCertified');
  const cpdBench = document.getElementById('cpdBenchmarkPill');

  if (cpdBadge) cpdBadge.textContent = sch.code;
  if (cpdTitle) cpdTitle.textContent = sch.name;
  if (cpdReg) cpdReg.textContent = `${sch.region} Region`;
  if (cpdRating) cpdRating.textContent = `Rating: ${sch.rating}`;
  if (cpdFaculty) cpdFaculty.textContent = sch.totalTeachers;
  if (cpdAtt) cpdAtt.textContent = sch.attendedCount;
  if (cpdCert) cpdCert.textContent = sch.certifiedCount;
  if (cpdBench) {
    cpdBench.textContent = benchmark.text;
    cpdBench.className = `benchmark-pill ${benchmark.cls}`;
  }

  // 3. Pre-populate DCAIS View
  const dcaisBadge = document.getElementById('dcaisSchoolCodeBadge');
  const dcaisTitle = document.getElementById('dcaisSchoolNameTitle');
  const dcaisReg = document.getElementById('dcaisSchoolRegionTag');
  const dcaisStage = document.getElementById('dcaisSchoolStageTag');
  const dcaisFaculty = document.getElementById('dcaisSumFaculty');
  const dcaisSumStage = document.getElementById('dcaisSumStage');
  const dcaisStudents = document.getElementById('dcaisSumStudents');
  const dcaisBench = document.getElementById('dcaisBenchmarkPill');

  if (dcaisBadge) dcaisBadge.textContent = sch.code;
  if (dcaisTitle) dcaisTitle.textContent = sch.name;
  if (dcaisReg) dcaisReg.textContent = `${sch.region} Region`;
  if (dcaisStage) dcaisStage.textContent = `DCAIS: ${sch.dcaisStage}`;
  if (dcaisFaculty) dcaisFaculty.textContent = sch.totalTeachers;
  if (dcaisSumStage) dcaisSumStage.textContent = sch.dcaisStage.split(':')[0];
  if (dcaisStudents) dcaisStudents.textContent = sch.bootcampCount;
  if (dcaisBench) {
    dcaisBench.textContent = `${sch.dcaisStage} Active`;
  }

  // Update Roster Filter Pill counts
  updateRosterFilterCounts(sch.roster || []);

  // Render sub-elements
  currentRosterFilter = 'all';
  renderRosterTable(sch.roster || []);
  renderDcaisStages(sch);
  renderBootcampTable(sch.bootcamp || []);
}

// ==================== 5. MULTI-VIEW NAVIGATION ====================

function navigateTo(viewName) {
  currentView = viewName;

  const viewHome = document.getElementById('viewHome');
  const viewCpd = document.getElementById('viewCpd');
  const viewDcais = document.getElementById('viewDcais');

  // Update Navigation Tabs active state
  ['navTabHome', 'navTabCpd', 'navTabDcais'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const sch = selectedKVCode ? KVS_DATA.SCHOOLS[selectedKVCode] : null;

  if (viewName === 'home') {
    if (viewHome) viewHome.style.display = 'block';
    if (viewCpd) viewCpd.style.display = 'none';
    if (viewDcais) viewDcais.style.display = 'none';
    const tab = document.getElementById('navTabHome');
    if (tab) tab.classList.add('active');
  } else if (viewName === 'cpd') {
    if (!selectedKVCode) {
      showToast('Please select your KV school first.');
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
      showToast('Please select your KV school first.');
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
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 6. CPD CHARTS & ROSTER ====================

function renderCpdCharts(sch) {
  // Chart 1: Teacher Category Doughnut
  const ctxCat = document.getElementById('chartCpdCat');
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
      prt = Math.round(sch.totalTeachers * 0.44);
      tgt = Math.round(sch.totalTeachers * 0.34);
      pgt = Math.max(1, sch.totalTeachers - prt - tgt);
    }

    catChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Primary (PRT)', 'Trained Graduate (TGT)', 'Post Graduate (PGT)', 'Other Teachers'],
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

  // Chart 2: Funnel Bar
  const ctxFunnel = document.getElementById('chartCpdFunnel');
  if (ctxFunnel) {
    if (funnelChart) funnelChart.destroy();

    const certTotal = Math.max(1, sch.certifiedCount);
    const funnelData = [
      certTotal,
      Math.max(1, Math.round(certTotal * 0.45)),
      Math.max(0, Math.round(certTotal * 0.30)),
      Math.max(0, Math.round(certTotal * 0.18)),
      Math.max(0, Math.round(certTotal * 0.08)),
      Math.max(0, Math.round(certTotal * 0.05))
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

// Roster Filter Pills
function updateRosterFilterCounts(roster) {
  let attended = 0, cert = 0, pend = 0, prt = 0, tgt = 0, pgt = 0;
  roster.forEach(t => {
    if (t.a === 'Yes') attended++;
    if (t.crt === 'Dispatched') cert++;
    else pend++;
    if (t.c === 'PRT') prt++;
    else if (t.c === 'TGT') tgt++;
    else if (t.c === 'PGT') pgt++;
  });

  const cAll = document.getElementById('countFilterAll');
  const cAtt = document.getElementById('countFilterAttended');
  const cCert = document.getElementById('countFilterCertified');
  const cPend = document.getElementById('countFilterPending');
  const cPrt = document.getElementById('countFilterPRT');
  const cTgt = document.getElementById('countFilterTGT');
  const cPgt = document.getElementById('countFilterPGT');

  if (cAll) cAll.textContent = roster.length;
  if (cAtt) cAtt.textContent = attended;
  if (cCert) cCert.textContent = cert;
  if (cPend) cPend.textContent = pend;
  if (cPrt) cPrt.textContent = prt;
  if (cTgt) cTgt.textContent = tgt;
  if (cPgt) cPgt.textContent = pgt;
}

function setRosterFilter(filterType, btn) {
  currentRosterFilter = filterType;

  // Update active pill button
  document.querySelectorAll('#rosterFilterPills .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  filterRoster();
}

function filterRoster() {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const searchInput = document.getElementById('rosterSearch');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const all = KVS_DATA.SCHOOLS[selectedKVCode].roster || [];
  const filtered = all.filter(t => {
    // 1. Check search text
    const matchesSearch = q === '' || t.n.toLowerCase().includes(q) || t.s.toLowerCase().includes(q) || (t.m && t.m.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    // 2. Check category / status filter pill
    if (currentRosterFilter === 'all') return true;
    if (currentRosterFilter === 'attended') return t.a === 'Yes';
    if (currentRosterFilter === 'certified') return t.crt === 'Dispatched';
    if (currentRosterFilter === 'pending') return t.crt !== 'Dispatched';
    if (currentRosterFilter === 'PRT') return t.c === 'PRT';
    if (currentRosterFilter === 'TGT') return t.c === 'TGT';
    if (currentRosterFilter === 'PGT') return t.c === 'PGT';
    return true;
  });

  renderRosterTable(filtered);
}

function renderRosterTable(roster) {
  const tbody = document.getElementById('rosterTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (roster.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--slate-400);">No teacher records found matching criteria.</td></tr>';
    return;
  }

  const sch = KVS_DATA.SCHOOLS[selectedKVCode];

  roster.forEach(t => {
    const isCert = t.crt === 'Dispatched';
    const isAtt = t.a === 'Yes';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.n}</strong></td>
      <td><span style="font-size:0.78rem;background:var(--slate-100);padding:2px 8px;border-radius:4px;font-weight:700;">${t.c}</span></td>
      <td>${t.s}</td>
      <td><strong>${t.m}</strong></td>
      <td>
        <span class="status-dot-wrap">
          <span class="dot green"></span>
          <span style="font-weight:700;color:var(--green-text);">Attended</span>
        </span>
        <div style="font-size:0.72rem;color:var(--slate-500);margin-top:2px;">${t.d || '15-04-2025'}</div>
      </td>
      <td>
        <span class="status-dot-wrap">
          <span class="dot ${isCert ? 'green' : 'amber'}"></span>
          <span style="font-weight:700;color:${isCert ? 'var(--green-text)' : 'var(--amber-text)'};">${isCert ? 'Received Certificate' : 'Pending'}</span>
        </span>
      </td>
      <td>
        ${isCert 
          ? `<button class="btn-action-small" onclick="openCertModal('${t.n.replace(/'/g, "\\'")}', '${t.m}', '${sch ? sch.name.replace(/'/g, "\\'") : ''}')">View Certificate</button>`
          : `<button class="btn-action-small" onclick="copyTeacherNotice('${t.n.replace(/'/g, "\\'")}', '${t.e}', '${t.m}')" title="Copy official reminder notice to clipboard">Copy Reminder</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 7. DCAIS STAGES & BOOTCAMP ====================

function renderDcaisStages(sch) {
  const grid = document.getElementById('dcaisStagesRow');
  if (!grid) return;
  grid.innerHTML = '';

  const stages = [
    { num: 'Module 1', name: 'Design Thinking', active: sch.dcais.m1 },
    { num: 'Module 2', name: 'Curriculum Integration', active: sch.dcais.m2 },
    { num: 'Module 3', name: 'Student Projects', active: sch.dcais.m3 },
    { num: 'Module 4', name: 'Gallery Showcase', active: sch.dcais.m4 === 'Yes' }
  ];

  stages.forEach(s => {
    const box = document.createElement('div');
    box.className = `dcais-stage-box ${s.active ? 'completed' : ''}`;
    box.innerHTML = `
      <div class="dcais-stage-num">${s.num}</div>
      <div class="dcais-stage-name">${s.name}</div>
      <div style="font-size:0.8rem;font-weight:800;color:${s.active ? 'var(--green)' : 'var(--slate-400)'}">
        ${s.active ? '✓ Active in School' : '○ Pending'}
      </div>
    `;
    grid.appendChild(box);
  });
}

function renderBootcampTable(list) {
  const tbody = document.getElementById('bootcampTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--slate-400);">No student bootcamp records for this school.</td></tr>';
    return;
  }

  list.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.name}</strong></td>
      <td>Grade ${b.grade}</td>
      <td>Digital Storytelling</td>
      <td><span class="status-dot-wrap"><span class="dot green"></span><span>Certified</span></span></td>
      <td><a href="${b.certUrl}" target="_blank" class="btn-action-small" style="text-decoration:none;">View Link ↗</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== 8. STUDENT ARTIFACT MODAL ====================

function openArtifactModal(idx) {
  const art = ARTIFACT_METADATA[idx];
  if (!art) return;

  document.getElementById('artModalGrade').textContent = art.grade;
  document.getElementById('artModalTitle').textContent = art.title;

  const content = document.getElementById('artModalContent');
  if (content) {
    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
        <div style="width:68px;height:68px;border-radius:12px;background:${art.bg};color:${art.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${art.iconSvg}
        </div>
        <div>
          <div style="font-size:0.75rem;font-weight:900;text-transform:uppercase;color:${art.color};letter-spacing:0.06em;">NCERT Pedagogical Unit</div>
          <h4 style="font-size:1.15rem;font-weight:900;color:var(--slate-900);margin:2px 0 4px;">${art.theme}</h4>
          <div style="font-size:0.8rem;color:var(--slate-600);font-weight:700;">Creative Tool: ${art.tools}</div>
        </div>
      </div>

      <div style="background:#FFFFFF;border:1px solid var(--slate-200);border-radius:10px;padding:16px;margin-bottom:14px;">
        <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:var(--slate-500);margin-bottom:4px;">Project Implementation Overview:</div>
        <p style="font-size:0.88rem;color:var(--slate-800);line-height:1.5;margin:0;">${art.description}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:#FFFFFF;border:1px solid var(--slate-200);border-radius:8px;padding:12px;">
          <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;color:var(--slate-500);margin-bottom:2px;">Assessment Rubric:</div>
          <div style="font-size:0.82rem;color:var(--slate-700);">${art.rubric}</div>
        </div>
        <div style="background:#FFFFFF;border:1px solid var(--slate-200);border-radius:8px;padding:12px;">
          <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;color:var(--slate-500);margin-bottom:2px;">Target Competencies:</div>
          <div style="font-size:0.82rem;color:var(--slate-700);">${art.competencies}</div>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById('artifactModal');
  if (modal) modal.style.display = 'flex';
}

function closeArtifactModal() {
  const modal = document.getElementById('artifactModal');
  if (modal) modal.style.display = 'none';
}


// ==================== 10. GOVERNMENT-GRADE A4 PRINTABLE DOSSIER ====================

function printSchoolReport(type) {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) {
    showToast('Please select a school first.');
    return;
  }

  const sch = KVS_DATA.SCHOOLS[selectedKVCode];
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
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;">${t.c}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;">${t.s}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:600;">${t.m}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:bold;color:#10B981;">
          ✓ Attended (${t.d || '15-04-2025'})
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:bold;color:${t.crt === 'Dispatched' ? '#10B981' : '#D97706'};">
          ${t.crt === 'Dispatched' ? '✓ Received Certificate' : '○ Assignment Pending'}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPD Executive Dossier — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 12px; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #FA0F00; padding-bottom: 12px; margin-bottom: 14px; }
            .logo-title h1 { font-size: 19px; margin: 0 0 2px; color: #0F172A; font-family: Georgia, serif; }
            .logo-title p { font-size: 11px; color: #64748B; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
            .dossier-tag { background: #FA0F00; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; text-align: right; }
            .meta-strip { display: flex; justify-content: space-between; align-items: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
            .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
            .s-tile { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; text-align: center; background: #FFFFFF; }
            .s-val { font-size: 18px; font-weight: 900; color: #0F172A; }
            .s-lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background: #F1F5F9; padding: 7px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .qr-sign-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 18px; border-top: 1px dashed #CBD5E1; }
            .qr-box { display: flex; align-items: center; gap: 12px; font-size: 10px; color: #64748B; }
            .qr-fake { width: 48px; height: 48px; border: 2px solid #0F172A; padding: 3px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
            .qr-fake span { background: #0F172A; border-radius: 1px; }
            .sign-area { display: flex; gap: 40px; }
            .sign-col { text-align: center; width: 160px; font-size: 11px; font-weight: bold; border-top: 1px solid #0F172A; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="logo-title">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express</h1>
              <p>Continuous Professional Development (CPD) • Official Principal Dossier</p>
            </div>
            <div class="dossier-tag">
              KV ${sch.code}<br>
              <span style="font-size:9px;opacity:0.85;">Ministry Aligned</span>
            </div>
          </div>

          <div class="meta-strip">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F172A;">${sch.name}</div>
              <div style="color:#64748B;margin-top:2px;">
                <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
                <strong>Academic Rating:</strong> ${sch.rating} &nbsp;|&nbsp;
                <strong>Reference:</strong> ${refId}
              </div>
            </div>
            <div style="text-align:right;color:#64748B;">
              <strong>Date of Generation:</strong> ${now}<br>
              <strong>Verification URL:</strong> kvsangathan.nic.in
            </div>
          </div>

          <div class="summary-cards">
            <div class="s-tile">
              <div class="s-val">${sch.totalTeachers}</div>
              <div class="s-lbl">Participating Teachers</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#0F172A;">${sch.attendedCount}</div>
              <div class="s-lbl">CPD Attended</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#FA0F00;">${sch.certifiedCount}</div>
              <div class="s-lbl">CPD Certified</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#10B981;">${Math.round((sch.certifiedCount / Math.max(1, sch.attendedCount)) * 100)}%</div>
              <div class="s-lbl">Certification Ratio</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;margin-bottom:4px;">
            School Teacher Roster &amp; Continuous Professional Development Records
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:25px;text-align:center;">#</th>
                <th>Teacher Name</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Module</th>
                <th>CPD Attendance</th>
                <th>CPD Certificate</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows || '<tr><td colspan="7" style="text-align:center;padding:14px;">No teacher records registered.</td></tr>'}
            </tbody>
          </table>

          <div class="qr-sign-block">
            <div class="qr-box">
              <div class="qr-fake">
                <span></span><span></span><span></span><span></span>
                <span></span><span style="background:transparent;"></span><span></span><span></span>
                <span></span><span></span><span style="background:transparent;"></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
              <div>
                <strong>Scan for Digital Verification</strong><br>
                Directorate of Academic Excellence • KVS New Delhi
              </div>
            </div>

            <div class="sign-area">
              <div class="sign-col" style="margin-top:24px;">Principal Signature &amp; Seal</div>
              <div class="sign-col" style="margin-top:24px;">Regional Officer Verification</div>
            </div>
          </div>
        </body>
      </html>
    `);
  } else {
    // DCAIS Printable Report
    const bootcampRows = (sch.bootcamp || []).map((b, idx) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;text-align:center;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:bold;">${b.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;">Grade ${b.grade}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;">Digital Storytelling &amp; Poster</td>
        <td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;font-size:11px;color:#10B981;font-weight:bold;">✓ Verified Public Credential</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DCAIS Executive Dossier — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 12px; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1E1B4B; padding-bottom: 12px; margin-bottom: 14px; }
            .logo-title h1 { font-size: 19px; margin: 0 0 2px; color: #0F172A; font-family: Georgia, serif; }
            .logo-title p { font-size: 11px; color: #64748B; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
            .dossier-tag { background: #1E1B4B; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; text-align: right; }
            .meta-strip { display: flex; justify-content: space-between; align-items: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
            .s-tile { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; text-align: center; background: #FFFFFF; }
            .s-val { font-size: 18px; font-weight: 900; color: #0F172A; }
            .s-lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            .stages-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
            .stage-box { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; text-align: center; }
            .stage-box.active { border-color: #10B981; background: #F0FDF4; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background: #F1F5F9; padding: 7px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .qr-sign-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 18px; border-top: 1px dashed #CBD5E1; }
            .qr-box { display: flex; align-items: center; gap: 12px; font-size: 10px; color: #64748B; }
            .qr-fake { width: 48px; height: 48px; border: 2px solid #0F172A; padding: 3px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
            .qr-fake span { background: #0F172A; border-radius: 1px; }
            .sign-area { display: flex; gap: 40px; }
            .sign-col { text-align: center; width: 160px; font-size: 11px; font-weight: bold; border-top: 1px solid #0F172A; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="logo-title">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express</h1>
              <p>Digital Creativity &amp; Innovation Skills (DCAIS) • Official Principal Dossier</p>
            </div>
            <div class="dossier-tag">
              KV ${sch.code}<br>
              <span style="font-size:9px;opacity:0.85;">Curriculum Aligned</span>
            </div>
          </div>

          <div class="meta-strip">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F172A;">${sch.name}</div>
              <div style="color:#64748B;margin-top:2px;">
                <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
                <strong>DCAIS Stage:</strong> ${sch.dcaisStage} &nbsp;|&nbsp;
                <strong>Reference:</strong> ${refId}
              </div>
            </div>
            <div style="text-align:right;color:#64748B;">
              <strong>Date of Generation:</strong> ${now}<br>
              <strong>NEP 2020 Framework:</strong> Grades 6–8 Active
            </div>
          </div>

          <div class="summary-cards">
            <div class="s-tile">
              <div class="s-val">${sch.totalTeachers}</div>
              <div class="s-lbl">School Teachers</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#3B82F6;">${sch.dcaisStage}</div>
              <div class="s-lbl">Innovation Stage</div>
            </div>
            <div class="s-tile">
              <div class="s-val" style="color:#10B981;">${sch.bootcampCount}</div>
              <div class="s-lbl">Summer Bootcamp Submissions</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;margin-bottom:6px;">
            DCAIS Curriculum Modular Milestone Status
          </div>

          <div class="stages-strip">
            <div class="stage-box ${sch.dcais.m1 ? 'active' : ''}">
              <div style="font-size:10px;font-weight:bold;color:#64748B;">MODULE 1</div>
              <div style="font-size:12px;font-weight:900;">Design Thinking</div>
              <div style="font-size:10px;color:${sch.dcais.m1 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m1 ? '✓ Active in School' : '○ Pending'}</div>
            </div>
            <div class="stage-box ${sch.dcais.m2 ? 'active' : ''}">
              <div style="font-size:10px;font-weight:bold;color:#64748B;">MODULE 2</div>
              <div style="font-size:12px;font-weight:900;">Integration</div>
              <div style="font-size:10px;color:${sch.dcais.m2 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m2 ? '✓ Active in School' : '○ Pending'}</div>
            </div>
            <div class="stage-box ${sch.dcais.m3 ? 'active' : ''}">
              <div style="font-size:10px;font-weight:bold;color:#64748B;">MODULE 3</div>
              <div style="font-size:12px;font-weight:900;">Student Projects</div>
              <div style="font-size:10px;color:${sch.dcais.m3 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m3 ? '✓ Active in School' : '○ Pending'}</div>
            </div>
            <div class="stage-box ${sch.dcais.m4 === 'Yes' ? 'active' : ''}">
              <div style="font-size:10px;font-weight:bold;color:#64748B;">MODULE 4</div>
              <div style="font-size:12px;font-weight:900;">Showcase</div>
              <div style="font-size:10px;color:${sch.dcais.m4 === 'Yes' ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m4 === 'Yes' ? '✓ Active in School' : '○ Pending'}</div>
            </div>
          </div>

          <div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;margin-bottom:4px;">
            Student Summer Bootcamp Creative Outputs &amp; Verified Submissions
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:25px;text-align:center;">#</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Project Track</th>
                <th>Credential Status</th>
              </tr>
            </thead>
            <tbody>
              ${bootcampRows || '<tr><td colspan="5" style="text-align:center;padding:14px;">No student submissions recorded for this school.</td></tr>'}
            </tbody>
          </table>

          <div class="qr-sign-block">
            <div class="qr-box">
              <div class="qr-fake">
                <span></span><span></span><span></span><span></span>
                <span></span><span style="background:transparent;"></span><span></span><span></span>
                <span></span><span></span><span style="background:transparent;"></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
              <div>
                <strong>Scan for Digital Verification</strong><br>
                Directorate of Academic Excellence • KVS New Delhi
              </div>
            </div>

            <div class="sign-area">
              <div class="sign-col" style="margin-top:24px;">Principal Signature &amp; Seal</div>
              <div class="sign-col" style="margin-top:24px;">Regional Officer Verification</div>
            </div>
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

  showToast(`A4 Official Dossier prepared for KV ${sch.code}! Use Save as PDF.`);
}

function exportSchoolCsv(type) {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) {
    showToast('Please select a school first.');
    return;
  }

  const sch = KVS_DATA.SCHOOLS[selectedKVCode];
  let csvContent = '';
  let filename = '';

  if (type === 'cpd') {
    filename = `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_CPD_Teachers.csv`;
    const rows = [
      ['KV Code', 'School Name', 'Region', 'Teacher Name', 'Category', 'Subject', 'Module', 'CPD Attendance', 'Attendance Date', 'CPD Certificate', 'Email']
    ];
    (sch.roster || []).forEach(t => {
      rows.push([
        sch.code,
        sch.name,
        sch.region,
        t.n,
        t.c,
        t.s,
        t.m,
        t.a === 'Yes' ? 'Attended' : 'Absent',
        t.d || '',
        t.crt === 'Dispatched' ? 'Received Certificate' : 'Pending',
        t.e || ''
      ]);
    });
    csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  } else {
    filename = `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_DCAIS_Projects.csv`;
    const rows = [
      ['KV Code', 'School Name', 'Region', 'Student Name', 'Grade', 'Track', 'Status', 'Credential URL']
    ];
    (sch.bootcamp || []).forEach(b => {
      rows.push([sch.code, sch.name, sch.region, b.name, b.grade, 'Digital Storytelling', 'Certified', b.certUrl]);
    });
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

// ==================== 11. INDIVIDUAL CERTIFICATE & REMINDER MODALS ====================

function openCertModal(name, mod, school) {
  document.getElementById('modalTeacherName').textContent = name;
  document.getElementById('modalModuleName').textContent = mod;
  document.getElementById('modalSchoolName').textContent = school;
  document.getElementById('certModal').style.display = 'flex';
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function downloadCertPdf() {
  const teacherName = document.getElementById('modalTeacherName').textContent;
  const modName = document.getElementById('modalModuleName').textContent;
  const schName = document.getElementById('modalSchoolName').textContent;

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
          .cert-outer { border: 12px double #FA0F00; padding: 36px 30px; border-radius: 18px; background: #FFFFFF; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .kvs-logo { font-size: 26px; font-weight: 900; color: #FA0F00; letter-spacing: -0.5px; margin-bottom: 8px; font-family: Georgia, serif; }
          .header-tag { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #64748B; margin-bottom: 18px; }
          h1 { font-size: 24px; color: #475569; font-weight: 500; margin: 8px 0; }
          .recipient-name { font-size: 34px; font-weight: 900; color: #0F172A; border-bottom: 2px solid #FA0F00; display: inline-block; padding-bottom: 6px; margin: 12px 0; }
          .school-name { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 16px; }
          .cert-desc { font-size: 16px; color: #475569; line-height: 1.6; max-width: 650px; margin: 0 auto 28px; }
          .cert-desc strong { color: #0F172A; }
          .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding: 0 30px; font-size: 12px; color: #64748B; text-align: left; }
          .stamp { width: 68px; height: 68px; border-radius: 50%; border: 2px dashed #FA0F00; display: flex; align-items: center; justify-content: center; color: #FA0F00; font-size: 10px; font-weight: 900; text-align: center; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="cert-outer">
          <div class="kvs-logo">Adobe Express for Education × Kendriya Vidyalaya Sangathan</div>
          <div class="header-tag">Official Verified Credential</div>
          <h1>Certificate of Professional Mastery</h1>
          <div class="recipient-name">${teacherName}</div>
          <div class="school-name">${schName}</div>
          <div class="cert-desc">
            Has fulfilled all pedagogical requirements and successfully completed certified coursework in<br>
            <strong>${modName}</strong>.
          </div>
          <div class="stamp">VERIFIED<br>CPD</div>
          <div class="footer-row">
            <div>
              <strong>Credential ID:</strong> KVS-ADOBE-CPD-${Math.floor(100000 + Math.random() * 900000)}<br>
              <strong>Date:</strong> October 2026<br>
              <strong>Status:</strong> Dispatched &amp; Active
            </div>
            <div style="text-align:right;">
              <strong>Kendriya Vidyalaya Sangathan</strong><br>
              Adobe India Education Program Directorate
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
  showToast('Certificate opened! Use Print ➔ Save as PDF.');
}

function copyTeacherNotice(name, email, mod) {
  const text = `Dear ${name}, please complete your assignment submission for Adobe Express ${mod || 'Module'} to receive your official verified certification credential.`;
  navigator.clipboard.writeText(text);
  showToast(`Copied official reminder notice for ${name} to clipboard!`);
}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
