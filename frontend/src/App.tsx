import React from "react";
import { Provider } from "react-redux";
import { store } from "./stores";
import AppRouter from "./routers/AppRouter";
import { NotificationProvider } from "./providers/NotificationProvider";

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
    </Provider>
  );
};

export default App;
