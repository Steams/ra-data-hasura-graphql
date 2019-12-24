import { GET_ONE, GET_LIST, GET_MANY, GET_MANY_REFERENCE, DELETE, CREATE,UPDATE,UPDATE_MANY, DELETE_MANY} from './fetchActions';

const buildGetListVariables = introspectionResults => (
    resource,
    aorFetchType,
    params
) => {
    result = {};

    if (params.filter) {
        const filters = Object.keys(params.filter).reduce((acc, key) => {

            if (key === 'ids') {
                return [
                    ...acc,
                    {
                        'id': {
                            '_in': params.filter['ids']
                        }
                    }
                ];
            }

            // if filter property is an object
            // TODO find out how to filter on Object in hasura or if this is even necessary
            // if (typeof params.filter[key] === 'object') {

            //     // find a resourceFilter type in the schema (NOTE this wont work for hasura)
            //     const type = introspectionResults.types.find(
            //         t => t.name === `${resource.type.name}Filter`
            //     );

            //     // find inputfields on the filter type found that match key_some ?
            //     const filterSome = type.inputFields.find(
            //         t => t.name === `${key}_some`
            //     );

            //     if (filterSome) {
            //         const filter = Object.keys(params.filter[key]).reduce(
            //             (filter_acc, k) => ({
            //                 ...filter_acc,
            //                 [`${k}_in`]: params.filter[key][k],
            //             }),
            //             {}
            //         );
            //         return { ...acc, [`${key}_some`]: filter };
            //     }
            // }

            // Split a nested key, so address.street = address,street
            // const parts = key.split('.');

            // // if the filter property is deep, ie address.street...
            // if (parts.length > 1) {
            //     // if the second part of the filter is id, adress.id
            //     if (parts[1] === 'id') {
            //         const type = introspectionResults.types.find(
            //             t => t.name === `${resource.type.name}Filter`
            //         );
            //         const filterSome = type.inputFields.find(
            //             t => t.name === `${parts[0]}_some`
            //         );

            //         if (filterSome) {
            //             return {
            //                 ...acc,
            //                 [`${parts[0]}_some`]: { id: params.filter[key] },
            //             };
            //         }

            //         return { ...acc, [parts[0]]: { id: params.filter[key] } };
            //     }

            //     const resourceField = resource.type.fields.find(
            //         f => f.name === parts[0]
            //     );
            //     if (resourceField.type.name === 'Int') {
            //         return { ...acc, [key]: parseInt(params.filter[key], 10) };
            //     }
            //     if (resourceField.type.name === 'Float') {
            //         return { ...acc, [key]: parseFloat(params.filter[key], 10) };
            //     }
            // }

            return [...acc, {
                [key]: {
                    '_eq': params.filter[key]
                }
            }];
        }, []);

        result['where'] = {"_and": filters};
    }


    if (params.pagination) {
        result['limit'] = parseInt(params.pagination.perPage, 10);
        result['offset'] = parseInt((params.pagination.page - 1) * params.pagination.perPage, 10);
    }

    if (params.sort) {
        result['order_by'] = {[params.sort.field]: params.sort.order.toLowerCase()};
    }

    return result;
};

const buildUpdateVariables = (
    resource,
    aorFetchType,
    params,
    queryType
) =>
    Object.keys(params.data).reduce((acc, key) => {

        // if (Array.isArray(params.data[key])) {

        //     // find mutation arg with propertyIds?
        //     // TODO NOTE This isnt how hasura does it
        //     const arg = queryType.args.find(a => a.name === `${key}Ids`);

        //     if (arg) {
        //         return {
        //             ...acc,
        //             [`${key}Ids`]: params.data[key].map(({ id }) => id),
        //         };
        //     }
        // }

        // // same as above but for objects
        // // TODO NOTE This isnt how hasura does it
        // if (typeof params.data[key] === 'object') {
        //     const arg = queryType.args.find(a => a.name === `${key}Id`);

        //     if (arg) {
        //         return {
        //             ...acc,
        //             [`${key}Id`]: params.data[key].id,
        //         };
        //     }
        // }

        return {
            ...acc,
            [key]: params.data[key],
        };
    }, {});

const buildCreateVariables = (
    resource,
    aorFetchType,
    params,
    queryType
) => {

      return Object.keys(params.data).reduce((acc, key) => {
          // if (Array.isArray(params.data[key])) {
          //     const arg = queryType.args.find(a => a.name === `${key}Ids`);
          //     // if the field value is an array
          //     // find an argument that takes that array whose name is "propertyids"
          //     // ie if ur updating a user who has posts, they would have a postIDS property
          //     // NOTE in hasura, it would not be called ..ids, it would be "todos_arr_rel_insert_input" etc
          //     // TODO check how hasura handles updating references

          //     if (arg) {
          //         return {
          //             ...acc,
          //             [`${key}Ids`]: params.data[key].map(({ id }) => id),
          //         };
          //     }
          // }

          // if (typeof params.data[key] === 'object') {
          //     const arg = true


          //     if (arg) {
          //         return {
          //             ...acc,
          //             [`${key}_id`]: params.data[key].id,
          //         };
          //     }
          // }

          return {
              ...acc,
              [key]: params.data[key],
          };
      }, {});
}


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
        case GET_MANY_REFERENCE:{
            var built = buildGetListVariables(introspectionResults)(resource, aorFetchType, params, queryType);
            if (params.filter) {
                return {
                    ...built,
                    where: {
                        _and: [ ...built['where']['_and'], { [params.target]: { _eq: params.id } } ]
                    }
                };
            }
            return {
                ...built,
                where: {
                    [params.target]: { _eq: params.id }
                }
            };
        }
        case GET_MANY:
        case DELETE_MANY:
            return {
                where: {"id": {"_in": params.ids}},
            };

        case GET_ONE:
            return {
                where: {"id": {"_eq": params.id}},
                limit: 1
            };

        case DELETE:
            return {
                where: {"id": {"_eq": params.id}}
            };
        case CREATE:
            return {
                objects : buildCreateVariables(resource, aorFetchType, params, queryType)
            };

        case UPDATE:
            return {
                '_set' : buildUpdateVariables(
                    resource,
                    aorFetchType,
                    params,
                    queryType
                ),
                where: {"id": {"_eq": params.id}}
            };

        case UPDATE_MANY:
            return {
                '_set' : buildUpdateVariables(
                    resource,
                    aorFetchType,
                    params,
                    queryType
                ),
                where: {"id": {"_in": params.ids}},
            };
    }
};
