import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

/** Inline boot script — keep logic aligned with `ThemeProvider` + `readStored`. */
export const THEME_BOOT_JS = `
(function(){
  try {
    var k="${CLIENT_PERSISTENCE.theme}";
    var v=localStorage.getItem(k);
    var dark=false;
    if(v==="dark") dark=true;
    else if(v==="light") dark=false;
    else dark=window.matchMedia("(prefers-color-scheme: dark)").matches;
    var r=document.documentElement;
    if(dark) r.classList.add("dark"); else r.classList.remove("dark");
  } catch(e) {}
})();
`;

/** First-paint theme: sets `html.dark` before React hydrates (reduces flash). */
export function ThemeInitScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_BOOT_JS }} />;
}
