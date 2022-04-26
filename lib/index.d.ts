import { UrlWithStringQuery } from "url";

declare module 'odoo-await' {

    export type OdooConfig = {
        baseUrl : string;
        db      : string;
        password: string;
        user    : string;
        port?   : number;
    }

    interface SearchOpts {
        offset? : number,
        limit?  : number,
        order?  : string,
        context?: object
    }

    type DomainArray = Array<string | boolean | null>

    type Domain = object | DomainArray | DomainArray[];

    export default class OdooAwait {

        constructor(opts: OdooConfig);

        connect         ()                                                                       : Promise<number>;
        parseManyFields(params: object)                                                          : any;
        create          (model: string, params: object, externalId?: string, moduleName?: string): Promise<number>;
        read            (model: string, recordId: number | number[], fields?: string[])          : Promise<object>;
        delete          (model: string, recordId: number | number[])                             : Promise<boolean>;
        searchRead      (model: string, domain?: Domain, fields?: string[], opts?: SearchOpts)   : Promise<object[]>;
        search          (model: string, domain?: Domain)                                         : Promise<number[]>;
        getFields       (model: string, attributes: string[])                                    : Promise<object>;

        /* External ID methods */
        createExternalId   (model: string, recordId: number, externalId: string, moduleName?: string): Promise<number>;
        searchByExternalId(externalId: string)                                                       : Promise<number>;
        readByExternalId  (externalId: string, fields?: string[])                                    : Promise<object>
        updateByExternalId(externalId: string, params: object)                                       : Promise<boolean>
        deleteByExternalId(externalId: UrlWithStringQuery)                                           : Promise<boolean>


    }
}

