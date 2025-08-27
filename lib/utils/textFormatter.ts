/**
 * Text formatting utilities for brand descriptions and other content
 */

/**
 * Remove contractions from text to make it more formal and professional
 * This is useful for brand descriptions, product descriptions, etc.
 */
export function removeContractions(text: string): string {
  if (!text) return text;

  const contractions: Record<string, string> = {
    // Common contractions
    "isn't": "is not",
    "it's": "it is",
    "don't": "do not",
    "doesn't": "does not",
    "won't": "will not",
    "can't": "cannot",
    "couldn't": "could not",
    "wouldn't": "would not",
    "shouldn't": "should not",
    "hasn't": "has not",
    "haven't": "have not",
    "hadn't": "had not",
    "wasn't": "was not",
    "weren't": "were not",
    "didn't": "did not",
    "mightn't": "might not",
    "mustn't": "must not",
    "shan't": "shall not",
    "ain't": "am not",
    "aren't": "are not",
    
    // Possessive contractions
    "you're": "you are",
    "they're": "they are",
    "we're": "we are",
    "he's": "he is",
    "she's": "she is",
    "who's": "who is",
    "what's": "what is",
    "where's": "where is",
    "when's": "when is",
    "why's": "why is",
    "how's": "how is",
    
    // Other common contractions
    "let's": "let us",
    "that's": "that is",
    "there's": "there is",
    "here's": "here is",
    "y'all": "you all",
    "gonna": "going to",
    "wanna": "want to",
    "gotta": "got to",
    "lemme": "let me",
    "gimme": "give me",
    "kinda": "kind of",
    "sorta": "sort of",
    "outta": "out of",
    "lotsa": "lots of",
    "cuppa": "cup of",
    "dunno": "do not know",
    "gimme": "give me",
    "gotcha": "got you",
    "howdy": "how do you do",
    "innit": "is it not",
    "kinda": "kind of",
    "lemme": "let me",
    "nope": "no",
    "sorta": "sort of",
    "yep": "yes",
    "yup": "yes",
  };

  let formattedText = text;

  // Replace contractions with their full forms
  Object.entries(contractions).forEach(([contraction, fullForm]) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    formattedText = formattedText.replace(regex, fullForm);
  });

  return formattedText;
}

/**
 * Format brand description to be more professional
 * - Removes contractions
 * - Ensures proper capitalization
 * - Adds proper spacing
 */
export function formatBrandDescription(description: string | undefined): string {
  if (!description) return "";

  let formatted = description;

  // Remove contractions
  formatted = removeContractions(formatted);

  // Ensure proper spacing around punctuation
  formatted = formatted
    .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentence endings
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();

  return formatted;
}

/**
 * Clean up text for professional display
 * - Removes contractions
 * - Ensures proper formatting
 * - Makes text more formal
 */
export function professionalizeText(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Remove contractions
  cleaned = removeContractions(cleaned);

  // Ensure proper sentence structure
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => 
      `${punct} ${letter.toUpperCase()}`
    ) // Capitalize after punctuation
    .trim();

  return cleaned;
}
