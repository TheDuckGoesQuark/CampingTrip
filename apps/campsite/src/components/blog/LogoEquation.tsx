import { Card, Text } from "@jordanscamp/ds";
import { Equals, Plus } from "@jordanscamp/ds/icons";
import { useId } from "react";

import { asset } from "../../utils/assetPath";

import styles from "./blog.module.css";

const LOGO_HEIGHT = 48;
const OPERATOR_SIZE = 32;

/**
 * The pitch in one image: Figma, Claude and a good React screen add up. Local
 * to the blog rather than in the design system, one consumer so far.
 */
export default function LogoEquation() {
  const captionId = useId();
  return (
    <figure className={styles.logoEquationFigure} aria-labelledby={captionId}>
      <Card tone="subtle" elevation="floating" padding="sm">
        <div className={styles.logoEquation}>
          <img src={asset("images/logos/figma.svg")} alt="" height={LOGO_HEIGHT} />
          <Plus size={OPERATOR_SIZE} className={styles.logoEquationOperator} aria-hidden />
          <img src={asset("images/logos/claude.svg")} alt="" height={LOGO_HEIGHT} />
          <Equals size={OPERATOR_SIZE} className={styles.logoEquationOperator} aria-hidden />
          <img src={asset("images/logos/react.svg")} alt="" height={LOGO_HEIGHT} />
        </div>
      </Card>
      <figcaption id={captionId} className={styles.logoEquationCaption}>
        <Text as="div" variant="body-sm" tone="muted" align="center">
          Figma + Claude = React Components
        </Text>
      </figcaption>
    </figure>
  );
}
