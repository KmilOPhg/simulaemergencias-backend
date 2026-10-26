// Utils para no escribir los JSON error, success, etc en cada controlador
export const sendErrorResponse = (res: any, statusCode: number, message: string, errors?: any) => {
    const response: any = {
        status: "error",
        msg: message,
    };
    if (errors) {
        response.errors = errors;
    }
    res.status(statusCode).json(response);
}

export const sendSuccessResponse = (res: any, statusCode: number, message: string, data?: any) => {
    const response: any = {
        status: "success",
        msg: message,
    };
    if (data) {
        response.data = data;
    }
    res.status(statusCode).json(response);
}
