import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import WorkCover from './WorkCover.jsx';
import {
  ESTADO_LABELS,
  getCoverSetting,
  TIPO_LABELS,
} from '../lib/archivoMeta.js';

const TYPE_ORDER = [
  'todos',
  'principal',
  'derivado',
  'remake',
  'coleccion',
  'anime',
  'ova',
  'novela',
  'manga',
];

function WorkCard({
  obra,
  onSelectObra,
  variant = 'wide',
  prefersReduced,
  activeSharedCoverId,
}) {
  const isAnnounced = obra.estado === 'anunciado';
  const isClosed = obra.estado === 'cerrado';
  const plataformas = Array.isArray(obra.plataformas) ? obra.plataformas : [];
  const setting = getCoverSetting(obra);
  const frameClass =
    variant === 'portrait'
      ? 'is-portrait-frame'
      : variant === 'auto' && setting.orientation === 'portrait'
        ? 'is-portrait-frame'
        : 'is-wide-frame';

  const cardLayoutId =
    activeSharedCoverId === `catalog:${obra.slug}` && !prefersReduced
      ? `shared-cover-${obra.slug}`
      : undefined;

  return (
    <motion.article
      layout={prefersReduced ? false : 'position'}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
      transition={{
        layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.16 },
      }}
      className={`catalog-card ${variant === 'principal' ? 'is-principal-card' : ''} ${frameClass}`}
    >
      <button
        type="button"
        className="catalog-card-trigger"
        data-obra-slug={obra.slug}
        onClick={(e) => onSelectObra(obra, e.currentTarget, 'catalog')}
      >
        <motion.div
          layoutId={cardLayoutId}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="catalog-card-media"
        >
          <div className="catalog-card-art">
            <WorkCover
              obra={obra}
              forceContain={variant === 'portrait'}
            />
          </div>
          <span className="catalog-card-action" aria-hidden="true">
            <span>Abrir expediente</span>
            <ArrowUpRight size={13} />
          </span>
        </motion.div>

        <div className="catalog-card-body">
          <div className="catalog-card-meta">
            <span className="mono">{obra.anio || 'S/F'}</span>
            {isAnnounced ? (
              <span className="status-badge is-announced">Anunciado</span>
            ) : isClosed ? (
              <span className="status-badge is-closed">
                {ESTADO_LABELS.cerrado}
              </span>
            ) : (
              <span className="mono meta-type">
                {TIPO_LABELS[obra.tipo] || obra.tipo}
              </span>
            )}
          </div>

          <h3 className="catalog-card-title">{obra.titulo}</h3>

          {plataformas.length > 0 && (
            <div className="catalog-card-platforms">
              {plataformas.slice(0, 3).map((plat) => (
                <span key={plat} className="platform-pill">
                  {plat}
                </span>
              ))}
              {plataformas.length > 3 && (
                <span className="platform-pill">+{plataformas.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </button>
    </motion.article>
  );
}

export default function CatalogSection({
  obras,
  loading,
  error,
  onRetry,
  searchQuery,
  onSearchChange,
  selectedTipo,
  onTipoChange,
  selectedPlatform,
  onPlatformChange,
  onSelectObra,
  activeSharedCoverId,
}) {
  const prefersReduced = useReducedMotion();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availablePlatforms = useMemo(() => {
    const set = new Set();
    obras.forEach((o) => {
      if (Array.isArray(o.plataformas)) {
        o.plataformas.forEach((p) => set.add(p));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [obras]);

  const countsByTipo = useMemo(() => {
    const counts = { todos: obras.length };
    obras.forEach((o) => {
      counts[o.tipo] = (counts[o.tipo] || 0) + 1;
    });
    return counts;
  }, [obras]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedTipo !== 'todos' ||
    selectedPlatform !== 'todas';

  const activeSecondaryCount =
    (selectedTipo !== 'todos' ? 1 : 0) +
    (selectedPlatform !== 'todas' ? 1 : 0);

  const filteredObras = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return obras.filter((obra) => {
      if (selectedTipo !== 'todos' && obra.tipo !== selectedTipo) return false;
      if (selectedPlatform !== 'todas') {
        const plats = Array.isArray(obra.plataformas) ? obra.plataformas : [];
        if (!plats.includes(selectedPlatform)) return false;
      }
      if (q) {
        const haystack =
          `${obra.titulo} ${obra.resumen || ''} ${obra.anio || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [obras, searchQuery, selectedTipo, selectedPlatform]);

  const grouped = useMemo(() => {
    const principales = obras.filter((o) => o.tipo === 'principal');
    const derivadosYCol = obras.filter((o) =>
      ['derivado', 'remake', 'coleccion'].includes(o.tipo)
    );
    const animeYOva = obras.filter((o) => ['anime', 'ova'].includes(o.tipo));
    const publicaciones = obras.filter((o) =>
      ['novela', 'manga'].includes(o.tipo)
    );
    return { principales, derivadosYCol, animeYOva, publicaciones };
  }, [obras]);

  const resetFilters = () => {
    onSearchChange('');
    onTipoChange('todos');
    onPlatformChange('todas');
  };

  return (
    <section id="obras" className="section-block catalog-section" aria-labelledby="obras-heading">
      <div className="container">
        <div className="catalog-head-row">
          <div>
            <h2 id="obras-heading" className="section-title">
              Catálogo de obras
            </h2>
            <p className="section-subtitle">
              Las 25 entregas del archivo con sus portadas originales y fichas
              sin spoilers.
            </p>
          </div>
          {!loading && !error && (
            <span className="catalog-counter mono">
              {hasActiveFilters
                ? `${filteredObras.length} de ${obras.length} resultados`
                : `${obras.length} obras`}
            </span>
          )}
        </div>

        <div className="catalog-toolbar">
          <div className="toolbar-primary-row">
            <div className="search-field">
              <Search size={16} className="search-icon" aria-hidden="true" />
              <label htmlFor="catalog-search" className="sr-only">
                Buscar por título
              </label>
              <input
                id="catalog-search"
                type="search"
                className="compact-input"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título o año..."
              />
            </div>

            <div className="platform-field desktop-only-field">
              <label htmlFor="platform-filter" className="sr-only">
                Filtrar por plataforma
              </label>
              <select
                id="platform-filter"
                className="compact-select"
                value={selectedPlatform}
                onChange={(e) => onPlatformChange(e.target.value)}
              >
                <option value="todas">Todas las plataformas</option>
                {availablePlatforms.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={`mobile-filters-toggle ${mobileFiltersOpen ? 'is-open' : ''}`}
              aria-expanded={mobileFiltersOpen}
              aria-controls="catalog-secondary-filters"
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span>Filtros</span>
              {activeSecondaryCount > 0 && (
                <span className="mobile-filter-badge">{activeSecondaryCount}</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-compact"
                onClick={resetFilters}
                aria-label="Limpiar filtros"
              >
                <X size={14} aria-hidden="true" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div
            id="catalog-secondary-filters"
            className={`toolbar-secondary-row ${mobileFiltersOpen ? 'is-mobile-visible' : ''}`}
          >
            <div className="platform-field mobile-only-field">
              <label htmlFor="platform-filter-mobile" className="sr-only">
                Filtrar por plataforma
              </label>
              <select
                id="platform-filter-mobile"
                className="compact-select"
                value={selectedPlatform}
                onChange={(e) => onPlatformChange(e.target.value)}
              >
                <option value="todas">Todas las plataformas</option>
                {availablePlatforms.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="category-single-row"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {TYPE_ORDER.filter((t) => t === 'todos' || countsByTipo[t]).map(
                (tipo) => {
                  const isActive = selectedTipo === tipo;
                  const label =
                    tipo === 'todos' ? 'Todas' : TIPO_LABELS[tipo] || tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      aria-pressed={isActive}
                      className={`cat-pill ${isActive ? 'is-active' : ''}`}
                      onClick={() => onTipoChange(tipo)}
                    >
                      <span>{label}</span>
                      <span className="cat-pill-count">{countsByTipo[tipo] || 0}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-panel" role="alert">
            <div>
              <h3 className="error-panel-title">
                No se pudo cargar el catálogo de obras
              </h3>
              <p className="error-panel-msg">{error}</p>
            </div>
            <button type="button" className="btn-stage-primary" onClick={onRetry}>
              <RotateCcw size={15} aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="principal-trio-grid" aria-busy="true">
            <div className="skeleton-card is-wide-skeleton" />
            <div className="skeleton-card is-wide-skeleton" />
            <div className="skeleton-card is-wide-skeleton" />
          </div>
        )}

        {!loading && !error && hasActiveFilters && (
          <>
            {filteredObras.length === 0 ? (
              <div className="empty-state-box">
                <p>No hay obras que coincidan con la búsqueda o filtros activos.</p>
                <button
                  type="button"
                  className="btn-secondary-dark"
                  onClick={resetFilters}
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="filtered-results-grid">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredObras.map((obra) => (
                    <WorkCard
                      key={obra.slug}
                      obra={obra}
                      variant="auto"
                      onSelectObra={onSelectObra}
                      prefersReduced={prefersReduced}
                      activeSharedCoverId={activeSharedCoverId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {!loading && !error && !hasActiveFilters && (
          <div className="catalog-groups">
            <div className="catalog-group-block">
              <div className="group-header">
                <h3 className="group-title">Trilogía principal</h3>
                <span className="group-count mono">{grouped.principales.length} juegos</span>
              </div>
              <div className="principal-trio-grid">
                {grouped.principales.map((obra) => (
                  <WorkCard
                    key={obra.slug}
                    obra={obra}
                    variant="principal"
                    onSelectObra={onSelectObra}
                    prefersReduced={prefersReduced}
                    activeSharedCoverId={activeSharedCoverId}
                  />
                ))}
              </div>
            </div>

            <div className="catalog-group-block">
              <div className="group-header">
                <h3 className="group-title">Derivados, remakes y colecciones</h3>
                <span className="group-count mono">{grouped.derivadosYCol.length} entregas</span>
              </div>
              <div className="derivados-grid">
                {grouped.derivadosYCol.map((obra) => (
                  <WorkCard
                    key={obra.slug}
                    obra={obra}
                    variant="wide"
                    onSelectObra={onSelectObra}
                    prefersReduced={prefersReduced}
                    activeSharedCoverId={activeSharedCoverId}
                  />
                ))}
              </div>
            </div>

            <div className="catalog-group-block">
              <div className="group-header">
                <h3 className="group-title">Anime y OVA</h3>
                <span className="group-count mono">{grouped.animeYOva.length} títulos</span>
              </div>
              <div className="anime-grid">
                {grouped.animeYOva.map((obra) => (
                  <WorkCard
                    key={obra.slug}
                    obra={obra}
                    variant={obra.slug === 'dr25' ? 'wide' : 'portrait'}
                    onSelectObra={onSelectObra}
                    prefersReduced={prefersReduced}
                    activeSharedCoverId={activeSharedCoverId}
                  />
                ))}
              </div>
            </div>

            <div className="catalog-group-block">
              <div className="group-header">
                <h3 className="group-title">Novelas y manga</h3>
                <span className="group-count mono">{grouped.publicaciones.length} publicaciones</span>
              </div>
              <div className="books-grid">
                {grouped.publicaciones.map((obra) => (
                  <WorkCard
                    key={obra.slug}
                    obra={obra}
                    variant="portrait"
                    onSelectObra={onSelectObra}
                    prefersReduced={prefersReduced}
                    activeSharedCoverId={activeSharedCoverId}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
