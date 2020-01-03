import {
    GET_LIST,
    GET_MANY,
    GET_MANY_REFERENCE,
    GET_ONE,
    CREATE,
    UPDATE,
    DELETE,
    UPDATE_MANY,
    DELETE_MANY,
} from './fetchActions';

import { TypeKind } from 'graphql';
import getFinalType from './getFinalType';

const sanitizeResource = data => {
    const result = Object.keys(data).reduce((acc, key) => {
        if (key.startsWith('_')) {
            return acc;
        }

        const dataKey = data[key];

        if (dataKey === null || dataKey === undefined) {
            return acc;
        }
        if (Array.isArray(dataKey)) {
            if (typeof dataKey[0] === 'object') {
                return {
                    ...acc,
                    [key]: dataKey.map(sanitizeResource),
                    [`${key}Ids`]: dataKey.map(d => d.id),
                };
            } else {
                return { ...acc, [key]: dataKey };
            }
        }

        if (typeof dataKey === 'object') {
            return {
                ...acc,
                ...(dataKey &&
                    dataKey.id && {
                        [`${key}.id`]: dataKey.id,
                    }),
                [key]: sanitizeResource(dataKey),
            };
        }

        return { ...acc, [key]: dataKey };
    }, {});

    return result;
};

export default introspectionResults => (aorFetchType, resource) => res => {
    const response = res.data;

    switch (aorFetchType) {
        case GET_MANY_REFERENCE:
        case GET_LIST:
            return {
                data: response.items.map(sanitizeResource),
                total: response.total.aggregate.count,
            };

        case GET_MANY:
            return { data: response.items.map(sanitizeResource) };

        case GET_ONE:
            return { data: sanitizeResource(response.returning[0]) };

        case CREATE:
        case UPDATE:
        case DELETE:
            return { data: sanitizeResource(response.data.returning[0]) };

        case UPDATE_MANY:
        case DELETE_MANY:
            return { data: response.data.returning.map(x => x.id) };

    }
};
