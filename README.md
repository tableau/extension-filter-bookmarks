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
`yarn` to install

`yarn start` to run

`yarn build` to build

## Open source discrepancy notice
The source code found in this repository uses the Tableau UI components library. However, due to a bug in the current version of Qt used in Tableau Desktop, html selects do not allow for mouse selection on Mac and instead require the keyboard for selections. Because of this we will be using an alternative div dropdown in the production bundle until we are able to upgrade Qt.
