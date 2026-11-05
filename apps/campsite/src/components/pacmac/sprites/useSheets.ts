import { useEffect, useState } from "react";

import { loadSuppliedSheets, placeholderSheets, type Sheets } from "./sheets";

/** Placeholders at once, each replaced by its PNG as that arrives. */
export function useSheets(): Sheets {
  const [sheets, setSheets] = useState<Sheets>(placeholderSheets);
  useEffect(
    () =>
      loadSuppliedSheets((key, sheet) => setSheets((current) => ({ ...current, [key]: sheet }))),
    [],
  );
  return sheets;
}
