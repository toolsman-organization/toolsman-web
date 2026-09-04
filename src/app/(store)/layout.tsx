import { getActiveCategories } from '@/services/categories';
import { getActiveAnnouncements } from '@/services/announcements';
import { getSiteSettings } from '@/services/settings';
import AnnouncementBarComponent from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';
import { CartProvider } from '@/hooks/useCart';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, announcements, settings] = await Promise.all([
    getActiveCategories(),
    getActiveAnnouncements(),
    getSiteSettings(),
  ]);

  return (
    <CartProvider>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <AnnouncementBarComponent announcements={announcements} />
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
