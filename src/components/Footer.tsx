import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-card backdrop-blur-sm bg-card/90">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} StudyBit. All rights reserved.
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Made with ❤️ by your Seniors.
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/browse" className="hover:text-primary transition-colors">
            Browse
          </Link>
          <Link to="/upload" className="hover:text-primary transition-colors">
            Upload
          </Link>
          <Link to="/auth" className="hover:text-primary transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
};
