import React from "react";
import { Provider } from "react-redux";
import { store } from "./stores";
import AppRouter from "./routers/AppRouter";

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
