import * as fs from 'fs-extra';
import * as io from '../containers/io';

/**
 * Takes a path and determines if it is a file or not. Returns the file path
 * string if so and undefined if not.
 * @param filepath The given path to be evaluated.
 * @return Either the file path as a string or undefined.
 */
export const isFile = async (filepath: fs.PathLike): Promise<string | undefined> => {
    const stat = await io.extractStats(filepath.toString());
    if (stat?.isFile()) return filepath.toString();
    else return undefined;
}

/**
 * Takes a path and determines if it is a directory or not. Returns the directory path
 * string if so and undefined if not.
 * @param filepath The given path to be evaluated.
 * @return Either the directory path as a string or undefined.
 */
export const isDir = async (filepath: fs.PathLike): Promise<string | undefined> => {
    const stat = await io.extractStats(filepath.toString());
    if (stat?.isDirectory()) return filepath.toString();
    else return undefined;
}

/**
 * Takes an array of any type and removes any undefined elements from it. 
 * @param array The given array of elements to remove anything undefined from.
 * @return The resulting array devoid of any undefined elements.
 */
export const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
    return array.filter((item): item is T => typeof item !== 'undefined');
}

/**
 * Descends into a given root directory path and extracts every child directory and file.
 * @param filepath The root directory path to be descended into.
 * @return A promise for an array of string paths to the child files and directories.
 */
export const extractFileTreeNames = async (filepath: fs.PathLike): Promise<string[]> => {
    filepath = filepath.toString().replace(/[/\\]$/g, '');

    // extract a list of filenames for all direct descendant files and directories
    const descendants = await io.extractReaddir(filepath.toString());
    if (!descendants) return [filepath.toString()];

    // using isFile, extract a list of only direct descendant files
    const childFiles = removeUndefined(await Promise.all(descendants.map(child => isFile(`${filepath.toString()}/${child}`))));

    // using isDir, extract a list of only direct descendant directories
    const childDirs = removeUndefined(await Promise.all(descendants.map(child => isDir(`${filepath.toString()}/${child}`))));

    // recursively extract the list of actions for each direct descendant directory
    const subDirs = await Promise.all(childDirs.map(dir => extractFileTreeNames(dir)));

    // since the list of actions for each direct descendant directory results in a 2-dimensional array, zipper the arrays together
    const subActions = subDirs.reduce((accum, item) => { return [...accum, ...item] }, []);

    // return the list of actions compiled from the current directory, all direct descendant files, and the recursive results
    // of calling this function on all direct descendant directories (which were then zippered into a flat 1-dimensional array)
    return [filepath.toString(), ...childFiles, ...subActions];
};