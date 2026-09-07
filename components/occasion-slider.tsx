'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/types';
import { AdaptiveImage } from './adaptive-image';

const occasions = [
  { name: 'Birthday', mark: '♡', slug: 'birthday', copy: 'Big wishes, beautifully wrapped.' },
  { name: 'Anniversary', mark: '♢', slug: 'anniversary', copy: 'For every chapter of your story.' },
  { name: 'Wedding', mark: '✦', slug: 'wedding', copy: 'Keepsakes for their forever.' },
  { name: 'Thank you', mark: '★', slug: 'thank-you', copy: 'A thoughtful way to say it.' },
  { name: 'Congratulations', mark: '☺', slug: 'congratulations', copy: 'Make their proud moment brighter.' },
  { name: 'Just because', mark: '✽', slug: 'just-because', copy: 'No date needed. Just delight.' },
  { name: 'New beginnings', mark: '◇', slug: 'new-beginnings', copy: 'Fresh starts deserve something special.' },
];

export function OccasionSlider({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const active = occasions[index];
  const product = products[index % Math.max(products.length, 1)];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % occasions.length), 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => setIndex((value) => (value + direction + occasions.length) % occasions.length);

  return (
    <section className="occasion-showcase shell" aria-roledescription="carousel" aria-label="Shop gifts by occasion" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1); touchStart.current = null; }}>
      <div className="occasion-stage">
        <div className="occasion-stage-media">
          {product && <AdaptiveImage key={product.images[0]} src={product.images[0]} alt={`${active.name} gift inspiration`} fill sizes="(max-width: 800px) 100vw, 56vw" />}
          <span className="occasion-stage-number">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="occasion-stage-copy">
          <span className="occasion-mark" aria-hidden="true">{active.mark}</span>
          <small>SHOP BY OCCASION</small>
          <h2>{active.name}</h2>
          <p>{active.copy}</p>
          <Link href={`/occasion/${active.slug}`} className="button button-primary">Explore {active.name} gifts <ArrowRight /></Link>
        </div>
        <div className="occasion-slider-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous occasion"><ArrowLeft /></button>
          <span>{String(index + 1).padStart(2, '0')} / {String(occasions.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next occasion"><ArrowRight /></button>
        </div>
      </div>
      <nav className="occasion-rail" aria-label="Choose an occasion">
        {occasions.map((occasion, itemIndex) => (
          <button type="button" key={occasion.slug} className={itemIndex === index ? 'active' : ''} onClick={() => setIndex(itemIndex)} aria-current={itemIndex === index ? 'true' : undefined}>
            <span>{occasion.mark}</span>{occasion.name}
          </button>
        ))}
      </nav>
      <div className="occasion-auto-progress" aria-hidden="true"><i key={index} className={paused ? 'paused' : ''} /></div>
    </section>
  );
}
