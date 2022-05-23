import parsePath from 'parse-path';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunkAPI } from '../hooks';
import { repoAdded, Repository } from '../slices/repos';
import repoSelectors from '../selectors/repos';
import { FilebasedMetafile, isVersionedMetafile } from '../slices/metafiles';
import { getBranchRoot, getWorktreePaths } from '../../containers/git-path';
import { clone, defaultBranch, getConfig, getRemoteInfo, GitConfig } from '../../containers/git-porcelain';
import { extractFromURL, extractRepoName } from '../../containers/git-plumbing';
import { extractFilename } from '../../containers/io';
import { createMetafile, fetchParentMetafile } from './metafiles';
import { fetchBranches } from './branches';
import { ProgressCallback } from 'isomorphic-git';
import { checkProject, resolveConflictBranches } from '../../containers/conflicts';
import { DateTime } from 'luxon';
import { createCard } from './cards';
import { ExactlyOne } from '../../containers/utils';

export const fetchRepo = createAsyncThunk<Repository | undefined, ExactlyOne<{ filepath: PathLike, metafile: FilebasedMetafile }>, AppThunkAPI>(
    'repos/fetchRepo',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();
        const filepath: PathLike = input.metafile ? input.metafile.path : input.filepath;

        if (input.metafile) {
            // if metafile already has a repo UUID, check for matching repository
            let repo = input.metafile.repo ? repoSelectors.selectById(state, input.metafile.repo) : undefined;
            const parent = !repo ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap() : undefined;
            // otherwise if parent metafile already has a repo UUID, check for matching repository
            repo = (parent && isVersionedMetafile(parent)) ? repoSelectors.selectById(state, parent.repo) : repo;
            if (repo) return repo;
        }
        // if filepath has a root path, check for matching repository
        const { dir, worktreeDir } = await getWorktreePaths(filepath);
        let repo = dir ? repoSelectors.selectByRoot(state, dir) : undefined;

        // otherwise create a new repository
        const root = worktreeDir ? worktreeDir : dir;
        repo = (!repo && root) ? await thunkAPI.dispatch(createRepo(root)).unwrap() : repo;
        return repo;
    }
);

export const createRepo = createAsyncThunk<Repository, PathLike, AppThunkAPI>(
    'repos/createRepo',
    async (filepath, thunkAPI) => {
        const { dir } = await getWorktreePaths(filepath);
        const { url, oauth } = await getRemoteConfig(dir);
        const branches = dir ? await thunkAPI.dispatch(fetchBranches(dir)).unwrap() : { local: [], remote: [] };
        const { local, remote } = { local: branches.local.map(branch => branch.id), remote: branches.remote.map(branch => branch.id) };
        const { username, password } = await getCredentials(dir);
        return thunkAPI.dispatch(repoAdded({
            id: v4(),
            name: url ? extractRepoName(url.href) : (dir ? extractFilename(dir) : ''),
            root: dir ? dir : '',
            /** TODO: The corsProxy is just a stubbed URL for now, but eventually we need to support Cross-Origin 
             * Resource Sharing (CORS) since isomorphic-git requires it */
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: url ? url.href : '',
            default: dir ? await defaultBranch({ dir: dir }) : '',
            local: local,
            remote: remote,
            oauth: oauth ? oauth : 'github',
            username: username,
            password: password,
            token: ''
        })).payload;
    }
);

const getRemoteConfig = async (dir: PathLike | undefined)
    : Promise<{ url: parsePath.ParsedPath | undefined; oauth: Repository['oauth'] | undefined }> => {
    const remoteConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'remote.origin.url' }) : { scope: 'none' };
    return (remoteConfig.scope !== 'none') ? extractFromURL(remoteConfig.value) : { url: undefined, oauth: undefined };
};

const getCredentials = async (dir: PathLike | undefined): Promise<{ username: string; password: string }> => {
    const usernameConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'user.name' }) : { scope: 'none' };
    const passwordConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'credential.helper' }) : { scope: 'none' };
    return {
        username: usernameConfig.scope === 'none' ? '' : usernameConfig.value,
        password: passwordConfig.scope === 'none' ? '' : passwordConfig.value
    };
};

/** Create a local repository by cloning a remote repository. */
export const cloneRepository = createAsyncThunk<Repository | undefined, { url: URL, root: PathLike, onProgress?: ProgressCallback }, AppThunkAPI<string>>(
    'repos/clone',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();
        const existing = repoSelectors.selectByRoot(state, input.root);
        // if root points to a current repository, do not clone over it and instead use `fetchRepo`
        if (existing) return thunkAPI.rejectWithValue(`Existing repository found at '${input.root.toString()}', open the root directory instead`);

        const info = await getRemoteInfo({ url: input.url.toString() });
        if (!info.HEAD) return thunkAPI.rejectWithValue('Repository not configured; HEAD is disconnected or not configured');
        const cloned = await clone({ url: input.url, dir: input.root, depth: 10, onProgress: input.onProgress });
        if (!cloned) return thunkAPI.rejectWithValue(`Clone failed for '${input.url.toString()}'; possibly unsupported URL type`);

        return await thunkAPI.dispatch(createRepo(input.root)).unwrap();
    }
);

// TODO: Refactor this fetch to be an automated process via the listenerMiddleware
export const fetchConflictManagers = createAsyncThunk<void, void, AppThunkAPI>(
    'metafiles/fetchConflictManagers',
    async (_, thunkAPI) => {
        const repos = repoSelectors.selectAll(thunkAPI.getState());
        // for all repos,
        // for all local branches,
        // check for conflicts
        // load a conflictManager metafile if there are conflicts
        // load a card for each conflictManager metafile

        await Promise.all(repos.map(async repo => {
            await Promise.all(repo.local.map(async branchId => {
                const branch = thunkAPI.getState().branches.entities[branchId];
                const root = branch ? await getBranchRoot(repo.root, branch.ref) : undefined;
                const conflicts = await checkProject(root);
                if (branch && root && conflicts.length > 0) {
                    const { base, compare } = await resolveConflictBranches(root);
                    const conflictManager = await thunkAPI.dispatch(createMetafile({
                        metafile: {
                            name: `Conflicts`,
                            modified: DateTime.local().valueOf(),
                            handler: 'ConflictManager',
                            filetype: 'Text',
                            loading: [],
                            repo: repo.id,
                            path: root,
                            merging: { base: (base ? base : branch.ref), compare: compare }
                        }
                    })).unwrap();
                    await thunkAPI.dispatch(createCard({ metafile: conflictManager }));
                }
            }));
        }));
    }
);