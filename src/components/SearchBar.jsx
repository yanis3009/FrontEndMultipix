import { useState } from "react";
import { searchImages } from "../api/client";

function getOrientationFromDimensions(width, height) {
  if (!width || !height) return "unknown";
  if (height > width) return "portrait";
  if (width > height) return "landscape";
  return "unknown";
}

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
    const fileTime = file.lastModified;
    if (fileTime < startTime || fileTime > endTime) return false;

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

    if (excludeLarge) {
      const width = file._width;
      const height = file._height;
      if (width && width > maxW) return false;
      if (height && height > maxH) return false;
    }

    return true;
  });
}

function SearchBar({ shoots }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("text"); // text | image | hybrid | faces
  const [queryImages, setQueryImages] = useState([]);
  const [faceQueryImages, setFaceQueryImages] = useState([]); // visages de référence
  const [faceFilterMode, setFaceFilterMode] = useState("union"); // union | intersection

  const [history, setHistory] = useState([]);

  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [orientationFilter, setOrientationFilter] = useState("any");
  const [excludeLargeImages, setExcludeLargeImages] = useState(false);
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");

  const [selectedShootIds, setSelectedShootIds] = useState([]);

  const toggleShootSelection = (shootId) => {
    setSelectedShootIds((prev) =>
      prev.includes(shootId)
        ? prev.filter((id) => id !== shootId)
        : [...prev, shootId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pour text / image / hybrid : garder la logique existante
    if (mode === "text" && !query.trim()) return;

    let baseImages = [];

    if (selectedShootIds.length > 0) {
      const fromShoots = shoots
        .filter((s) => selectedShootIds.includes(s.id))
        .flatMap((s) => s.files || []);
      baseImages = fromShoots;
    } else if (mode === "image" || mode === "hybrid") {
      baseImages = queryImages;
    }

    // Pour le mode visages, les images de base sont les dossiers sélectionnés
    if (mode === "faces") {
      if (selectedShootIds.length === 0) {
        // pour l’instant on force le choix d’au moins un dossier
        return;
      }
      baseImages = shoots
        .filter((s) => selectedShootIds.includes(s.id))
        .flatMap((s) => s.files || []);
      if (baseImages.length === 0) return;
      if (faceQueryImages.length === 0) return; // pas de visages fournis
    }

    if (
      (mode === "image" || mode === "hybrid") &&
      baseImages.length === 0
    ) {
      return;
    }

    const filteredImages =
      mode === "text" && selectedShootIds.length === 0
        ? []
        : filterFilesByDateOrientationAndSize(
            baseImages,
            dateRangeStart,
            dateRangeEnd,
            orientationFilter,
            excludeLargeImages,
            maxWidth,
            maxHeight
          );

    const payload = {
      mode,
      query: mode === "image" || mode === "faces" ? "" : query,
      imageFiles: filteredImages,
      tags: [],
      filters: {
        dateRange: {
          start: dateRangeStart || null,
          end: dateRangeEnd || null,
        },
        orientation: orientationFilter,
        excludeLargeImages,
        maxWidth: maxWidth || null,
        maxHeight: maxHeight || null,
        shootIds: selectedShootIds,
        // parties spécifiques aux visages
        faceFilterMode: mode === "faces" ? faceFilterMode : null,
      },
      // visages à utiliser côté back pour filter_union / filter_intersection
      faceQueryImages: mode === "faces" ? faceQueryImages : [],
    };

    setHistory((prev) => {
      const newEntry = {
        id: Date.now(),
        mode: payload.mode,
        query: payload.query,
        images: payload.imageFiles,
        tags: [],
      };
      const list = [newEntry, ...prev];
      return list.slice(0, 5);
    });

    console.log("Shoots sélectionnés :", selectedShootIds);
    console.log("Base images :", baseImages);
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

  // gestion des images de visages
  const handleFaceImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    setFaceQueryImages((prev) => [...prev, ...images]);
  };

  const handleFaceDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    setFaceQueryImages((prev) => [...prev, ...images]);
  };

  const removeFaceImageAtIndex = (indexToRemove) => {
    setFaceQueryImages((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const removeQueryImageAtIndex = (indexToRemove) => {
    setQueryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);

    if (newMode === "text") {
      setQueryImages([]);
    } else if (newMode === "image") {
      setQuery("");
    }
    // pour faces, on laisse query tel quel, car non utilisé
  };

  return (
    <div className="search-layout">
      <div id="search-section">
        <h2>Recherche / Filtrage</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Mode :</label>
            <select value={mode} onChange={handleModeChange}>
              <option value="text">Texte</option>
              <option value="image">Image</option>
              <option value="hybrid">Hybride</option>
              <option value="faces">Visages</option>
            </select>
          </div>

          <div className="shoot-filter-section">
            <h3>Dossiers de shooting</h3>
            {shoots.length === 0 && (
              <p style={{ fontSize: "0.9rem" }}>
                Aucun shooting importé pour l’instant.
              </p>
            )}
            <div className="shoot-checkbox-list">
              {shoots.map((shoot) => {
                const checked = selectedShootIds.includes(shoot.id);
                return (
                  <label key={shoot.id} className="shoot-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleShootSelection(shoot.id)}
                    />
                    <span>
                      {shoot.name} ({shoot.files.length} photos)
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

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
                  <div key={idx} className="preview-item">
                    <img
                      className="preview-thumb"
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeQueryImageAtIndex(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === "faces" && (
            <>
              <div className="face-mode-section">
                <h3>Filtre visages</h3>
                <div className="filter-item">
                  <label>Mode de filtrage :</label>
                  <select
                    value={faceFilterMode}
                    onChange={(e) => setFaceFilterMode(e.target.value)}
                  >
                    <option value="union">
                      Au moins une de ces personnes (union)
                    </option>
                    <option value="intersection">
                      Toutes ces personnes ensemble (intersection)
                    </option>
                  </select>
                </div>

                <div
                  className="dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={handleFaceDrop}
                  onClick={() =>
                    document.getElementById("face-file-input").click()
                  }
                >
                  {faceQueryImages.length === 0 ? (
                    <span>
                      Glisse une ou plusieurs photos de visages ici ou clique
                      pour choisir
                    </span>
                  ) : (
                    <span>
                      {faceQueryImages.length} visage(s) de requête sélectionné(s)
                    </span>
                  )}

                  <input
                    id="face-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleFaceImagesChange}
                  />
                </div>

                <div className="preview-grid">
                  {faceQueryImages.map((file, idx) => (
                    <div key={idx} className="preview-item">
                      <img
                        className="preview-thumb"
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeFaceImageAtIndex(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="submit">Lancer la recherche</button>
        </form>

        <div id="results" className="preview-grid">
          {/* plus tard : afficher les résultats retournés par l’API */}
        </div>
      </div>

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
              }}
            >
              <div className="history-header">
                <span className="history-mode">{item.mode}</span>
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
