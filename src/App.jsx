import { useState } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar";
import UploadZone from "./components/UploadZone";
import AssistantPanel from "./components/AssistantPanel";
import TagSearchPanel from "./components/TagSearchPanel";

function App() {
  const [shoots, setShoots] = useState([]); // [{ id, name, files: File[] }]

  return (
    <div className="app-layout">
      {/* Colonne gauche : Importer un shooting */}
      <aside className="sidebar-left">
        <UploadZone shoots={shoots} setShoots={setShoots} />
      </aside>

      {/* Colonne droite : Recherche + Recherche par tags + Assistant */}
      <main className="main-right">
        <SearchBar shoots={shoots} />
        <TagSearchPanel shoots={shoots} setShoots={setShoots} />
        <AssistantPanel />
      </main>
    </div>
  );
}

export default App;
