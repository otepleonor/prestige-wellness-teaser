"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { PRESTIGE_BOOKING_URL } from "./booking";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const categories = [
  {
    title: "Massage & Body Rituals",
    image: "/prestige/massage-body-rituals.png",
    alt: "Warm ivory linens and a massage stone prepared for a body ritual",
  },
  {
    title: "Facials & Skin",
    image: "/prestige/facials-skin.png",
    alt: "A calm facial consultation in warm natural light",
  },
  {
    title: "Advanced Aesthetics",
    image: "/prestige/advanced-aesthetics.png",
    alt: "An unbranded bronze aesthetic-care object on linen and dark stone",
  },
] as const;

export function PrestigeHome() {
  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTimeline
        .from(".prestige-nav", { autoAlpha: 0, duration: 0.9 })
        .from(
          "[data-hero-line]",
          { autoAlpha: 0, y: 16, duration: 0.9, stagger: 0.24 },
          "-=0.5",
        )
        .from(
          "[data-hero-action]",
          { autoAlpha: 0, y: 16, duration: 0.8 },
          "-=0.35",
        )
        .from(
          ".prestige-hero__location",
          { autoAlpha: 0, duration: 0.9 },
          "-=0.5",
        );

      // One slow Ken Burns drift: gentle zoom with a small sideways travel.
      gsap.fromTo(
        "[data-hero-image]",
        { scale: 1, xPercent: 1.5 },
        { scale: 1.14, xPercent: -1.5, duration: 30, ease: "none" },
      );

      // Hero-only parallax: photo trails the scroll, headline eases away.
      gsap.to("[data-hero-image]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".prestige-hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
      gsap.to(".prestige-hero__content", {
        y: -56,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: ".prestige-hero",
          start: "top top",
          end: "70% top",
          scrub: 0.8,
        },
      });

      // Scroll reveals: fade + 16px rise, staggered as groups enter.
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 16 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 90%",
        once: true,
        onEnter: (elements) =>
          gsap.to(elements, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.18,
            overwrite: true,
          }),
      });

      // Treatment tiles: image settles in, fine rule draws across.
      gsap.utils
        .toArray<HTMLElement>(".prestige-category")
        .forEach((tile) => {
          const trigger = { trigger: tile, start: "top 88%", once: true };
          gsap.fromTo(
            tile.querySelector("img"),
            { scale: 1.1 },
            {
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform",
              scrollTrigger: trigger,
            },
          );
          gsap.fromTo(
            tile.querySelector(".prestige-category__rule"),
            { scaleX: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              duration: 0.9,
              delay: 0.25,
              ease: "power3.out",
              scrollTrigger: trigger,
            },
          );
        });
    },
    { scope: pageRef },
  );

  return (
    <main ref={pageRef} className="prestige-page" id="top">
      <section className="prestige-hero" aria-labelledby="prestige-title">
        <Image
          data-hero-image
          className="prestige-hero__image"
          src="/prestige/hero-spa.png"
          alt="A tranquil stone and linen treatment room in warm morning light"
          fill
          priority
          sizes="100vw"
        />
        <div className="prestige-hero__veil" aria-hidden="true" />

        <nav className="prestige-nav" aria-label="Prestige Wellness">
          <Link
            className="prestige-wordmark"
            href="/prestige"
            aria-label="Prestige Wellness home"
          >
            <span>Prestige</span>
            <small>Wellness</small>
          </Link>
          <div className="prestige-nav__links">
            <a href="#treatments">Treatments</a>
            <Link href="/prestige/about">About</Link>
            <a href="#reserve">Visit</a>
          </div>
        </nav>

        <div className="prestige-hero__content">
          <h1 id="prestige-title" className="prestige-hero__title">
            <span data-hero-line>Where wellness meets</span>
            <span data-hero-line>aesthetics</span>
          </h1>
          <a
            data-hero-action
            className="prestige-button prestige-button--bronze"
            href={PRESTIGE_BOOKING_URL}
            rel="noreferrer"
            target="_blank"
          >
            Reserve
          </a>
        </div>

        <p className="prestige-hero__location">
          34th Street · Bonifacio Global City
        </p>
      </section>

      <section
        id="approach"
        className="prestige-intro"
        aria-labelledby="prestige-intro-title"
      >
        <p className="prestige-intro__marker" data-reveal>
          Prestige Wellness
        </p>
        <h2 id="prestige-intro-title" data-reveal>
          An aesthetic clinic &amp; wellness spa on 34th Street, BGC — advanced
          aesthetics, facials, and massage under one roof.
        </h2>
      </section>

      <section
        id="treatments"
        className="prestige-categories"
        aria-labelledby="categories-title"
      >
        <div className="prestige-section-heading" data-reveal>
          <h2 id="categories-title">Care, considered as a whole.</h2>
          <p>Three ways to arrive. One place to feel restored.</p>
        </div>

        <div className="prestige-category-grid">
          {categories.map((category) => (
            <a
              className="prestige-category"
              data-reveal
              href={PRESTIGE_BOOKING_URL}
              key={category.title}
              rel="noreferrer"
              target="_blank"
              aria-label={`Reserve ${category.title}`}
            >
              <span className="prestige-category__image">
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
              </span>
              <span className="prestige-category__title">{category.title}</span>
              <span className="prestige-category__rule" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section
        className="prestige-testimonial"
        aria-labelledby="testimonial-title"
      >
        <p className="prestige-testimonial__note" data-reveal>
          Demo testimonial · replace with an approved client quote
        </p>
        <h2 id="testimonial-title" data-reveal>
          “The experience feels considered from the moment you arrive — quiet,
          thoughtful, and entirely your own.”
        </h2>
        <p className="prestige-testimonial__attribution" data-reveal>
          Prestige client · illustrative copy
        </p>
      </section>

      <section
        id="reserve"
        className="prestige-reserve"
        aria-labelledby="reserve-title"
      >
        <div data-reveal>
          <p>Open daily, 8AM–12MN</p>
          <h2 id="reserve-title">Make room to feel well.</h2>
        </div>
        <div className="prestige-reserve__action" data-reveal>
          <a
            className="prestige-button prestige-button--ivory"
            href={PRESTIGE_BOOKING_URL}
            rel="noreferrer"
            target="_blank"
          >
            Reserve a visit
          </a>
          <small>Booking opens securely in a new tab</small>
        </div>
      </section>

      <footer className="prestige-footer">
        <Link
          className="prestige-wordmark prestige-wordmark--footer"
          href="/prestige"
        >
          <span>Prestige</span>
          <small>Wellness</small>
        </Link>
        <p>Where wellness meets aesthetics.</p>
        <p>Bonifacio Global City, Taguig</p>
      </footer>
    </main>
  );
}
