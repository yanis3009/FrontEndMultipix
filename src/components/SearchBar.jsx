import { useState } from "react";
import { searchImages } from "../api/client";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("text");
  const [queryImages, setQueryImages] = useState([]); // plusieurs images


    const handleSubmit = async (e) => {
  e.preventDefault();

  // Nettoyage logique
  if (mode === "text" && !query.trim()) return;          // rien à chercher
  if ((mode === "image" || mode === "hybrid") && queryImages.length === 0) {
    // tu peux soit retourner, soit autoriser hybrid avec seulement texte, à toi de choisir
  }

  const data = await searchImages({
    mode,
    query: mode === "image" ? "" : query,
    imageFiles: mode === "text" ? [] : queryImages,
  });

  console.log("Résultats recherche:", data);
};

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files || []);
  const images = files.filter((f) => f.type.startsWith("image/"));
  setQueryImages((prev) => [...prev, ...images]);
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const files = Array.from(e.dataTransfer.files || []);
  const images = files.filter((f) => f.type.startsWith("image/"));
  setQueryImages((prev) => [...prev, ...images]);
};

const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);

    if (newMode === "text") {
      setQueryImages([]);        // plus d’images
    } else if (newMode === "image") {
      setQuery("");              // plus de texte
    }
    // hybrid : on garde les deux
  };

  return (
    <div id="search-section">
      <h2>Recherche / Filtrage</h2>

      <form onSubmit={handleSubmit}>
        {/* Choix du mode */}
        <div>
          <label>Mode :</label>
          <select value={mode} onChange={handleModeChange}>
            <option value="text">Texte</option>
            <option value="image">Image</option>
            <option value="hybrid">Hybride</option>
          </select>
        </div>

        {/* Champ texte visible seulement si mode != image */}
        {(mode === "text" || mode === "hybrid") && (
          <div>
            <label>Requête texte :</label>
            <input
              type="text"
              placeholder="ex : photos de groupe"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        {/* Zone images visible seulement si mode != text */}
        {(mode === "image" || mode === "hybrid") && (
          <>
            <div
              className="dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("search-file-input").click()
              }
            >
              {queryImages.length === 0 ? (
                <span>
                  Glisse une ou plusieurs images ici ou clique pour choisir
                </span>
              ) : (
                <span>{queryImages.length} images de requête sélectionnées</span>
              )}

              <input
                id="search-file-input"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageChange}
              />
            </div>

            <div className="preview-grid">
              {queryImages.map((file, idx) => (
                <img
                  key={idx}
                  className="preview-thumb"
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
              ))}
            </div>
          </>
        )}

        <button type="submit">Lancer la recherche</button>
      </form>

      <div id="results" className="preview-grid">
        {/* plus tard : afficher les résultats retournés par l’API */}
      </div>
    </div>
  );

}

export default SearchBar;
