import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRecruitmentStatus } from '../../hooks/useRecruitmentStatus';
import RecruitmentCountdown from '../../components/RecruitmentCountdown';
import './LandingPage.css';

const FEATURES = [
  {
    title: 'LEARN',
    text: 'Explore new technologies and develop new skills.',
    icon: (
      <svg className="home-feature-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M8 18L24 10L40 18L24 26L8 18Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 22V30C14 30 18 34 24 34C30 34 34 30 34 30V22" stroke="currentColor" strokeWidth="2" />
        <path d="M40 18V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'BUILD',
    text: 'Work on real-world projects and turn ideas into reality.',
    icon: (
      <svg className="home-feature-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 34L20 14H28L38 34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 28H32" stroke="currentColor" strokeWidth="2" />
        <rect x="20" y="34" width="8" height="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'COLLABORATE',
    text: 'Connect and work with passionate students.',
    icon: (
      <svg className="home-feature-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="18" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M8 34C8 28 12 25 18 25C21 25 23 26 24 27" stroke="currentColor" strokeWidth="2" />
        <path d="M40 34C40 28 36 25 30 25C27 25 25 26 24 27" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'GROW',
    text: 'Develop technical, communication, teamwork, and leadership skills.',
    icon: (
      <svg className="home-feature-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M12 34V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 34V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 34V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 34V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 14L22 20L30 16L38 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const DOMAINS = [
  {
    name: 'SECRETARY',
    description:
      'Coordinate activities, manage communication, and support the smooth functioning of the club.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="8" y="6" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14H26M14 20H26M14 26H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'WEB DEVELOPMENT',
    description: 'Design and develop modern websites and web applications for the club.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="6" y="8" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M6 14H34" stroke="currentColor" strokeWidth="2" />
        <path d="M14 24L18 20L14 16M26 16L22 20L26 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'TECHNICAL TEAM',
    description:
      'Work on technical projects, explore new technologies, and develop innovative solutions.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 8V12M20 28V32M8 20H12M28 20H32M11 11L14 14M26 26L29 29M29 11L26 14M14 26L11 29"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: 'SOCIAL MEDIA',
    description:
      "Manage the club's social media presence and create engaging content for the community.",
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="27" cy="13" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'PR TEAM',
    description:
      "Build connections, manage communication, and promote the club's activities and achievements.",
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M8 28V18C8 14 12 10 20 10C28 10 32 14 32 18V28" stroke="currentColor" strokeWidth="2" />
        <path d="M6 22H10V30H6V22ZM30 22H34V30H30V22Z" stroke="currentColor" strokeWidth="2" />
        <path d="M16 30H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'RESEARCH TEAM',
    description: 'Explore emerging technologies, conduct research, and contribute innovative ideas.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="18" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M24 24L32 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'EVENT MANAGEMENT',
    description: 'Plan, organize, and successfully execute events, workshops, and activities.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="8" y="10" width="24" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 16H32M14 8V12M26 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 22H18M22 22H26M14 27H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'GRAPHIC DESIGNER',
    description: 'Create creative visuals, posters, branding materials, and designs for the club.',
    icon: (
      <svg className="home-domain-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M10 28L16 10L22 22L26 16L30 28H10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="28" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

function useRevealOnScroll() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const nodes = root.querySelectorAll('.home-reveal');
    if (!nodes.length) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return rootRef;
}

const LandingPage = () => {
  const { user } = useAuth();
  const rootRef = useRevealOnScroll();
  const {
    effectiveStatus,
    countdown,
    loading: statusLoading,
    error: statusError,
  } = useRecruitmentStatus();

  // Public recruitment CTAs never route to the admin panel
  const applyPath =
    user?._id && user.role === 'participant' ? '/participant/apply' : '/login';

  const showOpeningCountdown =
    effectiveStatus === 'not_started' && !countdown.expired && Boolean(countdown.totalMs);
  const showClosingCountdown =
    effectiveStatus === 'open' && !countdown.expired && Boolean(countdown.totalMs);

  const showDeadlineSection =
    statusLoading ||
    Boolean(statusError) ||
    showOpeningCountdown ||
    showClosingCountdown ||
    (effectiveStatus === 'not_started' && !showOpeningCountdown);

  const scrollToDomains = (event) => {
    event.preventDefault();
    const section = document.getElementById('domains');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="home-page" ref={rootRef}>
      <section className="home-hero" aria-label="Hero">
        <div className="home-wrap home-hero-inner">
          <p className="home-uni">Kalasalingam Academy of Research and Education</p>
          <h1 className="home-brand">CYBERNERDS OWASP</h1>
          <p className="home-tagline">Build. Learn. Innovate. Together.</p>
          <p className="home-desc">
            Join Cybernerds OWASP, a student-driven community at Kalasalingam Academy of Research
            and Education, where passionate students come together to learn, collaborate, build
            real-world projects, and grow together.
          </p>
          <div className="home-cta-row">
            <Link to={applyPath} className="home-btn home-btn-primary">
              APPLY NOW
            </Link>
            <a href="#domains" className="home-btn home-btn-ghost" onClick={scrollToDomains}>
              EXPLORE DOMAINS
            </a>
          </div>
        </div>
      </section>

      {showDeadlineSection ? (
        <section className="home-deadline" aria-labelledby="deadline-heading">
          <div className="home-wrap">
            <div className="home-deadline-panel home-reveal">
              <h2 id="deadline-heading" className="home-deadline-status">
                {statusLoading
                  ? 'Loading recruitment status…'
                  : effectiveStatus === 'not_started'
                    ? 'Applications Opening Soon'
                    : 'Applications Open'}
              </h2>
              {statusError ? (
                <p className="home-deadline-error">{statusError}</p>
              ) : null}
              {!statusLoading && !statusError && showOpeningCountdown ? (
                <RecruitmentCountdown
                  heading="Applications Open In"
                  days={countdown.days}
                  hours={countdown.hours}
                  minutes={countdown.minutes}
                  seconds={countdown.seconds}
                />
              ) : null}
              {!statusLoading && !statusError && showClosingCountdown ? (
                <RecruitmentCountdown
                  heading="Applications Close In"
                  days={countdown.days}
                  hours={countdown.hours}
                  minutes={countdown.minutes}
                  seconds={countdown.seconds}
                />
              ) : null}
              {!statusLoading &&
              !statusError &&
              effectiveStatus === 'not_started' &&
              !showOpeningCountdown ? (
                <p className="home-deadline-note">
                  Check back soon — opening dates will appear here once scheduled.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-section home-section-alt" aria-labelledby="about-heading">
        <div className="home-wrap">
          <div className="home-section-head home-reveal">
            <h2 id="about-heading" className="home-section-title">
              WHERE PASSION MEETS INNOVATION
            </h2>
          </div>
          <p className="home-about-text home-reveal">
            Cybernerds OWASP is a student community focused on learning, collaboration, creativity,
            technology, and innovation. We provide students with opportunities to develop their
            technical and creative skills, work on real-world projects, participate in events, and
            become part of a collaborative community.
          </p>
          <div className="home-feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="home-feature-card home-reveal">
                {feature.icon}
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="domains"
        className="home-section"
        aria-labelledby="domains-heading"
      >
        <div className="home-wrap">
          <div className="home-section-head home-reveal">
            <h2 id="domains-heading" className="home-section-title">
              FIND YOUR DOMAIN
            </h2>
            <p className="home-section-sub">
              Discover your passion. Build your skills. Make an impact.
            </p>
          </div>
          <div className="home-domain-grid">
            {DOMAINS.map((domain) => (
              <article key={domain.name} className="home-domain-card home-reveal">
                {domain.icon}
                <h3>{domain.name}</h3>
                <p>{domain.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-recruit" aria-labelledby="recruit-heading">
        <div className="home-wrap">
          <div className="home-recruit-panel home-reveal">
            <h2 id="recruit-heading">READY TO BE PART OF SOMETHING BIGGER?</h2>
            <p>Your skills. Your ideas. Your passion. Together, we can build the future.</p>
            <Link to={applyPath} className="home-btn home-btn-primary">
              JOIN CYBERNERDS OWASP
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
