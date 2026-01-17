import { useState } from "react";
import { searchImages } from "../api/client";

const PREDEFINED_TAGS = [
  "naturel",
  "posé",
  "spontané",
  "artistique",
  "studio",
  "extérieur",
  "intérieur",
  "mariage",
  "portrait-pro",
  "famille",
  "couple",
  "golden-hour",
  "noir-et-blanc",
];

// renvoie "portrait", "landscape" ou "unknown" d'après width/height
function getOrientationFromDimensions(width, height) {
  if (!width || !height) return "unknown";
  if (height > width) return "portrait";
  if (width > height) return "landscape";
  return "unknown";
}

// filtre les fichiers entre deux datetimes + orientation + taille
function filterFilesByDateOrientationAndSize(
  files,
  startStr,
  endStr,
  orientation,
  excludeLarge,
  maxWidthStr,
  maxHeightStr
) {
  const startTime = startStr ? new Date(startStr).getTime() : -Infinity;
  const endTime = endStr ? new Date(endStr).getTime() : Infinity;

  const maxW = maxWidthStr ? Number(maxWidthStr) : Infinity;
  const maxH = maxHeightStr ? Number(maxHeightStr) : Infinity;

  return files.filter((file) => {
    const fileTime = file.lastModified; // ms depuis 1970
    if (fileTime < startTime || fileTime > endTime) return false;

    // Orientation
    if (orientation !== "any") {
      const width = file._width;
      const height = file._height;
      const fileOrientation = getOrientationFromDimensions(width, height);

      if (
        (orientation === "portrait" && fileOrientation !== "portrait") ||
        (orientation === "landscape" && fileOrientation !== "landscape")
      ) {
        return false;
      }
    }

    // Taille
    if (excludeLarge) {
      const width = file._width;
      const height = file._height;
      if (width && width > maxW) return false;
      if (height && height > maxH) return false;
    }

    return true;
  });
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("text");
  const [queryImages, setQueryImages] = useState([]); // plusieurs images

  const [tags, setTags] = useState([]); // liste des tags actuels
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const [history, setHistory] = useState([]);
  // chaque entrée : { id, mode, query, images, tags }

  // Filtres avancés
  const [dateRangeStart, setDateRangeStart] = useState(""); // datetime-local
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [orientationFilter, setOrientationFilter] = useState("any"); // any | portrait | landscape
  const [excludeLargeImages, setExcludeLargeImages] = useState(false);
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "text" && !query.trim()) return;
    if ((mode === "image" || mode === "hybrid") && queryImages.length === 0) {
      return;
    }

    // Filtre période + orientation + taille sur les images de requête
    const filteredImages =
      mode === "text"
        ? []
        : filterFilesByDateOrientationAndSize(
            queryImages,
            dateRangeStart,
            dateRangeEnd,
            orientationFilter,
            excludeLargeImages,
            maxWidth,
            maxHeight
          );

    const payload = {
      mode,
      query: mode === "image" ? "" : query,
      imageFiles: filteredImages,
      tags, // tableau de strings pour le backend
      filters: {
        dateRange: {
          start: dateRangeStart || null,
          end: dateRangeEnd || null,
        },
        orientation: orientationFilter,
        excludeLargeImages,
        maxWidth: maxWidth || null,
        maxHeight: maxHeight || null,
      },
    };

    // Ajout à l'historique (limité aux 5 dernières recherches)
    setHistory((prev) => {
      const newEntry = {
        id: Date.now(),
        mode: payload.mode,
        query: payload.query,
        images: payload.imageFiles,
        tags: payload.tags,
      };
      const list = [newEntry, ...prev];
      return list.slice(0, 5);
    });

    console.log("Images avant filtre date/orientation/taille :", queryImages);
    console.log("Images après filtre date/orientation/taille :", filteredImages);
    console.log("payload /search :", payload);

    const data = await searchImages(payload);
    console.log("Résultats recherche:", data);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const images = files.filter((f) => f.type.startsWith("image/"));

    images.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        file._width = img.width;
        file._height = img.height;
        console.log("Dimensions lues pour", file.name, img.width, img.height);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

    setQueryImages((prev) => [...prev, ...images]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    theimages = files.filter((f) => f.type.startsWith("image/"));

    const images = files.filter((f) => f.type.startsWith("image/"));
    images.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        file._width = img.width;
        file._height = img.height;
        console.log(
          "Dimensions lues (drop) pour",
          file.name,
          img.width,
          img.height
        );
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

    setQueryImages((prev) => [...prev, ...images]);
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);

    if (newMode === "text") {
      setQueryImages([]);
    } else if (newMode === "image") {
      setQuery("");
    }
  };

  return (
    <div className="search-layout">
      {/* Colonne gauche : formulaire de recherche */}
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

          {/* Sélection des tags */}
          <div className="search-tags-row">
            <button
              type="button"
              className="tag-select-btn"
              onClick={() => setIsTagModalOpen(true)}
            >
              Sélection de tags
            </button>

            <div className="selected-tags">
              {tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  <span className="tag-label">{tag}</span>
                  <button
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      setTags((prev) => prev.filter((t) => t !== tag))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Filtres avancés */}
          <div className="search-filters-advanced">
            <div className="filter-item">
              <label>Du :</label>
              <input
                type="datetime-local"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Au :</label>
              <input
                type="datetime-local"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Orientation :</label>
              <select
                value={orientationFilter}
                onChange={(e) => setOrientationFilter(e.target.value)}
              >
                <option value="any">Toutes</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Largeur max (px) :</label>
              <input
                type="number"
                min="0"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Hauteur max (px) :</label>
              <input
                type="number"
                min="0"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
              />
            </div>

            <div className="filter-item filter-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={excludeLargeImages}
                  onChange={(e) => setExcludeLargeImages(e.target.checked)}
                />
                Exclure les images trop grandes
              </label>
            </div>
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
                  <span>
                    {queryImages.length} images de requête sélectionnées
                  </span>
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

        {/* Pop-up de sélection / ajout de tags */}
        {isTagModalOpen && (
          <div
            className="modal-backdrop"
            onClick={() => setIsTagModalOpen(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Sélection de tags</h3>

              <div className="tag-checkbox-list">
                {PREDEFINED_TAGS.map((tag) => {
                  const checked = tags.includes(tag);
                  return (
                    <label key={tag} className="tag-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTags((prev) =>
                              prev.includes(tag) ? prev : [...prev, tag]
                            );
                          } else {
                            setTags((prev) => prev.filter((t) => t !== tag));
                          }
                        }}
                      />
                      <span>{tag}</span>
                    </label>
                  );
                })}
              </div>

              {/* Option pour ajouter un tag libre en plus */}
              <form
                className="tag-new-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = newTag.trim();
                  if (!trimmed) return;
                  setTags((prev) =>
                    prev.includes(trimmed) ? prev : [...prev, trimmed]
                  );
                  setNewTag("");
                }}
              >
                <input
                  type="text"
                  placeholder="Ajouter un tag libre"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <button type="submit">Ajouter</button>
              </form>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        <div id="results" className="preview-grid">
          {/* plus tard : afficher les résultats retournés par l’API */}
        </div>
      </div>

      {/* Colonne droite : historique des recherches */}
      <div className="search-history-section">
        <h3>Recherches récentes</h3>
        {history.length === 0 && <p>Aucune recherche pour l’instant.</p>}

        <div className="search-history-list">
          {history.map((item) => (
            <div
              key={item.id}
              className="search-history-item"
              onClick={() => {
                setMode(item.mode);
                setQuery(item.query || "");
                setQueryImages(item.images || []);
                setTags(item.tags || []);
              }}
            >
              <div className="history-header">
                <span className="history-mode">{item.mode}</span>
                {item.tags && item.tags.length > 0 && (
                  <span className="history-tags">
                    {item.tags.join(", ")}
                  </span>
                )}
              </div>

              {item.query && (
                <div className="history-query">“{item.query}”</div>
              )}

              {item.images && item.images.length > 0 && (
                <div className="history-images">
                  {item.images.slice(0, 3).map((file, idx) => (
                    <img
                      key={idx}
                      className="history-thumb"
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                  ))}
                  {item.images.length > 3 && (
                    <span className="history-more">
                      +{item.images.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
