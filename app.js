/**
 * KVS Principal Portal — Controller
 * Direct, single-page flow: Region ➔ School ➔ Summary + CPD / DCAIS 2 Options & Deep Dive
 */

let selectedRegion = '';
let selectedKVCode = null;
let currentProgram = 'cpd';
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
  const schoolSec = document.getElementById('schoolSection');

  selectedRegion = regSelect.value;
  schoolSec.style.display = 'none';

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

  // Auto-select first school so personalized summary & 2 options appear immediately
  if (regObj.kvs.length > 0) {
    schSelect.value = regObj.kvs[0].code;
    renderSchoolView(regObj.kvs[0].code);
  }
}

function onSchoolChange() {
  const schSelect = document.getElementById('schoolSelect');
  const code = schSelect.value ? Number(schSelect.value) : null;
  if (!code) return;
  renderSchoolView(code);
}

function quickSelectRegion(regName) {
  const regSelect = document.getElementById('regionSelect');
  if (!regSelect) return;
  regSelect.value = regName;
  onRegionChange();
}

// ==================== 2. SCHOOL SUMMARY & 2 OPTIONS ====================

function renderSchoolView(kvCode) {
  const sch = KVS_DATA.SCHOOLS[kvCode];
  if (!sch) return;

  selectedKVCode = kvCode;
  const schoolSec = document.getElementById('schoolSection');
  schoolSec.style.display = 'block';

  // 1. Personalized Summary Banner
  document.getElementById('schoolCodeBadge').textContent = sch.code;
  document.getElementById('schoolNameTitle').textContent = sch.name;
  document.getElementById('schoolRegionTag').textContent = `${sch.region} Region`;
  document.getElementById('schoolRatingTag').textContent = sch.rating;
  document.getElementById('schoolDcaisTag').textContent = sch.dcaisStage;

  document.getElementById('sumFaculty').textContent = sch.totalTeachers;
  document.getElementById('sumCertified').textContent = sch.certifiedCount;
  document.getElementById('sumStage').textContent = sch.dcaisStage.split(':')[0];

  // 2. Update Choice Cards Quick Stats
  document.getElementById('cpdChoiceStats').textContent = `${sch.certifiedCount} Certified • ${sch.attendedCount} Attended`;
  document.getElementById('dcaisChoiceStats').textContent = `${sch.dcaisStage} • ${sch.bootcampCount} Students`;

  // Render both details
  renderCpdDetails(sch);
  renderDcaisDetails(sch);

  // Set default view to CPD
  selectProgram('cpd');

  // Smooth scroll down to personalized summary on the same page
  setTimeout(() => {
    schoolSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function selectProgram(prog) {
  currentProgram = prog;

  const btnCpd = document.getElementById('btnChoiceCpd');
  const btnDcais = document.getElementById('btnChoiceDcais');
  const cpdSec = document.getElementById('detailsCpdSection');
  const dcaisSec = document.getElementById('detailsDcaisSection');
  const arrowCpd = document.getElementById('arrowCpd');
  const arrowDcais = document.getElementById('arrowDcais');

  if (prog === 'cpd') {
    btnCpd.classList.add('active');
    btnDcais.classList.remove('active');
    if (arrowCpd) arrowCpd.textContent = '● Viewing Details ↓';
    if (arrowDcais) arrowDcais.textContent = 'Click to View ↓';
    cpdSec.style.display = 'block';
    dcaisSec.style.display = 'none';

    setTimeout(() => {
      if (catChart) catChart.resize();
      if (funnelChart) funnelChart.resize();
    }, 100);
  } else {
    btnDcais.classList.add('active');
    btnCpd.classList.remove('active');
    if (arrowCpd) arrowCpd.textContent = 'Click to View ↓';
    if (arrowDcais) arrowDcais.textContent = '● Viewing Details ↓';
    dcaisSec.style.display = 'block';
    cpdSec.style.display = 'none';
  }
}

// ==================== 3. CPD DEEP DIVE ====================

function renderCpdDetails(sch) {
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

  // Table
  renderRosterTable(sch.roster || []);
}

function renderRosterTable(roster) {
  const tbody = document.getElementById('rosterTableBody');
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

// ==================== 4. DCAIS DEEP DIVE ====================

function renderDcaisDetails(sch) {
  // 4 Stages Cards
  const grid = document.getElementById('dcaisStagesRow');
  if (grid) {
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

  // Student Bootcamp Table
  const tbody = document.getElementById('bootcampTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    const list = sch.bootcamp || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--slate-400);">No student bootcamp records for this school.</td></tr>';
    } else {
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
  }
}

// ==================== 5. MODALS & TOAST ====================

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
