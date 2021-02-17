import * as fs from 'fs-extra';
import * as path from 'path';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import isHash from 'validator/lib/isHash';

import * as io from './io';
import type { Repository, Worktree } from '../types';
import { clone, currentBranch, getRepoRoot, resolveRef } from './git';

const getWorktree = async (dir: fs.PathLike, gitdir = path.join(dir.toString(), '.git'), bare = false): Promise<Worktree> => {
  const branch = await currentBranch({ dir: dir.toString(), gitdir: gitdir });
  const commit = await resolveRef({ dir: dir, ref: 'HEAD' });
  return {
    id: v4(),
    path: dir,
    bare: bare,
    detached: branch ? false : true,
    ref: branch ? branch : undefined,
    rev: commit
  };
}

/**
 * Git index files are tricky since their encoded in a custom binary form with byte and bit-specific entries that depend
 * upon the presence of different configurations and extensions; see https://git-scm.com/docs/index-format.
 * @param repo 
 * @param dir 
 * @param commitish 
 */
export const add = async (repo: Repository, dir: fs.PathLike, commitish?: string): Promise<void> => {
  const commit = (commitish && isHash(commitish, 'sha1')) ? commitish : await resolveRef({ dir: repo.root, ref: 'HEAD' });
  const branch = (commitish && !isHash(commitish, 'sha1')) ? commitish : io.extractDirname(dir);
  const gitdir = path.resolve(`${dir.toString()}/.git`);
  const worktreedir = path.join(repo.root.toString(), '/.git/worktrees', branch);
  const commondir = path.relative(worktreedir, path.join(repo.root.toString(), '.git'));

  // initialize the linked worktree
  await clone({ repo: repo, dir: dir, ref: branch, singleBranch: true });
  await fs.remove(gitdir);
  await io.writeFileAsync(gitdir, `gitdir: ${worktreedir}`);

  // populate internal git files in main worktree to include linked worktree
  await fs.ensureDir(worktreedir);
  await io.writeFileAsync(path.join(worktreedir, 'HEAD'), `ref: refs/heads/${branch}`);
  await io.writeFileAsync(path.resolve(`${worktreedir}/${commondir}/refs/heads/${branch}`), commit);
  await io.writeFileAsync(path.join(worktreedir, 'ORIG_HEAD'), commit);
  await io.writeFileAsync(path.join(worktreedir, 'commondir'), commondir);
  await io.writeFileAsync(path.join(worktreedir, 'gitdir'), gitdir + '\n');

  // resolve missing git index file in the linked worktree, by copying from main worktree (if available)
  const index = path.resolve(`${worktreedir}/${commondir}/index`);
  if (await io.extractStats(index)) await fs.copy(index, `${worktreedir}/index`);

  return;
}

/**
 * List details of each working tree. The main working tree is listed first, followed by each of the linked working trees. 
 * The output details include whether the working tree is bare, the revision currently checked out, the branch currently 
 * checked out (or "detached HEAD" if none), and "locked" if the worktree is locked.
 * @param dir The working tree directory path.
 */
export const list = async (dir: fs.PathLike): Promise<Worktree[] | undefined> => {
  let root = await getRepoRoot(dir);
  if (!root) return undefined; // if there is no root, then dir is not under version control

  if (!(await io.isDirectory(`${root}/.git`))) {
    // dir points to a linked worktree, so we update root to point to the main worktree path
    const worktreedir = (await io.readFileAsync(`${root}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    const commondir = (await io.readFileAsync(`${worktreedir}/commondir`, { encoding: 'utf-8' })).trim();
    root = path.normalize(`${worktreedir}/${commondir}/..`);
  }

  const main = await getWorktree(root);
  const worktrees = path.join(root, '.git/worktrees');
  // .git/worktrees directory will only exist if a linked worktree has been added (even if it was later deleted), so verify it exists
  const exists = (await io.extractStats(worktrees)) ? true : false;
  const linked = exists ? await Promise.all((await io.readDirAsync(worktrees)).map(async worktree => {
    const gitdir = (await io.readFileAsync(`${root}/.git/worktrees/${worktree}/gitdir`, { encoding: 'utf-8' })).trim();
    const dir = path.normalize(`${gitdir}/..`);
    return getWorktree(dir);
  })) : [];

  return [main, ...linked];
}


export const lock = (worktree: Worktree, reason?: string): void => {
  console.log({ worktree, reason });
  return;
}

export const move = (worktree: Worktree, newPath: fs.PathLike): void => {
  console.log({ worktree, newPath });
  return;
}

/**
 * Prune working tree information in `$GIT_DIR/worktrees`, specifically worktrees that were deleted without using `worktreeRemove` 
 * (or the underlying `git worktree remove` terminal command). The `expire` option further restricts which worktrees will be removed.
 * @param dir The relative or absolute directory path for the main worktree.
 * @param verbose Flag for reporting all removals.
 * @param expire Only expire unusued working trees older than a specific DateTime.
 * @param dryRun Flag for no removing anything; just reporting what would be removed.
 */
export const prune = async (dir: fs.PathLike, verbose = false, expire?: DateTime, dryRun = false): Promise<void> => {
  const worktrees = await list(dir);
  if (!worktrees) return; // if worktrees is undefined, then dir is not under version control

  const mainWorktree = worktrees?.shift(); // remove first worktree from list, since the main worktree cannot be pruned
  if (!worktrees || !mainWorktree) return; // if there is no linked or main worktrees, then pruning is a no-op

  worktrees.map(async worktree => {
    const stats = await io.extractStats(worktree.path);
    if (!stats || (expire && stats && DateTime.fromJSDate(stats.mtime) < expire)) {
      const worktreePath = path.resolve(path.join(mainWorktree.path.toString(), '.git/worktrees', worktree.ref ? worktree.ref : 'ERROR'));
      if (verbose) console.log(`Removing worktrees/${worktree.ref}: gitdir file points to non-existent location`);
      if (!dryRun) fs.remove(worktreePath);
    }
  });
}

export const remove = (worktree: Worktree, force = false): void => {
  console.log({ worktree, force });
  return;
}

export const repair = (path: fs.PathLike, ...paths: fs.PathLike[]): void => {
  console.log({ path, paths });
  return;
}

export const unlock = (worktree: Worktree): void => {
  console.log({ worktree });
  return;
}