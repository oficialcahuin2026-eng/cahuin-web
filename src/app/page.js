'use client';

import { useUser, useAuth, SignIn } from '@clerk/nextjs';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Compass,
  Crown,
  Flame,
  Heart,
  Home,
  Lock,
  LogOut,
  Map,
  MessageCircle,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Store,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { api, storage } from '@/lib/api';

const fallbackProducts = [
  {
    id: 'cahuin_piola_monthly',
    type: 'premium',
    tier: 'piola',
    title: 'Cahuin Piola',
    amount: 3990,
    features: ['Likes sin limite', 'Retroceder cuando te equivocas', 'Ruleta a Ciegas', 'Modo Chile', 'Sin anuncios'],
  },
  {
    id: 'cahuin_a_fondo_monthly',
    type: 'premium',
    tier: 'a_fondo',
    title: 'Cahuin a Fondo',
    amount: 6990,
    features: ['Todo Piola', 'Ver quien te dio like', 'La Pica', 'Modo Destacado', 'Salvar Match Relampago'],
  },
  { id: 'cahuines_1000', type: 'cahuines', title: '1000 Cahuines', amount: 1990, cahuines: 1000 },
  { id: 'cahuines_3000', type: 'cahuines', title: '3000 Cahuines', amount: 4990, cahuines: 3000 },
  { id: 'cahuines_7000', type: 'cahuines', title: '7000 Cahuines', amount: 9990, cahuines: 7000 },
  { id: 'cahuines_15000', type: 'cahuines', title: '15000 Cahuines', amount: 17990, cahuines: 15000 },
];

const navItems = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'radar', label: 'Radar', icon: Flame },
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'panoramas', label: 'Panoramas', icon: CalendarDays },
  { id: 'cahuines', label: 'Cahuines', icon: MessageCircle },
  { id: 'historias', label: 'Historias', icon: Sparkles },
  { id: 'mapa', label: 'Mapa calor', icon: Map },
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'tienda', label: 'Tienda web', icon: Store },
];

const comunidades = [
  { id: 'relacion-seria', title: 'Pololeo serio', text: 'Gente que quiere construir algo bonito.', tint: 'rose' },
  { id: 'salir-hoy', title: 'Salgamos hoy', text: 'Planes espontaneos cerca de ti.', tint: 'orange' },
  { id: 'solo-cahuines', title: 'Solo cahuines', text: 'Conversas reales, cero pose.', tint: 'purple' },
  { id: 'hacer-yuntas', title: 'Hacer yuntas', text: 'Armar panoramas y sumar gente.', tint: 'green' },
  { id: 'musica-en-vivo', title: 'Musica en vivo', text: 'Matches para tocatas, karaoke y festival.', tint: 'blue' },
  { id: 'cafecito', title: 'Cafecito piola', text: 'Cafe, pan dulce y cero presion.', tint: 'amber' },
];

const fallbackStories = [
  { _id: 's1', texto: 'Estoy buscando dato de cafeteria en Temuco.', lugar: 'Araucania', emoji: '☕' },
  { _id: 's2', texto: 'Feria, musica y sopaipillas: plan redondo.', lugar: 'Santiago', emoji: '✨' },
  { _id: 's3', texto: 'Quien apaña a una tocata chica?', lugar: 'Valparaiso', emoji: '🎸' },
];

const fallbackProfiles = [
  {
    _id: 'p1',
    nombre: 'Antonia',
    edad: 25,
    ciudad: 'Temuco',
    descripcion: 'Cafes largos, conciertos chicos y conversaciones que se van sin mirar la hora.',
    foto: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85',
    intereses: ['Musica en vivo', 'Cafe', 'Conversar'],
  },
  {
    _id: 'p2',
    nombre: 'Benjamin',
    edad: 27,
    ciudad: 'Villarrica',
    descripcion: 'Plan de tarde, lago y buena conversa. Me sumo si hay risa facil.',
    foto: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=900&q=85',
    intereses: ['Salir hoy', 'Naturaleza', 'Cocina'],
  },
  {
    _id: 'p3',
    nombre: 'Sofia',
    edad: 26,
    ciudad: 'Pucon',
    descripcion: 'UX, karaoke malo con confianza y lista infinita de picadas.',
    foto: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=900&q=85',
    intereses: ['Karaoke', 'Pololeo serio', 'Cine'],
  },
];

const formatCLP = (value) => new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
}).format(value || 0);

function avatarOf(user) {
  return user?.foto || user?.fotos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80';
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CahuinWeb() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useAuth();

  const [active, setActive] = useState('inicio');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({
    perfiles: [],
    matches: [],
    panoramas: [],
    historias: [],
    likes: [],
    topPicks: [],
    heat: [],
    products: fallbackProducts,
    cahuinDia: null,
    trending: [],
  });

  const premiumPlan = user?.premiumPlan || (user?.isPremium ? 'gold' : 'free');
  const premiumRank = { free: 0, plus: 1, gold: 2, platinum: 3 }[premiumPlan] || 0;

  const safeLoad = useCallback(async (path, mapper) => {
    try {
      const result = await api(path);
      return mapper ? mapper(result) : result;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const [
      me,
      perfiles,
      matches,
      panoramas,
      historias,
      likes,
      heat,
      products,
      cahuinDia,
      trending,
    ] = await Promise.all([
      safeLoad('/users/me', (r) => r.usuario),
      safeLoad('/users/descubrir', (r) => r.perfiles),
      safeLoad('/matches', (r) => r.matches || r),
      safeLoad('/panoramas', (r) => r.panoramas || r),
      safeLoad('/social/historias', (r) => r.historias),
      safeLoad('/users/me/likes', (r) => r),
      safeLoad('/social/mapa-calor', (r) => r.zonas || r.heat || []),
      safeLoad('/payments/products', (r) => r.products),
      safeLoad('/social/cahuin-dia', (r) => r.cahuin || r),
      safeLoad('/users/trending', (r) => r.trending),
    ]);

    if (me) {
      const token = storage.getToken();
      storage.setSession({ token, usuario: me });
      setUser(me);
    }

    setData((prev) => ({
      ...prev,
      perfiles: perfiles?.length ? perfiles : fallbackProfiles,
      matches: matches?.length ? matches : prev.matches,
      panoramas: panoramas?.length ? panoramas : prev.panoramas,
      historias: historias?.length ? historias : fallbackStories,
      likes: likes?.likes || prev.likes,
      topPicks: likes?.topPicks || prev.topPicks,
      heat: heat?.length ? heat : prev.heat,
      products: products?.length ? products : fallbackProducts,
      cahuinDia: cahuinDia || prev.cahuinDia,
      trending: trending?.length ? trending : fallbackProfiles,
    }));
  }, [safeLoad]);

  useEffect(() => {
    const storedUser = storage.getUser();
    if (storedUser) {
      setUser(storedUser);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser && !user) {
      const syncBackend = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://cahuin-backend-1.onrender.com/api'}/auth/sync-clerk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress,
              nombre: clerkUser.fullName || clerkUser.firstName || 'Cahuinero',
              fotoUrl: clerkUser.imageUrl
            })
          });
          const data = await res.json();
          if (data && data.token) {
            storage.setSession({ token: data.token, usuario: data.usuario });
            setUser(data.usuario);
            refresh();
          }
        } catch (error) {
          console.error('Error syncing with backend', error);
        }
      };
      syncBackend();
    }
  }, [isLoaded, isSignedIn, clerkUser, user, refresh]);

  const logout = async () => {
    await signOut();
    storage.clear();
    setUser(null);
    setActive('inicio');
    setMessage('Sesion cerrada.');
  };

  const buy = async (productId) => {
    if (!user) {
      setMessage('Primero inicia sesion con la misma cuenta de la app.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await api('/payments/mercadopago/preference', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const voteCahuin = async (opcion) => {
    setMessage('Voto guardado en esta sesion.');
    try {
      await api('/social/cahuin-dia/votar', {
        method: 'POST',
        body: JSON.stringify({ opcion }),
      });
      setMessage(`Votaste: ${opcion}.`);
    } catch {
      setMessage('Guardamos tu voto localmente; el servidor no respondio.');
    }
  };

  const visibleLikes = useMemo(() => {
    const source = data.likes?.length ? data.likes : data.topPicks?.slice(0, 4);
    return source?.length ? source : fallbackProfiles.map((profile) => ({ ...profile, revelado: premiumRank >= 2 }));
  }, [data.likes, data.topPicks, premiumRank]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fff8f6] text-[#101828] dark:bg-[#080b12] dark:text-white">
        <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block">
            <div className="mb-10 flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[#f0444f] to-[#ff785c] shadow-xl shadow-rose-500/30">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black">Cahuin</p>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Web beta</p>
              </div>
            </div>
            <h1 className="max-w-3xl text-6xl font-black leading-[0.98] tracking-tight">
              Todo tu Cahuin, adaptado al navegador.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600 dark:text-slate-300">
              Radar, panoramas, chats, historias, perfil y compras en una experiencia web que se siente nativa.
            </p>
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
              {[
                ['Radar', Flame],
                ['Panoramas', CalendarDays],
                ['Cahuines', MessageCircle],
              ].map(([label, Icon]) => (
                <div key={label} className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                  <Icon className="h-8 w-8 text-[#f0444f]" />
                  <p className="mt-5 font-black">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="mx-auto flex w-full max-w-md items-center justify-center rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-rose-100 dark:border-white/10 dark:bg-[#111723] dark:shadow-black/40">
            <SignIn routing="hash" />
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f6] text-[#101828] dark:bg-[#080b12] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white/90 px-4 py-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d111a]/90 lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#f0444f] to-[#ff785c]">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-black">Cahuin</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={cx(
                    'flex h-12 w-full items-center gap-4 rounded-2xl px-4 text-left text-sm font-black transition',
                    selected ? 'bg-[#101828] text-white shadow-lg dark:bg-white dark:text-[#101828]' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button onClick={logout} className="absolute bottom-6 left-4 right-4 flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 font-black text-slate-600 dark:border-white/10 dark:text-slate-300">
            <LogOut className="h-5 w-5" />
            Salir
          </button>
        </aside>

        <section className="lg:col-start-2">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[minmax(0,720px)_330px] lg:px-8">
            <div className="min-w-0">
              <TopBar user={user} active={active} setActive={setActive} />
              {active === 'inicio' && (
                <HomeFeed data={data} user={user} setActive={setActive} voteCahuin={voteCahuin} />
              )}
              {active === 'radar' && <RadarView profiles={data.perfiles} user={user} setActive={setActive} />}
              {active === 'explorar' && <ExploreView setActive={setActive} />}
              {active === 'panoramas' && <PanoramasView panoramas={data.panoramas} setActive={setActive} />}
              {active === 'cahuines' && <ChatsView matches={data.matches} />}
              {active === 'historias' && <StoriesView stories={data.historias} />}
              {active === 'mapa' && <HeatMapView heat={data.heat} />}
              {active === 'perfil' && (
                <ProfileView user={user} likes={visibleLikes} premiumRank={premiumRank} setActive={setActive} />
              )}
              {active === 'tienda' && (
                <StoreView products={data.products} buy={buy} loading={loading} />
              )}
            </div>

            <RightRail user={user} profiles={data.trending} setActive={setActive} />
          </div>
        </section>
      </div>

      {message ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-3xl border border-rose-200 bg-white px-5 py-4 text-sm font-black text-rose-700 shadow-2xl dark:border-rose-500/20 dark:bg-[#111723] dark:text-rose-100">
          {message}
        </div>
      ) : null}
    </main>
  );
}

function TopBar({ user, active, setActive }) {
  const title = navItems.find((item) => item.id === active)?.label || 'Inicio';
  return (
    <header className="sticky top-0 z-20 mb-6 flex items-center justify-between border-b border-transparent bg-[#fff8f6]/85 py-3 backdrop-blur-xl dark:bg-[#080b12]/85">
      <div>
        <p className="text-4xl font-black tracking-tight">{title}</p>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{user?.ciudad || 'Por definir'} · {user?.region || 'Chile'}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setActive('tienda')} className="hidden h-11 items-center gap-2 rounded-full bg-[#101828] px-4 text-sm font-black text-white dark:bg-white dark:text-[#101828] sm:flex">
          <Store className="h-4 w-4" />
          Tienda web
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function HomeFeed({ data, user, setActive, voteCahuin }) {
  const profiles = data.perfiles?.length ? data.perfiles : fallbackProfiles;
  const stories = data.historias?.length ? data.historias : fallbackStories;
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-xl shadow-rose-100/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
        <div className="flex gap-5">
          <StoryBubble name="Tu historia" image={avatarOf(user)} active plus />
          {stories.map((story) => (
            <StoryBubble key={story._id} name={story.lugar || 'Cahuin'} emoji={story.emoji || '✨'} active />
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#101828] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black">Cahuin del Dia</p>
              <p className="text-sm text-slate-500">Todos votan. Manana priorizamos gente que piensa igual.</p>
            </div>
          </div>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-[#f0444f] dark:bg-rose-500/10">20:00</span>
        </div>
        <div className="rounded-[1.7rem] bg-[#101828] p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-300">Anonimo</p>
          <p className="mt-4 text-3xl font-black leading-tight">
            "{data.cahuinDia?.texto || 'Primera cita ideal: completo italiano y caminar sin rumbo.'}"
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={() => voteCahuin('de_acuerdo')} className="h-12 rounded-2xl bg-white font-black text-[#101828]">De acuerdo</button>
            <button onClick={() => voteCahuin('ni_cagando')} className="h-12 rounded-2xl border border-white/25 font-black">Ni cagando</button>
          </div>
        </div>
      </div>

      {profiles.slice(0, 2).map((profile) => (
        <ProfilePost key={profile._id} profile={profile} setActive={setActive} />
      ))}
    </div>
  );
}

function StoryBubble({ name, image, emoji, active, plus }) {
  return (
    <button className="w-20 shrink-0 text-center">
      <div className={cx('mx-auto grid h-16 w-16 place-items-center rounded-full p-[3px]', active ? 'bg-gradient-to-br from-[#f0444f] to-[#ffb45c]' : 'bg-slate-200')}>
        <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-white dark:bg-[#111723]">
          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl">{emoji}</span>}
          {plus ? <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-[#f0444f] text-xs text-white">+</span> : null}
        </div>
      </div>
      <p className="mt-2 truncate text-xs font-bold text-slate-500 dark:text-slate-400">{name}</p>
    </button>
  );
}

function ProfilePost({ profile, setActive }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-rose-100/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img src={avatarOf(profile)} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="font-black">{profile.nombre}, {profile.edad}</p>
            <p className="text-sm text-slate-500">{profile.ciudad || 'Cerca tuyo'}</p>
          </div>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </button>
      </div>
      <img src={avatarOf(profile)} alt="" className="aspect-[4/5] w-full object-cover" />
      <div className="space-y-4 p-5">
        <div className="flex gap-3">
          <button className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-[#f0444f] dark:bg-rose-500/10"><Heart className="h-5 w-5" /></button>
          <button onClick={() => setActive('cahuines')} className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><MessageCircle className="h-5 w-5" /></button>
          <button className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><Send className="h-5 w-5" /></button>
        </div>
        <p className="font-black">{profile.descripcion || 'Perfil listo para cahuinear.'}</p>
        <div className="flex flex-wrap gap-2">
          {(profile.intereses || []).slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-[#f0444f] dark:bg-rose-500/10">{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function RadarView({ profiles, user, setActive }) {
  const current = profiles?.[0] || fallbackProfiles[0];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
      <div className="overflow-hidden rounded-[2.3rem] border border-slate-200 bg-white shadow-2xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
        <div className="relative aspect-[4/5] max-h-[680px]">
          <img src={avatarOf(current)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-7 text-white">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur">Activo cerca</span>
              {current.verificado ? <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black">Verificado</span> : null}
            </div>
            <h2 className="text-5xl font-black">{current.nombre}, {current.edad}</h2>
            <p className="mt-2 text-lg text-white/80">{current.ciudad || user?.ciudad || 'Cerca tuyo'}</p>
            <p className="mt-5 max-w-xl text-lg leading-8">{current.descripcion}</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 p-5">
          <ActionButton icon={Zap} label="Rewind" />
          <ActionButton icon={Search} label="Pasar" />
          <ActionButton icon={Star} label="Super" accent="blue" />
          <ActionButton icon={Heart} label="Like" accent="rose" />
          <ActionButton icon={Flame} label="Boost" accent="purple" onClick={() => setActive('tienda')} />
        </div>
      </div>
      <div className="space-y-4">
        {profiles.slice(1, 4).map((profile) => (
          <button key={profile._id} className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 text-left dark:border-white/10 dark:bg-white/5">
            <img src={avatarOf(profile)} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <div>
              <p className="font-black">{profile.nombre}, {profile.edad}</p>
              <p className="text-sm text-slate-500">{profile.ciudad}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, accent, onClick }) {
  const palette = {
    rose: 'bg-rose-50 text-[#f0444f] dark:bg-rose-500/10',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10',
  }[accent] || 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white';
  return (
    <button onClick={onClick} className={cx('grid min-h-20 place-items-center rounded-3xl font-black', palette)}>
      <Icon className="h-6 w-6" />
      <span className="text-xs">{label}</span>
    </button>
  );
}

function ExploreView({ setActive }) {
  return (
    <div className="space-y-6">
      <button onClick={() => setActive('radar')} className="w-full rounded-[2rem] bg-gradient-to-r from-[#f0444f] to-[#ff785c] p-6 text-center text-2xl font-black text-white shadow-xl shadow-rose-500/25">
        Ver perfiles trending
      </button>
      <div className="grid gap-4 sm:grid-cols-2">
        {comunidades.map((item) => (
          <button key={item.id} className="min-h-52 rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className={cx('mb-10 grid h-16 w-16 place-items-center rounded-3xl', {
              rose: 'bg-rose-50 text-[#f0444f]',
              orange: 'bg-orange-50 text-orange-500',
              purple: 'bg-purple-50 text-purple-600',
              green: 'bg-green-50 text-green-600',
              blue: 'bg-blue-50 text-blue-600',
              amber: 'bg-amber-50 text-amber-700',
            }[item.tint])}>
              <Users className="h-7 w-7" />
            </div>
            <p className="text-2xl font-black">{item.title}</p>
            <p className="mt-2 text-lg leading-7 text-slate-500 dark:text-slate-400">{item.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PanoramasView({ panoramas, setActive }) {
  const items = panoramas?.length ? panoramas : [
    { _id: 'pa1', titulo: 'Paz Quintana', categoria: 'Concierto', lugar: 'Mamas & Tapas, Pucon', fecha: '2026-06-04' },
    { _id: 'pa2', titulo: 'Onda Fiesta Radio', categoria: 'Fiesta musical', lugar: 'Alto Portales, Temuco', fecha: '2026-06-06' },
    { _id: 'pa3', titulo: 'La Cabina', categoria: 'Musica en vivo', lugar: 'London Club, Temuco', fecha: '2026-06-06' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-black">Eventos y comunidad</p>
          <p className="text-slate-500">Ordenados para que puedas invitar a tus matches desde web.</p>
        </div>
        <button onClick={() => setActive('cahuines')} className="rounded-full bg-[#101828] px-5 py-3 font-black text-white dark:bg-white dark:text-[#101828]">Invitar match</button>
      </div>
      {items.map((item) => (
        <div key={item._id} className="flex gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl bg-rose-50 text-[#f0444f] dark:bg-rose-500/10">
            <CalendarDays className="h-9 w-9" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-black">{item.titulo || item.nombre}</p>
            <p className="mt-1 text-slate-500">{item.categoria || item.descripcion || 'Panorama'}</p>
            <p className="mt-4 font-bold text-slate-700 dark:text-slate-300">{item.lugar} · {String(item.fecha || '').slice(0, 10)}</p>
          </div>
          <button className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-rose-200 text-[#f0444f]">
            <Send className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ChatsView({ matches }) {
  const items = matches?.length ? matches : fallbackProfiles.map((profile) => ({ usuario: profile, roomId: profile._id, rachaConversacion: 2 }));
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
      {items.map((match) => {
        const profile = match.usuario || match;
        return (
          <div key={match.roomId || profile._id} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-b-0 dark:border-white/10">
            <img src={avatarOf(profile)} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black">{profile.nombre} {match.rachaConversacion ? <span className="text-[#f0444f]">· racha {match.rachaConversacion}</span> : null}</p>
              <p className="truncate text-sm text-slate-500">Activo hace 5 min · Lista para cahuinear.</p>
            </div>
            <button className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-[#f0444f] dark:bg-rose-500/10"><MessageCircle className="h-5 w-5" /></button>
          </div>
        );
      })}
    </div>
  );
}

function StoriesView({ stories }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(stories?.length ? stories : fallbackStories).map((story) => (
        <article key={story._id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-3xl dark:bg-rose-500/10">{story.emoji || '✨'}</div>
          <p className="text-2xl font-black">{story.texto}</p>
          <p className="mt-2 text-slate-500">{story.lugar || 'Chile'} · 24h</p>
          <div className="mt-6 flex gap-2">
            <button className="h-11 flex-1 rounded-2xl bg-rose-50 font-black text-[#f0444f] dark:bg-rose-500/10">Reaccionar</button>
            <button className="h-11 flex-1 rounded-2xl border border-slate-200 font-black dark:border-white/10">Comentar</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function HeatMapView({ heat }) {
  const zones = heat?.length ? heat : [
    { nombre: 'Centro Temuco', intensidad: 85 },
    { nombre: 'UFRO', intensidad: 72 },
    { nombre: 'Pucon nocturno', intensidad: 66 },
    { nombre: 'Mall Portal', intensidad: 55 },
  ];
  return (
    <div className="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-[#101828] p-6 text-white">
        <div className="absolute left-16 top-20 h-44 w-44 rounded-full bg-red-500/50 blur-3xl" />
        <div className="absolute right-20 top-36 h-56 w-56 rounded-full bg-orange-500/45 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-52 w-52 rounded-full bg-rose-500/40 blur-3xl" />
        <p className="relative text-sm font-black uppercase tracking-[0.2em] text-rose-200">Sin ubicaciones exactas</p>
        <h2 className="relative mt-4 text-4xl font-black">Donde esta prendida tu region</h2>
        <div className="relative mt-10 grid gap-3">
          {zones.map((zone) => (
            <div key={zone.nombre} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="font-black">{zone.nombre}</p>
                <p className="font-black text-rose-200">{zone.intensidad}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#f0444f] to-[#ffb45c]" style={{ width: `${zone.intensidad}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileView({ user, likes, premiumRank, setActive }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
        <img src={avatarOf(user)} alt="" className="mx-auto h-32 w-32 rounded-full object-cover ring-8 ring-rose-50 dark:ring-white/10" />
        <h2 className="mt-4 text-4xl font-black">{user.nombre}, {user.edad}</h2>
        <p className="mt-2 text-slate-500">{user.ciudad || 'Por definir'} · {user.region || 'Chile'}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="rounded-full bg-[#101828] px-5 py-3 font-black text-white dark:bg-white dark:text-[#101828]">Editar perfil</button>
          <button onClick={() => setActive('tienda')} className="rounded-full border border-slate-200 px-5 py-3 font-black dark:border-white/10">Mejorar</button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black">Quien te dio like</p>
            <p className="text-slate-500">Vive en Perfil. Gold y Platinum lo revelan.</p>
          </div>
          {premiumRank < 2 ? <Lock className="h-6 w-6 text-slate-400" /> : <Crown className="h-6 w-6 text-amber-500" />}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {likes.slice(0, 4).map((like, index) => (
            <div key={like._id || index} className="relative h-64 overflow-hidden rounded-3xl bg-slate-100">
              <img src={avatarOf(like)} alt="" className={cx('h-full w-full object-cover', premiumRank < 2 && 'blur-xl')} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                <p className="text-xl font-black">{premiumRank >= 2 ? `${like.nombre || 'Cahuin'}, ${like.edad || ''}` : `Alguien, ${like.edad || '??'}`}</p>
                <p className="text-sm font-bold text-amber-200">{like.activoReciente ? 'Activo recientemente' : 'Quedan 5 h'}</p>
              </div>
            </div>
          ))}
        </div>
        {premiumRank < 2 ? (
          <button onClick={() => setActive('tienda')} className="mt-5 h-14 w-full rounded-2xl bg-white font-black text-[#101828] shadow-lg dark:bg-white">
            Desbloquear con Gold
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StoreView({ products, buy, loading }) {
  const plans = products.filter((item) => item.type === 'premium');
  const packs = products.filter((item) => item.type === 'cahuines');
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-[#101828] p-6 text-white">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-200">Mercado Pago</p>
        <h2 className="mt-3 text-4xl font-black">Planes baratos, con Cahuines incluidos.</h2>
        <p className="mt-3 max-w-2xl text-slate-300">Compras desde la web y tu saldo aparece en la app porque comparten la misma cuenta.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {plans.map((plan, index) => (
          <div key={plan.id} className={cx('rounded-[2rem] border bg-white p-5 shadow-xl dark:bg-white/5', index === 1 ? 'border-amber-300 shadow-amber-100 dark:border-amber-500/40' : 'border-slate-200 shadow-rose-100 dark:border-white/10 dark:shadow-black/20')}>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black">{plan.title.replace(' mensual', '')}</p>
              {index === 1 ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Mas pedido</span> : null}
            </div>
            <p className="mt-4 text-3xl font-black">{formatCLP(plan.amount)}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">por mes {plan.bonusCahuines ? `· incluye ${plan.bonusCahuines} Cahuines` : ''}</p>
            <div className="mt-5 space-y-3">
              {(plan.features || []).map((feature) => (
                <div key={feature} className="flex gap-3">
                  <Star className="h-5 w-5 shrink-0 text-[#f0444f]" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">{feature}</p>
                </div>
              ))}
            </div>
            <button onClick={() => buy(plan.id)} disabled={loading} className="mt-6 h-13 w-full rounded-2xl bg-gradient-to-r from-[#f0444f] to-[#ff7659] py-4 font-black text-white shadow-lg shadow-rose-500/20 disabled:opacity-60">
              Pagar con Mercado Pago
            </button>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-2xl font-black">Packs de Cahuines</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {packs.map((pack) => (
            <div key={pack.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <Flame className="h-8 w-8 text-[#f0444f]" />
              <p className="mt-6 text-3xl font-black">{pack.cahuines?.toLocaleString('es-CL') || pack.title}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{formatCLP(pack.amount)}</p>
              <button onClick={() => buy(pack.id)} disabled={loading} className="mt-5 h-12 w-full rounded-2xl bg-[#101828] font-black text-white dark:bg-white dark:text-[#101828]">
                Comprar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RightRail({ user, profiles, setActive }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] overflow-y-auto xl:block">
      <div className="space-y-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="flex items-center gap-3">
            <img src={avatarOf(user)} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-black">{user.nombre}</p>
              <p className="truncate text-sm text-slate-500">{user.ciudad || 'Por definir'} · {user.premiumPlan || 'free'}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Cahuines" value={user.cahuines || 0} />
            <Stat label="Racha" value={user.rachaDias || 1} />
          </div>
          <button onClick={() => setActive('tienda')} className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-[#f0444f] to-[#ff7659] font-black text-white">
            Comprar en web
          </button>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-rose-100 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-black">Sugerencias</p>
            <button onClick={() => setActive('radar')} className="text-sm font-black text-[#f0444f]">Ver todos</button>
          </div>
          {(profiles?.length ? profiles : fallbackProfiles).slice(0, 5).map((profile) => (
            <div key={profile._id} className="flex items-center gap-3 py-3">
              <img src={avatarOf(profile)} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{profile.nombre}</p>
                <p className="truncate text-xs text-slate-500">{profile.ciudad || 'Cerca tuyo'}</p>
              </div>
              <button className="text-sm font-black text-[#f0444f]">Seguir</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
