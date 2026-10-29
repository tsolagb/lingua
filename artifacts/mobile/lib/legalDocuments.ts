import {
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "./legal";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const legalDocuments = {
  terms: {
    title: "Terms of Service",
    version: TERMS_VERSION,
    updated: "October 20, 2026",
    sections: [
      {
        heading: "1. About this draft and the service",
        paragraphs: [
          "These draft Terms describe LinguaMatch, a language-learning app operated by Tsolag Bastekian in Ventura County, California, as provided by the owner. The legal entity status and a complete business mailing address have not been verified and must be confirmed before publication. This draft is not legal advice and is not final until reviewed and approved by a qualified California attorney.",
          "LinguaMatch offers vocabulary, games, practice activities, and learning-progress features. The service is currently free to use; there is no required subscription or purchase. The app may link to an optional external support or donation page. Any external transaction is handled under that provider's own terms.",
        ],
      },
      {
        heading: "2. Age and parent or guardian permission",
        paragraphs: [
          "LinguaMatch is intended for learners age 5 and older. A parent or legal guardian must give permission for anyone under 18 to use the app and must supervise a child's use as appropriate. An adult must create and manage any signed-in account used by a learner under 18.",
          "The current sign-in screen records an adult's confirmation, but does not independently verify the adult's identity, the learner's age, or the adult-child relationship. Guest use is also covered by the parent or guardian permission requirement. The exact age and consent process must be reviewed by counsel before these drafts are treated as final.",
        ],
      },
      {
        heading: "3. Accounts and responsibility",
        paragraphs: [
          "Signed-in accounts use Google or Apple authentication through Clerk. The adult account holder is responsible for safeguarding access to the account, supervising learners using it, and notifying us if they believe it has been used without permission. Do not use another person's account or provide a child's personal information beyond what is needed to use the service.",
          "Guest practice is available without an account. Guest learning data stays on the device and may be lost if app data is cleared or the app is removed.",
        ],
      },
      {
        heading: "4. Educational content",
        paragraphs: [
          "LinguaMatch is an educational practice tool, not a substitute for a qualified language teacher, translator, or other professional. Vocabulary, translations, pronunciation, explanations, and generated or curated examples may contain errors, regional differences, or omissions. Check important language use with a qualified source. We do not promise a particular learning result.",
        ],
      },
      {
        heading: "5. Acceptable use",
        paragraphs: [
          "Use the app lawfully and respectfully. Do not disrupt or attempt to gain unauthorized access to the service, interfere with another person's use, bypass security controls, misuse accounts, or use the app to upload, transmit, or distribute unlawful or harmful material. Adults are responsible for guiding children using the app.",
        ],
      },
      {
        heading: "6. Ownership and permitted use",
        paragraphs: [
          "LinguaMatch and its app interface, software, branding, and learning materials are owned by or licensed to the operator and are protected by applicable intellectual-property laws. You may use the service for personal, non-commercial learning. These Terms do not transfer ownership or grant rights beyond that limited use. Third-party names and services remain the property of their owners.",
        ],
      },
      {
        heading: "7. Changes, availability, and ending access",
        paragraphs: [
          "We may update, suspend, or discontinue features, and the service may be unavailable because of maintenance, connectivity, or provider issues. We may suspend or end access when reasonably necessary for security, safety, legal compliance, or a material violation of these Terms. Where appropriate, we will provide notice. You may stop using the app at any time and request account-data deletion using the contact details below.",
        ],
      },
      {
        heading: "8. Disclaimers and liability",
        paragraphs: [
          "To the extent permitted by applicable law, the service is provided as available, without guarantees that it will be uninterrupted, error-free, or suitable for every learning need. Nothing in these Terms excludes or limits a right or liability that cannot lawfully be excluded or limited. To the fullest extent permitted by law, the operator is not responsible for indirect or consequential losses arising from use of the service. This wording is a draft for attorney review; it does not guarantee protection from claims.",
        ],
      },
      {
        heading: "9. Governing law and disputes — counsel review required",
        paragraphs: [
          "The operator is located in Ventura County, California. A California attorney must confirm the appropriate governing law, venue, consumer-rights language, and any notice requirements before publication. This draft does not include an arbitration clause or class-action waiver.",
        ],
      },
      {
        heading: "10. Contact",
        paragraphs: [
          "Questions about these Terms or requests to end an account may be sent to thomasclipmail@gmail.com. For account or data deletion, include the email address used to sign in and clearly ask for account and synced-progress deletion. Never send a password or sign-in code by email.",
        ],
      },
    ] satisfies LegalSection[],
  },
  privacy: {
    title: "Privacy Policy",
    version: PRIVACY_VERSION,
    updated: "October 25, 2026",
    sections: [
      {
        heading: "1. This draft and who operates LinguaMatch",
        paragraphs: [
          "This draft describes information handled by LinguaMatch, operated by Tsolag Bastekian in Ventura County, California, as provided by the owner. The operator's legal entity status, full business mailing address, and some provider-retention details still need confirmation. This is not legal advice and must be reviewed and approved by a qualified California attorney before it is treated as final.",
        ],
      },
      {
        heading: "2. Information the app handles",
        paragraphs: [
          "Account information: Sign-in is provided by Clerk using Google or Apple. LinguaMatch displays the account's available name and primary email address. Clerk and the sign-in provider process identity and authentication information under their own terms and privacy notices.",
          "Learning and settings information: The app stores language choice, completed lessons and stars, vocabulary-review history, streaks, daily goals, badges, points, appearance and audio preferences on the device. For a signed-in learner, a progress snapshot containing these fields is synced to the LinguaMatch API and stored with the account identifier and a last-updated time.",
          "Mistake reports: If a learner reports a vocabulary or grammar issue during practice, the app stores the selected language, game, issue type, the text they identify, any suggested correction, and the submission time. Reports do not include the learner's account identifier or email. Learners should not include names, contact details, or other personal information in a report.",
          "Legal agreement information: When an adult creates an account, LinguaMatch records the account identifier, the Terms and Privacy document versions, an adult-attestation flag, and the acceptance time. For guest use, the current document versions and attestation are stored locally on that device.",
          "Web analytics: The published web app uses Umami event tracking. The app sends event names and limited event values such as selected language, category, game type, lesson or stage completion, and selected interface actions. The app's event calls do not include the account email or account identifier. Umami may process technical information associated with a web request; exact collection and retention depend on the active Umami configuration and must be confirmed before final publication. Native app builds and local previews do not send these Umami events.",
        ],
      },
      {
        heading: "3. Where information is stored and who processes it",
        paragraphs: [
          "Guest learning and settings data are stored in device-local app storage. Signed-in progress is sent to the LinguaMatch API at https://thomasapps.replit.app, including the /api/learner-progress endpoint, and stored in a PostgreSQL database associated with the service. The app source does not identify the database provider or storage region; the operator must confirm those details before publication.",
          "Clerk provides authentication; Google or Apple may provide sign-in. Umami processes published-web analytics. Replit currently serves the published app and API host. Anonymous mistake reports are stored in the LinguaMatch service database for the operator to review and improve learning content. These providers process information as needed to provide their services and under their own terms. Confirm current contracts, locations, and retention settings with each provider before this draft is finalized.",
        ],
      },
      {
        heading: "4. Why information is used",
        paragraphs: [
          "Pronunciation sends practice text and the selected language to Replit's managed AI service and its OpenAI provider to generate audio. Generated audio is cached in private App Storage and on the learner's device. Only Say It requests microphone access, and only when the learner presses its microphone button. Say It sends chosen short recordings for transcription and text comparison; the app server deletes its temporary recording files after processing and does not persist the transcript. Provider processing locations and retention rules must be confirmed before this draft is finalized.",
          "Information is used to provide sign-in, keep learning progress available on the device, sync signed-in progress across devices, remember settings, review and correct vocabulary or grammar content reports, operate and protect the service, respond to support and privacy requests, and understand aggregate use of the published web app. The app is currently free; it does not require payment to practice.",
        ],
      },
      {
        heading: "5. Children and parent or guardian permission",
        paragraphs: [
          "LinguaMatch is intended for learners age 5 and older. A parent or legal guardian must give permission for anyone under 18 to use the service and should supervise the learner. An adult must manage any account used by a learner under 18.",
          "The current app records an adult's attestation but does not independently verify age, identity, or the adult-child relationship, and it does not ask for a learner's date of birth. Counsel must confirm whether this approach and the providers' data practices are appropriate for the intended child audience, including any required parental notice or consent process, before publication.",
        ],
      },
      {
        heading: "6. Retention and deletion",
        paragraphs: [
          "Guest information remains in local app storage until that data is cleared or the app is removed. Signed-in progress is updated in the service database and the app code does not show an automatic expiry or an in-app account-deletion control. Mistake reports currently have no automatic expiry or in-app deletion control; contact the operator to request removal. Clerk, Replit, and Umami retention periods must be checked in their current account settings and terms.",
          "Legal acceptance records are retained with the account and have no automatic expiry in the current app. To request deletion of a signed-in account and its associated data, including synced progress and agreement records, email thomasclipmail@gmail.com from the account's sign-in email address. We will verify and handle the request manually; no self-service deletion endpoint is currently available. Any required record retention must be confirmed with counsel. To remove guest data, clear LinguaMatch's app storage or uninstall the app. Removing the app does not delete a signed-in account or its synced server copy. Do not email passwords or sign-in codes.",
        ],
      },
      {
        heading: "7. Security and privacy requests",
        paragraphs: [
          "The service uses account authentication and provider infrastructure, but no method of storage or transmission can be guaranteed completely secure. Contact thomasclipmail@gmail.com with privacy questions, access or correction requests, or a concern about a learner's information. California-specific rights, request handling, and response periods should be confirmed by counsel before this draft is finalized.",
        ],
      },
      {
        heading: "8. Changes and questions for counsel",
        paragraphs: [
          "We may update this notice as the app or its providers change. Before publication, confirm the operator's legal entity and address, the database provider and region, analytics collection and retention, account and device-data retention, and the age/guardian-consent process. The current document version is shown above.",
        ],
      },
    ] satisfies LegalSection[],
  },
} as const;
