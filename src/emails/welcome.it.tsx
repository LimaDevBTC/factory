import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type WelcomeEmailProps = {
  businessName: string;
  siteUrl: string;
  dashboardMagicLink: string;
  planLabel: string;
  amountFormatted: string;
  servicePeriodEnd: string;
  withdrawalWindowEnd: string;
  receiptUrl: string | null;
  legalVersions: { terms: string; privacy: string; dpa: string };
  supportEmail: string;
};

export default function WelcomeEmailIt(props: WelcomeEmailProps) {
  return (
    <Html lang="it">
      <Head />
      <Preview>Il tuo sito è online — accesso e ricevuta</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Benvenuto su Factory</Heading>
          <Text style={paragraph}>
            Ciao {props.businessName}, il tuo sito è online da adesso.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Il tuo sito</Text>
            <Link href={props.siteUrl} style={cardValue}>
              {props.siteUrl}
            </Link>
          </Section>

          <Section style={card}>
            <Text style={cardLabel}>Pannello di gestione</Text>
            <Link href={props.dashboardMagicLink} style={primaryButton}>
              Apri il pannello
            </Link>
            <Text style={muted}>
              Il link è valido per 24 ore. Da qui modifichi menu, orari, foto e prenotazioni.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={sectionTitle}>Riepilogo pagamento</Text>
            <Text style={paragraph}>
              <strong>Pacchetto:</strong> {props.planLabel}
              <br />
              <strong>Importo:</strong> {props.amountFormatted} (contanti)
              <br />
              <strong>Valido fino a:</strong> {props.servicePeriodEnd}
            </Text>
            {props.receiptUrl && (
              <Text style={paragraph}>
                <Link href={props.receiptUrl} style={link}>Scarica la ricevuta (PDF)</Link>
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={sectionTitle}>Diritto di recesso</Text>
            <Text style={paragraph}>
              Hai rinunciato espressamente al diritto di recesso al momento del pagamento
              (Codice del Consumo art. 59), poiché il sito è stato pubblicato
              immediatamente. Se cambi idea entro <strong>{props.withdrawalWindowEnd}</strong>{' '}
              scrivi a <Link href={`mailto:${props.supportEmail}`} style={link}>{props.supportEmail}</Link>
              {' '}— rimborsiamo come gesto di buona fede.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={sectionTitle}>Documenti accettati</Text>
            <Text style={paragraph}>
              <Link href="https://thefactory.life/legal/terms" style={link}>
                Termini di Servizio v.{props.legalVersions.terms}
              </Link>
              <br />
              <Link href="https://thefactory.life/legal/privacy" style={link}>
                Informativa Privacy v.{props.legalVersions.privacy}
              </Link>
              <br />
              <Link href="https://thefactory.life/legal/dpa" style={link}>
                Data Processing Agreement v.{props.legalVersions.dpa}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={muted}>
            Domande? Rispondi direttamente a questa email — arriva a {props.supportEmail}.
          </Text>
          <Text style={footer}>
            Factory — siti web per la ristorazione italiana, in dieci minuti.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (inline-safe pra clientes de email)
const body = { backgroundColor: '#f6f6f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const container = { backgroundColor: '#ffffff', maxWidth: 580, margin: '24px auto', padding: '32px 28px', borderRadius: 12 };
const h1 = { color: '#1a1a1a', fontSize: 24, fontWeight: 600, margin: '0 0 8px' };
const paragraph = { color: '#333', fontSize: 14, lineHeight: '1.6', margin: '0 0 12px' };
const muted = { color: '#666', fontSize: 12, lineHeight: '1.5', margin: '8px 0 0' };
const sectionTitle = { color: '#1a1a1a', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.6, margin: '0 0 8px' };
const card = { backgroundColor: '#fafafa', borderRadius: 8, padding: '16px', margin: '16px 0' };
const cardLabel = { color: '#666', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: 0.6, margin: '0 0 4px' };
const cardValue = { color: '#1a1a1a', fontSize: 15, fontWeight: 500, textDecoration: 'none' };
const primaryButton = { backgroundColor: '#ea580c', color: '#ffffff', padding: '10px 20px', borderRadius: 6, fontWeight: 600, textDecoration: 'none', display: 'inline-block' };
const link = { color: '#ea580c', textDecoration: 'underline' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { color: '#999', fontSize: 11, marginTop: 24 };
