import { ProjectUserRole } from "@prisma/client";
import { json } from "@remix-run/node";
import { useMatches } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "~/models/user.server";

export * from "./hooks";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}

export function useUrl() {
  let matches = useMatches();
  let [url, setUrl] = useState(new URL(matches[0].data.url as string));
  let href = typeof document === "undefined" ? undefined : window.location.href;
  useEffect(() => {
    if (href) {
      setUrl(new URL(href));
    }
  }, [href]);
  return url;
}

export const httpResponse = {
  OK: new Response("OK", { status: 200 }),
  BadRequest: new Response("Bad Request", { status: 400 }),
  Forbidden: new Response("Forbidden", { status: 403 }),
  NotFound: new Response("Not Found", { status: 404 }),
};

export const methodContainsBody = (method: string) => {
  return (
    method === "POST" ||
    method === "DELETE" ||
    method === "PUT" ||
    method === "PATCH"
  );
};

export const parsePath = (path: string) => {
  let params = [] as string[];
  let val = path;
  if (!val.startsWith("/")) {
    val = "/" + val;
  }
  let url = new URL("http://localhost" + val);
  val = url.pathname;
  val = encodeURI(val);

  let encodedPath = val.replace(/%257B(.+?)%257D/g, (str, match) => {
    if (params.indexOf(match) === -1) {
      params.push(match);
    }
    return `{${match}}`;
  });

  return { params, encodedPath };
};

export const checkRole = (
  userRole: ProjectUserRole,
  requiredRole: ProjectUserRole
) => {
  let roles = [
    ProjectUserRole.READ,
    ProjectUserRole.WRITE,
    ProjectUserRole.ADMIN,
  ];

  return roles.indexOf(userRole) >= roles.indexOf(requiredRole);
};
