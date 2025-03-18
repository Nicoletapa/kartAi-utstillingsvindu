import React from "react";
import { ExternalLink } from "lucide-react";

interface SjekklisteOversiktLinkProps {
  href: string;
  children: React.ReactNode;
}

const SjekklisteOversiktLink: React.FC<SjekklisteOversiktLinkProps> = ({
  href,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-kartAI-blue underline transition-colors duration-200 hover:text-blue-800"
  >
    {children}
    <ExternalLink className="inline w-4 ml-1" />
  </a>
);

export function SjekklisteOversikt() {
  return (
    <div className="flex min-h-screen items-center justify-center mx-24 sm:px-6 md:px-8 mt-28 mb-24">
      <div className="w-full max-w-lg">
        <h3
          className="mb-5 flex justify-center text-2xl font-bold text-kartAI-blue sm:text-3xl"
          id="sjekkliste-oversikt"
        >
          Sjekkliste for søknadsprosessen
        </h3>

        <ol className="list-inside list-decimal space-y-3 text-lg sm:space-y-4">
          <li className="[ol_&]:marker:font-bold">
            Sjekk om det er midlertidig forbud mot bygging og deling i området.
          </li>
          <li className="[ol_&]:marker:font-bold">
            Du må vurdere om byggetiltaket kan være på{" "}
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/plan-og-bygg/byggesak/slik-soker-du/forurenset-grunn/">
              forurenset grunn.
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            Omfatter byggetiltaket&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/vann-og-avlop/soknadsskjemaer/">
              vann og avløp
            </SjekklisteOversiktLink>
            ,&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/contentassets/3d34ecdf5da940338975b0c5d4faca76/bygging-nar-offentlig-vann--og-avlopsanlegg.pdf">
              nær offentlig vann- og avløpsanlegg
            </SjekklisteOversiktLink>
            ,&nbsp;
            <SjekklisteOversiktLink href="https://www.glitrenett.no/bygge-grave-tilknytte/bygge-grave-rive-og-flytte/plassering-av-bygg">
              bygging nær høyspentledninger
            </SjekklisteOversiktLink>
            &nbsp;eller trenger du&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/vei-og-trafikk/malside/">
              avkjørelsestillatelse?
            </SjekklisteOversiktLink>
            &nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/vei-og-trafikk/regelverk-og-normaler/">
              (kommunens veinormal)
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            Ligger eiendommen din i et&nbsp;
            <SjekklisteOversiktLink href="https://atlas.nve.no/html5Viewer/?viewer=nveatlas">
              område som er flomutsatt
            </SjekklisteOversiktLink>
            , som f.eks&nbsp;
            <SjekklisteOversiktLink href="http://publikasjoner.nve.no/eksternrapport/2020/eksternrapport2020_11.pdf">
              Tovdalselva
            </SjekklisteOversiktLink>{" "}
            eller&nbsp;
            <SjekklisteOversiktLink href="https://temakart.nve.no/tema/kvikkleire">
              med mulighet for kvikkleire?
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            Skal bygget bli knyttet til eller bruke fjernvarme? Sjekk&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/contentassets/3d34ecdf5da940338975b0c5d4faca76/revidert-fjernvarmekonsesjon---kristiansand-med-vedlegg.pdf">
              konsesjonsområde for fjernvarme.
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            Skriv ut&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/plan-og-bygg/kart/situasjonskart/">
              situasjonskart
            </SjekklisteOversiktLink>
            &nbsp;og tegn byggetiltaket inn på dette kartet.&nbsp;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/contentassets/3d34ecdf5da940338975b0c5d4faca76/situasjonsplan-rev.-febr-21.pdf">
              Situasjonsplan - hva kreves?
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/globalassets/skjemaer-pdfdoc/erklaring-om-nabogrense.pdf">
              Samtykkeerklæring
            </SjekklisteOversiktLink>
            &nbsp;fra nabo vedrørende avstand til nabogrense.
          </li>
          <li className="[ol_&]:marker:font-bold">
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/innbyggerdialog-og-frivillighet/min-side/">
              Hent naboliste på Min Side.
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            Send ut nabovarsel basert på mottatt naboliste. Se mer informasjon
            om &ldquo;
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/plan-og-bygg/byggesak/nabovarsel/">
              Nabovarsel
            </SjekklisteOversiktLink>
            &rdquo;.
          </li>
          <li className="[ol_&]:marker:font-bold">
            Skjema for nabovarsel finner du ved å bruke&nbsp;
            <SjekklisteOversiktLink href="https://dibk.no/soknad-og-skjema/">
              skjema på siden for byggesaksblanketter.
            </SjekklisteOversiktLink>
            &nbsp;Naboene skal sende sine merknader til deg, slik at du kan
            kommentere dem før du sender alt samlet til kommunen.
          </li>
          <li className="[ol_&]:marker:font-bold">
            Vent minst to uker for eventuelle nabomerker, og send følgende til
            kommunen:
          </li>
          <ol className="mt-2 list-[lower-roman] space-y-1 pl-12">
            <li className="[ol_&]:marker:font-bold">
              Søknadsskjema på&nbsp;
              <SjekklisteOversiktLink href="https://dibk.no/soknad-og-skjema/">
                byggesaksblanketter - papir og digitalt.
              </SjekklisteOversiktLink>
            </li>
            <li className="[ol_&]:marker:font-bold">
              Nye og forenklede søknadsskjemaer for&nbsp;
              <SjekklisteOversiktLink href="https://dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/soknad-om-bruksendring_versjon-1.1.1.pdf">
                bruksendring
              </SjekklisteOversiktLink>
              &nbsp;og for&nbsp;
              <SjekklisteOversiktLink href="https://dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/byggesoknad-for-deg-som-onsker-a-bygge-eller-rive_versjon-1.0.5.pdf">
                bygge- eller rivesaker.
              </SjekklisteOversiktLink>
            </li>
            <li className="[ol_&]:marker:font-bold">
              Tegninger av tiltaket; plan, snitt og fasade i 1:100 -
              <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/contentassets/3d34ecdf5da940338975b0c5d4faca76/tegninger--rev-feb21.pdf">
                Tegningene skal inneholde
              </SjekklisteOversiktLink>
            </li>
            <li className="[ol_&]:marker:font-bold">Gjenpart av nabovarsel.</li>
            <li className="[ol_&]:marker:font-bold">
              Eventuelle nabomerknader med dine kommentarer.
            </li>
            <li className="[ol_&]:marker:font-bold">
              Eventuelt&nbsp;
              <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/contentassets/3d34ecdf5da940338975b0c5d4faca76/dispensasjon-rev.-aug-21.pdf">
                søknad om dispensasjon.
              </SjekklisteOversiktLink>
              &nbsp;Målsatt situasjonsplan i målestokk 1:500 (1:1000 for store
              tiltak), altså tiltaket ditt inntegnet på kartet du fikk fra
              kommunen. For noen tiltak holder det med kartutsnitt.
            </li>
          </ol>
          <li className="[ol_&]:marker:font-bold">
            Send søknaden til &nbsp;
            <SjekklisteOversiktLink href="mailto: post.byutvikling@kristiansand.kommune.no">
              post.byutvikling@kristiansand.kommune.no
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            <SjekklisteOversiktLink href="https://pub.framsikt.net/2025/kristiansand/bm-2025-kommunedirektorensforslag2025-2028#/generic/summary/feesmanagemant">
              Gebyr: Betalingssatser byggesak (2025).
            </SjekklisteOversiktLink>
          </li>
          <li className="[ol_&]:marker:font-bold">
            <SjekklisteOversiktLink href="https://www.kristiansand.kommune.no/navigasjon/bolig-kart-og-eiendom/plan-og-bygg/byggesak/slik-soker-du/frister-og-klagerett/">
              Frister og klagerett.
            </SjekklisteOversiktLink>
          </li>
        </ol>
      </div>
    </div>
  );
}
