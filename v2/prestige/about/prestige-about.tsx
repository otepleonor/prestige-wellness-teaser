"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { PRESTIGE_BOOKING_URL } from "../booking";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function PrestigeAbout() {
  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.from(".prestige-nav", { autoAlpha: 0, duration: 0.9, ease: "power3.out" });

      // Fade + 16px rise, staggered as groups enter the viewport.
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

      // Photography carries the page: each image settles from a slight zoom.
      gsap.utils.toArray<HTMLElement>("main img").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 1.08 },
          {
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: image, start: "top 92%", once: true },
          },
        );
      });
    },
    { scope: pageRef },
  );

  return (
    <main ref={pageRef} className="prestige-page prestige-about" id="top">
      <nav
        className="prestige-nav prestige-nav--light"
        aria-label="Prestige Wellness"
      >
        <Link
          className="prestige-wordmark"
          href="/prestige"
          aria-label="Prestige Wellness home"
        >
          <span>Prestige</span>
          <small>Wellness</small>
        </Link>
        <div className="prestige-nav__links">
          <Link href="/prestige#treatments">Treatments</Link>
          <Link href="/prestige/about" aria-current="page">
            About
          </Link>
          <a href="#visit">Visit</a>
        </div>
      </nav>

      <section
        className="prestige-about-hero"
        aria-labelledby="prestige-about-title"
      >
        <div className="prestige-about-hero__story">
          <h1 id="prestige-about-title" data-reveal>
            Self-care, considered as a luxury experience.
          </h1>
          <p className="prestige-about-hero__philosophy" data-reveal>
            At Prestige Wellness, refinement is in the details — the welcome,
            the consultation, and the intention behind every treatment.
          </p>
          <p className="prestige-about-hero__origin" data-reveal>
            A wellness concept by Beyond Massage PH.
          </p>
        </div>

        <div className="prestige-about-hero__image" data-reveal>
          <Image
            src="/prestige/hero-spa.png"
            alt="A serene treatment space with warm stone and ivory linen"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 43vw"
          />
        </div>
      </section>

      <section
        className="prestige-approach"
        aria-labelledby="prestige-approach-title"
      >
        <div className="prestige-approach__image" data-reveal>
          <Image
            src="/prestige/facials-skin.png"
            alt="A calm, consultation-led facial care moment"
            fill
            sizes="(max-width: 760px) 100vw, 42vw"
          />
        </div>

        <div className="prestige-approach__copy">
          <h2 id="prestige-approach-title" data-reveal>
            Care begins with listening.
          </h2>
          <p data-reveal>
            Every visit begins with a thoughtful consultation. We take time to
            understand how you want to feel, then guide you toward care that
            fits the moment.
          </p>
          <p data-reveal>
            Treatments are designed with intention — bringing aesthetics,
            facials, and body rituals together in one considered experience.
          </p>
        </div>
      </section>

      <section
        className="prestige-space"
        aria-labelledby="prestige-space-title"
      >
        <div className="prestige-space__heading" data-reveal>
          <h2 id="prestige-space-title">Your VIP room is waiting.</h2>
          <p>
            A private pause within the city, shaped by warm light, tactile
            materials, and details chosen to help the outside world fall quiet.
          </p>
        </div>

        <figure className="prestige-space__figure" data-reveal>
          <div className="prestige-space__image">
            <Image
              src="/prestige/vip-room.png"
              alt="An illustrative private treatment room in warm ivory, charcoal, and bronze tones"
              fill
              sizes="(max-width: 760px) 100vw, 92vw"
            />
          </div>
          <figcaption>
            <span>Private by design. Curated down to the quietest detail.</span>
            <span>
              Illustrative demo imagery · replace with approved Prestige
              photography.
            </span>
          </figcaption>
        </figure>
      </section>

      <section
        id="visit"
        className="prestige-practical"
        aria-labelledby="prestige-visit-title"
      >
        <div className="prestige-practical__intro" data-reveal>
          <h2 id="prestige-visit-title">Come as you are.</h2>
          <p>Leave the rest of the day at the door.</p>
          <Link
            className="prestige-button prestige-button--ivory"
            href={PRESTIGE_BOOKING_URL}
            rel="noreferrer"
            target="_blank"
          >
            Book an appointment
          </Link>
        </div>
        <dl className="prestige-practical__details">
          <div data-reveal>
            <dt>Location</dt>
            <dd>34th Street, Bonifacio Global City</dd>
            <dd>Taguig, Philippines</dd>
          </div>
          <div data-reveal>
            <dt>Hours</dt>
            <dd>Daily</dd>
            <dd>8AM–12MN</dd>
          </div>
        </dl>
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
