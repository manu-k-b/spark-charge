import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { user_id, action } = await req.json();

    if (!user_id || typeof user_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid user_id" }), { status: 400, headers: corsHeaders });
    }
    if (action !== "grant" && action !== "revoke") {
      return new Response(JSON.stringify({ error: "Action must be 'grant' or 'revoke'" }), { status: 400, headers: corsHeaders });
    }

    // Prevent self-revoke
    if (user_id === user.id && action === "revoke") {
      return new Response(JSON.stringify({ error: "Cannot revoke your own admin role" }), { status: 400, headers: corsHeaders });
    }

    if (action === "grant") {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
