# 🎓 KVS Master Dashboard — Adobe Express for Education
> **Kendriya Vidyalaya Sangathan (KVS) National Implementation & Analytics Portal**  
> **Source Telemetry:** Grounded in 74,000+ verified records from `Semi Annual Report.xlsx`  
> **Live Deployment:** [https://kushagrakushwah.github.io/kvspdashboard/](https://kushagrakushwah.github.io/kvspdashboard/)

---

## 🌟 Executive Overview

The **KVS Master Dashboard** is an enterprise-grade digital analytics and management portal engineered for **School Principals, Regional Officers (ROs), and KVS Commissioners**. It monitors the end-to-end national rollout of **Adobe Express for Education** across India.

It tracks:
- **48,267 Teachers** registered across **28 KVS Regions**
- **1,124 Kendriya Vidyalayas** searchable by 4-digit KV Code
- **10,451 Accredited CPD Certificates** dispatched to faculty
- **7,840 Active Workshop Participants**
- **822 Schools** actively enrolled in the DCAIS Digital Innovation Hub
- **1,747 Summer Bootcamp Credentials** issued to students in grades 6 to 12

---

## ⚡ Streamlined 3-Tier Architecture

Following executive guidelines, the portal eliminates intermediate cluster/school-overview screens and presents a direct, high-speed command flow:

```
👤 PRINCIPAL ➔ 1. REGION (Dropdown) ➔ 2. KV CODE / SCHOOL (Dropdown & Instant Search) ➔ PROGRAM LEVEL
```

### 1. 🎓 Program A: CPD Academy (Continuous Professional Development)
- **Overview Page:** Interactive progression table across **CPD 1 to CPD 6** (Digital Foundations, Visual Communication, Collaborative Projects, Advanced Infographics, Interactive Classrooms, Evaluation Mastery).
- **Interactive Visualizations (Chart.js):**
  - **Funnel Drop-off Curve:** Tracks drop-off from CPD 1 (5,438 certified) down to CPD 6 (364 certified).
  - **Teacher Category Breakdown (Pie Chart):** PRT (40.8%), TGT (33.9%), PGT (24.8%), HM (0.5%).
- **Teacher Roster Dossier:** Filterable live directory of teachers with search by name, subject, category, or status.
  - Action buttons: `📜 View Certificate` (preview official credential) and `🔔 Send WhatsApp Reminder`.
- **Content & Output Resources:** One-click access to NCERT Digital Worksheets, Classroom Assignments, Creative Design Templates, and Student Portfolios.

### 2. 💻 Program B: DCAIS Innovation (Digital Creativity & Innovation Skills)
- **Module Status Page:** Real-time tracking of 822 schools across 4 stages:
  - **M1: Orientation & Design Thinking** (449 Schools / 54.6% Active)
  - **M2: Creative Curriculum Integration** (277 Schools / 33.7% Active)
  - **M3: Student Project Implementation** (159 Schools / 19.3% Active)
  - **M4: Gallery Publishing & Showcase** (49 Schools / 6.0% Active)
- **Grade-Level Gallery Hub:** Validation of digital student projects across Grade 6 (Posters), Grade 7 (Infographics & Videos), and Grade 8 (Digital Storytelling).
- **DCAIS Detailed View:** Live web gallery link generator, student creative package repository, and implementation milestone badges.

### 3. 📊 Data Insights & Action Radar (Executive Remediation Hub)
- **Gaps & Pending Radar:** Flags the 63% drop-off between CPD 1 and 2 to re-engage educators.
- **Regional Performance Leaderboard:** Comparative analysis of top regions (Tinsukia, Ranchi, Jaipur, Varanasi, Chennai, Bengaluru, Ahmedabad).
- **Action Plan & Intervention:** 1-Click WhatsApp & Email reminder generator with pre-drafted templates.
- **Top Performing Schools:** Digital recognition badges for high-performing KVs.

---

## 🛠️ Technology Stack

- **Frontend:** Modern Semantic HTML5, CSS3 Custom Properties (Design Tokens), Vanilla JavaScript (ES6+)
- **Charts:** [Chart.js 4.4](https://www.chartjs.org/) via CDN (Pie charts, Funnel Bar charts, Doughnut charts)
- **Zero Backend Dependencies:** 100% client-side data querying for instant 60 FPS performance and GitHub Pages compatibility.
- **Responsive & Print-Ready:** Custom print stylesheet for executive presentation PDF generation (`Ctrl + P`).

---

## 🚀 Local Development & Preview

To run locally:
1. Clone the repository:
   ```bash
   git clone https://github.com/kushagrakushwah/kvspdashboard.git
   cd kvspdashboard
   ```
2. Open `index.html` in any modern web browser:
   ```bash
   start index.html
   ```

---

## 📄 License & Attribution

© 2026 Adobe Systems & Kendriya Vidyalaya Sangathan (KVS). All rights reserved.  
Built for the national digital creativity and education initiative.
