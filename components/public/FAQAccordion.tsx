'use client';

import { useState } from 'react';
import type { FAQ } from '@/types';

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-8" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
          FAQ
        </p>
        <h2 className="font-display text-5xl font-light mb-16" style={{ color: 'var(--color-white)' }}>
          Good questions.
        </h2>

        <div className="space-y-px" style={{ background: 'var(--color-border)' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: 'var(--color-surface)' }}>
              <button
                className="w-full text-left flex items-center justify-between p-6 gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-sans font-medium" style={{ color: 'var(--color-white)' }}>
                  {faq.question}
                </span>
                <span
                  className="font-mono text-xs shrink-0 transition-transform duration-200"
                  style={{
                    color: 'var(--color-accent)',
                    transform: open === i ? 'rotate(45deg)' : undefined,
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm leading-relaxed pt-4" style={{ color: 'var(--color-muted)' }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
