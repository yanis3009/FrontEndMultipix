import "./App.css";
import SearchBar from "./components/SearchBar";
import UploadZone from "./components/UploadZone";
import AssistantPanel from "./components/AssistantPanel";

function App() {
  return (
    <div className="app-layout">
      {/* Colonne gauche : Importer un shooting */}
      <aside className="sidebar-left">
        <UploadZone />
      </aside>

      {/* Colonne droite : Recherche + Assistant */}
      <main className="main-right">
        <SearchBar />
        <AssistantPanel />
      </main>
    </div>
  );
}

export default App;

