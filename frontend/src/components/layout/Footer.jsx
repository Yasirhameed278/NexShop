import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, Twitter, Instagram, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-orange-400 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">Nex<span className="text-brand-500">Shop</span></span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">Premium products, exceptional service. Your one-stop shop for everything.</p>
            <div className="flex items-center gap-3">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: 'Shop', links: [['All Products', '/products'], ['Electronics', '/products?category=Electronics'], ['Clothing', '/products?category=Clothing'], ['Sports', '/products?category=Sports']] },
            { title: 'Account', links: [['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['Profile', '/profile'], ['Cart', '/cart']] },
            { title: 'Support', links: [['FAQ', '#'], ['Shipping Info', '#'], ['Returns', '#'], ['Contact Us', '#']] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, path]) => (
                  <li key={label}><Link to={path} className="text-sm hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2024 NexShop. All rights reserved.</p>
          <div className="flex items-center gap-1 text-sm">
            
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs hover:text-white">Privacy Policy</a>
            <a href="#" className="text-xs hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
