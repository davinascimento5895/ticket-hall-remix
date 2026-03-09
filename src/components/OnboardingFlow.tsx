import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { X, Ticket, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: Search,
    title: "Descubra eventos incríveis",
    description: "Encontre shows, festivais, peças e muito mais perto de você. Filtre por data, categoria e cidade.",
    color: "text-primary",
  },
  {
    icon: Ticket,
    title: "Compre com segurança",
    description: "Pague com PIX, cartão ou boleto. Seu ingresso digital chega na hora, direto no celular.",
    color: "text-accent",
  },
  {
    icon: Smartphone,
    title: "Ingresso na palma da mão",
    description: "Apresente o QR Code na entrada. Transfira para amigos ou peça reembolso se precisar.",
    color: "text-primary",
  },
];

const STORAGE_KEY = "tickethall_onboarding_done";

export function OnboardingFlow() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { role } = useAuth();

  useEffect(() => {
    // Only show onboarding for guest/buyer users, not producers/admins
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done && (!role || role === "buyer")) setVisible(true);
    else setVisible(false);
  }, [role]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!visible) return null;

  const slide = slides[step];

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="max-w-sm mx-auto px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className={`mx-auto w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center ${slide.color}`}>
              <slide.icon className="h-10 w-10" />
            </div>
            <h2 className="font-display text-2xl font-bold">{slide.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="ghost" className="flex-1" onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
          )}
          <Button className="flex-1" onClick={next}>
            {step === slides.length - 1 ? "Começar" : "Próximo"}
          </Button>
        </div>

        {step < slides.length - 1 && (
          <button onClick={dismiss} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
            Pular
          </button>
        )}
      </div>
    </div>
  );
}
