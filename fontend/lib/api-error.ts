import axios from 'axios';

export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<unknown>(error)) {
    if (
      isRecord(error) &&
      typeof error.message === 'string' &&
      (typeof error.status === 'number' || error.status === null) &&
      isRecord(error.fieldErrors)
    ) {
      return {
        status: error.status,
        message: error.message,
        fieldErrors: Object.fromEntries(
          Object.entries(error.fieldErrors).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        ),
      };
    }
    return {
      status: null,
      message: 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.',
      fieldErrors: {},
    };
  }
  const status = error.response?.status ?? null;
  const data = error.response?.data;
  const fieldErrors: Record<string, string> = {};
  if (status === 400 && isRecord(data) && isRecord(data.fieldErrors)) {
    for (const [field, message] of Object.entries(data.fieldErrors)) {
      if (typeof message === 'string') fieldErrors[field] = message;
    }
  }
  let message = 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  if (status === null) message = 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  else if (status >= 500) message = 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.';
  else if (status === 401) message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
  else if (status === 403)
    message = 'Yêu cầu không được chấp nhận. Vui lòng thử lại hoặc kiểm tra quyền truy cập.';
  else if (status === 409) message = 'Thông tin đã tồn tại hoặc xung đột với dữ liệu hiện tại.';
  else if (status === 429) message = 'Bạn gửi yêu cầu quá nhanh. Vui lòng chờ rồi thử lại.';
  else if (status === 400 && isRecord(data) && typeof data.message === 'string') {
    message =
      data.message === 'Validation failed'
        ? 'Vui lòng kiểm tra các trường thông tin.'
        : data.message === 'Invalid or expired verification code'
          ? 'Mã xác thực không đúng hoặc đã hết hạn.'
          : data.message.trim() || 'Thông tin không hợp lệ. Vui lòng kiểm tra và thử lại.';
  }
  if (
    (status === 404 || status === 409) &&
    isRecord(data) &&
    typeof data.message === 'string' &&
    data.message.trim()
  ) {
    message = data.message;
  }
  return { status, message, fieldErrors };
}

export function getApiErrorMessage(error: unknown) {
  return getApiError(error).message;
}
