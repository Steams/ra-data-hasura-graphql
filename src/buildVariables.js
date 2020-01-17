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

import getFinalType from './getFinalType';

const buildGetListVariables = introspectionResults => (
    resource,
    aorFetchType,
    params
) => {
    var result = {};

    if (params.filter) {
        const filters = Object.keys(params.filter).reduce((acc, key) => {
            if (key === 'ids') {
                return [
                    ...acc,
                    {
                        id: {
                            _in: params.filter['ids'],
                        },
                    },
                ];
            }

            const field = resource.type.fields.find(f => f.name === key)

            console.log('field')
            console.log(field)

            switch (getFinalType(field.type).name) {
            case "String":
                return [
                    ...acc,
                    {
                        [key]: {
                            _ilike: "%" + params.filter[key] + "%"
                        },
                    },
                ];
            default :
                return [
                    ...acc,
                    {
                        [key]: {
                            _eq: params.filter[key]
                        },
                    },
                ];
            }
        }, []);

        result['where'] = { _and: filters };
    }

    if (params.pagination) {
        result['limit'] = parseInt(params.pagination.perPage, 10);
        result['offset'] = parseInt(
            (params.pagination.page - 1) * params.pagination.perPage,
            10
        );
    }

    if (params.sort) {
        result['order_by'] = {
            [params.sort.field]: params.sort.order.toLowerCase(),
        };
    }

    return result;
};

const buildUpdateVariables = (resource, aorFetchType, params, queryType) =>
    Object.keys(params.data).reduce((acc, key) => {
        // If hasura permissions do not allow a field to be updated like (id),
        // we are not allowed to put it inside the variables
        // RA passes the whole previous Object here
        // https://github.com/marmelab/react-admin/issues/2414#issuecomment-428945402

        // TODO: To overcome this permission issue,
        // it would be better to allow only permitted inputFields from *_set_input INPUT_OBJECT
        if (params.data[key] === params.previousData[key]) {
            return acc;
        }

        if (resource.type.fields.some( f => f.name === key )) {
            return {
                ...acc,
                [key]: params.data[key],
            };
        }

        return acc;

    }, {});

const buildCreateVariables = (resource, aorFetchType, params, queryType) => {
    return Object.keys(params.data).reduce((acc, key) => {
        return {
            ...acc,
            [key]: params.data[key],
        };
    }, {});
};

export default introspectionResults => (
    resource,
    aorFetchType,
    params,
    queryType
) => {
    switch (aorFetchType) {
        case GET_LIST:
            return buildGetListVariables(introspectionResults)(
                resource,
                aorFetchType,
                params,
                queryType
            );
        case GET_MANY_REFERENCE: {
            var built = buildGetListVariables(introspectionResults)(
                resource,
                aorFetchType,
                params,
                queryType
            );
            if (params.filter) {
                return {
                    ...built,
                    where: {
                        _and: [
                            ...built['where']['_and'],
                            { [params.target]: { _eq: params.id } },
                        ],
                    },
                };
            }
            return {
                ...built,
                where: {
                    [params.target]: { _eq: params.id },
                },
            };
        }
        case GET_MANY:
        case DELETE_MANY:
            return {
                where: { id: { _in: params.ids } },
            };

        case GET_ONE:
            return {
                where: { id: { _eq: params.id } },
                limit: 1,
            };

        case DELETE:
            return {
                where: { id: { _eq: params.id } },
            };
        case CREATE:
            return {
                objects: buildCreateVariables(
                    resource,
                    aorFetchType,
                    params,
                    queryType
                ),
            };

        case UPDATE:
            return {
                _set: buildUpdateVariables(
                    resource,
                    aorFetchType,
                    params,
                    queryType
                ),
                where: { id: { _eq: params.id } },
            };

        case UPDATE_MANY:
            return {
                _set: buildUpdateVariables(
                    resource,
                    aorFetchType,
                    params,
                    queryType
                ),
                where: { id: { _in: params.ids } },
            };
    }
};
