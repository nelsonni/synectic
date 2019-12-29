import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Converts a JavaScript Object Notation (JSON) string into a typed object.
 * @param json A valid JSON string.
 * @return A typed object (or nested array of objects).
 */
export const deserialize = <T>(json: string) => JSON.parse(json) as T;

/**
 * Extracts the file stat details from the path. Returns all fields provided by
 * the fs.Stats class (see the Node.js API docs @link https://nodejs.org/api/fs.html#fs_class_fs_stats).
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object for a fs.Stats object containing the file details or throws Error if
 * filepath does not exist or is permissions-restricted.
 */
export const extractStats = (filepath: fs.PathLike) => fs.stat(filepath.toString());

/**
 * Extract the file basename from the path. Returns the filename, including
 * extension, after the last platform-specific file separator 
 * (e.g. '/src/api/router.asp' is translated to 'router.asp').
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file basename.
 */
export const extractFilename = (filepath: fs.PathLike) => {
  const filename = filepath.toString().split(/[\\/]/).pop();
  if (filename === undefined) return filepath.toString();
  else return filename;
}

/**
 * Extract the file extension from the path. Returns the extension after 
 * the last period character in the path, otherwise returns full path if 
 * first character is a period or no period exists.
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file extension.
 */
export const extractExtension = (filepath: fs.PathLike) => {
  const ext = filepath.toString().split('.').pop();
  if (ext === undefined) return filepath.toString();
  else return ext;
}

/**
 * Asynchronously read file contents into a string.
 * @param filepath A valid filename or path to read from.
 * @return A Promise object for a string containing the file contents.
 */
export const readFileAsync = (filepath: fs.PathLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filepath.toString()), (error, result) => {
      if (error) reject(error);
      else resolve(result.toString());
    });
  });
}

/**
 * Asynchronously write data to a file. Creates a new file if none exists; will 
 * destructively rewrite existing files.
 * @param filepath A valid filename or path to write data to.
 * @param data A Promise object for the file write operation; where errors cause a rejection.
 */
export const writeFileAsync = (filepath: fs.PathLike, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filepath.toString()), data, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}