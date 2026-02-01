# GRACE-X AI™ Deployment Guide

This guide describes how to deploy the GRACE-X AI™ ecosystem for production use.

## 1. Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **API Keys**: You need valid API keys for:
  - LLM Provider (OpenAI, Anthropic, or OpenRouter)
  - Sports Data (Football-Data.org, RapidAPI, etc. - Optional but recommended for Sport module)

## 2. Installation

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 3. Configuration

1. Locate the `.env` file in the `server` directory.
2. If it doesn't exist, copy `env.example.txt` to `.env`.
3. Open `.env` and fill in your API keys.
   - Set `LLM_PROVIDER` (e.g., `openai` or `anthropic`).
   - Add the corresponding API Key (e.g., `OPENAI_API_KEY`).
   - Configure Sports API keys if needed.

## 4. Production Start

To start the system in production mode (which serves both the backend API and the frontend UI):

**Windows:**
1. Navigate to the `server` directory.
2. Run `start_production.bat`.

**Linux/Mac:**
1. Navigate to the `server` directory.
2. Run:
   ```bash
   NODE_ENV=production npm start
   ```

## 5. Accessing the Application

Once started, open your web browser and go to:
http://localhost:3000

This will load the main GRACE-X Boot Interface.

## 6. Deploying on Render

- **Root Directory**: Leave empty. The repo root runs `npm run start` (which runs the server and serves the frontend).
- **Health Check Path**: Use `/health` or `/healthz` (both are supported).
- **Environment variables**: Set in Render **Environment** (not in a `.env` file). No `.env` is deployed. Add at least:
  - `OPENAI_API_KEY` (or `API_KEY`) for the Brain
  - Any Sport/API keys if you use those modules (e.g. `FOOTBALL_API_KEY`, `RACING_*`).

## 7. Troubleshooting

- **"Module not found"**: Ensure you ran `npm install` in the `server` directory.
- **"API Error"**: Check your `.env` file (local) or Render Environment (production) for correct API keys.
- **"Port in use"**: Change the `PORT` in `.env` if 3000 is taken.
