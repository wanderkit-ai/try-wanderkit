import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

let _client: Anthropic | null = null;

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

function resolveApiKey(): string | undefined {
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  // Fallback: a system-level empty value can override .env in Next.js. Read directly.
  const local = readEnvFile('.env.local');
  if (local.ANTHROPIC_API_KEY) return local.ANTHROPIC_API_KEY;
  const env = readEnvFile('.env');
  if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
  return undefined;
}

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set (checked process.env, .env.local, .env)');
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export const MODEL = 'claude-sonnet-4-6';
