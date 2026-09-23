import { Text } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import {
  APPLICATION_CODE,
  COMPONENTS_CODE,
  PRIMITIVES_CODE,
  VARIANTS_CODE,
} from "../../data/layerSamples";
import { useDocumentId } from "../../prerender/renderTarget";
import Code from "./Code";

import codeStyles from "./Code.module.css";
import styles from "./LayerWalk.module.css";

/** Hexes are content here, not theme: they depict another codebase's token file. */
const RAW_TOKENS = [
  { name: "--gray-white", hex: "#ffffff", swatch: styles.swWhite },
  { name: "--gray-25", hex: "#fcfcfd", swatch: styles.sw25 },
  { name: "--gray-50", hex: "#f9fafb", swatch: styles.sw50 },
  { name: "--gray-100", hex: "#f2f4f7", swatch: styles.sw100 },
  { name: "--gray-200", hex: "#e4e7ec", swatch: styles.sw200 },
  { name: "--gray-300", hex: "#d0d5dd", swatch: styles.sw300 },
  { name: "--gray-400", hex: "#98a2b3", swatch: styles.sw400 },
];

const SEMANTIC_TOKENS = [
  { name: "--sem-text-role-primary", ref: "--gray-900", swatch: styles.sw900 },
  { name: "--sem-text-role-secondary", ref: "--gray-700", swatch: styles.sw700 },
  { name: "--sem-text-role-tertiary", ref: "--gray-550", swatch: styles.sw550 },
  { name: "--sem-text-role-disabled", ref: "--gray-400", swatch: styles.sw400 },
  { name: "--sem-text-role-link", ref: "--indigo-medium", swatch: styles.swIndigo },
  { name: "--sem-text-role-link-hover", ref: "--indigo-dark", swatch: styles.swIndigoDark },
];

function RawTokenBlock() {
  return (
    <pre className={codeStyles.code}>
      <span className={codeStyles.comment}>{"/* Gray */"}</span>
      {"\n"}
      <span className={codeStyles.selector}>:root</span>{" "}
      <span className={codeStyles.punct}>{"{"}</span>
      {"\n"}
      {RAW_TOKENS.map((token) => (
        <span key={token.name}>
          {"  "}
          <span className={codeStyles.prop}>{token.name}</span>
          <span className={codeStyles.punct}>:</span>{" "}
          <span className={`${styles.swatch} ${token.swatch}`} aria-hidden="true" />
          <span className={codeStyles.value}>{token.hex}</span>
          <span className={codeStyles.punct}>;</span>
          {"\n"}
        </span>
      ))}
      <span className={codeStyles.punct}>{"}"}</span>
    </pre>
  );
}

function SemanticTokenBlock() {
  return (
    <pre className={codeStyles.code}>
      <span className={codeStyles.comment}>{"/* Light mode (default) */"}</span>
      {"\n"}
      <span className={codeStyles.selector}>:root</span>{" "}
      <span className={codeStyles.punct}>{"{"}</span>
      {"\n"}
      {SEMANTIC_TOKENS.map((token) => (
        <span key={token.name}>
          {"  "}
          <span className={codeStyles.prop}>{token.name}</span>
          <span className={codeStyles.punct}>:</span> <span className={codeStyles.fn}>var(</span>
          <span className={`${styles.swatch} ${token.swatch}`} aria-hidden="true" />
          <span className={codeStyles.prop}>{token.ref}</span>
          <span className={codeStyles.fn}>)</span>
          <span className={codeStyles.punct}>;</span>
          {"\n"}
        </span>
      ))}
      <span className={codeStyles.punct}>{"}"}</span>
    </pre>
  );
}

interface Layer {
  id: string;
  name: string;
  visual: ReactNode;
  prose: ReactNode;
}

const LAYERS: Layer[] = [
  {
    id: "raw-tokens",
    name: "Raw tokens",
    visual: <RawTokenBlock />,
    prose: <>Fonts, colours, spacing, named after what they are rather than what they are for.</>,
  },
  {
    id: "semantic-tokens",
    name: "Semantic tokens",
    visual: <SemanticTokenBlock />,
    prose: (
      <>
        The same values, renamed into the language we actually speak: primary, secondary, surface,
        border. Switching between light and dark mode means using the same semantic names pointed at
        different values.
      </>
    ),
  },
  {
    id: "variants",
    name: "Tailwind variants",
    visual: <Code code={VARIANTS_CODE} />,
    prose: (
      <>
        Every variant a component is allowed to have. Ask a multi-part component for{" "}
        <code>small</code>, and <code>tv</code> works out what small means for each of its parts.
      </>
    ),
  },
  {
    id: "primitives",
    name: "Primitive components",
    visual: <Code code={PRIMITIVES_CODE} />,
    prose: (
      <>
        A pass-through over Base UI, or our own carefully constructed headless components. This
        layer strictly provides structure, web semantics, and accessibility. Focus traps, keyboard
        behaviour, ARIA wiring, the parts that are genuinely hard and already solved.
      </>
    ),
  },
  {
    id: "components",
    name: "Components",
    visual: <Code code={COMPONENTS_CODE} />,
    prose: (
      <>
        The primitive wearing the variants, exported as something a person can use. Every part it is
        made of gets its own slot, so a caller picks a component and never a class name. This is the
        layer the application is allowed to know about.
      </>
    ),
  },
  {
    id: "application",
    name: "Application",
    visual: <Code code={APPLICATION_CODE} />,
    prose: (
      <>
        Imports from the components layer passes the server state to be rendered. It may reach for
        flex and grid to put things next to each other, but doesn't concern itself with branding.
      </>
    ),
  },
];

function TreeNode({ id, name, place }: { id: string; name: string; place: string }) {
  const anchor = useDocumentId(`layer-${id}`);
  return (
    <a className={`${styles.treeNode} ${place}`} href={`#${anchor}`}>
      {name}
    </a>
  );
}

function LayerSection({ layer }: { layer: Layer }) {
  const anchor = useDocumentId(`layer-${layer.id}`);
  return (
    <div className={styles.row} id={anchor}>
      <div className={styles.explain}>
        <Text variant="title-4" as="h3">
          {layer.name}
        </Text>
        <Text variant="body-sm" as="p">
          {layer.prose}
        </Text>
      </div>
      <div className={styles.visual}>{layer.visual}</div>
    </div>
  );
}

export default function LayerWalk() {
  return (
    <figure className={styles.walk}>
      <nav className={styles.tree} aria-label="Design system layers">
        <TreeNode id="raw-tokens" name="Raw tokens" place={styles.treeRaw} />
        <TreeNode id="primitives" name="Primitive components" place={styles.treePrimitives} />
        <div className={styles.linkRawToSemantic} aria-hidden="true" />
        <TreeNode id="semantic-tokens" name="Semantic tokens" place={styles.treeSemantic} />
        <div className={styles.linkSemanticToVariants} aria-hidden="true" />
        <TreeNode id="variants" name="Tailwind variants" place={styles.treeVariants} />
        <div className={styles.linkPrimitivesDown} aria-hidden="true" />
        <div className={styles.join} aria-hidden="true" />
        <div className={styles.joinArrow} aria-hidden="true" />
        <TreeNode id="components" name="Components" place={styles.treeComponents} />
        <div className={styles.linkToApplication} aria-hidden="true" />
        <TreeNode id="application" name="Application" place={styles.treeApplication} />
      </nav>

      <figcaption className={styles.caption}>
        Dependencies all flow in one direction, where each layer composes the layers below them into
        a new abstraction. Atoms, become compounds, become organisms. Isn't it beautiful?
      </figcaption>

      <div className={styles.rows}>
        {LAYERS.map((layer) => (
          <LayerSection key={layer.id} layer={layer} />
        ))}
      </div>
    </figure>
  );
}
