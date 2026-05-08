export const dynamic = 'force-dynamic';

const VERSION = process.env.LEGAL_DPA_VERSION ?? '2026-05-08';

export default function DpaPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Data Processing Agreement</h1>
      <p className="text-xs text-muted-foreground">Versione {VERSION}</p>

      <p>
        Il presente Data Processing Agreement (&ldquo;DPA&rdquo;) è parte integrante dei Termini
        di Servizio e disciplina il trattamento dei dati personali ai sensi dell&rsquo;art. 28
        GDPR.
      </p>

      <h2 className="mt-6 text-xl font-semibold">1. Ruoli</h2>
      <p>
        Il <strong>Cliente</strong> agisce come <strong>Titolare del Trattamento</strong>{' '}
        per i dati personali dei propri clienti finali (visitatori del sito, prenotazioni
        ricevute).
      </p>
      <p>
        <strong>Factory</strong> agisce come <strong>Responsabile del Trattamento</strong>{' '}
        ai sensi dell&rsquo;art. 28 GDPR per conto del Cliente.
      </p>

      <h2 className="mt-6 text-xl font-semibold">2. Oggetto e durata</h2>
      <p>
        Factory tratta i dati personali esclusivamente per erogare il Servizio descritto
        nei Termini. La durata coincide con quella del contratto principale, prolungata di
        30 giorni successivi alla cessazione per consentire l&rsquo;estrazione e cancellazione
        dei dati.
      </p>

      <h2 className="mt-6 text-xl font-semibold">3. Categorie di dati e interessati</h2>
      <p>
        <strong>Categorie di interessati:</strong> visitatori del sito, soggetti che
        effettuano prenotazioni.
      </p>
      <p>
        <strong>Categorie di dati:</strong> nome, email, telefono, dati di prenotazione,
        dati tecnici (IP hash, user-agent), preferenze cookie.
      </p>

      <h2 className="mt-6 text-xl font-semibold">4. Obblighi di Factory</h2>
      <ul>
        <li>Trattare i dati solo su istruzioni documentate del Cliente</li>
        <li>Garantire che il personale autorizzato sia vincolato al segreto</li>
        <li>Adottare misure tecniche e organizzative adeguate (cifratura in transito TLS, in stato di riposo a livello DB e storage; backup giornalieri; controllo degli accessi RBAC)</li>
        <li>Notificare al Cliente eventuali violazioni di dati entro 72 ore dalla scoperta</li>
        <li>Assistere il Cliente nelle richieste degli interessati (artt. 15-22 GDPR)</li>
        <li>Cancellare o restituire i dati al termine del contratto, su scelta del Cliente</li>
        <li>Mettere a disposizione del Cliente tutte le informazioni necessarie per dimostrare la conformità</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">5. Sub-Responsabili</h2>
      <p>
        Il Cliente autorizza in modo generale l&rsquo;uso dei sub-responsabili elencati nell&rsquo;
        <a href="/legal/privacy">Informativa sulla Privacy</a>. Factory comunicherà via
        email eventuali modifiche con almeno 30 giorni di preavviso, dando al Cliente la
        possibilità di opporsi.
      </p>

      <h2 className="mt-6 text-xl font-semibold">6. Trasferimenti extra-UE</h2>
      <p>
        Quando i dati sono trasferiti fuori dall&rsquo;Unione Europea (es. Anthropic, Stripe),
        il trasferimento avviene esclusivamente tramite Standard Contractual Clauses
        approvate dalla Commissione Europea.
      </p>

      <h2 className="mt-6 text-xl font-semibold">7. Audit</h2>
      <p>
        Il Cliente ha diritto di richiedere, una volta l&rsquo;anno e con preavviso di 30
        giorni, la documentazione di conformità o un audit svolto da terzi indipendenti.
        Costi e tempistiche sono concordati separatamente.
      </p>

      <h2 className="mt-6 text-xl font-semibold">8. Responsabilità</h2>
      <p>
        Le parti rispondono ciascuna per i propri obblighi GDPR. La responsabilità di
        Factory è limitata come previsto nei Termini di Servizio.
      </p>

      <h2 className="mt-6 text-xl font-semibold">9. Modifiche</h2>
      <p>
        Modifiche al presente DPA seguono la procedura prevista nei Termini di Servizio
        (preavviso di 60 giorni).
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        Accettando i Termini di Servizio e l&rsquo;informativa sulla Privacy, il Cliente
        sottoscrive il presente DPA.
      </p>
    </>
  );
}
