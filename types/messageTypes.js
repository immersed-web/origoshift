"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = exports.createRequest = void 0;
var createRequest = function (subject, data) {
    var msg = {};
    msg.type = 'request';
    msg.subject = subject;
    if (!data) {
        return msg;
    }
    var msgWithData = msg;
    msgWithData.data = data;
    return msgWithData;
};
exports.createRequest = createRequest;
var createResponse = function (subject, id, _a) {
    var wasSuccess = _a.wasSuccess, data = _a.data, message = _a.message;
    var msg = {
        type: 'response',
        subject: subject,
        isResponse: true,
        id: id,
        wasSuccess: wasSuccess,
    };
    if (message) {
        msg.message = message;
    }
    if (!data || !msg.wasSuccess) {
        return msg;
    }
    var responseWithData = msg;
    responseWithData.data = data;
    return responseWithData;
};
exports.createResponse = createResponse;
