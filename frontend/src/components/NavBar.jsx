import { useState } from "react";
import { Link } from "react-router";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed h-16 w-full top-0 z-50">
      <div className="mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            HEALIX<span className="text-gray-800">AI</span>
          </Link>

          {/* Hamburger Icon (Phone Only) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
          >
            <span
              className={`h-0.5 w-full bg-gray-800 transition ${menuOpen && "rotate-45 translate-y-2"}`}
            />
            <span
              className={`h-0.5 w-full bg-gray-800 transition ${menuOpen && "opacity-0"}`}
            />
            <span
              className={`h-0.5 w-full bg-gray-800 transition ${menuOpen && "-rotate-45 -translate-y-2"}`}
            />
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 font-medium">
           
            <Link to="/signup" className="hover:text-indigo-600">
              register
            </Link>
            <Link to="/login" className="hover:text-indigo-600">
              login
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white shadow-lg transition-all duration-300 ${
          menuOpen
            ? "max-h-60 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col px-6 py-4 space-y-4 font-medium">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/signup" onClick={() => setMenuOpen(false)}>
            register
          </Link>
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            login
          </Link>
          
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
