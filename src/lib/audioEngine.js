/**
 * Motor de sonido para Archivo de casos.
 * - Inicia siempre en silencio y recuerda preferencia + volumen en localStorage.
 * - Respeta restricciones del navegador (solo inicia AudioContext tras interacción).
 * - Soporta pistas opcionales desde Supabase Storage si se configuran, con
 *   síntesis Web Audio propia como respaldo inmediato para evitar silencios rotos.
 * - Crossfade breve entre exploración y tribunal, y cancelación limpia al salir.
 */

const STORAGE_ENABLED_KEY = 'dr_archivo_audio_enabled_v1';
const STORAGE_VOLUME_KEY = 'dr_archivo_audio_volume_v1';

// Opcional: si se alojan pistas autorizadas en Supabase Storage, se pueden declarar aquí.
const STORAGE_TRACKS = {
  explore: null,
  tribunal: null,
};

class ArchivoAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = false;
    this.volume = 0.45;
    this.scene = 'explore'; // 'explore' | 'tribunal'
    this.loopTimer = null;
    this.activeNodes = new Set();
    this.audioElements = {};
    this.loadPreferences();
  }

  loadPreferences() {
    if (typeof window === 'undefined') return;
    try {
      const savedVol = Number(window.localStorage.getItem(STORAGE_VOLUME_KEY));
      if (!Number.isNaN(savedVol) && savedVol >= 0 && savedVol <= 1) {
        this.volume = savedVol;
      }
      // Siempre inicia en silencio al cargar la página para respetar al usuario y al navegador,
      // pero conservamos la preferencia de volumen.
      this.enabled = false;
    } catch {
      // ignorar si localStorage no está disponible
    }
  }

  savePreferences() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_ENABLED_KEY, this.enabled ? '1' : '0');
      window.localStorage.setItem(STORAGE_VOLUME_KEY, String(this.volume));
    } catch {
      // ignorar
    }
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(nextEnabled) {
    this.enabled = Boolean(nextEnabled);
    this.savePreferences();

    if (!this.enabled) {
      this.stopAllMusic();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      }
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.08);
    this.startSceneLoop(this.scene);
  }

  setVolume(nextVol) {
    const clamped = Math.max(0, Math.min(1, Number(nextVol) || 0));
    this.volume = clamped;
    this.savePreferences();

    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
    Object.values(this.audioElements).forEach((el) => {
      if (el) el.volume = this.enabled ? this.volume : 0;
    });
  }

  setScene(nextScene) {
    if (this.scene === nextScene) return;
    this.scene = nextScene;
    if (!this.enabled) return;
    this.stopAllMusic();
    this.startSceneLoop(nextScene);
  }

  stopAllMusic() {
    if (this.loopTimer) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ya detenido
      }
    });
    this.activeNodes.clear();

    Object.values(this.audioElements).forEach((el) => {
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // ignorar
        }
      }
    });
  }

  startSceneLoop(sceneName) {
    if (!this.enabled) return;

    // Si hay una pista configurada en Storage, intentamos usarla con fallback silencioso al sintetizador
    const storageUrl = STORAGE_TRACKS[sceneName];
    if (storageUrl && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(storageUrl);
        audio.loop = true;
        audio.volume = this.volume;
        audio.onerror = () => this.startSynthLoop(sceneName);
        audio.play().catch(() => this.startSynthLoop(sceneName));
        this.audioElements[sceneName] = audio;
        return;
      } catch {
        // fallback al sintetizador
      }
    }

    this.startSynthLoop(sceneName);
  }

  startSynthLoop(sceneName) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    let step = 0;
    const isTribunal = sceneName === 'tribunal';
    const intervalMs = isTribunal ? 290 : 1400;
    const notes = isTribunal
      ? [110, 110, 130.81, 110, 146.83, 130.81, 123.47, 98]
      : [82.41, 98.0, 110.0, 92.5];

    const triggerPulse = () => {
      if (!this.enabled || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = isTribunal ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(notes[step % notes.length], now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isTribunal ? 540 : 280, now);

      const peak = isTribunal ? 0.14 : 0.08;
      const dur = isTribunal ? 0.22 : 1.15;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + dur + 0.02);
      this.activeNodes.add(osc);
      osc.onended = () => this.activeNodes.delete(osc);

      step += 1;
    };

    triggerPulse();
    this.loopTimer = window.setInterval(triggerPulse, intervalMs);
  }

  /** Clic seco para cambio de personaje o caso */
  playSelectClick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** Pausa breve + golpe seco sincronizado con la salpicadura rosa */
  playContradictionHit() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Pausa breve en la pista de tribunal antes del golpe
    this.stopAllMusic();

    const hitTimer = window.setTimeout(() => {
      if (!this.enabled || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.24);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    }, 120);

    return hitTimer;
  }

  /** Aviso grave y corto para prueba incorrecta */
  playWrongBuzz() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.linearRampToValueAtTime(98, now + 0.14);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }
}

export const audioEngine = new ArchivoAudioEngine();
