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
  const rawStringsPattern = />(\w+|\s)*</g
  console.log("got to 40 at " + Date.now())
  var matches = page.match(rawStringsPattern)
  console.log("got to 42 at " + Date.now())
  console.log("matches)");
  console.log(matches)
  var searchString = '';
  for (var i = 0; i < matches.length; i++) {
    matches[i] = matches[i].replace(/(<|>|\n)/gi, '').trim()
    if (matches[i] != "") {
      searchString += " " + matches[i] 
    }
  }
  console.log("filtered")
  console.log(matches)
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
