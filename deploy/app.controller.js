"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
let AppController = class AppController {
    getHello() {
        return {
            name: 'Attendance System API',
            version: '1.0.0',
            description: 'API for managing attendance records',
            endpoints: {
                auth: {
                    login: 'POST /auth/login',
                    rfid: 'POST /auth/rfid'
                },
                users: {
                    profile: 'GET /users/profile',
                    list: 'GET /users',
                    create: 'POST /users',
                    updateRole: 'PUT /users/:id/role',
                    delete: 'DELETE /users/:id'
                },
                agents: {
                    list: 'GET /agents',
                    create: 'POST /agents',
                    getOne: 'GET /agents/:id',
                    update: 'PUT /agents/:id',
                    delete: 'DELETE /agents/:id'
                },
                offices: {
                    list: 'GET /offices',
                    create: 'POST /offices',
                    update: 'PUT /offices/:id',
                    delete: 'DELETE /offices/:id'
                },
                attendance: {
                    check: 'POST /attendance/check',
                    list: 'GET /attendance',
                    update: 'PUT /attendance/:id',
                    delete: 'DELETE /attendance/:id',
                    latestStatus: 'GET /attendance/latest-status'
                },
                rfid: {
                    check: 'GET /api/rfid/check/:cardNumber',
                    scan: 'POST /api/rfid/scan'
                }
            }
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHello", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map