import { getAnthropic, MODEL } from './anthropic';
import { toAnthropicTools, toolsFor, type ToolDef } from './tools';
import type { AgentName } from '@/lib/types';

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  description: string;
  emoji: string;
  systemPrompt: string;
  tools: string[];
  starters: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; name: string; input: any }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'done' }
  | { type: 'error'; message: string };

export class BaseAgent {
  config: AgentConfig;
  toolDefs: ToolDef[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.toolDefs = toolsFor(config.tools);
  }

  /**
   * Run the agent on a chat history. Yields stream events for the API route to forward.
   * Loops on tool_use blocks until the model stops calling tools.
   */
  async *run(history: ChatMessage[]): AsyncGenerator<StreamEvent> {
    const client = getAnthropic();

    // Build the conversation in Anthropic's content-block shape.
    const conversation: any[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const tools = toAnthropicTools(this.toolDefs);

    let safety = 0;
    while (safety++ < 8) {
      let response;
      try {
        response = await client.messages.create({
          model: MODEL,
          max_tokens: 1500,
          system: this.config.systemPrompt,
          tools: tools.length ? tools : undefined,
          messages: conversation,
        });
      } catch (e: any) {
        yield { type: 'error', message: e?.message ?? 'Anthropic API error' };
        return;
      }

      const assistantBlocks: any[] = [];
      const toolUses: { id: string; name: string; input: any }[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantBlocks.push({ type: 'text', text: block.text });
          yield { type: 'text', text: block.text };
        } else if (block.type === 'tool_use') {
          assistantBlocks.push(block);
          toolUses.push({ id: block.id, name: block.name, input: block.input });
          yield { type: 'tool_use', name: block.name, input: block.input };
        }
      }

      conversation.push({ role: 'assistant', content: assistantBlocks });

      if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
        yield { type: 'done' };
        return;
      }

      // Execute each tool and push results back as a single user message.
      const toolResults: any[] = [];
      for (const t of toolUses) {
        const def = this.toolDefs.find((d) => d.name === t.name);
        let result: unknown;
        try {
          result = def ? await def.handler(t.input) : { error: `Unknown tool ${t.name}` };
        } catch (e: any) {
          result = { error: e?.message ?? 'Tool failed' };
        }
        yield { type: 'tool_result', name: t.name, result };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: t.id,
          content: JSON.stringify(result),
        });
      }

      conversation.push({ role: 'user', content: toolResults });
    }

    yield { type: 'error', message: 'Agent exceeded maximum tool-loop depth.' };
  }
}
