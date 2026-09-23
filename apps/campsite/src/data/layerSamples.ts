/* Quoted code, not code that runs: it depicts another codebase's design
 * system for the design-system post. It lives in `data/` because that is
 * where this app keeps content. */

export const PRIMITIVES_CODE = `export { Menu } from "@base-ui/react/menu";
export { Dialog } from "@base-ui/react/dialog";
export { Select } from "@base-ui/react/select";
export { Tooltip } from "@base-ui/react/tooltip";`;

export const VARIANTS_CODE = `const badge = tv({
  base: "inline-flex gap-xxs px-xxs rounded-corner-radius-s",
  variants: {
    size: {
      base: "h-6 text-label-base-sentence-case",
      small: "h-5 text-label-small-sentence-case",
    },
    color: {
      danger:
        "bg-surface-status-danger-subtle text-text-status-danger",
      success:
        "bg-surface-status-success-subtle text-text-status-success",
      info:
        "bg-surface-status-info-subtle text-text-status-info",
    },
  },
  defaultVariants: { color: "info", size: "base" },
});`;

export const COMPONENTS_CODE = `
export function DropdownMenu({ children, ...rest }: Props) {
  const slots = menu(); // <- Tailwind variants
  return (
    <Menu.Root {...rest}>
      <Menu.Popup className={slots.popup()}>
        {children}
      </Menu.Popup>
    </Menu.Root>
  );
}`;

export const APPLICATION_CODE = `export function SiteFilter({ studyId }: Props) {
  const { sites, isLoading } = useEnrolmentBySite(studyId);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button trailing={ChevronRight}>Filters</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Search placeholder="Search sites" />
        {isLoading && <Spinner />}
        {sites.map((site) => (
          <Section key={site.id} title={site.name}>
            <Badge color="success">{site.enrolled} enrolled</Badge>
          </Section>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}`;
