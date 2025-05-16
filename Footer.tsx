// /components/layout/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-700 text-white p-8 mt-auto">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} MyShop. All rights reserved.</p>
        <div className="mt-2">
          <a href="/privacy-policy" className="hover:text-gray-300 mx-2">
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="hover:text-gray-300 mx-2">
            Terms of Service
          </a>
          <a href="/contact-us" className="hover:text-gray-300 mx-2">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

