<div align="center">

<img src="https://res.cloudinary.com/dp5ap39r6/image/upload/v1777768013/logo_tuvebp.png" alt="The Chattala" width="280" />
<h3>The Digital Operating System for Chittagong</h3>
<a href="https://www.thechattala.com">www.thechattala.com</a>
<br/><br/>

[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://github.com/abumdselim/thechattala)
[![Framework](https://img.shields.io/badge/Next.js-15.x-white?style=for-the-badge&logo=next.js&logoColor=black)](https://nextjs.org/)
[![Runtime](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon-44CC11?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Security](https://img.shields.io/badge/Production%20Ready-v1.0.0+-22C55E?style=for-the-badge&logo=checkmarx&logoColor=white)](./PRODUCTION_CHECKLIST.md)

</div>

---

## 🏛️ Project Ethos

**The Chattala** is an enterprise-grade hyperlocal city platform engineered specifically for **Chittagong, Bangladesh**. It serves as a unified digital infrastructure connecting residents, businesses, and expert services within a high-trust, verified ecosystem. 

Designed with a **mobile-first approach** and **distributed architecture**, it aims to bridge the gap between physical city interactions and digital efficiency.

---

## 📑 Technical Documentation

| Resource | Scope |
| :--- | :--- |
| [🚀 **Launch Runbook**](./PRE_LAUNCH_RUNBOOK.md) | Step-by-step T-24h to T+24h execution plan. |
| [🔌 **API Reference**](./API.md) | RESTful architecture, Rate limiting (Upstash), and Schemas. |
| [⚙️ **Infrastructure Setup**](./SETUP.md) | Local environment orchestration & dependency management. |
| [🚢 **Deployment Ops**](./DEPLOYMENT.md) | Vercel CI/CD pipeline, migration strategies & rollbacks. |
| [🛡️ **Security Audit**](./PRODUCTION_CHECKLIST.md) | Critical readiness criteria for production environments. |
| [📊 **Success KPIs**](./SUCCESS_METRICS.md) | Performance monitoring, Uptime, and business metrics. |

---

## 🛠️ Engineering Stack

- **Core Infrastructure:** [Next.js 15](https://nextjs.org/) (App Router paradigm) with React Server Components (RSC).
- **Type Safety:** Full-stack [TypeScript](https://www.typescriptlang.org/) implementation for end-to-end data integrity.
- **Data Layer:** [Prisma ORM](https://www.prisma.io/) over [Neon Serverless PostgreSQL](https://neon.tech/) with dedicated pooling logic.
- **Identity & Security:** [NextAuth.js v5](https://authjs.dev/) with CSRF protection, rate-limiting, and hashed credential storage.
- **Media Engine:** [UploadThing](https://uploadthing.com/) with automated storage optimization (stale asset cleanup).
- **State & UI:** [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) for production-grade motion design.

---

## 🚀 Key Architectural Features

### ⚡ Server-Side Optimization
- **Dynamic Routing:** All authenticated routes utilize `force-dynamic` to ensure real-time data accuracy without build-time stale states.
- **Database Factory Pattern:** Implementation of `getDb()` to manage serverless PostgreSQL connections efficiently, preventing saturation.

### 🛡️ Security & Resilience
- **Rate Limiting:** IP-based and User-based request throttling using **Upstash Redis**.
- **Input Sanitization:** Multi-layer validation using Zod and Prisma constraints.
- **Error Boundaries:** Centralized error handling and logging via Sentry integration.

### 🖼️ Media Management
- **Smart Cleanup:** Integrated CDN cleanup logic that purges old assets from UploadThing before updating profile records—maintaining a zero-waste storage footprint.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Neon DB account)
- Redis (via Upstash)

### Initialization
```bash
# 1. Clone & Install
git clone https://github.com/abumdselim/thechattala.git
cd thechattala && npm install

# 2. Environment Configuration
cp .env.example .env.local

# 3. Database Synchronization
npx prisma db push

# 4. Launch Development Environment
npm run dev
```

---

## 🏗️ System Architecture

```text
src/
├── app/                  # Next.js 15 App Router & API Route Handlers
├── components/           # Atomic UI Design System (Shadcn/UI base)
├── hooks/                # Custom React Hooks & Context Providers
├── lib/                  # Core Utilities (Auth, Database, Sentry)
├── types/                # Global TypeScript interfaces & enums
└── prisma/               # Schema definitions & migrations
```

---

## 👨‍💻 Engineering Lead

<div align="center">

### **Abu Md. Selim**
*Founder & CTO, Inievo Technologies*

[![Portfolio](https://img.shields.io/badge/Portfolio-inievo.com-black?style=flat-square&logo=browser)](https://inievo.com)
[![LinkedIn](https://img.shields.io/badge/Connect-LinkedIn-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/aabumdselim)
[![GitHub](https://img.shields.io/badge/Follow-GitHub-181717?style=flat-square&logo=github)](https://github.com/abumdselim)

</div>

---

<div align="center">

**The Chattala** — Engineered for Resilience. Built for Community.
*© 2026 [Inievo Technologies](https://inievo.com). All rights reserved.*

</div>
gram-mishuabcde-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/mishuabcde)
[![GitHub](https://img.shields.io/badge/GitHub-abumdselim-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/abumdselim)

</div>

---

<div align="center">

**The Chattala** — Built for Chittagong. Engineered for the future.

*© 2026 [Inievo Technologies](https://inievo.com). All rights reserved.*

</div>
