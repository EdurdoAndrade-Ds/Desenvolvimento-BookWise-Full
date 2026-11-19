'use client'; // necessário só no Next.js (App Router). Em Vite/CRA pode ficar: é inofensivo.

import { useEffect, useId, useRef, useState } from 'react';
import { OwlMascot, type OwlMood } from './OwlMascot';
import './hooty.css';

const LINES: Record<OwlMood, string> = {
  awake: 'Hooty aqui! O que vamos ler hoje?',
  angry: 'Hoo! Quem está me cutucando?',
  sleeping: 'Zzz… me chame se precisar.',
};

export interface HootyProps {
  /** nome da página atual: aparece na placa (e no balão). Mude-o e a placa gira. */
  page?: string;
  /** 'compact' (padrão, cabe na sidebar de 80px) ou 'full' (versão grande) */
  size?: 'compact' | 'full';
  /** cresce ao passar o mouse para a placa ficar legível (só no desktop) */
  zoom?: boolean;
  className?: string;
}

export function Hooty({ page = 'Início', size = 'compact', zoom = true, className = '' }: HootyProps) {
  const owlRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<OwlMascot | null>(null);
  const [mood, setMood] = useState<OwlMood>('awake');
  // ids únicos dos gradientes do SVG (evita conflito se houver 2 Hooties na tela)
  const uid = useId().replace(/:/g, '');

  // cria o mascote uma vez e desmonta ao sair
  useEffect(() => {
    if (!owlRef.current) return;
    const mascot = new OwlMascot(owlRef.current, { page, onMood: setMood });
    mascotRef.current = mascot;
    return () => {
      mascot.destroy();
      mascotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quando a página muda, a placa gira
  useEffect(() => {
    mascotRef.current?.setPage(page);
  }, [page]);

  return (
    <div
      className={[
        'hooty',
        size === 'full' ? 'hooty--full' : '',
        zoom && size !== 'full' ? 'hooty--zoom' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hooty__disc" aria-hidden="true">
        <svg viewBox="0 0 315 315" focusable="false">
          <g className="hooty-line" strokeWidth="1.2" strokeOpacity=".35">
            <rect className="hb1" x="75" y="270" width="165" height="45" rx="3"/>
            <rect className="hb2" x="89" y="252" width="137" height="18" rx="3"/>
            <rect className="hpage" x="89" y="252" width="8" height="18" rx="2"/>
            <rect className="hb3" x="105" y="235" width="105" height="17" rx="3"/>
            <rect className="hpage" x="202" y="235" width="8" height="17" rx="2"/>
            <rect className="hb4" x="99" y="218" width="117" height="17" rx="3"/>
            <rect className="hpage" x="99" y="218" width="8" height="17" rx="2"/>
            <rect className="hb5" x="112" y="202" width="91" height="16" rx="3"/>
            <rect className="hpage" x="195" y="202" width="8" height="16" rx="2"/>
            <ellipse cx="157.5" cy="202.5" rx="34" ry="3.5" fill="#000" opacity=".3" stroke="none"/>
          </g>
          <g fill="none" strokeWidth="1.6" strokeLinecap="round">
            <path className="hs-b4" d="M128 205v10M135 205v10"/>
            <path className="hs-b3" d="M187 221v11M194 221v11"/>
            <path className="hs-sp" d="M121 238v11M128 238v11"/>
            <path className="hs-b3" d="M105 255v12M112 255v12"/>
            <path className="hs-sp" d="M120 276v16M127 276v16"/>
          </g>
        </svg>
      </div>

      <div
        ref={owlRef}
        className="owl"
        data-mood="awake"
        role="img"
        aria-label={`Hooty, o mascote da BookWise. Página atual: ${page}`}
      >
        <div className="owl__rig">
          <div className="sign__tilt" aria-hidden="true">
            <div className="sign__lean">
              <div className="sign">
                <div className="sign__spin">
                  <div className="sign__face sign__face--front"><span className="sign__label" /></div>
                  <div className="sign__face sign__face--back"><span className="sign__label" /></div>
                </div>
              </div>
            </div>
          </div>
          <svg className="owl__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={`${uid}oBase`} gradientUnits="userSpaceOnUse" x1="100" y1="30" x2="100" y2="182">
                <stop offset="0" className="hg-top"/>
                <stop offset=".5" className="hg-top"/>
                <stop offset="1" className="hg-bot"/>
              </linearGradient>
              <radialGradient id={`${uid}oBlue`} gradientUnits="userSpaceOnUse" cx="38" cy="120" r="80">
                <stop offset="0" className="hg-l"/>
                <stop offset="1" className="hg-l" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id={`${uid}oPink`} gradientUnits="userSpaceOnUse" cx="160" cy="70" r="80">
                <stop offset="0" className="hg-r"/>
                <stop offset="1" className="hg-r" stopOpacity="0"/>
              </radialGradient>
              <linearGradient id={`${uid}oWing`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className="hg-wing-top"/>
                <stop offset="1" className="hg-wing-bot"/>
              </linearGradient>
              <path id={`${uid}oShape`} d="M46 84C46 50 70 36 100 36s54 14 54 48v44c0 32-22 50-54 50s-54-18-54-50ZM52 72 44 32l40 14ZM148 72l8-40-40 14Z"/>
            </defs>

            <g className="owl__tilt">
              <g className="owl__torso">
                <ellipse className="h-feet" cx="84" cy="183" rx="10" ry="5"/>
                <ellipse className="h-feet" cx="116" cy="183" rx="10" ry="5"/>

                <g strokeWidth="6" strokeLinejoin="round">
                  <use href={`#${uid}oShape`} fill={`url(#${uid}oBase)`} stroke={`url(#${uid}oBase)`}/>
                  <use href={`#${uid}oShape`} fill={`url(#${uid}oBlue)`} stroke={`url(#${uid}oBlue)`}/>
                  <use href={`#${uid}oShape`} fill={`url(#${uid}oPink)`} stroke={`url(#${uid}oPink)`}/>
                </g>

                <ellipse className="h-belly" cx="100" cy="146" rx="34" ry="28" opacity=".55"/>
                <g className="h-belly-line" fill="none" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round">
                  <path d="M82 132q6 6 12 0q6 6 12 0q6 6 12 0"/>
                  <path d="M76 145q6 6 12 0q6 6 12 0q6 6 12 0q6 6 12 0"/>
                  <path d="M82 158q6 6 12 0q6 6 12 0q6 6 12 0"/>
                </g>

                <path className="wing wing--l" d="M50 106C30 116 24 144 38 164c14-4 20-22 18-42Z" fill={`url(#${uid}oWing)`}/>
                <path className="wing wing--r" d="M148 104C174 106 200 130 192 166C176 166 156 148 150 124Z" fill={`url(#${uid}oWing)`}/>
                <path className="h-feather" d="M176 122q10 14 8 36M166 126q6 12 6 26" fill="none" strokeWidth="2.2" strokeLinecap="round" opacity=".55"/>

                <g className="eye eye--l">
                  <circle className="h-eye" cx="76" cy="88" r="21"/>
                  <g className="pupil" data-eye>
                    <circle className="h-ink" cx="76" cy="88" r="9.5"/>
                    <circle className="h-eye" cx="72.5" cy="84.5" r="2.8"/>
                  </g>
                </g>
                <g className="eye eye--r">
                  <circle className="h-eye" cx="124" cy="88" r="21"/>
                  <g className="pupil" data-eye>
                    <circle className="h-ink" cx="124" cy="88" r="9.5"/>
                    <circle className="h-eye" cx="120.5" cy="84.5" r="2.8"/>
                  </g>
                </g>

                <g className="brows h-ink-stroke" strokeWidth="5" strokeLinecap="round">
                  <line x1="64" y1="67" x2="90" y2="76"/>
                  <line x1="136" y1="67" x2="110" y2="76"/>
                </g>

                <path className="h-ink-both" d="M92 104Q100 99 108 104L100 119Z" strokeWidth="3" strokeLinejoin="round"/>
              </g>
            </g>
          </svg>
        </div>
        <span className="owl__zs" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></span>
      </div>

      <div className="hooty__bubble" aria-hidden="true">
        {LINES[mood]}
        <small>Você está em: {page}</small>
      </div>
    </div>
  );
}

export default Hooty;