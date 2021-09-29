import * as sourcegraph from 'sourcegraph'
// import { from } from 'rxjs'
// import { filter, switchMap } from 'rxjs/operators'
// import * as stringSimilarity from 'string-similarity'

export function checkIsURL(maybeURL: string): boolean {
    try {
        const url = new URL(maybeURL)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

const numMatchWords = 6;

// function analyzePageforStrings 

function getFigmaUrl(textDocumentUri: URL, editor: sourcegraph.CodeEditor): URL {
  console.log("textDocumentUri");
  console.log(textDocumentUri);
  console.log("editor!");
  console.log(editor.document)
  // I want editor.document.text

  // TODO why is this throwing a type error I don't know, it works 
  var page = editor.document.text; 
  console.log("got to 38 at " + Date.now())
  // const rawStringsPattern = />(\w+|\s|[.])*</g
  // this one sort of works but leaves things out 
  // const rawStringsPattern = />([\w+\s])*</g
  // let's try this one - it'll get words on tnheir own lines
  // const rawStringsPattern = />\n[-\w+\s,.]*\n\s*</g
  const rawStringsPattern = /(=|Field)?>\s*\w[-\w+\s,.]*\s*<((\w>)|(\w,))?/g
  const encodedStringsPattern = /[\s=]['"]\w+\s[A-Za-z]+\s\w+\s\w+[.,\s\w']*['"]/g
  var searchString = '';
  var cleanMatches = [];
  // this includes dots which we now need to strip, maybe?
  // TODO check if page is defined  
  console.log("got to 40 at " + Date.now())
  var matches = page.match(rawStringsPattern)
  var backupMatches = page.match(encodedStringsPattern);
  console.log("got to 42 at " + Date.now())
  if (matches) {
    console.log("matches");
    console.log(matches)
    for (var i = 0; i < matches.length; i++) {
      // effectively delete these things that were ...=>new Map<type> in the code 
      matches[i].startsWith("=>") ? matches[i] = '' : matches[i];
      // delete things that were <Field>maven.repos</Field> type also 
      matches[i].startsWith("Field>") ? matches[i] = '' : matches[i];
      // to catch cases likes <something>new export type<p>
      // console.log('matches?');
      // console.log(/<\w>$/.test(matches[i]));
      /<\w(>|,)$/.test(matches[i]) ? matches[i] = '' : matches[i];
      matches[i] = matches[i].replace(/(<|>|\n)/gi, '').trim()
      // filter out empty strings
      if (matches[i] != "") {
        // searchString += " " + matches[i] 
        cleanMatches.push(matches[i])
      }
    }
    console.log("filtered")
    console.log(matches)
  }
  // TODO decide when to use backup matches, maybe only when clean matches has nothing? 
  // 
  // TODO rename this to paremeterMatches or something 
  if (backupMatches) {
    // filter backup matches also, like title="This page title is cool" type text
    for (var i = 0; i < backupMatches.length; i++) {
      backupMatches[i].startsWith("=") ? 
        backupMatches[i] = backupMatches[i].substring(1,backupMatches[i].length) : backupMatches[i];
      // might have whitespace, then trim the quotes we know are there because regex
      backupMatches[i] = (backupMatches[i].trim()).substring(1, backupMatches[i].length-1)
      cleanMatches.push(backupMatches[i])
    }
    console.log("backupmatches filtered: ");
    console.log(backupMatches)
  }
  // TODO consider making backupmatches/matches new objects after filtered sooner
  // TODO definitely some redundant loops here 
  var matchWords: string[] = []; 
  if (cleanMatches) {
    for (var i = 0; i < cleanMatches.length; i++) {
      // add all the words
      matchWords = matchWords.concat(cleanMatches[i].split(" "));
    }
  }

  console.log("matchWords!");
  console.log(matchWords)

  // TODO there's no way the correct code has this many loops
  // but it's a hackathon so we'll come back to it after we prove
  // this out 
  if (matchWords) {
    // lower case it 
    for (var i = 0; i < matchWords.length; i++) {
      matchWords[i] = matchWords[i].toLowerCase()
    }
    // uniqueness
    var matchWordsSet = new Set(matchWords);
    // sort longest to shortest
    matchWords = [...matchWordsSet].sort((a,b) => {return b.length-a.length})
    console.log("matchWordsclean!")
    console.log(matchWords);

    for (var i = 0; i < numMatchWords; i++) {
      if (matchWords[i]) {
        searchString += " " + matchWords[i] 
      }
    }
  }

  console.log(searchString);

  searchString = encodeURIComponent(searchString).trim()
  const figmaUrl = "https://www.figma.com/files/search?model_type=files&q=" + searchString
  
  console.log("got to 109")
  const openUrl = new URL(figmaUrl)
  console.log(openUrl)
  return openUrl 
}

export function activate(ctx: sourcegraph.ExtensionContext): void {
  let anyStrings = false
  // sourcegraph.internal.updateContext({
  //         [`openInFigma.anyStrings`]: anyStrings,
  // });
  // anyStrings = true;
  // setTimeout(() => {
  //   sourcegraph.internal.updateContext({
  //     [`openInFigma.anyStrings`]: anyStrings,
  // });
  // }, 5000)
  // so we want to run the figma analysis on the page and determine if the button should be active
    
  console.log("acivated now!!!");
    // if (sourcegraph.app.activeWindowChanges) {
      // TODO, I ripped this from the DD extension is it important? 
      // const activeEditor = from(sourcegraph.app.activeWindowChanges).pipe(
      //     filter((window): window is sourcegraph.Window => window !== undefined),
      //     switchMap(window => window.activeViewComponentChanges),
      //     filter((editor): editor is sourcegraph.CodeEditor => editor !== undefined)
      // )
      // // When the active editor changes, publish new decorations.
      // // ctx.subscriptions.add(activeEditor)
      ctx.subscriptions.add(
        sourcegraph.commands.registerCommand('openInFigma.openFigmaLink', async () => {
            // if (!uri) {
            //     const viewer = sourcegraph.app.activeWindow?.activeViewComponent
            //     uri = viewerUri(viewer)
            // }
            // if (!uri) {
            //     throw new Error('No file currently open')
            // }
            const activeEditor = () => sourcegraph.app.activeWindow && sourcegraph.app.activeWindow.activeViewComponent
            const editor = activeEditor()
            // some kind of check like this?  
            console.log("editor:");
            console.log(editor);
            if (editor && editor.type === 'CodeEditor') {  
              const openUrl = getFigmaUrl(new URL("https://figma.com"), editor)
              console.log("hello out there!!");
              await sourcegraph.commands.executeCommand('open', openUrl.href)
            }
            // return void 0
        })
      )
        // sourcegraph.internal.updateContext({
        //   [`openInFigma.file.${textDocument.uri}.strings`]: true,
        // })

  // }
}