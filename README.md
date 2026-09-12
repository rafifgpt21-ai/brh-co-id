# BRH - Arsip Intelektual & Diskusi

BRH is a premium, high-performance platform dedicated to archiving and discussing intellectual works, including books, journals, articles, and opinions. Built with a modern tech stack, it provides a seamless reading experience and a robust administration interface for content creators.

## ✨ Key Features

- **Intellectual Archive**: A curated collection of books, journals, articles, and opinions.
- **Dynamic Content Management**: Block-based editor (Tiptap) supporting text, imagery, video, and PDF embeds.
- **Premium User Experience**:
  - Immersive animations powered by **Framer Motion**.
  - Smooth kinetic scrolling via **Lenis**.
  - Highly responsive UI optimized for all devices with Tailwind CSS 4.
- **Integrated PDF Viewer**: High-performance PDF rendering with secure proxying.
- **Secure Authentication**: Advanced auth system using **NextAuth v5** and **Prisma**.
- **Admin Dashboard**: Comprehensive management for posts, users, and system settings.
- **Security-First Architecture**:
  - Persistent rate limiting on sensitive endpoints.
  - SSRF mitigation for external asset loading.
  - Strict runtime validation with Zod.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Lenis Scroll](https://lenis.darkroom.engineering/)
- **Content Editor**: [Tiptap](https://tiptap.dev/)
- **File Storage**: [Uploadthing](https://uploadthing.com/)
- **Validation**: [Zod](https://zod.dev/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance (Local or Altas)
- Uploadthing account (for media storage)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd brh-co-id
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root and add your configuration (see `.env.example` if available or contact the team for a template).

   Agenda BRH address autocomplete requires a server-side Geoapify key:
   ```bash
   GEOAPIFY_API_KEY=your_geoapify_api_key
   ```

4. Sync Database Schema:
   ```bash
   npx prisma db push
   ```

5. Seed Initial Data (Optional):
   ```bash
   # Seed administrator account
   npm run seed

   # Seed sample posts for development
   npm run seed:posts
   ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

- `app/`: Next.js App Router (pages, API routes, layouts).
- `components/`: Reusable React components organized by feature.
- `lib/`: Shared utilities, server actions, and core logic.
- `prisma/`: Database schema and configuration.
- `public/`: Static assets and icons.
- `scripts/`: Maintenance and seeding scripts.
- `types/`: Global and local TypeScript definitions.

## 🛡️ Security & Performance

- **Rate Limiting**: Protected against brute-force attacks via MongoDB-backed rate limits.
- **Image Optimization**: Fully utilized `next/image` for responsive and performant visuals.
- **SSRF Protection**: Secure proxying for external content (PDFs, etc.).
- **Build Optimization**: Heavy client-side components are dynamically imported to minimize initial bundle size.

## First-party analytics

Analytics is stored in the existing MongoDB database and does not require Vercel Analytics. It is disabled by default. To enable it in production, set:

```bash
ANALYTICS_ENABLED=true
ANALYTICS_HASH_SECRET=use-a-long-random-secret-that-is-not-auth-secret
```

After updating the Prisma schema, prepare the database in this order:

```bash
npx prisma generate
npm run analytics:indexes
```

The index setup command is idempotent, creates the analytics collections when needed, and installs all required indexes—including the TTL index that removes anonymous raw page-view events after 13 months. Lifetime page totals remain available. Run `npx prisma db push` separately only when synchronizing the repository's complete schema, because it may surface unrelated drift in existing collections. MongoDB must run as a replica set so the event and lifetime counter can be committed atomically.

The tracker stores pseudonymous visitor/session hashes, coarse device information, sanitized campaign fields, and limited referrer data. It does not store raw IP addresses or authenticated user data. The built-in privacy control and Do Not Track support do not replace a review of the site's privacy policy and applicable requirements.

---
Built with ❤️ for the Intellectual Community.
