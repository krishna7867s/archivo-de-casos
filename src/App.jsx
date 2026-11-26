import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { Music2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  fetchObras,
  fetchPersonajes,
  fetchRecomendaciones,
} from './lib/danganronpa.mjs';
import { audioEngine } from './lib/audioEngine.js';
import AccountSection from './components/AccountSection.jsx';
import HeroOpening from './components/HeroOpening.jsx';
import CatalogSection from './components/CatalogSection.jsx';
import EvidenceBoard from './components/EvidenceBoard.jsx';
import TrialRecommendations from './components/TrialRecommendations.jsx';
import DossierModal from './components/DossierModal.jsx';
import MiniTrialModal from './components/MiniTrialModal.jsx';

const CAST_GAME_SLUGS = ['dr1', 'dr2', 'v3', 'udg'];

const NAV_ITEMS = [
  ['obras', 'Obras'],
  ['personajes', 'Personajes'],
  ['recomendaciones', 'Recomendaciones'],
  ['mi-expediente', 'Mi expediente'],
];

function readSection() {
  const { hash } = window.location;
  if (hash.startsWith('#recuperar=')) return 'mi-expediente';
  if (hash.startsWith('#expediente-')) return window.history.state?.section || 'obras';
  const section = hash.slice(1);
  return NAV_ITEMS.some(([id]) => id === section) ? section : 'top';
}

export default function App() {
  // Datos desde Supabase
  const [obras, setObras] = useState([]);
  const [obrasLoading, setObrasLoading] = useState(true);
  const [obrasError, setObrasError] = useState(null);

  const [castObraSlug, setCastObraSlug] = useState('dr1');
  const [castBySlug, setCastBySlug] = useState({});
  const [castStatus, setCastStatus] = useState(null);
  const hasCast = Boolean(castBySlug[castObraSlug]);
  const castError = !hasCast && castStatus?.slug === castObraSlug ? castStatus.error : null;
  const castLoading = !hasCast && !castError;

  const [recomendaciones, setRecomendaciones] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState(null);

  // Navegación activa + control de sonido (inicia en silencio)
  const [activeSection, setActiveSection] = useState(readSection);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(() => audioEngine.volume);
  const [soundStarting, setSoundStarting] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);

  // Caso activo en portada
  const [heroActiveSlug, setHeroActiveSlug] = useState('dr1');

  // Filtros del catálogo
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [selectedPlatform, setSelectedPlatform] = useState('todas');

  // Expediente abierto + origen para transición compartida
  const [activeObra, setActiveObra] = useState(null);
  const [activeSharedCoverId, setActiveSharedCoverId] = useState(null);
  const [dossierCast, setDossierCast] = useState([]);
  const [dossierCastLoading, setDossierCastLoading] = useState(false);
  const [dossierCastError, setDossierCastError] = useState(null);

  // Tribunal opcional desde Recomendaciones
  const [miniTrialOpen, setMiniTrialOpen] = useState(false);
  const closeMiniTrial = useCallback(() => setMiniTrialOpen(false), []);

  const savedScrollYRef = useRef(0);
  const lastTriggerElRef = useRef(null);
  const pushedHistoryRef = useRef(false);

  useEffect(() => {
    const syncSection = () => setActiveSection(readSection());
    window.addEventListener('hashchange', syncSection);
    window.addEventListener('popstate', syncSection);
    return () => {
      window.removeEventListener('hashchange', syncSection);
      window.removeEventListener('popstate', syncSection);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeSection]);

  const changeSound = async (enabled) => {
    setSoundStarting(true);
    setSoundError('');
    try {
      setSoundEnabled(await audioEngine.setEnabled(enabled));
      setSoundVolume(audioEngine.volume);
      if (enabled) audioEngine.playSelectClick();
    } catch {
      await audioEngine.setEnabled(false);
      setSoundEnabled(false);
      setSoundError('El navegador no pudo iniciar el sonido.');
    } finally {
      setSoundStarting(false);
    }
  };

  const handleVolumeChange = (e) => {
    const nextVol = Number(e.target.value);
    setSoundVolume(nextVol);
    audioEngine.setVolume(nextVol);
    if ((nextVol > 0) !== soundEnabled) void changeSound(nextVol > 0);
  };

  const loadObras = useCallback(async () => {
    setObrasLoading(true);
    setObrasError(null);
    try {
      const data = await fetchObras();
      setObras(data);
    } catch (err) {
      setObrasError(err.message || 'No se pudieron cargar las obras.');
    } finally {
      setObrasLoading(false);
    }
  }, []);

  const loadCastForSlug = useCallback(async (slug) => {
    setCastStatus({ slug, error: null });
    try {
      const rows = await fetchPersonajes(slug);
      setCastBySlug((prev) => ({ ...prev, [slug]: rows }));
      return rows;
    } catch (err) {
      setCastStatus((current) => current?.slug === slug
        ? { slug, error: err.message || 'No se pudo cargar el reparto.' }
        : current);
      return null;
    }
  }, []);

  const loadRecomendaciones = useCallback(async () => {
    setRecsLoading(true);
    setRecsError(null);
    try {
      const data = await fetchRecomendaciones();
      setRecomendaciones(data);
    } catch (err) {
      setRecsError(err.message || 'No se pudieron cargar las recomendaciones.');
    } finally {
      setRecsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObras();
    loadRecomendaciones();
  }, [loadObras, loadRecomendaciones]);

  useEffect(() => {
    if (!hasCast) loadCastForSlug(castObraSlug);
  }, [castObraSlug, hasCast, loadCastForSlug]);

  const obrasConReparto = useMemo(() => {
    return CAST_GAME_SLUGS.map((slug) => obras.find((o) => o.slug === slug)).filter(
      Boolean
    );
  }, [obras]);

  const currentCastList = castBySlug[castObraSlug] || [];
  const currentCastObra = useMemo(
    () => obras.find((o) => o.slug === castObraSlug),
    [obras, castObraSlug]
  );

  const loadDossierCast = useCallback(async (slug) => {
    setDossierCastLoading(true);
    setDossierCastError(null);
    try {
      const rows = await fetchPersonajes(slug);
      setCastBySlug((prev) => ({ ...prev, [slug]: rows }));
      setDossierCast(rows);
    } catch (err) {
      setDossierCastError(err.message || 'Error al consultar el reparto.');
    } finally {
      setDossierCastLoading(false);
    }
  }, []);

  const restoreAfterClose = useCallback(() => {
    const targetY = savedScrollYRef.current;
    const triggerEl = lastTriggerElRef.current;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (
        triggerEl &&
        typeof triggerEl.focus === 'function' &&
        triggerEl.isConnected
      ) {
        triggerEl.focus({ preventScroll: true });
      }
    });
  }, []);

  const handleOpenObra = useCallback(
    (obra, triggerEl, source = 'catalog') => {
      savedScrollYRef.current = window.scrollY;
      lastTriggerElRef.current = triggerEl || document.activeElement;
      setActiveSharedCoverId(`${source}:${obra.slug}`);
      audioEngine.playSelectClick();

      if (!pushedHistoryRef.current) {
        window.history.pushState(
          { expediente: obra.slug, section: activeSection },
          '',
          `#expediente-${obra.slug}`
        );
        pushedHistoryRef.current = true;
      }

      setActiveObra(obra);

      if (castBySlug[obra.slug]) {
        setDossierCast(castBySlug[obra.slug]);
        setDossierCastLoading(false);
        setDossierCastError(null);
      } else {
        loadDossierCast(obra.slug);
      }
    },
    [activeSection, castBySlug, loadDossierCast]
  );

  const closeDossierImmediate = useCallback(() => {
    setActiveObra(null);
    restoreAfterClose();
  }, [restoreAfterClose]);

  const handleCloseObra = useCallback(() => {
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      window.history.back();
      return;
    }
    closeDossierImmediate();
  }, [closeDossierImmediate]);

  // Saltar desde un expediente a Personajes con la entrega correcta seleccionada
  const handleJumpToCast = useCallback((obraSlug) => {
    if (CAST_GAME_SLUGS.includes(obraSlug)) {
      setCastObraSlug(obraSlug);
    }
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      window.history.replaceState(null, '', '#personajes');
    }
    setActiveObra(null);
    setActiveSection('personajes');
    window.requestAnimationFrame(() => {
      document.getElementById('top')?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (activeObra) {
        pushedHistoryRef.current = false;
        closeDossierImmediate();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeObra, closeDossierImmediate]);

  return (
    <LayoutGroup>
      <div className="app-shell">
        <header className="site-header">
          <div className="container header-inner">
            <a href="#top" className="brand-mark" aria-current={activeSection === 'top' ? 'page' : undefined}>
              <span className="brand-dot" aria-hidden="true" />
              <span className="brand-title">Archivo de casos</span>
            </a>

            <nav className="site-nav" aria-label="Navegación principal">
              {NAV_ITEMS.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`nav-link ${activeSection === id ? 'is-current' : ''}`}
                  aria-current={activeSection === id ? 'page' : undefined}
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="audio-controls" aria-label="Control de sonido">
              <button
                type="button"
                className={`audio-toggle-btn ${soundEnabled ? 'is-on' : ''}`}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
                onClick={() => changeSound(!soundEnabled)}
                disabled={soundStarting}
              >
                {soundEnabled ? (
                  <Volume2 size={15} aria-hidden="true" />
                ) : (
                  <VolumeX size={15} aria-hidden="true" />
                )}
                <span>{soundEnabled ? 'Sonido activo' : 'Activar sonido'}</span>
              </button>

              <label className="sr-only" htmlFor="audio-volume-range">
                Volumen del sonido
              </label>
              <input
                id="audio-volume-range"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={handleVolumeChange}
                disabled={soundStarting}
                className="audio-volume-slider"
                aria-label="Volumen"
              />
              {soundError && <span role="status">{soundError}</span>}
              <details className="spotify-player" onToggle={(event) => {
                if (event.currentTarget.open) setSpotifyLoaded(true);
              }}>
                <summary className="audio-toggle-btn">
                  <Music2 size={15} aria-hidden="true" />
                  Spotify
                </summary>
                <div className="spotify-player-panel">
                  {spotifyLoaded && (
                    <iframe
                      title="Spotify · Banda sonora de Danganronpa: Trigger Happy Havoc"
                      src="https://open.spotify.com/embed/album/3OOQRkcyunBEAzAuPt8Zow"
                      width="100%"
                      height={352}
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </details>
            </div>
          </div>
        </header>

        <main id="top" tabIndex={-1}>
          <div className="case-bulletin-wrap">
            <div className="container case-bulletin is-opening">
              <p className="case-bulletin-title">Archivo de casos</p>
              <div className="case-bulletin-art" aria-hidden="true">
                <img src={import.meta.env.BASE_URL + 'images/dr-scrapbook-dossier.jpg'} alt="" />
                <img src={import.meta.env.BASE_URL + 'images/dr-animation-poster.jpg'} alt="" />
                <img src={import.meta.env.BASE_URL + 'images/dr-v3-keyart.jpg'} alt="" />
              </div>
            </div>
          </div>
          {activeSection === 'top' && (
            <HeroOpening
              obras={obras}
              loading={obrasLoading}
              error={obrasError}
              onRetry={loadObras}
              activeSlug={heroActiveSlug}
              onChangeActiveSlug={setHeroActiveSlug}
              onOpenObra={handleOpenObra}
              activeSharedCoverId={activeSharedCoverId}
            />
          )}

          {activeSection === 'obras' && (
            <CatalogSection
              obras={obras}
              loading={obrasLoading}
              error={obrasError}
              onRetry={loadObras}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTipo={selectedTipo}
              onTipoChange={setSelectedTipo}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              onSelectObra={handleOpenObra}
              activeSharedCoverId={activeSharedCoverId}
            />
          )}

          {activeSection === 'personajes' && (
            <section
              id="personajes"
              className="section-block cast-section"
              aria-labelledby="personajes-heading"
            >
              <div className="container">
                <div className="recs-header">
                  <h2 id="personajes-heading" className="section-title">
                    Personajes
                  </h2>
                  <p className="section-subtitle">
                    Elegí una entrega y buscá por nombre o talento para consultar
                    cada ficha sin spoilers.
                  </p>
                </div>

                {obrasConReparto.length > 0 && (
                  <div
                    className="cast-tabs-row"
                    role="tablist"
                    aria-label="Seleccionar entrega para ver su reparto"
                  >
                    {obrasConReparto.map((obra) => {
                      const isActive = obra.slug === castObraSlug;
                      return (
                        <button
                          key={obra.slug}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`cat-pill ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            audioEngine.playSelectClick();
                            setCastObraSlug(obra.slug);
                          }}
                        >
                          {obra.titulo}
                        </button>
                      );
                    })}
                  </div>
                )}

                {castError && (
                  <div className="error-panel" role="alert">
                    <div>
                      <h3 className="error-panel-title">
                        No se pudo cargar el reparto
                      </h3>
                      <p className="error-panel-msg">{castError}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-stage-primary"
                      onClick={() => loadCastForSlug(castObraSlug)}
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      <span>Reintentar</span>
                    </button>
                  </div>
                )}

                {castLoading && !castError && (
                  <div className="skeleton-card is-wide-skeleton" aria-busy="true" />
                )}

                {!castLoading && !castError && currentCastList.length > 0 && (
                  <EvidenceBoard
                    key={castObraSlug}
                    personajes={currentCastList}
                    obraTitulo={currentCastObra?.titulo}
                    obraSlug={castObraSlug}
                    boardId={`cast-${castObraSlug}`}
                    showSearch
                  />
                )}
              </div>
            </section>
          )}

          {activeSection === 'recomendaciones' && (
            <TrialRecommendations
              recomendaciones={recomendaciones}
              loading={recsLoading}
              error={recsError}
              onRetry={loadRecomendaciones}
              onOpenMiniTrial={() => setMiniTrialOpen(true)}
            />
          )}
          {activeSection === 'mi-expediente' && (
            <AccountSection />
          )}
        </main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <span>Archivo de casos · Danganronpa en español</span>
            <span className="mono">Catálogo conectado a Supabase</span>
          </div>
        </footer>

        <AnimatePresence onExitComplete={() => setActiveSharedCoverId(null)}>
          {activeObra && (
            <DossierModal
              obra={activeObra}
              cast={dossierCast}
              castLoading={dossierCastLoading}
              castError={dossierCastError}
              onRetryCast={() => loadDossierCast(activeObra.slug)}
              onJumpToCast={handleJumpToCast}
              onClose={handleCloseObra}
            />
          )}
        </AnimatePresence>

        {miniTrialOpen && (
          <MiniTrialModal onClose={closeMiniTrial} cast={castBySlug.dr1} />
        )}
      </div>
    </LayoutGroup>
  );
}
