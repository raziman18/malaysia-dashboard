import { categories, type Category } from "../lib/categories";

const choices = [{ id: "all", name: "All" }, ...categories] as const;

// A sidebar on wide screens and a dropdown on smaller ones. Both change the address, which App listens to.
export function CategoryNav({ selected }: { selected: Category }) {
  return (
    <nav className="categories" aria-label="Categories">
      <label className="category-picker">
        <span className="tile-label">Show</span>
        <select value={selected} onChange={(event) => (location.hash = event.target.value)}>
          {choices.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <ul className="category-links">
        {choices.map(({ id, name }) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={id === selected ? "page" : undefined}>
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
