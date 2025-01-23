"use client";
const Footer = () => {
  return (
    <footer className="h-12 shadow-inner">
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} KartAI
        </p>
      </div>
    </footer>
  );
};

export default Footer;
