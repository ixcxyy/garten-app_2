"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Droplets, Layers3 } from "lucide-react";
import {
  borderRadius,
  colorPalette,
  glassBlurEffects,
  shadowStyles,
  spacingSystem,
  typographyScale,
} from "@/lib/design-tokens";
import { Avatar, Button, Card, Input, Modal } from "@/components/ui";

export function DesignSystemShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="section-shell py-8 sm:py-12">
      <div className="glass-panel overflow-hidden rounded-[40px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-12">
          <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                <Sparkles size={14} />
                Garden Groups UI
              </div>
              <div className="space-y-4">
                <h1 className="display-xl max-w-4xl font-semibold text-balance text-[var(--color-foreground)]">
                  Minimal, elegant product UI with soft glass layers and calm garden accents.
                </h1>
                <p className="max-w-2xl text-[17px] leading-8 text-[var(--color-muted)]">
                  This system blends Apple-like restraint with Notion-style clarity: warm neutrals,
                  generous spacing, tactile cards, and motion that feels quiet rather than loud.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => setIsModalOpen(true)}>
                  Open Modal Preview
                </Button>
                <Button variant="secondary" size="lg">
                  Explore Tokens
                </Button>
              </div>
            </div>

            <Card className="glass-panel rounded-[36px] p-4 sm:p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-subtle)]">
                      Reusable Components
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                      Input, avatar, actions
                    </h2>
                  </div>
                  <Avatar name="Mila Green" size="lg" />
                </div>
                <Input label="Group name" placeholder="Community Orchard" />
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary">Share invite</Button>
                  <Button>Create group</Button>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card interactive className="bg-white/80">
              <Droplets className="text-[var(--color-brand)]" size={20} />
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em]">Color palette</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--color-muted)]">
                Warm stone neutrals, softened whites, and a restrained moss accent keep the UI calm.
              </p>
            </Card>
            <Card interactive className="bg-white/80">
              <Layers3 className="text-[var(--color-brand)]" size={20} />
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em]">Spacing system</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--color-muted)]">
                A simple 4px base scale creates consistent rhythm without feeling rigid or cramped.
              </p>
            </Card>
            <Card interactive className="bg-white/80">
              <ArrowRight className="text-[var(--color-brand)]" size={20} />
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em]">Motion language</h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--color-muted)]">
                Framer Motion is used for gentle hover lift, modal transitions, and tactile button press.
              </p>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[36px]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                Tokens
              </p>
              <div className="mt-6 space-y-4">
                {colorPalette.map((color) => (
                  <div key={color.name} className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl border border-black/5 shadow-[var(--shadow-soft)]"
                      style={{ background: color.value }}
                    />
                    <div>
                      <p className="font-medium tracking-[-0.03em]">{color.name}</p>
                      <p className="font-mono text-xs text-[var(--color-subtle)]">{color.value}</p>
                    </div>
                    <p className="ml-auto max-w-[14rem] text-right text-sm text-[var(--color-muted)]">
                      {color.usage}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-6">
              <Card className="rounded-[36px]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                  Typography
                </p>
                <div className="mt-6 space-y-4">
                  {typographyScale.map((item) => (
                    <div key={item.token} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium tracking-[-0.03em]">{item.token}</p>
                        <p className="text-sm text-[var(--color-muted)]">{item.usage}</p>
                      </div>
                      <p className="font-mono text-xs text-[var(--color-subtle)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[36px]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                  Layout Rules
                </p>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Spacing scale</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {spacingSystem.map((space) => (
                        <span
                          key={space}
                          className="rounded-full bg-[var(--color-brand-soft)] px-3 py-2 text-sm text-[var(--color-brand)]"
                        >
                          {space}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Radius & depth</p>
                    <div className="mt-3 space-y-3">
                      {borderRadius.map((radius) => (
                        <div key={radius.token} className="flex items-center justify-between text-sm">
                          <span>{radius.token}</span>
                          <span className="font-mono text-xs text-[var(--color-subtle)]">{radius.value}</span>
                        </div>
                      ))}
                      {shadowStyles.map((shadow) => (
                        <div key={shadow.name} className="flex items-center justify-between text-sm">
                          <span>{shadow.name}</span>
                          <span className="font-mono text-xs text-[var(--color-subtle)]">{shadow.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section>
            <Card className="rounded-[36px]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-subtle)]">
                Glass Effects
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {glassBlurEffects.map((effect) => (
                  <div
                    key={effect.name}
                    className="glass-panel rounded-[28px] p-5"
                  >
                    <p className="text-sm font-medium">{effect.name}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{effect.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create a calm workspace"
        description="The modal uses the same glass treatment and rounded geometry as cards, with slightly stronger shadow depth for focus."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Continue</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Garden group" placeholder="Riverside Plot" />
          <Input label="Invite members" placeholder="friend@example.com" />
        </div>
      </Modal>
    </div>
  );
}
