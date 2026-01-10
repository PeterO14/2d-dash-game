import { Link } from "react-router-dom";
import "./home.css";
import ProjectTile, { type ProjectTileModel } from "../../components/projectTile/ProjectTile";

const projects: ProjectTileModel[] = [
    {
        to: "/game",
        title: "Maze Game",
        description: "Start playing the PAO maze game!",
        badgeText: "GAME",
    },
    {
        to: "",
        title: "Shipping",
        description: "Explore shipping data from around the world.",
        badgeText: "DATA",
    }
];

export default function HomePage() {
    return (
        <section className="home">
            <h1 className="home_title">PAO</h1>

            <nav className="home_nav">
                <Link className="home_link" to="/">Home</Link>
                <Link className="home_link" to="/game">Play Game</Link>
            </nav>

            <div className="home_tiles" aria-label="Site Projects">
                {projects.map((p) => (
                    <ProjectTile key={p.to} {...p} />
                ))}
            </div>
        </section>
    );
}