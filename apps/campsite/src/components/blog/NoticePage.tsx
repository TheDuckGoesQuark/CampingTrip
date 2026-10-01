import { Button, Link, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { contactMailto } from "../../data/contactEmail";
import type { SubscribeNotice } from "../../data/subscribeNotices";
import { useMouseMailIntercept } from "../../hooks/useMouseMailIntercept";
import { blogPaths } from "../../routing/blogPaths";
import SubscribeForm from "./subscribe/SubscribeForm";

import styles from "./NoticePage.module.css";

const CONTACT_PHRASE = "the contact form";

/**
 * "The contact form" in a notice's body is the way to MouseMail: a real
 * `mailto:` that opens the window on the live site, as the contact footer's does.
 */
function NoticeBody({ text }: { text: string }) {
  const interceptProps = useMouseMailIntercept();
  const [before, after] = text.split(CONTACT_PHRASE);
  if (after === undefined || contactMailto === undefined) return text;
  return (
    <>
      {before}
      <Link href={contactMailto} {...interceptProps()}>
        {CONTACT_PHRASE}
      </Link>
      {after}
    </>
  );
}

/** Where a subscribe, confirm or unsubscribe lands when it arrives as a plain
 *  form post or a followed link, with scripts off or on. */
export default function NoticePage({ notice }: { notice: SubscribeNotice }) {
  return (
    <div className={styles.page}>
      <Text variant="title-1">{notice.title}</Text>
      <Text variant="body-lg">
        <NoticeBody text={notice.body} />
      </Text>
      {notice.offerForm ? (
        <SubscribeForm />
      ) : (
        <div>
          <Button variant="subtle" size="sm" render={<RouterLink to={blogPaths.home} />}>
            Back to the blog
          </Button>
        </div>
      )}
    </div>
  );
}
