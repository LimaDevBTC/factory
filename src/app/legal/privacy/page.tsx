export const dynamic = 'force-dynamic';

const VERSION = process.env.LEGAL_PRIVACY_VERSION ?? '2026-05-08';

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Informativa sulla Privacy</h1>
      <p className="text-xs text-muted-foreground">Versione {VERSION}</p>

      <p>
        La presente informativa è redatta ai sensi del Regolamento UE 2016/679 (GDPR) e del
        D.Lgs. 196/2003 (Codice della privacy italiano).
      </p>

      <h2 className="mt-6 text-xl font-semibold">1. Titolare del trattamento</h2>
      <p>
        Factory — partita IVA in attivazione (Italia/Brasile durante la fase iniziale).
        Email contatto: <a href="mailto:privacy@factory.app">privacy@factory.app</a>.
      </p>

      <h2 className="mt-6 text-xl font-semibold">2. Dati raccolti</h2>
      <p>Per il Cliente (titolare del locale):</p>
      <ul>
        <li>Dati anagrafici e di contatto (nome del locale, indirizzo, telefono, WhatsApp)</li>
        <li>Email del titolare e email pubblica del locale</li>
        <li>Partita IVA (per fatturazione e adempimenti fiscali)</li>
        <li>Foto del locale e del menù (caricate dall&rsquo;operatore)</li>
        <li>Registrazione vocale di consenso e descrizione del locale (opzionale)</li>
        <li>Dati di pagamento (modalità, importo, data)</li>
      </ul>
      <p>Per il visitatore del sito vetrina:</p>
      <ul>
        <li>Cookie tecnici (sessione, preferenze)</li>
        <li>Cookie di analisi e marketing solo previo consenso</li>
        <li>Hash pseudonimizzato di IP + user-agent (per audit di consenso)</li>
        <li>Dati di prenotazione se l&rsquo;esercizio accetta prenotazioni</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">3. Finalità e basi giuridiche</h2>
      <ul>
        <li>Esecuzione del contratto (art. 6.1.b GDPR): erogazione del Servizio</li>
        <li>Adempimento di obblighi legali (art. 6.1.c GDPR): contabilità, fiscalità</li>
        <li>Legittimo interesse (art. 6.1.f GDPR): sicurezza, prevenzione frodi</li>
        <li>Consenso (art. 6.1.a GDPR): cookie non-tecnici, comunicazioni marketing</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">4. Sub-processori</h2>
      <p>
        Factory si avvale dei seguenti sub-processori, tutti con sede e infrastruttura in
        Unione Europea o aderenti alle Standard Contractual Clauses:
      </p>
      <ul>
        <li><strong>Supabase</strong> (database PostgreSQL, autenticazione, storage) — regione Frankfurt (DE)</li>
        <li><strong>Vercel</strong> (hosting, edge functions) — regione Frankfurt (fra1)</li>
        <li><strong>Cloudflare</strong> (CDN, R2 storage opzionale) — giurisdizione UE</li>
        <li><strong>Anthropic</strong> (Claude API per estrazione menu e traduzioni) — DPA con SCC, no data retention</li>
        <li><strong>Resend</strong> (invio email transazionali) — regione UE</li>
        <li><strong>Stripe</strong> (pagamenti ricorrenti, attivo dopo registrazione SRL) — DPA con SCC</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">5. Diritti dell&rsquo;interessato</h2>
      <p>Il Cliente o il visitatore può esercitare in qualsiasi momento i diritti previsti dagli artt. 15-22 GDPR:</p>
      <ul>
        <li>Accesso ai dati</li>
        <li>Rettifica</li>
        <li>Cancellazione (&ldquo;diritto all&rsquo;oblio&rdquo;)</li>
        <li>Limitazione del trattamento</li>
        <li>Portabilità</li>
        <li>Opposizione</li>
      </ul>
      <p>
        Per esercitare i diritti, scrivere a{' '}
        <a href="mailto:privacy@factory.app">privacy@factory.app</a>. Risposta entro 30
        giorni. È possibile reclamare al Garante per la Protezione dei Dati Personali
        (<a href="https://www.gpdp.it" target="_blank" rel="noopener noreferrer">www.gpdp.it</a>).
      </p>

      <h2 className="mt-6 text-xl font-semibold">6. Conservazione</h2>
      <ul>
        <li>Dati Cliente: durata del contratto + 10 anni (obbligo fiscale)</li>
        <li>Foto e contenuti pubblicati: durata del Servizio + 30 giorni dopo la scadenza</li>
        <li>Cookie analytics: 13 mesi</li>
        <li>Log di consenso: 5 anni</li>
        <li>Audit log AI calls: 5 anni (Regolamento UE IA)</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">7. Trasferimenti extra-UE</h2>
      <p>
        Tutti i dati personali sono trattati su infrastruttura UE. Anthropic Claude è un
        servizio statunitense; il trasferimento avviene tramite SCC (Standard Contractual
        Clauses) con clausola di assenza di retention sul trattamento.
      </p>

      <h2 className="mt-6 text-xl font-semibold">8. Cookie</h2>
      <p>
        Il sito utilizza cookie tecnici (sempre attivi) e, previo consenso, cookie di
        analisi e marketing. Le preferenze possono essere modificate in qualsiasi momento
        tramite il banner cookie.
      </p>

      <h2 className="mt-6 text-xl font-semibold">9. Modifiche</h2>
      <p>
        La presente informativa può essere aggiornata. La versione corrente è indicata in
        cima alla pagina. Modifiche sostanziali saranno comunicate via email.
      </p>
    </>
  );
}
