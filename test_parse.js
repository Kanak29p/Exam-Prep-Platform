import fs from 'fs';

const text = fs.readFileSync('questions.txt', 'utf8');

// Use a more robust approach to split the text.
// We can find all occurrences of '[\n' or '[\r\n' and the corresponding closing bracket.
let fullJson = [];
let startIndex = 0;

while (true) {
  startIndex = text.indexOf('[\r', startIndex) !== -1 ? text.indexOf('[\r', startIndex) : text.indexOf('[\n', startIndex);
  if (startIndex === -1) {
    startIndex = text.indexOf('[\r\n', startIndex);
  }
  if (startIndex === -1) break;
  
  // Find the end of this array
  // Wait, it might have nested arrays. 
  // Let's count brackets to find the matching closing bracket.
  let bracketCount = 0;
  let endIndex = -1;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '[') bracketCount++;
    else if (text[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const jsonStr = text.substring(startIndex, endIndex + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      console.log(`Parsed array of length ${parsed.length}`);
      fullJson = fullJson.concat(parsed);
    } catch (e) {
      console.error("Error parsing JSON block starting at index", startIndex);
      console.error(e.message);
      console.log("Snippet:", jsonStr.substring(0, 100) + "..." + jsonStr.substring(jsonStr.length - 100));
    }
    startIndex = endIndex + 1;
  } else {
    break;
  }
}
console.log(`Total questions: ${fullJson.length}`);
