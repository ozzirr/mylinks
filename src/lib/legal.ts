export type Locale = 'it' | 'en';
export type Section = {heading: string; body: string[]};
export type LegalDoc = {title: string; updated: string; intro: string; sections: Section[]};

const COMPANY = '2erre SRL';
const EMAIL = 'privacy@2erre.online';
const UPDATED = '2026-04-01';

export const legal: Record<'privacy' | 'terms' | 'cookies', Record<Locale, LegalDoc>> = {
  privacy: {
    it: {
      title: 'Privacy Policy',
      updated: UPDATED,
      intro: `${COMPANY} (di seguito "noi") è titolare del trattamento dei dati personali raccolti tramite questo sito, ai sensi del Regolamento UE 2016/679 (GDPR). Questo documento descrive quali dati trattiamo, per quali finalità, e i diritti dell'utente.`,
      sections: [
        {
          heading: 'Titolare del trattamento',
          body: [
            `${COMPANY}, con sede legale in Italia. Per qualsiasi richiesta relativa ai tuoi dati personali, puoi scriverci a ${EMAIL}.`
          ]
        },
        {
          heading: 'Dati raccolti',
          body: [
            'Form di contatto e richiesta preventivo: nome, email, telefono (opzionale), azienda, ruolo, messaggio. Base giuridica: esecuzione di misure precontrattuali (art. 6.1.b GDPR).',
            'Newsletter: indirizzo email. Base giuridica: consenso (art. 6.1.a GDPR), revocabile in qualsiasi momento.',
            'Strumenti (QR, calcolatori): email e dati inseriti volontariamente. Base giuridica: esecuzione del servizio richiesto.',
            'Dati di navigazione: log tecnici (IP, user-agent, pagine viste) trattati per finalità di sicurezza e statistica aggregata.'
          ]
        },
        {
          heading: 'Finalità del trattamento',
          body: [
            'Rispondere alle richieste di contatto e preventivo.',
            'Inviare la newsletter ai soli iscritti.',
            'Fornire i servizi degli strumenti (tool) liberamente utilizzati dall\'utente.',
            'Adempiere a obblighi di legge contabili e fiscali.'
          ]
        },
        {
          heading: 'Conservazione dei dati',
          body: [
            'Dati di contatto: fino a 24 mesi dall\'ultima interazione, salvo richiesta di cancellazione.',
            'Newsletter: fino alla revoca del consenso.',
            'Dati degli strumenti: fino a 12 mesi, salvo uso del relativo account utente.'
          ]
        },
        {
          heading: 'Destinatari e trasferimenti',
          body: [
            'I dati possono essere trattati da fornitori tecnici selezionati (hosting, database, email), sempre con contratti conformi al GDPR. L\'hosting e il database (Supabase, Vercel) sono localizzati nell\'UE. Nessun dato è venduto a terzi.'
          ]
        },
        {
          heading: 'Diritti dell\'utente',
          body: [
            `Puoi esercitare in qualunque momento i diritti previsti dagli artt. 15-22 GDPR (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione) scrivendo a ${EMAIL}. Hai inoltre diritto a proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).`
          ]
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      updated: UPDATED,
      intro: `${COMPANY} ("we") is the data controller for personal data collected through this website, under EU Regulation 2016/679 (GDPR). This document describes what data we process, for which purposes, and users' rights.`,
      sections: [
        {
          heading: 'Data controller',
          body: [`${COMPANY}, based in Italy. For any request about your personal data, write to ${EMAIL}.`]
        },
        {
          heading: 'Data collected',
          body: [
            'Contact and quote forms: name, email, phone (optional), company, role, message. Legal basis: pre-contractual measures (GDPR art. 6.1.b).',
            'Newsletter: email address. Legal basis: consent (art. 6.1.a), revocable at any time.',
            'Tools (QR, calculators): email and data voluntarily entered. Legal basis: performance of the requested service.',
            'Browsing data: technical logs (IP, user-agent, pages viewed) processed for security and aggregated statistics.'
          ]
        },
        {
          heading: 'Purposes',
          body: [
            'Reply to contact and quote requests.',
            'Send the newsletter only to subscribers.',
            'Provide the services of tools freely used by the user.',
            'Comply with accounting and tax obligations.'
          ]
        },
        {
          heading: 'Data retention',
          body: [
            'Contact data: up to 24 months from last interaction, unless deletion is requested.',
            'Newsletter: until consent is withdrawn.',
            'Tool data: up to 12 months, except where linked to a user account.'
          ]
        },
        {
          heading: 'Recipients and transfers',
          body: [
            'Data may be processed by selected technical providers (hosting, database, email), always under GDPR-compliant agreements. Hosting and database (Supabase, Vercel) are EU-based. No data is sold to third parties.'
          ]
        },
        {
          heading: 'Your rights',
          body: [
            `You may exercise the rights under GDPR arts. 15-22 (access, rectification, erasure, restriction, portability, objection) at any time by writing to ${EMAIL}. You also have the right to lodge a complaint with the Italian Data Protection Authority (www.garanteprivacy.it).`
          ]
        }
      ]
    }
  },
  terms: {
    it: {
      title: 'Termini di servizio',
      updated: UPDATED,
      intro: `I presenti termini regolano l'uso del sito web ${COMPANY} e degli strumenti digitali ivi offerti. Utilizzando il sito accetti questi termini.`,
      sections: [
        {
          heading: 'Utilizzo del sito',
          body: [
            `Il sito ${COMPANY} è messo a disposizione a scopo informativo e per offrire strumenti digitali gratuiti o a pagamento. Non è consentito alcun uso automatizzato massivo (scraping, crawler aggressivi) senza autorizzazione scritta.`
          ]
        },
        {
          heading: 'Strumenti e calcolatori',
          body: [
            'I risultati di calcolatori e tool (stima stipendio, preventivi, QR) sono indicativi e forniti "as-is", senza alcuna garanzia di completa accuratezza. Non sostituiscono consulenza professionale specifica.',
            'L\'utente è responsabile delle informazioni inserite volontariamente.'
          ]
        },
        {
          heading: 'Proprietà intellettuale',
          body: [
            `Il marchio, il logo, i testi e il design del sito sono di proprietà di ${COMPANY}. Il riutilizzo senza autorizzazione non è consentito. I post del blog possono essere citati con link diretto alla fonte.`
          ]
        },
        {
          heading: 'Limitazione di responsabilità',
          body: [
            'Nei limiti consentiti dalla legge, 2erre SRL non è responsabile di danni indiretti, perdita di profitti o perdita di dati derivanti dall\'uso del sito o degli strumenti.'
          ]
        },
        {
          heading: 'Contratti con clienti',
          body: [
            'I progetti commissionati sono regolati da contratto specifico (offerta accettata o ordine). Questi termini non sostituiscono il contratto: in caso di conflitto prevale il contratto firmato.'
          ]
        },
        {
          heading: 'Legge applicabile',
          body: [
            'I presenti termini sono regolati dalla legge italiana. Foro competente: Tribunale della sede legale di 2erre SRL, salvo foro inderogabile del consumatore.'
          ]
        }
      ]
    },
    en: {
      title: 'Terms of service',
      updated: UPDATED,
      intro: `These terms govern the use of the ${COMPANY} website and the digital tools offered. By using the site, you accept these terms.`,
      sections: [
        {
          heading: 'Use of the site',
          body: [
            `The ${COMPANY} site is provided for informational purposes and to offer free or paid digital tools. Mass automated use (scraping, aggressive crawlers) is not allowed without written authorization.`
          ]
        },
        {
          heading: 'Tools and calculators',
          body: [
            'Results of calculators and tools (salary, quote, QR) are indicative and provided "as-is", without warranty of full accuracy. They do not replace specific professional advice.',
            'The user is responsible for the information they voluntarily provide.'
          ]
        },
        {
          heading: 'Intellectual property',
          body: [
            `Brand, logo, texts and design of the site are property of ${COMPANY}. Reuse without authorization is not allowed. Blog posts may be cited with a direct link to the source.`
          ]
        },
        {
          heading: 'Limitation of liability',
          body: [
            'To the extent permitted by law, 2erre SRL is not liable for indirect damages, loss of profits or data arising from use of the site or tools.'
          ]
        },
        {
          heading: 'Client contracts',
          body: [
            'Commissioned projects are governed by a specific contract (accepted offer or order). These terms do not replace the contract: in case of conflict the signed contract prevails.'
          ]
        },
        {
          heading: 'Governing law',
          body: [
            'These terms are governed by Italian law. Competent court: Tribunal of 2erre SRL\'s registered office, unless a consumer\'s mandatory forum applies.'
          ]
        }
      ]
    }
  },
  cookies: {
    it: {
      title: 'Cookie Policy',
      updated: UPDATED,
      intro: `Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento, come previsto dal Provv. Garante Privacy 10/06/2021. Non utilizziamo cookie di profilazione né di terze parti per tracking pubblicitario.`,
      sections: [
        {
          heading: 'Cookie tecnici',
          body: [
            'Cookie di sessione per mantenere lo stato di login (autenticazione), memorizzare la lingua selezionata e la preferenza di tema. La base giuridica è il legittimo interesse al funzionamento del servizio; non richiedono consenso preventivo.'
          ]
        },
        {
          heading: 'Cookie analytics',
          body: [
            'Al momento non utilizziamo cookie analytics. Nel caso venissero introdotti, saranno anonimizzati (IP troncato) e l\'utente verrà informato tramite banner con possibilità di opt-out.'
          ]
        },
        {
          heading: 'LocalStorage',
          body: [
            'I tool (es. QR) usano localStorage per ricordare che l\'utente ha già usato gratuitamente lo strumento. Si tratta di uno storage puramente locale nel browser dell\'utente e può essere cancellato in qualsiasi momento dalle impostazioni del browser.'
          ]
        },
        {
          heading: 'Gestione dei cookie',
          body: [
            'Puoi eliminare i cookie tecnici in qualsiasi momento dalle impostazioni del browser. La disattivazione dei cookie tecnici può compromettere il corretto funzionamento del sito.'
          ]
        }
      ]
    },
    en: {
      title: 'Cookie Policy',
      updated: UPDATED,
      intro: `This site uses only strictly necessary technical cookies, consistent with the Italian Data Protection Authority\'s 10/06/2021 guidelines. We do not use profiling or third-party advertising cookies.`,
      sections: [
        {
          heading: 'Technical cookies',
          body: [
            'Session cookies to maintain login state, the selected language, and theme preference. Legal basis is legitimate interest in service operation; no prior consent required.'
          ]
        },
        {
          heading: 'Analytics cookies',
          body: [
            'We currently use no analytics cookies. If introduced, they will be anonymized (IP truncated) and users will be notified via banner with opt-out.'
          ]
        },
        {
          heading: 'LocalStorage',
          body: [
            'Tools (e.g. QR) use localStorage to remember that the user has already used the free tier. It is purely local storage in the user\'s browser and can be cleared at any time in browser settings.'
          ]
        },
        {
          heading: 'Managing cookies',
          body: [
            'You can delete technical cookies any time from your browser settings. Disabling technical cookies may break site functionality.'
          ]
        }
      ]
    }
  }
};
