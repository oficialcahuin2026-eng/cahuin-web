'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const copy = {
  success: {
    emoji: '✅',
    title: 'Pago confirmado',
    text: 'Tu cuenta de Cahuín ya debería reflejar la compra. Vuelve al panel y actualiza tu perfil.',
  },
  failure: {
    emoji: '🌶️',
    title: 'Pago no completado',
    text: 'El proveedor rechazó o canceló la compra. No se aplicaron cambios a tu cuenta.',
  },
  pending: {
    emoji: '⏳',
    title: 'Pago pendiente',
    text: 'Mercado Pago todavía está procesando la operación. Cuando se apruebe, el backend puede aplicar la compra.',
  },
  setup: {
    emoji: '🧾',
    title: 'Falta configuración',
    text: 'El flujo está creado, pero falta configurar credenciales reales del proveedor en el backend.',
  },
  unknown: {
    emoji: '🧭',
    title: 'No encontramos ese pago',
    text: 'La transacción volvió sin una intención reconocible. Revisa el panel o intenta nuevamente.',
  },
};

function PaymentResultContent() {
  const params = useSearchParams();
  const status = params.get('status') || 'unknown';
  const provider = params.get('provider') || 'pago';
  const data = copy[status] || copy.unknown;

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f6] px-5 text-[#101828] dark:bg-[#080b12] dark:text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-2xl shadow-rose-100 dark:border-white/10 dark:bg-[#111723] dark:shadow-black/40">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-rose-50 text-5xl shadow-xl shadow-rose-100 dark:bg-white/5 dark:shadow-black/30">
          {data.emoji}
        </div>
        <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-[#f0444f]">{provider}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{data.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-slate-600 dark:text-slate-300">{data.text}</p>
        <Link href="/" className="mt-8 inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#f0444f] to-[#ff7659] px-8 font-black text-white shadow-xl shadow-rose-500/25">
          Volver a Cahuín Web
        </Link>
      </section>
    </main>
  );
}

export default function PaymentResult() {
  return (
    <Suspense fallback={(
      <main className="grid min-h-screen place-items-center bg-[#fff8f6] px-5 text-[#101828] dark:bg-[#080b12] dark:text-white">
        <div className="rounded-3xl bg-white p-8 font-black shadow-xl dark:bg-[#111723]">Cargando resultado...</div>
      </main>
    )}>
      <PaymentResultContent />
    </Suspense>
  );
}
