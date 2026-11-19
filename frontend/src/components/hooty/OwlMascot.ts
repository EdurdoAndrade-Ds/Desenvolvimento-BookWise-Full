/**
 * OwlMascot — lógica do Hooty (olhar o cursor, piscar, dormir, girar a placa).
 *
 * Estados (data-mood no elemento .owl): awake · angry (hover) · sleeping
 * Chame destroy() ao desmontar (o componente <Hooty /> já faz isso).
 */

export type OwlMood = 'awake' | 'angry' | 'sleeping';

export interface OwlOptions {
  /** texto inicial da placa */
  page?: string;
  /** ms sem atividade até a coruja dormir */
  sleepAfter?: number;
  /** quanto a pupila anda (unidades do SVG) */
  maxLook?: number;
  /** chamado a cada mudança de humor */
  onMood?: (mood: OwlMood) => void;
}

interface Look {
  x: number;
  y: number;
  tilt: number;
}

function must<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`OwlMascot: elemento "${selector}" não encontrado`);
  return el;
}

export class OwlMascot {
  private readonly root: HTMLElement;
  private readonly sleepAfter: number;
  private readonly maxLook: number;
  private readonly reduced: boolean;
  private readonly onMood?: (mood: OwlMood) => void;

  private readonly pupils: SVGGElement[];
  private readonly tilt: SVGGElement;
  private readonly signTilt: HTMLElement;
  private readonly sign: { spin: HTMLElement; front: HTMLElement; back: HTMLElement };

  private page: string;
  private target: Look = { x: 0, y: 0, tilt: 0 };
  private cur: Look = { x: 0, y: 0, tilt: 0 };
  private pointer: { x: number; y: number } | null = null;
  private hover = false;
  private sleeping = false;

  private raf = 0;
  private blinkT?: number;
  private sleepT?: number;
  private swapT?: number;
  private spinAnim?: Animation;
  private cleanups: Array<() => void> = [];

  constructor(root: HTMLElement, opts: OwlOptions = {}) {
    this.root = root;
    this.sleepAfter = opts.sleepAfter ?? 9000;
    this.maxLook = opts.maxLook ?? 9;
    this.onMood = opts.onMood;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.pupils = Array.from(root.querySelectorAll<SVGGElement>('[data-eye]'));
    this.tilt = must<SVGGElement>(root, '.owl__tilt');
    this.signTilt = must<HTMLElement>(root, '.sign__tilt');
    this.sign = {
      spin: must<HTMLElement>(root, '.sign__spin'),
      front: must<HTMLElement>(root, '.sign__face--front .sign__label'),
      back: must<HTMLElement>(root, '.sign__face--back .sign__label'),
    };

    this.page = opts.page ?? '';
    this.sign.front.textContent = this.page;

    this.bind();
    this.raf = requestAnimationFrame(this.loop);
    this.scheduleBlink();
    this.resetSleepTimer();
  }

  /** desmonta tudo: listeners, timers, animações */
  destroy(): void {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.blinkT);
    window.clearTimeout(this.sleepT);
    window.clearTimeout(this.swapT);
    this.spinAnim?.cancel();
    this.cleanups.forEach((off) => off());
    this.cleanups = [];
  }

  get mood(): OwlMood {
    return (this.root.dataset.mood as OwlMood) ?? 'awake';
  }

  private setMood(m: OwlMood): void {
    if (this.mood === m) return;
    this.root.dataset.mood = m;
    this.root.dispatchEvent(new CustomEvent<OwlMood>('owl:mood', { detail: m }));
    this.onMood?.(m);
  }

  private refreshMood(): void {
    this.setMood(this.sleeping ? 'sleeping' : this.hover ? 'angry' : 'awake');
  }

  private listen(target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions): void {
    target.addEventListener(type, fn, opts);
    this.cleanups.push(() => target.removeEventListener(type, fn, opts));
  }

  private bind(): void {
    const activity = (e: Event) => {
      const pe = e as PointerEvent;
      if (pe.clientX !== undefined) this.pointer = { x: pe.clientX, y: pe.clientY };
      this.wake();
      this.resetSleepTimer();
    };
    this.listen(window, 'pointermove', activity, { passive: true });
    this.listen(window, 'pointerdown', activity, { passive: true });
    this.listen(window, 'keydown', activity);
    this.listen(window, 'scroll', activity, { passive: true });
    this.listen(document.documentElement, 'pointerleave', () => {
      this.pointer = null;
    });

    this.listen(this.root, 'pointerenter', () => {
      this.hover = true;
      this.refreshMood();
    });
    this.listen(this.root, 'pointerleave', () => {
      this.hover = false;
      this.refreshMood();
    });
    this.listen(this.root, 'click', () => this.hop());
  }

  /* --- olhar para o cursor --- */
  private loop = (): void => {
    const r = this.root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.44;

    if (this.pointer && !this.sleeping) {
      const dx = this.pointer.x - cx;
      const dy = this.pointer.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const strength = Math.min(1, dist / 220);
      const nx = dx / dist;
      const ny = dy / dist;
      this.target.x = nx * this.maxLook * strength;
      this.target.y = ny * this.maxLook * strength;
      this.target.tilt = nx * strength * 4; // graus
    } else {
      this.target.x = this.target.y = this.target.tilt = 0;
    }

    const k = this.reduced ? 1 : 0.18;
    this.cur.x += (this.target.x - this.cur.x) * k;
    this.cur.y += (this.target.y - this.cur.y) * k;
    this.cur.tilt += (this.target.tilt - this.cur.tilt) * k;

    const t = `translate(${this.cur.x.toFixed(2)} ${this.cur.y.toFixed(2)})`;
    this.pupils.forEach((p) => p.setAttribute('transform', t));
    const rot = `rotate(${this.cur.tilt.toFixed(2)}deg)`;
    this.tilt.style.transform = rot;
    this.signTilt.style.transform = rot; // a placa acompanha a inclinação do corpo

    this.raf = requestAnimationFrame(this.loop);
  };

  /* --- piscar --- */
  private scheduleBlink(): void {
    window.clearTimeout(this.blinkT);
    this.blinkT = window.setTimeout(() => {
      if (!this.sleeping) {
        this.blink();
        if (Math.random() < 0.25) window.setTimeout(() => this.blink(), 220); // piscada dupla
      }
      this.scheduleBlink();
    }, 2200 + Math.random() * 3600);
  }

  private blink(): void {
    this.root.classList.add('is-blinking');
    window.setTimeout(() => this.root.classList.remove('is-blinking'), 130);
  }

  /* --- dormir / acordar --- */
  private resetSleepTimer(): void {
    window.clearTimeout(this.sleepT);
    this.sleepT = window.setTimeout(() => this.sleep(), this.sleepAfter);
  }

  private sleep(): void {
    this.sleeping = true;
    this.refreshMood();
  }

  private wake(): void {
    if (!this.sleeping) return;
    this.sleeping = false;
    this.refreshMood();
    window.setTimeout(() => this.blink(), 250); // piscada de quem acordou
  }

  /* --- placa: gira 360° e troca o nome da página --- */
  setPage(label: string): void {
    if (!label || label === this.page) return;
    const s = this.sign;
    this.page = label;
    window.clearTimeout(this.swapT);
    this.spinAnim?.cancel();
    if (this.reduced) {
      s.front.textContent = label;
      return;
    }
    const dur = 900;
    s.back.textContent = label; // a face de trás já mostra o novo nome
    this.spinAnim = s.spin.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
      { duration: dur, easing: 'cubic-bezier(.45,.05,.55,.95)' },
    );
    this.swapT = window.setTimeout(() => {
      s.front.textContent = label; // troca com a frente escondida
    }, dur / 2);
    this.spinAnim.onfinish = () => {
      s.front.textContent = label;
    };
    this.wake();
    this.resetSleepTimer();
  }

  /* --- clique: pulinho --- */
  private hop(): void {
    const el = this.root;
    el.classList.remove('is-hopping');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('is-hopping');
    el.addEventListener('animationend', function done(e: AnimationEvent) {
      if (e.target !== el) return;
      el.classList.remove('is-hopping');
      el.removeEventListener('animationend', done);
    });
  }
}
