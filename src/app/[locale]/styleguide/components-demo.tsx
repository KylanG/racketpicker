"use client";

import { useState } from "react";
import { AccordionItem } from "@/components/ui/accordion";
import { Badge, FilterChip, Tag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, SizeOption } from "@/components/ui/checkbox";
import { FavButton } from "@/components/ui/fav-button";
import { SearchBar, TextField } from "@/components/ui/fields";
import { BellIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/price";
import { Switch } from "@/components/ui/switch";
import { ToggleTabs } from "@/components/ui/toggle-tabs";

/* Interactive demo of the RP-21 components. Developer page: copy is not translated. */

const SPORT_TABS = [
  { value: "all", label: "Alle sporten", count: 128 },
  { value: "padel", label: "Padel", count: 64 },
  { value: "tennis", label: "Tennis", count: 41 },
  { value: "badminton", label: "Badminton", count: 23 },
] as const;

type SportTab = (typeof SPORT_TABS)[number]["value"];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border flex flex-col gap-4 border-t pt-6">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function ComponentsDemo() {
  const [tab, setTab] = useState<SportTab>("padel");
  const [darkTab, setDarkTab] = useState<SportTab>("all");
  const [deals, setDeals] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [fav, setFav] = useState(false);

  return (
    <div className="flex flex-col gap-10">
      <Block title="Knoppen">
        <div className="flex flex-wrap items-center gap-3">
          <Button arrow>Bekijk bij Padel-Point</Button>
          <Button variant="dark" arrow>
            Bekijk beste prijs
          </Button>
          <Button variant="light" size="lg">
            Meer laden
          </Button>
          <Button variant="ink">Wis alle filters</Button>
          <Button disabled>Uitgeschakeld</Button>
        </div>
        <div className="grid max-w-sm gap-3">
          <Button variant="dark" block arrow>
            Bekijk beste prijs
          </Button>
          <Button variant="light" block icon={<BellIcon />}>
            Zet een voorraadalert
          </Button>
        </div>
      </Block>

      <Block title="Badges, tags en filterlabels">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="deal">-18%</Badge>
          <Badge variant="soldOut">Uitverkocht</Badge>
          <Badge variant="best">Beste deal</Badge>
          <Tag>Gevorderd</Tag>
          <Tag>Power</Tag>
          <Tag>365 g</Tag>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip removeLabel="Verwijder filter" onRemove={() => {}}>
            Merk: Bullpadel
          </FilterChip>
          <FilterChip removeLabel="Verwijder filter" onRemove={() => {}}>
            Niveau: Gevorderd
          </FilterChip>
        </div>
      </Block>

      <Block title="Tabs (aria-pressed)">
        <ToggleTabs label="Sport" items={[...SPORT_TABS]} value={tab} onChange={setTab} />
        <div className="rp-hero-sub p-6">
          <ToggleTabs
            label="Sport"
            tone="dark"
            items={[...SPORT_TABS]}
            value={darkTab}
            onChange={setDarkTab}
          />
        </div>
      </Block>

      <Block title="Schakelaars en checkboxes">
        <div className="flex flex-wrap gap-x-8">
          <Switch checked={deals} onChange={setDeals}>
            Alleen deals
          </Switch>
          <Switch checked={shipping} onChange={setShipping}>
            Inclusief verzendkosten
          </Switch>
        </div>
        <div className="max-w-[260px]">
          <Checkbox name="merk" value="bullpadel" defaultChecked count={18}>
            Bullpadel
          </Checkbox>
          <Checkbox name="merk" value="nox" count={12}>
            Nox
          </Checkbox>
          <Checkbox name="merk" value="siux" count={0} disabled>
            Siux
          </Checkbox>
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-[14px] font-medium">Maat</legend>
          {[40, 41, 42, 43, 44, 45].map((size, i) => (
            <SizeOption
              key={size}
              name="maat"
              value={size}
              defaultChecked={size === 42}
              disabled={size === 45}
              note={i === 3 ? "laatste" : undefined}
            >
              {size}
            </SizeOption>
          ))}
        </fieldset>
      </Block>

      <Block title="Invoer en zoeken">
        <div className="grid max-w-md gap-4">
          <TextField label="E-mailadres" type="email" placeholder="jij@voorbeeld.nl" />
          <TextField
            label="Doelprijs"
            inputMode="decimal"
            defaultValue="80"
            error="Kies een prijs onder de huidige prijs."
          />
        </div>
        <div className="rp-hero-sub max-w-[760px] p-6">
          <SearchBar
            label="Zoek een racket, merk of sport"
            placeholder="Zoek een racket, merk of sport"
            submitLabel="Zoeken"
            action="#"
            size="lg"
          />
        </div>
      </Block>

      <Block title="Prijs en hartje">
        <div className="flex flex-wrap items-center gap-8">
          <Price value={239} compareAt={289.95} />
          <Price value={96.74} compareAt={119} compareLabel="adviesprijs" size="lg" />
          <div className="bg-surface-2 p-4">
            <FavButton
              pressed={fav}
              onToggle={() => setFav(!fav)}
              label="Bewaar Adidas Metalbone 2026"
            />
          </div>
        </div>
      </Block>

      <Block title="Accordion">
        <div className="max-w-[760px]">
          <AccordionItem title="Voor welk niveau is dit racket geschikt?" defaultOpen>
            Voor gevorderde spelers die veel power willen.
          </AccordionItem>
          <AccordionItem title="Is dit racket geschikt bij armklachten?">
            Kies bij armklachten liever een racket met een zachte kern.
          </AccordionItem>
        </div>
      </Block>
    </div>
  );
}
