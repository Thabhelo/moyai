"use client";
import { useState } from "react";
import { activeEvent, lastFinished, useMoyai } from "@/components/useMoyai";

const text = {
  en: {
    title: "Your local data center today",
    water: "Drinking water used for cooling today: 0 gallons.",
    helping: "Right now it is using less power to help the grid during high demand.",
    normal: "It is running normally.",
    verified: (gal: string) => `Last grid event: verified. It also avoided about ${gal} gallons of water at power plants.`,
    lang: "Español",
  },
  es: {
    title: "Su centro de datos local hoy",
    water: "Agua potable usada para enfriamiento hoy: 0 galones.",
    helping: "Ahora mismo usa menos electricidad para ayudar a la red durante la alta demanda.",
    normal: "Funciona con normalidad.",
    verified: (gal: string) => `Último evento de la red: verificado. También evitó unos ${gal} galones de agua en las plantas eléctricas.`,
    lang: "English",
  },
};

export default function Public() {
  const s = useMoyai();
  const [lang, setLang] = useState<"en" | "es">("en");
  if (!s) return <main className="p-8">Loading…</main>;
  const t = text[lang];
  const done = lastFinished(s)?.verification;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10 text-lg">
      <button onClick={() => setLang(lang === "en" ? "es" : "en")} className="self-end text-sm underline">
        {t.lang}
      </button>
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p>{t.water}</p>
      <p>{activeEvent(s) ? t.helping : t.normal}</p>
      {done?.compliant && <p>{t.verified(Math.round(done.gridWaterAvoidedGal).toLocaleString())}</p>}
    </main>
  );
}
