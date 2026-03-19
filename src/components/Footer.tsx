import { footerLinks } from "@/data/mockData";

export default function Footer() {
  return (
    <footer id="app-footer" className="px-5 md:px-6 flex flex-wrap gap-x-4 gap-y-2">
      {footerLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="text-[10px] text-slate-400 hover:underline hover:text-slate-500 transition-colors"
        >
          {link.label}
        </a>
      ))}
      <p className="text-[10px] text-slate-400 mt-2 w-full">
        © 2024 NomadSecret. Travel well.
      </p>
    </footer>
  );
}
