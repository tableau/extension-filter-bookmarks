# Filter Bookmarks
This extension enables you to add a button directly into your dashboard that resets to certain filter settings. Great for embedded dashboards that do not have the toolbar showing or for a more intuitive interface.

## How to use an Extension
Download the Filter Bookmarks [manifest file](https://extensiongallery.tableau.com/products/29). Open Tableau Desktop 2018.2 or higher, drag in the "Extension" object to a dashboard. Click "My Extensions" and find the manifest file (.trex) you downloaded above.

# Using the Extension
1. Set your dashboard filters they way you want to be able to revert to.
2. Open the configuration window and click "Save Settings".
3. Optional: Customize your buttons label and colors.

Note: You can add as many instances of this extension as you like!

## How to install for local use
1. Make sure you have [Node.js](https://nodejs.org) and [Yarn](https://yarnpkg.com) installed. 
2. Clone or download and unzip this repository. Open the command line to the `extension-filter-bookmarks-master` folder and run `yarn` to install the node modules.
3. Edit the `homepage` in the `package.json` file to the server where you are going to host the extension. For example:
```
"homepage": "http://localhost:8080",
```
4. In the command line run `yarn build` to build the extension with the new homepage.
5. Copy the files in `docs` to your web server at the path you specified in Step 3.

## Support
If you have questions about the extension or found a bug please open a new [issue](https://github.com/tableau/extension-filter-bookmarks/issues).
