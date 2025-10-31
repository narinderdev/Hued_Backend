import { STATUS_CODES, ERROR_MESSAGES } from "../../config/appConstants";
class OperationalError extends Error {
  constructor(
    statusCode = STATUS_CODES.ACTION_FAILED,
    message = ERROR_MESSAGES.SERVER_ERROR,
    data,
    logError = true
  ) {
    super(message);

    Object.setPrototypeOf(this, OperationalError.prototype);
    this.name = "";
    this.data = data;
    this.statusCode = statusCode;
    this.logError = logError;
    // this.type = type;
  }
}
export { OperationalError };
