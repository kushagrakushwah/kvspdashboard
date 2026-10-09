# 🎓 KVS Master Implementation Portal — Adobe Express for Education
> **Kendriya Vidyalaya Sangathan (KVS) National Multi-Stage Command Portal**  
> **Source Telemetry:** Grounded in 74,000+ verified records from `Semi Annual Report.xlsx`  
> **Live Deployment:** [https://kushagrakushwah.github.io/kvspdashboard/](https://kushagrakushwah.github.io/kvspdashboard/)

---

## 🌟 Executive Overview

The **KVS Master Implementation Portal** is an enterprise-grade digital analytics and management web application engineered for **School Principals, Regional Officers (ROs), and KVS Commissioners**.

Unlike static single-page dashboards, this portal operates as a **true multi-stage institutional command system**:
1. **Stepped Selection Gateway (`#gateway`):** First select one of the **25 Official KVS Regions**, then smoothly select any of the **1,202 Kendriya Vidyalayas** (searchable by 4-digit KV Code or school name).
2. **Dedicated School Command Center (`#kv/[code]`):** Launches an extensive, deep-dive portal tailored specifically to that school's registered faculty, CPD certifications, DCAIS innovation progress, and student bootcamp output.
3. **Regional Intelligence Hub (`#region/[name]`):** Allows Regional Officers to monitor all KVs across an entire region with interactive leaderboards and comparative analytics.

---

## 📊 Grounded Telemetry from `Semi Annual Report.xlsx`

Every metric in the portal is computed and validated against the official national semi-annual telemetry:
- **48,267 Registered Teachers** cataloged across India
- **1,202 Kendriya Vidyalayas** mapped by 4-digit KV Code and branch name
- **25 KVS Regions:** Agra, Ahmedabad, Bengaluru, Bhopal, Bhubaneswar, Chandigarh, Chennai, Dehradun, Delhi, Ernakulam, Gurugram, Guwahati, Hyderabad, Jabalpur, Jaipur, Jammu, Kolkata, Lucknow, Mumbai, Patna, Raipur, Ranchi, Silchar, Tinsukia, Varanasi
- **10,451 Accredited CPD Certificates** dispatched across Modules 1 to 6
- **7,840 Active Workshop Attendance Records**
- **822 Schools in DCAIS Digital Innovation** (M1: 449, M2: 277, M3: 159, M4: 49)
- **1,747 Summer Bootcamp Students** across Grades 6 to 12

---

## ⚡ Stepped Application Flow

```
1. GATEWAY ➔ Select Region (25 Cards) ➔ 2. Select KV Code / School (Grid & Instant Search) ➔ 3. DEDICATED SCHOOL COMMAND CENTER
```

### 1. 🏛️ Page 1: Gateway & Stepped Selector (`#gateway`)
- **Step 1: Region Selection:** Interactive grid of 25 regions with live school counts, total faculty, and certified teachers.
- **Step 2: School Selection:** Filters down to all schools in the chosen region. Live search by 4-digit code (e.g. `1006`, `1066`, `1409`, `1778`) or name.
- **Quick Switcher:** Instant auto-complete modal across all 1,202 schools from anywhere in the app.

### 2. 🏫 Page 2: Dedicated School Command Center (`#kv/[code]`)
Dedicated to the selected school with 5 deep-dive sub-pages:
- **Tab 1: 📊 Executive Command & KPIs:**
  - 6 Key Stat Cards: Total Faculty, Attendance Rate, Certification Conversion, DCAIS Stage, Bootcamp Students, Performance Index.
  - Interactive Visualizations: Faculty Category Doughnut Chart (PRT/TGT/PGT/HM) and CPD Completion Funnel (Modules 1–6).
  - Institutional Benchmark Matrix comparing school against Regional Average and National Benchmark.
- **Tab 2: 👩‍🏫 Faculty Dossier & CPD Records:**
  - Full roster of registered teachers for this KV.
  - Search by teacher name, subject, or email; filter by category and certification status.
  - Actions: Official Certificate preview & download, WhatsApp / Email reminder generation.
- **Tab 3: 🎨 DCAIS Innovation & Curriculum:**
  - 4-Stage Adoption tracker: M1 (Design Thinking), M2 (Curriculum), M3 (Student Projects), M4 (Gallery).
  - Classroom project modules for Grade 6, 7, and 8 with NCERT-aligned digital project kits.
- **Tab 4: 🎒 Summer Student Bootcamp:**
  - Real student participants from this school/region with verified credential download links.
- **Tab 5: 🎯 Smart Action & Intervention Radar:**
  - Auto-flags teachers who completed CPD 1 but have pending submissions for CPD 2 (63% national drop-off remediation).
  - 1-Click WhatsApp bulk reminder generator.

### 3. 🌐 Page 3: Regional Intelligence Hub (`#region/[name]`)
- Consolidated regional overview for Regional Officers and Commissioners.
- Complete school leaderboard ranking all KVs in the region.
- One-click drill-down into any school's dedicated command center.

---

## 🛠️ Technology Stack & Performance

- **Frontend:** Semantic HTML5, CSS3 Custom Properties (Design Tokens), Vanilla JavaScript (ES6+)
- **Visualizations:** [Chart.js 4.4](https://www.chartjs.org/) via CDN
- **Zero Backend Dependencies:** 100% client-side data querying for instant 60 FPS transitions and GitHub Pages hosting.
- **URL Hash Routing:** `#gateway`, `#region/[name]`, `#kv/[code]`, `#kv/[code]/[tab]` with full browser history support.
- **Responsive & Print-Ready:** Custom print stylesheet for executive PDF exports (`Ctrl + P`).

---

## 🚀 Local Development

1. Open `index.html` in any web browser:
   ```bash
   start index.html
   ```
2. Or serve using any local static web server:
   ```bash
   npx serve .
   ```

---

© 2026 Adobe Systems & Kendriya Vidyalaya Sangathan (KVS). All rights reserved.
