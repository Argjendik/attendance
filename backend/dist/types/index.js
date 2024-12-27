"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = void 0;
exports.isValidRole = isValidRole;
exports.ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    HR: 'HR',
    AGENT: 'AGENT',
};
function isValidRole(role) {
    return Object.values(exports.ROLES).includes(role);
}
//# sourceMappingURL=index.js.map