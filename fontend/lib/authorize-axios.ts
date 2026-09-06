import axios from 'axios';

// Khởi tạo một đối tượng axios (authorizeAxiosIntance) mục đích để custom và cấu hình chung cho dự án
let authorizeAxiosIntance = axios.create();
// Thời gian tối đa của 1 request: để 10 phút
authorizeAxiosIntance.defaults.timeout = 1000 * 60 * 10; // api bị lỗi sau 10" thì sẽ ngắt
// withCredentials: sẽ cho phép axios tự động gửi cookie trong mỗi request lêb be (phục vụ việc chúng ta sẽ lưu jwt tokens (refresh & access) vào trong httpOnly Cookie của trình duyệt)
authorizeAxiosIntance.defaults.withCredentials = true;

export default authorizeAxiosIntance;
