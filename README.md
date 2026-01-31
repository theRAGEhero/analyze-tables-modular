# analyze-tables-modular

AI-powered deliberation analysis platform that aggregates transcriptions from multiple rounds and analyzes them using Gemini AI to identify conflicts, agreements, and key themes.

## Features

- **Multi-Round Analysis**: Select and aggregate transcriptions from multiple deliberation rounds
- **AI-Powered Insights**: Uses Google's Gemini AI to analyze conversations
- **Customizable Prompts**: Choose from preset analysis types or write custom prompts
- **Conflict & Agreement Detection**: Automatically identifies points of consensus and disagreement
- **Real-Time Processing**: Aggregates data from Deepgram-modular and analyzes in real-time

## Prerequisites

- Node.js 18+ and npm
- Deepgram-modular running on port 3000 (provides deliberation rounds data)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from template:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Gemini API key to `.env.local`:
   - Get your API key from https://aistudio.google.com/app/apikey
   - Replace `your_gemini_api_key_here` with your actual key

5. Ensure Deepgram-modular is running:
   ```bash
   # In another terminal
   cd ../Deepgram-modular
   npm run dev
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3001](http://localhost:3001) in your browser

## Environment Variables

See `.env.example` for required configuration:

- `DEEPGRAM_API_URL`: URL of the Deepgram-modular API (default: http://localhost:3000)
- `NEXT_PUBLIC_DEEPGRAM_API_URL`: Public URL for client-side API calls
- `DR_ORGANIZER_API_URL`: URL of the DR-Organizer API (default: http://localhost:3005)
- `DEMOCRACY_ROUTES_API_URL`: URL of the Democracy Routes API (default: http://localhost:3015)
- `DEMOCRACY_ROUTES_WORKFLOW_API_KEY`: API key for Democracy Routes workflow endpoints (x-api-key)
- `DEMOCRACY_ROUTES_ANALYSIS_WEBHOOK_URL`: Base URL for saving plan analyses back to Democracy Routes (e.g., `https://democracyroutes.com`)
- `VOSK_API_URL`: URL of the VOSK-modular API (default: http://localhost:3009)
- `OLLAMA_API_URL`: URL of the Ollama API (default: http://localhost:11434)
- `OLLAMA_MODEL`: Ollama model name (e.g., deepseek-r1:1.5b)
- `GEMINI_API_KEY`: Your Gemini API key (required, server-side only)
- `ANALYZE_TABLES_API_KEY`: Shared API key for plan analysis requests (x-api-key)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LOG_JSON`: Set to `true` for JSON logs
- `LOG_FILE`: Optional log file path for appending logs
- `PORT`: Port to run the application on (default: 3001)

## Usage

1. **View Rounds**: The home page displays all available deliberation rounds from Deepgram-modular
2. **Select Rounds**: Use checkboxes to select multiple rounds for analysis
3. **Choose Analysis Type**: Select from preset prompts or write a custom analysis prompt:
   - Conflicts & Agreements (default)
   - Summary
   - Sentiment Analysis
   - Recurring Themes
4. **Analyze**: Click "Analyze" to aggregate transcriptions and get AI insights
5. **View Results**: See AI-generated analysis with identified conflicts, agreements, and patterns

## How It Works

1. **Data Aggregation**: Fetches transcriptions from selected rounds via Deepgram-modular API
2. **Transcription Merging**: Combines all contributions, participants, and statistics
3. **AI Analysis**: Sends aggregated data to Gemini API with custom prompt
4. **Results Display**: Shows AI-generated insights with metadata

## Project Structure

```
analyze-tables-modular/
├── app/
│   ├── api/
│   │   ├── analyze/         # AI analysis endpoint
│   │   └── rounds/          # Proxy routes to Deepgram-modular
│   └── page.tsx             # Main UI with table and analysis panel
├── components/
│   ├── analysis/            # Analysis components
│   │   ├── PromptEditor.tsx
│   │   └── ResultsDisplay.tsx
│   └── rounds/
│       └── RoundsTable.tsx  # Round selection table
├── lib/
│   ├── aggregation/         # Transcription merging logic
│   ├── api/
│   │   ├── client.ts        # Client-side API calls
│   │   └── gemini.ts        # Gemini API integration
│   └── prompts/             # Default analysis prompts
└── types/                   # TypeScript definitions
```

## API Integration

### Deepgram-modular Endpoints (via proxy):
- `GET /api/rounds` - Fetch all rounds
- `GET /api/rounds/[roundId]/transcription` - Fetch round transcription

### Internal Endpoints:
- `POST /api/analyze` - Analyze aggregated transcriptions with Gemini AI

## Security

⚠️ **CRITICAL**: Never commit `.env.local` or any file containing API keys!

The `.gitignore` file is configured to exclude:
- `.env.local` and all `.env*.local` files
- API keys and credentials
- Build artifacts and logs

**API Key Safety:**
- Gemini API key is server-side only (not exposed to browser)
- All AI analysis goes through Next.js API route (`/api/analyze`)
- Client never directly accesses Gemini API

## Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: Google Gemini API (gemini-2.5-flash model)
- **Data Source**: Deepgram-modular API

## Development

```bash
# Type checking
npm run type-check

# Development server
npm run dev

# Production build
npm run build
npm start
```

## Docker

```bash
docker build -t analyze-tables-modular .
docker run --rm -p 3001:3001 \
  -e DEEPGRAM_API_URL=http://host.docker.internal:3000 \
  -e NEXT_PUBLIC_DEEPGRAM_API_URL=http://host.docker.internal:3000 \
  -e DR_ORGANIZER_API_URL=http://host.docker.internal:3005 \
  -e VOSK_API_URL=http://host.docker.internal:3009 \
  -e OLLAMA_API_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL=deepseek-r1:1.5b \
  -e GEMINI_API_KEY=your_gemini_api_key_here \
  analyze-tables-modular
```

## Dependencies

This application requires Deepgram-modular to be running to provide:
- Deliberation rounds data
- Transcription data with speaker identification
- Participant and contribution metadata

## License

[Your License Here]
