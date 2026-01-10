import { Link } from "react-router-dom";
import "./projectTile.css";

export type ProjectTileModel = {
  to: string;
  title: string;
  description: string;
  badgeText: string;
};

export default function ProjectTile({ to, title, description, badgeText }: ProjectTileModel) {
  return (
    <Link to={to} className="projectTile">
      <div className="projectTile__preview" aria-hidden="true">
        {badgeText}
      </div>
      <div className="projectTile__text">
        <div className="projectTile__title">{title}</div>
        <div className="projectTile__description">{description}</div>
      </div>
    </Link>
  );
}