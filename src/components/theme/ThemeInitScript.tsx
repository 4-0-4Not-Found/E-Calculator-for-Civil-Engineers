import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

/** Inline boot script — keep logic aligned with `ThemeProvider` + `readStored`. */
export const THEME_BOOT_JS = `
(function(){
  try {
    var r=document.documentElement;
    r.classList.remove("dark");
    localStorage.setItem("${CLIENT_PERSISTENCE.theme}","light");
  } catch(e) {}
})();
`;

/** First-paint theme: sets `html.dark` before React hydrates (reduces flash). */
export function ThemeInitScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_BOOT_JS }} />;
}
