import { Button, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import type { SubscribeNotice } from "../../data/subscribeNotices";
import { blogPaths } from "../../routing/blogPaths";
import SubscribeForm from "./subscribe/SubscribeForm";

import styles from "./NoticePage.module.css";

/** Where a subscribe, confirm or unsubscribe lands when it arrives as a plain
 *  form post or a followed link, with scripts off or on. */
export default function NoticePage({ notice }: { notice: SubscribeNotice }) {
  return (
    <div className={styles.page}>
      <Text variant="title-1">{notice.title}</Text>
      <Text variant="body-lg">{notice.body}</Text>
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
