import { redirect } from "next/navigation";

/**
 * Connections module was removed per client request — only Tension, Compression,
 * Bending, and Shear remain. Direct URL access is sent home so nothing 404s.
 */
export default function ConnectionsRemovedPage() {
  redirect("/");
}
