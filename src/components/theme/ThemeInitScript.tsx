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
