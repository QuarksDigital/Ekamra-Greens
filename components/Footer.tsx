import Emblem from "./Emblem";
import { CONTACT } from "@/lib/content";

export default function Footer() {
  return (
    <footer id="visit" className="relative bg-paper px-[var(--gutter)] pb-8 pt-[14vh]">
      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
        <div>
          <h2 className="display text-[clamp(40px,5.4vw,80px)]">
            Come <em>and see</em> it
            <br />
            in person.
          </h2>
          <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-ink-soft">
            Walk the lawn, stand in the hall and picture your day. Call us or send a message on Instagram to
            plan a visit or check your dates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={CONTACT.phoneHref} className="pill">
              <em>Call</em> {CONTACT.phone}
            </a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="pill">
              <em>Message on</em> Instagram
            </a>
          </div>
        </div>

        <div className="md:pt-3">
          <p className="label text-ink-soft">Find us</p>
          <address className="mt-4 not-italic leading-relaxed">
            Ekamra Greens
            <br />
            Plot No 3 &amp; IDCO Plot 7/7
            <br />
            {CONTACT.addressShort[0]}
            <br />
            Chandaka Industrial Estate
            <br />
            {CONTACT.addressShort[1]}
          </address>
        </div>

        <div className="md:pt-3 md:text-right">
          <p className="label text-ink-soft">Enquire</p>
          <ul className="mt-4 space-y-1">
            <li>
              <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="hover:text-crimson">
                Instagram {CONTACT.instagramHandle} ↗
              </a>
            </li>
            <li>
              <a href={CONTACT.phoneHref} className="hover:text-crimson">
                {CONTACT.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-[12vh] flex items-end gap-[2vw]" aria-hidden>
        <Emblem className="mb-[1.2vw] h-[11vw] w-[11vw] shrink-0" ring="var(--color-ink)" strokeWidth={9} />
        <p className="display whitespace-nowrap text-[15.2vw] leading-[0.8] tracking-[-0.04em]">Ekamra</p>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-ink/15 pt-5 text-xs text-ink-soft md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Ekamra Greens, Bhubaneswar</p>
        <p className="font-display text-sm italic">Exquisite lawn and grand banquets</p>
      </div>
    </footer>
  );
}
