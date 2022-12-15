/* tslint:disable */
/* eslint-disable */
/**
 * Unleash API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 4.19.0-beta.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { RequestsPerSecondSchemaData } from './RequestsPerSecondSchemaData';
import {
    RequestsPerSecondSchemaDataFromJSON,
    RequestsPerSecondSchemaDataFromJSONTyped,
    RequestsPerSecondSchemaDataToJSON,
} from './RequestsPerSecondSchemaData';

/**
 * 
 * @export
 * @interface RequestsPerSecondSchema
 */
export interface RequestsPerSecondSchema {
    /**
     * 
     * @type {string}
     * @memberof RequestsPerSecondSchema
     */
    status?: string;
    /**
     * 
     * @type {RequestsPerSecondSchemaData}
     * @memberof RequestsPerSecondSchema
     */
    data?: RequestsPerSecondSchemaData;
}

/**
 * Check if a given object implements the RequestsPerSecondSchema interface.
 */
export function instanceOfRequestsPerSecondSchema(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function RequestsPerSecondSchemaFromJSON(json: any): RequestsPerSecondSchema {
    return RequestsPerSecondSchemaFromJSONTyped(json, false);
}

export function RequestsPerSecondSchemaFromJSONTyped(json: any, ignoreDiscriminator: boolean): RequestsPerSecondSchema {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'status': !exists(json, 'status') ? undefined : json['status'],
        'data': !exists(json, 'data') ? undefined : RequestsPerSecondSchemaDataFromJSON(json['data']),
    };
}

export function RequestsPerSecondSchemaToJSON(value?: RequestsPerSecondSchema | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'status': value.status,
        'data': RequestsPerSecondSchemaDataToJSON(value.data),
    };
}

