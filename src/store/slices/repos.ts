import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
// import { extractFromURL } from '../../containers/git-plumbing';
import type { Repository } from '../../types';
import { AppThunkAPI } from '../hooks';
import { PURGE } from 'redux-persist';

export const reposAdapter = createEntityAdapter<Repository>();

export const reposSlice = createSlice({
    name: 'repos',
    initialState: reposAdapter.getInitialState(),
    reducers: {
        repoAdded: reposAdapter.addOne,
        repoRemoved: reposAdapter.removeOne,
        repoUpdated: reposAdapter.upsertOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                reposAdapter.removeAll(state);
            })
    }
});

export const getRepoByName = createAsyncThunk<Repository | undefined, { name: string, url?: string }, AppThunkAPI>(
    'repos/getRepoByName',
    async (param, thunkAPI) => {
        const matcher = (repo: Repository, name: string, url?: string | undefined): boolean => {
            return url ? repo.name === name : repo.name === name;
            // return url ? (repo.name === name && repo.url === extractFromURL(url).url.href) : (repo.name === name);
        }
        return Object.values(thunkAPI.getState().repos.entities).find(r => r && matcher(r, param.name, param.url));
    }
)

export const { repoAdded, repoRemoved, repoUpdated } = reposSlice.actions;

export default reposSlice.reducer;