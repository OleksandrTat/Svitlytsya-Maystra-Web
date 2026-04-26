"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type LabelMap = Record<string, string>;

type Ctx = {
  materials: LabelMap;
  styles: LabelMap;
};

const AttributeLabelsContext = createContext<Ctx>({
  materials: {},
  styles: {},
});

/**
 * Wraps client subtrees so any descendant (ProductCard, filter chips,
 * comparison bar, …) can resolve a material/style slug to its localized
 * label without re-fetching the lookup table on the client.
 *
 * The maps are populated server-side from `getProductFilterOptions(locale)`.
 */
export function AttributeLabelsProvider({
  materials,
  styles,
  children,
}: {
  materials: LabelMap;
  styles: LabelMap;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ materials, styles }), [materials, styles]);
  return (
    <AttributeLabelsContext.Provider value={value}>
      {children}
    </AttributeLabelsContext.Provider>
  );
}

function lookup(map: LabelMap, slug: string) {
  if (!slug) return slug;
  return map[slug] ?? map[slug.toLowerCase()] ?? slug;
}

export function useMaterialLabel() {
  const { materials } = useContext(AttributeLabelsContext);
  return (slug: string) => lookup(materials, slug);
}

export function useStyleLabel() {
  const { styles } = useContext(AttributeLabelsContext);
  return (slug: string) => lookup(styles, slug);
}
