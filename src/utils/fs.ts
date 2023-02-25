import * as fs from "fs";

const DUMP_FOLDER_NAME = "dump";

export async function writeDump(fileName: string, data: any) {
	const filePath = `${DUMP_FOLDER_NAME}/${fileName}.json`;

	manageDumpFolder();

	fs.writeFile(filePath, JSON.stringify(data), (err) => {
		if (err != null) {
			throw err;
		}

		console.log(`File successfully written : ${filePath}`);
	});
}

function manageDumpFolder() {
	if (!fs.existsSync(DUMP_FOLDER_NAME)) {
		fs.mkdirSync(DUMP_FOLDER_NAME);
	}
}
