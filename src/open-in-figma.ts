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
const numMinMatches = 3;

function getMeaningfulStrings(editor: sourcegraph.CodeEditor): string[] {

  // TODO why is this throwing a type error I don't know, it works 
  if (editor.document.uri && /test\./.test(editor.document.uri)) {
    // then it's a test file so return empty 
    console.log("test file!");
    return [];
  }

  var page = editor.document.text; 
  // const rawStringsPattern = />(\w+|\s|[.])*</g
  // this one sort of works but leaves things out 
  // const rawStringsPattern = />([\w+\s])*</g
  // let's try this one - it'll get words on tnheir own lines
  // const rawStringsPattern = />\n[-\w+\s,.]*\n\s*</g 
  // the last term of this regex removes a, b, i, and u html tags so we treat that as normal text
  // but otherwise catches typescript stuff 
  const rawStringsPattern = /(=|Field)?>\s*\w[-\w+\s,.]*\s*<((\w>)|(\w,)|(\w\[)|([c-hj-z] ))?/g
  const encodedStringsPattern = /[\s=]['"]\w+\s[A-Za-z]+\s\w+\s\w+[.,\s\w']*['"]/g
  var cleanMatches = [];

  if (page) {
    var matches = page.match(rawStringsPattern)
    var backupMatches = page.match(encodedStringsPattern);
    // console.log("got to 42 at " + Date.now())
    if (matches) {
      // console.log("matches");
      // console.log(matches)
      for (var i = 0; i < matches.length; i++) {
        // effectively delete these things that were ...=>new Map<type> in the code 
        matches[i].startsWith("=>") ? matches[i] = '' : matches[i];
        // delete things that were <Field>maven.repos</Field> type also 
        matches[i].startsWith("Field>") ? matches[i] = '' : matches[i];
        // to catch cases likes <something>new export type<p>
        // console.log('matches?');
        // console.log(/<\w>$/.test(matches[i]));
        /<\w(>|\[|,| )$/.test(matches[i]) ? matches[i] = '' : matches[i];
        matches[i] = matches[i].replace(/(<|>|\n)/gi, '').trim()
        // filter out empty strings
        if (matches[i] != "") {
          // searchString += " " + matches[i] 
          cleanMatches.push(matches[i])
        }
      }
      // console.log("filtered")
      // console.log(matches)
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
      // console.log("backupmatches filtered: ");
      // console.log(backupMatches)
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

    // console.log("matchWords!");
    // console.log(matchWords)

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
      // console.log("matchWordsclean!")
      // console.log(matchWords);
      return matchWords;
    }
  }
  return []
}

function getFigmaSearchUrl(matchWords: string[]): URL {
  // we log here because it only happens on button press, so
  // it doesn't clutter, but helps debugging
  console.log("given the matchWords of:")
  console.log(matchWords)
  var searchString = '';
  for (var i = 0; i < numMatchWords; i++) {
    if (matchWords[i]) {
      searchString += " " + matchWords[i] 
    }
  }
  console.log(searchString);
  searchString = encodeURIComponent(searchString).trim()
  const figmaUrl = "https://www.figma.com/files/search?model_type=files&q=" + searchString
  const openUrl = new URL(figmaUrl)
  console.log(openUrl)
  return openUrl 
}

export function activate(ctx: sourcegraph.ExtensionContext): void {

  // TODO: it would be cool to run match words only once but I'm not sure how 
  // to get an active editor to get the file outside of either the button or the changes 
  
  // this determines if we have strings on the page to search in figma 
  ctx.subscriptions.add(
    sourcegraph.app.activeWindowChanges.subscribe(activeWindow => {
      const subscription = activeWindow?.activeViewComponentChanges.subscribe(viewComponent => {
          if (!!viewComponent && viewComponent.type === 'CodeEditor') {
              // console.log("viewComponent");
              // console.log(viewComponent)
              const matchWords = getMeaningfulStrings(viewComponent)
                // set to true if match words exists 
              sourcegraph.internal.updateContext({
                [`openInFigma.anyStrings`]: matchWords.length > numMinMatches,
              });
          }
      })
      // do I know why this below exists/it seems to be a circular loop? heck yeah whatever. 
      // copied from another extension codebase 
      if (subscription) {
          ctx.subscriptions.add(subscription)
      }
    })
  )
  
  // console.log("activated now!!!");
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
            // console.log("editor:");
            // console.log(editor);
            if (editor && editor.type === 'CodeEditor') {  
              const matchWords = getMeaningfulStrings(editor)
              // set to true if match word
             
              const openUrl = getFigmaSearchUrl(matchWords)
              // console.log("hello out there!!");
              await sourcegraph.commands.executeCommand('open', openUrl.href)
            }
            // return void 0
        })
      )

  // }
}