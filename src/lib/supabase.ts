import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vkjlzyzevveofjqymcro.supabase.co";

const supabaseKey = "sb_publishable_E8QxUR-C47fuvGEZdtWiwQ_Tkdkk8eI";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);