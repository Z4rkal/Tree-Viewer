### Project Description

This project is a web-based skill tree viewer for [Path of Exile](https://www.pathofexile.com/game) similar to the [official one](https://www.pathofexile.com/passive-skill-tree) on GGG's \(Grinding Gear Games\) own site.

I built this project partially as a way for me to teach myself how to work with HTML5 canvases, and partially in the hopes of someday building it out into a web-based alternative to [@Openarl's](https://github.com/Openarl) [Path of Building](https://github.com/Openarl/PathOfBuilding), which has been and will probably continue to be the community's most popular build planning tool due to the incredible amount of work put into it.

#
### Current Functionality

At this point the project functions pretty much like those familiar with the game and similar tools will expect: 

The skill tree is displayed on a big canvas that you can drag around and zoom in/out with your mouse.

You can hover over nodes to see information about them, and clicking on a node will allocate or deallocate it.

If you hover over a node that isn't connected to your current tree, the shortest path to it will display, and the hover tooltip will tell you the number of points it would take to allocate it.

Clicking on a distant node will allocate all the nodes on the shortest path, and clicking on a node you've already taken will deallocate it and then deallocate any nodes that would be left hanging by the deallocation of that node if any.

Hitting `ctrl+z` or `command+z` will undo an action, and hitting `ctrl+shift+z` or `command+shift+z` will redo an action.

The number of passive points and ascendancy points in use are displayed at the top of the page, and to the right of them there are dropdowns that let you select your class and ascendancy.

Note: Currently Ascendant is a little wierd, as I haven't done anything with multiple choice nodes

At the bottom of the page there's a field where you can paste in a URL \(Or the base 64 string at the end of it\) from the [official site](https://www.pathofexile.com/passive-skill-tree) and click the `import` button next to it to load a skill tree.

To the right of that, there's a button labeled `export` that you can click to export the current tree as a base 64 string like so:

![Example Screenshot](/screenshots/ExportExample.png?raw=true)

You can use this string to copy your tree to the official site or other community tools. On the official site you simply need to put the string after `https://www.pathofexile.com/passive-skill-tree/` in the URL.

Currently the web page automatically saves the current tree to your cookies before the page closes, and then checks to see if that cookie exists to load the stored tree when it the web page is opened again, but I plan on changing it to a manual save button soon.

#
### Setup

If you'd like to run the project on your own machine and play around with it or even build off of it, you can clone the repository from your command line with:

`git clone https://github.com/Z4rkal/Tree-Viewer`

You'll need to have NodeJS installed and Node Package Manager; once you do, run `npm install` in the project directory to download the dependencies, and then run `npm run build && npm start` to build and launch the project.

The server will listen on port 3000, so you can access the web app in your browser at `http://localhost:3000`.

Alternatively, the app is hosted on [Heroku](https://of-tree-viewer.herokuapp.com/) if you want to take a look at it.
