import { useEffect, useRef } from "react";
import { createGame } from "./game/Game";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./game/constants";
import "./App.css";

function App() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const game = createGame(containerRef.current.id);

        return () => game.destroy(true);
    }, []);

    return (
        <div 
            className="app-root"
            style={{
                ['--world-width' as any]: `${VIEWPORT_WIDTH}px`,
                ['--world-height' as any]: `${VIEWPORT_HEIGHT}px`,
            }}
        >
            {/* <h1 className="app-title">2D Dash</h1> */}

            <div id="game-container" ref={containerRef}></div>
        </div>
    );
}

export default App
