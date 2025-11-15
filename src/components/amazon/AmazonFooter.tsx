import { useNavigate } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, ArrowUp, Package } from "lucide-react";

export const AmazonFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white mt-12">
      {/* Back to Top - Modern gradient button */}
      <div 
        className="bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 cursor-pointer text-center py-4 transition-all duration-300 backdrop-blur-sm border-b border-white/10 group"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-semibold">Back to top</span>
          <ArrowUp className="h-4 w-4 group-hover:-translate-y-1 transition-transform duration-300" />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Get to Know Us */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Get to Know Us
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group"
                  onClick={() => navigate("/about")}
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  About Us
                </button>
              </li>
              <li>
                <button 
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group"
                  onClick={() => navigate("/contact")}
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact Us
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Careers
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Press Releases
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Customer Service
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group"
                  onClick={() => navigate("/orders")}
                >
                  <span className="w-1 h-1 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Your Orders
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Shipping Rates & Policies
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Returns & Replacements
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Help
                </button>
              </li>
            </ul>
          </div>

          {/* Policy */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Policy
            </h3>
            <ul className="space-y-3">
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Return Policy
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Terms of Use
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Security
                </button>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Connect with Us
            </h3>
            <div className="flex gap-3">
              <button className="p-2.5 rounded-full bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 border border-white/10 hover:border-primary/50">
                <Facebook className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-full bg-white/5 hover:bg-secondary/20 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 border border-white/10 hover:border-secondary/50">
                <Twitter className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-full bg-white/5 hover:bg-accent/20 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 border border-white/10 hover:border-accent/50">
                <Instagram className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-full bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 border border-white/10 hover:border-primary/50">
                <Youtube className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">LocalMart</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <span>© 2025 LocalMart. All rights reserved.</span>
              <span className="hidden md:inline text-slate-700">|</span>
              <button className="hover:text-white hover:underline transition-colors">
                Conditions of Use
              </button>
              <span className="hidden md:inline text-slate-700">|</span>
              <button className="hover:text-white hover:underline transition-colors">
                Privacy Notice
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
