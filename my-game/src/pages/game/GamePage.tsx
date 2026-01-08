import { useEffect, useRef } from "react";
import { createGame } from "../../game/Game";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../game/constants";

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Ensure the element has an id for your existing createGame(containerId) API.
    if (!el.id) el.id = "game-container";

    const game = createGame(el.id);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      className="game-page"
      style={{
        ["--world-width" as any]: `${VIEWPORT_WIDTH}px`,
        ["--world-height" as any]: `${VIEWPORT_HEIGHT}px`,
      }}
    >
      <div id="game-container" ref={containerRef} />
    </div>
  );
}