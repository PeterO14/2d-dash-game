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
        <div id="game-container" ref={gameContainerRef} style={{ 
            width: '800px',
            height: '600px',
            margin: '0 auto',
            border: "2px solid #444",
        }}></div>
    );
}

export default App
