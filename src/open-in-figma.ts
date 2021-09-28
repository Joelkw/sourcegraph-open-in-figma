import * as sourcegraph from 'sourcegraph'
import { from } from 'rxjs'
import { filter, switchMap } from 'rxjs/operators'
import * as stringSimilarity from 'string-similarity'

export function checkIsURL(maybeURL: string): boolean {
    try {
        const url = new URL(maybeURL)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Strips trailing comma or period from URL
 *
 * @param maybeURL Possible URL string
 */
export function cleanURL(maybeURL: string): string {
    return maybeURL.replace(/[,.]$/, '')
}

const numMatchWords = 6;

// NEXT: refactor loops to use promise.all() because you have to wait for them to execute
// Alternatively build a storage service

function getFigmaUrl(textDocumentUri: URL, editor: sourcegraph.ViewComponent): URL {
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
  const rawStringsPattern = /=?>\s*\w[-\w+\s,.]*\s*<((\w>)|(\w,))?/g
  const encodedStringsPattern = /[\s=]['"]\w+\s[A-Za-z]+\s\w+\s\w+[.,\s\w']*['"]/g
  var searchString = '';
  var cleanMatches = [];
  // this includes dots which we now need to strip, maybe? 
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

  // make lowercase, make unique, sort 



  console.log(searchString);

  searchString = encodeURIComponent(searchString).trim()
  const figmaUrl = "https://www.figma.com/files/search?model_type=files&q=" + searchString
  // console.log("hi!!\n");
  // const hardcodedSourcegraphString = "This is a doodley text file"
  // const PERSONAL_ACCESS_TOKEN = '184998-18bab379-276b-4fbf-836c-f712fe458b31';
  // var fileStringsDict = {};
  // // TODO probably don't need both these objects
  // var fileStrings = []; 
  // // we can assume the "team" is a configurable field in settings config so we get it
  // // hardcoded mine here for testing
  // function tryit(){ return fetch('https://api.figma.com/v1/teams/887741539104471731/projects', {
  //       method: 'GET',
  //       headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
  //   }).then(function(response) {
  //       console.log('\nhi');
  //       response.json().then(teamProjects => {
  //         // "iterate" through project files TODO – I have only one file right now  
  //         console.log(teamProjects.projects[1].id)
  //         // now fetch that project's files 
  //         fetch('https://api.figma.com/v1/projects/' +teamProjects.projects[1].id + '/files', {
  //           method: 'GET',
  //           headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
  //         }).then(function(response) {
  //           console.log('in files');
  //           response.json().then(projectFiles => {
  //             // 
  //             // FILE LOOP: this loops within files in a project
  //             //
  //             for (let j=0; j<projectFiles.files.length; j++) {
  //               var fileName = projectFiles.files[j].name;
  //               // https://api.figma.com/v1/files/:file_key/nodes
  //               var fileKey = projectFiles.files[j].key;
  //               console.log("iterating through objects for " + fileName + " " + fileKey);
  //               fetch('https://api.figma.com/v1/files/'+fileKey, {
  //                 method: 'GET',
  //                 headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
  //               }).then(function(response) {
  //                 response.json().then(fileNodes => {
  //                   // iterate through file nodes and grab all text nodes: 
  //                   const doc = fileNodes.document;
  //                   const canvas = doc.children[0];
  //                   //
  //                   // FILE OBJECTS LOOP: for each object in a file 
  //                   //
  //                   for (let i=0; i<canvas.children.length; i++) {
  //                     const child = canvas.children[i]
  //                     console.log(child);
  //                     // this is where we can do stuff with the file nodes
  //                     // here I am logging all the characters to do a match 
  //                     if (child.type === 'TEXT') {
  //                       console.log(child.characters); 
  //                       fileStrings.push(child.characters)
  //                       fileStringsDict[child.characters] = fileKey; 
  //                     }
  //                   } // end loop for canvas nodes
  //                 });
  //               });
  //             } // end loop for files within a project 
  //           });
  //       // test for similarity
  //       // this takes strings, but then we have to map strings back to the file identifier 
  //       // so we need a dictionary of strings + file identifier 
  //       console.log("calling a similarity function!");
  //       const similarity = stringSimilarity.findBestMatch(hardcodedSourcegraphString, fileStrings);
  //       console.log(similarity); 
  //       // this takes our best match and gets a file name back 
  //       console.log(fileStringsDict[similarity.bestMatch.target]);
  //       // TODO how to handle the case when the best match is too loW?? 

  //         }); // todo add catch here

  //       }); 
  //       ; 
  //       return true; // response.json();
  //   }).catch(function (error) {
  //       console.log(error); 
  //       return { err: error };
  //   });
  // };
  
  // tryit();
  console.log("got to 109")
  const openUrl = new URL(figmaUrl)
  console.log(openUrl)
  return openUrl 
}

export function activate(ctx: sourcegraph.ExtensionContext): void {
  console.log("acivated now!!!");
    if (sourcegraph.app.activeWindowChanges) {
      // TODO, I ripped this from the DD extension is it important? 
      // const activeEditor = from(sourcegraph.app.activeWindowChanges).pipe(
      //     filter((window): window is sourcegraph.Window => window !== undefined),
      //     switchMap(window => window.activeViewComponentChanges),
      //     filter((editor): editor is sourcegraph.CodeEditor => editor !== undefined)
      // )
      // // When the active editor changes, publish new decorations.
      // // ctx.subscriptions.add(activeEditor)
      ctx.subscriptions.add(
        sourcegraph.commands.registerCommand('openInFigma.openFigmaLink', async (uri?: string) => {
            // if (!uri) {
            //     const viewer = sourcegraph.app.activeWindow?.activeViewComponent
            //     uri = viewerUri(viewer)
            // }
            // if (!uri) {
            //     throw new Error('No file currently open')
            // }
            const activeEditor = () => sourcegraph.app.activeWindow && sourcegraph.app.activeWindow.activeViewComponent
            const editor = activeEditor()
            // some kind of check like this?  if (editor && editor.type === 'CodeEditor') { 0 
            const openUrl = getFigmaUrl(new URL("https://figma.com"), editor)
            console.log("hello out there!!");
            await sourcegraph.commands.executeCommand('open', openUrl.href)
        })
    )
  }
}

// TODO –– I don't understand why I need this yet... haha...
function viewerUri(viewer: sourcegraph.ViewComponent | undefined): string | undefined {
  switch (viewer?.type) {
      case 'CodeEditor':
          return viewer.document.uri
      case 'DirectoryViewer':
          return viewer.directory.uri.href
      default:
          return undefined
  }
}

// export function activate(context: sourcegraph.ExtensionContext): void {

//     context.subscriptions.add(
//         sourcegraph.languages.registerHoverProvider(['*'], {
//             provideHover: (doc, pos) => ({
//                 contents: {
//                     value: 'Hello world from joel open-in-figma! 🎉🎉🎉',
//                     kind: sourcegraph.MarkupKind.Markdown
//                 }
//             }),
//         })
//         //     provideHover(document, position) {
//         //       const PERSONAL_ACCESS_TOKEN = '184998-18bab379-276b-4fbf-836c-f712fe458b31';

//         //       // function apiRequest() {
//         //         return fetch('https://api.figma.com/v1/teams/887741539104471731/projects', {
//         //             method: 'GET',
//         //             headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
//         //         }).then(function(response) {
//         //             console.log('hi');
//         //             response.json().then(teamProjects => {
//         //               // "iterate" through project files TODO 
//         //               console.log(teamProjects.projects[1].id)
//         //               // now fetch that project's files 
//         //               fetch('https://api.figma.com/v1/projects/' +teamProjects.projects[1].id + '/files', {
//         //                 method: 'GET',
//         //                 headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
//         //               }).then(function(response) {
//         //                 console.log('in files');
//         //                 response.json().then(projectFiles => {
//         //                   var fileName = projectFiles.files[0].name;
//         //                   // https://api.figma.com/v1/files/:file_key/nodes
//         //                   var fileKey = projectFiles.files[0].key;
//         //                   fetch('https://api.figma.com/v1/files/'+fileKey, {
//         //                     method: 'GET',
//         //                     headers: { "x-figma-token": PERSONAL_ACCESS_TOKEN }
//         //                   }).then(function(response) {
//         //                     console.log('got file nodes');
//         //                     console.log(response.text());
//         //                   });
//         //                 });
//         //               }); // todo add catch here

//         //             }); 
//         //             console.log('logged project');
//         //             ; 
//         //             // console.log(response.json());
//         //             return true; // response.json();
//         //         }).catch(function (error) {
//         //             console.log(error); 
//         //             return { err: error };
//         //         });

//         //       // apiRequest();
//         //       // console.log("jk1");
//         //       //   const range = document.getWordRangeAtPosition(position)
//         //       //   const word = document.getText(range)
//         //       //   if (!word) {
//         //       //       return
//         //       //   }
//         //       //   console.log("jk2");

//         //       //   const maybeURL = cleanURL(word)

//         //       //   if (!checkIsURL(maybeURL)) {
//         //       //       return
//         //       //   }
//         //       //   console.log("jk3");
//         //       //   console.log(maybeURL);
//         //       //   console.log(range);
//         //         /**
//         //          * Creates the markdown string to be rendered in the hover tooltip.
//         //          */
//         //         // const createResult: (/*metadata?: Metadata*/) => sourcegraph.Badged<sourcegraph.Hover> /* = metadata*/ => {
//         //             // const { image, title, description } = metadata ?? {}

//         //             // let markdownContent = `#### [${title || maybeURL}](${maybeURL})\n\n`

//         //             // if (image || description) {
//         //             //     markdownContent += '---\n\n'

//         //             //     if (image) {
//         //             //         markdownContent += `<img height="64" src="${image}" align="left" style="padding-right: 4px;" />`
//         //             //     }

//         //             //     if (description) {
//         //             //         markdownContent += `\n\n${description ?? ''}`
//         //             //     }
//         //             // }

//         //             // return {
//         //             //     range,
//         //             //     contents: {
//         //             //         value: maybeURL,
//         //             //         kind: sourcegraph.MarkupKind.Markdown,
//         //             //     },
//         //             // }
//         //         // }

//         //         // yield link-only preview before trying to get metadata
//         //         // createResult()

//         //         // try {
//         //         //     const settings = sourcegraph.configuration.get<Settings>().value

//         //         //     const response = await fetch(
//         //         //         `${
//         //         //             settings['linkPreviewExpander.corsAnywhereUrl']?.replace(/\/$/, '') ??
//         //         //             'https://cors-anywhere.herokuapp.com'
//         //         //         }/${maybeURL}`,
//         //         //         { cache: 'force-cache' }
//         //         //     )
//         //         //     const htmlString = await response.text()

//         //         //     yield createResult(getMetadataFromHTMLString(htmlString))
//         //         // } catch {
//         //         //     // noop. already yielded link w/out metadata
//         //         // }
//         //     },
//         // })
        
        
        
       
//     )
// }

// Sourcegraph extension documentation: https://docs.sourcegraph.com/extensions/authoring
