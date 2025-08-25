const crypto = require('crypto')

const t = {
  gameLink: {
    'fi': 'https://yle.fi/a/74-20131998',
    'sv': 'https://yle.fi/a/7-10074645',
  },
  resultWithButtons: {
    'fi': 'Siivottu versio',
    'sv': 'Städad version',
  },
  resultWithoutButtons: {
    'fi': 'Ilman nappeja',
    'sv': 'Utan knappar',
  },
  playButton: {
    'fi': 'Pelaa',
    'sv': 'Spela',
  },
  shareButton: {
    'fi': 'Jaa oma tulos',
    'sv': 'Dela ditt resultat',
  },
}

async function main(args) {
  // Parse the user's input (Sanapyramidi results, hopefully)
  const inlineQuery = args.inline_query
  let inputText = inlineQuery.query

  const lang = inputText.includes(t.gameLink.sv) ? 'sv' : 'fi'

  // Sometimes, the results are pasted on just one line
  if (inputText.split('\n').length <= 1) {
    // Add the line breaks manually
    inputText = inputText
      .replaceAll(/ :/g, '\n:') // result lines
      .replace(/: /, ':\n\n') // last result line
      .replace(/ Pelaa itse.*/, '') // link part
  }
  // Only keep lines without any letters
  const noAlphabetsRegex = /^[^a-zA-Z]*$/
  const resultLineRegex = /^[0-9]\/[0-9]/
  const outputText = inputText
    .split('\n')
    .filter(line => noAlphabetsRegex.test(line) || resultLineRegex.test(line))
    .join('\n')
    .trim()

  // Send the results as a response to the webhook invocation
  return {
    statusCode: 200,
    body: {
      method: 'answerInlineQuery',
      inline_query_id: inlineQuery.id ?? null,
      // Maximum caching time in seconds:
      cache_time: 60*60*24, // 1 day
      // Render two result "articles" for the user
      results: [{ withButtons: true }, { withButtons: false }]
        .map(result => ({
          type: 'article',
          id: crypto.randomUUID(),
          title: result.withButtons
            ? t.resultWithButtons[lang] + ' 🧽'
            : t.resultWithoutButtons[lang] + ' 🔤',
          description: outputText,
          // Content of the message that will be sent after clicking the article
          input_message_content: { 'message_text': outputText },
          // These buttons will be shown in the message which is sent after the user clicks the article.
          // The first article produces buttons, the second does not (undefined = `reply_markup` is not included).
          reply_markup: result.withButtons ? {
            inline_keyboard: [
              [{
                text: t.playButton[lang],
                url: t.gameLink[lang],
              }],
              [{
                text: t.shareButton[lang],
                switch_inline_query_current_chat: '',
              }]
            ]
          } : undefined,
        })),
    },
  }
}

// Function for debugging since console.log cannot be read
async function log(args) {
  await fetch('<insert debugging server url here>', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args)
  })
}
