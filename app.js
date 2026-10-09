/**
 * KVS Principal Portal — Controller
 * Architecture:
 * - View 1: Institution & Program Selection (Main Hub)
 * - View 2: Dedicated School CPD Portal (Personalized summary, charts, faculty roster, Certificate modal, WhatsApp, Print & Export)
 * - View 3: Dedicated School DCAIS Portal (Personalized summary, 4 stages, Grade 6-8 projects, Student Bootcamp, Print & Export)
 */

let selectedRegion = '';
let selectedKVCode = null;
let currentView = 'home';
let catChart = null;
let funnelChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initPortal();
});

function initPortal() {
  if (typeof KVS_DATA === 'undefined') return;

  const regSelect = document.getElementById('regionSelect');
  if (!regSelect) return;

  regSelect.innerHTML = '<option value="">Choose Region...</option>';
  KVS_DATA.REGIONS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.name;
    opt.textContent = `${r.name} (${r.totalKVs} KVs)`;
    regSelect.appendChild(opt);
  });
}

// ==================== 1. REGION & SCHOOL CASCADE ====================

function onRegionChange() {
  const regSelect = document.getElementById('regionSelect');
  const schSelect = document.getElementById('schoolSelect');
  const homePrograms = document.getElementById('homeProgramsCard');

  selectedRegion = regSelect.value;
  if (homePrograms) homePrograms.style.display = 'none';

  if (!selectedRegion) {
    schSelect.innerHTML = '<option value="">First choose a region...</option>';
    schSelect.disabled = true;
    return;
  }

  const regObj = KVS_DATA.REGIONS.find(r => r.name === selectedRegion);
  if (!regObj) return;

  schSelect.innerHTML = '<option value="">Select KV School (Code / Name)...</option>';
  regObj.kvs.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.code;
    opt.textContent = `KV ${k.code} — ${k.name}`;
    schSelect.appendChild(opt);
  });

  schSelect.disabled = false;

  // Auto-select first school so the 2 program options appear immediately
  if (regObj.kvs.length > 0) {
    schSelect.value = regObj.kvs[0].code;
    setSchool(regObj.kvs[0].code);
  }
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

// ==================== 2. SET SCHOOL & PREPARE DATA ====================

function setSchool(kvCode) {
  const sch = KVS_DATA.SCHOOLS[kvCode];
  if (!sch) return;

  selectedKVCode = kvCode;

  // 1. Update Home Page Program Cards
  const homePrograms = document.getElementById('homeProgramsCard');
  if (homePrograms) {
    homePrograms.style.display = 'block';
    const badge = document.getElementById('homeSelectedSchoolBadge');
    const title = document.getElementById('homeSelectedSchoolTitle');
    const reg = document.getElementById('homeSelectedSchoolRegion');
    const cpdStats = document.getElementById('homeCpdStats');
    const dcaisStats = document.getElementById('homeDcaisStats');

    if (badge) badge.textContent = `KV ${sch.code}`;
    if (title) title.textContent = `KV ${sch.code} — ${sch.name}`;
    if (reg) reg.textContent = `${sch.region} Region • Academic Rating: ${sch.rating}`;
    if (cpdStats) cpdStats.textContent = `${sch.certifiedCount} Certified • ${sch.attendedCount} Attended`;
    if (dcaisStats) dcaisStats.textContent = `${sch.dcaisStage} • ${sch.bootcampCount} Students`;
  }

  // 2. Pre-populate CPD View
  const cpdBadge = document.getElementById('cpdSchoolCodeBadge');
  const cpdTitle = document.getElementById('cpdSchoolNameTitle');
  const cpdReg = document.getElementById('cpdSchoolRegionTag');
  const cpdRating = document.getElementById('cpdSchoolRatingTag');
  const cpdFaculty = document.getElementById('cpdSumFaculty');
  const cpdCert = document.getElementById('cpdSumCertified');
  const cpdAtt = document.getElementById('cpdSumAttended');

  if (cpdBadge) cpdBadge.textContent = sch.code;
  if (cpdTitle) cpdTitle.textContent = sch.name;
  if (cpdReg) cpdReg.textContent = `${sch.region} Region`;
  if (cpdRating) cpdRating.textContent = `Rating: ${sch.rating}`;
  if (cpdFaculty) cpdFaculty.textContent = sch.totalTeachers;
  if (cpdCert) cpdCert.textContent = sch.certifiedCount;
  if (cpdAtt) cpdAtt.textContent = sch.attendedCount;

  // 3. Pre-populate DCAIS View
  const dcaisBadge = document.getElementById('dcaisSchoolCodeBadge');
  const dcaisTitle = document.getElementById('dcaisSchoolNameTitle');
  const dcaisReg = document.getElementById('dcaisSchoolRegionTag');
  const dcaisStage = document.getElementById('dcaisSchoolStageTag');
  const dcaisFaculty = document.getElementById('dcaisSumFaculty');
  const dcaisSumStage = document.getElementById('dcaisSumStage');
  const dcaisStudents = document.getElementById('dcaisSumStudents');

  if (dcaisBadge) dcaisBadge.textContent = sch.code;
  if (dcaisTitle) dcaisTitle.textContent = sch.name;
  if (dcaisReg) dcaisReg.textContent = `${sch.region} Region`;
  if (dcaisStage) dcaisStage.textContent = `DCAIS: ${sch.dcaisStage}`;
  if (dcaisFaculty) dcaisFaculty.textContent = sch.totalTeachers;
  if (dcaisSumStage) dcaisSumStage.textContent = sch.dcaisStage.split(':')[0];
  if (dcaisStudents) dcaisStudents.textContent = sch.bootcampCount;

  // Render sub-elements
  renderRosterTable(sch.roster || []);
  renderDcaisStages(sch);
  renderBootcampTable(sch.bootcamp || []);
}

// ==================== 3. MULTI-VIEW NAVIGATION ====================

function navigateTo(viewName) {
  currentView = viewName;

  const viewHome = document.getElementById('viewHome');
  const viewCpd = document.getElementById('viewCpd');
  const viewDcais = document.getElementById('viewDcais');

  if (viewHome) viewHome.style.display = 'none';
  if (viewCpd) viewCpd.style.display = 'none';
  if (viewDcais) viewDcais.style.display = 'none';

  const sch = selectedKVCode ? KVS_DATA.SCHOOLS[selectedKVCode] : null;

  if (viewName === 'home') {
    if (viewHome) viewHome.style.display = 'block';
  } else if (viewName === 'cpd') {
    if (viewCpd) viewCpd.style.display = 'block';
    if (sch) {
      renderCpdCharts(sch);
    }
  } else if (viewName === 'dcais') {
    if (viewDcais) viewDcais.style.display = 'block';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 4. CPD CHARTS & ROSTER ====================

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

function renderRosterTable(roster) {
  const tbody = document.getElementById('rosterTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (roster.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--slate-400);">No faculty records found for this school.</td></tr>';
    return;
  }

  const sch = KVS_DATA.SCHOOLS[selectedKVCode];

  roster.forEach(t => {
    const isCert = t.crt === 'Dispatched';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.n}</strong></td>
      <td><span style="font-size:0.78rem;background:var(--slate-100);padding:2px 8px;border-radius:4px;font-weight:700;">${t.c}</span></td>
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
          ? `<button class="btn-action-small" onclick="openCertModal('${t.n}', '${t.m}', '${sch ? sch.name : ''}')">Certificate 📜</button>`
          : `<button class="btn-action-small red-nudge" onclick="openReminderModal('${t.n}', '${t.e}')">Remind 🔔</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRoster(val) {
  if (!selectedKVCode || !KVS_DATA.SCHOOLS[selectedKVCode]) return;
  const q = val.toLowerCase().trim();
  const all = KVS_DATA.SCHOOLS[selectedKVCode].roster || [];
  const filtered = all.filter(t => t.n.toLowerCase().includes(q) || t.s.toLowerCase().includes(q));
  renderRosterTable(filtered);
}

// ==================== 5. DCAIS STAGES & BOOTCAMP ====================

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

// ==================== 6. EXECUTIVE PRINT & DOWNLOAD FOR PRINCIPALS ====================

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

  if (type === 'cpd') {
    const rosterRows = (sch.roster || []).map((t, idx) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">${idx + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:bold;">${t.n}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">${t.c}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">${t.s}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">${t.m}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:bold;color:${t.crt === 'Dispatched' ? '#10B981' : '#F59E0B'};">
          ${t.crt === 'Dispatched' ? '✓ Certified' : '○ Pending'}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPD Executive Dossier — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FA0F00; padding-bottom: 16px; margin-bottom: 20px; }
            .title-box h1 { font-size: 22px; margin: 0 0 4px; color: #0F172A; }
            .title-box p { font-size: 13px; color: #64748B; margin: 0; }
            .badge { background: #FA0F00; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 900; font-size: 13px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; background: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0; }
            .summary-box { text-align: center; }
            .summary-val { font-size: 20px; font-weight: 900; color: #0F172A; }
            .summary-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th { text-align: left; background: #F1F5F9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .sign-row { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 1px dashed #CBD5E1; }
            .sign-box { text-align: center; width: 200px; }
            .sign-line { border-top: 1px solid #0F172A; margin-top: 40px; padding-top: 6px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-box">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express for Education</h1>
              <p>Continuous Professional Development (CPD) — Official School Executive Dossier</p>
            </div>
            <div class="badge">KV ${sch.code}</div>
          </div>

          <div style="margin-bottom:18px;">
            <h2 style="font-size:18px;margin:0 0 4px;">${sch.name}</h2>
            <p style="font-size:13px;color:#475569;margin:0;">
              <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
              <strong>Academic Rating:</strong> ${sch.rating} &nbsp;|&nbsp; 
              <strong>Date of Generation:</strong> ${now}
            </p>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-val">${sch.totalTeachers}</div>
              <div class="summary-lbl">Total Faculty</div>
            </div>
            <div class="summary-box">
              <div class="summary-val" style="color:#FA0F00;">${sch.certifiedCount}</div>
              <div class="summary-lbl">Certified Teachers</div>
            </div>
            <div class="summary-box">
              <div class="summary-val">${sch.attendedCount}</div>
              <div class="summary-lbl">Attended Training</div>
            </div>
            <div class="summary-box">
              <div class="summary-val" style="color:#10B981;">${Math.round((sch.certifiedCount / Math.max(1, sch.totalTeachers)) * 100)}%</div>
              <div class="summary-lbl">Certification Rate</div>
            </div>
          </div>

          <h3 style="font-size:14px;text-transform:uppercase;margin:0 0 6px;color:#334155;">Faculty Training &amp; Certification Roster</h3>
          <table>
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>Teacher Name</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Module</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows || '<tr><td colspan="6" style="text-align:center;padding:16px;">No faculty records registered.</td></tr>'}
            </tbody>
          </table>

          <div class="sign-row">
            <div class="sign-box">
              <div class="sign-line">Principal Signature</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">School Seal / Stamp</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">KVS Directorate Verification</div>
            </div>
          </div>
        </body>
      </html>
    `);
  } else {
    // DCAIS Printable Report
    const bootcampRows = (sch.bootcamp || []).map((b, idx) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">${idx + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:bold;">${b.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">Grade ${b.grade}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;">Digital Storytelling</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;color:#10B981;font-weight:bold;">✓ Verified Submission</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DCAIS Innovation Dossier — KV ${sch.code} ${sch.name}</title>
          <style>
            @page { size: portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E1B4B; padding-bottom: 16px; margin-bottom: 20px; }
            .title-box h1 { font-size: 22px; margin: 0 0 4px; color: #0F172A; }
            .title-box p { font-size: 13px; color: #64748B; margin: 0; }
            .badge { background: #1E1B4B; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 900; font-size: 13px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; background: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0; }
            .summary-box { text-align: center; }
            .summary-val { font-size: 20px; font-weight: 900; color: #0F172A; }
            .summary-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            .stage-box-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
            .s-box { border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; text-align: center; }
            .s-box.active { border-color: #10B981; background: #F0FDF4; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th { text-align: left; background: #F1F5F9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .sign-row { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 1px dashed #CBD5E1; }
            .sign-box { text-align: center; width: 200px; }
            .sign-line { border-top: 1px solid #0F172A; margin-top: 40px; padding-top: 6px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-box">
              <h1>Kendriya Vidyalaya Sangathan × Adobe Express for Education</h1>
              <p>Digital Creativity &amp; Innovation Skills (DCAIS) — Official School Executive Dossier</p>
            </div>
            <div class="badge">KV ${sch.code}</div>
          </div>

          <div style="margin-bottom:18px;">
            <h2 style="font-size:18px;margin:0 0 4px;">${sch.name}</h2>
            <p style="font-size:13px;color:#475569;margin:0;">
              <strong>Region:</strong> ${sch.region} &nbsp;|&nbsp; 
              <strong>DCAIS Stage:</strong> ${sch.dcaisStage} &nbsp;|&nbsp; 
              <strong>Date of Generation:</strong> ${now}
            </p>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-val">${sch.totalTeachers}</div>
              <div class="summary-lbl">Faculty Members</div>
            </div>
            <div class="summary-box">
              <div class="summary-val" style="color:#3B82F6;">${sch.dcaisStage}</div>
              <div class="summary-lbl">Implementation Level</div>
            </div>
            <div class="summary-box">
              <div class="summary-val" style="color:#10B981;">${sch.bootcampCount}</div>
              <div class="summary-lbl">Summer Bootcamp Outputs</div>
            </div>
          </div>

          <h3 style="font-size:14px;text-transform:uppercase;margin:0 0 8px;color:#334155;">DCAIS Curriculum Stages Progress</h3>
          <div class="stage-box-row">
            <div class="s-box ${sch.dcais.m1 ? 'active' : ''}">
              <div style="font-size:11px;font-weight:bold;color:#64748B;">MODULE 1</div>
              <div style="font-size:13px;font-weight:900;">Design Thinking</div>
              <div style="font-size:11px;color:${sch.dcais.m1 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m1 ? '✓ Active' : '○ Pending'}</div>
            </div>
            <div class="s-box ${sch.dcais.m2 ? 'active' : ''}">
              <div style="font-size:11px;font-weight:bold;color:#64748B;">MODULE 2</div>
              <div style="font-size:13px;font-weight:900;">Integration</div>
              <div style="font-size:11px;color:${sch.dcais.m2 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m2 ? '✓ Active' : '○ Pending'}</div>
            </div>
            <div class="s-box ${sch.dcais.m3 ? 'active' : ''}">
              <div style="font-size:11px;font-weight:bold;color:#64748B;">MODULE 3</div>
              <div style="font-size:13px;font-weight:900;">Student Projects</div>
              <div style="font-size:11px;color:${sch.dcais.m3 ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m3 ? '✓ Active' : '○ Pending'}</div>
            </div>
            <div class="s-box ${sch.dcais.m4 === 'Yes' ? 'active' : ''}">
              <div style="font-size:11px;font-weight:bold;color:#64748B;">MODULE 4</div>
              <div style="font-size:13px;font-weight:900;">Showcase</div>
              <div style="font-size:11px;color:${sch.dcais.m4 === 'Yes' ? '#10B981' : '#94A3B8'};font-weight:bold;">${sch.dcais.m4 === 'Yes' ? '✓ Active' : '○ Pending'}</div>
            </div>
          </div>

          <h3 style="font-size:14px;text-transform:uppercase;margin:0 0 6px;color:#334155;">Student Bootcamp Creative Submissions</h3>
          <table>
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Track</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${bootcampRows || '<tr><td colspan="5" style="text-align:center;padding:16px;">No student submissions recorded for this school.</td></tr>'}
            </tbody>
          </table>

          <div class="sign-row">
            <div class="sign-box">
              <div class="sign-line">Principal Signature</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">School Seal / Stamp</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">KVS Directorate Verification</div>
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
  }, 500);

  showToast(`Generated print dossier for KV ${sch.code}! Use Save as PDF.`);
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
    filename = `KV_${sch.code}_${sch.name.replace(/[^a-zA-Z0-9]/g, '_')}_CPD_Faculty.csv`;
    const rows = [
      ['KV Code', 'School Name', 'Region', 'Teacher Name', 'Category', 'Subject', 'Module', 'Status']
    ];
    (sch.roster || []).forEach(t => {
      rows.push([sch.code, sch.name, sch.region, t.n, t.c, t.s, t.m, t.crt]);
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

// ==================== 7. MODALS & TOAST ====================

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

function sendWhatsAppReminder() {
  const txt = document.getElementById('reminderText').value;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`;
  window.open(url, '_blank');
  closeReminderModal();
  showToast('WhatsApp opened with reminder!');
}

function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
