import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vkjlzyzevveofjqymcro.supabase.co";
const supabaseKey = "sb_publishable_E8QxUR-C47fuvGEZdtWiwQ_Tkdkk8eI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data: d1, error: e1 } = await supabase.from('questions').select('*').limit(1);
  console.log("questions:", e1 ? e1.message : d1);

  const { data: d2, error: e2 } = await supabase.from('question_details').select('*').limit(1);
  console.log("question_details:", e2 ? e2.message : d2);
}

checkTables();
