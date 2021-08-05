import { getDefaultMiddleware } from '@reduxjs/toolkit';
import configureMockStore from 'redux-mock-store';
import type { RootState, AppDispatch } from '../../src/store/store';

import { DeepPartial } from 'redux';

// Conditional type for extracting the type of values in a key-value map object, 
// inspired by: https://mariusschulz.com/articles/conditional-types-in-typescript
type KeyVal<T> = T extends { [x: string]: infer U } ? U : never;

const middlewares = getDefaultMiddleware();
export const createMockStore = configureMockStore<RootState, AppDispatch>(middlewares);

/** 
 * The mocked Redux store does not execute any reducers, and therefore `getActions()` only provides the unexecuted actions 
 * without applying their updates on the state. In order to handle Thunk Action Creators that rely on `getState()` for 
 * controlling behavior, we must have actions apply their updates to the mocked store. Therefore, we must inject a reducer 
 * step into the state of the mocked store using a customized initial state.
 * 
 * For more information, see:
 *   * https://github.com/reduxjs/redux-mock-store/issues/71
 *   * https://github.com/reduxjs/redux-mock-store/issues/71#issuecomment-515209822
 */
// export const createState = (initialState: RootState) => (actions: AnyAction[]) => actions.reduce(store.dispatch, { type: 'empty' });

/**
 * Creates a mocked Redux store for testing purposes. The resulting store can be interacted with using:
 *   * `store.dispatch()`: To dispatch Redux actions, thunks, and async thunks.
 *   * `store.getActions()`: Returns the actions list of the mocked store.
 *   * `store.getState()`: Returns the state of the mocked store.
 *   * `store.clearActions()`: Clears the stored actions.
 *   * `store.subscribe()`: Subscribes a listener to the store for specific actions.
 * @param initialState A JavaScript object containing an initial Redux store state that mimicks the shape of `RootState`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// export const mockStore = (initialState: RootState) => createMockStore(createStore(initialState));

/**
 * Exposes an array of field objects found in the state of a mocked Redux store composed on key-value map objects, using 
 * type inference and conditional typing to expose the value object types. The fields in a mocked Redux store (accessed by
 * calling `store.getState().fieldName`) are of the type `DeepPartial<T> | undefined`, which requires filtering out undefined
 * from both the store field and the deeper fields within the key-value map. Also, since we need the type of values in the
 * key-value map we rely on the `KeyVal` conditional type to infer value types.
 * @param map The key-value map object contained in a mocked Redux store.
 * @return A typed array of values stored in the field within the mocked Redux store.
 */
export const extractFieldArray = <T extends Record<string, KeyVal<T>>>(map: DeepPartial<T> | undefined): KeyVal<T>[] => {
    if (map) return Object.values(map as T);
    throw new Error('exposeFieldArray() cannot resolve undefined');
}

/**
 * Exposes a map of field objects found in the state of a mocked Redux store composed on key-value map objects, using
 * type inference to expose the correct record types. The fields in a mocked Redux store (accessed by calling 
 * `store.getState().fieldName`) are of the type `DeepPartial<T> | undefined`, which requires filtering out undefined
 * from both the store field and the deeper fields within the key-value map. Also, since we need the type of values in the
 * key-value map we rely on the `KeyVal` conditional type to infer value types.
 * @param map The key-value map object contained in a mocked Redux store.
 * @return A typed map stored in the field within the mocked Redux store.
 */
export const extractFieldMap = <T extends Record<string, KeyVal<T>>>(map: DeepPartial<T> | undefined): Record<string, KeyVal<T>> => {
    if (map) return (map as T);
    throw new Error('exposeFieldMap() cannot resolve undefined');
}