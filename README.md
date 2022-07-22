# figma-icon-exporter
A tool to automatically download figma icons

## How to use it?
```
HELP:
yarn start file=<figma file id> container=<id of container which contains all icons (icons need to be components and direct children of container)> outputDir=<output directory>

To gain the figma file id, simply look at the url when opening the file:
https://www.figma.com/file/xxxxxxxxx/name-of-file
                              ↑ This  is the file id

To gain the container id, right click on the element and click on copy link. Inside of the link is a property called node-id. Thats your id.,
https://www.figma.com/file/xxxxxxxxx/name-of-file?node-id=xxxx
                                                           ↑ This is your id
```