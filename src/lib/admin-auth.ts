export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const KEY = "gp_admin";
const CODE_KEY = "gp_admin_code";

export function isAdminAuthed() {
  return sessionStorage.getItem(KEY) === "authenticated";
}
export function setAdminAuthed(v: boolean) {
  if (v) sessionStorage.setItem(KEY, "authenticated");
  else { sessionStorage.removeItem(KEY); sessionStorage.removeItem(CODE_KEY); }
}

export function setAdminCode(code: string) {
  sessionStorage.setItem(CODE_KEY, code);
}
export function getAdminCode(): string {
  return sessionStorage.getItem(CODE_KEY) ?? "";
}
