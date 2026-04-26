import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { anthropic, ITINERARY_SYSTEM_PROMPT } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';

const schema = z.object({
  dropId: z.string().optional(),
  destination: z.string().min(1),
  country: z.string().min(1),
  durationDays: z.number().int().positive(),
  departureDate: z.string(),
  tripStyle: z.string().optional(),
  fitnessLevel: z.string().optional(),
  keyHighlights: z.string().optional(),
  operatorContext: z.string().optional(),
  creatorVoiceSamples: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
  const isAdmin = user.user_metadata?.role === 'admin';
  if (!creator && !isAdmin) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  const body = await request.json();
  const data = schema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  const {
    destination,
    country,
    durationDays,
    departureDate,
    tripStyle,
    fitnessLevel,
    keyHighlights,
    operatorContext,
    creatorVoiceSamples,
    dropId,
  } = data.data;

  const userMessage = `Destination: ${destination}, ${country}
Duration: ${durationDays} days
Departure: ${departureDate}
Style: ${tripStyle ?? 'Adventure'} | Fitness: ${fitnessLevel ?? 'Moderate'}
Key highlights: ${keyHighlights ?? 'Local culture, scenic views, authentic experiences'}
Operator context: ${operatorContext ?? 'Experienced local operator'}
Creator voice samples: ${creatorVoiceSamples ?? 'Enthusiastic, personal, inspiring'}`;

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: ITINERARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  let fullResponse = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // Log to DB
        await prisma.itineraryGenerationLog.create({
          data: {
            dropId: dropId ?? null,
            creatorId: creator?.id ?? null,
            prompt: userMessage,
            response: fullResponse,
          },
        }).catch(console.error);

        controller.close();
      } catch (error) {
        console.error('AI streaming error:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    },
  });
}
