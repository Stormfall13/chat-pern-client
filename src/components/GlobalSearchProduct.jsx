import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GlobalSearchProduct = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() === "") return;

    // Переход на страницу результатов
    navigate(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form className="global__search" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Поиск товара по названию..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Найти</button>
    </form>
  );
};

export default GlobalSearchProduct;
