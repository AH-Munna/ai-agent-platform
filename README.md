# Fullstack AI Agent Platform

![Project Status](https://img.shields.io/badge/Status-Active_Development-success)
![Tech Stack](https://img.shields.io/badge/Stack-T3_(Next.js_+_tRPC_+_Prisma)-blue)

A professional-grade AI platform architected to facilitate complex interactions between users and autonomous AI agents. Built with modern web standards, this platform supports real-time streaming, multi-agent collaboration, and deep persona management.

## 🚀 Project Overview

This application serves as a comprehensive ecosystem for:
-   **Immersive Roleplay**: Creating and interacting with highly detailed AI personas.
-   **Multi-Agent Agnostic Systems**: Orchestrating autonomous rooms where AI agents debate, collaborate, or roleplay scenarios without human intervention.
-   **Creative Writing Assistance**: Utilizing AI as dynamic co-authors with memory and context awareness.

## 🛠️ Technical Architecture

This project leverages the **T3 Stack** to ensure end-to-end type safety, scalability, and developer experience.

### Core Stack
-   **Frontend**: [Next.js 16](https://nextjs.org/) (App Router) for server-side rendering and performant client components.
-   **Styling**: **Tailwind CSS** paired with **shadcn/ui** for a responsive, accessible, and premium design system.
-   **API Layer**: **tRPC** for robust, type-safe communication between client and server, eliminating API glue code.
-   **Database**: **PostgreSQL** (via Neon) managed by **Prisma ORM** for reliable data modeling and migrations.

### AI & Intelligence
-   **Vercel AI SDK**: For standardized, stream-ready AI processing.
-   **Model Agnostic**: Integrated with **NVIDIA NIM** (DeepSeek, Llama 3) and OpenAI, allowing for flexible model switching based on cost/performance needs.
-   **Prompt Engineering**: Custom system prompt injection handling distinct layers of context: *Global Constraints > Character Persona > User Context > Scenario*.

## ✨ Key Features

### 1. Robust Persona System
-   **Deep Characterization**: Characters have distinctive avatars, bio-data, and static greeting logic.
-   **Identity Management**: Users can switch between multiple "User Personas" to interact with characters from different perspectives (e.g., interacting as a Detective vs. a Villain).

### 2. Real-Time Chat Experience
-   **Steerable Narrative**: Full control to edit or delete any message (User or AI) to guide the direction of the conversation.
-   **Rich Text Rendering**: Specialized parsing for *actions/thoughts* (gray italics) and "dialogue" (highlighted) to improve readability.
-   **Smart Context Injection**: Automates the retrieval and insertion of relevant character lore and scenario details into the LLM context window.

### 3. Autonomous Agent Rooms
-   **Observation Mode**: Create rooms where multiple AI agents interact autonomously based on a seed scenario.
-   **Supervisor Control**: The user acts as a "Director", observing the flow and intervening only when necessary to change the topic or add new constraints.

## 🔮 Roadmap & Future Engineering

-   **Vector Memory**: Integrating pgvector for long-term semantic memory retrieval (`RAG`).
-   **Voice synthesis**: Implementing TTS/STT for hands-free interaction.
-   **Deployment**: Optimizing for edge runtime deployment.

---
*Built by [Ahmed Munna](https://github.com/AH-Munna)*