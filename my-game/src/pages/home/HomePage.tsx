import { Link } from "react-router-dom";
import "./home.css";

export default function HomePage() {
    return (
        <section className="home">
            <h1 className="home_title">PAO</h1>

            <nav className="home-nav">
                <Link className="home_link" to="/">Home</Link>
                <Link className="home_link" to="/game">Play Game</Link>
            </nav>
        </section>
    );
}