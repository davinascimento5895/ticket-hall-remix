import * as React from "react";

import { Input } from "./input";

// A small wrapper to keep the same public API for the search input component.
// This exists so consumers can import from "@/components/ui/search-input" even if
// the underlying implementation is just the main Input component.
const SearchInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  (props, ref) => {
    return <Input ref={ref} {...props} />;
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
