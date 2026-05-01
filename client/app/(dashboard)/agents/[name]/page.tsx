import { notFound } from 'next/navigation';
import { AGENT_LIST } from '@/lib/agents/registry';
import { AgentChat } from '@/components/agent-chat';
import { ItineraryAgentLayout } from '@/components/itinerary-agent-layout';
import { ScoutAgentLayout } from '@/components/scout-agent-layout';
import { PageHeader } from '@/components/page-header';

export default function AgentPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { trip?: string; message?: string };
}) {
  const config = AGENT_LIST.find((a) => a.name === params.name);
  if (!config) notFound();

  const initialMessage = searchParams.message
    ? decodeURIComponent(searchParams.message)
    : searchParams.trip
    ? params.name === 'scout'
      ? `Find operators for trip ${searchParams.trip}`
      : `Research and build the itinerary for trip ${searchParams.trip}`
    : undefined;

  const agentConfig = {
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    emoji: config.emoji,
    starters: config.starters,
    toolCount: config.tools.length,
    initialMessage,
  };

  return (
    <>
      <PageHeader
        icon={config.emoji}
        title={config.displayName}
        crumbs={[{ label: 'Agents' }, { label: config.displayName }]}
        description={config.description}
      />
      {config.name === 'itinerary' ? (
        <div className="px-6 pb-6">
          <ItineraryAgentLayout config={agentConfig} />
        </div>
      ) : config.name === 'scout' ? (
        <div className="px-6 pb-6">
          <ScoutAgentLayout config={agentConfig} />
        </div>
      ) : (
        <div className="px-12 pb-6">
          <AgentChat config={agentConfig} />
        </div>
      )}
    </>
  );
}

export function generateStaticParams() {
  return AGENT_LIST.map((a) => ({ name: a.name }));
}
