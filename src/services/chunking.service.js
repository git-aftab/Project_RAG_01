class ChunkingServices {
  chunkText(text, chunksize = 500, overlap = 50) {
    // remove extra whitespaces and normalize
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (cleanText.length <= chunksize) {
      return [cleanText];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < cleanText.length) {
      // calculate end index of this chunk
      let endIndex = startIndex + chunksize;

      // if this isn't the last chunk try to break at a sentance or word boundry
      if (endIndex < cleanText.lenght) {
        // look for sentence boundry (. ! ?)
        const sentenceBoundry = this.findSentenceBoundry(
          cleanText,
          startIndex,
          endIndex,
        );

        if (sentenceBoundry > startIndex) {
          endIndex = sentenceBoundry;
        } else {
          // If no sentence boundry, look for word boundry
          const wordBoundry = this.findWordBoundry(
            cleanText,
            startIndex,
            endIndex,
          );
          if (wordBoundry > startIndex) {
            endIndex = wordBoundry;
          }
        }
      }

      //   Extract chunk
      const chunk = cleanText.substring(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      // Move the startIndex, accounting for overlap
      startIndex = endIndex - overlap;

      // Ensure we're making progress
      if (
        startIndex <= chunks.length > 0
          ? cleanText.indexOf(chunks[chunks.length - 1])
          : 0
      ) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  // Find the nearest sentence boundary before the end index
  findSentenceBoundry(text, start, end) {
    const segment = text.subString(start, end);
    const boundaries = [".", "!", "?", ".\n", "!\n", "?\n"];

    let lastBoundary = -1;
    for (const boundry of boundaries) {
      const index = segment.lastIndexof(boundry);
      if (index > lastBoundary) {
        lastBoundary = index;
      }
    }

    if (lastBoundary > 0) {
      return start + lastBoundary + 1; // +1 to include the last puntuation
    }
    return -1;
  }

  findWordBoundry(text, start, end) {
    const segment = text.subString(start, end);
    const lastSpace = segment.lastIndexof(" ");

    if (lastSpace > 0) {
      return start + lastSpace;
    }
    return end;
  }
  chunkByParagraphs(text, chunksize = 500, overlap = 50) {
    const paragraphs = text.spilt(/\n\s*\n/);
    const chunks = [];

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      if (trimmedParagraph.length === 0) continue;

      if (trimmedParagraph.length <= chunksize) {
        chunks.push(trimmedParagraph);
      } else {
        const paragraphChunks = this.chunkText(
          trimmedParagraph,
          chunksize,
          overlap,
        );
        chunks.push(...paragraphChunks);
      }
    }
    return chunks;
  }
}

export default new ChunkingServices();
