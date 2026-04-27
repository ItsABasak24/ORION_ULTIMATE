import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { logoutUser } from '../services/UserService';


const Navbar = ({ ButtonOneText, ButtonOneRoute, ButtonTwoText, ButtonTwoRoute }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      {/* Main Pill Container */}
      <div className="relative px-3 p-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between gap-6 md:gap-10">

        {/* Logo */}
        <Link
          to="/"
          className="pl-4 pr-2 font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-white to-lime-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ORION
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          {ButtonOneRoute && ButtonOneText ?
            <Link to={ButtonOneRoute}
            onClick={()=>(logoutUser())}
              className={`px-5 py-2.5 text-sm font-medium transition-all rounded-full hover:bg-white/10 active:scale-95 ${isActive(ButtonOneRoute)
                ? 'text-white bg-white/10'
                : 'text-gray-300 hover:text-white'
                }`}
            >
              {ButtonOneText}
            </Link>
            : ''}

          <Link to={ButtonTwoRoute}
            className={`px-5 py-2.5 text-sm font-medium transition-all rounded-full hover:bg-white/10 active:scale-95 ${isActive('/signup')
              ? 'text-white bg-white/10'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            {ButtonTwoText}
          </Link>

        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full mt-4 px-4 md:hidden">
          <div className="flex flex-col p-4 rounded-3xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-2">

            {ButtonOneRoute && ButtonOneText ?
              <Link to={ButtonOneRoute} onClick={() => {setIsMobileMenuOpen(false); logoutUser();}} className={`block px-6 py-3 text-center text-sm font-medium rounded-xl transition-all ${isActive(ButtonOneRoute)
                ? 'bg-lime-200/20 text-lime-200'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {ButtonOneText}
              </Link>
              : ''}

            <Link to={ButtonTwoRoute} onClick={() => setIsMobileMenuOpen(false)} className={`block px-6 py-3 text-center text-sm font-medium rounded-xl transition-all ${isActive(ButtonTwoRoute)
              ? 'bg-lime-200/20 text-lime-200'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {ButtonTwoText}
            </Link>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;