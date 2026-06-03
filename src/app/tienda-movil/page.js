'use client';

import { useState, useEffect } from 'react';
import { Flame, Lock, Crown } from 'lucide-react';
import { api, storage } from '@/lib/api';

const PLANS = [
  { id: 'premium_plus_month', title: 'Cahuín Plus', price: 4590, cahuines: 700, color: 'from-[#f0444f] to-[#ff7659]' },
  { id: 'premium_gold_month', title: 'Cahuín Gold', price: 7490, cahuines: 1500, color: 'from-[#F59E0B] to-[#FCD34D]' },
  { id: 'premium_platinum_month', title: 'Cahuín Platinum', price: 11450, cahuines: 3000, color: 'from-[#9CA3AF] to-[#E5E7EB]' }
];

export default function TiendaMovil() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(storage.getUser());
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      storage.setSession(result);
      setUser(result.usuario);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const procesarPago = async (plan) => {
    setLoading(true);
    try {
      // 1. Llamamos a nuestra propia API creada en el Paso 3
      const response = await fetch('/api/pagos/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: plan.id, title: plan.title, price: plan.price })
      });
      
      const data = await response.json();
      
      // 2. Redirigimos a la pantalla segura de Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('No se generó el link de pago');
      }
    } catch (err) {
      alert("Error al procesar: " + err.message);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#080b12] text-white p-6 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#f0444f] to-[#ff785c] rounded-2xl flex items-center justify-center mb-4">
            <Flame className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black">Conecta tu cuenta</h1>
          <p className="text-slate-400 text-sm mt-2">Inicia sesión para comprar tus planes más baratos directamente en la web.</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 font-bold text-white outline-none focus:border-[#f0444f]" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 font-bold text-white outline-none focus:border-[#f0444f]" />
          <button disabled={loading} className="w-full h-14 bg-[#f0444f] text-white font-black rounded-2xl mt-4">
            {loading ? 'Cargando...' : 'Entrar a la tienda'}
          </button>
        </form>
        {error && <p className="text-rose-500 text-center mt-4 font-bold">{error}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-black text-[#f0444f]">Cahuín Tienda</h1>
          <p className="text-sm text-slate-400">{user.nombre} · {user.cahuines || 0} 🔥</p>
        </div>
        <Lock className="text-slate-500 w-5 h-5" />
      </div>

      <div className="space-y-4">
        {PLANS.map(plan => (
          <div key={plan.id} className="bg-[#111723] border border-white/10 p-5 rounded-2xl shadow-xl">
            <h2 className="text-xl font-black">{plan.title}</h2>
            <p className="text-3xl font-black mt-2">${plan.price.toLocaleString('es-CL')}</p>
            <p className="text-slate-400 text-sm mb-4">Incluye {plan.cahuines} Cahuines</p>
            <button 
              onClick={() => procesarPago(plan)}
              disabled={loading}
              className={`w-full h-14 rounded-2xl font-black text-white bg-gradient-to-r ${plan.color}`}
            >
              Comprar Plan
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}