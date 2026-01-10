import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { createGame } from "../../game/Game";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../game/constants";
import "./game.css";

export default function GamePage() {
	const containerRef = useRef<HTMLDivElement | null>(null);

	const sizeStyle = useMemo(
		() => ({
			["--world-width" as any]: `${VIEWPORT_WIDTH}px`,
			["--world-height" as any]: `${VIEWPORT_HEIGHT}px`,
		}),
		[]
	);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		if (!el.id) el.id = "game-container";

		const game = createGame(el.id);

		return () => {
			game.destroy(true);
		};
	}, []);

	return (
		<div className="gamePage" style={sizeStyle}>
			{ /* Top Bar */ }
			<div className="gamePage_top">
				<Link className="gamePage_link" to="/">Home</Link>

				<div className="gamePage_topButtons">
					<button className="gamePage_btn" type="button" onClick={() => window.location.reload()}>
						Restart
					</button>
					<button className="gamePage_btn" type="button" onClick={() => alert("Settings coming soon!")}>
						Settings
					</button>
				</div>
			</div>

			{ /* Center stage: left panel | game | right panel */ }
			<div className="gamePage_stage">
				<aside className="gamePage_panel">
					<h3 className="gamePage_panelTitle">Controls</h3>
					<ul className="gamePage_list">
						<li>Move: Arrow Keys / A-D</li>
						<li>Jump: Space</li>
						<li>Dash: Shift</li>
					</ul>
				</aside>

				<div className="gamePage_gameFrame">
					<div id="game-container" ref={containerRef} />
				</div>

				<aside className="gamePage_panel">
					<h3 className="gamePage_panelTitle">Actions</h3>
					<div className="gamePage_panelButtons">
						<button className="gamePage_btn" type="button" onClick={() => alert("Pause coming soon!")}>
							Pause
						</button>
						<button className="gamePage_btn" type="button" onClick={() => alert("Fullscreen coming soon!")}>
							Fullscreen
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
}