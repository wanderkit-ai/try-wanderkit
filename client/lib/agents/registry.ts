import { BaseAgent, type AgentConfig } from './base';
import type { AgentName } from '@/lib/types';

const itinerary: AgentConfig = {
  name: 'itinerary',
  displayName: 'Itinerary Planner',
  emoji: '🗺️',
  description:
    'Searches flights, hotels, and activities in parallel, then AI-ranks the results and builds a complete day-by-day itinerary with specific recommendations and cost breakdown.',
  systemPrompt: '', // system prompt lives server-side in server/agents/definitions/itinerary.py
  tools: [
    'amadeus_search_flights',
    'skyscanner_search_flights',
    'kiwi_search_flights',
    'booking_search_hotels',
    'amadeus_search_hotels',
    'viator_search_activities',
    'tripadvisor_activities',
    'openweathermap_forecast',
    'openmeteo_forecast',
    'get_trip',
    'preview_itinerary',
    'save_itinerary',
    'build_itinerary',
    'search_operators',
  ],
  starters: [
    'Plan a 7-day trip from New York to Marrakech in October',
    'I want to do the Annapurna Circuit — fly from London, mid-November',
    'Plan a beach & wellness week in Nosara, Costa Rica for 2 people',
  ],
};

const scout: AgentConfig = {
  name: 'scout',
  displayName: 'Scout Operators',
  emoji: '🧭',
  description:
    'Searches the web for real local operators — scrapes listicles and operator homepages to extract contact info, then adds vetted operators directly to the system.',
  systemPrompt: '', // system prompt lives server-side in server/agents/definitions/scout.py
  tools: [
    'list_trips',
    'get_trip',
    'search_operators',
    'web_search_operators',
    'firecrawl_scrape',
    'add_operator',
  ],
  starters: [
    'Find operators for the Patagonia W-Trek',
    'Scout operators for the Marrakech culinary trip',
    'What operators do we have in Nepal?',
  ],
};

export const AGENTS: Partial<Record<AgentName, BaseAgent>> = {
  itinerary: new BaseAgent(itinerary),
  scout: new BaseAgent(scout),
};

export const AGENT_LIST: AgentConfig[] = [itinerary, scout];

export function getAgent(name: string): BaseAgent | undefined {
  return AGENTS[name as AgentName];
}
