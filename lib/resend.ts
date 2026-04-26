import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
  }
  return _resend;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResend() as any)[prop];
  },
});

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'drops@tripdrop.co';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'founders@tripdrop.co';
