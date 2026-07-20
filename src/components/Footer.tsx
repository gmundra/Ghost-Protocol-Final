import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-ink text-paper mt-24">
      <div className="container-x py-20 md:py-28 grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="text-3xl md:text-4xl font-display leading-tight max-w-md">
            The best learning tools leave no glow on a child's face.
          </div>
          <form
            className="mt-10 flex items-center gap-2 max-w-md border-b border-paper/25 pb-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Your email"
              className="bg-transparent flex-1 outline-none placeholder:text-paper/40 text-paper py-2"
            />
            <button className="text-sm tracking-wide uppercase hover:text-clay transition-colors">
              Subscribe →
            </button>
          </form>
          <p className="text-xs text-paper/40 mt-3">Monthly notes on childhood, learning, and design. No noise.</p>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-10 text-sm">
          <div>
            <div className="eyebrow !text-paper/50 mb-5">Explore</div>
            <ul className="space-y-3">
              <li><Link to="/drops" className="hover:text-clay">Collection</Link></li>
              <li><a href="/#categories" className="hover:text-clay">Categories</a></li>
              <li><a href="/#outcomes" className="hover:text-clay">Outcomes</a></li>
              <li><a href="/#faq" className="hover:text-clay">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow !text-paper/50 mb-5">Company</div>
            <ul className="space-y-3">
              <li><Link to="/story" className="hover:text-clay">Our Story</Link></li>
              <li><a href="/#who" className="hover:text-clay">Who We Serve</a></li>
              <li><Link to="/contact" className="hover:text-clay">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow !text-paper/50 mb-5">Follow</div>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-clay">Instagram</a></li>
              <li><a href="#" className="hover:text-clay">Journal</a></li>
              <li><a href="#" className="hover:text-clay">Educators</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-paper/40">
          <div>© {new Date().getFullYear()} UNSCREEN. Made for meaningful childhoods.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-paper">Privacy</a>
            <a href="#" className="hover:text-paper">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
