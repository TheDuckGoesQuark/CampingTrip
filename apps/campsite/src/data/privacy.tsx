import type { ReactNode } from "react";

/**
 * Dated rather than versioned by hand: the newsletter stores which wording a
 * subscriber saw as `newsletter_consent_version` in infra/variables.tf, and a
 * change to what this page says about the list is a change to that too.
 */
export const PRIVACY_UPDATED = "2026-09-29";

export const PRIVACY_TITLE = "Privacy";

export const privacyBody: ReactNode = (
  <>
    <p>
      This site is mine, Jordan Mackie's, and it collects very little. Here is all of it, and how to
      have any of it removed.
    </p>

    <h2>The newsletter</h2>
    <p>
      When you subscribe, your email address goes into a list with the time you asked, the time you
      clicked the confirmation link, and the version of the wording you agreed to. That is the whole
      record. It lives in a database in Amazon Web Services' London region, and the same service
      sends the issues on my behalf. Nothing is sent until you have clicked the link.
    </p>
    <p>
      Every issue carries an unsubscribe link. Using it stops the mail at once and leaves only a
      note that the address asked to leave, so it can't be added back by mistake. Write to me and
      I'll delete even that.
    </p>
    <p>
      I don't track whether you open an issue. Links in it carry a tag saying they came from the
      newsletter, so I can see that a post was read from an issue, not who read it.
    </p>

    <h2>The contact form</h2>
    <p>
      A note sent from MouseMail is emailed to me and stored nowhere else. If you leave an address
      with it, that is in the note so I can reply, and it goes nowhere further.
    </p>

    <h2>Your browser</h2>
    <p>
      There are no analytics scripts and no cookies. A few settings, such as whether sound is on,
      are kept in your own browser's storage, where they stay.
    </p>

    <h2>Your rights</h2>
    <p>
      Ask me what I hold about you, to correct it, or to delete it, through the contact form or the
      address on my CV. Under UK data protection law you can also complain to the Information
      Commissioner's Office.
    </p>
  </>
);
