import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { SearchBar } from "@/components/SearchBar";
import { cn } from "@/lib/utils";

type HeroSlide = {
  word: string;
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  alt: string;
};

const heroSlides: HeroSlide[] = [
  {
    word: "shows",
    label: "Show",
    title: "Shows ao vivo",
    description: "Concertos, turnês e noites com energia de palco.",
    imageUrl: "https://www.compassionuk.org/_next/image/?url=https%3A%2F%2Fimages.eu.ctfassets.net%2F8n7i7n887l2e%2F3p0w9AmJuEUYwkGfYx2hes%2F54d391cd4d406fce9e248cc5ff16005a%2FHero_lead_image__1_.jpg%3Ffm%3Dwebp%26q%3D75%26w%3D1920&w=1920&q=75",
    alt: "Show ao vivo com palco iluminado",
  },
  {
    word: "palestras",
    label: "Palestra",
    title: "Palestras e painéis",
    description: "Conteúdo, auditório e encontros profissionais.",
    imageUrl: "https://img.freepik.com/fotos-gratis/pessoas-que-participam-de-um-evento-de-alto-protocolo_23-2150951243.jpg?semt=ais_hybrid&w=740&q=80",
    alt: "Palestra em auditório",
  },
  {
    word: "festivais",
    label: "Festival",
    title: "Festivais e line-ups",
    description: "Múltiplas atrações para grandes públicos.",
    imageUrl: "https://www.boomfestival.org/_next/image?url=https%3A%2F%2Fmediacdn.boomfestival.org%2Fassets%2Ffiles%2F15797%2F002_bf25_cagdas_alagoz-6191.webp&w=2048&q=75",
    alt: "Festival de música com público e iluminação de palco",
  },
  {
    word: "teatros",
    label: "Teatro",
    title: "Teatro e espetáculo",
    description: "Cenas mais intimistas e experiências culturais.",
    imageUrl: "https://static01.nyt.com/images/2025/11/18/world/12cul-hunger-games-handouts-05/12cul-hunger-games-handouts-05-videoSixteenByNine3000-v2.jpg",
    alt: "Espaço de teatro com plateia",
  },
  {
    word: "congressos",
    label: "Congresso",
    title: "Congressos e eventos corporativos",
    description: "Ambientes formais com foco em networking.",
    imageUrl: "https://cdn-sites-images.46graus.com/files/photos/f2706dc0/602d3a78-31b9-41b4-a07f-96cdde35925d/ems_dia1_baixas-581-800x533.jpg",
    alt: "Auditório de congresso com plateia",
  },
  {
    word: "workshops",
    label: "Workshop",
    title: "Workshops e oficinas",
    description: "Experiências práticas e conteúdos mão na massa.",
    imageUrl: "https://www.jaraguadosul.sc.gov.br/_next/image?url=https%3A%2F%2Fwordpress.jaraguadosul.sc.gov.br%2Fwp-content%2Fuploads%2F2026%2F04%2FIMG_9003-scaled.jpg&w=3840&q=75",
    alt: "Workshop com pessoas em atividade prática",
  },
];

function useMobileQuery() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function useHeroCarousel() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => setActiveIndex(carouselApi.selectedScrollSnap());

    handleSelect();
    carouselApi.on("select", handleSelect);
    carouselApi.on("reInit", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
      carouselApi.off("reInit", handleSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (prefersReducedMotion || heroSlides.length < 2) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        if (carouselApi) {
          carouselApi.scrollNext();
        } else {
          setActiveIndex((current) => (current + 1) % heroSlides.length);
        }
      }
    }, 3800);

    return () => window.clearInterval(interval);
  }, [carouselApi, prefersReducedMotion]);

  const goToSlide = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
      return;
    }

    setActiveIndex(index);
  };

  return {
    carouselApi,
    setCarouselApi,
    activeIndex,
    activeSlide: heroSlides[activeIndex] ?? heroSlides[0],
    goToSlide,
  };
}

function MobileHeroCard({ slide, index }: { slide: HeroSlide; index: number }) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border/60 bg-card shadow-sm">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={slide.imageUrl}
          alt={slide.alt}
          className="h-full w-full object-cover"
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
          {slide.label}
        </div>
      </div>

      <div className="px-4 py-3 text-center">
        <h3 className="font-display text-base font-bold leading-tight text-foreground sm:text-lg">
          {slide.title}
        </h3>
      </div>
    </div>
  );
}

function MobileHero() {
  const { carouselApi, setCarouselApi, activeIndex, activeSlide, goToSlide } = useHeroCarousel();

  return (
    <section className="md:hidden bg-gradient-to-b from-background via-secondary/15 to-background">
      <div className="container px-3 pt-4 pb-6">
        <div className="space-y-4">
          <div className="rounded-[1.6rem] border border-border/60 bg-card/95 p-4 shadow-sm">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground"
            >
              Seus ingressos para
              <span className="mt-1 block text-primary">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeSlide.word}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {activeSlide.word}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <div className="mt-4">
              <SearchBar variant="hero" placeholder="Buscar eventos, shows, cidades..." />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-card p-3 shadow-sm">
            <Carousel opts={{ align: "start", loop: true }} setApi={setCarouselApi} className="w-full">
              <CarouselContent className="-ml-3">
                {heroSlides.map((slide, index) => (
                  <CarouselItem key={slide.word} className="basis-[88%] pl-3">
                    <MobileHeroCard slide={slide} index={index} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="mt-3 flex items-center justify-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.word}
                  type="button"
                  aria-label={`Ir para ${slide.word}`}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === activeIndex ? "w-6 bg-primary" : "w-2 bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopHeroCard({ slide, index }: { slide: HeroSlide; index: number }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card">
      <motion.img
        key={slide.word}
        src={slide.imageUrl}
        alt={slide.alt}
        className="h-[min(48vh,460px)] w-full object-cover"
        initial={{ opacity: 0, scale: 1.01 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.01 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        loading={index === 0 ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}

function DesktopHero() {
  const { activeIndex, activeSlide } = useHeroCarousel();

  return (
    <section className="relative hidden min-h-[85vh] overflow-hidden bg-background md:flex">
      <div className="container relative z-10 flex w-full items-center py-14 lg:py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-12">
          <div className="mx-auto max-w-3xl space-y-6 text-center lg:mx-0 lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Seus ingressos para
              <span className="mt-2 block text-primary">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeSlide.word}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {activeSlide.word}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mx-auto max-w-2xl text-lg text-muted-foreground lg:mx-0 lg:text-xl"
            >
              Compre, transfira e gerencie seus ingressos com segurança. A plataforma completa para produtores e compradores.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mx-auto w-full max-w-2xl lg:mx-0"
            >
              <SearchBar variant="hero" placeholder="Buscar eventos, shows, cidades..." />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Button variant="default" size="lg" asChild>
                <Link to="/eventos">
                  Explorar eventos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/produtores">Sou produtor</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="w-full"
          >
            <AnimatePresence mode="wait" initial={false}>
              <DesktopHeroCard slide={activeSlide} index={activeIndex} />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function LandingHero() {
  const isMobile = useMobileQuery();

  return isMobile ? <MobileHero /> : <DesktopHero />;
}
