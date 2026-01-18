# AI Chatting Platform

An AI chat application built with the **T3 Stack** (Next.js, tRPC, Prisma, Tailwind) and **Vercel AI SDK**.

This platform provides a rich, immersive environment for users to interact with AI characters using custom personas, dynamic scenarios, and advanced chat features.

## 🚀 Key Features

### 🎭 Identity & Persona Management
-   **User Personas**: Create multiple personas for yourself (e.g., "The Detective", "The Space Marine") to use in different chats.
-   **Character Management**: Create detailed AI characters with:
    -   **Avatars**: Visual representation for immersion.
    -   **Bio/Backstory**: Deep context for the AI to embody.
    -   **Greetings**: Unique starting messages to kick off the scene.

### 💬 Advanced Chat Interface
-   **Immersive UI**: Split view with chat history on the left and controls/personas on the right.
-   **Edit & Delete**: Full control over the narrative. Edit any message (User or AI) or delete mistakes to steer the story.
-   **Rich Styling**:
    -   *italics* are gray for actions/thoughts.
    -   "Quotes" are orange for dialogue.
    -   Markdown support for complex formatting.
-   **Dynamic Context**: The system automatically injects:
    1.  Global Instructions (Main Prompt)
    2.  User Persona Context
    3.  Character Persona Context
    4.  Scenario Details
    5.  Chat History

### ⚙️ Global Control
-   **Model Selection**: Switch between different LLMs (via NVIDIA NIM or OpenAI compatible APIs).
-   **System Prompts**: Define global rules that apply to all characters (e.g., "Always write in third person").
-   **API Key Management**: Securely manage your AI provider keys.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
-   **Database**: PostgreSQL (Neon) with Prisma ORM
-   **API**: tRPC (End-to-end typesafe APIs)
-   **Auth**: NextAuth.js (v5 Beta)
-   **AI**: Vercel AI SDK + NVIDIA NIM (DeepSeek, Llama 3) / OpenAI

## 🔮 Future Plans

-   **Lorebooks / World Info**: Selective context injection based on keywords.
-   **Group Chats**: Chat with multiple AI characters simultaneously.
-   **Voice Mode**: TTS (Text-to-Speech) and STT (Speech-to-Text) integration.
-   **Image Generation**: Generate character avatars and scene backgrounds on the fly.
-   **Public Sharing**: Share scenarios and characters with the community.


*Built with ❤️ by AH Munna*
