import { useEffect, useRef } from "react";
import { createGame } from "./game/Game";

function App() {
    const gameContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;
        const game = createGame(gameContainerRef.current.id);
        return () => {
            game.destroy(true);
        };
    }, []);

    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h1 style={{ marginBottom: "20px", fontFamily: "Arial", fontSize: "32px" }}>
                2D Dash
            </h1>
            
            <div id="game-container" ref={gameContainerRef} style={{ 
                width: '800px',
                height: '600px',
                margin: '0 auto',
                border: "2px solid #444",
            }}></div>
        </div>
    );
}

export default App
