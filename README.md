# AI Agent Platform 🤖

A modern AI chat platform built with the T3 Stack, featuring immersive conversations with AI characters, AI-to-AI room dialogues, and a stunning animated dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![tRPC](https://img.shields.io/badge/tRPC-API-398CCB)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)

## Live
[website](https://ai-ah-munna.vercel.app)

## ✨ Features

### 🎭 AI Character Chat
- Create and customize AI characters with unique personalities
- Engage in contextual conversations with custom system prompts
- Real-time streaming responses with beautiful markdown rendering

### 🏠 AI Rooms
- Watch two AI characters converse with each other
- Alternating dialogue system with configurable turn counts
- Real-time streaming with proper character positioning

### 👤 Custom Personas
- Define your user persona for personalized interactions
- Configure how AI characters perceive and respond to you

### ⚙️ Flexible Configuration
- Bring your own API key (NVIDIA NIM, OpenAI, or any OpenAI-compatible API)
- Model selection dropdown with live API fetch
- Global system prompts for consistent behavior

### 🎨 Modern UI/UX
- Animated dashboard with Framer Motion
- Glassmorphism design with gradient accents
- Responsive layout for all devices
- Dark mode optimized

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL + Prisma ORM |
| **API Layer** | tRPC |
| **Auth** | NextAuth.js |
| **AI Integration** | OpenAI SDK (NVIDIA NIM compatible) |
| **Animations** | Framer Motion |
| **UI Components** | Radix UI + shadcn/ui |

## 📸 Screenshots

*Dashboard with animated components and developer profile*
![](/public/dashboard.png)
![](/public/character_edit.png)
![](/public/chat.png)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── page.tsx        # Animated portfolio dashboard
│   │   ├── chat/           # AI character chat
│   │   ├── room/           # AI-to-AI rooms
│   │   ├── characters/     # Character management
│   │   ├── personas/       # User persona management
│   │   └── settings/       # API configuration
│   └── api/                # API routes
├── components/             # Reusable UI components
│   ├── dashboard/          # Dashboard-specific components
│   └── ui/                 # shadcn/ui components
├── server/                 # Server-side code
│   ├── api/                # tRPC routers
│   └── db.ts               # Prisma client
└── trpc/                   # tRPC setup
```

## 👨‍💻 Developer

**Ahsanul Haque Munna**  
Fullstack Developer | AI Enthusiast | Problem Solver

- 🌐 [Portfolio](https://ah-munna.github.io)
- 💻 [GitHub](https://github.com/ah-munna)
- 📧 [ahmunna.developer@gmail.com](mailto:ahmunna.developer@gmail.com)

### Experience
- Fullstack Web Developer at Nexis Limited (2022-2024)
- Independent Software Developer & Automation Engineer
- ICPC Asia Regional Participant

### Skills
Python, JavaScript, TypeScript, React, Next.js, Django, Prisma, PostgreSQL, Docker, Git

## 📝 License

MIT License - feel free to use this project for learning or as a template.

---

⭐ Star this repo if you found it helpful!
