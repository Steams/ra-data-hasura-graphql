import merge from 'lodash/merge';
import buildDataProvider from 'ra-data-graphql';
import {
    GET_ONE,
    GET_LIST,
    GET_MANY,
    GET_MANY_REFERENCE,
    DELETE,
    CREATE,
    UPDATE,
    UPDATE_MANY,
    DELETE_MANY,
} from './fetchActions';
import buildQuery from './buildQuery';
import buildGqlQuery from './buildGqlQuery';

export { buildQuery, buildGqlQuery };

const defaultOptions = {
    buildQuery,
    introspection: {
        operationNames: {
            [GET_LIST]: resource => `${resource.name}`,
            [GET_ONE]: resource => `${resource.name}`,
            [GET_MANY]: resource => `${resource.name}`,
            [GET_MANY_REFERENCE]: resource => `${resource.name}`,
            [CREATE]: resource => `insert_${resource.name}`,
            [UPDATE]: resource => `update_${resource.name}`,
            [UPDATE_MANY]: resource => `update_${resource.name}`,
            [DELETE]: resource => `delete_${resource.name}`,
            [DELETE_MANY]: resource => `delete_${resource.name}`,
        },
    },
};

export default options => {
    return buildDataProvider(merge({}, defaultOptions, options)).then(
        dataProvider => {
            return (fetchType, resource, params) => {
                return dataProvider(fetchType, resource, params);
            };
        }
    );
};
