<div align="center">

<img src="https://res.cloudinary.com/dp5ap39r6/image/upload/v1777768013/logo_tuvebp.png" alt="The Chattala" width="260" />
thechallata.com
<br/><br/>

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=vercel&logoColor=white)](https://github.com/abumdselim/thechattala)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)](./LICENSE)
[![Made with ❤️](https://img.shields.io/badge/Made%20in-Chittagong-FF6B35?style=for-the-badge)](https://github.com/abumdselim/thechattala)

</div>

---

## 🌏 Vision & Mission

**The Chattala** is not merely an application — it is a **digital covenant with a city**.

Chittagong, Bangladesh's commercial capital and home to millions, has long deserved a unified digital infrastructure that mirrors its complexity, its humanity, and its extraordinary energy. **The Chattala** is that infrastructure: a **pioneering hyperlocal city platform** built from the ground up to serve the streets, businesses, communities, and citizens of Chittagong in a single, cohesive digital ecosystem.

> *"The Chattala is an attempt to map the existential needs of a city onto the precision of code."*
> — **Abu Md. Selim**, Founder & CTO

### What We Are Building

| Pillar | Description |
|--------|-------------|
| 🏘️ **Community Hub** | A real-time, location-aware social layer for neighbourhoods — where residents post, connect, and build trust |
| 🛒 **Hyperlocal Marketplace** | A verified directory of local shops and their products, reducing the gap between the physical bazaar and the digital world |
| 🧰 **Expert Services Network** | A platform for skilled professionals — doctors, engineers, designers — to offer and manage their services |
| 🚨 **Emergency Lifeline** | Rapid-access emergency services, SOS features, and critical city contacts for moments that matter most |
| 🤝 **Social Trust Graph** | A neighbour connection system built on verified identities and community reputation |

The Chattala is designed to scale into the **unified operating system for Chittagong's digital economy**.

---

## ⚡ Tech Stack

<div align="center">

[![Skills](https://skillicons.dev/icons?i=nextjs,ts,tailwind,postgres,prisma,vercel&perline=6)](https://skillicons.dev)

</div>

<br/>

| Technology | Role | Why We Chose It |
|------------|------|-----------------|
| **Next.js 15** (App Router) | Core Framework | Server Components, Edge Runtime, automatic code-splitting, and best-in-class SEO via `Metadata` API. The App Router paradigm aligns perfectly with our route-heavy architecture |
| **TypeScript 5** | Language | End-to-end type safety across API routes, Prisma queries, and React components eliminates an entire class of runtime bugs |
| **Tailwind CSS** | Styling | Utility-first approach enables rapid, consistent, responsive UI development without leaving component files. Dark mode support is native and zero-overhead |
| **PostgreSQL via Neon DB** | Database | Serverless PostgreSQL with connection pooling eliminates cold-start issues. Neon's branching model makes safe schema migrations possible in production |
| **Prisma ORM** | Database Layer | Type-safe query builder generated directly from our schema. Schema migrations are declarative, version-controlled, and human-readable |
| **UploadThing** | File Uploads | Modern file upload infrastructure with a custom `onUploadComplete` hook that automatically **deletes stale profile images from the CDN server** before inserting the new URL — real storage cost optimization |
| **NextAuth.js v5** | Authentication | Secure, session-based authentication with credentials provider, JWT strategy, and server-side session callbacks for enriching the user token |
| **Framer Motion** | Animations | Production-grade animation library powering the splash screen, page transitions, and micro-interactions throughout the platform |

---

## ✨ Key Features

### 🎬 Premium Animated Splash Screen
A full-screen, session-aware entry experience using Framer Motion featuring:
- **Ambient radial glow** and a **breathing pulse ring** behind the brand logo
- **Spring-physics logo entry** with a sonar-wave outer ring
- **Staggered typewriter-style tagline** fade-in
- Automatically shown **once per browser session** via `sessionStorage` — never intrusive

### 🌗 Flawless Dark / Light Mode
Theme switching is powered by a custom `ThemeProvider` with:
- **Dual-image `<Logo />` component** — light and dark assets rendered simultaneously, toggled purely via Tailwind's `dark:` utilities — **zero hydration flicker**
- Persistent theme preference via `localStorage`

### 👤 Dynamic Profile Management
- Real-time avatar uploads via **UploadThing**
- Server-side **automatic cleanup**: when a user uploads a new profile photo, the previous image is deleted from UploadThing's CDN using `UTApi.deleteFiles()` before the DB is updated
- Session refresh via `NextAuth update()` after profile changes — UI reflects changes instantly without a page reload

### 🔐 Secure Authentication & Identity
- IP-based **rate limiting** (5 registration attempts/hour) on the `/api/auth/register` route
- **Unique username enforcement** at the database level via Prisma unique constraints
- Protected routes via `middleware.ts` using `getToken()` — Edge Runtime compatible

### 🏘️ Neighbour Social Graph
- Send, accept, and reject neighbour connection requests
- ACCEPTED connections form a bilateral trust graph queryable by either party
- Full privacy — all endpoints require active authenticated sessions

### 🛡️ Admin Control Panel
- Role-based access (`isAdmin` flag on the User model)
- Admin-only API routes for user verification, shop approval, and service provider endorsement

---

## 🗂️ Project Architecture

```
thechattala/
├── prisma/
│   └── schema.prisma          # Single source of truth for the data model
│
├── src/
│   ├── app/                   # Next.js App Router — pages & API routes
│   │   ├── api/               # All server-side route handlers (REST-style)
│   │   │   ├── auth/          # NextAuth & Registration
│   │   │   ├── posts/         # Community feed CRUD
│   │   │   ├── neighbours/    # Social trust graph
│   │   │   ├── shops/         # Marketplace endpoints
│   │   │   ├── services/      # Expert service endpoints
│   │   │   ├── admin/         # Admin-only management routes
│   │   │   └── uploadthing/   # File upload handler & storage optimization
│   │   └── (pages)/           # Route segments: dashboard, community, profile…
│   │
│   ├── components/            # Reusable UI components
│   │   ├── brand/             # <Logo /> — smart dual-image theme-aware logo
│   │   ├── splash/            # SplashScreen + SplashProvider
│   │   ├── auth/              # Login & Signup forms
│   │   ├── dashboard/         # Sidebar, bottom nav, layout shell
│   │   ├── community/         # PostCard, CreatePost feed
│   │   ├── profile/           # ProfileView with UploadThing integration
│   │   ├── market/            # Marketplace & order modals
│   │   └── ui/                # shadcn/ui primitives (Button, Dialog, etc.)
│   │
│   ├── hooks/                 # Client-side state providers
│   │   ├── use-auth.tsx       # NextAuth session mapped to our User type
│   │   ├── use-theme.tsx      # Dark/Light theme provider
│   │   └── use-community.tsx  # Community data & post actions
│   │
│   └── lib/                   # Core utilities & server helpers
│       ├── db.ts              # getDb() factory — serverless Prisma connection
│       ├── auth.ts            # NextAuth config with callbacks
│       └── uploadthing.ts     # UploadButton & UploadDropzone exports
│
└── next.config.ts             # remotePatterns for Cloudinary & UploadThing CDNs
```

### Design Principles

- **Server-first** — API logic lives in route handlers, not client components
- **Zero mock data in production** — all UI is driven by real Neon DB queries
- **`getDb()` pattern** — a factory function that creates a fresh Prisma client per request, preventing connection saturation in a serverless environment
- **`force-dynamic`** on all authenticated pages — prevents static pre-rendering of private routes at build time

---

## 🚀 Running Locally

### Prerequisites
- Node.js `>= 18.x`
- A [Neon DB](https://neon.tech) PostgreSQL database
- An [UploadThing](https://uploadthing.com) account
- An `AUTH_SECRET` (generate with `openssl rand -base64 32`)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/abumdselim/thechattala.git
cd thechattala

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
```

Populate `.env.local` with:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="your-secret-here"
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
```

```bash
# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Start the development server
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### Other Scripts

```bash
npm run build      # Production build
npm run start      # Start production server
npx prisma studio  # Visual database editor
```

---

## 🚢 Deployment

The Chattala is configured for **one-click deployment on Vercel**.

1. Push your code to GitHub (already done ✅)
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Deploy — Vercel's Edge Network handles the rest

> **Note:** Ensure `DATABASE_URL` uses the **pooled** Neon connection string and `DIRECT_URL` uses the **direct** connection string for Prisma migrations.

---

## 👨‍💻 Developer

<div align="center">

# **ABU MD. SELIM**

**Founder** — [Inievo Technologies](https://inievo.com)

<br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-aabumdselim-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/aabumdselim)
[![Facebook](https://img.shields.io/badge/Facebook-mishuabcde-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/mishuabcde)
[![Instagram](https://img.shields.io/badge/Instagram-mishuabcde-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/mishuabcde)
[![GitHub](https://img.shields.io/badge/GitHub-abumdselim-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/abumdselim)

</div>

---

<div align="center">

**The Chattala** — Built for Chittagong. Engineered for the future.

*© 2026 [Inievo Technologies](https://inievo.com). All rights reserved.*

</div>
