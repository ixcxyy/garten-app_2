"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarRange,
  CheckCheck,
  ChevronRight,
  CloudSun,
  Flower2,
  Leaf,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

const featureCards = [
  {
    icon: CalendarRange,
    title: "Wochenpläne, die wirklich abgestimmt sind",
    copy:
      "Pflegeeinsätze, Erntefenster und saisonale Aufgaben landen an einem ruhigen Ort statt in verstreuten Chats.",
  },
  {
    icon: Users,
    title: "Einladungen ohne Orga-Chaos",
    copy:
      "Neue Mitglieder kommen per Link dazu und sehen sofort, was heute ansteht, wer übernimmt und was noch fehlt.",
  },
  {
    icon: CloudSun,
    title: "Klarheit für Wetter, Aufgaben und Notizen",
    copy:
      "Die wichtigsten Entscheidungen sind auf einen Blick sichtbar, damit gemeinsame Gartenarbeit leicht wirkt.",
  },
];

const workflow = [
  "Gruppe anlegen, Mitglieder einladen und Zuständigkeiten sichtbar machen.",
  "Wiederkehrende Aufgaben, Pflanzphasen und spontane Einsätze gemeinsam planen.",
  "Mit ruhigen Übersichten dranbleiben, statt ständig nachzufragen oder Listen neu zu sortieren.",
];

const stats = [
  { label: "aktive Gruppen", value: "24" },
  { label: "offene Aufgaben", value: "07" },
  { label: "nächster Einsatz", value: "Samstag" },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(47,106,83,0.22),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[8rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(245,205,173,0.24),transparent_72%)] blur-3xl" />
        <div className="absolute inset-x-0 top-[22rem] h-[28rem] bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.46),rgba(255,255,255,0))]" />
      </div>

      <div className="section-shell relative py-5 sm:py-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel flex items-center justify-between rounded-[30px] px-4 py-3 sm:px-6"
        >
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
              <Flower2 size={18} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                Garden Groups
              </p>
              <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--color-foreground)]">
                Gemeinsame Gartenplanung
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <a
              href="#produkt"
              className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
            >
              Produkt
            </a>
            <a
              href="#ablauf"
              className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
            >
              Ablauf
            </a>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-white/70"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand)] px-5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--color-brand-strong)]"
            >
              Kostenlos starten
            </Link>
          </nav>
        </motion.header>

        <section className="grid gap-8 px-1 pb-12 pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-center lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-[var(--color-muted)] shadow-[var(--shadow-soft)]">
              <Sparkles className="h-4 w-4 text-[var(--color-brand)]" />
              Ruhiger wie Notion, klar wie Apple, mit etwas mehr Charakter.
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-[var(--color-foreground)] sm:text-6xl lg:text-[5.6rem]">
                Gartenarbeit gemeinsam planen, ohne dass sich alles nach Verwaltung anfühlt.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                Garden Groups bringt Aufgaben, Mitglieder, Termine und Notizen in eine ruhige
                Oberfläche, damit euer Gartenprojekt organisiert bleibt und trotzdem leicht wirkt.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-base font-medium text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--color-brand-strong)]"
              >
                Gruppe erstellen
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="glass-panel inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-[var(--color-foreground)] transition-all duration-200 hover:bg-white/80"
              >
                Login öffnen
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-[var(--color-muted)]">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-brand)]" />
                Einladungslinks und Mitgliederverwaltung
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-[var(--color-brand)]" />
                Aufgaben, die alle auf einen Blick verstehen
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="glass-panel overflow-hidden rounded-[36px] p-4 shadow-[var(--shadow-modal)] sm:p-5">
              <div className="rounded-[30px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(252,248,241,0.92))] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                      Diese Woche
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-foreground)]">
                      Stadtgarten Nord
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-7 text-[var(--color-muted)]">
                      Gießen koordinieren, neue Kräuter setzen und den Samstagseinsatz mit allen
                      Mitgliedern abstimmen.
                    </p>
                  </div>
                  <div className="flex -space-x-3">
                    <Avatar name="Mia Weber" />
                    <Avatar className="ring-4 ring-white/90" name="Jonas Mayr" />
                    <Avatar className="ring-4 ring-white/90" name="Lea Hartl" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[var(--shadow-soft)]"
                    >
                      <p className="text-sm text-[var(--color-muted)]">{stat.label}</p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--color-foreground)]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[26px] bg-[#f3ede1] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        Heute im Fokus
                      </p>
                      <Leaf className="h-4 w-4 text-[var(--color-brand)]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Hochbeete 2 und 3 bewässern",
                        "Tomaten stützen und Notiz ergänzen",
                        "Kompostdienst für Freitag bestätigen",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-[20px] bg-white/80 px-4 py-3 text-sm text-[var(--color-muted)]"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                            <CheckCheck className="h-3.5 w-3.5" />
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[26px] bg-[var(--color-foreground)] p-5 text-white">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">Nächster Einsatz</p>
                    <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
                      Samstag, 09:30
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      Drei Mitglieder sind bestätigt, zwei Aufgaben sind noch offen und das Wetter
                      bleibt sonnig.
                    </p>
                    <div className="mt-6 rounded-[22px] bg-white/10 p-4">
                      <div className="flex items-center justify-between text-sm text-white/72">
                        <span>Vorbereitung</span>
                        <span>fast fertig</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[72%] rounded-full bg-[#b7f0c7]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="produkt" className="space-y-6 py-8 sm:py-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--color-subtle)]">
              Produkt
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--color-foreground)] sm:text-5xl">
              Weniger UI-Lärm, mehr Orientierung im Gartenalltag.
            </h2>
            <p className="text-lg leading-8 text-[var(--color-muted)]">
              Die Oberfläche bleibt luftig und hochwertig, damit selbst volle Wochenpläne ruhig
              lesbar wirken.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                >
                  <Card className="h-full rounded-[32px] bg-white/78 p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-foreground)]">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-7 text-[var(--color-muted)]">
                      {feature.copy}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="ablauf" className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[34px] bg-[var(--color-foreground)] p-8 text-white sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Ablauf</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
              Vom ersten Invite bis zum gepflegten Beet in wenigen ruhigen Schritten.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/72">
              Die Informationsarchitektur ist bewusst klar gehalten: große Typografie, weiche
              Flächen, kurze Wege zum Login und ein Dashboard, das sofort verständlich ist.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-[var(--color-foreground)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Zum Login
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 text-sm font-medium text-white transition-colors hover:bg-white/12"
              >
                Dashboard ansehen
              </Link>
            </div>
          </Card>

          <div className="space-y-4">
            {workflow.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="glass-panel rounded-[30px] p-6 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-subtle)]">
                      Schritt {index + 1}
                    </p>
                    <p className="mt-3 text-lg leading-8 text-[var(--color-foreground)]">{step}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="relative overflow-hidden rounded-[38px] bg-[var(--color-foreground)] px-6 py-10 text-white shadow-[var(--shadow-modal)] sm:px-10 sm:py-12">
            <div className="absolute right-[-10%] top-[-4rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(120,201,145,0.34),transparent_70%)] blur-2xl" />
            <div className="relative max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Bereit</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Mach aus losem Gartenwissen wieder eine gemeinsame Routine.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/72">
                Starte mit einer Gruppe, öffne den Login direkt von der Landingpage und gib der
                Organisation denselben ruhigen Ton wie eurem Garten.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-medium text-[var(--color-foreground)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Jetzt loslegen
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 text-base font-medium text-white transition-colors hover:bg-white/12"
                >
                  Login ansehen
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
