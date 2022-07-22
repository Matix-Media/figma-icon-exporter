import axios, { AxiosError } from "axios";
import argsParser from "args-parser";
import { access, mkdir, writeFile } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import sanitize from "sanitize-filename";
import cliProgress from "cli-progress";

(async () => {
    const args: { [key: string]: any } = argsParser(process.argv);

    if (!("file" in args) || !("container" in args) || !("outputDir" in args)) {
        console.error("HELP:");
        console.error(
            "file=<figma file id> container=<id of container which contains all icons (icons need to be components and direct children of container)> outputDir=<output directory>",
        );
        console.error();
        console.error("To gain the figma file id, simply look at the url when opening the file:");
        console.error("https://www.figma.com/file/xxxxxxxxx/name-of-file");
        console.error("                              ↑ This  is the file id");
        console.error();
        console.error(
            "To gain the container id, right click on the element and click on copy link. Inside of the link is a property called node-id. Thats your id.",
        );
        console.error("https://www.figma.com/file/xxxxxxxxx/name-of-file?node-id=xxxx");
        console.error("                                                           ↑ This is your id");
        process.exit(1);
    }
    const fileId: string = args.file;
    const containerId: string = args.container;
    const outputDir: string = args.outputDir;
    const apiKey = "figd_t0XIKv7Q86S5MKOjytdEAvTD0tOWHLyB_XKCjKaw";

    console.log("Getting figma file...");
    let file: any;
    try {
        file = (await axios.get("https://api.figma.com/v1/files/" + fileId + "/", { headers: { "X-FIGMA-TOKEN": apiKey } })).data;
    } catch (err) {
        if (err instanceof AxiosError) {
            const error: AxiosError = err;
            if (error.response.status == 404) {
                console.log("Could not find the specified file.");
            }
        }
        console.error(err.message);
        process.exit(1);
    }

    console.log("Locating container...");

    const nodes = [];
    let i = 0;
    let containerNode: any;
    nodes.push(file.document);
    while (true) {
        if (nodes.length < i) break;
        const node = nodes[i];
        if (node.id == containerId) {
            containerNode = node;
            break;
        }

        nodes.push(...node.children);
        i++;
    }

    if (containerNode == null) {
        console.error("Could not find the specified container.");
        process.exit(1);
    }

    const iconNodes = [];
    for (const node of containerNode.children) {
        if (node.type !== "COMPONENT") continue;
        iconNodes.push(node);
    }

    console.log("Getting download links...");
    const progressBar = new cliProgress.SingleBar(
        {
            format: "{bar} {percentage}% | File: {filename}",
        },
        cliProgress.Presets.shades_grey,
    );
    const downloadLinks = (
        await axios.get("https://api.figma.com/v1/images/" + fileId + "/?format=svg&ids=" + encodeURI(iconNodes.map((n) => n.id).join(",")), {
            headers: { "X-FIGMA-TOKEN": apiKey },
        })
    ).data;

    try {
        await access(outputDir);
    } catch {
        await mkdir(outputDir);
    }

    console.log("Downloading icons...");
    progressBar.start(downloadLinks.images.length, 0);
    i = 0;
    for (const id in downloadLinks.images) {
        const iconNode = iconNodes.find((n) => n.id == id);
        progressBar.update(i, { filename: iconNode.name });
        const downloadLink = downloadLinks.images[id];
        const localFilename = path.join(outputDir, sanitize(iconNode.name, { replacement: "_" }) + ".svg");
        let res: string = (await axios.get(downloadLink)).data;
        res = res.replace(/(width|height)="[0-9]*"/gm, "");
        res = res.replace(/fill="((?!none)[0-9a-zA-z _\.\-:]*)"/gm, 'fill="currentColor"');
        await writeFile(localFilename, res);
        i++;
    }

    console.log("Done.");
})();
