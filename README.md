# Open-in-Figma Sourcegraph extension

> This extension currently only supports Typescript files. 

This extension takes you from reading code to "viewing what that code file looks like" via Figma files. 

![demo](https://storage.googleapis.com/sourcegraph-assets/extensions/open-in-figma-demo.gif)

It helps you: 

- Answer quick questions about "how does this look?" or "where in the app is this?" – without needing to find the same page deployed somewhere
- Provide _visual_ context for the code you're reading
- View how pages are intended to look in cases when you cannot easily view the deployed code (due to necessary user configuration or permissions)
- Be happier, get more sleep, and pitch a 99mph fastball 

(It of course makes the assumption that your production user-facing code implements pages and designs that are also present in Figma.)

## How to use it

1. Enable the extension. 
2. Visit a typescript file that has user-facing components/text on it. 
3. Click the active extension icon button to be taken directly to Figma. 

## How it works 

The extension scans your typescript for "rich keywords," and then brings you to a Figma deep search page with the keywords already searched. 

(By bringing you to a search page rather than a single file page, you can see all the closest matches, lest the file you want not be the first match.) 

"Rich keywords" are the text in a typescript file that might be displayed to a user (and would appear in a Figma file), like on-page text or title/label/hover content. 

Then these keywords are processed using artificial intelligence to determine which are most likely to produce a Figma search string that brings you the right file(s). 

By "artificial intelligence," I mean that these keywords are filtered for duplicates and then sorted by length in decreasing order, since longer words roughly appear less often and are thus more likely to help narrow down the space of possible Figma file matches. 

### Configuration

Optionally, you can set a `"openInFigma.numMatchWords":` integer in your user settings to determine how many keywords to run a Figma search over, maximum. The default is 6. You may want to adjust it up if you have large text-heavy files or a large number of Figma files. You may want to adjust it down if you are getting "overfit" Figma searches returning no Figma files. You may want to adjust it for no reason other than you don't trust me. 

The minimum is 3 keywords found in a file in order to activate the extension. This is not yet configurable. Maybe it never will be. 

You are welcome to fork this extension or make a PR if you want to propose better sorting/filtering. 

## For in-file Figma Links

If you have actual Figma links in files you'd like to 1-click into, you should enable the [link preview expander](https://sourcegraph.com/extensions/sourcegraph/link-preview-expander) extension, which makes this easy and handles multiple Figma links per file. An actual Sourcegraph engineer built that and it's way cool. 
