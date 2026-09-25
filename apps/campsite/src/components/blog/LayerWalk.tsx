import { Text } from "@jordanscamp/ds";
import { type MouseEvent, type ReactNode, useCallback, useState } from "react";

import {
  APPLICATION_CODE,
  COMPONENTS_CODE,
  PRIMITIVES_CODE,
  VARIANTS_CODE,
} from "../../data/layerSamples";
import { useDocumentId } from "../../prerender/renderTarget";
import { easeScrollTo } from "../../utils/easeScrollTo";
import Code from "./Code";
import { offsiteLinkProps } from "./offsiteLink";

import codeStyles from "./Code.module.css";
import styles from "./LayerWalk.module.css";

/** Hexes are content here, not theme: they depict another codebase's token file. */
const BASE_UI_URL = "https://base-ui.com/";

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
      <span className={codeStyles.line}>
        <span className={codeStyles.comment}>{"/* Gray */"}</span>
      </span>
      <span className={codeStyles.line}>
        <span className={codeStyles.selector}>:root</span>{" "}
        <span className={codeStyles.punct}>{"{"}</span>
      </span>
      {RAW_TOKENS.map((token) => (
        <span className={codeStyles.line} key={token.name}>
          {"  "}
          <span className={codeStyles.prop}>{token.name}</span>
          <span className={codeStyles.punct}>:</span>{" "}
          <span className={`${styles.swatch} ${token.swatch}`} aria-hidden="true" />
          <span className={codeStyles.value}>{token.hex}</span>
          <span className={codeStyles.punct}>;</span>
        </span>
      ))}
      <span className={codeStyles.line}>
        <span className={codeStyles.punct}>{"}"}</span>
      </span>
    </pre>
  );
}

function SemanticTokenBlock() {
  return (
    <pre className={codeStyles.code}>
      <span className={codeStyles.line}>
        <span className={codeStyles.comment}>{"/* Light mode (default) */"}</span>
      </span>
      <span className={codeStyles.line}>
        <span className={codeStyles.selector}>:root</span>{" "}
        <span className={codeStyles.punct}>{"{"}</span>
      </span>
      {SEMANTIC_TOKENS.map((token) => (
        <span className={codeStyles.line} key={token.name}>
          {"  "}
          <span className={codeStyles.prop}>{token.name}</span>
          <span className={codeStyles.punct}>:</span> <span className={codeStyles.fn}>var(</span>
          <span className={`${styles.swatch} ${token.swatch}`} aria-hidden="true" />
          <span className={codeStyles.prop}>{token.ref}</span>
          <span className={codeStyles.fn}>)</span>
          <span className={codeStyles.punct}>;</span>
        </span>
      ))}
      <span className={codeStyles.line}>
        <span className={codeStyles.punct}>{"}"}</span>
      </span>
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
        The same values in our native tongue: primary, secondary, surface, border. Switching between
        light and dark mode is as simple as defining new values for the same variable.
      </>
    ),
  },
  {
    id: "variants",
    name: "Tailwind variants",
    visual: <Code code={VARIANTS_CODE} />,
    prose: (
      <>
        Ask a multi-part component for its <code>small</code> variant, and <code>tv</code> works out
        what small means for each of its parts.
      </>
    ),
  },
  {
    id: "primitives",
    name: "Primitive components",
    visual: <Code code={PRIMITIVES_CODE} />,
    prose: (
      <>
        Mostly threading though{" "}
        <a href={BASE_UI_URL} {...offsiteLinkProps(BASE_UI_URL)}>
          Base UI
        </a>{" "}
        components, or our own carefully constructed headless components. This layer strictly
        provides structure, web semantics, and accessibility. Focus traps, keyboard behaviour, ARIA
        wiring; the parts that are really hard to get right, already solved.
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
        Imports from the components layer passes the server state to be rendered. It can reach for
        flex and grid to put things next to each other, but it's not allowed to interfere with
        branding.
      </>
    ),
  },
];

/** A tree node's link is followed by hand, as `LayerWalk` explains; a modified click keeps the browser's own. */
function TreeNode({
  id,
  name,
  place,
  onFollow,
}: {
  id: string;
  name: string;
  place: string;
  onFollow: (id: string, target: HTMLElement) => void;
}) {
  const anchor = useDocumentId(`layer-${id}`);
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const target = document.getElementById(anchor);
    if (!target) return;
    event.preventDefault();
    onFollow(id, target);
  };
  return (
    <a className={`${styles.treeNode} ${place}`} href={`#${anchor}`} onClick={follow}>
      {name}
    </a>
  );
}

/** `arrival` counts landings here from the tree; each mounts a fresh shimmer, as the contact footer does. */
function LayerSection({ layer, arrival }: { layer: Layer; arrival?: number }) {
  const anchor = useDocumentId(`layer-${layer.id}`);
  return (
    <div className={styles.row} id={anchor} tabIndex={-1}>
      {arrival !== undefined && (
        <span key={arrival} className={styles.rowShimmer} aria-hidden="true" />
      )}
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

/**
 * The tree's links scroll by hand rather than as fragment navigations: the CatOS
 * window answers a hash change by placing the fragment instantly, which is right
 * for a page arriving and wrong for a move within one. Kept out of the address,
 * that code never runs, and the eased scroll and the landing shimmer are the
 * page's own. The prerendered copy has no JS, and there the anchors are anchors.
 */
export default function LayerWalk() {
  const [landed, setLanded] = useState<{ id: string; count: number }>();
  const follow = useCallback((id: string, target: HTMLElement) => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = async () => {
      if (!(await easeScrollTo(target, { instant }))) return;
      target.focus({ preventScroll: true });
      setLanded((last) => ({ id, count: (last?.count ?? 0) + 1 }));
    };
    void land();
  }, []);
  const node = (id: string, name: string, place: string) => (
    <TreeNode id={id} name={name} place={place} onFollow={follow} />
  );

  return (
    <figure className={styles.walk}>
      <nav className={styles.tree} aria-label="Design system layers">
        {node("raw-tokens", "Raw tokens", styles.treeRaw)}
        {node("primitives", "Primitive components", styles.treePrimitives)}
        <div className={styles.linkRawToSemantic} aria-hidden="true" />
        {node("semantic-tokens", "Semantic tokens", styles.treeSemantic)}
        <div className={styles.linkSemanticToVariants} aria-hidden="true" />
        {node("variants", "Tailwind variants", styles.treeVariants)}
        <div className={styles.linkPrimitivesDown} aria-hidden="true" />
        <div className={styles.join} aria-hidden="true" />
        <div className={styles.joinArrow} aria-hidden="true" />
        {node("components", "Components", styles.treeComponents)}
        <div className={styles.linkToApplication} aria-hidden="true" />
        {node("application", "Application", styles.treeApplication)}
      </nav>

      <figcaption className={styles.caption}>
        Dependencies all flow in one direction, where each layer composes the layers below them into
        a new abstraction. Atoms, become compounds, become organisms. Isn't it beautiful?
      </figcaption>

      <div className={styles.rows}>
        {LAYERS.map((layer) => (
          <LayerSection
            key={layer.id}
            layer={layer}
            arrival={landed?.id === layer.id ? landed.count : undefined}
          />
        ))}
      </div>
    </figure>
  );
}
