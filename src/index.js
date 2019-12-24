import merge from 'lodash/merge';
import buildDataProvider from 'ra-data-graphql';
import { DELETE, DELETE_MANY, UPDATE, UPDATE_MANY } from 'ra-core';

import defaultBuildQuery from './buildQuery';

const defaultOptions = {
    buildQuery: defaultBuildQuery,
    operationNames: {
        [GET_LIST]: resource => `${(resource.name)}`,
        [GET_ONE]: resource => `${resource.name}`,
        [GET_MANY]: resource => `${(resource.name)}`,
        [GET_MANY_REFERENCE]: resource => `${(resource.name)}`,
        [CREATE]: resource => `insert_${resource.name}`,
        [UPDATE]: resource => `update_${resource.name}`,
        [UPDATE_MANY]: resource => `update_${resource.name}`,
        [DELETE]: resource => `delete_${resource.name}`,
        [DELETE_MANY]: resource => `delete_${resource.name}`,
    },
};


export const buildQuery = defaultBuildQuery;

export default options => {
    return buildDataProvider(merge({}, defaultOptions, options)).then(
        defaultDataProvider => {
            return (fetchType, resource, params) => {
                return defaultDataProvider(fetchType, resource, params);
            };
        }
    );
};
