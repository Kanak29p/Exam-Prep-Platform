import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vkjlzyzevveofjqymcro.supabase.co";
const supabaseKey = "sb_publishable_E8QxUR-C47fuvGEZdtWiwQ_Tkdkk8eI";
// If there's a service role key in .env, we could use it, but let's try with the publishable key first.
// Wait, we need the Service Role Key to bypass RLS, or maybe the public key works if RLS is disabled.
const supabase = createClient(supabaseUrl, supabaseKey);

const text = fs.readFileSync('questions.txt', 'utf8');

let fullJson = [];
let i = 0;
while (i < text.length) {
  // Find next '[' that starts at the beginning of a line
  const startBracket = text.indexOf('\n[', i);
  if (startBracket === -1) {
    // try finding '[' at index 0
    if (i === 0 && text.startsWith('[')) {
      // found at start
    } else {
      break;
    }
  }
  
  let startIndex = startBracket === -1 ? 0 : startBracket + 1;
  let bracketCount = 0;
  let endIndex = -1;
  
  for (let j = startIndex; j < text.length; j++) {
    if (text[j] === '[') bracketCount++;
    else if (text[j] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIndex = j;
        break;
      }
    }
  }
  
  if (endIndex !== -1) {
    const jsonStr = text.substring(startIndex, endIndex + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      fullJson = fullJson.concat(parsed);
    } catch (e) {
      console.error("Error parsing block at", startIndex);
    }
    i = endIndex + 1;
  } else {
    break;
  }
}

console.log(`Successfully extracted ${fullJson.length} questions.`);

async function upload() {
  if (fullJson.length === 0) return;
  
  // Try to delete existing records
  console.log("Attempting to delete existing questions...");
  const { error: delErr } = await supabase.from('question_details').delete().neq('id', 0);
  if (delErr) {
    console.error("Delete failed:", delErr.message);
  } else {
    console.log("Deleted existing questions.");
  }
  
  // Insert new records in batches
  const batchSize = 100;
  for (let i = 0; i < fullJson.length; i += batchSize) {
    const batch = fullJson.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('question_details').insert(batch);
    if (insErr) {
      console.error(`Insert failed for batch ${i/batchSize}:`, insErr.message);
    } else {
      console.log(`Inserted batch ${i/batchSize} (${batch.length} items).`);
    }
  }
  console.log("Upload complete.");
}

upload();
