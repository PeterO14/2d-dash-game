import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import GamePage from "./pages/game/GamePage";

function App() {
    return (
        <main className="site-main">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="*" element={<p>Page not found</p>} />
            </Routes>
        </main>
    );
}

export default App;