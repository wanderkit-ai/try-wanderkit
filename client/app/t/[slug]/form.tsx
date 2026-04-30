'use client';

import { useState } from 'react';
import type { JoinQuestion, TripStyle } from '@/lib/types';

const INPUT = 'block w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm text-[#1c1917] outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-colors';

interface Props {
  joinQuestions: JoinQuestion[];
  influencerName?: string;
  tripStyle: TripStyle[];
}

export function TripLinkForm({ joinQuestions, influencerName, tripStyle }: Props) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const enabled = joinQuestions.filter((q) => q.enabled);

  function set(key: string, val: string | string[]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function toggleCheckbox(key: string, option: string) {
    const current = (values[key] as string[] | undefined) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    set(key, next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="font-bold text-xl text-green-800">You&apos;re on the list!</h2>
        <p className="text-sm text-green-700 max-w-xs mx-auto">
          {influencerName ?? 'The creator'} will review your application and be in touch with next steps within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Always-on: name + email */}
      <Card title="About you">
        <Field label="Full name" required>
          <input type="text" required placeholder="Your full name" className={INPUT}
            value={(values['name'] as string) ?? ''}
            onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Email address" required>
          <input type="email" required placeholder="you@example.com" className={INPUT}
            value={(values['email'] as string) ?? ''}
            onChange={(e) => set('email', e.target.value)} />
        </Field>

        {/* Render enabled questions by group within the card flow */}
        {renderGroup(enabled, 'identity', values, set, toggleCheckbox)}
      </Card>

      {/* Logistics */}
      {hasGroup(enabled, ['partySize', 'roomPreference', 'roommateName', 'phone']) && (
        <Card title="Trip logistics">
          {renderGroup(enabled, 'logistics', values, set, toggleCheckbox)}
        </Card>
      )}

      {/* Health & safety */}
      {hasGroup(enabled, ['dietaryRestrictions', 'allergies', 'mobilityNeeds', 'emergencyContact', 'travelInsurance']) && (
        <Card title="Health &amp; safety">
          {renderGroup(enabled, 'health', values, set, toggleCheckbox)}
        </Card>
      )}

      {/* Trip-specific */}
      {hasGroup(enabled, ['fitnessLevel', 'priorExperience', 'surfLevel', 'nationality', 'passport', 'dateOfBirth']) && (
        <Card title="Trip-specific">
          {renderGroup(enabled, 'tripspecific', values, set, toggleCheckbox)}
        </Card>
      )}

      {/* Personal */}
      {hasGroup(enabled, ['whyInterested', 'heardAboutUs', 'tshirtSize', 'specialRequests']) && (
        <Card title="Personal">
          {renderGroup(enabled, 'personal', values, set, toggleCheckbox)}
        </Card>
      )}

      <button type="submit" className="w-full h-12 rounded-lg bg-[#1c1917] text-white text-sm font-bold hover:bg-[#292524] transition-colors">
        Submit my application →
      </button>
      <p className="text-center text-xs text-stone-400">
        Powered by <span className="font-medium text-stone-500">Noma</span>
      </p>
    </form>
  );
}

/* ─── Group helpers ─── */

function hasGroup(enabled: JoinQuestion[], keys: string[]) {
  return enabled.some((q) => keys.includes(q.key));
}

type SetFn = (key: string, val: string | string[]) => void;
type ToggleFn = (key: string, option: string) => void;

function renderGroup(
  enabled: JoinQuestion[],
  group: 'identity' | 'logistics' | 'health' | 'tripspecific' | 'personal',
  values: Record<string, string | string[]>,
  set: SetFn,
  toggle: ToggleFn,
) {
  const groupKeys: Record<string, string[]> = {
    identity: ['phone', 'dateOfBirth'],
    logistics: ['partySize', 'roomPreference', 'roommateName'],
    health: ['dietaryRestrictions', 'allergies', 'mobilityNeeds', 'emergencyContact', 'travelInsurance'],
    tripspecific: ['fitnessLevel', 'priorExperience', 'surfLevel', 'nationality', 'passport'],
    personal: ['whyInterested', 'heardAboutUs', 'tshirtSize', 'specialRequests'],
  };

  const keys = groupKeys[group];
  const questions = enabled.filter((q) => keys.includes(q.key));

  return <>{questions.map((q) => renderQuestion(q, values, set, toggle))}</>;
}

function renderQuestion(
  q: JoinQuestion,
  values: Record<string, string | string[]>,
  set: SetFn,
  toggle: ToggleFn,
) {
  const strVal = (values[q.key] as string) ?? '';
  const arrVal = (values[q.key] as string[]) ?? [];

  switch (q.key) {
    case 'phone':
      return (
        <Field key={q.key} label="Phone / WhatsApp" required={q.required}>
          <input type="tel" required={q.required} placeholder="+1 555 123 4567" className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'dateOfBirth':
      return (
        <Field key={q.key} label="Date of birth" required={q.required} hint="Used for travel insurance">
          <input type="date" required={q.required} className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'partySize':
      return (
        <Field key={q.key} label="Party size" required={q.required} hint="How many people including yourself">
          <input type="number" min="1" max="20" required={q.required} placeholder="e.g. 2" className={`${INPUT} w-28`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'roomPreference':
      return (
        <Field key={q.key} label="Room preference" required={q.required}>
          <select required={q.required} className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)}>
            <option value="">Select…</option>
            <option value="single">Single occupancy (own room)</option>
            <option value="double">Double (sharing with my partner / travel buddy)</option>
            <option value="twin">Twin share (would like a roommate from the group)</option>
            <option value="open">Open to sharing — whatever works</option>
          </select>
        </Field>
      );

    case 'roommateName':
      return (strVal === 'double' || values['roomPreference'] === 'double') ? (
        <Field key={q.key} label="Roommate's name" required={false} hint="If sharing with a specific person">
          <input type="text" placeholder="Their name" className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      ) : null;

    case 'dietaryRestrictions':
      return (
        <Field key={q.key} label="Dietary restrictions" required={q.required}>
          <CheckboxGroup
            options={['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Halal', 'Kosher', 'Other']}
            selected={arrVal}
            onToggle={(opt) => toggle(q.key, opt)}
          />
        </Field>
      );

    case 'allergies':
      return (
        <Field key={q.key} label="Food or environmental allergies" required={q.required} hint="Leave blank if none">
          <textarea required={q.required} rows={2} placeholder="e.g. severe nut allergy, bee stings" className={`${INPUT} resize-none`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'mobilityNeeds':
      return (
        <Field key={q.key} label="Mobility / accessibility needs" required={q.required} hint="Leave blank if none">
          <textarea required={q.required} rows={2} placeholder="Any mobility, physical, or medical considerations we should know about" className={`${INPUT} resize-none`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'emergencyContact':
      return (
        <Field key={q.key} label="Emergency contact" required={q.required}>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" required={q.required} placeholder="Full name" className={INPUT}
              value={strVal} onChange={(e) => set(q.key, e.target.value)} />
            <input type="tel" placeholder="Phone number" className={INPUT}
              value={(values[`${q.key}_phone`] as string) ?? ''}
              onChange={(e) => set(`${q.key}_phone`, e.target.value)} />
          </div>
        </Field>
      );

    case 'travelInsurance':
      return (
        <Field key={q.key} label="Travel insurance" required={q.required}>
          <RadioGroup
            options={[
              { value: 'have', label: 'I already have it' },
              { value: 'help', label: "I'd like recommendations" },
              { value: 'unsure', label: 'Not sure yet' },
            ]}
            selected={strVal}
            onSelect={(v) => set(q.key, v)}
            name={q.key}
          />
        </Field>
      );

    case 'fitnessLevel':
      return (
        <Field key={q.key} label="Fitness level" required={q.required}>
          <RadioGroup
            options={[
              { value: 'low', label: 'Low — I prefer a gentle pace' },
              { value: 'moderate', label: 'Moderate — comfortable with active days' },
              { value: 'high', label: 'High — bring the challenge' },
              { value: 'athletic', label: 'Athletic — I train regularly' },
            ]}
            selected={strVal}
            onSelect={(v) => set(q.key, v)}
            name={q.key}
          />
        </Field>
      );

    case 'priorExperience':
      return (
        <Field key={q.key} label="Prior experience" required={q.required} hint="What's the most challenging trip you've done?">
          <textarea required={q.required} rows={3} placeholder="e.g. Kilimanjaro summit attempt, 5-day trekking in Torres del Paine…" className={`${INPUT} resize-none`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'surfLevel':
      return (
        <Field key={q.key} label="Surf level" required={q.required}>
          <RadioGroup
            options={[
              { value: 'never', label: 'Never surfed' },
              { value: 'beginner', label: 'Beginner — can stand up sometimes' },
              { value: 'intermediate', label: 'Intermediate — can ride green waves' },
              { value: 'advanced', label: 'Advanced — comfortable in overhead surf' },
            ]}
            selected={strVal}
            onSelect={(v) => set(q.key, v)}
            name={q.key}
          />
        </Field>
      );

    case 'nationality':
      return (
        <Field key={q.key} label="Nationality (passport country)" required={q.required} hint="Helps us flag any visa requirements">
          <input type="text" required={q.required} placeholder="e.g. United States" className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'passport':
      return (
        <Field key={q.key} label="Passport details" required={q.required}>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" required={q.required} placeholder="Passport number" className={INPUT}
              value={strVal} onChange={(e) => set(q.key, e.target.value)} />
            <input type="date" placeholder="Expiry date" className={INPUT}
              value={(values[`${q.key}_expiry`] as string) ?? ''}
              onChange={(e) => set(`${q.key}_expiry`, e.target.value)} />
          </div>
        </Field>
      );

    case 'whyInterested':
      return (
        <Field key={q.key} label="Why this trip?" required={q.required}>
          <textarea required={q.required} rows={3} placeholder="What draws you to this experience? What are you hoping to get out of it?" className={`${INPUT} resize-none`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    case 'heardAboutUs':
      return (
        <Field key={q.key} label="How did you hear about this?" required={q.required}>
          <select required={q.required} className={INPUT}
            value={strVal} onChange={(e) => set(q.key, e.target.value)}>
            <option value="">Select…</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="newsletter">Newsletter / email list</option>
            <option value="podcast">Podcast</option>
            <option value="friend">Friend or family member</option>
            <option value="other">Other</option>
          </select>
        </Field>
      );

    case 'tshirtSize':
      return (
        <Field key={q.key} label="T-shirt size" required={q.required} hint="Trip participants receive a merch pack">
          <select required={q.required} className={`${INPUT} w-32`}
            value={strVal} onChange={(e) => set(q.key, e.target.value)}>
            <option value="">—</option>
            {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      );

    case 'specialRequests':
      return (
        <Field key={q.key} label="Anything else?" required={q.required} hint="Special requests, questions, or things we should know">
          <textarea rows={3} className={`${INPUT} resize-none`}
            placeholder="Completely optional…"
            value={strVal} onChange={(e) => set(q.key, e.target.value)} />
        </Field>
      );

    default:
      return null;
  }
}

/* ─── UI components ─── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {hint && <span className="block text-xs text-stone-400">{hint}</span>}
      {children}
    </label>
  );
}

function CheckboxGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (opt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            selected.includes(opt)
              ? 'bg-[#1c1917] text-white border-[#1c1917]'
              : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({ options, selected, onSelect, name }: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  name: string;
}) {
  return (
    <div className="space-y-2 mt-1">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selected === opt.value}
            onChange={() => onSelect(opt.value)}
            className="w-4 h-4 accent-[#1c1917]"
          />
          <span className="text-sm text-stone-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
