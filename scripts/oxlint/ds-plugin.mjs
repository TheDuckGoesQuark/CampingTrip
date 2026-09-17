/**
 * Per-file design-system rules, run by oxlint via `jsPlugins` in /.oxlintrc.json.
 * These see one file at a time, so they catch only the shapes a bespoke control
 * takes locally; the repo-wide question needs the DS's export list and lives in
 * /scripts/ds-guard instead.
 */

/** Roles that promise interactive widget behaviour. Reaching for one on a plain
 *  DOM element means hand-writing that behaviour. */
const CONTROL_ROLES = new Set([
  "checkbox",
  "combobox",
  "listbox",
  "menu",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "radiogroup",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "tablist",
  "tree",
  "treeitem",
]);

function tagName(node) {
  const name = node.openingElement?.name;
  return name?.type === "JSXIdentifier" ? name.name : null;
}

/** A lowercase JSX tag is a DOM element; a capitalised one is a component, and
 *  a component putting a role on itself is usually forwarding it. */
function isDomElement(tag) {
  return tag !== null && /^[a-z]/u.test(tag);
}

function literalAttribute(node, attributeName) {
  const attribute = node.openingElement.attributes.find(
    (candidate) => candidate.type === "JSXAttribute" && candidate.name?.name === attributeName,
  );
  const value = attribute?.value;
  return value?.type === "Literal" && typeof value.value === "string" ? value.value : null;
}

export default {
  meta: { name: "ds" },
  rules: {
    "no-bespoke-control": {
      create(context) {
        return {
          JSXElement(node) {
            const tag = tagName(node);
            if (!isDomElement(tag)) return;

            const role = literalAttribute(node, "role");
            if (role === null || !CONTROL_ROLES.has(role)) return;

            context.report({
              node: node.openingElement,
              message:
                `<${tag} role="${role}"> hand-builds a control. The role is a promise about ` +
                `keyboard behaviour, focus and ARIA state that the element itself does not keep, ` +
                `so every one of them has to be written and tested here. Use the matching ` +
                `@jordanscamp/ds component, or add one to the DS over the Base UI primitive — ` +
                `@base-ui/react ships the behaviour already.`,
            });
          },
        };
      },
    },

    "no-inline-icon": {
      create(context) {
        return {
          JSXElement(node) {
            if (tagName(node) !== "svg") return;

            context.report({
              node: node.openingElement,
              message:
                "Inline <svg> in app code. Icons are visual identity, so they belong to the " +
                "design system: use `<Icon name=… />` from @jordanscamp/ds, or add the glyph to " +
                "its ICON_NAMES set. A local SVG misses the DS's sizing, colour tokens and " +
                "aria-hidden default.",
            });
          },
        };
      },
    },
  },
};
