'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDateRange } from '@/lib/utils';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  nationality: z.string().min(1, 'Required'),
  passportCountry: z.string().min(1, 'Required'),
  roomPreference: z.enum(['TWIN_SHARE', 'SINGLE_SUPPLEMENT']),
  dietaryNeeds: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyName: z.string().min(1, 'Required'),
  emergencyPhone: z.string().min(1, 'Required'),
  motivation: z.string().min(100, 'Minimum 100 characters').max(2000, 'Maximum 2000 characters'),
  heardAbout: z.string().optional(),
  terms: z.literal(true).refine((v) => v === true, { message: 'You must accept the terms' }),
});

type FormData = z.infer<typeof schema>;

interface ApplicationFormProps {
  drop: {
    id: string;
    title: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    depositAmount: number;
    singleSupplement: number | null;
    creatorName: string;
    spotsRemaining: number;
  };
}

const STEPS = ['About You', 'Trip Preferences', 'Tell the Creator', 'Review & Submit'];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'New Zealand',
  'Singapore', 'Japan', 'South Korea', 'India', 'Brazil', 'Mexico',
  'Spain', 'Italy', 'Switzerland', 'Austria', 'Belgium', 'Portugal',
  'Ireland', 'Poland', 'Czech Republic', 'Other',
];

const HEARD_ABOUT = [
  'Instagram', 'TikTok', 'YouTube', 'From a friend', 'Newsletter',
  'Podcast', 'Twitter / X', 'Search engine', 'Other',
];

export function ApplicationForm({ drop }: ApplicationFormProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { roomPreference: 'TWIN_SHARE' },
  });

  const motivation = watch('motivation') ?? '';
  const roomPreference = watch('roomPreference');

  const stepFields: (keyof FormData)[][] = [
    ['firstName', 'lastName', 'email', 'nationality', 'passportCountry'],
    ['roomPreference', 'emergencyName', 'emergencyPhone'],
    ['motivation'],
    ['terms'],
  ];

  async function nextStep() {
    const valid = await trigger(stepFields[step] as (keyof FormData)[]);
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, dropId: drop.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Submission failed');
      router.push(`/apply/${drop.id}/success`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  const allValues = watch();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <Link href="/" className="font-mono text-sm tracking-widest" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>
        <div className="mt-8">
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
            APPLYING FOR
          </p>
          <h1 className="font-display text-4xl font-light" style={{ color: 'var(--color-white)' }}>
            {drop.title}
          </h1>
          <p className="font-mono text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {drop.destination} · {formatDateRange(drop.departureDate, drop.returnDate)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-12">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs"
                style={{
                  background: i <= step ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: i <= step ? '#080808' : 'var(--color-dim)',
                  border: i <= step ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className="font-mono text-xs hidden sm:block"
                style={{ color: i === step ? 'var(--color-white)' : 'var(--color-dim)' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{
                  background: i < step ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1 — About You */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-light" style={{ color: 'var(--color-white)' }}>
              Tell us about yourself.
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" error={errors.firstName?.message}>
                <input {...register('firstName')} className="form-input" placeholder="Jamie" />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input {...register('lastName')} className="form-input" placeholder="Chen" />
              </Field>
            </div>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className="form-input" placeholder="you@example.com" />
            </Field>
            <Field label="Phone (optional)" error={errors.phone?.message}>
              <input {...register('phone')} type="tel" className="form-input" placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Instagram handle (optional)" error={errors.instagramHandle?.message}>
              <input {...register('instagramHandle')} className="form-input" placeholder="@yourhandle" />
            </Field>
            <Field label="Nationality" error={errors.nationality?.message}>
              <select {...register('nationality')} className="form-input">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Passport country" error={errors.passportCountry?.message}>
              <select {...register('passportCountry')} className="form-input">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Step 2 — Trip Preferences */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-light" style={{ color: 'var(--color-white)' }}>
              Trip preferences.
            </h2>

            <div>
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-dim)' }}>
                ROOM PREFERENCE
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    value: 'TWIN_SHARE',
                    label: 'Twin share',
                    sub: 'Share a room with another traveler (included)',
                  },
                  {
                    value: 'SINGLE_SUPPLEMENT',
                    label: 'Single room',
                    sub: drop.singleSupplement
                      ? `Private room (+${formatCurrency(drop.singleSupplement)})`
                      : 'Private room (supplement applies)',
                  },
                ].map(({ value, label, sub }) => (
                  <label
                    key={value}
                    className="flex items-center gap-4 p-4 cursor-pointer border"
                    style={{
                      borderColor: roomPreference === value ? 'var(--color-accent)' : 'var(--color-border)',
                      background: roomPreference === value ? 'var(--color-accent-dim)' : 'var(--color-surface)',
                    }}
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register('roomPreference')}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded-full border flex-shrink-0"
                      style={{
                        borderColor: roomPreference === value ? 'var(--color-accent)' : 'var(--color-border)',
                        background: roomPreference === value ? 'var(--color-accent)' : 'transparent',
                      }}
                    />
                    <div>
                      <p className="font-sans font-medium text-sm" style={{ color: 'var(--color-white)' }}>
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {sub}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Field label="Dietary needs" error={errors.dietaryNeeds?.message}>
              <select {...register('dietaryNeeds')} className="form-input">
                <option value="">None / no restrictions</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Halal">Halal</option>
                <option value="Gluten-free">Gluten-free</option>
                <option value="Other">Other (specify in notes)</option>
              </select>
            </Field>

            <Field label="Medical / physical notes (optional)" error={errors.medicalNotes?.message}>
              <textarea
                {...register('medicalNotes')}
                className="form-input"
                rows={3}
                placeholder="Any conditions, allergies, or limitations we should know about..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Emergency contact name" error={errors.emergencyName?.message}>
                <input {...register('emergencyName')} className="form-input" placeholder="Full name" />
              </Field>
              <Field label="Emergency contact phone" error={errors.emergencyPhone?.message}>
                <input {...register('emergencyPhone')} className="form-input" placeholder="+1 555 000 0000" />
              </Field>
            </div>
          </div>
        )}

        {/* Step 3 — Tell the Creator */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-light" style={{ color: 'var(--color-white)' }}>
              Why do you want to join?
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {drop.creatorName} reads every application personally.
            </p>

            <Field
              label={`Your message (${motivation.length} / 2000 chars · min 100)`}
              error={errors.motivation?.message}
            >
              <textarea
                {...register('motivation')}
                className="form-input"
                rows={8}
                placeholder="Tell them who you are, why this trip speaks to you, and what you'd bring to the group..."
              />
            </Field>

            <Field label="How did you hear about this drop?" error={errors.heardAbout?.message}>
              <select {...register('heardAbout')} className="form-input">
                <option value="">Select one</option>
                {HEARD_ABOUT.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 3 && (
          <div className="space-y-8">
            <h2 className="font-display text-3xl font-light" style={{ color: 'var(--color-white)' }}>
              Review your application.
            </h2>

            {/* Trip summary */}
            <div className="p-6 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>
                TRIP SUMMARY
              </p>
              <p className="font-display text-2xl font-light mb-1" style={{ color: 'var(--color-white)' }}>
                {drop.title}
              </p>
              <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
                {drop.destination} · {formatDateRange(drop.departureDate, drop.returnDate)}
              </p>
              <p className="font-mono text-sm" style={{ color: 'var(--color-white)' }}>
                Deposit: {formatCurrency(drop.depositAmount)}
              </p>
            </div>

            {/* Summary rows */}
            <div className="space-y-3">
              {[
                { label: 'Name', value: `${allValues.firstName} ${allValues.lastName}` },
                { label: 'Email', value: allValues.email },
                { label: 'Nationality', value: allValues.nationality },
                { label: 'Room', value: allValues.roomPreference === 'TWIN_SHARE' ? 'Twin share' : 'Single room' },
                { label: 'Dietary', value: allValues.dietaryNeeds || 'None' },
                { label: 'Emergency contact', value: `${allValues.emergencyName} · ${allValues.emergencyPhone}` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between py-3 border-b text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span style={{ color: 'var(--color-dim)' }}>{label}</span>
                  <span style={{ color: 'var(--color-white)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms')}
                className="mt-1 flex-shrink-0"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                I understand that submitting this application does not guarantee a spot. I agree to
                Tripdrop&apos;s terms of service and acknowledge the deposit and refund policy.
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                {errors.terms.message}
              </p>
            )}

            {error && (
              <div
                className="p-4 text-sm border"
                style={{
                  borderColor: 'var(--color-danger)',
                  color: 'var(--color-danger)',
                  background: 'rgba(255,87,87,0.08)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="font-mono text-sm px-6 py-3 border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="font-mono text-sm px-8 py-3"
              style={{ background: 'var(--color-accent)', color: '#080808' }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-mono text-sm px-8 py-3 font-bold disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: '#080808' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit application →'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
        {label.toUpperCase()}
      </label>
      <style jsx global>{`
        .form-input {
          width: 100%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-white);
          padding: 0.75rem 1rem;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus {
          border-color: var(--color-accent);
        }
        .form-input::placeholder {
          color: var(--color-dim);
        }
        .form-input option {
          background: var(--color-surface);
          color: var(--color-white);
        }
      `}</style>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
