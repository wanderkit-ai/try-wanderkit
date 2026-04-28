import { notFound } from 'next/navigation';
import { AGENT_LIST } from '@/lib/agents/registry';
import { AgentChat } from '@/components/agent-chat';
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
    ? `Build the itinerary for trip ${searchParams.trip}`
    : undefined;

  return (
    <>
      <PageHeader
        icon={config.emoji}
        title={config.displayName}
        crumbs={[{ label: 'Agents' }, { label: config.displayName }]}
        description={config.description}
      />
      <div className="px-12 pb-6">
        <AgentChat
          config={{
            name: config.name,
            displayName: config.displayName,
            description: config.description,
            emoji: config.emoji,
            starters: config.starters,
            toolCount: config.tools.length,
            initialMessage,
          }}
        />
      </div>
    </>
  );
}

export function generateStaticParams() {
  return AGENT_LIST.map((a) => ({ name: a.name }));
}
