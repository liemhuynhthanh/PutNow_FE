import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader /><main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-20">{children}</main><SiteFooter /></>;
}
