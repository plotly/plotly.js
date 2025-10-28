import fs from 'fs';
import path from 'path';
import constants from '../tasks/util/constants.js';

function readFilePromise(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, { encoding: 'utf-8' }, (err, contents) => {
            if (err) reject(err);
            else resolve({ name: file, contents: contents });
        });
    });
}

function writeFilePromise(path, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, contents, (err) => {
            if (err) reject(err);
            else resolve(path);
        });
    });
}

export function getMockFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(constants.pathToTestImageMocks, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

export function readFiles(files) {
    const promises = files.map((file) => readFilePromise(path.join(constants.pathToTestImageMocks, file)));

    return Promise.all(promises);
}

export function createMocksList(files) {
    // eliminate pollutants (e.g .DS_Store) that can accumulate in the mock directory
    const jsonFiles = files.filter((file) => file.name.substr(-5) === '.json');

    const mocksList = jsonFiles.map((file) => {
        const contents = JSON.parse(file.contents);

        // get plot type keywords from mocks
        const types = contents.data
            .map((trace) => trace.type || 'scatter')
            .reduce((acc, type, i, arr) => (arr.lastIndexOf(type) === i ? [...acc, type] : acc), []);

        const filename = file.name.split(path.sep).pop();

        return {
            name: filename.slice(0, -5),
            file: filename,
            keywords: types.join(', ')
        };
    });

    return mocksList;
}

function saveListToFile(filePath, fileName) {
    return (list) => writeFilePromise(path.join(filePath, fileName), JSON.stringify(list, null, 2));
}

export const saveMockListToFile = saveListToFile(constants.pathToBuild, 'test_dashboard_mocks.json');
export const saveReglTracesToFile = saveListToFile(constants.pathToBuild, 'regl_traces.json');
