import React from "react";

export const App: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400">
          Bán Hàng Việt
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Dự án Boilerplate đã được cấu hình thành công theo tiêu chuẩn!
        </p>
      </div>
    </div>
  );
};

export default App;
