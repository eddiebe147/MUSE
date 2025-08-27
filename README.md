# MUSE - AI-Driven Story Intelligence Platform

**AI-powered writing platform combining traditional storytelling tools with cutting-edge artificial intelligence assistance.**

MUSE transforms the creative writing process through intelligent story development, professional script formatting, and collaborative AI guidance - making professional-grade writing accessible to everyone.

## 🎬 Key Features

- **Four-Phase Story Development**: Structured workflow from concept to production-ready script
- **AI-Powered Writing Assistant**: Claude integration for intelligent story guidance and suggestions  
- **Professional Script Formatting**: Support for screenplays, treatments, beat sheets, and novel chapters
- **Transcript Analysis**: Transform brainstorming sessions into structured story elements
- **Production Bible**: Comprehensive project documentation and world-building tools
- **Writing Canvas**: Professional editing environment with guidelines and real-time statistics

## 📁 Monorepo Structure

- **apps/muse**: Next.js application (main writing platform)
- **packages/db**: Drizzle schema & database migrations

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, React
- **Styling**: TailwindCSS, Shadcn UI, Lucide Icons
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **AI Integration**: Vercel AI SDK (Claude, OpenAI, Groq)
- **Search**: Tavily API for web research

## 🚀 Setup

From the project root:

1. **Clone & install:**
   ```bash
   git clone https://github.com/eddiebe147/MUSE.git
   cd MUSE
   pnpm install
   ```

2. **Copy environment files:**
   ```bash
   cp packages/db/.env.example packages/db/.env
   cp apps/muse/.env.example apps/muse/.env
   ```
   
3. **Configure environment variables:**
   - Set **DATABASE_URL** in both .env files
   - In `apps/muse/.env`, add:
     ```dotenv
     BETTER_AUTH_SECRET=""        # openssl rand -hex 32
     BETTER_AUTH_URL="http://localhost:3000"
     DISCORD_WEBHOOK_URL=""
     
     # AI Provider Keys (choose your preferred providers):
     GROQ_API_KEY=""              # Fast, cost-effective
     OPENAI_API_KEY=""            # GPT-4 support
     ANTHROPIC_API_KEY=""         # Claude integration (recommended)
     ```

4. **Start the database:**
   ```bash
   docker compose up -d
   ```

5. **Apply database schema:**
   ```bash
   pnpm db:push
   ```

6. **Run the application:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Management

- **Start database**: `docker compose up -d`
- **Stop database**: `docker compose down`
- **Sync schema**: `pnpm db:push`
- **Generate migration**: `pnpm db:generate`
- **Apply migrations**: `pnpm db:migrate`
- **Database studio**: `pnpm db:studio`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper commit messages
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Apache License 2.0. See [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the MUSE team | Powered by AI collaboration**
