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

function TagSearchPanel({ shoots, setShoots }) {
  const [tags, setTags] = useState([]);            // tags sélectionnés
  const [newTag, setNewTag] = useState("");        // tag libre
  const [selectedShootIds, setSelectedShootIds] = useState([]); // dossiers sélectionnés
  const [isLoading, setIsLoading] = useState(false);
  const [lastResultCount, setLastResultCount] = useState(null);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const togglePredefinedTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleShootSelection = (shootId) => {
    setSelectedShootIds((prev) =>
      prev.includes(shootId)
        ? prev.filter((id) => id !== shootId)
        : [...prev, shootId]
    );
  };

  const handleTagSearch = async (e) => {
    e.preventDefault();

    if (tags.length === 0) return;
    if (selectedShootIds.length === 0) return; // on veut au moins un dossier

    // Récupérer toutes les images des shootings sélectionnés
    const baseImages = shoots
      .filter((s) => selectedShootIds.includes(s.id))
      .flatMap((s) => s.files || []);

    if (baseImages.length === 0) return;

    setIsLoading(true);
    setLastResultCount(null);

    // Payload API : à adapter si ton contrat diffère,
    // mais tu as déjà ce genre de structure côté SearchBar.
    const payload = {
      mode: "tags",           // recherche par tags sur des images
      query: "",              // pas de texte ici
      imageFiles: baseImages, // les File[] des dossiers sélectionnés
      tags,                   // tableau de strings
      filters: {
        shootIds: selectedShootIds, // pour info côté backend si besoin
      },
    };

    try {
      const data = await searchImages(payload);

      const imagesFromBackend = Array.isArray(data?.images)
        ? data.images
        : [];

      setShoots((prevShoots) => {
        const newId = crypto.randomUUID();
        const index = prevShoots.length + 1;
        const newShoot = {
          id: newId,
          name: `Résultats tags: ${tags.join(", ")}`,
          files: [],           // les résultats restent côté backend
          metaResults: imagesFromBackend,
        };
        return [...prevShoots, newShoot];
      });

      setLastResultCount(imagesFromBackend.length);
    } catch (err) {
      console.error("Erreur recherche par tags:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="tag-search-panel">
      <h2>Recherche par tags</h2>

      <form onSubmit={handleTagSearch} className="tag-search-form">
        {/* Sélection des dossiers de shooting */}
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

        {/* Tags prédéfinis */}
        <div className="tag-predefined-section">
          <h3>Tags prédéfinis</h3>
          <div className="tag-checkbox-list">
            {PREDEFINED_TAGS.map((tag) => {
              const checked = tags.includes(tag);
              return (
                <label key={tag} className="tag-checkbox-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePredefinedTag(tag)}
                  />
                  <span>{tag}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Ajout de tags libres */}
        <div className="tag-input-row">
          <label>
            Ajouter un tag :
            <input
              type="text"
              placeholder="ex : lifestyle"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            Ajouter
          </button>
        </div>

        {/* Tags sélectionnés (pills) */}
        <div className="selected-tags">
          {tags.length === 0 && (
            <p style={{ fontSize: "0.9rem" }}>
              Aucun tag sélectionné pour l’instant.
            </p>
          )}
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">
              <span className="tag-label">{tag}</span>
              <button
                type="button"
                className="tag-remove-btn"
                onClick={() => handleRemoveTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || tags.length === 0 || selectedShootIds.length === 0}
        >
          {isLoading ? "Recherche..." : "Rechercher avec ces tags"}
        </button>
      </form>

      {lastResultCount !== null && (
        <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>
          Recherche précédente : {lastResultCount} résultat(s).  
          Un dossier “Résultats tags: …” a été ajouté dans “Importer un shooting”.
        </p>
      )}
    </section>
  );
}

export default TagSearchPanel;
