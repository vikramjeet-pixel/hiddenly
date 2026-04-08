import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900">
      {/* Desktop Top Nav (hidden on mobile) */}
      <Navbar />

      {/* Mobile Top Header (hidden on desktop) */}
      <MobileHeader />

      {/* Main Content */}
      {children}

      {/* Mobile Bottom Nav (hidden on desktop) */}
      <BottomNav />

      {/* Bottom spacer so content isn't hidden behind bottom nav on mobile */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
