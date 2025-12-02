# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bing SEO Agent - A React + Node.js + ThorData API SEO keyword research and analysis tool that helps find high-probability ranking opportunities through automated keyword mining and SERP analysis using Bing search data.

## Key Commands

### Development
- `npm run dev:all` - Start both frontend (port 3000) and backend (port 3001) simultaneously
- `npm run dev` - Start frontend only (Vite dev server on port 3000)
- `npm run server` - Start backend only (Express server with hot reload on port 3001)
- `npm run build` - Build frontend for production

### Production
- `npm run server:prod` - Start backend in production mode

## Architecture

### Frontend (React + TypeScript + Vite)
- **Main Component**: `App.tsx` - Single-page application with three-step workflow (input → mining → results)
- **State Management**: React hooks with localStorage for archives and agent configs
- **UI Framework**: Tailwind CSS with Lucide React icons
- **Key Features**: Multi-language support (EN/ZH), real-time agent thoughts, SERP preview, CSV export

### Backend (Node.js + Express + TypeScript)
- **Entry Point**: `server/index.ts` - Express server with CORS and JSON middleware
- **API Endpoints**: 
  - `/health` - Health check
  - `/api/generate-keywords` - Generate keyword candidates
  - `/api/analyze-ranking` - Analyze ranking probability
  - `/api/deep-dive-strategy` - Generate detailed SEO strategy
  - `/api/translate-*` - Translation services
- **Service Layer**: `server/services/thordata.ts` - ThorData SERP API integration

### Core Types (`types.ts`)
- `KeywordData` - Complete keyword analysis structure
- `SEOStrategyReport` - Deep dive strategy report format
- `AppState` - Frontend application state
- `AgentConfig` - Saved agent configuration

### Key Algorithms
- **Mining Loop**: Iterative keyword generation → SERP analysis → probability scoring
- **Blue Ocean Detection**: Keywords with <20 search results
- **Ranking Probability**: HIGH/MEDIUM/LOW based on competitor analysis
- **Agent Thoughts**: Real-time processing feedback with visual SERP evidence

## Environment Setup

Create `.env` file with:
```
THORDATA_API_TOKEN=your_thordata_api_token
THORDATA_API_URL=https://scraperapi.thordata.com/request
PORT=3001
```

## Development Notes

- No test framework configured
- No linting setup
- Hot reload enabled for both frontend and backend
- LocalStorage used for archives and agent configurations
- Multi-language UI support (English/Chinese)
- Real-time SERP snippets visible in agent thoughts stream