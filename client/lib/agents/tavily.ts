import { tavily, type TavilyClient } from '@tavily/core';
import { readFileSync } from 'fs';
import { join } from 'path';

let _client: TavilyClient | null = null;

function readEnvFile(file: string): Record<string, string> {
  try {
    const txt = readFileSync(join(process.cwd(), file), 'utf8');
    const out: Record<string, string> = {};
    for (const raw of txt.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function resolveApiKey(): string {
  const fromEnv = process.env.TAVILY_API_KEY;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const local = readEnvFile('.env.local');
  if (local.TAVILY_API_KEY) return local.TAVILY_API_KEY;
  const env = readEnvFile('.env');
  if (env.TAVILY_API_KEY) return env.TAVILY_API_KEY;
  throw new Error('TAVILY_API_KEY is not set');
}

export function getTavily(): TavilyClient {
  if (_client) return _client;
  _client = tavily({ apiKey: resolveApiKey() });
  return _client;
}

export async function search(query: string, maxResults = 5): Promise<string> {
  const client = getTavily();
  const response = await client.search(query, {
    searchDepth: 'advanced',
    maxResults,
  });
  return response.results
    .map((r) => `### ${r.title}\n${r.url}\n${r.content}`)
    .join('\n\n');
}
