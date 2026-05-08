import { redirect } from "next/navigation";

/**
 * Combined module was removed per client request — only Tension, Compression,
 * Bending, and Shear remain. Direct URL access is sent home so nothing 404s.
 */
export default function CombinedRemovedPage() {
  redirect("/");
}
