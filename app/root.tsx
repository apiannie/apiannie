// root.tsx
import {
  ChakraProvider,
  cookieStorageManagerSSR,
  localStorageManager,
  useConst,
} from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";
import { json, LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node"; // Depends on the runtime you choose
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import React, { useContext, useEffect } from "react";
import { ClientStyleContext, ServerStyleContext } from "./context";
import { getUser } from "./session.server";

// Typescript
// This will return cookies
export const loader = async ({ request }: LoaderArgs) => {
  // first time users will not have any cookies and you may not return
  // undefined here, hence ?? is necessary
  let user = await getUser(request);
  return json({
    cookies: request.headers.get("cookie") ?? "",
    user: { ...user },
  });
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Api Annie",
  viewport: "width=device-width,initial-scale=1",
});

export let links: LinksFunction = () => {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com" },
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
    },
  ];
};

interface DocumentProps {
  children: React.ReactNode;
}

const Document = withEmotionCache(
  ({ children }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData?.reset();
    }, []);

    return (
      <html lang="en">
        <head>
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(" ")}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }
);

export default function App() {
  const { cookies } = useLoaderData<typeof loader>();
  const cookieManager = useConst(cookieStorageManagerSSR(cookies));
  return (
    <Document>
      <ChakraProvider
        colorModeManager={
          typeof cookies === "string" ? cookieManager : localStorageManager
        }
      >
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}
