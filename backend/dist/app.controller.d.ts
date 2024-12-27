export declare class AppController {
    getHello(): {
        name: string;
        version: string;
        description: string;
        endpoints: {
            auth: {
                login: string;
                rfid: string;
            };
            users: {
                profile: string;
                list: string;
                create: string;
                updateRole: string;
                delete: string;
            };
            agents: {
                list: string;
                create: string;
                getOne: string;
                update: string;
                delete: string;
            };
            offices: {
                list: string;
                create: string;
                update: string;
                delete: string;
            };
            attendance: {
                check: string;
                list: string;
                update: string;
                delete: string;
                latestStatus: string;
            };
            rfid: {
                check: string;
                scan: string;
            };
        };
    };
}
