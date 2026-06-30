import { supabase } from "@/integrations/supabase/client";
import { getAdminCode } from "./admin-auth";

export interface AdminApiResult<T = any> {
  data?: T;
  error?: string;
  ok?: boolean;
}

export async function adminApi<T = any>(op: string, data?: unknown, codeOverride?: string): Promise<AdminApiResult<T>> {
  const code = codeOverride ?? getAdminCode();
  if (!code) return { error: "no_admin_code" };
  const { data: res, error } = await supabase.functions.invoke("admin-api", {
    body: { code, op, data },
  });
  if (error) return { error: error.message };
  if (res?.error) return { error: res.error };
  return res as AdminApiResult<T>;
}
