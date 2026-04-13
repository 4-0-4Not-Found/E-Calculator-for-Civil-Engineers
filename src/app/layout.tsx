import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { HydrationDebugProbe } from "./HydrationDebugProbe";
import "./globals.css";
import { appendFile, mkdir } from "node:fs/promises";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AISC Structural Engineering PWA",
  description: "Progressive Web App for AISC-based structural engineering calculations.",
  manifest: "/manifest.json",
  applicationName: "AISC Structural Engineering PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AISC PWA",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const devServerStamp =
    process.env.NODE_ENV === "development"
      ? {
          pid: process.pid,
          cwd: process.cwd(),
        }
      : null;

  // #region agent log
  try {
    try {
      const logDir = "C:\\Users\\Asus\\OneDrive\\Desktop\\Civil-E-Cal\\.cursor";
      const logPath =
        "C:\\Users\\Asus\\OneDrive\\Desktop\\Civil-E-Cal\\.cursor\\debug-fd44da.log";
      await mkdir(logDir, { recursive: true });
      await appendFile(
        logPath,
        `${JSON.stringify({
          sessionId: "fd44da",
          runId: "ssr-file",
          hypothesisId: "H12",
          location: "src/app/layout.tsx:ssr-file",
          message: "RootLayout rendered on server (file)",
          data: { logPath },
          timestamp: Date.now(),
        })}\n`,
        "utf8",
      );
    } catch {}

    fetch("http://127.0.0.1:7464/ingest/ca13048c-9d98-4bcc-a485-2fd46d0652e4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "fd44da",
      },
      body: JSON.stringify({
        sessionId: "fd44da",
        runId: "ssr",
        hypothesisId: "H7",
        location: "src/app/layout.tsx:ssr",
        message: "RootLayout rendered on server",
        data: { hasWindow: typeof window !== "undefined" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
  // #endregion agent log

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* #region agent log */}
        <script
          src={`/api/agent-beacon?runId=head-beacon&location=src/app/layout.tsx:head-beacon&ts=${Date.now()}`}
        />
        {/* #endregion agent log */}
        <script
          // #region agent log
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var send=function(payload){try{fetch('/api/agent-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){});}catch(e){}};

  // Capture early hydration-related console errors
  try{
    var origErr=console.error;
    console.error=function(){
      try{
        var args=[].slice.call(arguments);
        var msg=args.map(function(a){try{return typeof a==='string'?a:JSON.stringify(a);}catch(e){return String(a);}}).join(' ');
        if(msg && (msg.indexOf('hydration')!==-1 || msg.indexOf('Hydration')!==-1 || msg.indexOf('didn\\'t match')!==-1 || msg.indexOf('did not match')!==-1)){
          send({sessionId:'fd44da',runId:'console',hypothesisId:'H17',location:'src/app/layout.tsx:consolePatch',message:'console.error hydration-related',data:{msg:msg.slice(0,2000)},timestamp:Date.now()});
        }
      }catch(e){}
      return origErr.apply(console, arguments);
    };
  }catch(e){}

  // Pre-hydration attribute snapshot (best-effort)
  var html=document.documentElement;var body=document.body;
  var htmlAttrs=html&&html.getAttributeNames?html.getAttributeNames():[];
  var bodyAttrs=body&&body.getAttributeNames?body.getAttributeNames():[];
  send({sessionId:'fd44da',runId:'preAttrs',hypothesisId:'H14',location:'src/app/layout.tsx:inline-head',message:'Pre-hydration html/body attribute names',data:{htmlAttrs:htmlAttrs,bodyAttrs:bodyAttrs},timestamp:Date.now()});
}catch(e){}})();`,
          }}
          // #endregion agent log
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* #region agent log */}
        {devServerStamp ? (
          <div
            data-agent-dev-stamp="true"
            data-pid={devServerStamp.pid}
            data-cwd={devServerStamp.cwd}
            style={{
              position: "fixed",
              bottom: 8,
              right: 8,
              zIndex: 2147483647,
              fontSize: 12,
              lineHeight: "16px",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              padding: "6px 8px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              maxWidth: 520,
              wordBreak: "break-word",
            }}
          >
            pid={devServerStamp.pid} cwd={devServerStamp.cwd}
          </div>
        ) : null}
        {/* #endregion agent log */}
        <HydrationDebugProbe />
        {children}
      </body>
    </html>
  );
}
