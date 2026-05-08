export const dynamic = 'force-dynamic';

const VERSION = process.env.LEGAL_TERMS_VERSION ?? '2026-05-08';

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Termini di Servizio</h1>
      <p className="text-xs text-muted-foreground">Versione {VERSION}</p>

      <h2 className="mt-8 text-xl font-semibold">1. Oggetto</h2>
      <p>
        Factory è una piattaforma SaaS che consente la creazione, pubblicazione e gestione
        di siti web vetrina per esercizi del settore food &amp; beverage. Il presente
        documento (&ldquo;Termini&rdquo;) regola l&rsquo;uso del Servizio da parte del cliente
        (&ldquo;Cliente&rdquo;).
      </p>

      <h2 className="mt-6 text-xl font-semibold">2. Pacchetti e prezzi</h2>
      <p>
        Il Servizio è offerto in pacchetti prepagati con durata fissa: 3 mesi (€50), 6 mesi
        (€99) o 12 mesi (€179). Il pagamento avviene in contanti al momento della stipula.
        Il pacchetto 12 mesi include la registrazione di un dominio personalizzato per
        l&rsquo;intera durata.
      </p>

      <h2 className="mt-6 text-xl font-semibold">3. Pubblicazione immediata</h2>
      <p>
        Al momento della conferma del pagamento il sito web del Cliente viene pubblicato
        immediatamente all&rsquo;indirizzo <code>&lt;slug&gt;.factory.app</code>, e il Servizio si
        considera prestato. Il Cliente riceve via email il link al pannello di gestione e
        la ricevuta non fiscale.
      </p>

      <h2 className="mt-6 text-xl font-semibold">4. Diritto di recesso</h2>
      <p>
        Ai sensi dell&rsquo;art. 59 del Codice del Consumo, il Cliente può rinunciare
        espressamente al diritto di recesso quando il Servizio viene prestato integralmente
        durante il periodo di recesso, con il suo consenso esplicito. Tale rinuncia viene
        raccolta separatamente al momento della conferma.
      </p>
      <p>
        In assenza di rinuncia, il Cliente ha diritto a 14 giorni dalla pubblicazione per
        recedere e ottenere il rimborso integrale.
      </p>
      <p>
        Anche in presenza di rinuncia, Factory onora rimborsi richiesti entro 14 giorni
        dalla pubblicazione, come gesto di buona fede.
      </p>

      <h2 className="mt-6 text-xl font-semibold">5. Contenuti del Cliente</h2>
      <p>
        Il Cliente conserva tutti i diritti sui propri contenuti (testi, foto, menu).
        Concede a Factory una licenza limitata, non esclusiva e revocabile per ospitarli e
        renderli pubblicamente disponibili attraverso il Servizio.
      </p>
      <p>
        Alcune descrizioni dei prodotti possono essere generate o tradotte tramite
        intelligenza artificiale (Anthropic Claude). Tali descrizioni sono contrassegnate
        in conformità con il Regolamento UE sull&rsquo;intelligenza artificiale.
      </p>

      <h2 className="mt-6 text-xl font-semibold">6. Limitazioni e responsabilità</h2>
      <p>
        Factory si impegna a mantenere il Servizio funzionante con uno SLA del 99% mensile.
        La responsabilità di Factory verso il Cliente è limitata all&rsquo;importo pagato dal
        Cliente nei 12 mesi precedenti l&rsquo;evento. Sono escluse responsabilità per danni
        indiretti, perdita di profitti o di dati di terzi.
      </p>

      <h2 className="mt-6 text-xl font-semibold">7. Disdetta e rinnovo</h2>
      <p>
        Il pacchetto non si rinnova automaticamente. Al termine del periodo prepagato, il
        Cliente riceve via email un promemoria 30, 7 e 1 giorno prima della scadenza. Se
        non rinnova, il sito viene messo offline e i dati conservati per 30 giorni prima
        della cancellazione GDPR.
      </p>

      <h2 className="mt-6 text-xl font-semibold">8. Modifiche</h2>
      <p>
        Factory può modificare i presenti Termini con preavviso di 60 giorni via email al
        Cliente. Le modifiche si applicano al successivo rinnovo.
      </p>

      <h2 className="mt-6 text-xl font-semibold">9. Disclosure IA</h2>
      <p>
        Conformemente al Regolamento UE sull&rsquo;intelligenza artificiale, le descrizioni
        generate o tradotte tramite IA sono identificate sul sito pubblico con la dicitura:
        &ldquo;Alcune descrizioni di questo sito sono state generate con assistenza di
        intelligenza artificiale.&rdquo;
      </p>

      <h2 className="mt-6 text-xl font-semibold">10. Legge applicabile e foro</h2>
      <p>
        Il presente contratto è regolato dalla legge italiana. Foro competente esclusivo:
        Tribunale di Cosenza (o, in caso di trasferimento della sede, il foro corrispondente
        alla sede legale di Factory).
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        Questo documento è disponibile anche tramite checkbox click-thru al momento della
        conferma del pagamento, con timestamp e versione registrati per audit.
      </p>
    </>
  );
}
