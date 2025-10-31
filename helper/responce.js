import {
  STATUS_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "./../../config/appConstants.js";
//import  logger from "../config/logger";
import {
  ValidationError,
  OperationalError,
  NotFoundError,
  AuthFailedError,
} from "./error1.js";
const successResponse = (
  req,
  res,
  statusCode = STATUS_CODES.SUCCESS,
  message = SUCCESS_MESSAGES.SUCCESS,
  data,
  value
) => {
  const result = {
    statusCode,
    message: res.__(message), //Added Localization to response
    data,
    value,
  };

  return res.status(statusCode).json(result);
};
const errorResponse = (error, req, res) => {
  const statusCode =
    error.code ||
    error.statusCode ||
    // error.response?.status ||
    STATUS_CODES.ERROR;

  //const logError = error.logError ?? true;
  //@ts-ignore
  //const reqId = req["reqId"];
  if (statusCode === STATUS_CODES.ERROR) {
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    Error.captureStackTrace(error, error.constructor);
  }
  // if (logError) {
  //   //let initiator = errorLine(error);
  //   // console.error(error);
  //   // logger.error((reqId) => {
  //   //   `${reqId}, initiator=>${initiator}, Stack=>${error.stack}`;
  //   // });
  // }

  //if (statusCode === STATUS_CODES.ERROR) {
  //TODO: ****  Production Error need to add notifications
  // return res.status(error).json({
  //   statusCode,
  //   message: res.__(ERROR_MESSAGES.SERVER_ERROR),
  //   // data: {},
  // });
  //}

  // const message =
  //   error instanceof NotFoundError ||
  //   error instanceof ValidationError ||
  //   error instanceof OperationalError ||
  //   error instanceof AuthFailedError
  //     ? res.__(error.message)
  //     : error.toString();
  console.log("jhiii", error, "hvuhuuvl");
  return res.status(STATUS_CODES.ACTION_FAILED).json({
    message: error,
    //data: ERROR_MESSAGES.SERVER_ERROR,
  });
};

export { successResponse, errorResponse };
