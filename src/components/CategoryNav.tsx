import { useEffect, useRef } from "react";
import { categories, type Category } from "../lib/categories";

const choices = [{ id: "all", name: "All" }, ...categories] as const;

// A sidebar on wide screens and a scrolling row of buttons on phones.
export function CategoryNav({ selected }: { selected: Category }) {
  const nav = useRef<HTMLElement>(null);

  // On phones the chosen button may be off to the side of the row.
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected]);

  return (
    <nav className="categories" aria-label="Categories" ref={nav}>
      {choices.map(({ id, name }) => (
        <a key={id} href={`#${id}`} aria-current={id === selected ? "page" : undefined}>
          {name}
        </a>
      ))}
    </nav>
  );
}
