import type { PrismTheme } from "prism-react-renderer";
import { CodeBlock } from "react-code-block";

import styles from "./Code.module.css";

/* A prism-react-renderer theme is applied as inline styles, which beat the brand
   classes in Code.module.css. An empty one leaves the token class names as the
   only styling. */
const UNSTYLED: PrismTheme = { plain: {}, styles: [] };

export default function Code({ code, language = "tsx" }: { code: string; language?: string }) {
  return (
    <CodeBlock code={code} language={language} theme={UNSTYLED}>
      <CodeBlock.Code as="pre" className={styles.code}>
        <CodeBlock.LineContent as="span" className={styles.line}>
          {/* The default renders a second span inside every token. */}
          <CodeBlock.Token>{({ children }) => children}</CodeBlock.Token>
        </CodeBlock.LineContent>
      </CodeBlock.Code>
    </CodeBlock>
  );
}
