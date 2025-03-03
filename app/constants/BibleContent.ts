// Sample Bible content - in a real app, this would come from an API or local database
export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleContent {
  [book: string]: {
    [chapter: string]: BibleVerse[];
  };
}

// This is just a sample for development purposes
// The actual content is now provided by the BibleApiService
export const SAMPLE_BIBLE_CONTENT: BibleContent = {
  "Genesis": {
    "1": [
      { verse: 1, text: "In the beginning God created the heavens and the earth." },
      { verse: 2, text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters." },
      { verse: 3, text: "And God said, \"Let there be light,\" and there was light." },
      { verse: 4, text: "God saw that the light was good, and he separated the light from the darkness." },
      { verse: 5, text: "God called the light \"day,\" and the darkness he called \"night.\" And there was evening, and there was morning—the first day." },
      // More verses would be here
    ]
  },
  "Psalms": {
    "40": [
      { verse: 1, text: "I waited patiently for the LORD; he turned to me and heard my cry." },
      { verse: 2, text: "He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock and gave me a firm place to stand." },
      { verse: 3, text: "He put a new song in my mouth, a hymn of praise to our God. Many will see and fear the LORD and put their trust in him." },
      { verse: 4, text: "Blessed is the one who trusts in the LORD, who does not look to the proud, to those who turn aside to false gods." },
      { verse: 5, text: "Many, LORD my God, are the wonders you have done, the things you planned for us. None can compare with you; were I to speak and tell of your deeds, they would be too many to declare." },
      // More verses would be here
    ]
  },
  "John": {
    "1": [
      { verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
      { verse: 2, text: "He was with God in the beginning." },
      { verse: 3, text: "Through him all things were made; without him nothing was made that has been made." },
      { verse: 4, text: "In him was life, and that life was the light of all mankind." },
      { verse: 5, text: "The light shines in the darkness, and the darkness has not overcome it." },
      // More verses would be here
    ]
  }
};

// Get the number of chapters for a given book
export const getChapterCount = (book: string): number => {
  // This would be replaced with actual data in a real implementation
  const chapterCounts: {[key: string]: number} = {
    'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
    'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
    '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
    'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
    'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
    'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14,
    'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3,
    'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
    'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
    'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6,
    'Ephesians': 6, 'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5,
    '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
    'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
    '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
  };
  return chapterCounts[book] || 1;
}; 